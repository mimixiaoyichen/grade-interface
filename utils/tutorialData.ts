import type { BaselineStatement, ComparisonRow, ComponentEvidence, TranscriptSplit, StatementResult } from '../types';
import { WizardStep } from '../types';

// Demo company: Uber (early stage, 2010).
// Used for the tutorial walkthrough only. No real API calls are made when this data is active.
// Key narrative: LLM infers Uber solved a cost problem; founder corrects that it was a reliability problem —
// and that early Uber was deliberately MORE expensive than taxis.

export const TUTORIAL_COMPANY_URL = 'https://uber.com';

export const TUTORIAL_PITCHBOOK =
  'Uber Technologies (originally UberCab) was founded in 2009 by Travis Kalanick and Garrett Camp. ' +
  'The company raised a $1.25M seed round from First Round Capital and angel investors. ' +
  'Initial operations used a fleet of licensed black town cars (Lincoln Town Cars) driven by professional chauffeurs. ' +
  'Pricing was set at 1.5–2x the standard taxi meter rate from day one.';

export const TUTORIAL_PUBLIC_INFO =
  "UberCab's launch press described the service as \"everyone's private driver\" — a one-tap iPhone experience " +
  'that dispatches a black car to your location in minutes. Early TechCrunch coverage emphasized the seamlessness: ' +
  'open the app, see nearby cars on a map, tap once to request. No cash, no phone dispatch, no uncertainty. ' +
  "The company's website highlighted the quality of the vehicle fleet and the professionalism of its drivers. " +
  'Marketing positioned Uber as bringing the experience of a private car service to anyone who wanted it, ' +
  'whenever they wanted it.';

// LLM-generated baseline from public info only
export const TUTORIAL_BASELINE: BaselineStatement = {
  SOLUTION: 'On-demand smartphone app that dispatches a professional black car to your location in minutes.',
  CUSTOMER_SEGMENT: 'Urban professionals and commuters who need reliable, on-demand transportation around the city.',
  LIFE_BUSINESS_CONTEXT: 'When traveling around a city and unable to quickly find or hail a traditional taxi.',
  JOB_TO_BE_DONE: 'Get to their destination reliably and comfortably without the hassle of cash or phone dispatch.',
  SPECIFIC_BARRIERS: [
    'Taxis are unreliable and difficult to hail, especially during peak hours or bad weather.',
    'Traditional car services are expensive and require booking hours in advance.',
    'Riders have no visibility into driver location or estimated arrival before committing.'
  ]
};

// Founder's own version, captured during Part 1 of the interview
export const TUTORIAL_FOUNDER_INPUT: BaselineStatement = {
  SOLUTION: 'One-tap black car app for people who need to be somewhere and can\'t leave transportation to chance.',
  CUSTOMER_SEGMENT: 'Professionals and event-goers — people out late at conferences, dinners, and client meetings who keep getting stranded when they need to leave.',
  LIFE_BUSINESS_CONTEXT: 'Late nights after events and dinners, when cabs are impossible to find and missing your ride has real consequences.',
  JOB_TO_BE_DONE: 'Eliminate the background anxiety of "how am I getting home" so you can be fully present at whatever you\'re doing.',
  SPECIFIC_BARRIERS: [
    'Taxis were deeply unreliable — you could stand on a corner for 45 minutes and nothing would come.',
    'Existing car service required booking hours in advance; it couldn\'t handle spontaneous or last-minute needs.',
    'There was no information — you had no idea if a cab was coming or how far away it was.'
  ]
};

export const TUTORIAL_TRANSCRIPT = `Interviewer: Let's start with the product. How would you describe what you built?

Founder: We built an iPhone app where you tap a button and a black car shows up in five minutes. Licensed chauffeurs, Lincoln Town Cars, every time. No dispatch call, no cash, no waiting to see if anyone comes.

Interviewer: Who were your first customers?

Founder: Professionals who were out at night — events, conferences, client dinners — and kept getting stranded trying to get home. Taxis in most cities were genuinely unreliable. You'd stand outside a venue at midnight and nothing would show up for 45 minutes. Our early adopters were people who'd been burned by that enough times that they'd pay more for a guaranteed ride.

Interviewer: When did the problem feel most acute for them?

Founder: Late nights, mostly. The morning commute you can plan around — you build in buffer time, you take transit, whatever. But when you're wrapping up a conference dinner and need to get back to the hotel, or you have an early flight, that's when you feel the absence of a reliable option. The stakes are real. There's no good fallback.

Interviewer: What were your customers ultimately trying to achieve?

Founder: Peace of mind, honestly. They wanted to go out, enjoy their evening, and not have "how am I getting home" as a background anxiety the whole time. The product let you be fully present at what you were doing because the exit was already handled.

Interviewer: What stood in the way without something like Uber?

Founder: Three things. First, taxis were just unreliable — dispatch systems were broken, drivers cherry-picked short fares, supply dried up at night. Second, existing car service required booking hours in advance; you couldn't use it spontaneously. Third, there was zero information — you had no idea if a cab was actually coming or how far away it was. The whole experience was opaque and anxiety-inducing.

--- PART 2: Baseline Feedback ---

Interviewer: Here's the statement the LLM generated from your public information. Tell me what you'd change.

Founder: The customer segment — "urban professionals and commuters." Commuters are not our customer. Commuters have transit options, they have routines, they optimize for price. Our customer is the person going somewhere social or professional at night. That distinction matters a lot because commuters are price-sensitive and habitual; our early users were neither.

Interviewer: What about the context?

Founder: "When traveling around a city and unable to find a taxi" — technically accurate but it undersells it. The context is specifically late-night situations where being late or stranded has real consequences. It's not "I need a ride." It's "I have somewhere important to be and I cannot leave it to chance."

Interviewer: Any issues with the barriers listed?

Founder: The second one — "traditional car services are expensive." That framing is completely backwards. We were more expensive than a cab. 1.5 to 2x the meter rate. That was intentional — it kept the supply side happy and it was a quality signal. The idea that our early customers came to us to save money is wrong. They came despite paying more, because reliability was worth it to them. We never positioned around cost savings. That came from somewhere else entirely.`;

export const TUTORIAL_SPLIT: TranscriptSplit = {
  part1: `Interviewer: Let's start with the product. How would you describe what you built?

Founder: We built an iPhone app where you tap a button and a black car shows up in five minutes. Licensed chauffeurs, Lincoln Town Cars, every time. No dispatch call, no cash, no waiting to see if anyone comes.

Interviewer: Who were your first customers?

Founder: Professionals who were out at night — events, conferences, client dinners — and kept getting stranded trying to get home. Taxis in most cities were genuinely unreliable. You'd stand outside a venue at midnight and nothing would show up for 45 minutes. Our early adopters were people who'd been burned by that enough times that they'd pay more for a guaranteed ride.

Interviewer: When did the problem feel most acute for them?

Founder: Late nights, mostly. The morning commute you can plan around — you build in buffer time, you take transit, whatever. But when you're wrapping up a conference dinner and need to get back to the hotel, or you have an early flight, that's when you feel the absence of a reliable option. The stakes are real. There's no good fallback.

Interviewer: What were your customers ultimately trying to achieve?

Founder: Peace of mind, honestly. They wanted to go out, enjoy their evening, and not have "how am I getting home" as a background anxiety the whole time. The product let you be fully present at what you were doing because the exit was already handled.

Interviewer: What stood in the way without something like Uber?

Founder: Three things. First, taxis were just unreliable — dispatch systems were broken, drivers cherry-picked short fares, supply dried up at night. Second, existing car service required booking hours in advance; you couldn't use it spontaneously. Third, there was zero information — you had no idea if a cab was actually coming or how far away it was. The whole experience was opaque and anxiety-inducing.`,
  part2: `Interviewer: Here's the statement the LLM generated from your public information. Tell me what you'd change.

Founder: The customer segment — "urban professionals and commuters." Commuters are not our customer. Commuters have transit options, they have routines, they optimize for price. Our customer is the person going somewhere social or professional at night. That distinction matters a lot because commuters are price-sensitive and habitual; our early users were neither.

Interviewer: What about the context?

Founder: "When traveling around a city and unable to find a taxi" — technically accurate but it undersells it. The context is specifically late-night situations where being late or stranded has real consequences. It's not "I need a ride." It's "I have somewhere important to be and I cannot leave it to chance."

Interviewer: Any issues with the barriers listed?

Founder: The second one — "traditional car services are expensive." That framing is completely backwards. We were more expensive than a cab. 1.5 to 2x the meter rate. That was intentional — it kept the supply side happy and it was a quality signal. The idea that our early customers came to us to save money is wrong. They came despite paying more, because reliability was worth it to them. We never positioned around cost savings. That came from somewhere else entirely.`,
  reasoning: 'Part 1 ends after the five structured discovery questions. Part 2 begins when the interviewer presents the LLM-generated statement for feedback.'
};

export const TUTORIAL_PART1_RESULT: StatementResult = {
  customers: [
    {
      id: 'tut-c-0',
      description: 'Professionals and event-goers who kept getting stranded late at night after conferences and dinners',
      quotes: ['"Our early adopters were people who\'d been burned by that enough times that they\'d pay more for a guaranteed ride."'],
      isVerified: false,
      userNotes: ''
    }
  ],
  contexts: [
    {
      id: 'tut-ctx-0',
      description: 'Late nights after events, conferences, and dinners when being stranded has real consequences',
      quotes: ['"When you\'re wrapping up a conference dinner and need to get back to the hotel... The stakes are real. There\'s no good fallback."'],
      isVerified: false,
      userNotes: ''
    }
  ],
  goals: [
    {
      id: 'tut-g-0',
      description: 'Eliminate the anxiety of "how am I getting home" so you can be fully present at what you\'re doing',
      quotes: ['"The product let you be fully present at what you were doing because the exit was already handled."'],
      isVerified: false,
      userNotes: ''
    }
  ],
  barriers: [
    {
      id: 'tut-b-0',
      description: 'Taxis were unreliable — dispatch systems were broken, drivers cherry-picked fares, supply dried up at night',
      quotes: ['"You\'d stand outside a venue at midnight and nothing would show up for 45 minutes."'],
      isVerified: false,
      userNotes: ''
    },
    {
      id: 'tut-b-1',
      description: 'Existing car service required booking hours in advance — no good for spontaneous or last-minute needs',
      quotes: ['"Existing car service required booking hours in advance; you couldn\'t use it spontaneously."'],
      isVerified: false,
      userNotes: ''
    },
    {
      id: 'tut-b-2',
      description: 'Complete information opacity — no way to know if a cab was coming or how far away it was',
      quotes: ['"There was zero information — you had no idea if a cab was actually coming or how far away it was."'],
      isVerified: false,
      userNotes: ''
    }
  ],
  draftStatement: "Uber helps professionals and event-goers get a reliable black car in minutes so they can be present at what they're doing — without the anxiety of not knowing how they'll get home."
};

export const TUTORIAL_COMPARISON_ROWS: ComparisonRow[] = [
  {
    id: 'tut-row-solution',
    component: 'Solution',
    baselineText: 'On-demand smartphone app that dispatches a professional black car to your location in minutes.',
    transcriptModification: 'One-tap black car app for people who need to be somewhere and can\'t leave transportation to chance.',
    reviewerEdit: 'One-tap black car app for people who need to be somewhere and can\'t leave transportation to chance.',
    type: 'Modification',
    transcriptEvidence: '"We built an iPhone app where you tap a button and a black car shows up in five minutes."',
    publicSupport: 'Supported by website and press coverage.',
    publicEvidence: 'one-tap iPhone experience that dispatches a black car',
    publicEvidenceContext: "UberCab's launch press described a one-tap iPhone experience that dispatches a black car to your location in minutes.",
    isSupportedByPublic: true,
    isAccepted: false,
    reviewerNotes: '',
    reviewerDecision: 'Supported'
  },
  {
    id: 'tut-row-customer',
    component: 'Customer',
    baselineText: 'Urban professionals and commuters who need reliable, on-demand transportation around the city.',
    transcriptModification: 'Professionals and event-goers — people out late at night at conferences and dinners who keep getting stranded.',
    reviewerEdit: 'Professionals and event-goers — people out late at night at conferences and dinners who keep getting stranded.',
    type: 'Modification',
    transcriptEvidence: '"Commuters are not our customer... Our customer is the person going somewhere social or professional at night."',
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
    baselineText: 'When traveling around a city and unable to quickly find or hail a traditional taxi.',
    transcriptModification: 'Late-night situations after events and dinners where being stranded has real consequences.',
    reviewerEdit: 'Late-night situations after events and dinners where being stranded has real consequences.',
    type: 'Modification',
    transcriptEvidence: '"The context is specifically late-night situations where being late or stranded has real consequences."',
    publicSupport: 'Partially supported.',
    publicEvidence: 'No cash, no phone dispatch, no uncertainty.',
    publicEvidenceContext: "Early TechCrunch coverage emphasized the seamlessness: open the app, see nearby cars on a map, tap once to request. No cash, no phone dispatch, no uncertainty.",
    isSupportedByPublic: true,
    isAccepted: false,
    reviewerNotes: '',
    reviewerDecision: 'Supported'
  },
  {
    id: 'tut-row-goal',
    component: 'Goal',
    baselineText: 'Get to their destination reliably and comfortably without the hassle of cash or phone dispatch.',
    transcriptModification: 'Eliminate the background anxiety of "how am I getting home" so you can be fully present at what you\'re doing.',
    reviewerEdit: 'Eliminate the background anxiety of "how am I getting home" so you can be fully present at what you\'re doing.',
    type: 'Modification',
    transcriptEvidence: '"They wanted to go out, enjoy their evening, and not have \'how am I getting home\' as a background anxiety the whole time."',
    publicSupport: 'Partially supported.',
    publicEvidence: "everyone's private driver",
    publicEvidenceContext: "UberCab's launch press described the service as \"everyone's private driver\" — a one-tap iPhone experience that dispatches a black car.",
    isSupportedByPublic: true,
    isAccepted: false,
    reviewerNotes: '',
    reviewerDecision: 'Supported'
  },
  {
    id: 'tut-row-barrier',
    component: 'Barrier',
    baselineText: 'Traditional car services are expensive and require booking hours in advance.',
    transcriptModification: 'Existing car service required booking hours in advance — spontaneous use was impossible.',
    reviewerEdit: 'Existing car service required booking hours in advance — spontaneous use was impossible.',
    type: 'Hallucination',
    transcriptEvidence: '"That framing is completely backwards. We were more expensive than a cab. 1.5 to 2x the meter rate... We never positioned around cost savings."',
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
    context: 'Founder explicitly rejected "commuters" — the actual user is the late-night event-goer willing to pay a premium.',
    core: 'Professionals and event-goers out late at night at conferences and client dinners'
  },
  context: {
    context: 'The problem is acute specifically when you\'re out at night after an event and the stakes of being stranded are high.',
    core: 'Late-night events, conferences, and dinners when stranded has real consequences'
  },
  goal: {
    context: 'The goal is psychological, not logistical — eliminating transportation anxiety so you can be present.',
    core: 'Peace of mind about getting home so you can focus on what you\'re doing'
  },
  barrier: {
    context: 'The "expensive car service" barrier is a hallucination — Uber was 1.5–2x cab rates and proud of it. The real barrier was advance-booking inflexibility.',
    core: 'Existing car service required advance booking; no spontaneous option existed'
  }
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
    body: "This tool helps research teams run structured interviews with startup founders. You'll walk through five steps: gather public info → capture the founder's perspective → review the AI baseline → upload the transcript → compare and export.\n\nThis tutorial uses Uber (2010) as the demo case. No real API calls are made.",
    lookFor: '[PLACEHOLDER: What the interviewer should know before their first session]',
    tip: '[PLACEHOLDER: Logistical prep tips before the Zoom call]'
  },
  {
    id: 'tut-public-info',
    wizardStep: WizardStep.PUBLIC_INFO,
    title: 'Step 1 — Public Information',
    body: "Before the interview, you gather public information about the company. Paste the company URL and click Fetch, or upload a text file. Pitchbook data can be pasted separately.\n\nThe demo shows Uber's early 2010 public info already loaded.",
    lookFor: "The public info describes the customer broadly as anyone who wants a private driver. Notice how the LLM will make an inference about cost-consciousness that the founder will later explicitly reject.",
    tip: '[PLACEHOLDER: Best sources for public info in the research context]'
  },
  {
    id: 'tut-baseline',
    wizardStep: WizardStep.PUBLIC_INFO,
    title: 'Step 1 — Generate the Baseline',
    body: "Click \"Generate Baseline\" to have the LLM extract a structured problem statement from the public info. This becomes the artifact you'll show the founder during Part 2 of the interview.\n\nThe demo baseline is pre-generated — see the preview panel below the button.",
    lookFor: "The LLM says the customer is \"urban professionals and commuters\" and lists \"traditional car services are expensive\" as a barrier. The founder will correct both — one is a mismatch, one is a hallucination.",
    tip: "Generate the baseline before the interview starts, so it's ready to show the founder."
  },
  {
    id: 'tut-founder-input',
    wizardStep: WizardStep.FOUNDER_INPUT,
    title: 'Step 2 — Capture Founder Perspective',
    body: "During Part 1 of the interview, capture the founder's unprompted answers to five questions: Solution, Customer, Context, Goal, and Barriers. Each field has a \"View Script\" button with the exact question to read aloud.\n\nThe demo shows Uber's answers already filled in.",
    lookFor: "Compare the founder's Customer answer (\"tech professionals and event-goers\") to the LLM baseline (\"urban professionals and commuters\"). The founder will later say commuters are explicitly NOT the target.",
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
    body: "In Part 2 of the interview, you show the founder the LLM-generated statement and ask them to correct it. Update each field here as the founder reacts.\n\nThe demo shows the reviewed version with the founder's corrections already applied.",
    lookFor: "The Customer field now reads \"tech professionals and event-goers\" — not the LLM's \"commuters.\" The Barrier about cost has been stripped down to reflect only what the founder confirmed.",
    tip: "Read the script at the top of this step before showing the statement to the founder."
  },
  {
    id: 'tut-transcript',
    wizardStep: WizardStep.TRANSCRIPT_UPLOAD,
    title: 'Step 4 — Upload the Transcript',
    body: "After the interview, upload the recording for auto-transcription or paste the transcript text directly. Speaker diarization labels are applied automatically.\n\nThe demo transcript is pre-loaded — it includes both Part 1 (discovery) and Part 2 (baseline feedback).",
    lookFor: "Scroll to the Part 2 section and find the founder's response to the cost barrier: \"That framing is completely backwards. We were more expensive than a cab.\" That's the hallucination moment.",
    tip: '[PLACEHOLDER: Audio file format tips and size limits]'
  },
  {
    id: 'tut-split',
    wizardStep: WizardStep.TRANSCRIPT_UPLOAD,
    requiresSplit: true,
    title: 'Step 4 — Transcript Split',
    body: "The AI splits the transcript into Part 1 (discovery questions) and Part 2 (founder feedback on the LLM baseline). Review and adjust the boundary if needed.\n\nIn the demo, the split falls between the five structured questions and the baseline review section.",
    lookFor: "Part 1 ends after \"The whole experience was opaque and anxiety-inducing.\" Part 2 starts when the interviewer says \"Here's the statement the LLM generated.\"",
    tip: "If the split is off, drag the boundary or edit Part 1 and Part 2 text directly before confirming."
  },
  {
    id: 'tut-split-confirm',
    wizardStep: WizardStep.TRANSCRIPT_UPLOAD,
    requiresSplit: true,
    title: 'Step 4 — Confirm and Analyze',
    body: "Once the split looks right, click \"Confirm Split & Analyze\" to run the comparison. This generates the feedback table using the founder's Part 2 corrections.\n\nIn a real session this takes 10–15 seconds. The demo result is pre-loaded.",
    lookFor: '[PLACEHOLDER: What the three parallel AI calls do]',
    tip: 'The analysis runs three calls in parallel. If one fails, re-run the split step.'
  },
  {
    id: 'tut-comparison',
    wizardStep: WizardStep.PART2_COMPARISON,
    title: 'Step 5 — Review Feedback',
    body: "The comparison table shows how the founder's Part 2 comments map onto the LLM baseline. Each row is typed: Modification (founder changed something), Hallucination (LLM added something never said), Omission (something missing), or Confirmation.\n\nThe demo shows five rows for Uber.",
    lookFor: "The Barrier row is labeled \"Hallucination\" — the LLM inferred that cost was a barrier, but the founder explicitly said Uber was more expensive than taxis and that cost was never a selling point. This is one of the most analytically revealing row types.",
    tip: 'Use the Reviewer Edit field to write a polished version of each component after discussion.'
  },
  {
    id: 'tut-export',
    wizardStep: WizardStep.PART2_COMPARISON,
    title: 'Step 5 — Export',
    body: "When review is complete, click \"Download JSON\" to save the full research record. The JSON includes public info, all statement versions, consent status, transcript, split data, and the comparison table.\n\nThis file is the structured output for the research database.",
    lookFor: '[PLACEHOLDER: What the research team does with the exported JSON]',
    tip: 'Export immediately after review — the tool does not auto-save.'
  }
];
