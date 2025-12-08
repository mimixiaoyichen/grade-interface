
import React, { useEffect, useState } from 'react';
import SplitVerifier from './components/SplitVerifier';
import BaselineReview from './components/BaselineReview';
import ComparisonTable from './components/ComparisonTable';
import {
  analyzeSegment, 
  splitTranscript, 
  generateBaselineStatement, 
  generateComparison,
  fetchPublicInfoFromUrl,
  extractComponentEvidence,
  selectTopBarriers,
  checkPublicSupportForItems,
  transcribeAudioWithDiarization
} from './services/aiService';
import buildCsv from './utils/buildCsv';
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
import { GUIDE_SECTIONS } from './utils/guideContent';
import type { GuideSection } from './utils/guideContent';
import StepIndicator from './components/StepIndicator';
import SpeakerModal from './components/SpeakerModal';
import Part2Comparison from './components/Part2Comparison';

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
    case 'Barrier': return (source.SPECIFIC_BARRIERS || []).join('; ');
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

export const ScriptDropdown = ({ title = "View Script", children }) => (
  <details className="w-full group">
    <summary className="list-none cursor-pointer select-none text-xs text-gray-500 flex items-center gap-2 justify-end">
      <span className="font-medium text-sm">{title}</span>
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

function App() {
  const [step, setStep] = useState<WizardStep>(WizardStep.PUBLIC_INFO);
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // --- State Data ---
  
  // Step 1: Public Info
  const [publicInfo, setPublicInfo] = useState<string>('');
  const [companyUrl, setCompanyUrl] = useState<string>('');
  const [pitchbookInfo, setPitchbookInfo] = useState<string>('');
  
  // Step 2: Founder Input (Now Structured)
  const [founderInput, setFounderInput] = useState<BaselineStatement>(INITIAL_STATEMENT);

  // Step 3: Baseline
  const [baselineStatement, setBaselineStatement] = useState<BaselineStatement | null>(null);
  const [baselineGenerated, setBaselineGenerated] = useState<BaselineStatement | null>(null);
  const [baselineSource, setBaselineSource] = useState<string>('');

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

  useEffect(() => {
    const hasSeen = localStorage.getItem('guide_seen');
    if (!hasSeen) {
      setShowGuideGlow(true);
    }
  }, []);

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

  const transcribeAudioFile = async (file: Blob | File) => {
    resetTranscriptFlow();
    setErrorMsg('');
    const sizeLabel = (file as any)?.size ? ` (${formatBytes((file as any).size)})` : '';
    setTranscriptionStatus(`Uploading audio${sizeLabel}...`);
    setIsTranscribingAudio(true);
    try {
      const baseFile = file instanceof File
        ? file
        : new File([file], 'recording.webm', { type: (file as any)?.type || 'audio/webm' });
      setTranscriptionStatus('Processing with ElevenLabs (diarization)...');
      const result = await transcribeAudioWithDiarization(baseFile);
      const diarizedText = (result.diarizedText || result.text || '').trim();
      setTranscript(diarizedText);
      setDiarizedPreview(diarizedText);
      setTranscriptionStatus('Transcription complete. Review or edit below before splitting.');

      // Prompt speaker mapping if diarization labels are present
      const labelsFromText = extractSpeakerLabels(diarizedText);
      const labelsFromWords = new Set<string>();
      if (Array.isArray((result as any)?.words)) {
        ((result as any).words || []).forEach((w: any) => {
          const s = w?.speaker_id ?? w?.speaker ?? w?.speakerId;
          if (s !== undefined && s !== null) labelsFromWords.add(`Speaker ${s}`);
        });
      }
      const labels = Array.from(new Set<string>([...labelsFromText, ...Array.from(labelsFromWords)]));
      if (labels.length) {
        const initialMap: Record<string, string> = {};
        labels.forEach((l) => { initialMap[l] = ''; });
        setSpeakerLabels(labels);
        setSpeakerMapping(initialMap);
        setShowSpeakerModal(true);
      }
    } catch (e: any) {
      setTranscriptionStatus(`Transcription error: ${e.message || e}`);
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
    if (window.confirm("Are you sure you want to clear all data and start over?")) {
      setStep(WizardStep.PUBLIC_INFO);
      setStatus(AppStatus.IDLE);
      setPublicInfo('');
      setCompanyUrl('');
      setPitchbookInfo('');
      setFounderInput(INITIAL_STATEMENT);
      setBaselineStatement(null);
      setBaselineGenerated(null);
      setBaselineSource('');
      setTranscript('');
      setSplitData(null);
      setPart1Result(null);
      setComparisonRows([]);
      setErrorMsg('');
      setHasFetchedPublicInfo(false);
      setComponentEvidence(null);
      setSupportByRow({});
      setTranscriptionStatus('');
      setIsTranscribingAudio(false);
      setDiarizedPreview('');
    }
  };

  // Step 1: URL Fetch
  const handleUrlFetch = async () => {
    if (!companyUrl.trim()) return setErrorMsg("Please enter a valid URL.");
    setStatus(AppStatus.PROCESSING);
    setErrorMsg('');
    try {
      const fetchedText = await fetchPublicInfoFromUrl(companyUrl);
      setPublicInfo(fetchedText);
      setHasFetchedPublicInfo(true);
      setBaselineStatement(null);
      setBaselineSource('');
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
    if (!trimmedPublicInfo) return setErrorMsg("Public information is required.");
    if (!hasFetchedPublicInfo) return setErrorMsg("Please fetch public information first.");

    // If we already generated from this exact public info, just continue without re-calling the model
    if (baselineStatement && baselineSource === trimmedPublicInfo) {
      setErrorMsg('');
      setStatus(AppStatus.SUCCESS);
      return;
    }
    
    setStatus(AppStatus.PROCESSING);
    setErrorMsg('');
    try {
      const res = await generateBaselineStatement(trimmedPublicInfo);
      let refinedBarriers = res.SPECIFIC_BARRIERS || [];

      try {
        const selected = await selectTopBarriers(res, trimmedPublicInfo);
        if (selected && selected.length) {
          refinedBarriers = selected;
        }
      } catch (selectorError) {
        console.error('Barrier selection failed', selectorError);
      }

      const limitedBarriers = refinedBarriers.slice(0, 4);
      setBaselineStatement({ ...res, SPECIFIC_BARRIERS: limitedBarriers });
      setBaselineGenerated({ ...res, SPECIFIC_BARRIERS: limitedBarriers });
      setBaselineSource(trimmedPublicInfo);
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
    setFounderInput(prev => ({ ...prev, [field]: value }));
  };

  // Step 2 -> Step 3
  const submitFounderInput = () => {
    // Basic validation
    if (!founderInput.SOLUTION.trim() && !founderInput.CUSTOMER_SEGMENT.trim()) {
       return setErrorMsg("Please provide at least a Solution and Customer Segment.");
    }
    setErrorMsg('');
    setStep(WizardStep.BASELINE_REVIEW);
    setStatus(AppStatus.IDLE); 
  };

  // Step 3 -> Step 4
  const confirmBaseline = () => {
    setStep(WizardStep.TRANSCRIPT_UPLOAD);
  };

  // Step 4 Split Logic
  const startSplit = async () => {
    if (!transcript.trim()) return setErrorMsg("Transcript required.");
    setStatus(AppStatus.PROCESSING);
    try {
      const res = await splitTranscript(transcript);
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
      return setErrorMsg("Baseline statement is required before analyzing the transcript.");
    }

    const isTextUnchanged = splitData && splitData.part1 === p1 && splitData.part2 === p2;
    if (part1Result && comparisonRows.length && isTextUnchanged) {
      setStep(WizardStep.PART2_COMPARISON);
      return;
    }

    setSplitData(prev => prev ? { ...prev, part1: p1, part2: p2 } : { part1: p1, part2: p2, reasoning: 'User-provided split' });
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
        Barriers: ${founderInput.SPECIFIC_BARRIERS.join('; ')}
      `;

      const combinedInfo = getCombinedPublicInfo();
      const analysisPromise = analyzeSegment(p1, combinedInfo, founderContextString);
      const comparisonPromise = generateComparison(baselineStatement, p2, combinedInfo);
      const evidencePromise = extractComponentEvidence(p2);

      const [analysisResult, comparisonResult, evidenceResult] = await Promise.allSettled([
        analysisPromise,
        comparisonPromise,
        evidencePromise
      ]);

      if (analysisResult.status === 'rejected') {
        throw analysisResult.reason;
      }
      if (comparisonResult.status !== 'fulfilled') {
        throw comparisonResult.reason || new Error("Comparison generation failed.");
      }

      const mapToState = (raw: AIAnalysisResponse, prefix: string): StatementResult => ({
        customers: raw.customers.map((i, idx) => ({ ...i, id: `${prefix}-c-${idx}`, isVerified: false, userNotes: '' })),
        contexts: raw.contexts.map((i, idx) => ({ ...i, id: `${prefix}-ctx-${idx}`, isVerified: false, userNotes: '' })),
        goals: raw.goals.map((i, idx) => ({ ...i, id: `${prefix}-g-${idx}`, isVerified: false, userNotes: '' })),
        barriers: raw.barriers.map((i, idx) => ({ ...i, id: `${prefix}-b-${idx}`, isVerified: false, userNotes: '' })),
        draftStatement: raw.finalStatement
      });

      setPart1Result(mapToState(analysisResult.value, 'p1'));

      const getGeneratedComponentText = (component: ComparisonRow['component']) =>
        getComponentText(baselineGenerated || baselineStatement, component);

      const getReviewedComponentText = (component: ComparisonRow['component']) =>
        getComponentText(baselineStatement, component);

      const rowsWithIds = comparisonResult.value.rows.map((r, i) => ({
        ...r,
        baselineText: getGeneratedComponentText(r.component) || r.baselineText,
        id: `row-${i}`,
        isAccepted: false,
        reviewerEdit: getReviewedComponentText(r.component) || r.transcriptModification,
        reviewerNotes: '',
        reviewerDecision: undefined
      }));
      // Add Solution row (from baseline) if not present
      const hasSolution = rowsWithIds.some((r) => r.component === 'Solution');
      const solutionRow: ComparisonRow = {
        id: 'row-solution',
        component: 'Solution',
        baselineText: (baselineGenerated || baselineStatement)?.SOLUTION || '',
        transcriptModification: (baselineStatement)?.SOLUTION || '',
        reviewerEdit: (baselineStatement)?.SOLUTION || '',
        type: 'Confirmation',
        transcriptEvidence: 'Solution evidence not provided (baseline only).',
        publicSupport: '',
        publicEvidence: '',
        publicEvidenceContext: '',
        isSupportedByPublic: undefined,
        isAccepted: false,
        reviewerNotes: '',
        reviewerDecision: undefined
      };

      const finalRows = hasSolution ? rowsWithIds : [solutionRow, ...rowsWithIds];

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

  // --- Export ---
  const buildFilename = () => {
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const base = companyUrl || 'analysis';
    const safeBase = base.replace(/[^a-zA-Z0-9-_]+/g, '-').slice(0, 40) || 'analysis';
    return `${safeBase}-${ts}.csv`;
  };

  const handleExport = () => {
     const csv = buildCsv(part1Result, comparisonRows, { founderInput, baseline: baselineStatement, part2Notes });
     const filename = buildFilename();
     const encodedUri = encodeURI(`data:text/csv;charset=utf-8,${csv}`);
     const link = document.createElement("a");
     link.setAttribute("href", encodedUri);
     link.setAttribute("download", filename);
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
  };


  // --- Render Helpers ---

  const visibleSteps = [
    { id: WizardStep.PUBLIC_INFO, label: 'Public Info' },
    { id: WizardStep.FOUNDER_INPUT, label: 'Founder Input' },
    { id: WizardStep.BASELINE_REVIEW, label: 'Review Baseline' },
    { id: WizardStep.TRANSCRIPT_UPLOAD, label: 'Post-interview' },
    { id: WizardStep.PART2_COMPARISON, label: 'Feedback (P2)' }
  ];

  const stepAvailability = (id: WizardStep) => {
    if (id === WizardStep.PUBLIC_INFO) return true;
    if (id === WizardStep.FOUNDER_INPUT) return Boolean(baselineStatement);
    if (id === WizardStep.BASELINE_REVIEW) return Boolean(baselineStatement);
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
      setErrorMsg("Public information is required before checking public support.");
      return;
    }
    // If no items, simply clear any previous error and exit without blocking
    if (!items.length) {
      setErrorMsg('');
      setSupportByRow((prev) => ({ ...prev, [rowId]: { ...prev[rowId], loading: false, statusMessage: 'No omissions or hallucinations provided to check.' } }));
      return;
    }
    setSupportByRow((prev) => ({ ...prev, [rowId]: { ...prev[rowId], loading: true } }));
    setErrorMsg('');
    try {
      const results = await checkPublicSupportForItems(items, combinedInfo);
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
      setErrorMsg(e.message || 'Public support check failed.');
      setSupportByRow((prev) => ({ ...prev, [rowId]: { ...prev[rowId], loading: false, statusMessage: 'Public support check failed.' } }));
    }
  };

  const renderGuideModal = () => {
    if (!isGuideOpen) return null;

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
            aria-label="Close guide"
          >
            ×
          </button>
          <h2 className="text-2xl font-bold mb-3 text-gray-900">Interviewer Training Guidance</h2>
          <p className="text-sm text-gray-600 mb-4">Verbatim content, grouped for quick scanning.</p>
          <div className="text-sm text-gray-800 max-h-[65vh] overflow-y-auto pr-2 space-y-3">
            {GUIDE_SECTIONS.map(renderSection)}
          </div>
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => setIsGuideOpen(false)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      <div className="bg-white p-4 shadow-sm border-b border-gray-200 sticky top-0 z-20">
         <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
             <h1 className="text-xl font-bold text-gray-800">Founder Problem Analyst</h1>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
             <button
               onClick={() => {
                 setIsGuideOpen(true);
                 setShowGuideGlow(false);
                 localStorage.setItem('guide_seen', 'true');
               }}
               className={`text-sm font-semibold text-blue-600 hover:text-blue-800 underline relative ${showGuideGlow ? 'animate-pulse' : ''}`}
             >
               Guide
               {showGuideGlow && (
                 <span className="absolute inset-0 rounded-full shadow-[0_0_0_6px_rgba(59,130,246,0.25)] pointer-events-none"></span>
               )}
             </button>
         </div>
       </div>
     </div>

      <header className="bg-white shadow-sm border-b border-gray-200 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
           <div className="flex items-center gap-2">
             <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded">BETA</span>
             <h2 className="text-sm font-semibold text-gray-600">Step {currentStepIndex + 1} of {totalSteps}</h2>
           </div>
           <button onClick={handleReset} className="text-red-500 hover:text-red-700 text-xs font-bold uppercase tracking-wide">
             Clear All & Restart
           </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 pb-32">
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
        <StepIndicator
          steps={visibleSteps}
          currentStep={step}
          isStepAvailable={stepAvailability}
          onStepSelect={setStep}
        />
        
        {/* Error Message */}
        {errorMsg && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center gap-3">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
             {errorMsg}
          </div>
        )}

        {/* STEP 1: PUBLIC INFO */}
        {step === WizardStep.PUBLIC_INFO && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 animate-fade-in-up">
            <div className="flex justify-between items-start gap-2">
              <div>
                <h2 className="text-2xl font-bold mb-1">1. Public Information</h2>
                </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">Pitchbook Information</label>
              <textarea
                className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-y text-sm mb-2 font-mono bg-gray-50"
                placeholder="Copy and paste pitchbook information if available..."
                value={pitchbookInfo}
                onChange={(e) => setPitchbookInfo(e.target.value)}
              />
              <p className="text-xs text-gray-500">This will be combined with fetched public info when generating the baseline.</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
              {/* Option A: URL */}
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-5">
                 <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path></svg>
                   Option A: Fetch from URL
                 </h3>
                 <p className="text-xs text-blue-800 mb-4">We will use Google Search to find and summarize public info about this company. We also attempt to fetch the raw homepage HTML.</p>
                 <div className="flex gap-2">
                   <input 
                    type="text" 
                    placeholder="https://example.com"
                    value={companyUrl}
                    onChange={(e) => setCompanyUrl(e.target.value)}
                    className="flex-1 border border-blue-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                   />
                   <button 
                    onClick={handleUrlFetch}
                    disabled={status === AppStatus.PROCESSING}
                    className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-blue-700 disabled:opacity-50"
                   >
                     Fetch
                   </button>
                 </div>
              </div>

              {/* Option B: File */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
                 <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    Option B: Upload File
                 </h3>
                 <p className="text-xs text-gray-600 mb-4">Upload a pitch deck text or website copy directly.</p>
                 <input type="file" onChange={(e) => handleFileUpload(e, setPublicInfo)} className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-gray-200 file:text-gray-700 hover:file:bg-gray-300"/>
              </div>
            </div>

            <label className="block text-sm font-bold text-gray-700 mb-2">Public Information Content</label>
            <textarea
              className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-y text-sm mb-6 font-mono bg-gray-50"
              placeholder="Content will appear here after fetch or upload..."
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
                    Continue to Founder Input →
                  </button>
                )}
                <button 
                  onClick={generateBaseline}
                  disabled={status === AppStatus.PROCESSING || !hasFetchedPublicInfo}
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold shadow-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {status === AppStatus.PROCESSING 
                    ? 'Analyzing Public Info...' 
                    : isBaselineCurrent 
                      ? 'Regenerate Baseline' 
                      : 'Generate Baseline →'}
                </button>
              </div>

              {baselineStatement && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-gray-800 mb-2">LLM-generated Statement (Preview)</h3>
                  <div className="space-y-4 text-sm text-gray-800">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Solution</p>
                      <p className="font-semibold text-gray-900">{baselineStatement.SOLUTION || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Customer</p>
                      <p className="font-semibold text-gray-900">{baselineStatement.CUSTOMER_SEGMENT || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Context</p>
                      <p className="font-semibold text-gray-900">{baselineStatement.LIFE_BUSINESS_CONTEXT || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Goals</p>
                      <p className="font-semibold text-gray-900">{baselineStatement.JOB_TO_BE_DONE || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Barriers</p>
                      {baselineStatement.SPECIFIC_BARRIERS?.length ? (
                        <ul className="list-disc pl-5 space-y-1">
                          {baselineStatement.SPECIFIC_BARRIERS.slice(0, 4).map((barrier, idx) => (
                            <li key={idx}>{barrier}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-500">No barriers available.</p>
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 animate-fade-in-up">
          <h2 className="text-2xl font-bold mb-2">2. Founder's Perspective (!!RECORD ZOOM TO COMPUTER!!)</h2>
          <p className="text-gray-500 mb-6 text-sm">
            What does the founder <em>think</em> the problem is?
          </p>

          <div className="space-y-8 mb-8">
            {/* Introduction */}
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Introduction
                </label>

                <ScriptDropdown title="View Script">
                  <div className="text-sm text-gray-600 whitespace-pre-line">
            {stripIndent(`
            Overview:
            “Hi [Name], thank you for joining today. I’m [Your Name], working with Professors Bernstein and Lane at Harvard Business School. We’re studying how founders define the core problem their startup solves. This interview is for research only—we are not evaluating your company. Your responses will remain confidential and only aggregate findings will be shared. With your permission, I’d like to record the conversation so that we can capture your responses accurately. Is that okay?”  
            
            If yes, begin recording. If no, interviewer is expected to take detailed notes.  

            Then set expectations:
            “I’ll ask a series of open‑ended questions. There are no right or wrong answers—we want to understand your perspective in your own words. This will take about 20 minutes.”  

            Briefly describe the problem statement framework using the following scripted introduction (read verbatim):  

            “Before we dive into the specific questions, I want to quickly explain the structure we’ll use. We follow a simple framework to construct a problem statement of your company. Our goal is to understand the problem your company solves from the customer’s point of view.  

            We’ll walk through five elements:  

            1. Solution means what you’ve built.  

            2. Customer means who is your target customer.  

            3. Customers’ Aspiration means what your customers are trying to accomplish.  

            4. When does the Problem occur means the specific situation or moment when your customers experience the problem.   

            5. Barriers means what prevents your customers from reaching their goals without your help.  

            We will only focus on your perspective as the founder. However, please respond based on the public’s understanding of your startup, and not based on private information that may not be reflected in the public knowledge domain.”  
 
            `)}
                  </div>
                </ScriptDropdown>
              </div>
            </div>

            {/* Solution */}
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Solution
                </label>

                <ScriptDropdown title="View Script">
                  <div className="text-sm text-gray-600 whitespace-pre-line">
      {stripIndent(`
      Lead Question (read verbatim):
      “Let’s begin with what you’ve built. How would you describe your product or solution? Please describe it  based on information that is publicly available on your startup.”   
      
      Smooth Transition: “Thank you—that helps set the stage. Now let’s move on to the next variable. I’d like to understand who your customers are.”
 `)}
                  </div>
                </ScriptDropdown>
              </div>

              <textarea
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 resize-y text-sm placeholder-gray-300"
                rows={2}
                placeholder="e.g. AI-powered diagnostic tool for radiologists"
                value={founderInput.SOLUTION}
                onChange={(e) => updateFounderInput('SOLUTION', e.target.value)}
              />
            </div>

            {/* Customer Segment */}
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Customer Segment
                </label>

                <ScriptDropdown title="View Script">
                  <div className="text-sm text-gray-600 whitespace-pre-line">
      {stripIndent(`
      Lead Question (verbatim): “Tell me about the people or organizations that face the problem you are trying to solve. Who are they?”  

      Probing (if needed):
      - “Could you describe them by role or situation rather than demographics?”
      - “Who is your primary customer today versus aspirational customers?”
      - “What do these customers have in common?”  
      
      Reflective statement before transition: “So you’re saying your core customer is ___. Did I summarize that accurately?  
      [founder confirms OR offers more revisions] 
      Now let’s move on to the next variable.”  `)}
                  </div>
                </ScriptDropdown>
              </div>

              <textarea
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 resize-y text-sm placeholder-gray-300"
                rows={2}
                placeholder="e.g. Radiologists in high-volume trauma centers"
                value={founderInput.CUSTOMER_SEGMENT}
                onChange={(e) => updateFounderInput('CUSTOMER_SEGMENT', e.target.value)}
              />
            </div>

            {/* Context */}
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Context
                </label>

                <ScriptDropdown title="View Script">
                  <div className="text-sm text-gray-600 whitespace-pre-line">
      {stripIndent(`
        Lead Question (verbatim): “When does this problem occur for your customers? Can you describe the specific situation or moment when they face this challenge?”  
        
        Probing:  
        - “Is there a trigger event when this becomes urgent?”  
        - “Can you walk me through a recent example?”  
        
        Reflective statement before transition:  “So the problem typically arises when ___. Did I capture that accurately? 
        [founder confirms OR offers more revisions] 
        Now let’s move on to the next variable.”`)}
                  </div>
                </ScriptDropdown>
              </div>

              <textarea
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 resize-y text-sm placeholder-gray-300"
                rows={2}
                placeholder="e.g. When reviewing overnight CT scans with limited staff"
                value={founderInput.LIFE_BUSINESS_CONTEXT}
                onChange={(e) => updateFounderInput('LIFE_BUSINESS_CONTEXT', e.target.value)}
              />
            </div>

            {/* Goal / Job */}
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Goal
                </label>

                <ScriptDropdown title="View Script">
                  <div className="text-sm text-gray-600 whitespace-pre-line">
      {stripIndent(`Lead Question (verbatim): “What are your customers ultimately trying to achieve when they come to you? To be clear, I’m asking about the progress or goals they’re seeking—not what your product does. Please describe this using only publicly available information about your startup.”  

      Important framing: Ask the founder to answer as the public would understand the startup, based on public external information.  

      Probing:  
      - “If your product didn’t exist, what would they still be trying to achieve?”  
      - “What does success look like from their perspective?”  
      
      Reflective statement before transition: “What I’m hearing is that their aspiration is ___. Is that correct? 
      [founder confirms OR offers more revisions] 
      Now let’s move on to the next variable.”`)}
                  </div>
                </ScriptDropdown>
              </div>

              <textarea
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 resize-y text-sm placeholder-gray-300"
                rows={2}
                placeholder="e.g. To identify critical fractures accurately and quickly"
                value={founderInput.JOB_TO_BE_DONE}
                onChange={(e) => updateFounderInput('JOB_TO_BE_DONE', e.target.value)}
              />
            </div>

            {/* Barriers */}
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Barriers
                </label>

                <div className="flex items-center gap-3">
                  <ScriptDropdown title="View Script">
                    <div className="text-sm text-gray-600 whitespace-pre-line">
      {stripIndent(`
      Lead Question (verbatim): “What prevents your customers from achieving their aspirations or goals if your solution doesn’t exist? What specific obstacles stand in their way?”  

      Probing:
      - “Are these functional, emotional, financial, or social barriers?”
      - “What have they tried that didn’t work?”

      Reflective statement before transition:  “You mentioned ___ as the main barriers. Does that fully capture them?[founder confirms OR offers more revisions] 

      Now let’s move on to the next variable.”  
      Transitory wording between part 1 & part 2: 
      “Awesome - now we have finished part 1 where you created your problem statement. Let’s proceed to the second part.”  

 `)}
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
                    className="text-xs text-purple-600 hover:underline font-bold"
                  >
                    + Add Barrier
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
                      placeholder="e.g. Fatigue leads to missed fractures"
                      value={barrier}
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
              Back
            </button>

            <button
              type="button"
              onClick={submitFounderInput}
              className="bg-purple-600 text-white px-8 py-3 rounded-lg font-bold shadow-md hover:bg-purple-700"
            >
              Continue →
            </button>
          </div>
        </div>
      )}
        {/* STEP 3: BASELINE REVIEW */}
        {step === WizardStep.BASELINE_REVIEW && baselineStatement && (
          <BaselineReview 
            baseline={baselineStatement}
            onUpdate={(updated) => {
              setBaselineStatement(updated);
              // Invalidate Comparison since Baseline changed
              setComparisonRows([]);
            }}
            onNext={confirmBaseline}
            onBack={() => setStep(WizardStep.FOUNDER_INPUT)}
          />
        )}

        {/* STEP 4: TRANSCRIPT UPLOAD & SPLIT */}
        {step === WizardStep.TRANSCRIPT_UPLOAD && (
          <div className="space-y-6">
            {!splitData ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 animate-fade-in-up">
                <h2 className="text-2xl font-bold mb-2">4. Post-interview (Upload Transcript)</h2>
                <p className="text-gray-500 mb-6 text-sm">Split into "Discovery" (Part 1) and "Feedback" (Part 2). Paste text or upload audio and we will transcribe with speaker diarization (auto-splits large files).</p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                    <h3 className="font-bold text-blue-900 mb-1">Upload audio to transcribe (with diarization)</h3>
                    <p className="text-xs text-blue-900 mb-3">Drop the local meeting recording here.</p>
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
                        Transcribing audio…
                      </div>
                    )}
                    {transcriptionStatus && (
                      <p className="mt-3 text-xs text-blue-900 bg-white/70 border border-blue-100 rounded p-2">{transcriptionStatus}</p>
                    )}
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h3 className="font-bold text-gray-800 mb-1">Upload Transcript Text</h3>
                    <p className="text-xs text-gray-600 mb-3">Paste a transcript or upload a .txt export.</p>
                    <input
                      type="file"
                      accept=".txt,text/plain,.vtt,text/vtt"
                      onChange={handleTranscriptTextUpload}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-gray-200 file:text-gray-800 hover:file:bg-gray-300"
                    />
                    <p className="text-[11px] text-gray-500 mt-2">Audio transcriptions will auto-fill the text area with speaker labels.</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-bold text-gray-700">Transcript Text</label>
                  {diarizedPreview && (
                    <span className="text-xs font-semibold text-green-700">Diarized transcription added</span>
                  )}
                </div>
                <textarea
                  className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-y text-xs mb-6"
                  placeholder="Paste full transcript or upload audio to populate this area with speaker labels..."
                  value={transcript}
                  onChange={(e) => handleTranscriptChange(e.target.value)}
                />
                <div className="flex justify-between">
                  <button onClick={() => setStep(WizardStep.BASELINE_REVIEW)} className="text-sm font-semibold text-gray-600 hover:text-gray-800 px-3 py-2 rounded">Back</button>
                  <button 
                    onClick={startSplit}
                    disabled={status === AppStatus.PROCESSING || !transcript || isTranscribingAudio}
                    className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold shadow-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {status === AppStatus.PROCESSING || isTranscribingAudio ? 'Processing...' : 'Split Transcript →'}
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
            onExport={handleExport}
          />
        )}

      </main>
    </div>
  );
}

export default App;
