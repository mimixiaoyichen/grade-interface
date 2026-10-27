import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getOpenAI, callJsonSchema, languageMessages, languageHint, type LocaleOption, type JsonSchema } from './_openai';
import { COMPONENT_EVIDENCE_PROMPT } from '../prompts/componentEvidence';

const componentEvidenceSchema: JsonSchema = {
  type: 'object',
  properties: {
    customerStart: { type: 'string' },
    customerEnd: { type: 'string' },
    contextStart: { type: 'string' },
    contextEnd: { type: 'string' },
    goalStart: { type: 'string' },
    goalEnd: { type: 'string' },
    barrierStart: { type: 'string' },
    barrierEnd: { type: 'string' }
  },
  required: ['customerStart', 'customerEnd', 'contextStart', 'contextEnd', 'goalStart', 'goalEnd', 'barrierStart', 'barrierEnd'],
  additionalProperties: false
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { transcriptPart2, locale = 'en' } = req.body || {};
  if (!transcriptPart2) return res.status(400).json({ error: 'transcriptPart2 required' });

  const lines: string[] = transcriptPart2.split('\n');
  const numbered = lines.map((line: string, idx: number) => {
    const hex = (0x2000 + idx).toString(16).toUpperCase().slice(-4);
    return `0x${hex} ${line}`;
  }).join('\n');

  const openai = getOpenAI();
  try {
    const result: any = await callJsonSchema(
      openai,
      [
        ...languageMessages(locale as LocaleOption),
        { role: 'system', content: COMPONENT_EVIDENCE_PROMPT },
        { role: 'user', content: `TRANSCRIPT PART 2 (hex-numbered):\n${numbered}${languageHint(locale as LocaleOption)}` }
      ],
      'component_evidence_schema',
      componentEvidenceSchema,
      0.1
    );

    const idToIndex = (id: string) => {
      const match = id?.trim().toLowerCase();
      if (!match) return -1;
      return lines.findIndex((_: string, i: number) => {
        const hex = (0x2000 + i).toString(16).toUpperCase().slice(-4);
        return `0x${hex}`.toLowerCase() === match;
      });
    };

    const sliceRange = (startId: string, endId: string, pad: number) => {
      const startIdx = idToIndex(startId);
      const endIdx = idToIndex(endId);
      if (startIdx === -1 || endIdx === -1) return { context: '', core: '' };
      const s = Math.min(startIdx, endIdx);
      const e = Math.max(startIdx, endIdx);
      const ctxStart = Math.max(0, s - pad);
      const ctxEnd = Math.min(lines.length - 1, e + pad);
      const core = lines.slice(s, e + 1).join('\n');
      const before = lines.slice(ctxStart, s).join('\n');
      const after = lines.slice(e + 1, ctxEnd + 1).join('\n');
      const context = [before, core, after].filter(Boolean).join('\n');
      return { context, core };
    };

    return res.status(200).json({
      customer: sliceRange(result.customerStart, result.customerEnd, 4),
      context: sliceRange(result.contextStart, result.contextEnd, 4),
      goal: sliceRange(result.goalStart, result.goalEnd, 4),
      barrier: sliceRange(result.barrierStart, result.barrierEnd, 4)
    });
  } catch (e: any) {
    return res.status(500).json({ error: e.message || 'Evidence extraction failed' });
  }
}
