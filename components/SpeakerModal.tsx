import React from 'react';
import { useT } from '../utils/strings';

interface SpeakerModalProps {
  open: boolean;
  labels: string[];
  mapping: Record<string, string>;
  sampleText: string;
  onClose: () => void;
  onApply: () => void;
  onMappingChange: (label: string, value: string) => void;
}

const SpeakerModal: React.FC<SpeakerModalProps> = ({ open, labels, mapping, sampleText, onClose, onApply, onMappingChange }) => {
  if (!open || !labels.length) return null;
  const t = useT().speakerModal;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full">
        <h3 className="text-lg font-bold text-gray-800 mb-2">{t.title}</h3>
        <p className="text-sm text-gray-600 mb-4">{t.description}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {labels.map((label) => (
            <div key={label} className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
              <input
                value={mapping[label] ?? ''}
                onChange={(e) => onMappingChange(label, e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500"
                placeholder={t.placeholder}
              />
            </div>
          ))}
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded p-3 text-xs text-gray-700 whitespace-pre-wrap mb-4">
          <div className="text-[10px] uppercase text-gray-500 font-semibold mb-1">{t.sampleTitle}</div>
          {sampleText || t.sampleEmpty}
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800"
          >
            {t.skip}
          </button>
          <button
            onClick={onApply}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded hover:bg-blue-700"
          >
            {t.apply}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SpeakerModal;
