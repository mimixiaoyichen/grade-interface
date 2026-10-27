import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getOpenAI, callJsonSchema, languageMessages, languageHint, type LocaleOption, type JsonSchema } from './_openai';
import { SUPPORT_CHECK_PROMPT } from '../prompts/supportCheck';

const supportCheckSchema: JsonSchema = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          text: { type: 'string' },
          type: { type: 'string', enum: ['Omission', 'Hallucination'] },
          isSupportedByPublic: { type: 'boolean' },
          publicEvidence: { type: 'string' },
          publicEvidenceContext: { type: 'string' },
          publicSupport: { type: 'string' }
        },
        required: ['id', 'text', 'type', 'isSupportedByPublic', 'publicEvidence', 'publicEvidenceContext', 'publicSupport'],
        additionalProperties: false
      }
    }
  },
  required: ['items'],
  additionalProperties: false
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { items, publicInfo, locale = 'en' } = req.body || {};
  if (!Array.isArray(items)) return res.status(400).json({ error: 'items array required' });

  const payload = items.map((item: any, idx: number) => `${idx + 1}. [${item.type}] id=${item.id} :: ${item.text}`).join('\n');
  const openai = getOpenAI();
  try {
    const result: any = await callJsonSchema(
      openai,
      [
        ...languageMessages(locale as LocaleOption),
        { role: 'system', content: SUPPORT_CHECK_PROMPT },
        { role: 'user', content: `PUBLIC INFO (truth source):\n${publicInfo || 'No public info provided.'}\n\nITEMS TO VERIFY:\n${payload}${languageHint(locale as LocaleOption)}` }
      ],
      'support_check_schema',
      supportCheckSchema,
      0.1
    );
    return res.status(200).json({ items: result.items || [] });
  } catch (e: any) {
    return res.status(500).json({ error: e.message || 'Support check failed' });
  }
}
