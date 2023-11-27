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
      const category = $('.small-above .field:contains("Category:") + .value span').map((_, el) => $(el).text().trim()).get();
      const description = $('.customer-notes .field:contains("Description:") + .value').text().trim();
      const imageUrl =  $('.hs-product-slideshow img').attr('src') === '/us-en/images/shared/imageNotAvailable_600x600.png'
        ? null
        : 'https://www.henryschein.com' + $('.hs-product-slideshow img').attr('src');
      const manufacturerName = $('.product-title small').text().trim().split('|')[1]?.split('-')[0]?.trim().replace(',', '');
      const manufacturerSku = $('.product-title small').text().trim().split('|')[1]?.split('\n')[3]?.trim();
      const name = $('.product-title').text().trim().split('\n')[0];
      const productSku = $('.product-title small').text().trim().split('|')[0]?.trim();
      let saleUnit = '';

      // Extract specs information
      const specElList = $('ul.attr-list li');

      // Create an array to store the result objects
      const specs: TSpecs = {};

      // Iterate over each li element to extract field and value
      specElList.each((index, listItem) => {
        const field = $(listItem).find('.field').text().trim();
        const value = $(listItem).find('.value').text().trim();

        specs[field] = value
        if (field === 'Quantity') {
          saleUnit = value
        }
      });

      const variationElement = await page.$('#product-tuples h1');
      const variationProductPageUrls: TVariationProductPageUrl[] = []
      if (variationElement) {
        await variationElement.click()
        await page.waitForTimeout(4000);
        // viewmore Acitons element
        const viewMoreElement = await page.$('#product-tuples .actions-review a')
        if(viewMoreElement) {
          await viewMoreElement.click()
          await page.waitForTimeout(4000);
        }
  
        const updatedHTML = await page.content();
        
        // Use Cheerio to parse the updated HTML content
        $ = cheerio.load(updatedHTML);
        const productList = $('ul#ajax-variation-rows > li');
        productList.each((_, product) => {
          const linkElement = $(product).find('h2.product-name a')
          const href = linkElement.attr('href');
          variationProductPageUrls.push(href)
        })
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
