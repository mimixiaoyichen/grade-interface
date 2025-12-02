import { ComparisonRow, StatementResult } from '../types';

const sanitize = (val: string | undefined | null) => (val ?? '').replace(/"/g, '""');

export const buildCsv = (
  part1Result: StatementResult | null,
  comparisonRows: ComparisonRow[],
  opts?: { founderInput?: any; baseline?: any }
) => {
  let csv = "Section,Component,Original,Modification,Type,Evidence,Public Source Check,Accepted,Notes\n";

  const addDiscoveryItems = (items: { description: string; quotes: string[]; publicEvidence?: string; userNotes?: string; isVerified?: boolean; }[], label: string) => {
    items.forEach((i) => {
      csv += `"Part 1 (Discovery)","${label}","","${sanitize(i.description)}","","${sanitize(i.quotes.join(' '))}","${sanitize(i.publicEvidence || '')}","${i.isVerified || false}","${sanitize(i.userNotes || '')}"\n`;
    });
  };

  if (part1Result) {
    addDiscoveryItems(part1Result.customers, "Customer");
    addDiscoveryItems(part1Result.contexts, "Context");
    addDiscoveryItems(part1Result.goals, "Goal");
    addDiscoveryItems(part1Result.barriers, "Barrier");
  }

  comparisonRows.forEach((row) => {
    csv += `"Part 2 (Feedback)","${row.component}","${sanitize(row.baselineText)}","${sanitize(row.transcriptModification)}","${row.type}","${sanitize(row.transcriptEvidence)}","${sanitize(row.publicSupport)}","${row.isAccepted}","${sanitize((row as any).userNotes || '')}"\n`;
  });

  // Append founder input and baseline info for completeness
  csv += "\nSection,Field,Value\n";
  if (opts?.founderInput) {
    csv += `"Founder Input","Solution","${sanitize(opts.founderInput.SOLUTION || '')}"\n`;
    csv += `"Founder Input","Customer Segment","${sanitize(opts.founderInput.CUSTOMER_SEGMENT || '')}"\n`;
    csv += `"Founder Input","Context","${sanitize(opts.founderInput.LIFE_BUSINESS_CONTEXT || '')}"\n`;
    csv += `"Founder Input","Job To Be Done","${sanitize(opts.founderInput.JOB_TO_BE_DONE || '')}"\n`;
    csv += `"Founder Input","Barriers","${sanitize((opts.founderInput.SPECIFIC_BARRIERS || []).join('; '))}"\n`;
  }
  if (opts?.baseline) {
    csv += `"Baseline","Solution","${sanitize(opts.baseline.SOLUTION || '')}"\n`;
    csv += `"Baseline","Customer Segment","${sanitize(opts.baseline.CUSTOMER_SEGMENT || '')}"\n`;
    csv += `"Baseline","Context","${sanitize(opts.baseline.LIFE_BUSINESS_CONTEXT || '')}"\n`;
    csv += `"Baseline","Job To Be Done","${sanitize(opts.baseline.JOB_TO_BE_DONE || '')}"\n`;
    csv += `"Baseline","Barriers","${sanitize((opts.baseline.SPECIFIC_BARRIERS || []).join('; '))}"\n`;
  }

  return csv;
};

export default buildCsv;
