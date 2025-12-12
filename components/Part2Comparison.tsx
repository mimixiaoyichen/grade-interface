import React from 'react';
import { ComparisonRow, ComponentEvidence, SupportRowState } from '../types';
import ComparisonTable from './ComparisonTable';

interface Part2ComparisonProps {
  comparisonRows: ComparisonRow[];
  onUpdateRows: (rows: ComparisonRow[]) => void;
  renderPublicHighlight: (text: string) => React.ReactNode;
  componentEvidence?: ComponentEvidence | null;
  supportByRow: Record<string, SupportRowState>;
  onAddSupportItem: (rowId: string, group: 'omission' | 'hallucination') => void;
  onChangeSupportItem: (rowId: string, group: 'omission' | 'hallucination', id: string, val: string) => void;
  onConfirmSupportCheck: (rowId: string) => void;
  onBack: () => void;
  onExportJson: () => void;
  onImportJson?: () => void;
}

const Part2Comparison: React.FC<Part2ComparisonProps> = ({
  comparisonRows,
  onUpdateRows,
  renderPublicHighlight,
  componentEvidence,
  supportByRow,
  onAddSupportItem,
  onChangeSupportItem,
  onConfirmSupportCheck,
  onBack,
  onExportJson,
  onImportJson
}) => {
  return (
    <div className="animate-fade-in-up pb-20">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-sm font-semibold text-gray-600 hover:text-gray-800 px-3 py-2 rounded">Back</button>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Part 2 Results: Feedback & Comparison</h2>
            <p className="text-gray-500">Comparing Baseline (Public Info) vs. Founder's Transcript Feedback.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onImportJson && (
            <button
              onClick={onImportJson}
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded shadow-sm hover:bg-gray-50 font-semibold"
            >
              Load JSON
            </button>
          )}
          <button onClick={onExportJson} className="bg-gray-800 text-white px-6 py-2 rounded shadow hover:bg-black font-bold">
            Download JSON
          </button>
        </div>
      </div>

      <ComparisonTable
        rows={comparisonRows}
        onUpdate={onUpdateRows}
        renderPublicHighlight={renderPublicHighlight}
        revealAISuggestions={false}
        componentEvidence={componentEvidence || undefined}
        supportByRow={supportByRow}
        onAddSupportItem={onAddSupportItem}
        onChangeSupportItem={onChangeSupportItem}
        onConfirmSupportCheck={onConfirmSupportCheck}
      />
    </div>
  );
};

export default Part2Comparison;
