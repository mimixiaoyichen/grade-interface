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
  const url = (req.query.url as string || '').trim();
  if (!url) return res.status(400).json({ error: 'url required' });

  try {
    const pageResp = await fetch(url);
    if (!pageResp.ok) {
      return res.status(502).json({ error: `Fetch failed: ${pageResp.status} ${pageResp.statusText}` });
    }
    const rawHtml = await pageResp.text();
    const cleaned = cleanHtml(rawHtml);
    const truncated = cleaned.slice(0, 6000);

    const summaryResp = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You summarize public website content succinctly with key facts and customer/problem context.' },
        { role: 'user', content: `URL: ${url}\n\nContent (truncated):\n${truncated}\n\nSummarize product/service, target customer, value props, and problem statement.` }
      ],
      max_tokens: 400
    });

    const summary = summaryResp.choices?.[0]?.message?.content || 'No summary generated.';

    res.status(200).json({
      summary,
      cleaned,
      sourceUrl: url
    });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e.message || 'Internal error' });
  }
}
