import React from 'react';

interface TutorialWelcomeProps {
  onStart: () => void;
  onSkip: () => void;
}

const TutorialWelcome: React.FC<TutorialWelcomeProps> = ({ onStart, onSkip }) => {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-fade-in-up">
        <div className="flex items-center gap-2 mb-5">
          <span className="bg-purple-100 text-purple-700 text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide">
            Tutorial
          </span>
          <span className="text-xs text-gray-400">Demo data — no API calls</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2 leading-tight">
          Welcome to Founder Problem Analyst
        </h1>
        <p className="text-sm text-gray-600 mb-6 leading-relaxed">
          A structured interview tool for capturing how founders define the problem their startup solves.
          The tutorial walks through the full workflow using a real historical case.
        </p>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
            Demo case
          </div>
          <div className="font-bold text-gray-900 text-lg mb-1">Uber — 2010</div>
          <div className="text-sm text-gray-600 leading-snug">
            On-demand black car app at launch. The LLM makes a cost-related inference the founder explicitly rejects — a clean example of a Hallucination row.
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 mb-8 px-1">
          {[
            { n: '1', label: 'Public info' },
            { n: '2', label: 'Interview' },
            { n: '3', label: 'Transcript' },
            { n: '4', label: 'Compare' }
          ].map((item, i, arr) => (
            <React.Fragment key={item.n}>
              <div className="flex flex-col items-center gap-1">
                <span className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-[11px]">
                  {item.n}
                </span>
                <span className="font-medium text-gray-500">{item.label}</span>
              </div>
              {i < arr.length - 1 && (
                <span className="text-gray-300 text-base pb-4">→</span>
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={onStart}
            className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-purple-700 transition-colors shadow-md"
          >
            Start Tutorial →
          </button>
          <button
            onClick={onSkip}
            className="w-full text-sm font-medium text-gray-400 hover:text-gray-600 py-2 transition-colors"
          >
            Skip — go straight to the tool
          </button>
        </div>
      </div>
    </div>
  );
};

export default TutorialWelcome;
