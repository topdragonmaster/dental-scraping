import { Runner } from '@src/support/Runner';
import type { TProduct, TVariationProductPageUrl } from '@src/support/TProduct';
import { dump } from '@src/support/utils';
import { Command, Option } from 'nest-commander';
import cheerio from 'cheerio';
import puppeteer from 'puppeteer'

export type TOptions = {
  productPageUrl: string;
};

type TSpecs = {
  [key: string]: string;
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
    try {
      const browser = await puppeteer.launch({
        headless: false,
        args: ['--disable-http2'],
      });
      const page = await browser.newPage();
      console.log(productPageUrl)
      await page.goto(productPageUrl, { timeout: 60000 });
      const html = await page.content();
      let $ = cheerio.load(html);

      // Extract information from the HTML
      const breadcrumbsElement = $('.breadcrumbs .breadcrumbs__item');
      const category = breadcrumbsElement
        .children('a.breadcrumbs__link')
        .slice(1)
        .map((index, element) => $(element).text().toLocaleLowerCase())
        .get();
      const description = $('.product-view__description .collapse-view__container').text().trim();
      const imageUrl = 'https://midewestendal.com' + $('.product-view-media-gallery__image-item img').attr('src');
      const manufacturerName = $('.product-view__attribute-item-mfg .product-view__attribute-item-value').text().trim()
      const manufacturerSku = $('.product-view__attribute-item-mfg_part_number .product-view__attribute-item-value').text().trim();
      const name = $('h1.page-title span[itemprop="name"]').text().trim();
      const productSku = $('.product-view__attribute-item-sku .product-view__attribute-item-value').text().trim();
      const saleUnit = $('.product-view__attribute-item-contains .product-view__attribute-item-value').text().trim();
      const specs: TSpecs = {};
      const variationProductPageUrls: TVariationProductPageUrl[] = []
        const productList = await page.$$('.matrix-order-widget__grid-tbody .matrix-order-widget__grid-tbody-row');
        for (const product of productList) {
          await product.click()
          await page.waitForNavigation({ waitUntil: 'domcontentloaded' });
          const currentUrl = page.url();
          variationProductPageUrls.push(currentUrl)
          await page.goBack();

        }
      // Construct the TProduct object
      const product: TProduct = {
        category,
        description: [description],
        imageUrl,
        manufacturerName,
        manufacturerSku,
        name,
        productPageUrl,
        productSku,
        saleUnit,
        specs,
        variationProductPageUrls
      };

      return product;
    } catch (error) {
      console.error('Error scraping product page:', error);
      throw error;
    }
  }
}
