import { DatabaseExercises } from '@src/exercises/DatabaseExercises';
import { DatabaseService } from '@src/support/DatabaseService';
import { bufferToString } from '@src/support/utils';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('DatabaseExercises', () => {
  describe('exercise001', () => {
    it('returns the correct result', async () => {
      const dbSvc = await DatabaseService.newInstance();

      try {
        await expect(new DatabaseExercises(dbSvc).exercise001()).resolves.toEqual(
          JSON.parse(bufferToString(readFileSync(join(__dirname, '__fixtures__', 'databaseExercise001.json')))),
        );
      } finally {
        await dbSvc.onApplicationShutdown();
      }
    });
  });

  describe('exercise002', () => {
    it('returns the correct result', async () => {
      const dbSvc = await DatabaseService.newInstance();

      try {
        await expect(new DatabaseExercises(dbSvc).exercise002()).resolves.toEqual(
          JSON.parse(bufferToString(readFileSync(join(__dirname, '__fixtures__', 'databaseExercise002.json')))),
        );
      } finally {
        await dbSvc.onApplicationShutdown();
      }
    });
  });

  describe('exercise003', () => {
    it('returns the correct result', async () => {
      const dbSvc = await DatabaseService.newInstance();

      try {
        await expect(new DatabaseExercises(dbSvc).exercise003()).resolves.toEqual(
          JSON.parse(bufferToString(readFileSync(join(__dirname, '__fixtures__', 'databaseExercise003.json')))),
        );
      } finally {
        await dbSvc.onApplicationShutdown();
      }
    });
  });

  describe('exercise004', () => {
    it('returns the correct result', async () => {
      const dbSvc = await DatabaseService.newInstance();

      try {
        await expect(new DatabaseExercises(dbSvc).exercise004()).resolves.toEqual(
          JSON.parse(bufferToString(readFileSync(join(__dirname, '__fixtures__', 'databaseExercise004.json')))),
        );
      } finally {
        await dbSvc.onApplicationShutdown();
      }
    });
  });
});
