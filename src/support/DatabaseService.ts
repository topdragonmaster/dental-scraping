import type { FactoryProvider, OnApplicationShutdown } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import assert from 'assert';
import { get } from 'lodash';
import { join, resolve } from 'path';
import { Database, open } from 'sqlite';
import { Database as DatabaseDriver, OPEN_READONLY } from 'sqlite3';

@Injectable()
export class DatabaseService implements OnApplicationShutdown {
  public static readonly FACTORY: FactoryProvider = {
    provide: DatabaseService,
    useFactory: DatabaseService.newInstance,
  };

  private constructor(public readonly db: Database) {
    // intentionally empty
  }

  public async onApplicationShutdown(): Promise<void> {
    await this.db.close();
  }

  public static async newInstance(this: void): Promise<DatabaseService> {
    const db = await open({
      filename: resolve(join(__dirname, 'store.db')),
      driver: DatabaseDriver,
      mode: OPEN_READONLY,
    });

    const res = await db.get<{ ping: string }>('SELECT "pong" AS ping');
    assert(get(res, 'ping') === 'pong');

    return new DatabaseService(db);
  }
}
