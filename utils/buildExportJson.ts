import { BaselineStatement, ComparisonRow, StatementResult, SupportRowState, TranscriptSplit } from '../types';
import type { BaselineReviewField } from './baselineReviewOrder';
import {
  createProblemCharacteristicsData,
  type ProblemCharacteristicsData
} from './problemCharacteristics';

export interface ExportOptions {
  companyUrl?: string;
  pitchbookInfo?: string;
  publicInfo?: string;
  baselineSource?: string;
  baselineLLM?: BaselineStatement | null;
  baselineLLMRaw4o?: BaselineStatement | null;
  baselineGpt52Layer?: any;
  founderStatement?: BaselineStatement | null;
  part1Result?: StatementResult | null;
  comparisonRows?: ComparisonRow[];
  supportByRow?: Record<string, SupportRowState>;
  founderInput?: BaselineStatement;
  baselineReviewFieldOrder?: BaselineReviewField[];
  part2Notes?: string;
  transcript?: string;
  splitData?: TranscriptSplit | null;
  founderRecordConsent?: boolean;
  internationalFounder?: boolean;
  founderDataConsent?: boolean;
  problemCharacteristics?: ProblemCharacteristicsData | null;
}

const compactJoin = (parts: Array<string | undefined | null>) =>
  parts
    .map((p) => (p || '').trim())
    .filter(Boolean)
    .join('\n\n');

export const buildExportJson = (opts: ExportOptions) => {
  const comparisonRows = opts.comparisonRows || [];
  const supportByRow = opts.supportByRow || {};

  const rowById = comparisonRows.reduce<Record<string, ComparisonRow>>((acc, row) => {
    acc[row.id] = row;
    return acc;
  }, {});

  const supportEntries = Object.entries(supportByRow).map(([rowId, state]) => ({
    rowId,
    component: rowById[rowId]?.component,
    omissions: state?.omissions || [],
    hallucinations: state?.hallucinations || []
  }));

  const combinedPublic = (opts.baselineSource || compactJoin([opts.pitchbookInfo, opts.publicInfo])).trim();

  const statements = {
    llm_generated_page1: opts.baselineLLM || null,
    llm_generated_page1_raw_4o: opts.baselineLLMRaw4o || null,
    llm_generated_page1_gpt52_layer: opts.baselineGpt52Layer || null,
    founder_input_page2: opts.founderInput || null,
    interviewer_review_page3: opts.founderStatement || null,
    interviewer_final_page5: {
      components: comparisonRows,
      notes: opts.part2Notes || ''
    }
  };

  const pc = opts.problemCharacteristics ? createProblemCharacteristicsData(opts.problemCharacteristics) : null;
  const problem_characteristics = pc ? {
    frequency: pc.q1,
    urgency: pc.q2,
    temporal_frame: pc.q3,
    barrier_types: Object.keys(pc.q4).filter((k) => Boolean(pc.q4[k])),
    goal_orientation: pc.q5,
    stakes: pc.q6
  } : null;

  const payload = {
    metadata: {
      formatVersion: 1,
      exportedAt: new Date().toISOString(),
      companyUrl: opts.companyUrl || '',
      publicInfoUsed: combinedPublic,
      baselineReviewFieldOrder: opts.baselineReviewFieldOrder || []
    },
    public_info: {
      combined: combinedPublic,
      pitchbook: opts.pitchbookInfo || '',
      fetched: opts.publicInfo || ''
    },
    statements,
    consent: {
      founderRecordConsent: Boolean(opts.founderRecordConsent),
      internationalFounder: Boolean(opts.internationalFounder),
      founderDataConsent: Boolean(opts.founderDataConsent)
    },
    omissions_hallucinations: supportEntries,
    part1_discovery: opts.part1Result || null,
    transcript: {
      full: opts.transcript || '',
      part1: opts.splitData?.part1 || '',
      part2: opts.splitData?.part2 || '',
      splitReason: opts.splitData?.reasoning || ''
    },
    problem_characteristics
  };

  return JSON.stringify(payload, null, 2);
};

export default buildExportJson;
