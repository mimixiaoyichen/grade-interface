import type { VercelRequest, VercelResponse } from '@vercel/node';
import fs from 'fs';
import path from 'path';
import {
  getOpenAI,
  callJsonSchemaWithModel,
  languageMessages,
  languageHint,
  COMPONENT_LAYER_MODEL_ID,
  type LocaleOption,
  type JsonSchema
} from './_openai';

const baselineSchema: JsonSchema = {
  type: 'object',
  properties: {
    SOLUTION: { type: 'string' },
    CUSTOMER_SEGMENT: { type: 'string' },
    LIFE_BUSINESS_CONTEXT: { type: 'string' },
    JOB_TO_BE_DONE: { type: 'string' },
    SPECIFIC_BARRIERS: { type: 'array', items: { type: 'string' } }
  },
  required: ['SOLUTION', 'CUSTOMER_SEGMENT', 'LIFE_BUSINESS_CONTEXT', 'JOB_TO_BE_DONE', 'SPECIFIC_BARRIERS'],
  additionalProperties: false
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { publicInfo, locale = 'en' } = req.body || {};
  if (!publicInfo) return res.status(400).json({ error: 'publicInfo required' });

  const baselinePrompt = fs.readFileSync(
    path.join(process.cwd(), 'prompts', 'baseline.md'),
    'utf-8'
  );
  const openai = getOpenAI();
  try {
    const result = await callJsonSchemaWithModel(
      openai,
      COMPONENT_LAYER_MODEL_ID,
      [
        ...languageMessages(locale as LocaleOption),
        { role: 'system', content: baselinePrompt },
        { role: 'user', content: `SOURCE MATERIAL:\n${publicInfo}${languageHint(locale as LocaleOption)}` }
      ],
      'baseline_schema',
      baselineSchema,
      0.2
    );
    return res.status(200).json(result);
  } catch (e: any) {
    return res.status(500).json({ error: e.message || 'Extraction failed' });
  }
}
