import React from 'react';

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full">
        <h3 className="text-lg font-bold text-gray-800 mb-2">Map speakers to names</h3>
        <p className="text-sm text-gray-600 mb-4">If diarization labels exist, map them to real names/titles.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {labels.map((label) => (
            <div key={label} className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
              <input
                value={mapping[label] ?? ''}
                onChange={(e) => onMappingChange(label, e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500"
                placeholder="e.g., Founder, Interviewer"
              />
            </div>
          ))}
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded p-3 text-xs text-gray-700 whitespace-pre-wrap mb-4">
          <div className="text-[10px] uppercase text-gray-500 font-semibold mb-1">Sample transcript</div>
          {sampleText || 'No transcript preview available.'}
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800"
          >
            Skip
          </button>
          <button
            onClick={onApply}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded hover:bg-blue-700"
          >
            Apply labels
          </button>
        </div>
      </div>
    </div>
  );
};

export default SpeakerModal;
