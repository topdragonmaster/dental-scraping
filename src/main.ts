import { Module } from '@nestjs/common';
import { DatabaseExercises } from '@src/exercises/DatabaseExercises';
import { HenryScheinScrapingExercises } from '@src/exercises/HenryScheinScrapingExercises';
import { MidwestDentalScrapingExercises } from '@src/exercises/MidwestDentalScrapingExercises';
import { DatabaseService } from '@src/support/DatabaseService';
import { CommandFactory } from 'nest-commander';

@Module({
  providers: [DatabaseService.FACTORY, DatabaseExercises, HenryScheinScrapingExercises, MidwestDentalScrapingExercises],
})
class AppModule {}

void (async (): Promise<void> => {
  await CommandFactory.run(AppModule, ['error', 'warn']);
})();
