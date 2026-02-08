import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const cleanHtml = (html: string): string => {
  // Crude tag strip for summary purposes; avoids extra deps
  const withoutScripts = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '');
  const textOnly = withoutScripts.replace(/<\/?[^>]+(>|$)/g, '\n');
  return textOnly
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 2)
    .join('\n')
    .trim();
};

const MAX_OFFICIAL_PAGES = 10;
const MAX_PAGE_CHARS = 8000;
const DISALLOWED_PATH_SNIPPETS = ['/blog', '/docs', '/pricing'];

const normalizeUrl = (raw: string) => {
  try {
    const url = new URL(raw);
    url.hash = '';
    // Drop tracking params but keep meaningful query params if any
    const params = new URLSearchParams(url.search);
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach((k) => params.delete(k));
    url.search = params.toString() ? `?${params.toString()}` : '';
    return url.toString();
  } catch {
    return raw;
  }
};

const isDisallowedPath = (url: URL) => {
  const path = url.pathname.toLowerCase();
  return DISALLOWED_PATH_SNIPPETS.some((snippet) => path.includes(snippet));
};

const extractLinks = (html: string, baseUrl: string) => {
  const links: string[] = [];
  const regex = /href\s*=\s*["']([^"']+)["']/gi;
  let match: RegExpExecArray | null = null;
  while ((match = regex.exec(html)) !== null) {
    const href = (match[1] || '').trim();
    if (!href || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) continue;
    try {
      const resolved = new URL(href, baseUrl);
      links.push(normalizeUrl(resolved.toString()));
    } catch {
      // ignore bad urls
    }
  }
  return links;
};

const extractSitemapUrls = (xml: string) => {
  const urls: string[] = [];
  const regex = /<loc>([^<]+)<\/loc>/gi;
  let match: RegExpExecArray | null = null;
  while ((match = regex.exec(xml)) !== null) {
    const loc = (match[1] || '').trim();
    if (loc) urls.push(normalizeUrl(loc));
  }
  return urls;
};

const fetchHtml = async (url: string) => {
  const resp = await fetch(url, {
    headers: {
      // Some sites block default fetch UA; mimic a browser
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123 Safari/537.36',
      'accept-language': 'en-US,en;q=0.9',
    },
  });
  if (!resp.ok) throw new Error(`Fetch failed: ${resp.status} ${resp.statusText}`);
  return resp.text();
};

const crawlOfficialPages = async (startUrl: string) => {
  const start = new URL(startUrl);
  const host = start.hostname.replace(/^www\./, '');
  const seen = new Set<string>();
  const queue: string[] = [];
  const pages: Array<{ url: string; cleaned: string }> = [];

  const enqueue = (u: string) => {
    if (queue.length >= MAX_OFFICIAL_PAGES) return;
    if (seen.has(u)) return;
    seen.add(u);
    queue.push(u);
  };

  enqueue(normalizeUrl(start.toString()));

  // Try sitemap first
  const sitemapUrls: string[] = [];
  for (const path of ['/sitemap.xml', '/sitemap_index.xml']) {
    try {
      const sitemapUrl = new URL(path, start).toString();
      const xml = await fetchHtml(sitemapUrl);
      sitemapUrls.push(...extractSitemapUrls(xml));
    } catch {
      // ignore sitemap failures
    }
  }

  if (sitemapUrls.length > 0) {
    sitemapUrls
      .filter((u) => {
        try {
          const parsed = new URL(u);
          return parsed.hostname.replace(/^www\./, '') === host && !isDisallowedPath(parsed);
        } catch {
          return false;
        }
      })
      .slice(0, MAX_OFFICIAL_PAGES)
      .forEach(enqueue);
  }

  while (queue.length > 0 && pages.length < MAX_OFFICIAL_PAGES) {
    const url = queue.shift()!;
    let html = '';
    try {
      html = await fetchHtml(url);
    } catch {
      continue;
    }

    try {
      const parsed = new URL(url);
      if (parsed.hostname.replace(/^www\./, '') !== host) continue;
      if (isDisallowedPath(parsed)) continue;
    } catch {
      continue;
    }

    const cleaned = cleanHtml(html).slice(0, MAX_PAGE_CHARS);
    if (cleaned) pages.push({ url, cleaned });

    if (pages.length >= MAX_OFFICIAL_PAGES) break;

    // If no sitemap, fall back to internal link discovery
    if (sitemapUrls.length === 0) {
      const links = extractLinks(html, url);
      links.forEach((link) => {
        try {
          const parsed = new URL(link);
          if (parsed.hostname.replace(/^www\./, '') !== host) return;
          if (isDisallowedPath(parsed)) return;
          enqueue(link);
        } catch {
          // ignore
        }
      });
    }
  }

  return pages;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const raw = (req.query.url as string || '').trim();
  if (!raw) return res.status(400).json({ error: 'url required' });
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OPENAI_API_KEY is missing on the server.' });
  }

  const url = raw.startsWith('http') ? raw : `https://${raw}`;

  try {
    let pages: Array<{ url: string; cleaned: string }> = [];
    try {
      pages = await crawlOfficialPages(url);
    } catch (fetchErr: any) {
      console.error('Page fetch error:', fetchErr);
      return res.status(200).json({
        summary: `Page fetch failed: ${fetchErr?.message || 'unknown error'}. Please confirm the link is reachable and correct.`,
        cleaned: '',
        sourceUrl: url,
        error: fetchErr?.message || String(fetchErr)
      });
    }

    if (!pages.length) {
      return res.status(200).json({
        summary: `Fetch failed: no readable pages. Please confirm the link is reachable and correct.`,
        cleaned: '',
        sourceUrl: url,
        error: 'No pages retrieved'
      });
    }

    const cleaned = pages
      .map((page, idx) => `=== OFFICIAL PAGE ${idx + 1}: ${page.url} ===\n${page.cleaned}`)
      .join('\n\n');

    const truncated = cleaned.slice(0, 6000);

    let summary = 'No summary generated.';
    try {
      const summaryResp = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You summarize public website content succinctly with key facts and customer/problem context.' },
          { role: 'user', content: `URL: ${url}\n\nContent (truncated):\n${truncated}\n\nSummarize product/service, target customer, value props, and problem statement.` }
        ],
        max_tokens: 400
      });
      summary = summaryResp.choices?.[0]?.message?.content || summary;
    } catch (summaryErr: any) {
      console.error('Summary generation failed:', summaryErr);
      return res.status(200).json({
        summary: `Summary failed: ${summaryErr?.message || 'unknown error'}`,
        cleaned,
        sourceUrl: url
      });
    }

    res.status(200).json({
      summary,
      cleaned,
      sourceUrl: url
    });
  } catch (e: any) {
    console.error('fetch handler error:', e);
    res.status(200).json({
      summary: `Page fetch failed: ${e?.message || 'unknown error'}. Please confirm the link is reachable and correct.`,
      cleaned: '',
      sourceUrl: url,
      error: e?.message || 'unknown error'
    });
  }
}
