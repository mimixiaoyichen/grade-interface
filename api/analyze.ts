import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getOpenAI, callJsonSchema, languageMessages, languageHint, type LocaleOption, type JsonSchema } from './_openai';
import { ANALYSIS_PROMPT } from '../prompts/analysis';

const analysisItemSchema: JsonSchema = {
  type: 'object',
  properties: {
    description: { type: 'string' },
    quotes: { type: 'array', items: { type: 'string' } },
    publicEvidence: { type: 'string' },
    publicEvidenceContext: { type: 'string' },
    isSupportedByPublic: { type: 'boolean' }
  },
  required: ['description', 'quotes', 'publicEvidence', 'publicEvidenceContext', 'isSupportedByPublic'],
  additionalProperties: false
};

const analysisItemNoCtxSchema: JsonSchema = {
  type: 'object',
  properties: {
    description: { type: 'string' },
    quotes: { type: 'array', items: { type: 'string' } },
    publicEvidence: { type: 'string' },
    isSupportedByPublic: { type: 'boolean' }
  },
  required: ['description', 'quotes', 'publicEvidence', 'isSupportedByPublic'],
  additionalProperties: false
};

const analysisSchema: JsonSchema = {
  type: 'object',
  properties: {
    customers: { type: 'array', items: analysisItemSchema },
    contexts: { type: 'array', items: analysisItemNoCtxSchema },
    goals: { type: 'array', items: analysisItemNoCtxSchema },
    barriers: { type: 'array', items: analysisItemNoCtxSchema },
    finalStatement: { type: 'string' }
  },
  required: ['customers', 'contexts', 'goals', 'barriers', 'finalStatement'],
  additionalProperties: false
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { transcriptSegment, publicInfo, founderInput, locale = 'en' } = req.body || {};
  if (!transcriptSegment) return res.status(400).json({ error: 'transcriptSegment required' });

  const openai = getOpenAI();
  try {
    const result = await callJsonSchema(
      openai,
      [
        ...languageMessages(locale as LocaleOption),
        { role: 'system', content: ANALYSIS_PROMPT },
        {
          role: 'user',
          content: `FOUNDER'S PRIOR STATEMENT:\n${founderInput || ''}\n\nPUBLIC CONTEXT (Truth Source):\n${publicInfo || 'No public context provided.'}\n\nTRANSCRIPT SEGMENT:\n${transcriptSegment}${languageHint(locale as LocaleOption)}`
        }
      ],
      'analysis_schema',
      analysisSchema,
      0.2
    );
    return res.status(200).json(result);
  } catch (e: any) {
    return res.status(500).json({ error: e.message || 'Analysis failed' });
  }
}
