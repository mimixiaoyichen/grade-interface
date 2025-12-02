
import React from 'react';
import { ComparisonRow } from '../types';

interface ComparisonTableProps {
  rows: ComparisonRow[];
  onUpdate: (updatedRows: ComparisonRow[]) => void;
  renderPublicHighlight?: (text: string) => React.ReactNode;
}

const ComparisonTable: React.FC<ComparisonTableProps> = ({ rows, onUpdate, renderPublicHighlight }) => {

  const handleAcceptToggle = (index: number) => {
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], isAccepted: !newRows[index].isAccepted };
    onUpdate(newRows);
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'Modification': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Omission': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Hallucination': return 'bg-red-100 text-red-800 border-red-200';
      case 'Confirmation': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderGroup = (component: string) => {
    const groupRows = rows.filter(r => r.component === component);
    if (groupRows.length === 0) return null;

    return (
      <div className="mb-8" key={component}>
        <h3 className="text-lg font-bold text-gray-800 mb-3 px-1 border-l-4 border-gray-800 pl-3 uppercase tracking-wide">
          {component}
        </h3>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 font-medium w-1/4">LLM-Generated</th>
                  <th className="px-6 py-3 font-medium w-1/4">Transcript Modification</th>
                  <th className="px-6 py-3 font-medium w-1/4">Evidence (Transcript)</th>
                  <th className="px-6 py-3 font-medium w-1/4">Public Source Check</th>
                  <th className="px-4 py-3 font-medium w-16 text-center">Keep?</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {groupRows.map((row) => {
                  const globalIndex = rows.indexOf(row);
                  return (
                    <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 align-top text-gray-500">
                         {row.baselineText || <span className="italic text-gray-300">--</span>}
                      </td>
                      <td className="px-6 py-4 align-top">
                        <div className="mb-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getBadgeColor(row.type)} uppercase`}>
                            {row.type}
                          </span>
                        </div>
                        <div className="font-medium text-gray-900 leading-relaxed">
                          {row.transcriptModification}
                        </div>
                      </td>
                      <td className="px-6 py-4 align-top text-gray-600 italic border-l border-dashed border-gray-200">
                        "{row.transcriptEvidence}"
                      </td>
                      <td className="px-6 py-4 align-top">
                         <div className={`text-xs p-2 rounded border ${
                           row.publicSupport.toLowerCase().includes('not found') 
                             ? 'bg-orange-50 border-orange-100 text-orange-800' 
                             : 'bg-green-50 border-green-100 text-green-800'
                         }`}>
                           {renderPublicHighlight ? renderPublicHighlight(row.publicSupport) : row.publicSupport}
                         </div>
                      </td>
                      <td className="px-4 py-4 align-top text-center">
                        <input 
                          type="checkbox"
                          checked={row.isAccepted}
                          onChange={() => handleAcceptToggle(globalIndex)}
                          className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="animate-fade-in-up">
      {renderGroup("Customer")}
      {renderGroup("Context")}
      {renderGroup("Goal")}
      {renderGroup("Barrier")}
    </div>
  );
};

export default ComparisonTable;
