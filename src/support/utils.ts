import assert from 'assert';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import axios from 'axios';
import type { CheerioAPI } from 'cheerio';
import { load } from 'cheerio';
import { HttpCookieAgent, HttpsCookieAgent } from 'http-cookie-agent/http';
import { omit, pick } from 'lodash';
import type { Readable } from 'stream';
import type { CookieJar } from 'tough-cookie';
import { TextDecoder, inspect } from 'util';

export function dump(value: unknown): string {
  return inspect(value, {
    breakLength: 120,
    colors: true,
    depth: null,
    maxArrayLength: null,
    maxStringLength: null,
    showHidden: true,
    sorted: true,
  });
}

export type THttpRequest<T> = Pick<
  AxiosRequestConfig<T>,
  'beforeRedirect' | 'data' | 'headers' | 'httpAgent' | 'httpsAgent' | 'maxRedirects' | 'method' | 'params' | 'url'
> & {
  cookieJar?: CookieJar;
};

export type THttpResponse = Pick<AxiosResponse<ArrayBuffer>, 'data' | 'headers' | 'status'>;

export async function httpRequest<T>(config: THttpRequest<T>): Promise<THttpResponse> {
  return pick(
    await axios.request<Readable, AxiosResponse<ArrayBuffer, T>, T>({
      ...omit(config, 'cookieJar'),
      ...(config.cookieJar !== undefined
        ? {
            httpAgent: new HttpCookieAgent({ cookies: { jar: config.cookieJar } }),
            httpsAgent: new HttpsCookieAgent({ cookies: { jar: config.cookieJar } }),
          }
        : undefined),
      responseType: 'arraybuffer',
      validateStatus: () => true,
    }),
    'data',
    'headers',
    'status',
  );
}

export function bufferToString(buf: ArrayBuffer, encoding = 'utf8'): string {
  return new TextDecoder(encoding, { fatal: true }).decode(buf);
}

export function parseHtml(buf: ArrayBuffer | Buffer): CheerioAPI {
  return load(Buffer.from(buf));
}

export function ensureString(value: unknown): string {
  assert(typeof value === 'string', 'Not a string.');
  return value;
}

export function ensureNotEmptyString(value: unknown): string {
  const s = ensureString(value);
  assert(s !== '', 'Not a non-empty string.');
  return s;
}

export function ensureNumber(value: unknown): number {
  assert(typeof value === 'number' && !Number.isNaN(value) && Number.isFinite(value), 'Not a number.');
  return value;
}

export function ensureBoolean(value: unknown): boolean {
  assert(typeof value === 'boolean', 'Not a boolean.');
  return value;
}

export function ensureObject(value: unknown): object {
  assert(value !== undefined && value !== null && value.constructor === Object, 'Not an object.');
  return value;
}

export function ensureArray(value: unknown): unknown[] {
  assert(Array.isArray(value), 'Not an array.');
  return value;
}
