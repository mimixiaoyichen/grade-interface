
export interface AnalysisItem {
  id: string;
  description: string;
  quotes: string[];
  isVerified: boolean;
  userNotes: string;
  publicEvidence?: string;
  isSupportedByPublic?: boolean;
  publicEvidenceContext?: string;
}

export interface AnalysisSection {
  items: AnalysisItem[];
}

export interface StatementResult {
  customers: AnalysisItem[];
  contexts: AnalysisItem[];
  goals: AnalysisItem[];
  barriers: AnalysisItem[];
  draftStatement: string;
}

export interface FullAnalysisResult {
  part1: StatementResult;
  part2: StatementResult;
}

export interface TranscriptSplit {
  part1: string;
  part2: string;
  reasoning: string;
}

// --- New Types for Wizard Flow ---

export enum WizardStep {
  PUBLIC_INFO = 0,
  FOUNDER_INPUT = 1,
  BASELINE_REVIEW = 2,
  TRANSCRIPT_UPLOAD = 3,
  PART1_ANALYSIS = 4,
  PART2_COMPARISON = 5,
}

export interface BaselineStatement {
  SOLUTION: string;
  CUSTOMER_SEGMENT: string;
  LIFE_BUSINESS_CONTEXT: string;
  JOB_TO_BE_DONE: string;
  SPECIFIC_BARRIERS: string[];
}

export interface ComparisonRow {
  id: string;
  component: 'Customer' | 'Context' | 'Goal' | 'Barrier';
  baselineText: string;
  transcriptModification: string; // The "Correction" or "New Finding"
  reviewerEdit?: string; // Interviewer's version of the modification
  type: 'Modification' | 'Omission' | 'Hallucination' | 'Confirmation';
  transcriptEvidence: string;
  publicSupport: string; // "Supported: [Quote]" or "Not supported"
  publicEvidence?: string; // exact quote from public info
  publicEvidenceContext?: string; // surrounding context from public info
  isSupportedByPublic?: boolean;
  isAccepted: boolean; // If user accepts the modification
  reviewerNotes?: string;
  reviewerDecision?: 'keep' | 'discard';
}

export interface ComponentEvidence {
  customer: { context: string; core: string };
  context: { context: string; core: string };
  goal: { context: string; core: string };
  barrier: { context: string; core: string };
}

export interface ComparisonResult {
  rows: ComparisonRow[];
}

export interface TranscriptionResult {
  text: string;
  diarizedText: string;
  segments?: Array<{
    speaker?: number;
    start?: number;
    end?: number;
    text?: string;
  }>;
  words?: any[];
  speakers?: number;
}

// Raw responses
export interface AIAnalysisResponse {
  customers: { description: string; quotes: string[]; publicEvidence: string; publicEvidenceContext?: string; isSupportedByPublic: boolean }[];
  contexts: { description: string; quotes: string[]; publicEvidence: string; publicEvidenceContext?: string; isSupportedByPublic: boolean }[];
  goals: { description: string; quotes: string[]; publicEvidence: string; publicEvidenceContext?: string; isSupportedByPublic: boolean }[];
  barriers: { description: string; quotes: string[]; publicEvidence: string; publicEvidenceContext?: string; isSupportedByPublic: boolean }[];
  finalStatement: string;
}

export enum AppStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}
