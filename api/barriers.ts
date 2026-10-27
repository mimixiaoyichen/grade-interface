import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getOpenAI, callJsonSchema, languageMessages, languageHint, type LocaleOption, type JsonSchema } from './_openai';
import { BARRIER_SELECTOR_PROMPT } from '../prompts/barrierSelector';

const barrierSelectorSchema: JsonSchema = {
  type: 'object',
  properties: {
    SPECIFIC_BARRIERS: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 4 }
  },
  required: ['SPECIFIC_BARRIERS'],
  additionalProperties: false
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { baseline, publicInfo, locale = 'en' } = req.body || {};
  if (!baseline) return res.status(400).json({ error: 'baseline required' });

  const baselineStr = JSON.stringify(baseline, null, 2);
  const openai = getOpenAI();
  try {
    const result: any = await callJsonSchema(
      openai,
      [
        ...languageMessages(locale as LocaleOption),
        { role: 'system', content: BARRIER_SELECTOR_PROMPT },
        { role: 'user', content: `BASELINE STATEMENT:\n${baselineStr}\n\nSOURCE MATERIAL:\n${publicInfo || 'No public context provided.'}${languageHint(locale as LocaleOption)}` }
      ],
      'barrier_selector_schema',
      barrierSelectorSchema,
      0.2
    );
    return res.status(200).json({ SPECIFIC_BARRIERS: result.SPECIFIC_BARRIERS || [] });
  } catch (e: any) {
    return res.status(500).json({ error: e.message || 'Barrier selection failed' });
  }
}
