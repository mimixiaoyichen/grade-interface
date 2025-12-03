
import React, { useEffect, useRef } from 'react';
import { ComparisonRow } from '../types';

interface ComparisonTableProps {
  rows: ComparisonRow[];
  onUpdate: (updatedRows: ComparisonRow[]) => void;
  renderPublicHighlight?: (text: string) => React.ReactNode;
  revealAISuggestions?: boolean;
  onEditChange?: (id: string, val: string) => void;
  onNoteChange?: (id: string, val: string) => void;
  componentEvidence?: { customer?: { context: string; core: string }; context?: { context: string; core: string }; goal?: { context: string; core: string }; barrier?: { context: string; core: string } };
}

const ComparisonTable: React.FC<ComparisonTableProps> = ({ rows, onUpdate, renderPublicHighlight, revealAISuggestions = true, onEditChange, onNoteChange, componentEvidence }) => {
  const evidenceRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const highlightRefs = useRef<Record<string, HTMLMarkElement | null>>({});

  useEffect(() => {
    rows.forEach((row) => {
      const container = evidenceRefs.current[row.id];
      const highlight = highlightRefs.current[row.id];
      if (container && highlight) {
        const offset = highlight.offsetTop - container.clientHeight / 2;
        container.scrollTo({
          top: Math.max(0, offset),
          behavior: 'smooth'
        });
      }
    });
  }, [rows, componentEvidence]);

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
        <div className="space-y-4">
          {groupRows.map((row) => {
            const globalIndex = rows.indexOf(row);
            const aiVisible = row.reviewerDecision !== undefined;
            const ev = componentEvidence
              ? componentEvidence[row.component.toLowerCase() as 'customer' | 'context' | 'goal' | 'barrier']
              : undefined;
            const evidenceText = ev ? ev.context : row.transcriptEvidence;
            const evidenceCore = ev ? ev.core : row.transcriptEvidence;
            const publicContext = row.publicEvidenceContext || row.publicEvidence || row.publicSupport;

            const renderEvidenceContent = (context: string, core?: string) => {
              if (!context) {
                return <span className="italic text-gray-400">No transcript evidence</span>;
              }

              if (core && core.trim() && context.includes(core)) {
                const parts = context.split(core);
                let markSet = false;
                return (
                  <>
                    {parts.map((part, idx) => (
                      <React.Fragment key={`${row.id}-part-${idx}`}>
                        {part}
                        {idx < parts.length - 1 && (
                          <mark
                            className="bg-yellow-200 text-gray-900"
                            ref={(el) => {
                              if (!markSet) {
                                highlightRefs.current[row.id] = el;
                                markSet = true;
                              }
                            }}
                          >
                            {core}
                          </mark>
                        )}
                      </React.Fragment>
                    ))}
                  </>
                );
              }

              if (core && core !== context) {
                return (
                  <>
                    {context}
                    {'\n'}
                    <mark
                      className="bg-yellow-200 text-gray-900"
                      ref={(el) => { highlightRefs.current[row.id] = el; }}
                    >
                      {core}
                    </mark>
                  </>
                );
              }

              return context;
            };

            return (
              <div key={row.id} className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-3 text-gray-600 text-sm space-y-1">
                    <div className="text-[10px] uppercase text-gray-400 font-semibold">LLM-Generated</div>
                    <div>{row.baselineText || <span className="italic text-gray-300">--</span>}</div>
                  </div>
                  <div className="md:col-span-9 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getBadgeColor(row.type)} uppercase`}>
                        {row.type}
                      </span>
                      <span className="text-[11px] text-gray-500 break-normal" title={`Original: ${row.transcriptModification}`}>
                        Original: {row.transcriptModification}
                      </span>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-2 bg-white shadow-inner">
                      <textarea
                        value={row.reviewerEdit ?? row.transcriptModification}
                        onChange={(e) => {
                          if (onEditChange) onEditChange(row.id, e.target.value);
                          const newRows = [...rows];
                          newRows[globalIndex] = { ...newRows[globalIndex], reviewerEdit: e.target.value };
                          onUpdate(newRows);
                        }}
                        className="w-full text-sm text-gray-900 leading-relaxed border-none focus:outline-none resize-y"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-1">
                    <div className="text-[10px] uppercase text-gray-400 font-semibold mb-1">Evidence (Transcript)</div>
                    <div
                      className="text-gray-700 text-sm leading-relaxed bg-gray-50 border border-dashed border-gray-200 rounded p-3 max-h-48 overflow-y-auto whitespace-pre-wrap"
                      ref={(el) => { evidenceRefs.current[row.id] = el; }}
                    >
                      {renderEvidenceContent(evidenceText, evidenceCore)}
                    </div>
                  </div>
                  <div className="md:col-span-1">
                    <div className="text-[10px] uppercase text-gray-400 font-semibold mb-1">Public Source Check</div>
                    {(() => {
                      const pub = publicContext || '';
                      const isNotFound = typeof row.isSupportedByPublic === 'boolean'
                        ? !row.isSupportedByPublic
                        : pub.toLowerCase().includes('not found');
                      return (
                       <div className={`text-xs p-2 rounded border space-y-1 ${
                         isNotFound
                         ? 'bg-orange-50 border-orange-100 text-orange-800' 
                         : 'bg-green-50 border-green-100 text-green-800'
                       }`}>
                         <div className="text-[10px] font-semibold uppercase tracking-wide">
                           {isNotFound ? 'Not Found / Private' : 'Supported'}
                         </div>
                         <div className="text-gray-800">
                           {aiVisible ? (renderPublicHighlight ? renderPublicHighlight(pub) : pub) : 'Hidden until review'}
                         </div>
                       </div>
                      );
                    })()}
                  </div>
                  <div className="md:col-span-1 flex flex-col gap-2">
                    <div className="text-[10px] uppercase text-gray-400 font-semibold mb-1">Decision</div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const newRows = [...rows];
                          newRows[globalIndex] = { ...newRows[globalIndex], reviewerDecision: 'keep', isAccepted: true };
                          onUpdate(newRows);
                        }}
                        className={`px-3 py-1 rounded text-xs font-semibold border ${row.reviewerDecision === 'keep' ? 'bg-green-100 border-green-300 text-green-800' : 'border-gray-200 text-gray-600'}`}
                      >
                        Keep
                      </button>
                      <button
                        onClick={() => {
                          const newRows = [...rows];
                          newRows[globalIndex] = { ...newRows[globalIndex], reviewerDecision: 'discard', isAccepted: false };
                          onUpdate(newRows);
                        }}
                        className={`px-3 py-1 rounded text-xs font-semibold border ${row.reviewerDecision === 'discard' ? 'bg-red-100 border-red-300 text-red-800' : 'border-gray-200 text-gray-600'}`}
                      >
                        Discard
                      </button>
                    </div>
                    <textarea
                      value={row.reviewerNotes || ''}
                      onChange={(e) => {
                        if (onNoteChange) onNoteChange(row.id, e.target.value);
                        const newRows = [...rows];
                        newRows[globalIndex] = { ...newRows[globalIndex], reviewerNotes: e.target.value };
                        onUpdate(newRows);
                      }}
                      placeholder="Your notes…"
                      className="w-full text-xs border border-gray-200 rounded p-1 focus:outline-none focus:ring-1 focus:ring-blue-500 min-h-[60px]"
                    />
                  </div>
                </div>
              </div>
            );
          })}
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
