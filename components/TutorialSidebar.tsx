import React, { useEffect } from 'react';
import type { TutorialStep, TutorialCase } from '../utils/tutorialData';

const LOADABLE_STEP_IDS = new Set([
  'tut-public-info', 'tut-baseline', 'tut-founder-input',
  'tut-baseline-review', 'tut-transcript', 'tut-split',
  'tut-split-confirm', 'tut-comparison'
]);

const CASE_STYLE: Record<string, { label: string; unloaded: string; loaded: string; dot: string }> = {
  'case-a': {
    label: 'Clean',
    unloaded: 'text-emerald-700 bg-white border-emerald-300 hover:bg-emerald-50',
    loaded:   'text-emerald-700 bg-emerald-50 border-emerald-300',
    dot:      'bg-emerald-400'
  },
  'case-b': {
    label: 'Messy',
    unloaded: 'text-amber-700 bg-white border-amber-300 hover:bg-amber-50',
    loaded:   'text-amber-700 bg-amber-50 border-amber-300',
    dot:      'bg-amber-400'
  }
};

interface TutorialSidebarProps {
  open: boolean;
  steps: TutorialStep[];
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  onLoadStepData: (stepId: string, tutCase: TutorialCase) => void;
  cases: TutorialCase[];
  stepCaseLoaded: Record<string, string>;
  onReturnToDashboard: () => void;
}

const TutorialSidebar: React.FC<TutorialSidebarProps> = ({
  open,
  steps,
  currentIndex,
  onClose,
  onNext,
  onPrev,
  onLoadStepData,
  cases,
  stepCaseLoaded,
  onReturnToDashboard
}) => {
  const activeStep = steps[currentIndex];
  const isLast = currentIndex >= steps.length - 1;
  const progress = steps.length > 0 ? ((currentIndex + 1) / steps.length) * 100 : 0;
  const canLoad = activeStep ? LOADABLE_STEP_IDS.has(activeStep.id) : false;
  const loadedCaseId = activeStep ? stepCaseLoaded[activeStep.id] : undefined;

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onNext();
      if (e.key === 'ArrowLeft') onPrev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose, onNext, onPrev]);

  if (!open || !activeStep) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[55] w-full px-4" style={{ maxWidth: 560 }}>
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">

        {/* Header row */}
        <div className="flex items-center gap-3 px-5 pt-4 pb-0">
          <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide shrink-0">
            Tutorial
          </span>
          <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-[11px] text-gray-400 shrink-0 tabular-nums">
            {currentIndex + 1} / {steps.length}
          </span>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-lg leading-none w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 shrink-0 ml-1"
            aria-label="Exit tutorial"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="px-5 pt-3 pb-4 space-y-2.5">
          <h3 className="text-sm font-bold text-gray-900 leading-snug">
            {activeStep.title}
          </h3>

          <p className="text-xs text-gray-600 leading-relaxed">
            {activeStep.body}
          </p>

          {activeStep.lookFor && (
            <p className="text-[11px] text-blue-800 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 leading-relaxed">
              <span className="font-bold">Look for: </span>{activeStep.lookFor}
            </p>
          )}

          {/* Bottom row: example buttons + navigation */}
          <div className="flex items-center gap-2 pt-1">

            {/* Example case buttons */}
            {canLoad && (
              <div className="flex items-center gap-1.5 shrink-0">
                {cases.map((tutCase) => {
                  const style = CASE_STYLE[tutCase.id] ?? CASE_STYLE['case-a'];
                  const isLoaded = loadedCaseId === tutCase.id;
                  return (
                    <button
                      key={tutCase.id}
                      onClick={() => !isLoaded && onLoadStepData(activeStep.id, tutCase)}
                      disabled={isLoaded}
                      title={`Load ${tutCase.companyName} example data`}
                      className={`flex items-center gap-1.5 text-[11px] font-semibold border rounded-lg px-2.5 py-1.5 transition-colors shrink-0 ${isLoaded ? style.loaded + ' cursor-default' : style.unloaded}`}
                    >
                      {isLoaded ? (
                        <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />
                      )}
                      {tutCase.companyName}
                      <span className="font-normal opacity-60 hidden sm:inline">— {style.label}</span>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex-1" />

            {/* Navigation */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={onReturnToDashboard}
                title="View example overview"
                className="text-[11px] font-medium text-gray-400 hover:text-purple-600 transition-colors px-1.5 py-1.5"
              >
                Examples
              </button>
              <button
                onClick={onPrev}
                disabled={currentIndex === 0}
                className="text-xs font-semibold text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                ←
              </button>
              <button
                onClick={isLast ? onClose : onNext}
                className="text-xs font-semibold bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 transition-colors"
              >
                {isLast ? 'Finish' : 'Next →'}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TutorialSidebar;
