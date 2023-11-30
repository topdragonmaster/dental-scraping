import { Runner } from '@src/support/Runner';
import type { TProduct } from '@src/support/TProduct';
import { dump, ensureNotEmptyString, ensureObject, httpRequest, parseHtml } from '@src/support/utils';
import assert from 'assert';
import type { CheerioAPI } from 'cheerio';
import { get } from 'lodash';
import { Command, Option } from 'nest-commander';
import { encode } from 'querystring';
import { CookieJar } from 'tough-cookie';

export type TOptions = {
  productPageUrl: string;
};

@Command({
  name: 'henry-schein-scraping',
})
export class HenryScheinScrapingExercises extends Runner<TOptions> {
  @Option({
    flags: '--productPageUrl <string>',
    description: 'Henry Schein product page URL to scrape.',
    required: true,
  })
  public parseProductPageUrl(value: string): string {
    return value;
  }

  public override async doRun(options: TOptions): Promise<void> {
    console.log(dump(await this.scrapeProductPageUrl(options.productPageUrl)));
  }

  /**
   * Scrapes a product page URL on the Henry Schein (https://www.henryschein.com) website, parsing the corresponding
   * product into a TProduct value.
   *
   * Note that it is possible to solve this exercise using the libraries and utilities already included in the project.
   * You may install and use additional libraries, as long as the exercise is solved by sending one or more HTTP
   * requests and parsing the responses. You are not allowed to use headless browsers or similar tools to render pages.
   *
   * @param productPageUrl Product page URL to scrape.
   */
  public async scrapeProductPageUrl(productPageUrl: string): Promise<TProduct> {
    const cookieJar = await this.initCookieJar();
    const p$ = await this.initProductPage(productPageUrl, cookieJar);

    const parentProductSku = this.parseParentProductSku(p$);
    const metadata = this.parseMetadata(p$);
    const productSku = this.parseProductSku(metadata);

    const v$ =
      parentProductSku !== null ? await this.initVariationsPage(cookieJar, parentProductSku, productSku) : null;

    return {
      productPageUrl,
      productSku,
      manufacturerName: this.parseManufacturerName(metadata),
      manufacturerSku: this.parseManufacturerSku(metadata),
      name: this.parseName(metadata),
      saleUnit: this.parseSaleUnit(p$),
      category: this.parseCategory(p$),
      description: this.parseDescription(p$, metadata),
      specs: this.parseSpecs(p$),
      imageUrl: this.parseImageUrl(metadata),
      variationProductPageUrls: v$ !== null ? this.parseVariationProductPageUrls(v$) : [],
    };
  }

  private async initCookieJar(): Promise<CookieJar> {
    const cookieJar = new CookieJar();

    const resp = await httpRequest({
      method: 'get',
      url: 'https://henryschein.com',
      cookieJar,
    });

    assert(resp.status === 200);
    return cookieJar;
  }

  private async initProductPage(productPageUrl: string, cookieJar: CookieJar): Promise<CheerioAPI> {
    const resp = await httpRequest({
      method: 'get',
      url: productPageUrl,
      cookieJar,
    });

    assert(resp.status === 200);
    return parseHtml(resp.data);
  }

  private async initVariationsPage(
    cookieJar: CookieJar,
    parentProductSku: string,
    productSku: string,
  ): Promise<CheerioAPI> {
    const resp = await httpRequest({
      method: 'post',
      url: 'https://www.henryschein.com/us-en/Shopping/Ajax/ProductVariations.ajax.aspx',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: encode({
        parentItemcode: parentProductSku,
        itemcodeToFilter: productSku,
        pageSize: '100',
        pageNumber: '0',
        showProductCompare: 'False',
      }),
      cookieJar,
    });

    assert(resp.status === 200);
    return parseHtml(resp.data);
  }

  private parseParentProductSku($: CheerioAPI): string | null {
    try {
      return ensureNotEmptyString(
        $('section#product-tuples.product-variant > h1.heading').attr('data-parent-itemcode'),
      );
    } catch {
      return null;
    }
  }

  private parseMetadata($: CheerioAPI): object {
    return ensureObject(JSON.parse($('script[type="application/ld+json"]').text().trim()));
  }

  private parseProductSku(metadata: object): string {
    return ensureNotEmptyString(get(metadata, 'sku'));
  }

  private parseManufacturerName(metadata: object): string {
    return ensureNotEmptyString(get(ensureObject(get(metadata, 'brand')), 'name'));
  }

  private parseManufacturerSku(metadata: object): string {
    return ensureNotEmptyString(get(metadata, 'mpn'));
  }

  private parseName(metadata: object): string {
    return ensureNotEmptyString(get(metadata, 'name'));
  }

  private parseSaleUnit($: CheerioAPI): string {
    return ensureNotEmptyString($('ul.product-actions div.uom-opts > span.xx-small').text().trim());
  }

  private parseImageUrl(metadata: object): string | null {
    const maybeImageUrl = ensureNotEmptyString(get(metadata, 'image'));

    return maybeImageUrl !== 'https://www.henryschein.com/us-en/images/shared/imageNotAvailable_600x600.png'
      ? maybeImageUrl
      : null;
  }

  private parseCategory($: CheerioAPI): string[] {
    const category: string[] = [];

    $('div.product-assets > ul.small-above > li').each((i, iEl) => {
      if ($(iEl).children('div.field').text().trim() === 'Category:') {
        $(iEl)
          .children('div.value')
          .children('span')
          .each((j, jEl) => {
            category.push(ensureNotEmptyString($(jEl).text().trim()));
          });
      }
    });

    assert(category.length > 0);
    return category;
  }

  private parseDescription($: CheerioAPI, metadata: object): string[] {
    const description: string[] = [ensureNotEmptyString(get(metadata, 'description'))];
    const maybeCatalogDescription = $('section.print-catalog > div.content').text().trim();

    if (maybeCatalogDescription !== '') {
      description.push(maybeCatalogDescription);
    }

    return description;
  }

  private parseSpecs($: CheerioAPI): { [key: string]: string } {
    const specs: { [key: string]: string } = {};

    $('section.product-attributes > div.content > ul.attr-list > li').each((i, iEl) => {
      const key = $(iEl).children('div.field').text().trim();
      const value = $(iEl).children('div.value').text().trim();

      if (value !== '') {
        specs[key] = value;
      }
    });

    return specs;
  }

  private parseVariationProductPageUrls($: CheerioAPI): string[] {
    const variationProductPageUrls: string[] = [];

    $('li > div.title > h2.product-name > a').each((i, iEl) => {
      variationProductPageUrls.push(ensureNotEmptyString($(iEl).attr('href')));
    });

    return variationProductPageUrls;
  }
}