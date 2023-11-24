import { MidwestDentalScrapingExercises } from '@src/exercises/MidwestDentalScrapingExercises';
import { bufferToString } from '@src/support/utils';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('MidwestDentalScrapingExercises', () => {
  describe('scrapeProductPageUrl', () => {
    it('returns the correct result for exercise 001', async () => {
      await expect(
        new MidwestDentalScrapingExercises().scrapeProductPageUrl(
          'https://midwestdental.com/categories/supplies/alloy/alloy-accessories/_item/quala-amalgam-squeeze-cloths-500box-amalgma-squeeze-cloth',
        ),
      ).resolves.toEqual(
        JSON.parse(
          bufferToString(readFileSync(join(__dirname, '__fixtures__', 'midwestDentalScrapingExercise001.json'))),
        ),
      );
    });

    it('returns the correct result for exercise 002', async () => {
      await expect(
        new MidwestDentalScrapingExercises().scrapeProductPageUrl(
          'https://midwestdental.com/categories/supplies/burs-diamonds/bur-blocks-accessories/_item/22-hole-steri-guard-neon-pink',
        ),
      ).resolves.toEqual(
        JSON.parse(
          bufferToString(readFileSync(join(__dirname, '__fixtures__', 'midwestDentalScrapingExercise002.json'))),
        ),
      );
    });
  });
});
