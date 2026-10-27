import React, { useEffect, useRef, useState } from 'react';
import type { TutorialStep, TutorialCase } from '../utils/tutorialData';

// Renders **bold** markers and \n\n paragraph breaks from body strings.
// A paragraph of exactly "---" renders as extra vertical space instead of text.
function renderBody(text: string, baseClass: string): React.ReactNode {
  return text.split('\n\n').map((para, i) => {
    if (para.trim() === '---') return <div key={i} className="mt-4" />;
    const lines = para.split('\n');
    const content = lines.flatMap((line, li) => {
      const parts = line.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
        part.startsWith('**') && part.endsWith('**')
          ? <strong key={`${li}-${j}`}>{part.slice(2, -2)}</strong>
          : part
      );
      return li < lines.length - 1 ? [...parts, <br key={`br-${li}`} />] : parts;
    });
    return <p key={i} className={i > 0 ? `mt-2 ${baseClass}` : baseClass}>{content}</p>;
  });
}

const LOADABLE_STEP_IDS = new Set([
  'tut-public-info', 'tut-baseline', 'tut-founder-input',
  'tut-baseline-review', 'tut-transcript', 'tut-split',
  'tut-split-confirm', 'tut-comparison'
]);

// Maps tutorial step IDs to data-tour-id attributes in App.tsx
const STEP_HIGHLIGHTS: Record<string, string> = {
  'tut-public-info':    'tour-fetch-url',
  'tut-baseline':       'tour-baseline-preview',
  'tut-founder-input':  'tour-founder-input',
  'tut-consent':        'tour-consent',
  'tut-baseline-review':'tour-baseline-review',
  'tut-transcript':     'tour-transcript-upload',
  'tut-split':          'tour-transcript-split',
  'tut-comparison':     'tour-comparison',
  'tut-export':         'tour-comparison-export',
};

const CASE_STYLE: Record<string, { label: string; unloaded: string; loaded: string; dot: string; border: string }> = {
  'case-a': {
    label: 'Confirmations & Modifications',
    unloaded: 'text-emerald-700 bg-white border-emerald-300 hover:bg-emerald-50',
    loaded:   'text-emerald-700 bg-emerald-50 border-emerald-300',
    dot:      'bg-emerald-400',
    border:   'border-emerald-300 hover:border-emerald-500'
  },
  'case-b': {
    label: 'Hallucination & Omission',
    unloaded: 'text-red-700 bg-white border-red-300 hover:bg-red-50',
    loaded:   'text-red-700 bg-red-50 border-red-300',
    dot:      'bg-red-400',
    border:   'border-red-300 hover:border-red-500'
  }
};

interface TutorialSidebarProps {
  open: boolean;
  steps: TutorialStep[];
  currentIndex: number;
  onClose: () => void;
  onFinish: () => void;
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
  onFinish,
  onNext,
  onPrev,
  onLoadStepData,
  cases,
  stepCaseLoaded,
  onReturnToDashboard
}) => {
  const activeStep = steps[currentIndex];
  const isLast = currentIndex >= steps.length - 1;
  const isWelcome = currentIndex === 0;
  const progress = steps.length > 0 ? ((currentIndex + 1) / steps.length) * 100 : 0;
  const canLoad = activeStep ? LOADABLE_STEP_IDS.has(activeStep.id) : false;
  const loadedCaseId = activeStep ? stepCaseLoaded[activeStep.id] : undefined;

  // 'right' or 'left' — updated dynamically based on where the focal element is
  const [panelSide, setPanelSide] = useState<'right' | 'left'>('right');
  const [panelTop, setPanelTop] = useState<number>(80);

  // Manual position/size (null = use auto-positioning)
  const [panelPos, setPanelPos] = useState<{ x: number; y: number } | null>(null);
  const [panelWidth, setPanelWidth] = useState(384);
  const [panelHeight, setPanelHeight] = useState<number | null>(null);
  const [viewportWidth, setViewportWidth] = useState(window.innerWidth);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const drag = useRef<{ active: boolean; startMX: number; startMY: number; startX: number; startY: number }>({ active: false, startMX: 0, startMY: 0, startX: 0, startY: 0 });
  const resize = useRef<{ active: boolean; startMX: number; startMY: number; startW: number; startH: number }>({ active: false, startMX: 0, startMY: 0, startW: 384, startH: 0 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (drag.current.active) {
        const newX = drag.current.startX + (e.clientX - drag.current.startMX);
        const newY = drag.current.startY + (e.clientY - drag.current.startMY);
        const w = panelRef.current ? panelRef.current.offsetWidth : 384;
        const h = panelRef.current ? panelRef.current.offsetHeight : 200;
        setPanelPos({
          x: Math.max(0, Math.min(newX, window.innerWidth - w)),
          y: Math.max(0, Math.min(newY, window.innerHeight - h)),
        });
      }
      if (resize.current.active) {
        const newW = Math.max(280, resize.current.startW + (e.clientX - resize.current.startMX));
        const newH = Math.max(200, resize.current.startH + (e.clientY - resize.current.startMY));
        setPanelWidth(newW);
        setPanelHeight(newH);
      }
    };
    const onUp = () => {
      drag.current.active = false;
      resize.current.active = false;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, []);

  // Keyboard shortcuts
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

  // Scroll to and highlight the focal element; reposition panel to avoid overlap
  useEffect(() => {
    if (!open || !activeStep || isWelcome) return;
    const tourId = STEP_HIGHLIGHTS[activeStep.id];
    if (!tourId) { setPanelSide('right'); setPanelTop(80); return; }
    const el = document.querySelector(`[data-tour-id="${tourId}"]`) as HTMLElement | null;

    // For tut-consent the wizard step is changing; el may not be in DOM yet.
    // Position panel immediately (left/80) then retry element lookup after React re-renders.
    if (!el) {
      if (activeStep.id === 'tut-consent') {
        // Wizard step re-rendering; retry once React paints the new step
        const retryTimer = setTimeout(() => {
          const el2 = document.querySelector('[data-tour-id="tour-consent"]') as HTMLElement | null;
          if (!el2) return;
          el2.setAttribute('data-highlight-active', '');
          const r = el2.getBoundingClientRect();
          const pw = panelRef.current ? panelRef.current.offsetWidth : 384;
          setPanelPos({ x: Math.max(20, r.left - pw - 16), y: Math.max(80, r.top) });
        }, 200);
        return () => clearTimeout(retryTimer);
      }
      setPanelSide('right'); setPanelTop(80); return;
    }

    el.setAttribute('data-highlight-active', '');
    if (activeStep.id === 'tut-baseline') {
      // scroll handled by App.tsx via flushSync after data loads
    } else {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // After scroll settles, check if a narrow element overlaps the right panel area.
    // Full-width elements always keep the panel on the right (moving left still overlaps).
    const timer = setTimeout(() => {
      const rect = el.getBoundingClientRect();
      const PANEL_W = 384 + 16;
      const panelLeft = window.innerWidth - PANEL_W;
      const isFullWidth = rect.width > window.innerWidth * 0.6;
      if (activeStep.id === 'tut-consent') {
        const pw = panelRef.current ? panelRef.current.offsetWidth : 384;
        setPanelPos({ x: Math.max(20, rect.left - pw - 16), y: Math.max(80, rect.top) });
      } else if (activeStep.id === 'tut-export') {
        const pw = panelRef.current ? panelRef.current.offsetWidth : 384;
        // Center panel under the button; clamp to viewport edges
        const centered = rect.left + rect.width / 2 - pw / 2;
        setPanelPos({ x: Math.max(20, Math.min(centered, window.innerWidth - pw - 20)), y: rect.bottom + 12 });
      } else if (activeStep.id === 'tut-founder-input') {
        const ph = panelRef.current ? panelRef.current.offsetHeight : 420;
        setPanelPos({ x: window.innerWidth - 384 - 16, y: window.innerHeight - ph - 16 });
      } else {
        setPanelPos(null);
        setPanelTop(80);
        setPanelSide(!isFullWidth && rect.right > panelLeft ? 'left' : 'right');
      }
    }, 350);

    return () => {
      el.removeAttribute('data-highlight-active');
      clearTimeout(timer);
    };
  }, [open, activeStep, isWelcome]);

  if (!open || !activeStep) return null;

  // ── WELCOME OVERLAY (step 0) ─────────────────────────────────────────────
  if (isWelcome) {
    return (
      <div className="fixed inset-0 z-[55] flex items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
          onClick={onClose}
        />
        {/* Card */}
        <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-3xl overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-purple-500 to-purple-300" />

          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                Tutorial
              </span>
            </div>

            <h2 className="text-lg font-bold text-gray-900 mb-2 leading-snug">
              {activeStep.title}
            </h2>
            <div className="text-sm text-gray-500 leading-relaxed mb-5">
              {renderBody(activeStep.body, 'text-sm text-gray-500 leading-relaxed')}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onReturnToDashboard}
                className="flex-1 bg-purple-600 text-white text-sm font-bold py-2.5 rounded-xl hover:bg-purple-700 transition-colors"
              >
                Begin walkthrough →
              </button>
              <button
                onClick={onFinish}
                className="text-sm text-gray-400 hover:text-gray-600 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── RIGHT/LEFT PANEL (steps 1+) ──────────────────────────────────────────
  // Always use left+top so CSS can transition smoothly between any two positions.
  const numericLeft = panelPos
    ? panelPos.x
    : panelSide === 'right'
      ? viewportWidth - panelWidth - 16
      : 16;
  const computedTop = panelPos ? panelPos.y : panelTop;

  // Hide the panel entirely when it would overflow the viewport (e.g. narrow window).
  if (numericLeft + panelWidth > viewportWidth + 8 || numericLeft < -8) return null;

  const panelStyle: React.CSSProperties = {
    position: 'fixed',
    left: numericLeft,
    top: computedTop,
    width: panelWidth,
    zIndex: 55,
    transition: 'left 350ms cubic-bezier(0.4,0,0.2,1), top 350ms cubic-bezier(0.4,0,0.2,1), width 300ms cubic-bezier(0.4,0,0.2,1)',
    ...(panelHeight ? { height: panelHeight } : {}),
  };

  return (
    <div ref={panelRef} style={panelStyle}>
      <div className="relative bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden flex flex-col" style={panelHeight ? { height: '100%' } : {}}>
        {/* Progress bar */}
        <div className="h-1 w-full bg-gray-100 overflow-hidden shrink-0">
          <div
            className="h-full bg-purple-500 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Header — drag handle */}
        <div
          className="flex items-center gap-2 px-4 pt-3 pb-0 cursor-grab active:cursor-grabbing select-none"
          onMouseDown={(e) => {
            if ((e.target as HTMLElement).closest('button')) return;
            const rect = panelRef.current!.getBoundingClientRect();
            drag.current = { active: true, startMX: e.clientX, startMY: e.clientY, startX: rect.left, startY: rect.top };
            document.body.style.userSelect = 'none';
            document.body.style.cursor = 'grabbing';
          }}
        >
          <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide shrink-0">
            Tutorial
          </span>
          <span className="text-[11px] text-gray-400 tabular-nums ml-auto shrink-0">
            {currentIndex} / {steps.length - 1}
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
        <div className={`px-4 pt-2 pb-4 space-y-2.5 ${panelHeight ? 'overflow-y-auto flex-1' : ''}`}>
          <h3 className="text-sm font-bold text-gray-900 leading-snug">
            {activeStep.title}
          </h3>

          <div className="text-xs text-gray-600 leading-relaxed">
            {renderBody(activeStep.body, 'text-xs text-gray-600 leading-relaxed')}
          </div>

          {activeStep.lookFor && (
            <p className="text-[11px] text-blue-800 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 leading-relaxed">
              <span className="font-bold">Tip: </span>{activeStep.lookFor}
            </p>
          )}

          {/* Case load buttons */}
          {canLoad && (
            <div className="space-y-1.5 pt-1 rounded-xl bg-purple-50 border border-purple-200 px-3 py-3 -mx-1">
              <div className="flex items-center gap-1.5 pb-1">
                <span className="text-[10px] font-bold text-purple-700 uppercase tracking-widest">Choose demo</span>
                <span className="text-purple-400 text-xs font-bold ml-auto animate-bounce">↓</span>
              </div>
              {cases.map((tutCase) => {
                const style = CASE_STYLE[tutCase.id] ?? CASE_STYLE['case-a'];
                const isLoaded = loadedCaseId === tutCase.id;
                return (
                  <button
                    key={tutCase.id}
                    onClick={() => !isLoaded && onLoadStepData(activeStep.id, tutCase)}
                    disabled={isLoaded}
                    title={`Load ${tutCase.companyName} example data`}
                    className={`w-full flex items-center gap-2 text-[11px] font-semibold border rounded-lg px-3 py-2 transition-colors ${isLoaded ? style.loaded + ' cursor-default' : style.unloaded + ' animate-pulse'}`}
                  >
                    {isLoaded ? (
                      <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />
                    )}
                    <span className="shrink-0">{tutCase.companyName}</span>
                    <span className="font-normal opacity-50 text-right leading-tight ml-auto truncate">
                      {style.label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center gap-1.5 pt-0.5">
            <button
              onClick={onReturnToDashboard}
              title="View example overview"
              className="text-[11px] font-medium text-gray-400 hover:text-purple-600 transition-colors px-1 py-1.5"
            >
              Examples
            </button>
            <div className="flex-1" />
            <button
              onClick={onPrev}
              disabled={currentIndex <= 1}
              className="text-xs font-semibold text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              ←
            </button>
            <button
              onClick={isLast ? onFinish : onNext}
              className="text-xs font-semibold bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 transition-colors"
            >
              {isLast ? 'Finish' : 'Next →'}
            </button>
          </div>
        </div>

        {/* Resize handle — bottom-right corner */}
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize opacity-30 hover:opacity-70 transition-opacity"
          style={{ touchAction: 'none' }}
          onMouseDown={(e) => {
            e.preventDefault();
            const rect = panelRef.current!.getBoundingClientRect();
            resize.current = { active: true, startMX: e.clientX, startMY: e.clientY, startW: rect.width, startH: rect.height };
            document.body.style.userSelect = 'none';
            document.body.style.cursor = 'se-resize';
          }}
        >
          <svg viewBox="0 0 16 16" className="w-4 h-4 text-gray-400" fill="currentColor">
            <path d="M11 11h3v1h-3zM8 14h6v1H8zM11 8h3v1h-3z"/>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default TutorialSidebar;
