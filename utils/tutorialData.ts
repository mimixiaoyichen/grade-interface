import type { BaselineStatement, ComparisonRow, ComponentEvidence, TranscriptSplit, StatementResult } from '../types';
import { WizardStep } from '../types';

// ─── Tutorial step definition ─────────────────────────────────────────────────

export interface TutorialStep {
  id: string;
  wizardStep: WizardStep;
  requiresSplit?: boolean;
  title: string;
  body: string;
  lookFor?: string;
  tip?: string;
}

// ─── Tutorial case definition ─────────────────────────────────────────────────
// Each case is a self-contained demo: all data + sidebar steps.

export interface TutorialCase {
  id: string;
  caseLabel: 'clean' | 'hallucination-omission';
  companyName: string;
  tagline: string;
  domain: string;
  cardDescription: string;
  companyUrl: string;
  pitchbookInfo: string;
  publicInfo: string;
  baseline: BaselineStatement;
  founderInput: BaselineStatement;
  transcript: string;
  splitData: TranscriptSplit;
  part1Result: StatementResult;
  comparisonRows: ComparisonRow[];
  componentEvidence: ComponentEvidence;
  part2Notes?: string;
  steps: TutorialStep[];
}

// ─── CASE A: Settle (clean case) ─────────────────────────────────────────────
// LLM gets the basics right. Founder makes two small clarifications:
// narrows customer to creative freelancers and surfaces the relational/social driver.

const SETTLE_PUBLIC_INFO =
  '[OFFICIAL] Source 1: Settle — Invoice less awkwardly\n' +
  'Settle | Simple invoicing for freelancers | settle.app\n\n' +
  'Invoice less awkwardly.\n' +
  'Send invoices in 30 seconds. Get paid faster.\n\n' +
  'Settle is a lightweight invoicing tool for freelancers. Create an invoice, send your client a payment link, and let automatic reminders handle the follow-up. No accounting software required.\n\n' +
  'How it works\n' +
  '1. Fill in client name, project, and amount\n' +
  '2. Send your client a unique payment link — no account needed on their end\n' +
  '3. Auto-reminders go out on your schedule. No manual chasing.\n' +
  '4. Payment goes directly to your bank account.\n\n' +
  'Pricing: Free for up to 3 invoices/month. $12/month for unlimited.\n\n' +
  '------------------------------\n' +
  '[THIRD-PARTY] Source 2: Product Hunt — Settle: invoicing that doesn\'t feel like accounting\n' +
  'producthunt.com\n\n' +
  'Settle hit #3 Product of the Day on launch, driven by comments from designers and photographers frustrated with the complexity of tools like FreshBooks and QuickBooks.\n\n' +
  'The founder replied to questions in the thread: "I\'m building for solo creative freelancers — not agencies, not consultants with retainers. Just people who did a job and need to get paid for it, without setting up an accounting system."\n\n' +
  'The product strips invoicing to the minimum: client name, project, amount, send. Auto-reminders fire without the freelancer having to reach out directly.\n\n' +
  '------------------------------\n' +
  '[THIRD-PARTY] Source 3: Crunchbase — Settle Inc.\n' +
  'crunchbase.com\n\n' +
  'Settle Inc. — Founded 2023\n' +
  'Pre-seed: $320K — angel round\n' +
  'Category: Fintech, Freelance, SaaS\n' +
  'Description: Simple invoicing and payment collection for independent freelancers. Removes the administrative overhead of billing without requiring accounting knowledge.\n\n' +
  'Skipped 1 source due to fetch errors.';

const SETTLE_BASELINE: BaselineStatement = {
  SOLUTION: 'Simple invoicing tool that lets freelancers create and send payment requests in seconds, with automated reminders for follow-up.',
  CUSTOMER_SEGMENT: 'Freelancers and independent contractors who need a simple, low-overhead way to invoice clients and collect payment.',
  LIFE_BUSINESS_CONTEXT: 'After completing a client project and needing to bill for the work without dealing with complex accounting software.',
  JOB_TO_BE_DONE: 'Get paid on time with minimal administrative effort, without having to manually follow up with clients.',
  SPECIFIC_BARRIERS: [
    'Most invoicing tools require accounting knowledge and are too complex for solo freelancers.',
    'Manual payment follow-up is easy to forget and time-consuming to maintain.'
  ]
};

const SETTLE_FOUNDER_INPUT: BaselineStatement = {
  SOLUTION: 'Simple invoicing tool that lets freelancers send payment requests in seconds — auto-reminders handle follow-up so the freelancer never has to chase.',
  CUSTOMER_SEGMENT: 'Creative freelancers — designers, photographers, copywriters. Not developers, who already have options. Definitely not agencies.',
  LIFE_BUSINESS_CONTEXT: 'After finishing a project for a client you want to keep — when you need to collect what you\'re owed but don\'t want to make things awkward.',
  JOB_TO_BE_DONE: 'Get paid the full amount you\'re owed without having to personally ask the client for money.',
  SPECIFIC_BARRIERS: [
    'Most invoicing tools require accounting knowledge and are too complex for solo freelancers.',
    'Asking a client for money directly is uncomfortable when you want to preserve the relationship.'
  ]
};

const SETTLE_TRANSCRIPT = `Interviewer: Let's begin with what you've built. How would you describe your product or solution?

Founder: It's an invoicing tool for freelancers. You fill in the client name, the project, and the amount — takes about thirty seconds — and the client gets a payment link. Then the tool sends reminders automatically until they pay. You never have to chase anyone yourself.

Interviewer: Tell me about the people or organizations that face the problem you are trying to solve. Who are they?

Founder: Creative freelancers — designers, photographers, copywriters. People doing project-based work where the client relationship matters. Not developers, they already have good options and tend to be more technical. Not agencies either — agencies have someone handling billing. My customer is the person who is also their own billing department.

Interviewer: When does this problem occur for your customers? Can you describe the specific situation or moment when they face this challenge?

Founder: Right after finishing a project. You've done the work, you want to get paid, but the client is someone you want to keep and you don't want to make things weird. Sending a reminder yourself feels like you're pushing them. Most of my users were either waiting too long to follow up, or undercharging so they wouldn't have to ask for the full amount.

Interviewer: What are your customers ultimately trying to achieve when they come to you? To be clear, I'm asking about the progress or goals they're seeking — not what your product does.

Founder: Getting paid the full amount without having to personally ask. That's really it. The software asks — not you. So the relationship stays clean.

Interviewer: What prevents your customers from achieving their aspirations or goals if your solution doesn't exist? What specific obstacles stand in their way?

Founder: Two things. First, existing tools — FreshBooks, QuickBooks, even Wave — are built for businesses with accounting needs. My customer doesn't need a balance sheet, they need to send an invoice and get paid. Second, and this is the real one: the follow-up. Asking a client for money directly is uncomfortable, especially when it's someone you want to keep working with. People avoid it or do it badly.

--- PART 2: Baseline Feedback ---

Interviewer: Moving on to the next part of this interview, we'd like your reaction to a few components of the problem statement, similar to the one we just generated together, developed for your startup by an LLM using public information. Please evaluate how accurately the LLM generated problem statement is relative to publicly available information and how you would change the statement.

Founder: The customer segment — "freelancers and independent contractors" is technically correct but way too broad. My customer is specifically in creative fields. Developers already have tools they like and are more likely to build their own. Consultants on retainer have a different billing rhythm. I'm building for the designer who finished a logo project and just needs to get paid.

Interviewer: Anything else?

Founder: The context. "After completing a project and needing to bill without accounting software" is fine, but it misses the relational part. The moment isn't just logistical — it's "I need to collect money from someone I want to keep working with." That's why people avoid following up. It's not a time problem, it's a social friction problem.

Interviewer: What about the goal?

Founder: "Get paid on time with minimal administrative effort" — that's close but it still frames it as an efficiency problem. My users aren't trying to save time. They're trying to avoid an awkward conversation. The goal is getting paid the full amount you're owed without you personally having to ask for it.`;

const SETTLE_SPLIT: TranscriptSplit = {
  part1: `Interviewer: Let's begin with what you've built. How would you describe your product or solution?

Founder: It's an invoicing tool for freelancers. You fill in the client name, the project, and the amount — takes about thirty seconds — and the client gets a payment link. Then the tool sends reminders automatically until they pay. You never have to chase anyone yourself.

Interviewer: Tell me about the people or organizations that face the problem you are trying to solve. Who are they?

Founder: Creative freelancers — designers, photographers, copywriters. People doing project-based work where the client relationship matters. Not developers, they already have good options and tend to be more technical. Not agencies either — agencies have someone handling billing. My customer is the person who is also their own billing department.

Interviewer: When does this problem occur for your customers? Can you describe the specific situation or moment when they face this challenge?

Founder: Right after finishing a project. You've done the work, you want to get paid, but the client is someone you want to keep and you don't want to make things weird. Sending a reminder yourself feels like you're pushing them. Most of my users were either waiting too long to follow up, or undercharging so they wouldn't have to ask for the full amount.

Interviewer: What are your customers ultimately trying to achieve when they come to you? To be clear, I'm asking about the progress or goals they're seeking — not what your product does.

Founder: Getting paid the full amount without having to personally ask. That's really it. The software asks — not you. So the relationship stays clean.

Interviewer: What prevents your customers from achieving their aspirations or goals if your solution doesn't exist? What specific obstacles stand in their way?

Founder: Two things. First, existing tools — FreshBooks, QuickBooks, even Wave — are built for businesses with accounting needs. My customer doesn't need a balance sheet, they need to send an invoice and get paid. Second, and this is the real one: the follow-up. Asking a client for money directly is uncomfortable, especially when it's someone you want to keep working with. People avoid it or do it badly.`,
  part2: `Interviewer: Moving on to the next part of this interview, we'd like your reaction to a few components of the problem statement, similar to the one we just generated together, developed for your startup by an LLM using public information. Please evaluate how accurately the LLM generated problem statement is relative to publicly available information and how you would change the statement.

Founder: The customer segment — "freelancers and independent contractors" is technically correct but way too broad. My customer is specifically in creative fields. Developers already have tools they like and are more likely to build their own. Consultants on retainer have a different billing rhythm. I'm building for the designer who finished a logo project and just needs to get paid.

Interviewer: Anything else?

Founder: The context. "After completing a project and needing to bill without accounting software" is fine, but it misses the relational part. The moment isn't just logistical — it's "I need to collect money from someone I want to keep working with." That's why people avoid following up. It's not a time problem, it's a social friction problem.

Interviewer: What about the goal?

Founder: "Get paid on time with minimal administrative effort" — that's close but it still frames it as an efficiency problem. My users aren't trying to save time. They're trying to avoid an awkward conversation. The goal is getting paid the full amount you're owed without you personally having to ask for it.`,
  reasoning: 'Part 1 ends after the five structured discovery questions. Part 2 begins when the interviewer presents the LLM-generated statement for feedback.'
};

const SETTLE_PART1_RESULT: StatementResult = {
  customers: [
    {
      id: 'sa-c-0',
      description: 'Creative freelancers — designers, photographers, copywriters — doing project-based work where the client relationship matters',
      quotes: ['"My customer is the person who is also their own billing department."'],
      isVerified: false,
      userNotes: ''
    }
  ],
  contexts: [
    {
      id: 'sa-ctx-0',
      description: 'Right after finishing a project for a client they want to keep, when they need to get paid without making things awkward',
      quotes: ['"The client is someone you want to keep and you don\'t want to make things weird."'],
      isVerified: false,
      userNotes: ''
    }
  ],
  goals: [
    {
      id: 'sa-g-0',
      description: 'Get paid the full amount without having to personally ask — keeping the client relationship clean',
      quotes: ['"The software asks — not you. So the relationship stays clean."'],
      isVerified: false,
      userNotes: ''
    }
  ],
  barriers: [
    {
      id: 'sa-b-0',
      description: 'Existing invoicing tools are built for businesses with accountants — too complex for solo freelancers',
      quotes: ['"My customer doesn\'t need a balance sheet, they need to send an invoice and get paid."'],
      isVerified: false,
      userNotes: ''
    },
    {
      id: 'sa-b-1',
      description: 'Asking a client directly for money is socially uncomfortable when you want to preserve the relationship',
      quotes: ['"People avoid it or do it badly."'],
      isVerified: false,
      userNotes: ''
    }
  ],
  draftStatement: "Settle helps creative freelancers get paid the full amount they're owed without personally asking — the software handles follow-up so the client relationship stays clean."
};

const SETTLE_COMPARISON_ROWS: ComparisonRow[] = [
  {
    id: 'sa-row-solution',
    component: 'Solution',
    baselineText: 'Simple invoicing tool that lets freelancers create and send payment requests in seconds, with automated reminders for follow-up.',
    transcriptModification: 'Simple invoicing tool that lets freelancers send payment requests in seconds — auto-reminders handle follow-up so the freelancer never has to chase.',
    reviewerEdit: 'Simple invoicing tool that lets freelancers send payment requests in seconds — auto-reminders handle follow-up so the freelancer never has to chase.',
    type: 'Confirmation',
    transcriptEvidence: '"It\'s an invoicing tool for freelancers... the tool sends reminders automatically until they pay."',
    publicSupport: 'Supported by website and Product Hunt listing.',
    publicEvidence: 'Send invoices in 30 seconds. Auto-reminders go out on your schedule.',
    publicEvidenceContext: "Settle's website describes a 30-second invoice with auto-reminders, matching the founder's description closely.",
    isSupportedByPublic: true,
    isAccepted: false,
    reviewerNotes: '',
    reviewerDecision: 'Supported'
  },
  {
    id: 'sa-row-customer',
    component: 'Customer',
    baselineText: 'Freelancers and independent contractors who need a simple, low-overhead way to invoice clients and collect payment.',
    transcriptModification: 'Creative freelancers — designers, photographers, copywriters — doing project-based work where the client relationship matters.',
    reviewerEdit: 'Creative freelancers — designers, photographers, copywriters — doing project-based work where the client relationship matters.',
    type: 'Modification',
    transcriptEvidence: '"My customer is specifically in creative fields... I\'m building for the designer who finished a logo project and just needs to get paid."',
    publicSupport: 'Partially supported.',
    publicEvidence: 'designers and photographers',
    publicEvidenceContext: "Product Hunt comments mentioned designers and photographers, and the founder's reply in the thread specified creative fields — consistent with the narrowing.",
    isSupportedByPublic: true,
    isAccepted: false,
    reviewerNotes: '',
    reviewerDecision: 'Supported'
  },
  {
    id: 'sa-row-context',
    component: 'Context',
    baselineText: 'After completing a client project and needing to bill for the work without dealing with complex accounting software.',
    transcriptModification: 'After finishing a project for a client you want to keep — when you need to collect what you\'re owed but don\'t want to make things awkward.',
    reviewerEdit: 'After finishing a project for a client you want to keep — when you need to collect what you\'re owed but don\'t want to make things awkward.',
    type: 'Modification',
    transcriptEvidence: '"The client is someone you want to keep and you don\'t want to make things weird... It\'s not a time problem, it\'s a social friction problem."',
    publicSupport: 'Not stated in public info.',
    publicEvidence: '',
    publicEvidenceContext: '',
    isSupportedByPublic: false,
    isAccepted: false,
    reviewerNotes: '',
    reviewerDecision: 'Not supported'
  },
  {
    id: 'sa-row-goal',
    component: 'Goal',
    baselineText: 'Get paid on time with minimal administrative effort, without having to manually follow up with clients.',
    transcriptModification: 'Get paid the full amount you\'re owed without having to personally ask the client for money.',
    reviewerEdit: 'Get paid the full amount you\'re owed without having to personally ask the client for money.',
    type: 'Modification',
    transcriptEvidence: '"They\'re trying to avoid an awkward conversation... getting paid the full amount you\'re owed without you personally having to ask for it."',
    publicSupport: 'Partially supported.',
    publicEvidence: 'No manual chasing.',
    publicEvidenceContext: "Settle's website says 'no manual chasing' — capturing the follow-up angle but not the social/relational dimension the founder emphasizes.",
    isSupportedByPublic: true,
    isAccepted: false,
    reviewerNotes: '',
    reviewerDecision: 'Supported'
  }
];

const SETTLE_COMPONENT_EVIDENCE: ComponentEvidence = {
  customer: {
    context: 'LLM correctly identified freelancers but was too broad. Founder narrowed to creative fields and explicitly excluded developers and agencies.',
    core: 'Creative freelancers (designers, photographers, copywriters) doing project-based work'
  },
  context: {
    context: 'The LLM framed context as logistical — completing a project, needing to bill. The founder corrected this to a relational moment: needing to collect from someone you want to keep.',
    core: 'After finishing a project for a client you want to keep working with'
  },
  goal: {
    context: 'The LLM framed the goal as efficiency ("minimal administrative effort"). The founder corrected this to a social goal: avoiding the personal ask.',
    core: 'Get paid the full amount without personally having to ask the client'
  },
  barrier: {
    context: 'Two confirmed barriers: tool complexity and social friction. Social friction is the more foundational one — it drives avoidance behavior (undercharging, not invoicing).',
    core: 'Social discomfort of asking a valued client for money directly'
  }
};

const SETTLE_STEPS: TutorialStep[] = [
  {
    id: 'tut-welcome',
    wizardStep: WizardStep.PUBLIC_INFO,
    title: 'Welcome to GRADE',
    body: "GRADE is a research protocol we developed to help researchers evaluate and refine AI-generated profiles through structured expert interviews.\n\nThe expert first gives an independent account without seeing the AI-generated profile, then reviews and corrects it. After the interview, AI helps identify corrections and supporting transcript passages for the interviewer to verify.\n\nFollow one example through five stages:\n\n**Pre-interview**\n1. Retrieve public information.\n2. Construct an AI-generated profile.\n\n**Interview**\n3. Blind elicitation: capture the expert's independent account.\n4. Reveal and correct: show the profile and gather field-by-field feedback.\n\n**Post-interview**\n5. Validate: review proposed correction categories and supporting evidence.\n\nThis walkthrough demonstrates the current interface using synthetic data and pre-generated results.",
    lookFor: 'This is the clean case — the LLM baseline will be mostly accurate. Pay attention to how the founder narrows and deepens the customer definition.',
    tip: 'Run through this case first to see what a well-aligned baseline looks like before viewing the second case.'
  },
  {
    id: 'tut-public-info',
    wizardStep: WizardStep.PUBLIC_INFO,
    title: 'Retrieve',
    body: "Before the interview, gather public information about the company. Paste its URL and click Fetch, or upload a text file. You can add PitchBook data separately.\n\nChoose a demo below to explore different extraction outcomes: **Settle** illustrates confirmations and modifications, while **Payday** shows how GRADE surfaces hallucinations and omissions.",
    lookFor: "The Product Hunt source explicitly mentions designers and photographers. Notice that the LLM will correctly identify freelancers as the customer — but with less precision than the founder will provide.",
    tip: 'Multiple source types give the LLM more signal. The more specific the sources, the tighter the baseline.'
  },
  {
    id: 'tut-baseline',
    wizardStep: WizardStep.PUBLIC_INFO,
    title: 'Construct',
    body: "Click \"**Construct Candidate Profile**\" to have the LLM extract a structured problem statement from the evidence base. This candidate profile is the artifact you'll reveal to the subject during the **Reveal & Correct** stage.\n\nThe demo candidate profile is pre-generated — see the preview panel.",
    lookFor: "The candidate profile says the customer is \"freelancers and independent contractors\" and the goal is \"minimal administrative effort.\" The subject will sharpen both — no hallucinations, just refinements.",
    tip: "Generate the baseline before the interview starts, so it's ready to show the founder."
  },
  {
    id: 'tut-consent',
    wizardStep: WizardStep.FOUNDER_INPUT,
    title: 'Recording Consent',
    body: "GRADE embeds consent collection directly into the interview flow. Click the green Consent button before starting the recording — the form covers recording permission and, for non-US subjects, a data privacy addendum.\n\nConsent status is logged to the research record automatically, so there's no separate paperwork for the interviewer to track.",
    tip: 'Log consent before pressing record. The status is captured in the export JSON.'
  },
  {
    id: 'tut-founder-input',
    wizardStep: WizardStep.FOUNDER_INPUT,
    title: 'Blind Elicitation',
    body: "Before revealing the candidate profile, capture the subject's unprompted blind account across five components: **Solution**, **Customer**, **Context**, **Goal**, and **Barriers**. Each field has a \"View Script\" button with the exact question to read aloud.\n\nThe demo shows Settle's answers already filled in.",
    lookFor: "Compare the subject's Customer answer to the candidate profile — same domain (freelancers), but the subject adds specificity: creative fields only, explicitly excludes agencies.",
    tip: 'Read the scripts verbatim to keep interviews consistent across founders.'
  },
  {
    id: 'tut-baseline-review',
    wizardStep: WizardStep.BASELINE_REVIEW,
    title: 'Reveal and Correct',
    body: "Present the candidate profile to the subject and ask them to react to each component. Capture their corrections here as they speak. Update each field as the subject corrects or confirms the extraction.\n\nThe demo shows the corrections being applied — watch the Customer and Context fields update.",
    lookFor: "Customer narrows from 'freelancers and independent contractors' to 'creative freelancers.' Context gains the relational dimension — 'a client you want to keep.' No hallucinations in this case.",
    tip: "Read the script at the top of this step before showing the statement to the founder."
  },
  {
    id: 'tut-transcript',
    wizardStep: WizardStep.TRANSCRIPT_UPLOAD,
    title: 'Upload the Transcript',
    body: "After the interview, upload the recording for auto-transcription or paste the transcript text directly. Speaker diarization labels are applied automatically.\n\nThe demo transcript is pre-loaded — it includes both Part 1 (Blind Elicitation) and Part 2 (Reveal & Correct).",
    lookFor: "In Part 2, the subject reframes the goal from 'efficiency' to 'avoiding an awkward conversation.' That's the key insight not captured in the candidate profile.",
  },
  {
    id: 'tut-split',
    wizardStep: WizardStep.TRANSCRIPT_UPLOAD,
    requiresSplit: true,
    title: 'Transcript Split',
    body: "The AI splits the transcript into Part 1 (Blind Elicitation) and Part 2 (Reveal & Correct — subject's reaction to the candidate profile). Review and adjust the boundary if needed.\n\nIn the demo, the split falls after the five structured questions.",
    lookFor: "Part 1 ends after \"People avoid it or do it badly.\" Part 2 starts when the interviewer reads the candidate profile script.",
    tip: "If the split is off, drag the boundary or edit Part 1 and Part 2 text directly before confirming."
  },
  {
    id: 'tut-split-confirm',
    wizardStep: WizardStep.TRANSCRIPT_UPLOAD,
    requiresSplit: true,
    title: 'Confirm and Analyze',
    body: "Once the split looks right, click \"Confirm Split & Analyze\" to run the comparison. This generates the feedback table using the founder's Part 2 corrections.\n\nIn a real session this takes 10–15 seconds. The demo result is pre-loaded.",
    tip: 'The analysis runs three calls in parallel. If one fails, re-run the split step.'
  },
  {
    id: 'tut-comparison',
    wizardStep: WizardStep.PART2_COMPARISON,
    title: 'Validate',
    body: "Each row in the comparison table is typed: **Modification**, **Hallucination**, **Omission**, or **Confirmation**.\n\nFor each row, the LLM identifies supporting evidence from the transcript — specific quotes where the subject confirmed, challenged, or added to the candidate profile component. Click any row to expand the evidence panel and review the sourced quotes.\n\nThe demo shows four rows for Settle.",
    lookFor: "All rows are Modification or Confirmation — no hallucinations. The candidate profile got the domain right; the subject added precision. This is what a well-supported extraction looks like.",
    tip: 'Use the Reviewer Edit field to write a polished version of each component after discussion.'
  },
  {
    id: 'tut-export',
    wizardStep: WizardStep.PART2_COMPARISON,
    title: 'Export',
    body: "Click **Download JSON** to save the full research record.\n\nThe file includes: source materials (URL, PitchBook), the LLM-generated candidate profile, the founder's blind account, their corrections, the full interview transcript, the transcript split, and the comparison table with LLM-sourced evidence quotes.\n\nThis structured output is the unit of data for cross-case analysis.\n\nUse **Load JSON** to resume from any stage in a future session — the interviewer can pick up exactly where they left off.",
    tip: 'Export immediately after review — the tool does not auto-save.'
  }
];

export const CASE_A: TutorialCase = {
  id: 'case-a',
  caseLabel: 'clean',
  companyName: 'Settle',
  tagline: 'Invoice less awkwardly',
  domain: 'Freelancer invoicing',
  cardDescription: 'LLM gets the basics right. The founder makes two small clarifications — narrows the customer to creative freelancers and surfaces an emotional driver the public copy only hinted at.',
  companyUrl: 'https://settle.app',
  pitchbookInfo:
    'Settle Inc. was founded in 2023 by a former freelance designer frustrated with the overhead of existing invoicing tools. ' +
    'The company raised $320K in a pre-seed angel round. ' +
    'Core product is a lightweight invoicing and payment collection tool for independent creative freelancers. ' +
    'Pricing: free tier (3 invoices/month), $12/month unlimited.',
  publicInfo: SETTLE_PUBLIC_INFO,
  baseline: SETTLE_BASELINE,
  founderInput: SETTLE_FOUNDER_INPUT,
  transcript: SETTLE_TRANSCRIPT,
  splitData: SETTLE_SPLIT,
  part1Result: SETTLE_PART1_RESULT,
  comparisonRows: SETTLE_COMPARISON_ROWS,
  componentEvidence: SETTLE_COMPONENT_EVIDENCE,
  part2Notes: 'Demo (clean case): LLM baseline is mostly accurate. Founder refines customer segment and adds relational framing to context and goal.',
  steps: SETTLE_STEPS
};

// ─── CASE B: Payday (hallucination + omission) ───────────────────────────────
// LLM hallucinates the customer segment (agencies instead of solo freelancers)
// and misses the founder's core insight entirely (social friction / avoidance behavior).

const PAYDAY_PUBLIC_INFO =
  '[OFFICIAL] Source 1: Payday — Get paid, on time\n' +
  'Payday | Automated payment collection | payday.io\n\n' +
  'Get paid, on time.\n' +
  'Stop chasing invoices. Start growing your business.\n\n' +
  'Payday automates your payment collection process. Send invoices, track payment status, and trigger scheduled reminders — all in one place. Built for businesses that bill clients regularly and want to reduce payment delays.\n\n' +
  'Features\n' +
  '- Invoice creation and sending\n' +
  '- Automated payment reminders\n' +
  '- Payment status dashboard\n' +
  '- Client-facing payment portal\n\n' +
  'Pricing: Starts at $19/month.\n\n' +
  '------------------------------\n' +
  '[THIRD-PARTY] Source 2: FinTech Weekly — Payday raises $600K to tackle the late payment problem\n' +
  'fintechweekly.com\n\n' +
  'Payday, a Y Combinator-backed startup, announced a $600K pre-seed round to grow its automated invoicing platform.\n\n' +
  '"Late payments are a $300 billion problem in the US," said the founder. "Small businesses and agencies lose significant revenue every year because following up on invoices manually is inconsistent and easy to deprioritize."\n\n' +
  'The platform targets businesses and independent professionals who bill clients on a project or retainer basis. Initial customer acquisition will focus on small agencies and consulting firms, the founder noted.\n\n' +
  '------------------------------\n' +
  '[THIRD-PARTY] Source 3: Crunchbase — Payday Inc.\n' +
  'crunchbase.com\n\n' +
  'Payday Inc. — Founded 2023\n' +
  'Pre-seed: $600K — Y Combinator, angels\n' +
  'Category: Fintech, B2B Payments, SaaS\n' +
  'Description: Automated invoicing and payment collection platform. Reduces manual payment follow-up through scheduled reminders and a client-facing payment portal.\n\n' +
  'Skipped 2 sources due to fetch errors.';

const PAYDAY_BASELINE: BaselineStatement = {
  SOLUTION: 'Automated invoicing and payment collection platform that sends reminders and tracks payment status across clients.',
  CUSTOMER_SEGMENT: 'Small businesses, agencies, and consulting firms that bill clients regularly and want to reduce payment delays.',
  LIFE_BUSINESS_CONTEXT: 'When managing client billing across multiple projects and trying to maintain consistent payment follow-up.',
  JOB_TO_BE_DONE: 'Reduce payment delays and improve cash flow by automating the invoice follow-up process.',
  SPECIFIC_BARRIERS: [
    'Manual invoice follow-up is inconsistent and easy to deprioritize across multiple client relationships.',
    'Businesses lack visibility into real-time payment status across their client base.'
  ]
};

const PAYDAY_FOUNDER_INPUT: BaselineStatement = {
  SOLUTION: 'Payment collection tool for solo freelancers — send an invoice, let the software send reminders, get paid without an awkward conversation.',
  CUSTOMER_SEGMENT: 'Solo freelancers. Never agencies — agencies have an accounts receivable function. My customer is the person who is both the service provider and the billing department.',
  LIFE_BUSINESS_CONTEXT: 'After finishing a project for a client they want to keep — when they need to collect but don\'t want to be the one asking.',
  JOB_TO_BE_DONE: 'Get paid the full amount you\'re owed without personally chasing the client.',
  SPECIFIC_BARRIERS: [
    'Freelancers will undercharge or not invoice at all rather than have an awkward conversation with a valued client.',
    'Manual follow-up requires the freelancer to personally initiate contact, which many avoid entirely.'
  ]
};

const PAYDAY_TRANSCRIPT = `Interviewer: Let's begin with what you've built. How would you describe your product or solution?

Founder: It's a payment collection tool for freelancers. You create an invoice, send the client a link, and the tool handles all the reminders automatically. The freelancer never has to personally ask the client for money — the software does it.

Interviewer: Tell me about the people or organizations that face the problem you are trying to solve. Who are they?

Founder: Solo freelancers. Designers, photographers, writers — people doing project work where they care about the client relationship. Not agencies. An agency has someone whose job is accounts receivable. My customer is the person who is also their own billing department.

Interviewer: When does this problem occur for your customers? Can you describe the specific situation or moment when they face this challenge?

Founder: Immediately after finishing a project. You've delivered the work, the client is happy, and now you need to ask for money. If it's someone you want to keep working with, that feels risky. A lot of my users were not following up at all, or they were invoicing for less than they were owed because they didn't want to push.

Interviewer: What are your customers ultimately trying to achieve when they come to you? To be clear, I'm asking about the progress or goals they're seeking — not what your product does.

Founder: Get paid the full amount without the conversation. The software sends the reminder — not you. You stay the professional. The relationship doesn't take a hit.

Interviewer: What prevents your customers from achieving their aspirations or goals if your solution doesn't exist? What specific obstacles stand in their way?

Founder: The follow-up. Asking a client directly for money is socially uncomfortable. You can't automate that away with a spreadsheet. Most people avoid it, or do it badly — too apologetic, too late, sometimes not at all. The second thing is that existing tools are overkill. QuickBooks is built for businesses with accountants. My customer needs to send one invoice and get paid.

--- PART 2: Baseline Feedback ---

Interviewer: Moving on to the next part of this interview, we'd like your reaction to a few components of the problem statement, similar to the one we just generated together, developed for your startup by an LLM using public information. Please evaluate how accurately the LLM generated problem statement is relative to publicly available information and how you would change the statement.

Founder: The customer segment. "Small businesses, agencies, and consulting firms" — that's not my customer at all. An agency has a finance function. A consulting firm has retainer agreements and established billing rhythms. I'm building for the solo operator who is both the service provider and the billing department. That's a completely different person with completely different anxieties.

Interviewer: What else?

Founder: The core insight is missing entirely. The press release talked about late payments and cash flow — that framing came from me trying to make it sound like a big market. But when I talk to my actual users, the problem isn't cash flow. It's that they won't ask. They'll undercharge or skip the invoice entirely rather than have a conversation that feels like it might damage the relationship. Payday removes the social friction — the software asks, not you. That insight doesn't appear anywhere in our public copy, and it's the reason people actually buy.`;

const PAYDAY_SPLIT: TranscriptSplit = {
  part1: `Interviewer: Let's begin with what you've built. How would you describe your product or solution?

Founder: It's a payment collection tool for freelancers. You create an invoice, send the client a link, and the tool handles all the reminders automatically. The freelancer never has to personally ask the client for money — the software does it.

Interviewer: Tell me about the people or organizations that face the problem you are trying to solve. Who are they?

Founder: Solo freelancers. Designers, photographers, writers — people doing project work where they care about the client relationship. Not agencies. An agency has someone whose job is accounts receivable. My customer is the person who is also their own billing department.

Interviewer: When does this problem occur for your customers? Can you describe the specific situation or moment when they face this challenge?

Founder: Immediately after finishing a project. You've delivered the work, the client is happy, and now you need to ask for money. If it's someone you want to keep working with, that feels risky. A lot of my users were not following up at all, or they were invoicing for less than they were owed because they didn't want to push.

Interviewer: What are your customers ultimately trying to achieve when they come to you? To be clear, I'm asking about the progress or goals they're seeking — not what your product does.

Founder: Get paid the full amount without the conversation. The software sends the reminder — not you. You stay the professional. The relationship doesn't take a hit.

Interviewer: What prevents your customers from achieving their aspirations or goals if your solution doesn't exist? What specific obstacles stand in their way?

Founder: The follow-up. Asking a client directly for money is socially uncomfortable. You can't automate that away with a spreadsheet. Most people avoid it, or do it badly — too apologetic, too late, sometimes not at all. The second thing is that existing tools are overkill. QuickBooks is built for businesses with accountants. My customer needs to send one invoice and get paid.`,
  part2: `Interviewer: Moving on to the next part of this interview, we'd like your reaction to a few components of the problem statement, similar to the one we just generated together, developed for your startup by an LLM using public information. Please evaluate how accurately the LLM generated problem statement is relative to publicly available information and how you would change the statement.

Founder: The customer segment. "Small businesses, agencies, and consulting firms" — that's not my customer at all. An agency has a finance function. A consulting firm has retainer agreements and established billing rhythms. I'm building for the solo operator who is both the service provider and the billing department. That's a completely different person with completely different anxieties.

Interviewer: What else?

Founder: The core insight is missing entirely. The press release talked about late payments and cash flow — that framing came from me trying to make it sound like a big market. But when I talk to my actual users, the problem isn't cash flow. It's that they won't ask. They'll undercharge or skip the invoice entirely rather than have a conversation that feels like it might damage the relationship. Payday removes the social friction — the software asks, not you. That insight doesn't appear anywhere in our public copy, and it's the reason people actually buy.`,
  reasoning: 'Part 1 ends after the five structured discovery questions. Part 2 begins when the interviewer presents the LLM-generated statement for feedback.'
};

const PAYDAY_PART1_RESULT: StatementResult = {
  customers: [
    {
      id: 'pb-c-0',
      description: 'Solo freelancers — designers, photographers, writers — doing project work where the client relationship matters',
      quotes: ['"My customer is the person who is also their own billing department."'],
      isVerified: false,
      userNotes: ''
    }
  ],
  contexts: [
    {
      id: 'pb-ctx-0',
      description: 'Immediately after finishing a project for a client they want to keep working with',
      quotes: ['"You\'ve delivered the work, the client is happy, and now you need to ask for money."'],
      isVerified: false,
      userNotes: ''
    }
  ],
  goals: [
    {
      id: 'pb-g-0',
      description: 'Get paid the full amount without personally asking — keeping the professional relationship intact',
      quotes: ['"The software sends the reminder — not you. You stay the professional."'],
      isVerified: false,
      userNotes: ''
    }
  ],
  barriers: [
    {
      id: 'pb-b-0',
      description: 'Asking a client directly for money is socially uncomfortable, especially for clients they want to keep',
      quotes: ['"Most people avoid it, or do it badly — too apologetic, too late, sometimes not at all."'],
      isVerified: false,
      userNotes: ''
    },
    {
      id: 'pb-b-1',
      description: 'Existing invoicing tools are built for businesses with accountants — too complex for solo freelancers',
      quotes: ['"QuickBooks is built for businesses with accountants. My customer needs to send one invoice and get paid."'],
      isVerified: false,
      userNotes: ''
    }
  ],
  draftStatement: "Payday helps solo freelancers get paid the full amount they're owed without personally asking — the software sends reminders so the relationship stays clean."
};

const PAYDAY_COMPARISON_ROWS: ComparisonRow[] = [
  {
    id: 'pb-row-solution',
    component: 'Solution',
    baselineText: 'Automated invoicing and payment collection platform that sends reminders and tracks payment status across clients.',
    transcriptModification: 'Payment collection tool for solo freelancers — send an invoice, let the software send reminders, get paid without an awkward conversation.',
    reviewerEdit: 'Payment collection tool for solo freelancers — send an invoice, let the software send reminders, get paid without an awkward conversation.',
    type: 'Modification',
    transcriptEvidence: '"The freelancer never has to personally ask the client for money — the software does it."',
    publicSupport: 'Partially supported.',
    publicEvidence: 'Automated payment reminders and payment status dashboard',
    publicEvidenceContext: "Payday's website describes automated reminders and a payment dashboard, consistent with the core product description.",
    isSupportedByPublic: true,
    isAccepted: false,
    reviewerNotes: '',
    reviewerDecision: 'Supported'
  },
  {
    id: 'pb-row-customer',
    component: 'Customer',
    baselineText: 'Small businesses, agencies, and consulting firms that bill clients regularly and want to reduce payment delays.',
    transcriptModification: 'Solo freelancers — designers, photographers, writers — who are also their own billing department.',
    reviewerEdit: 'Solo freelancers — designers, photographers, writers — who are also their own billing department.',
    type: 'Hallucination',
    transcriptEvidence: '"That\'s not my customer at all. An agency has a finance function... I\'m building for the solo operator who is both the service provider and the billing department."',
    publicSupport: 'Inferred from press release.',
    publicEvidence: 'small agencies and consulting firms',
    publicEvidenceContext: "The founder's press release mentioned 'small agencies and consulting firms' as initial acquisition targets. The LLM took this at face value — the founder says it was aspirational positioning, not a description of actual users.",
    isSupportedByPublic: false,
    isAccepted: false,
    reviewerNotes: '',
    reviewerDecision: 'Not supported'
  },
  {
    id: 'pb-row-context',
    component: 'Context',
    baselineText: 'When managing client billing across multiple projects and trying to maintain consistent payment follow-up.',
    transcriptModification: 'After finishing a project for a client they want to keep — when they need to collect but don\'t want to be the one asking.',
    reviewerEdit: 'After finishing a project for a client they want to keep — when they need to collect but don\'t want to be the one asking.',
    type: 'Modification',
    transcriptEvidence: '"You\'ve delivered the work, the client is happy, and now you need to ask for money. If it\'s someone you want to keep working with, that feels risky."',
    publicSupport: 'Not stated in public info.',
    publicEvidence: '',
    publicEvidenceContext: '',
    isSupportedByPublic: false,
    isAccepted: false,
    reviewerNotes: '',
    reviewerDecision: 'Not supported'
  },
  {
    id: 'pb-row-goal',
    component: 'Goal',
    baselineText: 'Reduce payment delays and improve cash flow by automating the invoice follow-up process.',
    transcriptModification: 'Get paid the full amount without personally asking — keeping the professional relationship intact.',
    reviewerEdit: 'Get paid the full amount without personally asking — keeping the professional relationship intact.',
    type: 'Modification',
    transcriptEvidence: '"The problem isn\'t cash flow. It\'s that they won\'t ask."',
    publicSupport: 'Not supported.',
    publicEvidence: '',
    publicEvidenceContext: "Public copy frames the goal as cash flow — standard B2B positioning. The founder says this was aspirational, not the actual user motivation.",
    isSupportedByPublic: false,
    isAccepted: false,
    reviewerNotes: '',
    reviewerDecision: 'Not supported'
  },
  {
    id: 'pb-row-omission',
    component: 'Barrier',
    baselineText: '',
    transcriptModification: 'Freelancers will undercharge or not invoice at all rather than have a conversation that might damage the client relationship.',
    reviewerEdit: 'Freelancers will undercharge or not invoice at all rather than have a conversation that might damage the client relationship.',
    type: 'Omission',
    transcriptEvidence: '"A lot of my users were not following up at all, or they were invoicing for less than they were owed because they didn\'t want to push."',
    publicSupport: 'Not found in public info.',
    publicEvidence: '',
    publicEvidenceContext: "This avoidance behavior — undercharging and skipping invoices to preserve the relationship — is the founder's core insight and the primary reason users buy. It never appeared in any public copy.",
    isSupportedByPublic: false,
    isAccepted: false,
    reviewerNotes: '',
    reviewerDecision: 'Not supported'
  }
];

const PAYDAY_COMPONENT_EVIDENCE: ComponentEvidence = {
  customer: {
    context: 'The LLM was misled by press release language targeting "small agencies and consulting firms." The founder clarified this was aspirational positioning — actual users are solo freelancers with no billing infrastructure.',
    core: 'Solo freelancers who are also their own billing department'
  },
  context: {
    context: 'The LLM framed context as routine project management. The founder corrected this to a specific emotional moment: needing to collect from someone you want to keep.',
    core: 'After finishing a project for a client they want to keep working with'
  },
  goal: {
    context: 'The LLM inferred a cash-flow goal from corporate-sounding public copy. The founder rejected this — the actual goal is relational: avoid the conversation that risks the relationship.',
    core: 'Get paid without personally having to ask the client'
  },
  barrier: {
    context: 'The core insight — that freelancers undercharge or skip invoices entirely to preserve the relationship — never appeared in public copy. This is a clean Omission: the LLM had no way to know it.',
    core: 'Freelancers avoid asking for what they\'re owed to protect valued client relationships'
  }
};

const PAYDAY_STEPS: TutorialStep[] = [
  {
    id: 'tut-welcome',
    wizardStep: WizardStep.PUBLIC_INFO,
    title: 'Welcome to GRADE',
    body: "GRADE is a research protocol we developed to help researchers evaluate and refine AI-generated profiles through structured expert interviews.\n\nThe expert first gives an independent account without seeing the AI-generated profile, then reviews and corrects it. After the interview, AI helps identify corrections and supporting transcript passages for the interviewer to verify.\n\nFollow one example through five stages:\n\n**Pre-interview**\n1. Retrieve public information.\n2. Construct an AI-generated profile.\n\n**Interview**\n3. Blind elicitation: capture the expert's independent account.\n4. Reveal and correct: show the profile and gather field-by-field feedback.\n\n**Post-interview**\n5. Validate: review proposed correction categories and supporting evidence.\n\nThis walkthrough demonstrates the current interface using synthetic data and pre-generated results.",
    lookFor: 'This is the messy case — the LLM will hallucinate the customer segment and miss the founder\'s core insight entirely. Pay attention to how the interview surfaces what the public copy couldn\'t.',
    tip: 'Run Case A (Settle) first to see what a clean baseline looks like before comparing.'
  },
  {
    id: 'tut-public-info',
    wizardStep: WizardStep.PUBLIC_INFO,
    title: 'Retrieve',
    body: "Before the interview, gather the evidence base: public information about the company. Paste the company URL and click Fetch, or upload a text file. Pitchbook data can be added separately.\n\nThe demo shows Payday's public info already loaded — website, FinTech Weekly article, and Crunchbase entry.",
    lookFor: "Notice the press release says 'small agencies and consulting firms' as the initial acquisition target. The LLM will take this at face value. The founder will later say this was aspirational positioning — not actual users.",
    tip: 'Corporate-sounding press releases often describe aspirational markets, not actual early users. This is a common source of LLM hallucination.'
  },
  {
    id: 'tut-baseline',
    wizardStep: WizardStep.PUBLIC_INFO,
    title: 'Construct',
    body: "Click \"**Construct Candidate Profile**\" to have the LLM extract a structured problem statement from the evidence base. This candidate profile is the artifact you'll reveal to the subject during the **Reveal & Correct** stage.\n\nThe demo candidate profile is pre-generated — see the preview panel.",
    lookFor: "The candidate profile says the customer is 'small businesses, agencies, and consulting firms.' Watch for the subject's reaction in Reveal & Correct — this is a hallucination, not just an imprecision.",
    tip: "Generate the baseline before the interview starts, so it's ready to show the founder."
  },
  {
    id: 'tut-consent',
    wizardStep: WizardStep.FOUNDER_INPUT,
    title: 'Recording Consent',
    body: "GRADE embeds consent collection directly into the interview flow. Click the green Consent button before starting the recording — the form covers recording permission and, for non-US subjects, a data privacy addendum.\n\nConsent status is logged to the research record automatically, so there's no separate paperwork for the interviewer to track.",
    tip: 'Log consent before pressing record. The status is captured in the export JSON.'
  },
  {
    id: 'tut-founder-input',
    wizardStep: WizardStep.FOUNDER_INPUT,
    title: 'Blind Elicitation',
    body: "Before revealing the candidate profile, capture the subject's unprompted blind account across five components: Solution, Customer, Context, Goal, and Barriers. Each field has a \"View Script\" button with the exact question to read aloud.\n\nThe demo shows Payday's answers already filled in.",
    lookFor: "The subject's Customer answer mentions 'solo freelancers' and explicitly excludes agencies. This will directly contradict the candidate profile — the hallucination will be visible in the comparison table.",
    tip: 'Read the scripts verbatim to keep interviews consistent across founders.'
  },
  {
    id: 'tut-baseline-review',
    wizardStep: WizardStep.BASELINE_REVIEW,
    title: 'Reveal and Correct',
    body: "Present the candidate profile to the subject and ask them to react to each component. Capture their corrections here as they speak. Update each field as the subject corrects or confirms the extraction.\n\nThe demo shows the corrections being applied — watch the Customer and Goal fields update.",
    lookFor: "Customer changes from 'agencies and consulting firms' to 'solo freelancers.' Goal changes from 'improve cash flow' to 'get paid without personally asking.' Both are significant corrections.",
    tip: "Read the script at the top of this step before showing the statement to the founder."
  },
  {
    id: 'tut-transcript',
    wizardStep: WizardStep.TRANSCRIPT_UPLOAD,
    title: 'Upload the Transcript',
    body: "After the interview, upload the recording for auto-transcription or paste the transcript text directly. Speaker diarization labels are applied automatically.\n\nThe demo transcript is pre-loaded — it includes both Part 1 (Blind Elicitation) and Part 2 (Reveal & Correct).",
    lookFor: "In Part 2, watch for the subject's line: 'The core insight is missing entirely... they won't ask.' This is the Omission — an insight that never appeared in the candidate profile.",
  },
  {
    id: 'tut-split',
    wizardStep: WizardStep.TRANSCRIPT_UPLOAD,
    requiresSplit: true,
    title: 'Transcript Split',
    body: "The AI splits the transcript into Part 1 (Blind Elicitation) and Part 2 (Reveal & Correct — subject's reaction to the candidate profile). Review and adjust the boundary if needed.\n\nIn the demo, the split falls after the five structured questions.",
    lookFor: "Part 1 ends after 'My customer needs to send one invoice and get paid.' Part 2 starts when the interviewer reads the candidate profile script.",
    tip: "If the split is off, drag the boundary or edit Part 1 and Part 2 text directly before confirming."
  },
  {
    id: 'tut-split-confirm',
    wizardStep: WizardStep.TRANSCRIPT_UPLOAD,
    requiresSplit: true,
    title: 'Confirm and Analyze',
    body: "Once the split looks right, click \"Confirm Split & Analyze\" to run the comparison. This generates the feedback table using the founder's Part 2 corrections.\n\nIn a real session this takes 10–15 seconds. The demo result is pre-loaded.",
    tip: 'The analysis runs three calls in parallel. If one fails, re-run the split step.'
  },
  {
    id: 'tut-comparison',
    wizardStep: WizardStep.PART2_COMPARISON,
    title: 'Validate',
    body: "Each row in the comparison table is typed: **Modification**, **Hallucination**, **Omission**, or **Confirmation**.\n\nFor each row, the LLM identifies supporting evidence from the transcript — specific quotes where the subject confirmed, challenged, or added to the candidate profile component. Click any row to expand the evidence panel and review the sourced quotes.\n\nThe demo shows five rows for Payday.",
    lookFor: "The Customer row is labeled 'Hallucination' — the LLM inferred agencies from a press release, but the subject says agencies are explicitly not the customer. The final Barrier row is an 'Omission' — the avoidance behavior insight never appeared publicly.",
    tip: 'Use the Reviewer Edit field to write a polished version of each component after discussion.'
  },
  {
    id: 'tut-export',
    wizardStep: WizardStep.PART2_COMPARISON,
    title: 'Export',
    body: "Click **Download JSON** to save the full research record.\n\nThe file includes: source materials (URL, PitchBook), the LLM-generated candidate profile, the founder's blind account, their corrections, the full interview transcript, the transcript split, and the comparison table with LLM-sourced evidence quotes.\n\nThis structured output is the unit of data for cross-case analysis.\n\nUse **Load JSON** to resume from any stage in a future session — the interviewer can pick up exactly where they left off.",
    tip: 'Export immediately after review — the tool does not auto-save.'
  }
];

export const CASE_B: TutorialCase = {
  id: 'case-b',
  caseLabel: 'hallucination-omission',
  companyName: 'Payday',
  tagline: 'Get paid, on time',
  domain: 'Freelancer invoicing',
  cardDescription: 'LLM hallucinates the customer segment (infers agencies from a press release) and misses the founder\'s core insight entirely. A clean example of what generic public copy does to the baseline.',
  companyUrl: 'https://payday.io',
  pitchbookInfo:
    'Payday Inc. was founded in 2023 by a Y Combinator alum. ' +
    'The company raised $600K in a pre-seed round from YC and angels. ' +
    'Core product is an automated invoicing and payment collection tool targeting independent freelancers. ' +
    'Pricing starts at $19/month.',
  publicInfo: PAYDAY_PUBLIC_INFO,
  baseline: PAYDAY_BASELINE,
  founderInput: PAYDAY_FOUNDER_INPUT,
  transcript: PAYDAY_TRANSCRIPT,
  splitData: PAYDAY_SPLIT,
  part1Result: PAYDAY_PART1_RESULT,
  comparisonRows: PAYDAY_COMPARISON_ROWS,
  componentEvidence: PAYDAY_COMPONENT_EVIDENCE,
  part2Notes: 'Demo (hallucination + omission case): LLM hallucinated the customer segment from press release language. The avoidance behavior insight (undercharging to avoid asking) never appeared in public copy.',
  steps: PAYDAY_STEPS
};

// ─── All cases (ordered for dashboard display) ────────────────────────────────

export const TUTORIAL_CASES: TutorialCase[] = [CASE_A, CASE_B];
