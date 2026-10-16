import type { BaselineStatement, ComparisonRow, ComponentEvidence, TranscriptSplit, StatementResult } from '../types';
import type { ProblemCharacteristicsData } from '../utils/problemCharacteristics';
import { WizardStep } from '../types';

// Synthetic demo company: "Relay" — AI scheduling copilot for home healthcare agencies.
// Used for the tutorial walkthrough only. No real API calls are made when this data is active.

export const TUTORIAL_COMPANY_URL = 'https://relay-health.io';

export const TUTORIAL_PITCHBOOK =
  'Relay Health is an AI-powered scheduling platform for home healthcare agencies. Founded in 2022, ' +
  'Relay automates visit assignment by matching nurses and aides to patients based on skills, proximity, ' +
  'and patient history. The company reports a 40% reduction in scheduling time and serves over 120 mid-sized agencies across the US.';

export const TUTORIAL_PUBLIC_INFO =
  "Relay's website describes a product that eliminates \"the 2-hour morning scramble\" that home health " +
  'schedulers face each day. The platform ingests patient needs, staff certifications, and real-time ' +
  'location data to recommend optimal assignments. Case studies highlight a 35% drop in missed visits ' +
  'and a 28% improvement in staff retention at pilot agencies.';

// LLM-generated baseline from public info only
export const TUTORIAL_BASELINE: BaselineStatement = {
  SOLUTION: 'AI scheduling platform that automatically assigns nurses and home health aides to patient visits.',
  CUSTOMER_SEGMENT: 'Home healthcare agency administrators and operations managers.',
  LIFE_BUSINESS_CONTEXT: 'When building daily visit schedules across a large field-based workforce with complex patient needs.',
  JOB_TO_BE_DONE: 'Ensure every patient gets the right caregiver at the right time, while keeping staff utilization high.',
  SPECIFIC_BARRIERS: [
    'Manual scheduling in spreadsheets takes hours and produces error-prone rosters.',
    "Agencies lack visibility into caregiver certifications and real-time locations.",
    'Last-minute cancellations cascade into missed visits and compliance violations.'
  ]
};

// Founder's own version, captured during Part 1 of the interview
export const TUTORIAL_FOUNDER_INPUT: BaselineStatement = {
  SOLUTION: 'AI scheduling copilot that matches caregivers to patients and handles same-day changes automatically.',
  CUSTOMER_SEGMENT: 'Schedulers at mid-sized home healthcare agencies (50–300 staff).',
  LIFE_BUSINESS_CONTEXT: "Every morning when building the day's schedule, and again throughout the day when cancellations hit.",
  JOB_TO_BE_DONE: 'Get every patient visited by a qualified caregiver without burning out the scheduling team.',
  SPECIFIC_BARRIERS: [
    'Spreadsheet scheduling takes 2+ hours every morning.',
    "Schedulers don't have live visibility into who's available or certified for each patient.",
    'When a caregiver cancels, it takes another 45 minutes to find a replacement manually.'
  ]
};

export const TUTORIAL_TRANSCRIPT = `Interviewer: Let's start with what you've built. How would you describe Relay's product?

Founder: We're an AI scheduling copilot for home health agencies. Basically, every morning a scheduler sits down and has to figure out which nurse or aide goes to which patient. There are all these constraints — patient preferences, certification requirements, travel time, continuity of care. It takes hours. We automate that.

Interviewer: And who are your customers?

Founder: We focus specifically on mid-sized agencies — roughly 50 to 300 staff. Larger ones have their own internal tech teams, and tiny agencies often just have one person wearing every hat. Our sweet spot is the scheduler at an agency that's grown to the point where a spreadsheet just isn't cutting it anymore.

Interviewer: When does this problem feel most acute for them?

Founder: Two moments. Morning build — that's the two-hour window before the first visit when you're constructing the whole day. And then every time a cancellation hits. A nurse calls in sick at 7am, you've got 20 minutes to find someone certified for that patient before you're in violation.

Interviewer: What are your customers ultimately trying to achieve?

Founder: Their job is simple on paper — make sure every patient gets visited by the right person. But the goal underneath that is not burning out their scheduling team. Turnover for schedulers is brutal. They lose trained people every few months.

Interviewer: What stands in the way without your solution?

Founder: Three things. First, the spreadsheet. It's slow and you can't see in real time who's available or where they are. Second, there's no single view of certifications — you have to cross-check five different systems. Third, when something goes wrong mid-day, the manual rescheduling process takes almost as long as the original build.

--- PART 2: Baseline Feedback ---

Interviewer: Here's the LLM-generated statement. Let me know what you'd change.

Founder: The customer description — it says "administrators and operations managers." That's not who actually uses this. It's schedulers. The operations manager might buy it, but the person whose daily work changes is the scheduler.

Interviewer: What about the context description?

Founder: "Building daily visit schedules across a large field-based workforce" — it's not wrong, but "large" is misleading. Our customers aren't large agencies. They're growing, mid-sized ones.

Interviewer: Any issues with the barriers listed?

Founder: The third barrier about compliance violations — that's something I've never said publicly. We do see it internally but I wouldn't put that in public-facing material yet. The real third barrier is just the manual rescheduling chaos when something changes mid-day.`;

export const TUTORIAL_SPLIT: TranscriptSplit = {
  part1: `Interviewer: Let's start with what you've built. How would you describe Relay's product?

Founder: We're an AI scheduling copilot for home health agencies. Basically, every morning a scheduler sits down and has to figure out which nurse or aide goes to which patient. There are all these constraints — patient preferences, certification requirements, travel time, continuity of care. It takes hours. We automate that.

Interviewer: And who are your customers?

Founder: We focus specifically on mid-sized agencies — roughly 50 to 300 staff. Larger ones have their own internal tech teams, and tiny agencies often just have one person wearing every hat. Our sweet spot is the scheduler at an agency that's grown to the point where a spreadsheet just isn't cutting it anymore.

Interviewer: When does this problem feel most acute for them?

Founder: Two moments. Morning build — that's the two-hour window before the first visit when you're constructing the whole day. And then every time a cancellation hits. A nurse calls in sick at 7am, you've got 20 minutes to find someone certified for that patient before you're in violation.

Interviewer: What are your customers ultimately trying to achieve?

Founder: Their job is simple on paper — make sure every patient gets visited by the right person. But the goal underneath that is not burning out their scheduling team. Turnover for schedulers is brutal. They lose trained people every few months.

Interviewer: What stands in the way without your solution?

Founder: Three things. First, the spreadsheet. It's slow and you can't see in real time who's available or where they are. Second, there's no single view of certifications — you have to cross-check five different systems. Third, when something goes wrong mid-day, the manual rescheduling process takes almost as long as the original build.`,
  part2: `Interviewer: Here's the LLM-generated statement. Let me know what you'd change.

Founder: The customer description — it says "administrators and operations managers." That's not who actually uses this. It's schedulers. The operations manager might buy it, but the person whose daily work changes is the scheduler.

Interviewer: What about the context description?

Founder: "Building daily visit schedules across a large field-based workforce" — it's not wrong, but "large" is misleading. Our customers aren't large agencies. They're growing, mid-sized ones.

Interviewer: Any issues with the barriers listed?

Founder: The third barrier about compliance violations — that's something I've never said publicly. We do see it internally but I wouldn't put that in public-facing material yet. The real third barrier is just the manual rescheduling chaos when something changes mid-day.`,
  reasoning: 'Part 1 ends after the five structured discovery questions. Part 2 begins when the interviewer presents the LLM-generated statement for feedback.'
};

export const TUTORIAL_PART1_RESULT: StatementResult = {
  customers: [
    {
      id: 'tut-c-0',
      description: 'Schedulers at mid-sized home healthcare agencies (50–300 staff)',
      quotes: ["\"Our sweet spot is the scheduler at an agency that's grown to the point where a spreadsheet just isn't cutting it anymore.\""],
      isVerified: false,
      userNotes: ''
    }
  ],
  contexts: [
    {
      id: 'tut-ctx-0',
      description: 'During the morning schedule build and whenever same-day cancellations occur',
      quotes: ['"Two moments. Morning build..."', '"A nurse calls in sick at 7am, you\'ve got 20 minutes."'],
      isVerified: false,
      userNotes: ''
    }
  ],
  goals: [
    {
      id: 'tut-g-0',
      description: 'Ensure every patient is visited by the right caregiver without burning out the scheduling team',
      quotes: ['"The goal underneath that is not burning out their scheduling team. Turnover for schedulers is brutal."'],
      isVerified: false,
      userNotes: ''
    }
  ],
  barriers: [
    {
      id: 'tut-b-0',
      description: 'Spreadsheet scheduling is slow with no real-time visibility into availability or location',
      quotes: ["\"The spreadsheet. It's slow and you can't see in real time who's available or where they are.\""],
      isVerified: false,
      userNotes: ''
    },
    {
      id: 'tut-b-1',
      description: 'No single view of certifications; requires cross-checking multiple systems',
      quotes: ["\"There's no single view of certifications — you have to cross-check five different systems.\""],
      isVerified: false,
      userNotes: ''
    },
    {
      id: 'tut-b-2',
      description: 'Manual rescheduling after cancellations takes nearly as long as the original build',
      quotes: ['"When something goes wrong mid-day, the manual rescheduling process takes almost as long as the original build."'],
      isVerified: false,
      userNotes: ''
    }
  ],
  draftStatement: "Relay helps schedulers at mid-sized home healthcare agencies automate daily visit assignment and same-day rescheduling so every patient is seen by the right caregiver — without exhausting the scheduling team."
};

export const TUTORIAL_COMPARISON_ROWS: ComparisonRow[] = [
  {
    id: 'tut-row-solution',
    component: 'Solution',
    baselineText: 'AI scheduling platform that automatically assigns nurses and home health aides to patient visits.',
    transcriptModification: 'AI scheduling copilot that matches caregivers to patients and handles same-day changes automatically.',
    reviewerEdit: 'AI scheduling copilot that matches caregivers to patients and handles same-day changes automatically.',
    type: 'Modification',
    transcriptEvidence: "\"We're an AI scheduling copilot for home health agencies.\"",
    publicSupport: 'Supported by website copy.',
    publicEvidence: 'AI-powered scheduling platform',
    publicEvidenceContext: "Relay's website describes a product that eliminates \"the 2-hour morning scramble\".",
    isSupportedByPublic: true,
    isAccepted: false,
    reviewerNotes: '',
    reviewerDecision: 'Supported'
  },
  {
    id: 'tut-row-customer',
    component: 'Customer',
    baselineText: 'Home healthcare agency administrators and operations managers.',
    transcriptModification: 'Schedulers at mid-sized home healthcare agencies (50–300 staff).',
    reviewerEdit: 'Schedulers at mid-sized home healthcare agencies (50–300 staff).',
    type: 'Modification',
    transcriptEvidence: '"That\'s not who actually uses this. It\'s schedulers."',
    publicSupport: 'Not explicitly stated in public info.',
    publicEvidence: '',
    publicEvidenceContext: '',
    isSupportedByPublic: false,
    isAccepted: false,
    reviewerNotes: '',
    reviewerDecision: 'Not supported'
  },
  {
    id: 'tut-row-context',
    component: 'Context',
    baselineText: 'When building daily visit schedules across a large field-based workforce with complex patient needs.',
    transcriptModification: 'Every morning during the schedule build and whenever a same-day cancellation occurs.',
    reviewerEdit: 'Every morning during the schedule build and whenever a same-day cancellation occurs.',
    type: 'Modification',
    transcriptEvidence: '"Two moments. Morning build... And then every time a cancellation hits."',
    publicSupport: 'Partially supported.',
    publicEvidence: 'eliminates "the 2-hour morning scramble"',
    publicEvidenceContext: "Relay's website describes a product that eliminates \"the 2-hour morning scramble\" that home health schedulers face each day.",
    isSupportedByPublic: true,
    isAccepted: false,
    reviewerNotes: '',
    reviewerDecision: 'Supported'
  },
  {
    id: 'tut-row-goal',
    component: 'Goal',
    baselineText: 'Ensure every patient gets the right caregiver at the right time, while keeping staff utilization high.',
    transcriptModification: 'Ensure every patient is visited by the right caregiver without burning out the scheduling team.',
    reviewerEdit: 'Ensure every patient is visited by the right caregiver without burning out the scheduling team.',
    type: 'Modification',
    transcriptEvidence: '"The goal underneath that is not burning out their scheduling team."',
    publicSupport: 'Partially supported.',
    publicEvidence: '28% improvement in staff retention',
    publicEvidenceContext: 'Case studies highlight a 35% drop in missed visits and a 28% improvement in staff retention at pilot agencies.',
    isSupportedByPublic: true,
    isAccepted: false,
    reviewerNotes: '',
    reviewerDecision: 'Supported'
  },
  {
    id: 'tut-row-barrier',
    component: 'Barrier',
    baselineText: 'Last-minute cancellations cascade into missed visits and compliance violations.',
    transcriptModification: 'Manual rescheduling after cancellations takes nearly as long as the original morning build.',
    reviewerEdit: 'Manual rescheduling after cancellations takes nearly as long as the original morning build.',
    type: 'Hallucination',
    transcriptEvidence: '"The third barrier about compliance violations — that\'s something I\'ve never said publicly... The real third barrier is just the manual rescheduling chaos when something changes mid-day."',
    publicSupport: 'Not found in public info.',
    publicEvidence: '',
    publicEvidenceContext: '',
    isSupportedByPublic: false,
    isAccepted: false,
    reviewerNotes: '',
    reviewerDecision: 'Not supported'
  }
];

export const TUTORIAL_COMPONENT_EVIDENCE: ComponentEvidence = {
  customer: {
    context: 'Founder explicitly corrected "administrators and operations managers" — the actual user is the scheduler.',
    core: 'Schedulers at mid-sized home healthcare agencies (50–300 staff)'
  },
  context: {
    context: 'Two distinct trigger moments: the 2-hour morning build and same-day cancellations.',
    core: 'Morning schedule build and same-day cancellation events'
  },
  goal: {
    context: 'Founder revealed the underlying job: scheduler retention, not just visit coverage.',
    core: 'Visit every patient with the right caregiver, without burning out the scheduling team'
  },
  barrier: {
    context: 'The compliance barrier is a hallucination — never stated publicly. Real barrier is the manual rescheduling burden.',
    core: 'Manual rescheduling after cancellations'
  }
};

export const TUTORIAL_PROBLEM_CHARACTERISTICS: ProblemCharacteristicsData = {
  q1: ['High – Many interacting factors; easy to make mistakes without deeper knowledge'],
  q2: ['Recurring – Occurs regularly, continuously, or on a predictable cadence (e.g., daily, weekly, monthly)'],
  q3: ['High – Meaningful consequences for finances, health, safety, or long-term outcomes'],
  q4: ['Expert-present – An expert is typically involved to get a good or safe outcome'],
  q5: ['Service', 'Efficiency'],
  q6: 'Founder was formerly a home health aide and watched schedulers burn out firsthand at a prior employer. The problem was invisible to outsiders but acute to anyone who had worked in the field.'
};

// ─── Tutorial sidebar step definitions ───────────────────────────────────────

export interface TutorialStep {
  id: string;
  wizardStep: WizardStep;
  requiresSplit?: boolean;
  title: string;
  body: string;
  lookFor?: string;
  tip?: string;
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'tut-welcome',
    wizardStep: WizardStep.PUBLIC_INFO,
    title: 'Welcome to Founder Problem Analyst',
    body: "This tool helps research teams run structured interviews with startup founders. You'll walk through six steps: gather public info → capture the founder's perspective → review the AI baseline → characterize the problem → upload the transcript → compare and export.\n\nThis tutorial uses a demo company — Relay, an AI scheduling tool for home health agencies. No real API calls are made.",
    lookFor: '[PLACEHOLDER: What the interviewer should know before their first session]',
    tip: '[PLACEHOLDER: Logistical prep tips before the Zoom call]'
  },
  {
    id: 'tut-public-info',
    wizardStep: WizardStep.PUBLIC_INFO,
    title: 'Step 1 — Public Information',
    body: "Before the interview, you gather public information about the company. Paste the company URL and click Fetch, or upload a text file. Pitchbook data can be pasted separately.\n\nThe demo shows Relay's public info already loaded.",
    lookFor: "The public info describes the customer as \"administrators and operations managers.\" Notice how this will be corrected by the founder in Part 2.",
    tip: '[PLACEHOLDER: Best sources for public info in the research context]'
  },
  {
    id: 'tut-baseline',
    wizardStep: WizardStep.PUBLIC_INFO,
    title: 'Step 1 — Generate the Baseline',
    body: "Click \"Generate Baseline\" to have the LLM extract a structured problem statement from the public info. This becomes the artifact you'll show the founder during Part 2 of the interview.\n\nThe demo baseline is pre-generated — see the preview panel below the button.",
    lookFor: "The LLM says the customer is \"administrators and operations managers.\" The founder will correct this to \"schedulers\" — that gap is the key insight the interview surfaces.",
    tip: "Generate the baseline before the interview starts, so it's ready to show the founder."
  },
  {
    id: 'tut-founder-input',
    wizardStep: WizardStep.FOUNDER_INPUT,
    title: 'Step 2 — Capture Founder Perspective',
    body: "During Part 1 of the interview, capture the founder's unprompted answers to five questions: Solution, Customer, Context, Goal, and Barriers. Each field has a \"View Script\" button with the exact question to read aloud.\n\nThe demo shows Relay's answers already filled in.",
    lookFor: "Compare the founder's Customer answer (\"schedulers at mid-sized agencies\") to the LLM baseline (\"administrators and operations managers\") from Step 1.",
    tip: 'Read the scripts verbatim to keep interviews consistent across founders.'
  },
  {
    id: 'tut-consent',
    wizardStep: WizardStep.FOUNDER_INPUT,
    title: 'Step 2 — Recording Consent',
    body: "Click the green \"Consent\" button before starting the recording. Walk the founder through the form out loud.\n\nThe form covers recording permission and, for non-US founders, a data privacy addendum (GDPR/equivalent).",
    lookFor: '[PLACEHOLDER: Which consent fields are most important to review with founders]',
    tip: 'Log consent before pressing record. The status is captured in the export JSON.'
  },
  {
    id: 'tut-baseline-review',
    wizardStep: WizardStep.BASELINE_REVIEW,
    title: 'Step 3 — Review the LLM Baseline',
    body: "In Part 2 of the interview, you show the founder the LLM-generated statement and ask them to correct it. Update each field here as the founder reacts.\n\nThe demo shows the reviewed version with Relay's founder corrections already applied.",
    lookFor: "The Customer field now reads \"schedulers\" — not the LLM's \"administrators.\" This edit flows through to the final comparison table.",
    tip: "Read the script at the top of this step before showing the statement to the founder."
  },
  {
    id: 'tut-problem-chars',
    wizardStep: WizardStep.PROBLEM_CHARACTERISTICS,
    title: 'Step 4 — Problem Characteristics',
    body: "After the core interview, ask four short questions to categorize the nature of the problem: information intensity, frequency, stakes, and expert dependency. Also ask how the founder discovered the problem.\n\nThe demo shows Relay's ratings pre-filled.",
    lookFor: "Relay is rated High on both information intensity and stakes — scheduling errors have direct consequences for patient care.",
    tip: '[PLACEHOLDER: How to handle founders who are uncertain about a rating]'
  },
  {
    id: 'tut-transcript',
    wizardStep: WizardStep.TRANSCRIPT_UPLOAD,
    title: 'Step 5 — Upload the Transcript',
    body: "After the interview, upload the recording for auto-transcription or paste the transcript text directly. Speaker diarization labels are applied automatically.\n\nThe demo transcript is pre-loaded — it includes both Part 1 (discovery) and Part 2 (baseline feedback).",
    lookFor: "Scroll through to see how Part 1 (founder's unprompted answers) differs in tone from Part 2 (founder reacting to the LLM statement).",
    tip: '[PLACEHOLDER: Audio file format tips and size limits]'
  },
  {
    id: 'tut-split',
    wizardStep: WizardStep.TRANSCRIPT_UPLOAD,
    requiresSplit: true,
    title: 'Step 5 — Transcript Split',
    body: "The AI splits the transcript into Part 1 (discovery questions) and Part 2 (founder feedback on the LLM baseline). Review and adjust the boundary if needed.\n\nIn the demo, the split falls between the structured questions and the baseline review.",
    lookFor: "Part 1 ends when the interviewer finishes the five questions. Part 2 starts when the interviewer says \"Here's the LLM-generated statement.\"",
    tip: "If the split is off, drag the boundary or edit Part 1 and Part 2 text directly before confirming."
  },
  {
    id: 'tut-split-confirm',
    wizardStep: WizardStep.TRANSCRIPT_UPLOAD,
    requiresSplit: true,
    title: 'Step 5 — Confirm and Analyze',
    body: "Once the split looks right, click \"Confirm Split & Analyze\" to run the comparison. This generates the feedback table using the founder's Part 2 corrections.\n\nIn a real session this takes 10–15 seconds. The demo result is pre-loaded.",
    lookFor: '[PLACEHOLDER: What the three parallel AI calls do]',
    tip: 'The analysis runs three calls in parallel. If one fails, re-run the split step.'
  },
  {
    id: 'tut-comparison',
    wizardStep: WizardStep.PART2_COMPARISON,
    title: 'Step 6 — Review Feedback',
    body: "The comparison table shows how the founder's Part 2 comments map onto the LLM baseline. Each row is typed: Modification (founder changed something), Hallucination (LLM added something never said), Omission (something missing), or Confirmation.\n\nThe demo shows five rows for Relay.",
    lookFor: "The Barrier row is labeled \"Hallucination\" — the LLM described a compliance concern the founder explicitly said they've never stated publicly. This is the most analytically interesting row.",
    tip: 'Use the Reviewer Edit field to write a polished version of each component after discussion.'
  },
  {
    id: 'tut-export',
    wizardStep: WizardStep.PART2_COMPARISON,
    title: 'Step 6 — Export',
    body: "When review is complete, click \"Download JSON\" to save the full research record. The JSON includes public info, all statement versions, consent status, transcript, split data, and the comparison table.\n\nThis file is the structured output for the research database.",
    lookFor: '[PLACEHOLDER: What the research team does with the exported JSON]',
    tip: 'Export immediately after review — the tool does not auto-save.'
  }
];
