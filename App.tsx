
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import SplitVerifier from './components/SplitVerifier';
import BaselineReview from './components/BaselineReview';
import ProblemCharacteristics, { ProblemCharacteristicsData } from './components/ProblemCharacteristics';
import ComparisonTable from './components/ComparisonTable';
import {
  analyzeSegment, 
  splitTranscript, 
  generateBaselineStatement, 
  generateComparison,
  fetchPublicInfoFromUrl,
  extractComponentEvidence,
  checkPublicSupportForItems,
  transcribeAudioWithDiarization
} from './services/aiService';
import type { BaselineComponentLayerResult } from './services/aiService';
import buildExportJson from './utils/buildExportJson';
import {
  AppStatus, 
  StatementResult, 
  TranscriptSplit, 
  AIAnalysisResponse,
  WizardStep,
  BaselineStatement,
  ComparisonRow,
  ComponentEvidence,
  SupportCheckItem,
  SupportRowState
} from './types';
import { getGuideSections } from './utils/guideContent';
import type { GuideSection } from './utils/guideContent';
import StepIndicator from './components/StepIndicator';
import SpeakerModal from './components/SpeakerModal';
import Part2Comparison from './components/Part2Comparison';
import ConsentModal from './components/ConsentModal';
import TutorialSidebar from './components/TutorialSidebar';
import TutorialWelcome from './components/TutorialWelcome';
import {
  TUTORIAL_STEPS,
  TUTORIAL_COMPANY_URL,
  TUTORIAL_PITCHBOOK,
  TUTORIAL_PUBLIC_INFO as TUTORIAL_PUBLIC_INFO_TEXT,
  TUTORIAL_BASELINE,
  TUTORIAL_FOUNDER_INPUT as TUTORIAL_FOUNDER_INPUT_DATA,
  TUTORIAL_TRANSCRIPT,
  TUTORIAL_SPLIT,
  TUTORIAL_PART1_RESULT,
  TUTORIAL_COMPARISON_ROWS,
  TUTORIAL_COMPONENT_EVIDENCE,
  TUTORIAL_PROBLEM_CHARACTERISTICS,
  type TutorialStep
} from './utils/tutorialData';
import { getTranslation, TranslationContext, useT, LocaleKey } from './utils/strings';
import { stripBarrierLeadIn, stripBarrierLeadInList } from './utils/barriers';
import {
  parseImportedProblemCharacteristics,
  type ProblemCharacteristicsRaw
} from './utils/problemCharacteristics';
import { INCLUDE_BARRIERS_IN_REVIEW_AND_FEEDBACK } from './utils/featureFlags';
import {
  createShuffledBaselineReviewFieldOrder,
  resolveBaselineReviewFieldOrder,
  type BaselineReviewField
} from './utils/baselineReviewOrder';

const getComponentText = (
  source: BaselineStatement | null | undefined,
  component: ComparisonRow['component']
) => {
  if (!source) return '';
  switch (component) {
    case 'Solution': return source.SOLUTION || '';
    case 'Customer': return source.CUSTOMER_SEGMENT || '';
    case 'Context': return source.LIFE_BUSINESS_CONTEXT || '';
    case 'Goal': return source.JOB_TO_BE_DONE || '';
    case 'Barrier': return stripBarrierLeadInList(source.SPECIFIC_BARRIERS || []).join('; ');
    default: return '';
  }
};

const buildSupportState = (rows: ComparisonRow[]) =>
  rows.reduce<Record<string, SupportRowState>>((acc, row) => {
    acc[row.id] = {
      omissions: [{ id: `${row.id}-om-0`, text: '', type: 'Omission' }],
      hallucinations: [{ id: `${row.id}-ha-0`, text: '', type: 'Hallucination' }],
      loading: false,
      statusMessage: ''
    };
    return acc;
  }, {});


const INITIAL_STATEMENT: BaselineStatement = {
  SOLUTION: '',
  CUSTOMER_SEGMENT: '',
  LIFE_BUSINESS_CONTEXT: '',
  JOB_TO_BE_DONE: '',
  SPECIFIC_BARRIERS: ['']
};

// Toggle Helper
const stripIndent = (text: string) =>
  text
    .replace(/\r/g, '')
    .replace(/\n[ \t]+/g, '\n')
    .trim();

type TourSample = {
  companyUrl: string;
  pitchbookInfo: string;
  publicInfo: string;
  baseline: BaselineStatement;
  founderInput: BaselineStatement;
  transcript: string;
  splitData?: TranscriptSplit;
  part1Result?: StatementResult;
  comparisonRows: ComparisonRow[];
  componentEvidence: ComponentEvidence;
  problemCharacteristicsData?: ProblemCharacteristicsData;
  part2Notes?: string;
};

const TOUR_SAMPLE_CONTENT: Record<LocaleKey, TourSample> = {
  en: {
    companyUrl: TUTORIAL_COMPANY_URL,
    pitchbookInfo: TUTORIAL_PITCHBOOK,
    publicInfo: TUTORIAL_PUBLIC_INFO_TEXT,
    baseline: TUTORIAL_BASELINE,
    founderInput: TUTORIAL_FOUNDER_INPUT_DATA,
    transcript: TUTORIAL_TRANSCRIPT,
    splitData: TUTORIAL_SPLIT,
    part1Result: TUTORIAL_PART1_RESULT,
    comparisonRows: TUTORIAL_COMPARISON_ROWS,
    componentEvidence: TUTORIAL_COMPONENT_EVIDENCE,
    problemCharacteristicsData: TUTORIAL_PROBLEM_CHARACTERISTICS,
    part2Notes: "Demo: notice the Barrier row — the LLM described a compliance concern the founder explicitly said they've never stated publicly."
  },
  zh: {
    companyUrl: TUTORIAL_COMPANY_URL,
    pitchbookInfo: TUTORIAL_PITCHBOOK,
    publicInfo: TUTORIAL_PUBLIC_INFO_TEXT,
    baseline: TUTORIAL_BASELINE,
    founderInput: TUTORIAL_FOUNDER_INPUT_DATA,
    transcript: TUTORIAL_TRANSCRIPT,
    splitData: TUTORIAL_SPLIT,
    part1Result: TUTORIAL_PART1_RESULT,
    comparisonRows: TUTORIAL_COMPARISON_ROWS,
    componentEvidence: TUTORIAL_COMPONENT_EVIDENCE,
    problemCharacteristicsData: TUTORIAL_PROBLEM_CHARACTERISTICS,
  }
};

export const ScriptDropdown = ({ title, children }) => {
  const { common } = useT();
  const resolvedTitle = title || common.viewScript;
  return (
    <details className="w-full group">
      <summary className="list-none cursor-pointer select-none text-xs text-gray-500 flex items-center gap-2 justify-end">
        <span className="font-medium text-sm">{resolvedTitle}</span>
      <svg
        className="w-4 h-4 transform transition-transform duration-150 group-open:rotate-180"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M5.23 7.21a.75.75 0 011.06.02L10 11.584l3.71-4.354a.75.75 0 011.14.98l-4.25 5a.75.75 0 01-1.14 0l-4.25-5a.75.75 0 01.02-1.06z"
          clipRule="evenodd"
        />
      </svg>
    </summary>

      <div className="w-full mt-3 p-4 bg-gray-50 rounded border border-gray-100 text-sm text-gray-600">
        {children}
      </div>
    </details>
  );
};

function App() {
  const [step, setStep] = useState<WizardStep>(WizardStep.PUBLIC_INFO);
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const importFileInputRef = useRef<HTMLInputElement | null>(null);
  const tourSnapshotRef = useRef<any>(null);
  const [locale, setLocale] = useState<LocaleKey>('en');
  const t = getTranslation(locale);
  const { common, errors, statuses } = t;
  const tourSampleRef = useRef<TourSample | null>(null);

  // --- State Data ---
  
  // Step 1: Public Info
  const [publicInfo, setPublicInfo] = useState<string>('');
  const [companyUrl, setCompanyUrl] = useState<string>('');
  const [pitchbookInfo, setPitchbookInfo] = useState<string>('');
  
  // Step 2: Founder Input (Now Structured)
  const [founderInput, setFounderInput] = useState<BaselineStatement>(INITIAL_STATEMENT);

  // Step 3: Baseline
  const [baselineStatement, setBaselineStatement] = useState<BaselineStatement | null>(null);
  const [baselineReviewFieldOrder, setBaselineReviewFieldOrder] = useState<BaselineReviewField[]>([]);
  const [baselineGenerated, setBaselineGenerated] = useState<BaselineStatement | null>(null);
  const [baselineLLM, setBaselineLLM] = useState<BaselineStatement | null>(null);
  const [baselineLLMRaw4o, setBaselineLLMRaw4o] = useState<BaselineStatement | null>(null);
  const [baselineGpt52Layer, setBaselineGpt52Layer] = useState<BaselineComponentLayerResult | null>(null);
  const [baselineSource, setBaselineSource] = useState<string>('');
  const [baselineLocale, setBaselineLocale] = useState<LocaleKey>('en');

  // Step 3b: Problem Characteristics
  const [problemCharacteristicsData, setProblemCharacteristicsData] = useState<ProblemCharacteristicsData | undefined>(undefined);
  const [problemCharacteristicsRaw, setProblemCharacteristicsRaw] = useState<ProblemCharacteristicsRaw | null>(null);

  // Step 4: Transcript Part 1
  const [transcript, setTranscript] = useState<string>('');
  const [splitData, setSplitData] = useState<TranscriptSplit | null>(null);
  const [part1Result, setPart1Result] = useState<StatementResult | null>(null);

  // Step 5: Part 2 Comparison
  const [comparisonRows, setComparisonRows] = useState<ComparisonRow[]>([]);
  const [componentEvidence, setComponentEvidence] = useState<ComponentEvidence | null>(null);
  const [supportByRow, setSupportByRow] = useState<Record<string, SupportRowState>>({});

  // UI helpers
  const [isStatementOpen, setIsStatementOpen] = useState(true);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [showGuideGlow, setShowGuideGlow] = useState(false);
  const [hasFetchedPublicInfo, setHasFetchedPublicInfo] = useState(false);
  const [part2Notes, setPart2Notes] = useState<string>('');
  const [transcriptionStatus, setTranscriptionStatus] = useState<string>('');
  const [isTranscribingAudio, setIsTranscribingAudio] = useState<boolean>(false);
  const [diarizedPreview, setDiarizedPreview] = useState<string>('');
  const [speakerLabels, setSpeakerLabels] = useState<string[]>([]);
  const [speakerMapping, setSpeakerMapping] = useState<Record<string, string>>({});
  const [showSpeakerModal, setShowSpeakerModal] = useState<boolean>(false);
  const [isConsentOpen, setIsConsentOpen] = useState<boolean>(false);
  const [founderRecordConsent, setFounderRecordConsent] = useState<boolean>(false);
  const [internationalFounder, setInternationalFounder] = useState<boolean>(false);
  const [founderDataConsent, setFounderDataConsent] = useState<boolean>(false);
  const [isTourOpen, setIsTourOpen] = useState<boolean>(false);
  const [tourStepIndex, setTourStepIndex] = useState<number>(0);
  const [showWelcomeModal, setShowWelcomeModal] = useState<boolean>(false);

  useEffect(() => {
    const hasSeen = localStorage.getItem('guide_seen');
    if (!hasSeen) {
      setShowGuideGlow(true);
    }
  }, []);

  useEffect(() => {
    setShowWelcomeModal(true);
  }, []);

  const tourSteps: TutorialStep[] = TUTORIAL_STEPS;

  const applyTourData = useCallback(() => {
    const sample = TOUR_SAMPLE_CONTENT.en;
    const combinedSource = [sample.pitchbookInfo, sample.publicInfo].filter(Boolean).join('\n\n').trim();
    tourSampleRef.current = sample;
    setStatus(AppStatus.IDLE);
    setErrorMsg('');
    setCompanyUrl(sample.companyUrl);
    setPitchbookInfo(sample.pitchbookInfo);
    setPublicInfo(sample.publicInfo);
    setBaselineSource(combinedSource);
    setHasFetchedPublicInfo(true);
    setBaselineStatement(sample.baseline);
    setBaselineReviewFieldOrder(createShuffledBaselineReviewFieldOrder());
    setBaselineGenerated(sample.baseline);
    setBaselineLLM(sample.baseline);
    setBaselineLLMRaw4o(sample.baseline);
    setBaselineGpt52Layer(null);
    setFounderInput(sample.founderInput || sample.baseline);
    setProblemCharacteristicsData(sample.problemCharacteristicsData);
    setProblemCharacteristicsRaw(null);
    setTranscript(sample.transcript);
    setDiarizedPreview(sample.transcript);
    setSplitData(null);
    setPart1Result(sample.part1Result || null);
    setComparisonRows(sample.comparisonRows);
    setSupportByRow(buildSupportState(sample.comparisonRows));
    setComponentEvidence(sample.componentEvidence);
    setPart2Notes(sample.part2Notes || '');
    setShowSpeakerModal(false);
    setSpeakerLabels([]);
    setSpeakerMapping({});
    setTranscriptionStatus('');
    setIsTranscribingAudio(false);
    setIsConsentOpen(false);
  }, []);

  const startTour = () => {
    if (isTourOpen) return;
    tourSnapshotRef.current = {
      step,
      status,
      errorMsg,
      companyUrl,
      pitchbookInfo,
      publicInfo,
      baselineSource,
      hasFetchedPublicInfo,
      baselineStatement,
      baselineReviewFieldOrder,
      baselineGenerated,
      baselineLLM,
      baselineLLMRaw4o,
      baselineGpt52Layer,
      founderInput,
      problemCharacteristicsData,
      problemCharacteristicsRaw,
      transcript,
      splitData,
      part1Result,
      comparisonRows,
      componentEvidence,
      supportByRow,
      part2Notes,
      diarizedPreview,
      transcriptionStatus,
      isTranscribingAudio,
      showGuideGlow,
      isGuideOpen,
      founderRecordConsent,
      internationalFounder,
      founderDataConsent,
      isConsentOpen,
      showSpeakerModal,
      speakerLabels,
      speakerMapping
    };
    setIsTourOpen(true);
    setIsGuideOpen(false);
    setShowGuideGlow(false);
    applyTourData();
    setStep(WizardStep.PUBLIC_INFO);
    setTourStepIndex(0);
  };

  const closeTour = () => {
    const snapshot = tourSnapshotRef.current;
    setIsTourOpen(false);
    setTourStepIndex(0);
    if (!snapshot) return;
    setStep(snapshot.step);
    setStatus(snapshot.status);
    setErrorMsg(snapshot.errorMsg);
    setCompanyUrl(snapshot.companyUrl);
    setPitchbookInfo(snapshot.pitchbookInfo);
    setPublicInfo(snapshot.publicInfo);
    setBaselineSource(snapshot.baselineSource);
    setHasFetchedPublicInfo(snapshot.hasFetchedPublicInfo);
    setBaselineStatement(snapshot.baselineStatement);
    setBaselineReviewFieldOrder(snapshot.baselineReviewFieldOrder || []);
    setBaselineGenerated(snapshot.baselineGenerated);
    setBaselineLLM(snapshot.baselineLLM);
    setBaselineLLMRaw4o(snapshot.baselineLLMRaw4o || null);
    setBaselineGpt52Layer(snapshot.baselineGpt52Layer || null);
    setFounderInput(snapshot.founderInput);
    setProblemCharacteristicsData(snapshot.problemCharacteristicsData);
    setProblemCharacteristicsRaw(snapshot.problemCharacteristicsRaw || null);
    setTranscript(snapshot.transcript);
    setSplitData(snapshot.splitData);
    setPart1Result(snapshot.part1Result);
    setComparisonRows(snapshot.comparisonRows || []);
    setSupportByRow(snapshot.supportByRow || {});
    setComponentEvidence(snapshot.componentEvidence || null);
    setPart2Notes(snapshot.part2Notes || '');
    setDiarizedPreview(snapshot.diarizedPreview || '');
    setTranscriptionStatus(snapshot.transcriptionStatus || '');
    setIsTranscribingAudio(Boolean(snapshot.isTranscribingAudio));
    setShowSpeakerModal(Boolean(snapshot.showSpeakerModal));
    setSpeakerLabels(snapshot.speakerLabels || []);
    setSpeakerMapping(snapshot.speakerMapping || {});
    setIsConsentOpen(Boolean(snapshot.isConsentOpen));
    setFounderRecordConsent(Boolean(snapshot.founderRecordConsent));
    setInternationalFounder(Boolean(snapshot.internationalFounder));
    setFounderDataConsent(Boolean(snapshot.founderDataConsent));
    setShowGuideGlow(Boolean(snapshot.showGuideGlow));
    setIsGuideOpen(Boolean(snapshot.isGuideOpen));
    tourSnapshotRef.current = null;
  };

  const handleTourNext = () => {
    setTourStepIndex((idx) => Math.min(idx + 1, tourSteps.length - 1));
  };

  const handleTourPrev = () => {
    setTourStepIndex((idx) => Math.max(idx - 1, 0));
  };

  useEffect(() => {
    if (!isTourOpen) return;
    const current = tourSteps[tourStepIndex];
    if (current) {
      setStep(current.wizardStep);
    }
  }, [isTourOpen, tourSteps, tourStepIndex]);

  useEffect(() => {
    if (isTourOpen) {
      applyTourData();
    }
  }, [applyTourData, isTourOpen]);

  useEffect(() => {
    if (!isTourOpen) return;
    const needsSplit = Boolean(tourSteps[tourStepIndex]?.requiresSplit);
    if (needsSplit) {
      const sampleSplit = tourSampleRef.current?.splitData;
      if (sampleSplit) {
        setSplitData(sampleSplit);
      }
    } else {
      setSplitData(null);
    }
  }, [isTourOpen, tourSteps, tourStepIndex]);

  // --- Logic & Handlers ---

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (s: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => setter(event.target?.result as string);
    reader.readAsText(file);
  };

  const resetTranscriptFlow = () => {
    setSplitData(null);
    setPart1Result(null);
    setComparisonRows([]);
    setComponentEvidence(null);
  };

  const formatBytes = (bytes: number) => {
    if (!bytes && bytes !== 0) return '';
    if (bytes < 1024) return `${bytes} B`;
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const handleTranscriptChange = (value: string) => {
    setTranscript(value);
    resetTranscriptFlow();
  };

  const handleTranscriptTextUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileUpload(e, (text) => handleTranscriptChange(text));
    if (e.target) {
      e.target.value = '';
    }
  };

  const extractSpeakerLabels = (text: string) => {
    const labels = new Set<string>();
    const regex = /(speaker(?:\s+speaker)?[_\s]*[A-Za-z0-9]+|Speaker\s*[A-Za-z0-9]+)/gi;
    let match;
    while ((match = regex.exec(text)) !== null) {
      const raw = (match[1] || '').trim().replace(/\s+:/, ':');
      if (raw) labels.add(raw.replace(/[:\s-]+$/, ''));
    }
    return Array.from(labels);
  };

  const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const normalizeSpeakerLabel = (raw: string, idx = 0) => {
    const base = (raw || '').replace(/[_]+/g, ' ').replace(/\s+/g, ' ').trim();
    const dropSpeaker = base.replace(/^speaker\s*/i, '').replace(/^speaker\s*/i, '').trim();
    const fallback = dropSpeaker || `${idx + 1}`;
    return `Speaker ${fallback.replace(/^Speaker\s*/i, '').trim()}`;
  };

  const applySpeakerMapping = (text: string, mapping: Record<string, string>) => {
    let updated = text;
    Object.entries(mapping).forEach(([label, replacement]) => {
      const cleanReplacement = replacement.trim();
      if (!cleanReplacement) return;
      const variants = new Set<string>();
      variants.add(label);
      const numMatch = label.match(/speaker[_\s]*([0-9]+)/i);
      if (numMatch) {
        variants.add(`Speaker ${numMatch[1]}`);
        variants.add(`speaker_${numMatch[1]}`);
      }
      variants.forEach((variant) => {
        const pattern = new RegExp(`\\b${escapeRegex(variant)}:?`, 'gi');
        updated = updated.replace(pattern, cleanReplacement);
      });
    });
    return updated;
  };

  const handleInternationalConsentChange = (value: boolean) => {
    setInternationalFounder(value);
    if (!value) {
      setFounderDataConsent(false);
    }
  };

  const transcribeAudioFile = async (file: Blob | File) => {
    resetTranscriptFlow();
    setErrorMsg('');
    const sizeLabel = (file as any)?.size ? ` (${formatBytes((file as any).size)})` : '';
    setTranscriptionStatus(`${statuses.uploadingAudio}${sizeLabel}...`);
    setIsTranscribingAudio(true);
    try {
      const baseFile = file instanceof File
        ? file
        : new File([file], 'recording.webm', { type: (file as any)?.type || 'audio/webm' });
      setTranscriptionStatus(statuses.processingDiarization);
      const result = await transcribeAudioWithDiarization(baseFile, locale);
      const diarizedText = (result.diarizedText || result.text || '').trim();
      setTranscript(diarizedText);
      setDiarizedPreview(diarizedText);
      setTranscriptionStatus(statuses.transcriptionDone);

      // Prompt speaker mapping if diarization labels are present
      const labelsFromText = extractSpeakerLabels(diarizedText);
      const labelsFromWords = new Set<string>();
      if (Array.isArray((result as any)?.words)) {
        ((result as any).words || []).forEach((w: any) => {
          const s = w?.speaker_id ?? w?.speaker ?? w?.speakerId;
          if (s !== undefined && s !== null) labelsFromWords.add(`Speaker ${s}`);
        });
      }
      const rawLabels = Array.from(new Set<string>([...labelsFromText, ...Array.from(labelsFromWords)]));
      const labels = rawLabels.map((l, idx) => normalizeSpeakerLabel(l, idx));
      if (labels.length) {
        const initialMap: Record<string, string> = {};
        labels.forEach((l) => { initialMap[l] = ''; });
        setSpeakerLabels(labels);
        setSpeakerMapping(initialMap);
        setShowSpeakerModal(true);
      }
    } catch (e: any) {
      setTranscriptionStatus(`${statuses.transcriptionErrorPrefix} ${e.message || e}`);
    } finally {
      setIsTranscribingAudio(false);
    }
  };

  const handleAudioFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    transcribeAudioFile(file);
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleReset = () => {
    if (window.confirm(errors.resetConfirm)) {
      setStep(WizardStep.PUBLIC_INFO);
      setStatus(AppStatus.IDLE);
      setPublicInfo('');
      setCompanyUrl('');
      setPitchbookInfo('');
      setFounderInput(INITIAL_STATEMENT);
      setBaselineStatement(null);
      setBaselineReviewFieldOrder([]);
      setBaselineGenerated(null);
      setBaselineLLM(null);
      setBaselineLLMRaw4o(null);
      setBaselineGpt52Layer(null);
      setBaselineSource('');
      setProblemCharacteristicsData(undefined);
      setProblemCharacteristicsRaw(null);
      setTranscript('');
      setSplitData(null);
      setPart1Result(null);
      setComparisonRows([]);
      setPart2Notes('');
      setErrorMsg('');
      setHasFetchedPublicInfo(false);
      setComponentEvidence(null);
      setSupportByRow({});
      setTranscriptionStatus('');
      setIsTranscribingAudio(false);
      setDiarizedPreview('');
      setSpeakerLabels([]);
      setSpeakerMapping({});
      setShowSpeakerModal(false);
      setIsConsentOpen(false);
      setFounderRecordConsent(false);
      setInternationalFounder(false);
      setFounderDataConsent(false);
    }
  };

  // Step 1: URL Fetch
  const handleUrlFetch = async () => {
    if (!companyUrl.trim()) return setErrorMsg(errors.invalidUrl);
    setStatus(AppStatus.PROCESSING);
    setErrorMsg('');
    try {
      const fetchedText = await fetchPublicInfoFromUrl(companyUrl);
      setPublicInfo(fetchedText);
      setHasFetchedPublicInfo(true);
      setBaselineStatement(null);
      setBaselineReviewFieldOrder([]);
      setBaselineGenerated(null);
      setBaselineLLM(null);
      setBaselineLLMRaw4o(null);
      setBaselineGpt52Layer(null);
      setBaselineSource('');
      setProblemCharacteristicsData(undefined);
      setProblemCharacteristicsRaw(null);
      setStatus(AppStatus.SUCCESS);
    } catch (e: any) {
      setErrorMsg(e.message);
      setStatus(AppStatus.ERROR);
    }
  };

  const getCombinedPublicInfo = () => {
    const pb = pitchbookInfo.trim();
    const pub = publicInfo.trim();
    if (pb && pub) return `${pb}\n\n${pub}`;
    return pb || pub;
  };

  // Step 1 -> Step 2
  const generateBaseline = async () => {
    const combinedPublicInfo = getCombinedPublicInfo();
    const trimmedPublicInfo = combinedPublicInfo.trim();
    if (!trimmedPublicInfo) return setErrorMsg(errors.publicInfoRequired);
    if (!hasFetchedPublicInfo) return setErrorMsg(errors.fetchPublicInfoFirst);

    // If we already generated from this exact public info, just continue without re-calling the model
    if (baselineStatement && baselineSource === trimmedPublicInfo && baselineLocale === locale) {
      setErrorMsg('');
      setStatus(AppStatus.SUCCESS);
      return;
    }
    
    setStatus(AppStatus.PROCESSING);
    setErrorMsg('');
    try {
      const res = await generateBaselineStatement(trimmedPublicInfo, locale);
      setBaselineLLMRaw4o(res);
      setBaselineGpt52Layer(null);
      setBaselineStatement(res);
      setBaselineReviewFieldOrder(createShuffledBaselineReviewFieldOrder());
      setBaselineGenerated(res);
      setBaselineLLM(res);
      setBaselineSource(trimmedPublicInfo);
      setBaselineLocale(locale);
      // Clear downstream data that depends on baseline
      setComparisonRows([]); 
      setSupportByRow({});
      setStatus(AppStatus.SUCCESS);
    } catch (e: any) {
      setErrorMsg(e.message);
      setStatus(AppStatus.ERROR);
    }
  };

  // Helper for Founder Input Changes
  const updateFounderInput = (field: keyof BaselineStatement, value: string | string[]) => {
    const normalizedValue = field === 'SPECIFIC_BARRIERS'
      ? stripBarrierLeadInList(value as string[])
      : value;
    setFounderInput(prev => ({ ...prev, [field]: normalizedValue }));
  };

  // Step 2 -> Step 3
  const submitFounderInput = () => {
    // Basic validation
    if (!founderInput.SOLUTION.trim() && !founderInput.CUSTOMER_SEGMENT.trim()) {
       return setErrorMsg(errors.founderInputMissing);
    }
    setErrorMsg('');
    setStep(WizardStep.BASELINE_REVIEW);
    setStatus(AppStatus.IDLE); 
  };

  // Step 3 -> Step 3b
  const confirmBaseline = () => {
    setStep(WizardStep.PROBLEM_CHARACTERISTICS);
  };

  // Step 4 Split Logic
  const startSplit = async () => {
    if (!transcript.trim()) return setErrorMsg(errors.transcriptRequired);
    setStatus(AppStatus.PROCESSING);
    try {
      const res = await splitTranscript(transcript, locale);
      setSplitData(res);
      // Invalidate downstream
      setPart1Result(null);
      setComparisonRows([]);
      setComponentEvidence(null);
      setSupportByRow({});
      setStatus(AppStatus.SUCCESS); 
    } catch (e: any) {
      setErrorMsg(e.message);
      setStatus(AppStatus.ERROR);
    }
  };

  // Step 4 Confirm Split -> Analyze Part 1
  const handleConfirmSplitAndAnalyze = async (p1: string, p2: string) => {
    if (!baselineStatement) {
      return setErrorMsg(errors.baselineRequired);
    }

    const isTextUnchanged = splitData && splitData.part1 === p1 && splitData.part2 === p2;
    if (part1Result && comparisonRows.length && isTextUnchanged) {
      setStep(WizardStep.PART2_COMPARISON);
      return;
    }

    setSplitData(prev => prev ? { ...prev, part1: p1, part2: p2 } : { part1: p1, part2: p2, reasoning: t.splitVerifier.userProvidedReasoning });
    setComparisonRows([]);
    setComponentEvidence(null);
    setBaselineGenerated(null);
    setSupportByRow({});
    
    setStatus(AppStatus.PROCESSING);
    
    try {
      const founderContextString = `
        Solution: ${founderInput.SOLUTION}
        Customer: ${founderInput.CUSTOMER_SEGMENT}
        Context: ${founderInput.LIFE_BUSINESS_CONTEXT}
        Goals: ${founderInput.JOB_TO_BE_DONE}
        ${INCLUDE_BARRIERS_IN_REVIEW_AND_FEEDBACK ? `Barriers: ${(founderInput.SPECIFIC_BARRIERS || []).join('; ')}` : ''}
      `;

      const combinedInfo = getCombinedPublicInfo();
      const analysisPromise = analyzeSegment(p1, combinedInfo, founderContextString, locale);
      const comparisonPromise = generateComparison(baselineStatement, p2, combinedInfo, locale);
      const evidencePromise = extractComponentEvidence(p2, locale);

      const [analysisResult, comparisonResult, evidenceResult] = await Promise.allSettled([
        analysisPromise,
        comparisonPromise,
        evidencePromise
      ]);

      if (analysisResult.status === 'rejected') {
        throw analysisResult.reason;
      }
      if (comparisonResult.status !== 'fulfilled') {
        throw comparisonResult.reason || new Error(errors.comparisonFailed || 'Comparison generation failed.');
      }

      const mapToState = (raw: AIAnalysisResponse, prefix: string): StatementResult => ({
        customers: raw.customers.map((i, idx) => ({ ...i, id: `${prefix}-c-${idx}`, isVerified: false, userNotes: '' })),
        contexts: raw.contexts.map((i, idx) => ({ ...i, id: `${prefix}-ctx-${idx}`, isVerified: false, userNotes: '' })),
        goals: raw.goals.map((i, idx) => ({ ...i, id: `${prefix}-g-${idx}`, isVerified: false, userNotes: '' })),
        barriers: INCLUDE_BARRIERS_IN_REVIEW_AND_FEEDBACK
          ? raw.barriers.map((i, idx) => ({ ...i, id: `${prefix}-b-${idx}`, isVerified: false, userNotes: '' }))
          : [],
        draftStatement: raw.finalStatement
      });

      setPart1Result(mapToState(analysisResult.value, 'p1'));

      const getGeneratedComponentText = (component: ComparisonRow['component']) =>
        getComponentText(baselineGenerated || baselineStatement, component);

      const getReviewedComponentText = (component: ComparisonRow['component']) =>
        getComponentText(baselineStatement, component);

      const rowsWithIds = comparisonResult.value.rows
        .filter((r) => INCLUDE_BARRIERS_IN_REVIEW_AND_FEEDBACK || r.component !== 'Barrier')
        .map((r, i) => ({
          ...r,
          baselineText: getGeneratedComponentText(r.component) || r.baselineText,
          id: `row-${i}`,
          isAccepted: false,
          reviewerEdit: getReviewedComponentText(r.component) || r.transcriptModification,
          reviewerNotes: '',
          reviewerDecision: undefined
        }));

      const requiredComponents: ComparisonRow['component'][] = INCLUDE_BARRIERS_IN_REVIEW_AND_FEEDBACK
        ? ['Solution', 'Customer', 'Context', 'Goal', 'Barrier']
        : ['Solution', 'Customer', 'Context', 'Goal'];
      const componentsPresent = new Set(rowsWithIds.map((r) => r.component));

      const buildFallbackRow = (component: ComparisonRow['component']): ComparisonRow => ({
        id: `row-${component.toLowerCase()}`,
        component,
        baselineText: getGeneratedComponentText(component) || '',
        transcriptModification: component === 'Barrier'
          ? stripBarrierLeadIn(getReviewedComponentText(component) || '')
          : (getReviewedComponentText(component) || ''),
        reviewerEdit: component === 'Barrier'
          ? stripBarrierLeadIn(getReviewedComponentText(component) || '')
          : (getReviewedComponentText(component) || ''),
        type: 'Confirmation',
        transcriptEvidence: component === 'Solution' ? t.comparison.support.solutionEvidenceFallback : '',
        publicSupport: '',
        publicEvidence: '',
        publicEvidenceContext: '',
        isSupportedByPublic: undefined,
        isAccepted: false,
        reviewerNotes: '',
        reviewerDecision: undefined
      });

      const fallbackRows = requiredComponents
        .filter((component) => !componentsPresent.has(component))
        .map(buildFallbackRow);

      const finalRows = [...rowsWithIds, ...fallbackRows];

      setComparisonRows(finalRows);
      setSupportByRow(buildSupportState(finalRows));

      if (evidenceResult.status === 'fulfilled') {
        setComponentEvidence(evidenceResult.value as any);
      } else {
        console.error('Component evidence generation failed', evidenceResult.status === 'rejected' ? evidenceResult.reason : 'Unknown error');
      }

      setStatus(AppStatus.SUCCESS);
      setStep(WizardStep.PART2_COMPARISON);

    } catch (e: any) {
      setErrorMsg(e.message);
      setStatus(AppStatus.ERROR);
    }
  };

  // --- Import / Export ---
  const buildFilename = (ext = 'csv') => {
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const base = companyUrl || 'analysis';
    const safeBase = base.replace(/[^a-zA-Z0-9-_]+/g, '-').slice(0, 40) || 'analysis';
    return `${safeBase}-${ts}.${ext}`;
  };

  const hasPart2WorkStarted = Boolean(
    transcript.trim() || splitData || part1Result || comparisonRows.length
  );
  const exportBlockedBecauseMissingPart2 = hasPart2WorkStarted && comparisonRows.length === 0;

  const handleExportJson = () => {
    if (exportBlockedBecauseMissingPart2) {
      setErrorMsg(errors.exportPart2Missing);
      return;
    }
    const json = buildExportJson({
      companyUrl,
      pitchbookInfo,
      publicInfo,
      baselineSource,
      baselineLLM: baselineLLM || baselineGenerated || baselineStatement,
      baselineLLMRaw4o: baselineLLMRaw4o,
      baselineGpt52Layer: baselineGpt52Layer,
      founderStatement: baselineStatement,
      part1Result,
      comparisonRows,
      supportByRow,
      founderInput,
      baselineReviewFieldOrder,
      part2Notes,
      transcript,
      splitData,
      founderRecordConsent,
      internationalFounder,
      founderDataConsent,
      problemCharacteristics: problemCharacteristicsData ?? null,
      problemCharacteristicsRaw
    });
    const filename = buildFilename('json');
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const hydrateFromExport = (data: any) => {
    const normalizeBaseline = (raw: any): BaselineStatement | null => {
      if (!raw) return null;
      const barriers = Array.isArray(raw.SPECIFIC_BARRIERS) ? raw.SPECIFIC_BARRIERS : [];
      return {
        SOLUTION: raw.SOLUTION || '',
        CUSTOMER_SEGMENT: raw.CUSTOMER_SEGMENT || '',
        LIFE_BUSINESS_CONTEXT: raw.LIFE_BUSINESS_CONTEXT || '',
        JOB_TO_BE_DONE: raw.JOB_TO_BE_DONE || '',
        SPECIFIC_BARRIERS: barriers.length ? stripBarrierLeadInList(barriers) : ['']
      };
    };

    const normalizeAnalysisItems = (items: any[], prefix: string) => {
      if (!Array.isArray(items)) return [];
      return items.map((item, idx) => ({
        id: item.id || `${prefix}-${idx}`,
        description: item.description || '',
        quotes: Array.isArray(item.quotes) ? item.quotes : [],
        isVerified: Boolean(item.isVerified),
        userNotes: item.userNotes || '',
        publicEvidence: item.publicEvidence || '',
        publicEvidenceContext: item.publicEvidenceContext || '',
        isSupportedByPublic: typeof item.isSupportedByPublic === 'boolean' ? item.isSupportedByPublic : undefined
      }));
    };

    const normalizeStatementResult = (raw: any, prefix: string): StatementResult | null => {
      if (!raw) return null;
      return {
        customers: normalizeAnalysisItems(raw.customers, `${prefix}-c`),
        contexts: normalizeAnalysisItems(raw.contexts, `${prefix}-ctx`),
        goals: normalizeAnalysisItems(raw.goals, `${prefix}-g`),
        barriers: normalizeAnalysisItems(raw.barriers, `${prefix}-b`),
        draftStatement: raw.draftStatement || ''
      };
    };

    const normalizeComparisonRows = (rawRows: any[]): ComparisonRow[] => {
      if (!Array.isArray(rawRows)) return [];
      const allowedComponents = new Set(
        INCLUDE_BARRIERS_IN_REVIEW_AND_FEEDBACK
          ? ['Solution', 'Customer', 'Context', 'Goal', 'Barrier']
          : ['Solution', 'Customer', 'Context', 'Goal']
      );
      const allowedTypes = new Set(['Modification', 'Omission', 'Hallucination', 'Confirmation']);
      return rawRows.map((row, idx) => {
        if (!row || !allowedComponents.has(row.component)) return null;
        const type = allowedTypes.has(row.type) ? row.type : 'Modification';
        return {
          id: row.id || `row-${idx}`,
          component: row.component,
          baselineText: row.component === 'Barrier' ? stripBarrierLeadIn(row.baselineText || '') : (row.baselineText || ''),
          transcriptModification: row.component === 'Barrier' ? stripBarrierLeadIn(row.transcriptModification || '') : (row.transcriptModification || ''),
          reviewerEdit: row.component === 'Barrier'
            ? stripBarrierLeadIn(row.reviewerEdit || row.transcriptModification || '')
            : (row.reviewerEdit || row.transcriptModification || ''),
          type,
          transcriptEvidence: row.transcriptEvidence || '',
          publicSupport: row.publicSupport || '',
          publicEvidence: row.publicEvidence || '',
          publicEvidenceContext: row.publicEvidenceContext || '',
          isSupportedByPublic: typeof row.isSupportedByPublic === 'boolean' ? row.isSupportedByPublic : undefined,
          isAccepted: Boolean(row.isAccepted),
          reviewerNotes: row.reviewerNotes || '',
          reviewerDecision: row.reviewerDecision
        };
      }).filter(Boolean) as ComparisonRow[];
    };

    const normalizeSupportItems = (items: any[], defaultType: 'Omission' | 'Hallucination') => {
      if (!Array.isArray(items)) return [];
      return items.map((item, idx) => ({
        id: item.id || `${defaultType.toLowerCase()}-${idx}-${Date.now()}`,
        text: item.text || '',
        type: item.type === 'Hallucination' ? 'Hallucination' : 'Omission',
        isSupportedByPublic: typeof item.isSupportedByPublic === 'boolean' ? item.isSupportedByPublic : undefined,
        publicEvidence: item.publicEvidence || '',
        publicEvidenceContext: item.publicEvidenceContext || '',
        publicSupport: item.publicSupport || ''
      }));
    };

    const metadata = data?.metadata || {};
    const statements = data?.statements || {};
    const publicBlock = data?.public_info || {};
    const fetchedPublic = publicBlock.fetched || publicBlock.publicInfo || data?.publicInfo || '';
    const pitchbookText = publicBlock.pitchbook || metadata.pitchbookInfo || '';
    const combinedFallback = [pitchbookText, fetchedPublic].map((p) => (p || '').trim()).filter(Boolean).join('\n\n');
    const combinedPublic = (publicBlock.combined || publicBlock.combined_used_for_baseline || metadata.publicInfoUsed || combinedFallback || '').trim();
    const url = metadata.companyUrl || data?.companyUrl || '';

    setCompanyUrl(url);
    setPitchbookInfo(pitchbookText);
    setPublicInfo(fetchedPublic);
    setBaselineSource(combinedPublic);

    const importedFounderInput =
      normalizeBaseline(statements.founder_input_page2) || INITIAL_STATEMENT;
    const llmBaseline = normalizeBaseline(
      statements.llm_generated_page1
    );
    const llmBaselineRaw4o = normalizeBaseline(
      statements.llm_generated_page1_raw_4o
    );
    const gpt52Layer = statements.llm_generated_page1_gpt52_layer || null;
    const founderBaseline = normalizeBaseline(
      statements.interviewer_review_page3
    );
    const importedFieldOrder = resolveBaselineReviewFieldOrder(
      metadata.baselineReviewFieldOrder
    );

    setHasFetchedPublicInfo(Boolean(fetchedPublic || pitchbookText || combinedPublic || llmBaseline || founderBaseline));
    setBaselineLLM(llmBaseline);
    setBaselineGenerated(llmBaseline);
    setBaselineLLMRaw4o(llmBaselineRaw4o || llmBaseline);
    setBaselineGpt52Layer(gpt52Layer);
    setBaselineStatement(founderBaseline || llmBaseline || importedFounderInput);
    setBaselineReviewFieldOrder(importedFieldOrder);
    setBaselineLocale(locale);
    setIsStatementOpen(true);

    setFounderInput(importedFounderInput);

    const part1 = normalizeStatementResult(data?.part1_discovery || data?.part1Result, 'import');
    setPart1Result(part1);

    const rows = normalizeComparisonRows(
      statements?.interviewer_final_page5?.components || []
    );
    setComparisonRows(rows);

    const supportMap = { ...buildSupportState(rows) };
    if (Array.isArray(data?.omissions_hallucinations)) {
      data.omissions_hallucinations.forEach((entry: any) => {
        const targetComponent = entry?.component;
        const targetRowId = entry?.rowId || entry?.id;
        const rowMatch = (targetRowId && supportMap[targetRowId])
          ? targetRowId
          : rows.find((r) => r.id === targetRowId || (targetComponent && r.component === targetComponent))?.id;
        if (!rowMatch) return;
        supportMap[rowMatch] = {
          omissions: normalizeSupportItems(entry.omissions, 'Omission'),
          hallucinations: normalizeSupportItems(entry.hallucinations, 'Hallucination'),
          loading: false,
          statusMessage: entry.statusMessage || ''
        };
      });
    } else if (data?.supportByRow && typeof data.supportByRow === 'object') {
      Object.entries(data.supportByRow as Record<string, any>).forEach(([rowId, state]) => {
        supportMap[rowId] = {
          omissions: normalizeSupportItems(state.omissions, 'Omission'),
          hallucinations: normalizeSupportItems(state.hallucinations, 'Hallucination'),
          loading: false,
          statusMessage: state?.statusMessage || ''
        };
      });
    }
    setSupportByRow(supportMap);

    const transcriptBlock = data?.transcript || {};
    const importedSplit = (transcriptBlock.part1 || transcriptBlock.part2 || transcriptBlock.splitReason)
      ? {
          part1: transcriptBlock.part1 || '',
          part2: transcriptBlock.part2 || '',
          reasoning: transcriptBlock.splitReason || ''
        }
      : null;
    setSplitData(importedSplit);

    const fullTranscript = transcriptBlock.full || [transcriptBlock.part1, transcriptBlock.part2].filter(Boolean).join('\n\n');
    setTranscript(fullTranscript || '');
    setDiarizedPreview(fullTranscript || '');
    setTranscriptionStatus('');
    setIsTranscribingAudio(false);

    const notes = statements?.interviewer_final_page5?.notes || '';
    setPart2Notes(notes);

    const consentBlock = data?.consent || {};
    const importedRecordConsent = Boolean(
      consentBlock.founderRecordConsent ?? consentBlock.recordingConsent
    );
    const importedInternational = Boolean(
      consentBlock.internationalFounder ?? consentBlock.isInternationalFounder
    );
    const importedDataConsent = Boolean(
      consentBlock.founderDataConsent ?? consentBlock.dataConsent
    );
    setFounderRecordConsent(importedRecordConsent);
    setInternationalFounder(importedInternational);
    setFounderDataConsent(importedInternational ? importedDataConsent : false);
    setIsConsentOpen(false);

    const pcBlock = data?.problem_characteristics || data?.problemCharacteristics || null;
    const importedProblemCharacteristics = parseImportedProblemCharacteristics(pcBlock);
    setProblemCharacteristicsData(importedProblemCharacteristics.data);
    setProblemCharacteristicsRaw(importedProblemCharacteristics.rawLegacy);

    setComponentEvidence(null);
    setShowGuideGlow(false);
    setIsGuideOpen(false);
    setSpeakerLabels([]);
    setSpeakerMapping({});
    setShowSpeakerModal(false);

    setStatus(AppStatus.SUCCESS);
    setErrorMsg('');

    if (rows.length) {
      setStep(WizardStep.PART2_COMPARISON);
    } else if (importedSplit) {
      setStep(WizardStep.TRANSCRIPT_UPLOAD);
    } else if (founderBaseline || llmBaseline) {
      setStep(WizardStep.BASELINE_REVIEW);
    } else if (importedFounderInput && (importedFounderInput.SOLUTION || importedFounderInput.CUSTOMER_SEGMENT)) {
      setStep(WizardStep.FOUNDER_INPUT);
    } else {
      setStep(WizardStep.PUBLIC_INFO);
    }
  };

  const handleImportJsonFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      hydrateFromExport(parsed);
    } catch (err: any) {
      setErrorMsg(`${errors.loadJsonFailed}${err?.message || err.toString()}`);
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  const triggerImportJson = () => {
    importFileInputRef.current?.click();
  };


  // --- Render Helpers ---

  const visibleSteps = [
    { id: WizardStep.PUBLIC_INFO, label: t.steps.publicInfo },
    { id: WizardStep.FOUNDER_INPUT, label: t.steps.founderInput },
    { id: WizardStep.BASELINE_REVIEW, label: t.steps.baselineReview },
    { id: WizardStep.PROBLEM_CHARACTERISTICS, label: t.steps.problemCharacteristics },
    { id: WizardStep.TRANSCRIPT_UPLOAD, label: t.steps.transcriptUpload },
    { id: WizardStep.PART2_COMPARISON, label: t.steps.part2Comparison }
  ];

  const stepAvailability = (id: WizardStep) => {
    if (id === WizardStep.PUBLIC_INFO) return true;
    if (id === WizardStep.FOUNDER_INPUT) return Boolean(baselineStatement);
    if (id === WizardStep.BASELINE_REVIEW) return Boolean(baselineStatement);
    if (id === WizardStep.PROBLEM_CHARACTERISTICS) return Boolean(baselineStatement);
    if (id === WizardStep.TRANSCRIPT_UPLOAD) return Boolean(baselineStatement);
    if (id === WizardStep.PART2_COMPARISON) return comparisonRows.length > 0;
    return false;
  };

  const currentStepIndex = Math.max(visibleSteps.findIndex((s) => s.id === step), 0);
  const totalSteps = visibleSteps.length;

  const isBaselineCurrent = Boolean(baselineStatement && baselineSource === getCombinedPublicInfo().trim());

  const highlightEvidence = (evidence: string) => {
    const source = getCombinedPublicInfo();
    if (!evidence || !source) return null;
    const lowerSource = source.toLowerCase();
    const lowerEvidence = evidence.toLowerCase();
    const idx = lowerSource.indexOf(lowerEvidence);
    if (idx === -1) return <span className="text-sm text-gray-700">{evidence}</span>;
    const start = Math.max(0, idx - 120);
    const end = Math.min(source.length, idx + evidence.length + 120);
    const before = source.slice(start, idx);
    const match = source.slice(idx, idx + evidence.length);
    const after = source.slice(idx + evidence.length, end);
    return (
      <span className="text-sm text-gray-800">
        {start > 0 ? '…' : ''}{before}
        <mark className="bg-yellow-200 text-gray-900">{match}</mark>
        {after}{end < source.length ? '…' : ''}
      </span>
    );
  };

  const speakerSample = (diarizedPreview || transcript || '').split('\n').slice(0, 6).join('\n');

  const handleSpeakerMappingChange = (label: string, value: string) => {
    setSpeakerMapping((prev) => ({ ...prev, [label]: value }));
  };

  const handleSpeakerApply = () => {
    const updatedTranscript = applySpeakerMapping(transcript, speakerMapping);
    const updatedPreview = applySpeakerMapping(diarizedPreview, speakerMapping);
    setTranscript(updatedTranscript);
    setDiarizedPreview(updatedPreview);
    setShowSpeakerModal(false);
  };

  const addSupportItem = (rowId: string, group: 'omission' | 'hallucination') => {
    setSupportByRow((prev) => {
      const row = prev[rowId] || { omissions: [], hallucinations: [], loading: false, statusMessage: '' };
      const list = group === 'omission' ? row.omissions : row.hallucinations;
      const prefix = group === 'omission' ? 'om' : 'ha';
      const newItem: SupportCheckItem = { id: `${rowId}-${prefix}-${list.length}-${Date.now()}`, text: '', type: group === 'omission' ? 'Omission' : 'Hallucination' };
      const updated = {
        ...row,
        [group === 'omission' ? 'omissions' : 'hallucinations']: [...list, newItem]
      };
      return { ...prev, [rowId]: updated };
    });
  };

  const updateSupportItem = (rowId: string, group: 'omission' | 'hallucination', id: string, value: string) => {
    setSupportByRow((prev) => {
      const row = prev[rowId];
      if (!row) return prev;
      const key = group === 'omission' ? 'omissions' : 'hallucinations';
      const updatedList = row[key].map((item) => item.id === id ? { ...item, text: value } : item);
      return { ...prev, [rowId]: { ...row, [key]: updatedList } };
    });
  };

  const handleSupportConfirm = async (rowId: string) => {
    const combinedInfo = getCombinedPublicInfo();
    const row = supportByRow[rowId];
    if (!row) return;
    const items = [...row.omissions, ...row.hallucinations].filter((i) => i.text.trim().length > 0);
    if (!combinedInfo.trim()) {
      setErrorMsg(errors.publicSupportInfoMissing);
      return;
    }
    // If no items, simply clear any previous error and exit without blocking
    if (!items.length) {
      setErrorMsg('');
      setSupportByRow((prev) => ({ ...prev, [rowId]: { ...prev[rowId], loading: false, statusMessage: t.comparison.labels.statusMessage } }));
      return;
    }
    setSupportByRow((prev) => ({ ...prev, [rowId]: { ...prev[rowId], loading: true } }));
    setErrorMsg('');
    try {
      const results = await checkPublicSupportForItems(items, combinedInfo, locale);
      const applyResults = (list: SupportCheckItem[]) =>
        list.map((item) => {
          const match = results.find((r) => r.id === item.id);
          return match ? { ...item, ...match } : item;
        });
      setSupportByRow((prev) => {
        const current = prev[rowId];
        if (!current) return prev;
        return {
          ...prev,
          [rowId]: {
            ...current,
            omissions: applyResults(current.omissions),
            hallucinations: applyResults(current.hallucinations),
            loading: false,
            statusMessage: ''
          }
        };
      });
    } catch (e: any) {
      setErrorMsg(e.message || errors.supportCheckFailed);
      setSupportByRow((prev) => ({ ...prev, [rowId]: { ...prev[rowId], loading: false, statusMessage: t.comparison.support.publicSupportFailed } }));
    }
  };

  const renderGuideModal = () => {
    if (!isGuideOpen) return null;
    const guideText = t.guide;
    const guideSections = getGuideSections(locale);

    const renderSection = (section: GuideSection, idx: number) => (
      <div key={section.title + idx} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-bold text-gray-900 mb-1">{section.title}</h3>
        {section.description && <p className="text-sm text-gray-600 mb-3">{section.description}</p>}
        <div className="space-y-3">
          {section.blocks.map((block, i) => (
            <div key={block.subtitle || i}>
              {block.subtitle && <div className="text-sm font-semibold text-gray-800 mb-1">{block.subtitle}</div>}
              {block.paragraphs && block.paragraphs.map((p, pi) => (
                <p key={pi} className="text-sm text-gray-700">{p}</p>
              ))}
              {block.bullets && (
                <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                  {block.bullets.map((b, bi) => <li key={bi}>{b}</li>)}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    );

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full p-6 relative">
          <button
            onClick={() => setIsGuideOpen(false)}
            className="absolute right-3 top-3 text-gray-400 hover:text-gray-700"
            aria-label={guideText.close}
          >
            ×
          </button>
          <h2 className="text-2xl font-bold mb-3 text-gray-900">{guideText.title}</h2>
          <p className="text-sm text-gray-600 mb-4">{guideText.description}</p>
          <div className="text-sm text-gray-800 max-h-[65vh] overflow-y-auto pr-2 space-y-3">
            {guideSections.map(renderSection)}
          </div>
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => setIsGuideOpen(false)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700"
            >
              {guideText.close}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <TranslationContext.Provider value={t}>
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-20">
         <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
             <div>
               <h1 className="text-lg sm:text-xl font-bold text-gray-800 leading-tight">{common.appTitle}</h1>
               <div className="flex items-center gap-2 mt-1">
                 <span className="bg-blue-100 text-blue-800 text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">{common.beta}</span>
                 <span className="text-[12px] font-semibold text-gray-600">{`${common.stepLabel} ${currentStepIndex + 1} / ${totalSteps}`}</span>
               </div>
             </div>
          </div>
          <div className="flex flex-wrap items-center justify-start sm:justify-end gap-2">
             <button
               onClick={() => {
                 setIsGuideOpen(true);
                 setShowGuideGlow(false);
                 localStorage.setItem('guide_seen', 'true');
               }}
               className={`text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded shadow-sm relative ${showGuideGlow ? 'animate-pulse' : ''}`}
             >
               {common.guide}
               {showGuideGlow && (
                 <span className="absolute inset-0 rounded-full shadow-[0_0_0_6px_rgba(59,130,246,0.25)] pointer-events-none"></span>
               )}
             </button>
             <button
               onClick={triggerImportJson}
               className="text-xs font-semibold text-gray-700 border border-gray-300 px-3 py-1.5 rounded hover:bg-gray-50"
             >
               {common.loadJson}
             </button>
             <button
               onClick={handleExportJson}
               disabled={exportBlockedBecauseMissingPart2}
               title={exportBlockedBecauseMissingPart2 ? errors.exportPart2Missing : undefined}
               className="text-xs font-semibold text-gray-700 border border-gray-300 px-3 py-1.5 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
             >
               {common.downloadJson}
             </button>
             <button
               onClick={handleReset}
               className="text-xs font-bold text-red-600 border border-red-200 px-3 py-1.5 rounded hover:bg-red-50 uppercase tracking-wide"
             >
               {common.clearAll}
             </button>
         </div>
       </div>
     </div>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 pb-32">
        <input
          ref={importFileInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={handleImportJsonFile}
        />
        {renderGuideModal()}
        <SpeakerModal
          open={showSpeakerModal}
          labels={speakerLabels}
          mapping={speakerMapping}
          sampleText={speakerSample}
          onClose={() => setShowSpeakerModal(false)}
          onApply={handleSpeakerApply}
          onMappingChange={handleSpeakerMappingChange}
        />
        <ConsentModal
          open={isConsentOpen}
          onClose={() => setIsConsentOpen(false)}
          founderRecordConsent={founderRecordConsent}
          onToggleRecordConsent={setFounderRecordConsent}
          internationalFounder={internationalFounder}
          onToggleInternationalFounder={handleInternationalConsentChange}
          founderDataConsent={founderDataConsent}
          onToggleDataConsent={setFounderDataConsent}
        />
        <TutorialSidebar
          open={isTourOpen}
          steps={tourSteps}
          currentIndex={tourStepIndex}
          onClose={closeTour}
          onNext={handleTourNext}
          onPrev={handleTourPrev}
        />
        {showWelcomeModal && (
          <TutorialWelcome
            onStart={() => {
              setShowWelcomeModal(false);
              startTour();
            }}
            onSkip={() => setShowWelcomeModal(false)}
          />
        )}
        <div data-tour-id="tour-step-indicator">
          <StepIndicator
            steps={visibleSteps}
            currentStep={step}
            isStepAvailable={stepAvailability}
            onStepSelect={setStep}
          />
        </div>
        
        {/* Error Message */}
        {errorMsg && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center gap-3">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
             {errorMsg}
          </div>
        )}

        {/* STEP 1: PUBLIC INFO */}
        {step === WizardStep.PUBLIC_INFO && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 animate-fade-in-up" data-tour-id="tour-public-info">
            <div className="flex justify-between items-start gap-2">
              <div>
                <h2 className="text-2xl font-bold mb-1">{t.publicInfo.title}</h2>
                </div>
              <button
                onClick={() => setShowWelcomeModal(true)}
                disabled={isTourOpen}
                className="text-xs font-semibold text-purple-700 border border-purple-200 px-3 py-2 rounded-lg hover:bg-purple-50 disabled:opacity-50"
              >
                {t.tour.start}
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
              {/* Option A: URL */}
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-5" data-tour-id="tour-fetch-url">
                 <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path></svg>
                   {t.publicInfo.optionA.title}
                 </h3>
                 <p className="text-xs text-blue-800 mb-4">{t.publicInfo.optionA.description}</p>
                 <div className="flex gap-2">
                   <input 
                    type="text" 
                    placeholder={t.publicInfo.optionA.placeholder}
                    value={companyUrl}
                    onChange={(e) => setCompanyUrl(e.target.value)}
                    className="flex-1 border border-blue-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                   />
                   <button 
                    onClick={handleUrlFetch}
                    disabled={status === AppStatus.PROCESSING}
                    className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-blue-700 disabled:opacity-50"
                   >
                     {t.publicInfo.optionA.fetch}
                   </button>
                 </div>
              </div>

              {/* Option B: File */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
                <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    {t.publicInfo.optionB.title}
                 </h3>
                 <p className="text-xs text-gray-600 mb-4">{t.publicInfo.optionB.description}</p>
                 <input type="file" onChange={(e) => handleFileUpload(e, setPublicInfo)} className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-gray-200 file:text-gray-700 hover:file:bg-gray-300"/>
              </div>
            </div>

            <label className="block text-sm font-bold text-gray-700 mb-2">{t.publicInfo.contentLabel}</label>
            <textarea
              className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-y text-sm mb-6 font-mono bg-gray-50"
              placeholder={t.publicInfo.contentPlaceholder}
              value={publicInfo}
              onChange={(e) => setPublicInfo(e.target.value)}
            />
            
            <div className="space-y-4">
              <div className="flex justify-end gap-3">
                {baselineStatement && (
                  <button 
                    onClick={() => setStep(WizardStep.FOUNDER_INPUT)}
                    className="text-sm font-semibold text-gray-600 hover:text-gray-800 px-4 py-2 rounded border border-gray-200"
                  >
                    {t.publicInfo.buttons.continue}
                  </button>
                )}
                <button 
                  onClick={generateBaseline}
                  disabled={status === AppStatus.PROCESSING || !hasFetchedPublicInfo}
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold shadow-md hover:bg-blue-700 disabled:opacity-50"
                  data-tour-id="tour-generate-baseline"
                >
                  {status === AppStatus.PROCESSING 
                    ? t.publicInfo.buttons.analyze
                    : isBaselineCurrent 
                      ? t.publicInfo.buttons.regenerate
                      : t.publicInfo.buttons.generate}
                </button>
              </div>

              {baselineStatement && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4" data-tour-id="tour-baseline-preview">
                  <h3 className="text-lg font-bold text-gray-800 mb-2">{t.publicInfo.preview.title}</h3>
                  <div className="space-y-4 text-sm text-gray-800">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{t.publicInfo.preview.solution}</p>
                      <p className="font-semibold text-gray-900">{baselineStatement.SOLUTION || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{t.publicInfo.preview.customer}</p>
                      <p className="font-semibold text-gray-900">{baselineStatement.CUSTOMER_SEGMENT || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{t.publicInfo.preview.context}</p>
                      <p className="font-semibold text-gray-900">{baselineStatement.LIFE_BUSINESS_CONTEXT || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{t.publicInfo.preview.goals}</p>
                      <p className="font-semibold text-gray-900">{baselineStatement.JOB_TO_BE_DONE || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{t.publicInfo.preview.barriers}</p>
                      {baselineStatement.SPECIFIC_BARRIERS?.length ? (
                        <ul className="list-disc pl-5 space-y-1">
                          {baselineStatement.SPECIFIC_BARRIERS.slice(0, 4).map((barrier, idx) => (
                            <li key={idx}>{stripBarrierLeadIn(barrier)}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-500">{t.publicInfo.preview.noBarriers}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 2: FOUNDER INPUT (STRUCTURED) */}
        {step === WizardStep.FOUNDER_INPUT && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 animate-fade-in-up" data-tour-id="tour-founder-input">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">{t.founder.title}</h2>
              <p className="text-gray-500 text-sm">{t.founder.subtitle}</p>
            </div>
            <div className="flex flex-col items-start md:items-end gap-2">
              <button
                type="button"
                onClick={() => setIsConsentOpen(true)}
                className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-emerald-700"
                data-tour-id="tour-consent"
              >
                {t.founder.consent}
              </button>
            </div>
          </div>

          <div className="space-y-8 mb-8">
            {/* Introduction */}
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                  {t.founder.labels.introduction}
                </label>

                <ScriptDropdown>
                  <div className="text-sm text-gray-600 whitespace-pre-line">
            {stripIndent(t.founder.scripts.introduction)}
                  </div>
                </ScriptDropdown>
              </div>
            </div>

            {/* Solution */}
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                  {t.founder.labels.solution}
                </label>

                <ScriptDropdown>
                  <div className="text-sm text-gray-600 whitespace-pre-line">
      {stripIndent(t.founder.scripts.solution)}
                  </div>
                </ScriptDropdown>
              </div>

              <textarea
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 resize-y text-sm placeholder-gray-300"
                rows={2}
                placeholder={t.founder.placeholders.solution}
                value={founderInput.SOLUTION}
                onChange={(e) => updateFounderInput('SOLUTION', e.target.value)}
              />
            </div>

            {/* Customer Segment */}
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                  {t.founder.labels.customer}
                </label>

                <ScriptDropdown>
                  <div className="text-sm text-gray-600 whitespace-pre-line">
      {stripIndent(t.founder.scripts.customer)}
                  </div>
                </ScriptDropdown>
              </div>

              <textarea
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 resize-y text-sm placeholder-gray-300"
                rows={2}
                placeholder={t.founder.placeholders.customer}
                value={founderInput.CUSTOMER_SEGMENT}
                onChange={(e) => updateFounderInput('CUSTOMER_SEGMENT', e.target.value)}
              />
            </div>

            {/* Context */}
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                  {t.founder.labels.context}
                </label>

                <ScriptDropdown>
                  <div className="text-sm text-gray-600 whitespace-pre-line">
      {stripIndent(t.founder.scripts.context)}
                  </div>
                </ScriptDropdown>
              </div>

              <textarea
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 resize-y text-sm placeholder-gray-300"
                rows={2}
                placeholder={t.founder.placeholders.context}
                value={founderInput.LIFE_BUSINESS_CONTEXT}
                onChange={(e) => updateFounderInput('LIFE_BUSINESS_CONTEXT', e.target.value)}
              />
            </div>

            {/* Goal / Job */}
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                  {t.founder.labels.goal}
                </label>

                <ScriptDropdown>
                  <div className="text-sm text-gray-600 whitespace-pre-line">
      {stripIndent(t.founder.scripts.goal)}
                  </div>
                </ScriptDropdown>
              </div>

              <textarea
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 resize-y text-sm placeholder-gray-300"
                rows={2}
                placeholder={t.founder.placeholders.goal}
                value={founderInput.JOB_TO_BE_DONE}
                onChange={(e) => updateFounderInput('JOB_TO_BE_DONE', e.target.value)}
              />
            </div>

            {/* Barriers */}
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                  {t.founder.labels.barriers}
                </label>

                <div className="flex items-center gap-3">
                  <ScriptDropdown>
                    <div className="text-sm text-gray-600 whitespace-pre-line">
      {stripIndent(t.founder.scripts.barriers)}
                    </div>
                  </ScriptDropdown>

                  <button
                    type="button"
                    onClick={() =>
                      updateFounderInput('SPECIFIC_BARRIERS', [
                        ...(founderInput.SPECIFIC_BARRIERS || []),
                        ""
                      ])
                    }
                    className="text-xs text-purple-600 hover:underline font-bold whitespace-nowrap"
                  >
                    {t.founder.addBarrier}
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {(founderInput.SPECIFIC_BARRIERS || []).map((barrier, idx) => (
                  <div key={idx} className="flex gap-2">
                    <span className="text-gray-400 text-sm py-2 w-4 text-right">
                      {idx + 1}.
                    </span>

                    <input
                      type="text"
                      className="flex-1 p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500"
                      placeholder={t.founder.placeholders.barrier}
                      value={stripBarrierLeadIn(barrier)}
                      onChange={(e) => {
                        const updated = [...founderInput.SPECIFIC_BARRIERS];
                        updated[idx] = e.target.value;
                        updateFounderInput('SPECIFIC_BARRIERS', updated);
                      }}
                    />

                    <button
                      type="button"
                      onClick={() => {
                        const updated = founderInput.SPECIFIC_BARRIERS.filter((_, i) => i !== idx);
                        updateFounderInput('SPECIFIC_BARRIERS', updated);
                      }}
                      className="text-gray-400 hover:text-red-500 px-2"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setStep(WizardStep.PUBLIC_INFO)}
              className="text-sm font-semibold text-gray-600 hover:text-gray-800 px-3 py-2 rounded"
            >
              {t.founder.back}
            </button>

            <button
              type="button"
              onClick={submitFounderInput}
              className="bg-purple-600 text-white px-8 py-3 rounded-lg font-bold shadow-md hover:bg-purple-700"
            >
              {t.founder.continue}
            </button>
          </div>
        </div>
      )}
        {/* STEP 3: BASELINE REVIEW */}
        {step === WizardStep.BASELINE_REVIEW && baselineStatement && (
          <div data-tour-id="tour-baseline-review">
            <BaselineReview 
              baseline={baselineStatement}
              fieldOrder={baselineReviewFieldOrder}
              onUpdate={(updated) => {
                setBaselineStatement(updated);
                // Invalidate Comparison since Baseline changed
                setComparisonRows([]);
              }}
              onNext={confirmBaseline}
              onBack={() => setStep(WizardStep.FOUNDER_INPUT)}
            />
          </div>
        )}

        {/* STEP 3b: PROBLEM CHARACTERISTICS */}
        {step === WizardStep.PROBLEM_CHARACTERISTICS && (
          <ProblemCharacteristics
            initialData={problemCharacteristicsData}
            onChange={(data) => {
              setProblemCharacteristicsData(data);
              setProblemCharacteristicsRaw(null);
            }}
            onNext={(data) => {
              setProblemCharacteristicsData(data);
              setProblemCharacteristicsRaw(null);
              setStep(WizardStep.TRANSCRIPT_UPLOAD);
            }}
            onBack={() => setStep(WizardStep.BASELINE_REVIEW)}
          />
        )}

        {/* STEP 4: TRANSCRIPT UPLOAD & SPLIT */}
        {step === WizardStep.TRANSCRIPT_UPLOAD && (
          <div className="space-y-6" data-tour-id="tour-transcript-upload">
            {!splitData ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 animate-fade-in-up">
                <h2 className="text-2xl font-bold mb-2">{t.transcript.title}</h2>
                <p className="text-gray-500 mb-6 text-sm">{t.transcript.description}</p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-4" data-tour-id="tour-transcript-audio">
                    <h3 className="font-bold text-blue-900 mb-1">{t.transcript.uploadAudioTitle}</h3>
                    <p className="text-xs text-blue-900 mb-3">{t.transcript.uploadAudioHelp}</p>
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={handleAudioFileUpload}
                      className="block w-full text-sm text-blue-900 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                    />
                    {isTranscribingAudio && (
                      <div className="flex items-center gap-2 text-xs text-blue-900 mt-3">
                        <svg className="animate-spin h-4 w-4 text-blue-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {t.transcript.transcribing}
                      </div>
                    )}
                    {transcriptionStatus && (
                      <p className="mt-3 text-xs text-blue-900 bg-white/70 border border-blue-100 rounded p-2">{transcriptionStatus}</p>
                    )}
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4" data-tour-id="tour-transcript-text">
                    <h3 className="font-bold text-gray-800 mb-1">{t.transcript.transcriptTitle}</h3>
                    <p className="text-xs text-gray-600 mb-3">{t.transcript.transcriptHelp}</p>
                    <input
                      type="file"
                      accept=".txt,text/plain,.vtt,text/vtt"
                      onChange={handleTranscriptTextUpload}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-gray-200 file:text-gray-800 hover:file:bg-gray-300"
                    />
                    <p className="text-[11px] text-gray-500 mt-2">{t.transcript.transcriptNote}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-bold text-gray-700">{t.transcript.transcriptLabel}</label>
                  {diarizedPreview && (
                    <span className="text-xs font-semibold text-green-700">{t.transcript.diarizedAdded}</span>
                  )}
                </div>
                <textarea
                  className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-y text-xs mb-6"
                  placeholder={t.transcript.transcriptPlaceholder}
                  value={transcript}
                  onChange={(e) => handleTranscriptChange(e.target.value)}
                  data-tour-id="tour-transcript-editor"
                />
                <div className="flex justify-between">
                  <button onClick={() => setStep(WizardStep.PROBLEM_CHARACTERISTICS)} className="text-sm font-semibold text-gray-600 hover:text-gray-800 px-3 py-2 rounded">{t.transcript.back}</button>
                  <button 
                    onClick={startSplit}
                    disabled={status === AppStatus.PROCESSING || !transcript || isTranscribingAudio}
                    className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold shadow-md hover:bg-blue-700 disabled:opacity-50"
                    data-tour-id="tour-transcript-split"
                  >
                    {status === AppStatus.PROCESSING || isTranscribingAudio ? statuses.processing : t.transcript.split}
                  </button>
                </div>
              </div>
            ) : (
              <SplitVerifier 
                split={splitData} 
                onConfirm={handleConfirmSplitAndAnalyze}
                onCancel={() => setSplitData(null)}
                isProcessing={status === AppStatus.PROCESSING}
              />
            )}
          </div>
        )}

        {/* STEP 6: PART 2 COMPARISON (Table) */}
        {step === WizardStep.PART2_COMPARISON && (
          <Part2Comparison
            comparisonRows={comparisonRows}
            onUpdateRows={setComparisonRows}
            renderPublicHighlight={(text) => highlightEvidence(text)}
            componentEvidence={componentEvidence}
            supportByRow={supportByRow}
            onAddSupportItem={addSupportItem}
            onChangeSupportItem={updateSupportItem}
            onConfirmSupportCheck={handleSupportConfirm}
            onBack={() => setStep(WizardStep.TRANSCRIPT_UPLOAD)}
            onExportJson={handleExportJson}
            onImportJson={triggerImportJson}
          />
        )}

      </main>
    </div>
    </TranslationContext.Provider>
  );
}

export default App;
