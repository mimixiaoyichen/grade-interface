import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getOpenAI, callJsonSchema, languageMessages, languageHint, type LocaleOption, type JsonSchema } from './_openai';
import { SPLIT_PROMPT } from '../prompts/split';

const splitSchema: JsonSchema = {
  type: 'object',
  properties: {
    hexId: { type: 'string', description: 'Hex line ID (e.g., 0x00AF) where Part 2 begins' },
    reasoning: { type: 'string', description: 'Explanation of why the split was made here' }
  },
  required: ['hexId', 'reasoning'],
  additionalProperties: false
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { fullTranscript, locale = 'en' } = req.body || {};
  if (!fullTranscript) return res.status(400).json({ error: 'fullTranscript required' });

  const lines = fullTranscript.split('\n');
  const numberedTranscript = lines
    .map((line: string, idx: number) => {
      const hex = (0x1000 + idx).toString(16).toUpperCase().slice(-4);
      return `0x${hex} ${line}`;
    })
    .join('\n');

  const openai = getOpenAI();
  try {
    const result: any = await callJsonSchema(
      openai,
      [
        ...languageMessages(locale as LocaleOption),
        { role: 'system', content: SPLIT_PROMPT },
        { role: 'user', content: `FULL TRANSCRIPT (numbered):\n\n${numberedTranscript}${languageHint(locale as LocaleOption)}` }
      ],
      'split_transcript_schema',
      splitSchema,
      0.1
    );

    const hexId = (result.hexId || '').toString().trim();
    const idx = lines.findIndex((_: string, i: number) => {
      const hex = (0x1000 + i).toString(16).toUpperCase().slice(-4);
      return `0x${hex}`.toLowerCase() === hexId.toLowerCase();
    });
    const clampedIdx = idx >= 0 ? idx : Math.floor(lines.length / 2);
    const usedFallback = idx === -1;

    return res.status(200).json({
      part1: lines.slice(0, clampedIdx).join('\n'),
      part2: lines.slice(clampedIdx).join('\n'),
      reasoning: usedFallback
        ? `Could not find hex line ID ("${hexId}"). Split at index ${clampedIdx} (fallback midpoint). Please review manually.`
        : `${result.reasoning || 'Split decided'} (line ${hexId})`
    });
  } catch (e: any) {
    return res.status(500).json({ error: e.message || 'Split failed' });
  }
}
