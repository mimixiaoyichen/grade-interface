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

const extractDomain = (raw: string, sources: string[]): string | null => {
  // try query: find something that looks like a domain
  const match = raw.match(/([a-z0-9-]+(?:\.[a-z0-9-]+)+)/i);
  if (match) return match[1].toLowerCase();

  // fallback: first source host
  for (const s of sources) {
    try {
      const url = new URL(s);
      return url.hostname.toLowerCase();
    } catch {
      continue;
    }
  }
  return null;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const query = (req.query.q as string || req.body?.q || '').trim();
  if (!query) return res.status(400).json({ error: 'query required' });

  try {
    // 1) Ask OpenAI web_search to get sources
    const response = await openai.responses.create({
      model: 'gpt-4o-mini',
      tools: [{ type: 'web_search' }],
      input: `Search the web for "${query}". Return relevant sources.`,
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

    const targetDomain = extractDomain(query, uniqueUrls);
    // 2) Fetch top few sources server-side and return cleaned content (no summary)
    const topUrls = uniqueUrls.slice(0, 5);
    const fetched = await Promise.all(topUrls.map(async (u) => {
      try {
        const resp = await fetch(u);
        if (!resp.ok) throw new Error(`Status ${resp.status}`);
        const html = await resp.text();
        const cleaned = cleanHtml(html).slice(0, 12000); // protect payload size
        const domainMention = targetDomain ? cleaned.toLowerCase().includes(targetDomain) : true;
        let isOfficial = false;
        try {
          if (targetDomain) {
            const host = new URL(u).hostname.toLowerCase();
            isOfficial = host.includes(targetDomain);
          }
        } catch {
          isOfficial = false;
        }
        if (!domainMention && !isOfficial) {
          return { url: u, title: urlTitles[u] || '', filtered: true, reason: `no mention of ${targetDomain}` };
        }
        return { url: u, title: urlTitles[u] || '', content: cleaned, isOfficial };
      } catch (e: any) {
        return { url: u, title: urlTitles[u] || '', error: e.message || 'fetch failed' };
      }
    }));

    const results = fetched.filter((r) => !r.filtered && !r.error && r.content);
    const filteredOut = fetched.filter((r) => r.filtered);
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
