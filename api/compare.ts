import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getOpenAI, callJsonSchema, languageMessages, languageHint, type LocaleOption, type JsonSchema } from './_openai';
import { COMPARISON_PROMPT_TEXT } from '../prompts/comparison';

const REQUIRED_COMPARISON_COMPONENTS = ['Solution', 'Customer', 'Context', 'Goal', 'Barrier'] as const;
type ComparisonComponent = typeof REQUIRED_COMPARISON_COMPONENTS[number];

const comparisonRowSchema: JsonSchema = {
  type: 'object',
  properties: {
    component: { type: 'string', enum: ['Solution', 'Customer', 'Context', 'Goal', 'Barrier'] },
    baselineText: { type: 'string' },
    transcriptModification: { type: 'string' },
    type: { type: 'string', enum: ['Modification', 'Omission', 'Hallucination', 'Confirmation'] },
    transcriptEvidence: { type: 'string' },
    publicEvidence: { type: 'string' },
    publicEvidenceContext: { type: 'string' },
    isSupportedByPublic: { type: 'boolean' },
    publicSupport: { type: 'string' }
  },
  required: ['component', 'baselineText', 'transcriptModification', 'type', 'transcriptEvidence', 'publicEvidence', 'publicEvidenceContext', 'isSupportedByPublic', 'publicSupport'],
  additionalProperties: false
};

const comparisonSchema: JsonSchema = {
  type: 'object',
  properties: {
    rows: { type: 'array', minItems: 5, maxItems: 5, items: comparisonRowSchema }
  },
  required: ['rows'],
  additionalProperties: false
};

const getBaselineComponentText = (baseline: any, component: ComparisonComponent): string => {
  switch (component) {
    case 'Solution': return baseline.SOLUTION || '';
    case 'Customer': return baseline.CUSTOMER_SEGMENT || '';
    case 'Context': return baseline.LIFE_BUSINESS_CONTEXT || '';
    case 'Goal': return baseline.JOB_TO_BE_DONE || '';
    case 'Barrier': return (baseline.SPECIFIC_BARRIERS || []).join('; ');
  }
};

const getMissingComponents = (rows: Array<{ component?: string }>) => {
  const present = new Set(rows.map((r) => r.component).filter(Boolean));
  return REQUIRED_COMPARISON_COMPONENTS.filter((c) => !present.has(c));
};

const normalizeRows = (rows: Array<any>, baseline: any) => {
  const seen = new Set<ComparisonComponent>();
  const normalized: Array<any> = [];
  for (const row of rows) {
    const component = row?.component as ComparisonComponent | undefined;
    if (!component || !REQUIRED_COMPARISON_COMPONENTS.includes(component)) continue;
    if (seen.has(component)) continue;
    seen.add(component);
    normalized.push(row);
  }
  for (const component of REQUIRED_COMPARISON_COMPONENTS) {
    if (seen.has(component)) continue;
    const baselineText = getBaselineComponentText(baseline, component);
    normalized.push({
      component,
      baselineText,
      transcriptModification: baselineText,
      type: 'Confirmation',
      transcriptEvidence: '',
      publicEvidence: '',
      publicEvidenceContext: '',
      isSupportedByPublic: false,
      publicSupport: 'Not found in public info'
    });
  }
  return normalized;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { baseline, transcriptPart2, publicInfo, locale = 'en' } = req.body || {};
  if (!baseline || !transcriptPart2) return res.status(400).json({ error: 'baseline and transcriptPart2 required' });

  const baselineStr = JSON.stringify(baseline, null, 2);
  const openai = getOpenAI();

  const buildMessages = (extra?: string) => ([
    ...languageMessages(locale as LocaleOption),
    {
      role: 'system' as const,
      content: extra ? `${COMPARISON_PROMPT_TEXT}\n\n${extra}` : COMPARISON_PROMPT_TEXT
    },
    {
      role: 'user' as const,
      content: `BASELINE STATEMENT:\n${baselineStr}\n\nPUBLIC INFO:\n${publicInfo || ''}\n\nTRANSCRIPT PART 2 (FEEDBACK):\n${transcriptPart2}${languageHint(locale as LocaleOption)}`
    }
  ]);

  try {
    const first: any = await callJsonSchema(openai, buildMessages(), 'comparison_schema', comparisonSchema, 0.1);
    const missing = getMissingComponents(first.rows || []);

    if (missing.length === 0 && first.rows?.length === 5) {
      return res.status(200).json(first);
    }

    try {
      const retry: any = await callJsonSchema(
        openai,
        buildMessages(
          `You must return exactly one row for each component: Solution, Customer, Context, Goal, Barrier. ` +
          `The previous response was missing: ${missing.join(', ') || 'unknown components'}. ` +
          `Return a complete corrected array with all required fields present.`
        ),
        'comparison_schema',
        comparisonSchema,
        0.1
      );
      return res.status(200).json({ rows: normalizeRows(retry.rows || [], baseline) });
    } catch {
      return res.status(200).json({ rows: normalizeRows(first.rows || [], baseline) });
    }
  } catch (e: any) {
    return res.status(500).json({ error: e.message || 'Comparison failed' });
  }
}
