import { Runner } from '@src/support/Runner';
import type { TProduct } from '@src/support/TProduct';
import { dump } from '@src/support/utils';
import { Command, Option } from 'nest-commander';

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
    throw new Error(`Requested ${productPageUrl}, not implemented.`);
  }
}
