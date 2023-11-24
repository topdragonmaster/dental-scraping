import { DatabaseService } from '@src/support/DatabaseService';
import {
  bufferToString,
  ensureArray,
  ensureBoolean,
  ensureNotEmptyString,
  ensureNumber,
  ensureObject,
  ensureString,
  httpRequest,
  parseHtml,
} from '@src/support/utils';
import { get } from 'lodash';
import { encode } from 'querystring';
import type { Cookie } from 'tough-cookie';
import { CookieJar } from 'tough-cookie';

describe('utils', () => {
  describe('httpRequest', () => {
    it('provides example for get', async () => {
      // This API echoes any query string parameters into the response body.
      const resp = await httpRequest({
        method: 'get',
        url: 'https://postman-echo.com/get',
        params: {
          key: 'value',
        },
      });

      // Verify that the request
      expect(resp.status).toEqual(200);
      const body = ensureObject(JSON.parse(bufferToString(resp.data)));
      expect(get(body, 'args.key')).toEqual('value');
    });

    it('provides example for post form', async () => {
      // This API echoes any form parameters into the response body.
      const resp = await httpRequest({
        method: 'post',
        url: 'https://postman-echo.com/post',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        data: encode({
          key: 'value',
        }),
      });

      // Verify that the request was successful.
      expect(resp.status).toEqual(200);
      const body = ensureObject(JSON.parse(bufferToString(resp.data)));
      expect(get(body, 'form.key')).toEqual('value');
    });

    it('provides example for cookies', async () => {
      const cookieJar = new CookieJar();

      // This API sets any query string parameters as cookies.
      const resp1 = await httpRequest({
        method: 'get',
        url: 'https://postman-echo.com/cookies/set',
        params: {
          key: 'value',
        },
        cookieJar,
      });

      // Verify that the request was successful.
      expect(resp1.status).toEqual(200);
      const body1 = ensureObject(JSON.parse(bufferToString(resp1.data)));
      expect(get(body1, 'cookies.key')).toEqual('value');

      // Verify that our cookie is in the jar.
      expect(
        cookieJar.getCookiesSync('https://postman-echo.com/cookies/set').find((c) => c.key === 'key'),
      ).toMatchObject<Partial<Cookie>>({
        domain: 'postman-echo.com',
        key: 'key',
        value: 'value',
      });

      // This API echoes any cookies from the request into the response body.
      const resp2 = await httpRequest({
        method: 'get',
        url: 'https://postman-echo.com/cookies',
        cookieJar,
      });

      // Verify that the cookie was sent.
      expect(resp2.status).toEqual(200);
      const body2 = ensureObject(JSON.parse(bufferToString(resp2.data)));
      expect(get(body2, 'cookies.key')).toEqual('value');
    });
  });

  describe('parseHtml', () => {
    it('provides example', () => {
      const $ = parseHtml(Buffer.from('<html lang="en"><body><h1>Title</h1></body></html>'));
      expect($('h1').text().trim()).toEqual('Title');
    });
  });

  describe('type assertions', () => {
    it('provide examples', () => {
      expect(ensureString('hello')).toEqual('hello');
      expect(() => ensureString(10)).toThrow('Not a string.');

      expect(ensureNotEmptyString('hello')).toEqual('hello');
      expect(() => ensureNotEmptyString('')).toThrow('Not a non-empty string.');
      expect(() => ensureNotEmptyString(true)).toThrow('Not a string.');

      expect(ensureNumber(10)).toEqual(10);
      expect(() => ensureNumber('')).toThrow('Not a number.');
      expect(() => ensureNumber(NaN)).toThrow('Not a number.');
      expect(() => ensureNumber(Infinity)).toThrow('Not a number.');

      expect(ensureBoolean(true)).toEqual(true);
      expect(() => ensureBoolean('')).toThrow('Not a boolean.');
      expect(() => ensureBoolean(null)).toThrow('Not a boolean.');

      expect(ensureObject({})).toEqual({});
      expect(() => ensureObject(10)).toThrow('Not an object.');
      expect(() => ensureObject([])).toThrow('Not an object.');
      expect(() => ensureObject(undefined)).toThrow('Not an object.');

      expect(ensureArray([])).toEqual([]);
      expect(() => ensureArray({})).toThrow('Not an array.');
      expect(() => ensureArray('')).toThrow('Not an array.');
    });
  });

  describe('DatabaseService', () => {
    it('provides examples', async () => {
      type TRow = {
        id: string;
        n: string;
      };

      const dbSvc = await DatabaseService.newInstance();

      try {
        await expect(
          dbSvc.db.all<TRow[]>(`
            SELECT id, name AS n FROM companies ORDER BY name, id LIMIT 3
        `),
        ).resolves.toEqual<TRow[]>([
          { id: '66ed41e3-a616-46c1-bd38-0cd34b345425', n: 'Altenwerth, Lang and Abshire' },
          { id: 'b19e8049-3631-49bf-a3f1-7756ed60e746', n: 'Beier Inc' },
          { id: '35e216f5-83b6-48f1-8b66-bf629240b8ef', n: 'Bogisich, McClure and Hessel' },
        ]);
      } finally {
        await dbSvc.onApplicationShutdown();
      }
    });
  });
});
