import { HenryScheinScrapingExercises } from '@src/exercises/HenryScheinScrapingExercises';
import { bufferToString } from '@src/support/utils';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('HenryScheinScrapingExercises', () => {
  describe('scrapeProductPageUrl', () => {
    it('returns the correct result for exercise 001', async () => {
      await expect(
        new HenryScheinScrapingExercises().scrapeProductPageUrl(
          'https://www.henryschein.com/us-en/dental/p/crown-bridge/crowns-temporary-core-materials/acero-zrcna-crn-prim-2nd-molr/1436934',
        ),
      ).resolves.toEqual(
        JSON.parse(
          bufferToString(readFileSync(join(__dirname, '__fixtures__', 'henryScheinScrapingExercise001.json'))),
        ),
      );
    });

    it('returns the correct result for exercise 002', async () => {
      await expect(
        new HenryScheinScrapingExercises().scrapeProductPageUrl(
          'https://www.henryschein.com/us-en/dental/p/burs-diamonds/carbide-burs/carbide-bur-t-f-sterile/5700954',
        ),
      ).resolves.toEqual(
        JSON.parse(
          bufferToString(readFileSync(join(__dirname, '__fixtures__', 'henryScheinScrapingExercise002.json'))),
        ),
      );
    });

    it('returns the correct result for exercise 003', async () => {
      await expect(
        new HenryScheinScrapingExercises().scrapeProductPageUrl(
          'https://www.henryschein.com/us-en/dental/p/crown-bridge/crowns-temporary-core-materials/venus-temp-2-refill/6520063',
        ),
      ).resolves.toEqual(
        JSON.parse(
          bufferToString(readFileSync(join(__dirname, '__fixtures__', 'henryScheinScrapingExercise003.json'))),
        ),
      );
    });

    it('returns the correct result for exercise 004', async () => {
      await expect(
        new HenryScheinScrapingExercises().scrapeProductPageUrl(
          'https://www.henryschein.com/us-en/dental/p/handpieces/cleaners-lubricants/pana-spray-nozzle/7860180',
        ),
      ).resolves.toEqual(
        JSON.parse(
          bufferToString(readFileSync(join(__dirname, '__fixtures__', 'henryScheinScrapingExercise004.json'))),
        ),
      );
    });
  });
});
