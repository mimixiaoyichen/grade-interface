
import React, { useEffect, useState } from 'react';
import AnalysisSection from './components/AnalysisSection';
import SplitVerifier from './components/SplitVerifier';
import BaselineReview from './components/BaselineReview';
import ComparisonTable from './components/ComparisonTable';
import { 
  analyzeSegment, 
  splitTranscript, 
  generateBaselineStatement, 
  generateComparison,
  fetchPublicInfoFromUrl
} from './services/aiService';
import {
  AppStatus, 
  StatementResult, 
  TranscriptSplit, 
  AIAnalysisResponse,
  WizardStep,
  BaselineStatement,
  ComparisonRow
} from './types';
import INTERVIEWER_GUIDE from './prompts/interviewerGuide.md?raw';

type GuideBlock = {
  subtitle?: string;
  bullets?: string[];
  paragraphs?: string[];
};

type GuideSection = {
  title: string;
  description?: string;
  blocks: GuideBlock[];
};

const GUIDE_SECTIONS: GuideSection[] = [
  {
    title: 'Understanding Problem Framework Variables',
    blocks: [
      { subtitle: 'Solution — IS', bullets: [
        'The product, service, or offering the startup provides.',
        'What the startup has built and is selling/offering to customers.',
        'Examples: "AI-powered brand monitoring dashboard", "Automated expense management platform", "No-code workflow automation tool".',
      ]},
      { subtitle: 'Solution — IS NOT', bullets: [
        'Vague marketing taglines (e.g., "we help companies succeed").',
        'Benefits or outcomes (those are goals/aspirations).',
        'Customer problems or pain points (those are barriers).',
        'Aspirational products not yet built or publicly launched.',
      ]},
      { subtitle: 'Customer Segment — IS', bullets: [
        'Those whose pain points the startup is alleviating, as represented in public communication.',
        'Example: "HR managers at 50-200 person companies".',
      ]},
      { subtitle: 'Customer Segment — IS NOT', bullets: [
        'End users who differ from the public target (e.g., kids using app vs. parents as target).',
        'Aspirational customers not yet publicly targeted (violates public info requirement).',
      ]},
    ],
  },
  {
    title: 'Identifying the Real Customer (Multi-Stakeholder)',
    description: 'Determine the primary customer when multiple stakeholders are involved.',
    blocks: [
      { subtitle: 'Decision Framework: Who is the startup solving for?', bullets: [
        'Website Value Proposition Test: read homepage; whose problem is emphasized? (e.g., "Cut infrastructure costs by 40%" → Finance; "Deploy faster..." → Engineering).',
        'Case Study/Testimonial Test: whose titles are quoted most?',
        'Barriers & Goals Alignment Test: from whose perspective are goals/barriers written? (e.g., "Manual approval slows procurement" → Ops).',
        'Jobs-to-be-Done Anchor: when someone "hires" this product, whose job is being done?',
      ]},
      { subtitle: 'Rule of Thumb', paragraphs: [
        'If the website could be rewritten to appeal to a different stakeholder without changing the product, you picked the wrong customer. The customer is whoever experiences the core barriers/goals emphasized publicly.',
      ]},
      { subtitle: 'Multi-Stakeholder Examples', paragraphs: [
        'Dev tool bought by CFO: Product = CI/CD; CFO approves (cost), Engineering uses (speed). Customer = Engineering (pain points drive purchase).',
        'Financial software bought by CFO: Product = Expense mgmt; CFO approves/uses; employees submit. Customer = CFO/Finance (controls/compliance).',
        'Learning platform: HR buys/assigns; employees take courses; managers track. Customer = HR (compliance/onboarding pains).',
      ]},
    ],
  },
  {
    title: 'Context, Goals, Barriers',
    blocks: [
      { subtitle: 'Context (When) — IS', bullets: [
        'Specific triggering situation/timing when problem occurs (e.g., "when preparing quarterly business reviews").',
      ]},
      { subtitle: 'Context — IS NOT', bullets: [
        'General business operations; vague timing like "always" or "whenever working".',
      ]},
      { subtitle: 'Goal / Aspiration — IS', bullets: [
        'Desired outcome/end state the customer wants, solution-agnostic (e.g., "track brand visibility in AI search results").',
        'Future-oriented; emotional or functional progress.',
      ]},
      { subtitle: 'Goal / Aspiration — IS NOT', bullets: [
        'Features of your solution, process steps, or generic "be more efficient".',
      ]},
      { subtitle: 'Barriers — IS', bullets: [
        'Specific obstacles preventing the goal (e.g., "Hard to gather reliable, comparable data on early-stage startups").',
        'Explain why customers are stuck; map to value props.',
      ]},
      { subtitle: 'Barriers — IS NOT', bullets: [
        'Vague terms like "lack of resources", "complexity", competitive disadvantages.',
      ]},
    ],
  },
  {
    title: 'Critical Filtering: Public vs Private & Nonsense',
    blocks: [
      { subtitle: 'Interview Technique', bullets: [
        'Prompt founders: "Think about your website first" to anchor in public info.',
        'Primary focus: verify solutions/customers match public communication.',
      ]},
      { subtitle: 'Filter Problematic Responses', bullets: [
        'Private information: internal strategy, aspirational not public, sales-only details, customer specifics, pivot plans, undisclosed metrics.',
        'Nonsensical responses: unrelated to the variable, contradictory, incoherent, or wildly off-website.',
      ]},
      { subtitle: 'Red Flags (General)', bullets: [
        'Answer about wrong variable (barriers vs goals), contradictions, incomprehensible reasoning, off-website divergence.',
      ]},
      { subtitle: 'Red Flags (Customer Segment)', bullets: [
        'Customer doesn’t match any website messaging, 3+ equal segments, "everyone needs this", segments change across variables.',
      ]},
      { subtitle: 'Action', bullets: [
        'Probe: clarify how the response relates to the specific variable.',
        'Anchor: "When I look at your website, who would I think is your primary customer?"',
      ]},
      { subtitle: 'Public Information', bullets: [
        'Available to anyone: website, LinkedIn, PitchBook/Crunchbase, press, case studies, blog posts, social media.',
        'If an LLM could find it via web search, it’s PUBLIC.',
      ]},
      { subtitle: 'Private Information', bullets: [
        'Requires insider access/relationship: roadmap, future pivots, sales-call learnings, specific implementations, undisclosed metrics.',
        'If it requires being an insider/customer, it’s PRIVATE.',
      ]},
    ],
  },
  {
    title: 'Corner Cases',
    blocks: [
      { subtitle: 'Product Offering Mismatches', bullets: [
        'Features/customers not on the website → PRIVATE.',
        'Variables tied to non-public products → PRIVATE.',
        'Signals: "website is outdated", "we used to", "we’re pivoting", "we spun out".',
      ]},
      { subtitle: 'Barriers/Aspirations Not Explicit Online', bullets: [
        'Barriers/goals are rarely explicit, but should logically follow from public products/customers.',
        'If tied to non-public products/customers, treat as PRIVATE.',
      ]},
    ],
  },
];

const INITIAL_STATEMENT: BaselineStatement = {
  SOLUTION: '',
  CUSTOMER_SEGMENT: '',
  LIFE_BUSINESS_CONTEXT: '',
  JOB_TO_BE_DONE: '',
  SPECIFIC_BARRIERS: ['']
};

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
  const [baselineNotes, setBaselineNotes] = useState<string>('');
  const [baselineSource, setBaselineSource] = useState<string>('');

  // Step 4: Transcript Part 1
  const [transcript, setTranscript] = useState<string>('');
  const [splitData, setSplitData] = useState<TranscriptSplit | null>(null);
  const [part1Result, setPart1Result] = useState<StatementResult | null>(null);

  // Step 5: Part 2 Comparison
  const [comparisonRows, setComparisonRows] = useState<ComparisonRow[]>([]);

  // UI helpers
  const [isStatementOpen, setIsStatementOpen] = useState(true);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [showGuideGlow, setShowGuideGlow] = useState(false);
  const [hasFetchedPublicInfo, setHasFetchedPublicInfo] = useState(false);

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

  const handleReset = () => {
    if (window.confirm("Are you sure you want to clear all data and start over?")) {
      setStep(WizardStep.PUBLIC_INFO);
      setStatus(AppStatus.IDLE);
      setPublicInfo('');
      setCompanyUrl('');
      setPitchbookInfo('');
      setFounderInput(INITIAL_STATEMENT);
      setBaselineStatement(null);
      setBaselineSource('');
      setTranscript('');
      setSplitData(null);
      setPart1Result(null);
      setComparisonRows([]);
      setErrorMsg('');
      setHasFetchedPublicInfo(false);
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
      setBaselineStatement(res);
      setBaselineSource(trimmedPublicInfo);
      // Clear downstream data that depends on baseline
      setComparisonRows([]); 
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
      setStatus(AppStatus.SUCCESS); 
    } catch (e: any) {
      setErrorMsg(e.message);
      setStatus(AppStatus.ERROR);
    }
  };

  // Step 4 Confirm Split -> Analyze Part 1
  const handleConfirmSplitAndAnalyze = async (p1: string, p2: string) => {
    const isTextUnchanged = splitData && splitData.part1 === p1 && splitData.part2 === p2;
    if (part1Result && isTextUnchanged) {
        setStep(WizardStep.PART1_ANALYSIS);
        return;
    }

    setSplitData(prev => prev ? { ...prev, part1: p1, part2: p2 } : null);
    setComparisonRows([]);
    
    setStatus(AppStatus.PROCESSING);
    
    try {
      // Analyze Part 1 (Discovery)
      const founderContextString = `
        Solution: ${founderInput.SOLUTION}
        Customer: ${founderInput.CUSTOMER_SEGMENT}
        Context: ${founderInput.LIFE_BUSINESS_CONTEXT}
        Goals: ${founderInput.JOB_TO_BE_DONE}
        Barriers: ${founderInput.SPECIFIC_BARRIERS.join('; ')}
      `;

      const combinedInfo = getCombinedPublicInfo();
      const analysisPromise = analyzeSegment(p1, combinedInfo, founderContextString);
      const comparisonPromise = baselineStatement
        ? generateComparison(baselineStatement, p2, combinedInfo)
        : null;

      const [analysisResult, comparisonResult] = await Promise.allSettled([
        analysisPromise,
        comparisonPromise
      ]);

      if (analysisResult.status === 'rejected') {
        throw analysisResult.reason;
      }

      const mapToState = (raw: AIAnalysisResponse, prefix: string): StatementResult => ({
        customers: raw.customers.map((i, idx) => ({ ...i, id: `${prefix}-c-${idx}`, isVerified: false, userNotes: '' })),
        contexts: raw.contexts.map((i, idx) => ({ ...i, id: `${prefix}-ctx-${idx}`, isVerified: false, userNotes: '' })),
        goals: raw.goals.map((i, idx) => ({ ...i, id: `${prefix}-g-${idx}`, isVerified: false, userNotes: '' })),
        barriers: raw.barriers.map((i, idx) => ({ ...i, id: `${prefix}-b-${idx}`, isVerified: false, userNotes: '' })),
        draftStatement: raw.finalStatement
      });

      setPart1Result(mapToState(analysisResult.value, 'p1'));

      if (comparisonResult && comparisonResult.status === 'fulfilled' && comparisonResult.value) {
        const rowsWithIds = comparisonResult.value.rows.map((r, i) => ({
          ...r,
          id: `row-${i}`,
          isAccepted: false
        }));
        setComparisonRows(rowsWithIds);
      } else if (comparisonResult && comparisonResult.status === 'rejected') {
        // Non-blocking: allow user to retry from Part 2
        console.error('Comparison generation failed', comparisonResult.reason);
      }

      setStatus(AppStatus.SUCCESS);
      setStep(WizardStep.PART1_ANALYSIS);

    } catch (e: any) {
      setErrorMsg(e.message);
      setStatus(AppStatus.ERROR);
    }
  };

  // Step 4 (Part 1 View) -> Step 5 (Comparison)
  const proceedToComparison = async () => {
    if (!baselineStatement || !splitData) return;

    if (comparisonRows.length > 0) {
      setStep(WizardStep.PART2_COMPARISON);
      return;
    }

    setStatus(AppStatus.PROCESSING);
    try {
      const compRes = await generateComparison(baselineStatement, splitData.part2, getCombinedPublicInfo());
      
      const rowsWithIds = compRes.rows.map((r, i) => ({
        ...r,
        id: `row-${i}`,
        isAccepted: false 
      }));
      
      setComparisonRows(rowsWithIds);
      setStatus(AppStatus.SUCCESS);
      setStep(WizardStep.PART2_COMPARISON);

    } catch (e: any) {
      setErrorMsg(e.message);
      setStatus(AppStatus.ERROR);
    }
  };

  // --- Export ---
  const handleExport = () => {
     const sanitize = (val: string | undefined | null) => (val ?? '').replace(/"/g, '""');
     let csv = "data:text/csv;charset=utf-8,Section,Component,Original,Modification,Type,Evidence,Public Support,Accepted\n";

     const addDiscoveryItems = (items: { description: string; quotes: string[]; publicEvidence?: string; isVerified?: boolean; }[], label: string) => {
       items.forEach(i => {
         csv += `"Part 1 (Discovery)","${label}","","${sanitize(i.description)}","","${sanitize(i.quotes.join(' '))}","${sanitize(i.publicEvidence || '')}","${i.isVerified || false}"\n`;
       });
     };

     if (part1Result) {
       addDiscoveryItems(part1Result.customers, "Customer");
       addDiscoveryItems(part1Result.contexts, "Context");
       addDiscoveryItems(part1Result.goals, "Goal");
       addDiscoveryItems(part1Result.barriers, "Barrier");
     }

     comparisonRows.forEach(row => {
       csv += `"Part 2 (Feedback)","${row.component}","${sanitize(row.baselineText)}","${sanitize(row.transcriptModification)}","${row.type}","${sanitize(row.transcriptEvidence)}","${sanitize(row.publicSupport)}","${row.isAccepted}"\n`;
     });

     const encodedUri = encodeURI(csv);
     const link = document.createElement("a");
     link.setAttribute("href", encodedUri);
     link.setAttribute("download", "founder_analysis_full.csv");
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
  };


  // --- Render Helpers ---

  const renderStepIndicator = () => {
    const steps = ["Pre-interview", "Founder Input", "Review Baseline", "Transcript", "Discovery (P1)", "Feedback (P2)"];

    const availability = [
      true,
      Boolean(baselineStatement),
      Boolean(baselineStatement),
      Boolean(baselineStatement),
      Boolean(part1Result),
      comparisonRows.length > 0 || Boolean(part1Result && splitData)
    ];

    return (
      <div className="flex justify-between items-center max-w-4xl mx-auto mb-8 relative">
        <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -z-10"></div>
        {steps.map((label, idx) => {
          const isActive = step === idx;
          const isCompleted = step > idx;
          const isAvailable = availability[idx];
          const baseClasses = isActive
            ? 'bg-blue-600 text-white'
            : isCompleted
              ? 'bg-green-500 text-white'
              : isAvailable
                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                : 'bg-gray-300 text-gray-600';

          const handleClick = () => {
            if (idx === step) return;
            if (isAvailable) setStep(idx as WizardStep);
          };

          return (
            <button
              key={idx}
              onClick={handleClick}
              className="flex flex-col items-center bg-gray-50 px-2 focus:outline-none"
              disabled={!isAvailable}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${baseClasses}`}>
                {isCompleted ? '✓' : idx + 1}
              </div>
              <span className={`text-[10px] mt-1 font-medium ${isActive ? 'text-blue-600' : isAvailable ? 'text-blue-700' : 'text-gray-400'}`}>{label}</span>
            </button>
          );
        })}
      </div>
    );
  };

  const isBaselineCurrent = Boolean(baselineStatement && baselineSource === getCombinedPublicInfo().trim());

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
             <h2 className="text-sm font-semibold text-gray-600">Step {step + 1} of 6</h2>
           </div>
           <button onClick={handleReset} className="text-red-500 hover:text-red-700 text-xs font-bold uppercase tracking-wide">
             Clear All & Restart
           </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 pb-32">
        {renderGuideModal()}
        {renderStepIndicator()}
        
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
                <p className="text-gray-500 text-sm">Provide the "Public Truth" baseline. You can paste text/files or use Google Search.</p>
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
                  <h3 className="text-lg font-bold text-gray-800 mb-2">LLM Baseline (Preview)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-800">
                    <div><span className="font-semibold">Solution:</span> {baselineStatement.SOLUTION}</div>
                    <div><span className="font-semibold">Customer:</span> {baselineStatement.CUSTOMER_SEGMENT}</div>
                    <div><span className="font-semibold">Context:</span> {baselineStatement.LIFE_BUSINESS_CONTEXT}</div>
                    <div><span className="font-semibold">Goals:</span> {baselineStatement.JOB_TO_BE_DONE}</div>
                    <div className="md:col-span-2">
                      <span className="font-semibold">Barriers:</span> {baselineStatement.SPECIFIC_BARRIERS.join('; ')}
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
            <h2 className="text-2xl font-bold mb-2">2. Founder's Perspective</h2>
            <p className="text-gray-500 mb-6 text-sm">What does the founder <em>think</em> the problem is? Enter their manual statement below.</p>
            
            <div className="space-y-6 mb-8">
              
              {/* Solution */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Solution</label>
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 resize-y text-sm placeholder-gray-300"
                  rows={2}
                  placeholder="e.g. AI-powered diagnostic tool for radiologists"
                  value={founderInput.SOLUTION}
                  onChange={(e) => updateFounderInput('SOLUTION', e.target.value)}
                />
              </div>

              {/* Customer Segment */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Customer Segment</label>
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 resize-y text-sm placeholder-gray-300"
                  rows={2}
                  placeholder="e.g. Radiologists in high-volume trauma centers"
                  value={founderInput.CUSTOMER_SEGMENT}
                  onChange={(e) => updateFounderInput('CUSTOMER_SEGMENT', e.target.value)}
                />
              </div>

              {/* Context */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Context</label>
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 resize-y text-sm placeholder-gray-300"
                  rows={2}
                  placeholder="e.g. When reviewing overnight CT scans with limited staff"
                  value={founderInput.LIFE_BUSINESS_CONTEXT}
                  onChange={(e) => updateFounderInput('LIFE_BUSINESS_CONTEXT', e.target.value)}
                />
              </div>

              {/* Goal / Job */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Goal</label>
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 resize-y text-sm placeholder-gray-300"
                  rows={2}
                  placeholder="e.g. To identify critical fractures accurately and quickly"
                  value={founderInput.JOB_TO_BE_DONE}
                  onChange={(e) => updateFounderInput('JOB_TO_BE_DONE', e.target.value)}
                />
              </div>

              {/* Barriers */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Barriers</label>
                  <button 
                    onClick={() => updateFounderInput('SPECIFIC_BARRIERS', [...founderInput.SPECIFIC_BARRIERS, ""])} 
                    className="text-xs text-purple-600 hover:underline font-bold"
                  >
                    + Add Barrier
                  </button>
                </div>
                <div className="space-y-3">
                  {founderInput.SPECIFIC_BARRIERS.map((barrier, idx) => (
                    <div key={idx} className="flex gap-2">
                      <span className="text-gray-400 text-sm py-2 w-4 text-right">{idx + 1}.</span>
                      <input
                        type="text"
                        className="flex-1 p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500"
                        placeholder="e.g. Fatigue leads to missed fractures"
                        value={barrier}
                        onChange={(e) => {
                          const newBarriers = [...founderInput.SPECIFIC_BARRIERS];
                          newBarriers[idx] = e.target.value;
                          updateFounderInput('SPECIFIC_BARRIERS', newBarriers);
                        }}
                      />
                       <button 
                        onClick={() => {
                          const newBarriers = founderInput.SPECIFIC_BARRIERS.filter((_, i) => i !== idx);
                          updateFounderInput('SPECIFIC_BARRIERS', newBarriers);
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
              <button onClick={() => setStep(WizardStep.PUBLIC_INFO)} className="text-sm font-semibold text-gray-600 hover:text-gray-800 px-3 py-2 rounded">Back</button>
              <button 
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
            onUpdate={(updated, notes) => {
              setBaselineStatement(updated);
              setBaselineNotes(notes);
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
                <h2 className="text-2xl font-bold mb-2">4. Upload Transcript</h2>
                <p className="text-gray-500 mb-6 text-sm">We will split this into "Discovery" (Part 1) and "Feedback" (Part 2).</p>
                <input type="file" onChange={(e) => handleFileUpload(e, setTranscript)} className="block w-full text-sm text-gray-500 mb-4 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                <textarea
                  className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-y text-xs mb-6"
                  placeholder="Paste full transcript..."
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                />
                <div className="flex justify-between">
                  <button onClick={() => setStep(WizardStep.BASELINE_REVIEW)} className="text-sm font-semibold text-gray-600 hover:text-gray-800 px-3 py-2 rounded">Back</button>
                  <button 
                    onClick={startSplit}
                    disabled={status === AppStatus.PROCESSING || !transcript}
                    className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold shadow-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {status === AppStatus.PROCESSING ? 'Processing...' : 'Split Transcript →'}
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

        {/* STEP 5: PART 1 ANALYSIS (Discovery) */}
        {step === WizardStep.PART1_ANALYSIS && part1Result && (
          <div className="animate-fade-in-up">
            <div className="bg-purple-50 border border-purple-200 p-6 rounded-lg mb-8">
               <h3 className="text-purple-900 font-bold uppercase text-xs tracking-wider mb-2">Reference: Founder's Manual Statement (from Step 2)</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-purple-900">
                  <div><span className="font-bold">Customer:</span> {founderInput.CUSTOMER_SEGMENT}</div>
                  <div><span className="font-bold">Goal:</span> {founderInput.JOB_TO_BE_DONE}</div>
                  <div className="md:col-span-2"><span className="font-bold">Barriers:</span> {founderInput.SPECIFIC_BARRIERS.join(', ')}</div>
               </div>
            </div>

            <div className="flex justify-between items-center mb-6">
               <h2 className="text-2xl font-bold text-gray-800">Part 1 Results: Discovery</h2>
               <div className="flex gap-2">
                 <button onClick={() => setStep(WizardStep.TRANSCRIPT_UPLOAD)} className="text-sm font-semibold text-gray-600 hover:text-gray-800 px-3 py-2 rounded">Back</button>
                 <button 
                   onClick={proceedToComparison}
                   disabled={status === AppStatus.PROCESSING}
                   className="bg-green-600 text-white px-6 py-2 rounded shadow hover:bg-green-700 text-sm font-bold disabled:opacity-50"
                 >
                   {status === AppStatus.PROCESSING ? 'Generating Comparison...' : 'Proceed to Part 2 (Feedback) →'}
                 </button>
               </div>
            </div>

            <AnalysisSection title="Customers" items={part1Result.customers} colorClass="border-purple-200" onUpdate={(i) => setPart1Result({...part1Result, customers: i})} />
            <AnalysisSection title="Contexts" items={part1Result.contexts} colorClass="border-teal-200" onUpdate={(i) => setPart1Result({...part1Result, contexts: i})} />
            <AnalysisSection title="Goals" items={part1Result.goals} colorClass="border-orange-200" onUpdate={(i) => setPart1Result({...part1Result, goals: i})} />
            <AnalysisSection title="Barriers" items={part1Result.barriers} colorClass="border-red-200" onUpdate={(i) => setPart1Result({...part1Result, barriers: i})} />
          
            {/* Draft Statement Footer for Part 1 */}
            <div className={`fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700 shadow-2xl z-30 transition-all duration-300 ease-in-out ${isStatementOpen ? 'h-auto' : 'h-10 overflow-hidden'}`}>
              <div className="max-w-7xl mx-auto px-4 h-full flex flex-col">
                <div className="flex items-center justify-between py-2 cursor-pointer select-none border-b border-slate-700" onClick={() => setIsStatementOpen(!isStatementOpen)}>
                   <div className="flex items-center gap-2">
                     <h3 className="text-slate-100 font-bold uppercase tracking-wider text-sm">Part 1 Draft Statement</h3>
                     {!isStatementOpen && <span className="text-slate-400 text-xs truncate max-w-lg"> - {part1Result.draftStatement.substring(0, 50)}...</span>}
                   </div>
                   <button className="text-slate-400 hover:text-white transform transition-transform duration-200" style={{ transform: isStatementOpen ? 'rotate(0deg)' : 'rotate(180deg)' }}>
                     ▼
                   </button>
                </div>
                <div className="pb-6 pt-4">
                  <textarea
                    value={part1Result.draftStatement}
                    onChange={(e) => setPart1Result({...part1Result, draftStatement: e.target.value})}
                    className="w-full bg-transparent border-none p-0 text-xl font-serif text-white resize-none focus:ring-0"
                    rows={3}
                    placeholder="Draft your statement here..."
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: PART 2 COMPARISON (Table) */}
        {step === WizardStep.PART2_COMPARISON && (
          <div className="animate-fade-in-up pb-20">
            <div className="flex justify-between items-center mb-8">
               <div className="flex items-center gap-4">
                 <button onClick={() => setStep(WizardStep.PART1_ANALYSIS)} className="text-sm font-semibold text-gray-600 hover:text-gray-800 px-3 py-2 rounded">Back</button>
                 <div>
                   <h2 className="text-2xl font-bold text-gray-800">Part 2 Results: Feedback & Comparison</h2>
                   <p className="text-gray-500">Comparing Baseline (Public Info) vs. Founder's Transcript Feedback.</p>
                 </div>
               </div>
               <button onClick={handleExport} className="bg-gray-800 text-white px-6 py-2 rounded shadow hover:bg-black font-bold">
                  Download Full CSV
               </button>
            </div>

            <ComparisonTable 
              rows={comparisonRows}
              onUpdate={setComparisonRows}
            />
          </div>
        )}

      </main>
    </div>
  );
}

export default App;
