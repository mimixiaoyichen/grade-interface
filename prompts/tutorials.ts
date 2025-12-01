export type TutorialSection = {
  title: string;
  bullets: string[];
};

export const TUTORIALS: Record<string, TutorialSection> = {
  global: {
    title: 'Core Definitions',
    bullets: [
      'Customer: who experiences the problem and benefits.',
      'Context: where/when the problem shows up.',
      'Goal (JTBD): what they are trying to achieve; start with "To...".',
      'Barrier: what blocks them; ground in quotes/public info.',
      'Evidence: quotes from transcript or public sources backing a claim.',
      'Baseline: the public “truth source” you generated before founder input.',
    ],
  },
  publicInfo: {
    title: 'Public Info & Baseline',
    bullets: [
      'Use the company URL or a query to pull multiple pages; review the cleaned text.',
      'Generate the baseline once per public info set; change public info if you want a new baseline.',
      'Baseline fields: SOLUTION, CUSTOMER, Context (When/While), Job (To...), Barriers (specific, grounded).',
      'Avoid hallucinations: stay factual to the public sources.',
    ],
  },
  founderInput: {
    title: 'Founder Perspective',
    bullets: [
      'Capture the founder’s stated solution, customer, context, job, barriers.',
      'Be specific (e.g., “IT admins at mid-market SaaS” not “tech companies”).',
      'Barriers: list distinct, concrete blockers.',
    ],
  },
  baselineReview: {
    title: 'Baseline Review',
    bullets: [
      'Edit baseline fields to reflect the public truth; keep JTBD syntax (When... / To...).',
      'Barriers should map to value props or problems implied by the public info.',
      'Changes here affect later comparisons; re-run baseline only if public info changes.',
    ],
  },
  transcript: {
    title: 'Transcript & Split',
    bullets: [
      'Part 1: Discovery (raw statements). Part 2: Feedback/Corrections.',
      'Adjust the split so Part 2 starts when the interviewer summarizes/hypothesizes.',
      'Keep evidence-rich quotes; long transcripts may need trimming.',
    ],
  },
  part1: {
    title: 'Part 1 Analysis (Discovery)',
    bullets: [
      'Extract Customers, Contexts, Goals, Barriers with quotes from Part 1.',
      'Mark public support where the public info backs the claim; otherwise note “Not found.”',
      'Draft statement should be concise and factual; edit if needed.',
    ],
  },
  part2: {
    title: 'Part 2 Comparison (Feedback)',
    bullets: [
      'Rows compare baseline vs. transcript Part 2: Modification, Omission, Hallucination, Confirmation.',
      'Baseline Text = public truth; Transcript Modification = founder correction/addition.',
      'Use quotes as evidence; mark acceptance to finalize the changes you agree with.',
    ],
  },
};
