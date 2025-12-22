import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const cleanHtml = (html: string): string => {
  const withoutScripts = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '');
  const textOnly = withoutScripts.replace(/<\/?[^>]+(>|$)/g, '\n');
  return textOnly
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 2)
    .join('\n')
    .trim();
};

const extractDomainFromString = (raw: string): string | null => {
  // find something that looks like a domain
  const match = raw.match(/([a-z0-9-]+(?:\.[a-z0-9-]+)+)/i);
  if (match) return match[1].toLowerCase();
  return null;
};

const buildBrandTokens = (domain: string | null): string[] => {
  if (!domain) return [];
  const host = domain.replace(/^www\./, '');
  const parts = host.split('.');
  const root = parts.length > 1 ? parts[parts.length - 2] : parts[0];
  return root.split('-').filter(Boolean).map((p) => p.toLowerCase());
};

const looksLikeTarget = (
  content: string,
  title: string,
  url: string,
  host: string | null,
  targetDomain: string | null,
  brandTokens: string[],
  originalQuery: string,
  mentionsDomainInHtml: boolean
) => {
  const haystacks = [
    content.toLowerCase(),
    title.toLowerCase(),
    url.toLowerCase(),
    originalQuery.toLowerCase(),
    host?.toLowerCase() || '',
  ];

  if (targetDomain) {
    const hostIsSimilar = host ? host.replace(/^www\./, '').includes(targetDomain) : false;
    const mentionsDomain = mentionsDomainInHtml || haystacks.some((h) => h.includes(targetDomain)) || hostIsSimilar;
    if (!mentionsDomain) return false; // if domain not mentioned anywhere, drop it
    return true;
  }

  if (brandTokens.length > 0 && haystacks.some((h) => brandTokens.some((t) => h.includes(t)))) return true;
  return false;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const query = (req.query.q as string || req.body?.q || '').trim();
  if (!query) return res.status(400).json({ error: 'query required' });

  // If the input looks like a domain or URL, expand it into a richer search query
  const looksLikeDomain = /[a-z0-9-]+\.[a-z]{2,}/i.test(query);
  const searchQuery = looksLikeDomain
    ? `Find third-party articles, reviews, press, docs, or blog posts about "${query}". Include news, funding, product pages, case studies, and avoid limiting to the official site.`
    : query;

  try {
    // 1) Ask OpenAI web_search to get sources
    const response = await openai.responses.create({
      model: 'gpt-4o-mini',
      tools: [{ type: 'web_search' }],
      input: `Search the web for "${searchQuery}". Return relevant sources across multiple domains, not just the official site.`,
      include: ['web_search_call.action.sources']
    });

    const sources =
      ((response as any).output || [])
        .find((item: any) => item.type === 'web_search_call')
        ?.action?.sources || [];

    const uniqueUrls: string[] = [];
    const urlTitles: Record<string, string> = {};

    sources.forEach((s: any) => {
      const u = s.url || s.uri;
      if (u && !uniqueUrls.includes(u)) {
        uniqueUrls.push(u);
        urlTitles[u] = s.title || '';
      }
    });

    const targetDomain = looksLikeDomain ? extractDomainFromString(query) : null;
    const brandTokens = buildBrandTokens(targetDomain);
    // 2) Fetch top sources server-side and return cleaned content (no summary)
    const topUrls = uniqueUrls.slice(0, 10);
    const fetched = await Promise.all(topUrls.map(async (u) => {
      try {
        const resp = await fetch(u);
        if (!resp.ok) throw new Error(`Status ${resp.status}`);
        const html = await resp.text();
        const cleaned = cleanHtml(html).slice(0, 12000); // protect payload size
        const mentionsDomainInHtml = targetDomain ? html.toLowerCase().includes(targetDomain) : false;
        let isOfficial = false;
        let host: string | null = null;
        try {
          if (targetDomain) {
            host = new URL(u).hostname.toLowerCase();
            isOfficial = host.includes(targetDomain);
          }
        } catch {
          isOfficial = false;
        }
        return { url: u, title: urlTitles[u] || '', content: cleaned, isOfficial, mentionsDomainInHtml, host };
      } catch (e: any) {
        return { url: u, title: urlTitles[u] || '', error: e.message || 'fetch failed' };
      }
    }));

    const allResults = fetched.filter((r) => !r.error && r.content);
    const filteredOut: any[] = [];

    const results = allResults.filter((r) => {
      if (r.isOfficial) return true; // always keep official sources

      const matches = looksLikeTarget(
        r.content,
        r.title || '',
        r.url,
        r.host || null,
        targetDomain,
        brandTokens,
        query,
        r.mentionsDomainInHtml
      );

      if (!matches) {
        filteredOut.push({ url: r.url, title: r.title, reason: 'No mention of target domain/brand in content or HTML' });
        return false;
      }
      return true;
    });

    // If we still have too few, fall back to including any that had content regardless of filtering (already done).
    const errored = fetched.filter((r) => r.error);

    res.status(200).json({
      query,
      sources: topUrls,
      targetDomain,
      results,
      filteredOut,
      errored
    });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e.message || 'Internal error' });
  }
}
