
export interface AnalysisItem {
  id: string;
  description: string;
  quotes: string[];
  isVerified: boolean;
  userNotes: string;
  publicEvidence?: string;
  isSupportedByPublic?: boolean;
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
  type: 'Modification' | 'Omission' | 'Hallucination' | 'Confirmation';
  transcriptEvidence: string;
  publicSupport: string; // "Supported: [Quote]" or "Not supported"
  isAccepted: boolean; // If user accepts the modification
}

export interface ComparisonResult {
  rows: ComparisonRow[];
}

// Raw responses
export interface AIAnalysisResponse {
  customers: { description: string; quotes: string[]; publicEvidence: string; isSupportedByPublic: boolean }[];
  contexts: { description: string; quotes: string[]; publicEvidence: string; isSupportedByPublic: boolean }[];
  goals: { description: string; quotes: string[]; publicEvidence: string; isSupportedByPublic: boolean }[];
  barriers: { description: string; quotes: string[]; publicEvidence: string; isSupportedByPublic: boolean }[];
  finalStatement: string;
}

export enum AppStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}
