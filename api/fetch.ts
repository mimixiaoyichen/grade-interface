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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const raw = (req.query.url as string || '').trim();
  if (!raw) return res.status(400).json({ error: 'url required' });
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OPENAI_API_KEY is missing on the server.' });
  }

  const url = raw.startsWith('http') ? raw : `https://${raw}`;

  try {
    let pageResp: Response | null = null;
    try {
      pageResp = await fetch(url, {
        headers: {
          // Some sites block default fetch UA; mimic a browser
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123 Safari/537.36',
          'accept-language': 'en-US,en;q=0.9',
        },
      });
    } catch (fetchErr: any) {
      console.error('Page fetch error:', fetchErr);
      return res.status(200).json({
        summary: `Page fetch failed: ${fetchErr?.message || 'unknown error'}. Please confirm the link is reachable and correct.`,
        cleaned: '',
        sourceUrl: url,
        error: fetchErr?.message || String(fetchErr)
      });
    }

    if (!pageResp || !pageResp.ok) {
      const bodySnippet = pageResp ? await pageResp.text().then(t => t.slice(0, 200)).catch(() => '') : '';
      const message = pageResp
        ? `Fetch failed: ${pageResp.status} ${pageResp.statusText}`
        : 'Fetch failed: no response';
      return res.status(200).json({
        summary: `${message}${bodySnippet ? ` — ${bodySnippet}` : ''}. Please confirm the link is reachable and correct.`,
        cleaned: '',
        sourceUrl: url,
        error: message
      });
    }

    const rawHtml = await pageResp.text();
    const cleaned = cleanHtml(rawHtml);
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
