
import React from 'react';
import { TranscriptSplit } from '../types';
import { useT } from '../utils/strings';

interface SplitVerifierProps {
  split: TranscriptSplit;
  onConfirm: (part1: string, part2: string) => void;
  onCancel: () => void;
  isProcessing: boolean;
}

const SplitVerifier: React.FC<SplitVerifierProps> = ({ split, onConfirm, onCancel, isProcessing }) => {
  const [p1, setP1] = React.useState(split.part1);
  const [p2, setP2] = React.useState(split.part2);
  const t = useT().splitVerifier;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 animate-fade-in-up" data-tour-id="tour-split-view">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">{t.title}</h2>
        <p className="text-gray-500 text-sm mt-1">{t.description}</p>
        <div className="mt-2 bg-blue-50 text-blue-700 p-3 rounded text-sm border border-blue-100" data-tour-id="tour-split-reason">
          <strong>{t.reasoning}</strong> {split.reasoning}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">{t.part1}</label>
          <textarea
            value={p1}
            onChange={(e) => setP1(e.target.value)}
            className="w-full h-96 p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-xs font-mono resize-none"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">{t.part2}</label>
          <textarea
            value={p2}
            onChange={(e) => setP2(e.target.value)}
            className="w-full h-96 p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-xs font-mono resize-none"
          />
        </div>
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-gray-100">
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            disabled={isProcessing}
            className="text-sm font-semibold text-gray-600 hover:text-gray-800 px-3 py-2 rounded disabled:opacity-50"
          >
            {t.back}
          </button>
          <button
            onClick={onCancel}
            disabled={isProcessing}
            className="text-sm font-semibold text-gray-600 hover:text-gray-800 px-3 py-2 rounded disabled:opacity-50"
          >
            {t.cancel}
          </button>
        </div>
        <button
          onClick={() => onConfirm(p1, p2)}
          disabled={isProcessing}
          className="px-6 py-2 bg-blue-600 text-white rounded text-sm font-bold hover:bg-blue-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          data-tour-id="tour-split-confirm"
        >
          {isProcessing && (
            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          {isProcessing ? t.analyzing : t.confirm}
        </button>
      </div>
    </div>
  );
};

export default SplitVerifier;
