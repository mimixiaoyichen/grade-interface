import { describe, it, expect } from 'vitest';
import { buildCsv } from '../utils/buildCsv';
import { StatementResult, ComparisonRow } from '../types';

const samplePart1: StatementResult = {
  customers: [
    { id: 'c1', description: 'Desc 1', quotes: ['Quote 1'], publicEvidence: 'Pub 1', isVerified: true, userNotes: 'Note 1' }
  ],
  contexts: [],
  goals: [],
  barriers: [],
  draftStatement: 'draft'
};

const sampleRows: ComparisonRow[] = [
  {
    id: 'row-1',
    component: 'Customer',
    baselineText: 'Base text',
    transcriptModification: 'Mod text',
    type: 'Modification',
    transcriptEvidence: 'Evidence',
    publicSupport: 'Supported',
    isAccepted: false
  }
];

describe('buildCsv', () => {
  it('includes headers and data for part1 and comparison rows', () => {
    const csv = buildCsv(samplePart1, sampleRows);
    expect(csv.split('\n')[0]).toBe('Section,Component,Original,Modification,Interviewer Edit,Type,Evidence,Public Source Check,Accepted,Notes');
    expect(csv).toContain('Part 1 (Discovery)');
    expect(csv).toContain('Desc 1');
    expect(csv).toContain('Note 1');
    expect(csv).toContain('Part 2 (Feedback)');
    expect(csv).toContain('Base text');
  });

  it('sanitizes quotes', () => {
    const withQuote: StatementResult = {
      ...samplePart1,
      customers: [{ ...samplePart1.customers[0], description: 'He said "hello"' }]
    };
    const csv = buildCsv(withQuote, []);
    expect(csv).toContain('He said ""hello""');
  });
});
