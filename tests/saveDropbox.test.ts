import { describe, it, expect, beforeEach, vi } from 'vitest';
import handler from '../api/saveDropbox';

const createRes = () => {
  const res: any = {};
  res.statusCode = 200;
  res.status = (code: number) => {
    res.statusCode = code;
    return res;
  };
  res.jsonData = null;
  res.json = (data: any) => {
    res.jsonData = data;
    return res;
  };
  return res;
};

describe('saveDropbox handler', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetAllMocks();
    process.env = { ...originalEnv };
  });

  it('rejects non-POST', async () => {
    const req: any = { method: 'GET' };
    const res = createRes();
    await handler(req, res);
    expect(res.statusCode).toBe(405);
    expect(res.jsonData).toHaveProperty('error');
  });

  it('fails when token missing', async () => {
    delete process.env.DROPBOX_ACCESS_TOKEN;
    const req: any = { method: 'POST', body: { filename: 'a.csv', content: 'x' } };
    const res = createRes();
    await handler(req, res);
    expect(res.statusCode).toBe(500);
    expect(res.jsonData?.error).toContain('DROPBOX_ACCESS_TOKEN');
  });

  it('uploads when token is present', async () => {
    process.env.DROPBOX_ACCESS_TOKEN = 'test-token';
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({ path_display: '/Apps/interview-data/a.csv' }),
    } as any);

    const req: any = { method: 'POST', body: { filename: 'a.csv', content: 'hello' } };
    const res = createRes();
    await handler(req, res);

    expect(fetch).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    expect(res.jsonData?.path).toBe('/Apps/interview-data/a.csv');
  });

  it('returns error on upload failure', async () => {
    process.env.DROPBOX_ACCESS_TOKEN = 'test-token';
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      text: async () => 'fail',
    } as any);

    const req: any = { method: 'POST', body: { filename: 'a.csv', content: 'hello' } };
    const res = createRes();
    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.jsonData?.error).toContain('Dropbox upload failed');
  });
});
