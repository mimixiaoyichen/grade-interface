import React from 'react';
import type { TutorialCase } from '../utils/tutorialData';

interface CaseDashboardProps {
  cases: TutorialCase[];
  onSelectCase: (tutCase: TutorialCase) => void;
  onSkip: () => void;
}

const LABEL_CONFIG = {
  'clean': {
    tag: 'Confirmations & Modifications',
    tagColor: 'bg-emerald-100 text-emerald-700',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    border: 'border-emerald-200 hover:border-emerald-400',
    button: 'bg-emerald-600 hover:bg-emerald-700'
  },
  'hallucination-omission': {
    tag: 'Hallucination + Omission',
    tagColor: 'bg-amber-100 text-amber-700',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    border: 'border-amber-200 hover:border-amber-400',
    button: 'bg-amber-600 hover:bg-amber-700'
  }
} as const;

const CaseCard: React.FC<{ tutCase: TutorialCase; onSelect: () => void }> = ({ tutCase, onSelect }) => {
  const config = LABEL_CONFIG[tutCase.caseLabel];
  return (
    <div className={`flex flex-col bg-white rounded-2xl border-2 ${config.border} transition-colors duration-150 p-6 shadow-sm`}>
      <div className="flex items-center gap-2 mb-4">
        <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${config.tagColor}`}>
          {config.icon}
          {config.tag}
        </span>
      </div>

      <div className="mb-1">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{tutCase.domain}</span>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-0.5">{tutCase.companyName}</h2>
      <p className="text-sm text-gray-500 italic mb-4">{tutCase.tagline}</p>

      <p className="text-sm text-gray-600 leading-relaxed flex-1 mb-6">
        {tutCase.cardDescription}
      </p>

      <button
        onClick={onSelect}
        className={`w-full text-white py-3 rounded-xl font-bold text-sm transition-colors shadow-sm ${config.button}`}
      >
        Walk through this case →
      </button>
    </div>
  );
};

const CaseDashboard: React.FC<CaseDashboardProps> = ({ cases, onSelectCase, onSkip }) => {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-gray-50 px-4 py-8 overflow-y-auto">
      <div className="w-full max-w-2xl">
        <div className="flex items-center gap-2 mb-6">
          <span className="bg-purple-100 text-purple-700 text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide">
            Tutorial
          </span>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2 leading-tight">
          GRADE
        </h1>
        <p className="text-xs text-gray-400 mb-2 font-medium tracking-wide">
          Grounded Research with AI-assisted Discovery and Expert Validation
        </p>
        <p className="text-sm text-gray-500 mb-8 leading-relaxed max-w-lg">
          Choose a demo case to walk through. Both cases use the same domain (freelancer invoicing) so you can compare a well-aligned extraction with one that misses key details.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
          {cases.map((c) => (
            <CaseCard key={c.id} tutCase={c} onSelect={() => onSelectCase(c)} />
          ))}
        </div>

        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400 uppercase tracking-widest font-medium">What each step shows</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <div className="grid grid-cols-5 gap-3 mb-10">
          {[
            { n: '1', label: 'Retrieve', desc: 'Gather evidence' },
            { n: '2', label: 'Construct', desc: 'Candidate profile' },
            { n: '3', label: 'Blind Elicitation', desc: "Subject's account" },
            { n: '4', label: 'Reveal and Correct', desc: 'Compare & refine' },
            { n: '5', label: 'Validate', desc: 'Evidence & corrections' }
          ].map((item) => (
            <div key={item.n} className="flex flex-col items-center text-center gap-1.5">
              <span className="w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-xs">
                {item.n}
              </span>
              <span className="font-semibold text-gray-700 text-xs">{item.label}</span>
              <span className="text-gray-400 text-[11px]">{item.desc}</span>
            </div>
          ))}
        </div>

        <div className="text-center">
          <button
            onClick={onSkip}
            className="text-sm font-medium text-gray-400 hover:text-gray-600 py-2 transition-colors"
          >
            Skip — go straight to the tool
          </button>
        </div>
      </div>
    </div>
  );
};

export default CaseDashboard;
