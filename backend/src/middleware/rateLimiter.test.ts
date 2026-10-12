import { test } from 'node:test';
import assert from 'node:assert';
import { createRateLimiter } from './rateLimiter';
import type { Request, Response, NextFunction } from 'express';

function mockReq(ip: string = '127.0.0.1'): Request {
  return {
    ip,
    headers: {},
    socket: { remoteAddress: ip },
  } as unknown as Request;
}

function mockRes(): { res: Response; statusCode: number; jsonBody: any; headers: Record<string, string> } {
  const result = {
    statusCode: 200,
    jsonBody: null as any,
    headers: {} as Record<string, string>,
    res: {} as Response,
  };

  result.res = {
    status(code: number) {
      result.statusCode = code;
      return this;
    },
    json(data: any) {
      result.jsonBody = data;
      return this;
    },
    setHeader(name: string, value: string) {
      result.headers[name] = value;
      return this;
    },
  } as unknown as Response;

  return result;
}

test('createRateLimiter: allows requests within the limit', () => {
  const limiter = createRateLimiter({
    windowMs: 1000,
    max: 3,
  });

  const req = mockReq('192.168.1.100');
  let nextCalled = 0;
  const next: NextFunction = () => {
    nextCalled++;
  };

  const { res: res1 } = mockRes();
  limiter(req, res1, next);
  assert.strictEqual(nextCalled, 1);

  const { res: res2 } = mockRes();
  limiter(req, res2, next);
  assert.strictEqual(nextCalled, 2);

  const { res: res3 } = mockRes();
  limiter(req, res3, next);
  assert.strictEqual(nextCalled, 3);
});

test('createRateLimiter: blocks requests exceeding limit with HTTP 429 and Retry-After', () => {
  const limiter = createRateLimiter({
    windowMs: 5000,
    max: 2,
    message: 'Too many attempts',
  });

  const req = mockReq('192.168.1.200');
  let nextCalled = 0;
  const next: NextFunction = () => {
    nextCalled++;
  };

  // 1st request -> OK
  limiter(req, mockRes().res, next);
  // 2nd request -> OK
  limiter(req, mockRes().res, next);
  assert.strictEqual(nextCalled, 2);

  // 3rd request -> Blocked with 429
  const mock3 = mockRes();
  limiter(req, mock3.res, next);

  assert.strictEqual(nextCalled, 2, 'next() must NOT be called on blocked request');
  assert.strictEqual(mock3.statusCode, 429);
  assert.strictEqual(mock3.jsonBody.error, 'Too many attempts');
  assert.ok(mock3.headers['Retry-After'], 'Retry-After header must be set');
});

test('createRateLimiter: resets count after window expires', async () => {
  const limiter = createRateLimiter({
    windowMs: 50,
    max: 1,
  });

  const req = mockReq('192.168.1.300');
  let nextCalled = 0;
  const next: NextFunction = () => {
    nextCalled++;
  };

  limiter(req, mockRes().res, next);
  assert.strictEqual(nextCalled, 1);

  // Exceeded
  limiter(req, mockRes().res, next);
  assert.strictEqual(nextCalled, 1);

  // Wait for window to expire
  await new Promise((resolve) => setTimeout(resolve, 60));

  // Should be allowed again
  limiter(req, mockRes().res, next);
  assert.strictEqual(nextCalled, 2);
});
