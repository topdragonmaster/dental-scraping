import { Runner } from '@src/support/Runner';
import type { TProduct } from '@src/support/TProduct';
import { dump, ensureNotEmptyString, httpRequest, parseHtml } from '@src/support/utils';
import assert from 'assert';
import type { CheerioAPI } from 'cheerio';
import * as crypto from 'crypto';
import { Command, Option } from 'nest-commander';
import { CookieJar } from 'tough-cookie';

export type TOptions = {
  productPageUrl: string;
};

@Command({
  name: 'midwest-dental-scraping',
})
export class MidwestDentalScrapingExercises extends Runner<TOptions> {
  @Option({
    flags: '--productPageUrl <string>',
    description: 'Midwest Dental product page URL to scrape.',
    required: true,
  })
  public parseProductPageUrl(value: string): string {
    return value;
  }

  public override async doRun(options: TOptions): Promise<void> {
    console.log(dump(await this.scrapeProductPageUrl(options.productPageUrl)));
  }

  /**
   * Scrapes a product page URL on the Midwest Dental (https://midwestdental.com) website, parsing the corresponding
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
    const $ = await this.initProductPage(productPageUrl, cookieJar);

    return {
      productPageUrl,
      productSku: this.parseProductSku($),
      manufacturerName: this.parseManufacturerName($),
      manufacturerSku: this.parseManufacturerSku($),
      name: this.parseName($),
      saleUnit: this.parseSaleUnit($),
      category: this.parseCategory($),
      description: [this.parseDescription($)],
      specs: {},
      imageUrl: this.parseImageUrl($),
      variationProductPageUrls: this.parseVariationProductPageUrls($),
    };
  }

  private async initCookieJar(): Promise<CookieJar> {
    const tempCookieJar = new CookieJar();
    const cookieJar = new CookieJar();

    const resp = await httpRequest({
      method: 'get',
      url: 'https://midwestdental.com',
      cookieJar: tempCookieJar,
    });

    cookieJar.setCookieSync(ensureNotEmptyString(this.parseCookie(parseHtml(resp.data))), 'https://midwestdental.com');

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

  private parseCookie($: CheerioAPI): string {
    let cookie: string | null = null;

    $('script').each((i, iEl) => {
      const scriptContent = $(iEl).text();

      const aMatch = scriptContent.match(/a=toNumbers\("([a-f\d]+)"\)/);
      const bMatch = scriptContent.match(/b=toNumbers\("([a-f\d]+)"\)/);
      const cMatch = scriptContent.match(/c=toNumbers\("([a-f\d]+)"\)/);

      if (aMatch?.[1] !== undefined && bMatch?.[1] !== undefined && cMatch?.[1] !== undefined) {
        const decipher = crypto
          .createDecipheriv('aes-128-cbc', Buffer.from(aMatch[1], 'hex'), Buffer.from(bMatch[1], 'hex'))
          .setAutoPadding(false);

        const decrypted = Buffer.concat([decipher.update(Buffer.from(cMatch[1], 'hex')), decipher.final()]);
        cookie = `OCXS=${decrypted.toString('hex')}`;
      }
    });

    return ensureNotEmptyString(cookie);
  }

  private parseProductSku($: CheerioAPI): string {
    return ensureNotEmptyString(
      $('div.product-view__attribute-item-sku > span.product-view__attribute-item-value[itemprop=sku]').text().trim(),
    );
  }

  private parseManufacturerName($: CheerioAPI): string | null {
    const maybeManufacturerName = $(
      'div.product-view__attribute-item-mfg > span.product-view__attribute-item-value[itemprop=mfg]',
    )
      .text()
      .trim();

    return maybeManufacturerName !== '' ? maybeManufacturerName : null;
  }

  private parseManufacturerSku($: CheerioAPI): string | null {
    const maybeManufacturerSku = $(
      'div.product-view__attribute-item-mfg_part_number > span.product-view__attribute-item-value[itemprop=mfg_part_number]',
    )
      .text()
      .trim();

    return maybeManufacturerSku !== '' ? maybeManufacturerSku : null;
  }

  private parseName($: CheerioAPI): string {
    return ensureNotEmptyString($('h1 > span[itemprop=name]').text().trim());
  }

  private parseSaleUnit($: CheerioAPI): string | null {
    const maybeSaleUnit = $('div.product-view__attribute-item-contains > span.product-view__attribute-item-value')
      .text()
      .trim();

    return maybeSaleUnit !== '' && !maybeSaleUnit.includes('Please see description') ? maybeSaleUnit : null;
  }

  private parseImageUrl($: CheerioAPI): string {
    return `https://midewestendal.com${ensureNotEmptyString(
      $('div.product-view-media-gallery__image-item picture > img').attr('src')?.trim(),
    )}`;
  }

  private parseCategory($: CheerioAPI): string[] {
    const category: string[] = [];

    $('span.breadcrumbs__item > a').each((i, iEl) => {
      if (i > 0) {
        category.push(ensureNotEmptyString($(iEl).text().trim().toLowerCase()));
      }
    });

    if (category[0] === 'Categories') {
      category.shift();
    }

    if (category.length === 0) {
      category.push('Uncategorized');
    }

    return category;
  }

  private parseDescription($: CheerioAPI): string {
    return ensureNotEmptyString(
      $('div.product-view__content div.product-view__description--configurable').last().text().trim(),
    );
  }

  private parseVariationProductPageUrls($: CheerioAPI): string[] {
    const variationProductPageUrls: string[] = [];

    $('select[name=oro_lab_product_variants_select] option:not([selected])').each((i, iEl) => {
      variationProductPageUrls.push(`https://midwestdental.com${ensureNotEmptyString($(iEl).data('url'))}`);
    });

    return variationProductPageUrls;
  }
}