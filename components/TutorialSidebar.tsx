import React, { useEffect } from 'react';
import type { TutorialStep } from '../utils/tutorialData';

interface TutorialSidebarProps {
  open: boolean;
  steps: TutorialStep[];
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

const TutorialSidebar: React.FC<TutorialSidebarProps> = ({
  open,
  steps,
  currentIndex,
  onClose,
  onNext,
  onPrev
}) => {
  const activeStep = steps[currentIndex];
  const isLast = currentIndex >= steps.length - 1;
  const progress = steps.length > 0 ? ((currentIndex + 1) / steps.length) * 100 : 0;

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
    <div
      className="fixed top-0 right-0 w-[300px] h-screen bg-white border-l border-gray-200 shadow-2xl z-[55] flex flex-col"
      role="complementary"
      aria-label="Tutorial sidebar"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-5 pb-3 border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-2">
          <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
            Tutorial
          </span>
          <span className="text-xs text-gray-400">
            {currentIndex + 1} / {steps.length}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-700 text-xl leading-none w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100"
          aria-label="Exit tutorial"
        >
          ×
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-[3px] bg-gray-100 shrink-0">
        <div
          className="h-full bg-purple-500 transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
        <h3 className="text-[15px] font-bold text-gray-900 leading-snug">
          {activeStep.title}
        </h3>
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
          {activeStep.body}
        </p>

        {activeStep.lookFor && (
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3.5">
            <div className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1.5">
              Look for
            </div>
            <p className="text-xs text-blue-900 leading-relaxed">
              {activeStep.lookFor}
            </p>
          </div>
        )}

        {activeStep.tip && (
          <div className="bg-amber-50 border border-amber-100 rounded-lg p-3.5">
            <div className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-1.5">
              Interviewer tip
            </div>
            <p className="text-xs text-amber-900 leading-relaxed">
              {activeStep.tip}
            </p>
          </div>
        )}
      </div>

      {/* Demo note */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 shrink-0">
        <p className="text-[10px] text-gray-400 text-center leading-relaxed">
          Demo data only — no API calls made
        </p>
      </div>

      {/* Navigation */}
      <div className="flex gap-2 px-4 py-4 shrink-0">
        <button
          onClick={onPrev}
          disabled={currentIndex === 0}
          className="flex-1 px-3 py-2.5 text-sm font-semibold text-gray-700 border border-gray-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={isLast ? onClose : onNext}
          className="flex-1 px-3 py-2.5 text-sm font-semibold bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          {isLast ? 'Finish' : 'Next →'}
        </button>
      </div>
    </div>
  );
};

export default TutorialSidebar;
