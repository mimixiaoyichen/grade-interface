
import React, { useState } from 'react';
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
} from './services/geminiService';
import { 
  AppStatus, 
  StatementResult, 
  TranscriptSplit, 
  GeminiAnalysisResponse,
  WizardStep,
  BaselineStatement,
  ComparisonRow
} from './types';

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
      setFounderInput(INITIAL_STATEMENT);
      setBaselineStatement(null);
      setBaselineSource('');
      setTranscript('');
      setSplitData(null);
      setPart1Result(null);
      setComparisonRows([]);
      setErrorMsg('');
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
      setStatus(AppStatus.SUCCESS);
    } catch (e: any) {
      setErrorMsg(e.message);
      setStatus(AppStatus.ERROR);
    }
  };

  // Step 1 -> Step 2
  const generateBaseline = async () => {
    const trimmedPublicInfo = publicInfo.trim();
    if (!trimmedPublicInfo) return setErrorMsg("Public information is required.");

    // If we already generated from this exact public info, just continue without re-calling the model
    if (baselineStatement && baselineSource === trimmedPublicInfo) {
      setErrorMsg('');
      setStatus(AppStatus.SUCCESS);
      setStep(WizardStep.FOUNDER_INPUT);
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
      setStep(WizardStep.FOUNDER_INPUT);
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
      // Format structured founder input into string context
      const founderContextString = `
        Solution: ${founderInput.SOLUTION}
        Customer: ${founderInput.CUSTOMER_SEGMENT}
        Context: ${founderInput.LIFE_BUSINESS_CONTEXT}
        Job To Be Done: ${founderInput.JOB_TO_BE_DONE}
        Barriers: ${founderInput.SPECIFIC_BARRIERS.join('; ')}
      `;

      const res1 = await analyzeSegment(p1, publicInfo, founderContextString);
      
      const mapToState = (raw: GeminiAnalysisResponse, prefix: string): StatementResult => ({
        customers: raw.customers.map((i, idx) => ({ ...i, id: `${prefix}-c-${idx}`, isVerified: false, userNotes: '' })),
        contexts: raw.contexts.map((i, idx) => ({ ...i, id: `${prefix}-ctx-${idx}`, isVerified: false, userNotes: '' })),
        goals: raw.goals.map((i, idx) => ({ ...i, id: `${prefix}-g-${idx}`, isVerified: false, userNotes: '' })),
        barriers: raw.barriers.map((i, idx) => ({ ...i, id: `${prefix}-b-${idx}`, isVerified: false, userNotes: '' })),
        draftStatement: raw.finalStatement
      });

      setPart1Result(mapToState(res1, 'p1'));
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
      const compRes = await generateComparison(baselineStatement, splitData.part2, publicInfo);
      
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
     let csv = "data:text/csv;charset=utf-8,Section,Component,Original,Modification,Type,Evidence,Public Support,Accepted\n";
     part1Result?.customers.forEach(i => csv += `"Part 1 (Discovery)","Customer","","${i.description.replace(/"/g, '""')}","","${i.quotes.join(' ').replace(/"/g, '""')}","${i.publicEvidence?.replace(/"/g, '""') || ''}","${i.isVerified}"\n`);
     comparisonRows.forEach(row => {
       csv += `"Part 2 (Feedback)","${row.component}","${row.baselineText.replace(/"/g, '""')}","${row.transcriptModification.replace(/"/g, '""')}","${row.type}","${row.transcriptEvidence.replace(/"/g, '""')}","${row.publicSupport.replace(/"/g, '""')}","${row.isAccepted}"\n`;
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
    const steps = ["Public Info", "Founder Input", "Review Baseline", "Transcript", "Discovery (P1)", "Feedback (P2)"];
    return (
      <div className="flex justify-between items-center max-w-4xl mx-auto mb-8 relative">
        <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -z-10"></div>
        {steps.map((label, idx) => {
          const isActive = step === idx;
          const isCompleted = step > idx;
          return (
            <div key={idx} className="flex flex-col items-center bg-gray-50 px-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${isActive ? 'bg-blue-600 text-white' : isCompleted ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
                {isCompleted ? '✓' : idx + 1}
              </div>
              <span className={`text-[10px] mt-1 font-medium ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>{label}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const isBaselineCurrent = Boolean(baselineStatement && baselineSource === publicInfo.trim());

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      <div className="bg-white p-4 shadow-sm border-b border-gray-200 sticky top-0 z-20">
         <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
             <h1 className="text-xl font-bold text-gray-800">Founder Problem Analyst</h1>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
             {/* API Key managed via environment variable */}
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
            <h2 className="text-2xl font-bold mb-2">1. Public Information</h2>
            <p className="text-gray-500 mb-6 text-sm">Provide the "Public Truth" baseline. You can paste text/files or use Google Search.</p>
            
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
            
            <div className="flex justify-end">
              <button 
                onClick={generateBaseline}
                disabled={status === AppStatus.PROCESSING}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold shadow-md hover:bg-blue-700 disabled:opacity-50"
              >
                {status === AppStatus.PROCESSING 
                  ? 'Analyzing Public Info...' 
                  : isBaselineCurrent 
                    ? 'Continue →' 
                    : 'Generate Baseline →'}
              </button>
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
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Goal (Job To Be Done)</label>
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
              <button onClick={() => setStep(WizardStep.PUBLIC_INFO)} className="text-gray-500 hover:text-gray-800">Back</button>
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
                  <button onClick={() => setStep(WizardStep.BASELINE_REVIEW)} className="text-gray-500 hover:text-gray-800">Back</button>
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
                 <button onClick={() => setStep(WizardStep.TRANSCRIPT_UPLOAD)} className="text-gray-500 hover:text-gray-800 px-3">Back</button>
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
                 <button onClick={() => setStep(WizardStep.PART1_ANALYSIS)} className="text-gray-500 hover:text-gray-800">Back</button>
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
