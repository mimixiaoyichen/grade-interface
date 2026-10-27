
import React, { useEffect, useRef } from 'react';
import { ComparisonRow, SupportCheckItem, SupportRowState } from '../types';
import { useT } from '../utils/strings';
import { stripBarrierLeadIn } from '../utils/barriers';

interface ComparisonTableProps {
  rows: ComparisonRow[];
  onUpdate: (updatedRows: ComparisonRow[]) => void;
  renderPublicHighlight?: (text: string) => React.ReactNode;
  revealAISuggestions?: boolean;
  onEditChange?: (id: string, val: string) => void;
  onNoteChange?: (id: string, val: string) => void;
  componentEvidence?: { customer?: { context: string; core: string }; context?: { context: string; core: string }; goal?: { context: string; core: string }; barrier?: { context: string; core: string } };
  supportByRow: Record<string, SupportRowState>;
  onAddSupportItem: (rowId: string, group: 'omission' | 'hallucination') => void;
  onChangeSupportItem: (rowId: string, group: 'omission' | 'hallucination', id: string, val: string) => void;
  onConfirmSupportCheck: (rowId: string) => void;
}

const ComparisonTable: React.FC<ComparisonTableProps> = ({ rows, onUpdate, renderPublicHighlight, revealAISuggestions = true, onEditChange, onNoteChange, componentEvidence, supportByRow, onAddSupportItem, onChangeSupportItem, onConfirmSupportCheck }) => {
  const text = useT().comparison;
  const componentLabels: Record<ComparisonRow['component'], string> = {
    Solution: text.groups.solution,
    Customer: text.groups.customer,
    Context: text.groups.context,
    Goal: text.groups.goal,
    Barrier: text.groups.barrier
  };
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

  const renderSupportGroup = (
    title: string,
    placeholderLabel: string,
    items: SupportCheckItem[],
    group: 'omission' | 'hallucination',
    rowId: string
  ) => {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">{title}</h4>
          <button
            onClick={() => onAddSupportItem(rowId, group)}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800"
          >
            {text.labels.add}
          </button>
        </div>
        <div className="space-y-4">
          {items.map((item, idx) => {
            const hasResult = typeof item.isSupportedByPublic === 'boolean';
            const isSupported = item.isSupportedByPublic;
            const context = item.publicEvidenceContext || item.publicEvidence || item.publicSupport;
            const badgeClass = hasResult
              ? isSupported
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-orange-50 border-orange-200 text-orange-800'
              : 'bg-gray-50 border-gray-200 text-gray-600';
            const badgeLabel = hasResult
              ? isSupported
                ? text.labels.supported
                : text.labels.notFound
              : text.labels.awaiting;
            return (
              <div key={item.id} className="space-y-2">
                <textarea
                  value={item.text}
                  onChange={(e) => onChangeSupportItem(rowId, group, item.id, e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded p-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder={`${placeholderLabel} ${idx + 1}`}
                  rows={3}
                />
                <div className={`text-xs rounded border p-2 min-h-[60px] ${badgeClass}`}>
                  <div className="text-[10px] font-semibold uppercase tracking-wide mb-1">{badgeLabel}</div>
                  {hasResult ? (
                    <div className="text-gray-800">
                      {renderPublicHighlight ? renderPublicHighlight(context || '') : (context || text.labels.notAvailable)}
                    </div>
                  ) : (
                    <div className="text-gray-500">{text.labels.runConfirm}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderGroup = (component: string) => {
    const groupRows = rows.filter(r => r.component === component);
    if (groupRows.length === 0) return null;

    return (
      <div className="mb-8" key={component}>
        <h3 className="text-lg font-bold text-gray-800 mb-3 px-1 border-l-4 border-gray-800 pl-3 uppercase tracking-wide">
          {componentLabels[component as ComparisonRow['component']] || component}
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
            const displayBaselineText = row.component === 'Barrier'
              ? stripBarrierLeadIn(row.baselineText)
              : row.baselineText;
            const displayReviewerEdit = row.component === 'Barrier'
              ? stripBarrierLeadIn(row.reviewerEdit ?? row.transcriptModification)
              : (row.reviewerEdit ?? row.transcriptModification);

            const renderEvidenceContent = (context: string, core?: string) => {
              if (!context) {
                return <span className="italic text-gray-400">{text.labels.noEvidence}</span>;
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
                  <div className="text-gray-600 text-sm space-y-3">
                    <div className="text-[10px] uppercase text-gray-400 font-semibold">{text.labels.llmGenerated}</div>
                    <div>{displayBaselineText || <span className="italic text-gray-300">--</span>}</div>
                    <div className="space-y-2">
                      <div className="border border-gray-200 rounded-lg p-2 bg-white shadow-inner">
                        <textarea
                          value={displayReviewerEdit}
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
                  <div className="md:col-span-1 md:h-full">
                    <div className="text-[10px] uppercase text-gray-400 font-semibold mb-1">{text.labels.evidence}</div>
                    <div
                      className="text-gray-700 text-sm leading-relaxed bg-gray-50 border border-dashed border-gray-200 rounded p-3 max-h-[28rem] md:h-full overflow-y-auto whitespace-pre-wrap"
                      ref={(el) => { evidenceRefs.current[row.id] = el; }}
                    >
                      {renderEvidenceContent(evidenceText, evidenceCore)}
                    </div>
                  </div>
                </div>

                <div className="mt-4 border-t border-gray-100 pt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-gray-800">{text.labels.omissionsHallucinations}</div>
                      <p className="text-xs text-gray-500">{text.labels.captureSupport}</p>
                    </div>
                    {(() => {
                      const support = supportByRow[row.id];
                      const loading = support?.loading;
                      return (
                        <button
                          onClick={() => onConfirmSupportCheck(row.id)}
                          disabled={loading}
                          className="bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-blue-700 disabled:opacity-60"
                        >
                          {loading ? text.labels.checking : text.labels.confirmSupport}
                        </button>
                      );
                    })()}
                  </div>

                  {(() => {
                    const support = supportByRow[row.id] || { omissions: [], hallucinations: [] };
                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {renderSupportGroup(text.labels.omissions, text.labels.placeholderOmission, support.omissions, 'omission', row.id)}
                        {renderSupportGroup(text.labels.hallucinations, text.labels.placeholderHallucination, support.hallucinations, 'hallucination', row.id)}
                      </div>
                    );
                  })()}
                  {supportByRow[row.id]?.statusMessage ? (
                    <div className="text-xs text-gray-500">{supportByRow[row.id]?.statusMessage}</div>
                  ) : null}
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
      {renderGroup("Solution")}
      {renderGroup("Customer")}
      {renderGroup("Context")}
      {renderGroup("Goal")}
    </div>
  );
};

export default ComparisonTable;
