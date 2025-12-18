import React, { useEffect, useMemo, useState } from 'react';

interface TourStep {
  id: string;
  targetId: string;
  title: string;
  description: string;
}

interface GuidedTourProps {
  open: boolean;
  steps: TourStep[];
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  labels: {
    next: string;
    prev: string;
    finish: string;
    close: string;
    stepLabel: string;
    demoNote: string;
  };
}

const HIGHLIGHT_PADDING = 12;

const GuidedTour: React.FC<GuidedTourProps> = ({
  open,
  steps,
  currentIndex,
  onClose,
  onNext,
  onPrev,
  labels
}) => {
  const [rect, setRect] = useState<DOMRect | null>(null);

  const activeStep = useMemo(() => steps[currentIndex], [steps, currentIndex]);

  useEffect(() => {
    if (!open || !activeStep) return;
    const selector = `[data-tour-id="${activeStep.targetId}"]`;

    const updatePosition = () => {
      const el = document.querySelector(selector) as HTMLElement | null;
      if (!el) {
        setRect(null);
        return;
      }
      const nextRect = el.getBoundingClientRect();
      setRect(nextRect);
    };

    const el = document.querySelector(selector) as HTMLElement | null;
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    }
    updatePosition();

    const handle = () => requestAnimationFrame(updatePosition);
    window.addEventListener('resize', handle);
    window.addEventListener('scroll', handle, true);

    return () => {
      window.removeEventListener('resize', handle);
      window.removeEventListener('scroll', handle, true);
    };
  }, [open, activeStep]);

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

  const highlightStyle = rect
    ? {
        top: Math.max(rect.top - HIGHLIGHT_PADDING, 8),
        left: Math.max(rect.left - HIGHLIGHT_PADDING, 8),
        width: rect.width + HIGHLIGHT_PADDING * 2,
        height: rect.height + HIGHLIGHT_PADDING * 2
      }
    : null;

  const bubbleStyle: React.CSSProperties = rect
    ? {
        top: Math.min(rect.bottom + 16, window.innerHeight - 240),
        left: Math.min(Math.max(rect.left, 16), window.innerWidth - 360),
        maxWidth: 360
      }
    : { top: '20%', left: '50%', transform: 'translateX(-50%)', maxWidth: 360 };

  const isLast = currentIndex >= steps.length - 1;

  return (
    <div className="fixed inset-0 z-[60] pointer-events-auto">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      {highlightStyle && (
        <div
          className="absolute rounded-xl ring-2 ring-white shadow-[0_0_0_8px_rgba(59,130,246,0.35)] bg-white/5"
          style={highlightStyle}
        />
      )}
      <div
        className="absolute bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 sm:p-6 space-y-3 pointer-events-auto"
        style={bubbleStyle}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wide text-blue-600">
              {labels.stepLabel} {currentIndex + 1} / {steps.length}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mt-1">{activeStep.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-xl leading-none"
            aria-label={labels.close}
          >
            ×
          </button>
        </div>
        <p className="text-sm text-gray-700">{activeStep.description}</p>
        <div className="text-[11px] text-gray-500 bg-gray-50 border border-gray-100 rounded-md px-3 py-2">
          {labels.demoNote}
        </div>
        <div className="flex justify-between items-center gap-2">
          <button
            onClick={onPrev}
            disabled={currentIndex === 0}
            className="px-3 py-2 text-sm font-semibold text-gray-700 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            {labels.prev}
          </button>
          <button
            onClick={isLast ? onClose : onNext}
            className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {isLast ? labels.finish : labels.next}
          </button>
        </div>
      </div>
    </div>
  );
};

export type { TourStep };
export default GuidedTour;
