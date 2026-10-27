import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getOpenAI, callJsonSchemaWithModel, languageMessages, COMPONENT_LAYER_MODEL_ID, type LocaleOption, type JsonSchema } from './_openai';

const componentJudgeItemSchema: JsonSchema = {
  type: 'object',
  properties: {
    needs_rewrite: { type: 'boolean' },
    entity_issue: { type: 'boolean' },
    confusion_issue: { type: 'boolean' },
    redundancy_issue: { type: 'boolean' },
    reason: { type: 'string' }
  },
  required: ['needs_rewrite', 'entity_issue', 'confusion_issue', 'redundancy_issue', 'reason'],
  additionalProperties: false
};

const componentJudgeSchema: JsonSchema = {
  type: 'object',
  properties: {
    solution: componentJudgeItemSchema,
    customer: componentJudgeItemSchema,
    context: componentJudgeItemSchema,
    goal: componentJudgeItemSchema,
    barrier: componentJudgeItemSchema
  },
  required: ['solution', 'customer', 'context', 'goal', 'barrier'],
  additionalProperties: false
};

const componentRewriteSchema: JsonSchema = {
  type: 'object',
  properties: {
    revised_solution: { type: 'string' },
    revised_customer: { type: 'string' },
    revised_context: { type: 'string' },
    revised_goal: { type: 'string' },
    revised_barrier: { type: 'string' },
    notes: { type: 'string' }
  },
  required: ['revised_solution', 'revised_customer', 'revised_context', 'revised_goal', 'revised_barrier', 'notes'],
  additionalProperties: false
};

const COMPONENT_JUDGE_PROMPT = [
  'You are a strict component-level QA judge for startup statements.',
  'For each component (solution, customer, context, goal, barrier), set needs_rewrite=true ONLY if there is a real issue.',
  'Allowed issue types: entity_issue, confusion_issue, redundancy_issue.',
  'Flag needs_rewrite=true if statement uses vague anaphora like "this/that/these/those/it" without explicit referent in same sentence.',
  'entity_issue=true only when startup/company/product/service/feature/trademark names are copied from source.',
  'Generic standards/regulations (HIPAA, GDPR, SOC 2, ISO, FDA, PCI) are NOT entity issues.',
  'confusion_issue=true when a component semantically belongs to another component (e.g., goal phrased as context).',
  'redundancy_issue=true when this component substantially repeats another component meaning.',
  'CRITICAL: style/tone/grammar tightening alone is NOT an issue.',
  'If no true issue exists, set all issue flags false and needs_rewrite=false.',
  'Return JSON only.'
].join(' ');

const COMPONENT_REWRITE_PROMPT = [
  'You are a strict minimal editor.',
  'You receive original statements and per-component issue flags.',
  'Rewrite ONLY components where needs_rewrite=true.',
  'For components where needs_rewrite=false, copy original text EXACTLY, byte-for-byte.',
  'Do NOT make style or tone polishing edits.',
  'Do not use vague references like "this/that/these/those/it".',
  'Hard constraint: rewritten output must not contain the tokens this, that, these, those, or it.',
  'When rewriting, fix only flagged issue types (entity/confusion/redundancy) and preserve core meaning.',
  'Keep solution/customer/context/goal concise single statements; barrier can be semicolon-separated concrete obstacles.',
  'Return JSON only.'
].join(' ');

const cleanText = (v: unknown) => (v === null || v === undefined ? '' : String(v).trim());

const splitBarrierText = (barrierText: string): string[] => {
  const raw = cleanText(barrierText);
  if (!raw) return [];
  const parts = raw.split(/[;\n]+/).map((p) => cleanText(p)).filter(Boolean);
  const deduped: string[] = [];
  for (const p of parts) { if (!deduped.includes(p)) deduped.push(p); }
  return deduped;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { baseline, publicInfo, locale = 'en' } = req.body || {};
  if (!baseline) return res.status(400).json({ error: 'baseline required' });

  const original = {
    solution: cleanText(baseline.SOLUTION),
    customer: cleanText(baseline.CUSTOMER_SEGMENT),
    context: cleanText(baseline.LIFE_BUSINESS_CONTEXT),
    goal: cleanText(baseline.JOB_TO_BE_DONE),
    barrier: cleanText((baseline.SPECIFIC_BARRIERS || []).join('; '))
  };
  const sourceExcerpt = cleanText(publicInfo).slice(0, 10000);
  const openai = getOpenAI();

  try {
    const judge: any = await callJsonSchemaWithModel(
      openai,
      COMPONENT_LAYER_MODEL_ID,
      [
        ...languageMessages(locale as LocaleOption),
        { role: 'system', content: COMPONENT_JUDGE_PROMPT },
        { role: 'user', content: JSON.stringify({ source_material_excerpt: sourceExcerpt, statements: original }) }
      ],
      'component_gated_judge_schema',
      componentJudgeSchema,
      0
    );

    const anyFlagged = Boolean(
      judge.solution?.needs_rewrite || judge.customer?.needs_rewrite ||
      judge.context?.needs_rewrite || judge.goal?.needs_rewrite || judge.barrier?.needs_rewrite
    );

    if (!anyFlagged) {
      return res.status(200).json({
        model: COMPONENT_LAYER_MODEL_ID,
        rewroteAny: false,
        judge,
        notes: 'No rewrite needed (no flagged issues).',
        revisedBaseline: baseline
      });
    }

    const rewritten: any = await callJsonSchemaWithModel(
      openai,
      COMPONENT_LAYER_MODEL_ID,
      [
        ...languageMessages(locale as LocaleOption),
        { role: 'system', content: COMPONENT_REWRITE_PROMPT },
        { role: 'user', content: JSON.stringify({ source_material_excerpt: sourceExcerpt, original_statements: original, component_flags: judge }) }
      ],
      'component_gated_rewrite_schema',
      componentRewriteSchema,
      0.1
    );

    const safe = { ...rewritten };
    if (!judge.solution.needs_rewrite) safe.revised_solution = original.solution;
    if (!judge.customer.needs_rewrite) safe.revised_customer = original.customer;
    if (!judge.context.needs_rewrite) safe.revised_context = original.context;
    if (!judge.goal.needs_rewrite) safe.revised_goal = original.goal;
    if (!judge.barrier.needs_rewrite) safe.revised_barrier = original.barrier;

    const revisedBarriers = splitBarrierText(safe.revised_barrier);
    const fallbackBarriers: string[] = baseline.SPECIFIC_BARRIERS || [];

    return res.status(200).json({
      model: COMPONENT_LAYER_MODEL_ID,
      rewroteAny: true,
      judge,
      notes: cleanText(safe.notes),
      revisedBaseline: {
        SOLUTION: cleanText(safe.revised_solution),
        CUSTOMER_SEGMENT: cleanText(safe.revised_customer),
        LIFE_BUSINESS_CONTEXT: cleanText(safe.revised_context),
        JOB_TO_BE_DONE: cleanText(safe.revised_goal),
        SPECIFIC_BARRIERS: (revisedBarriers.length ? revisedBarriers : fallbackBarriers).slice(0, 4)
      }
    });
  } catch (e: any) {
    return res.status(500).json({ error: e.message || 'QA check failed' });
  }
}
