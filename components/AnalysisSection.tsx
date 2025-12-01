import React, { useRef, useEffect } from 'react';
import { AnalysisItem } from '../types';

interface AnalysisSectionProps {
  title: string;
  items: AnalysisItem[];
  colorClass: string;
  onUpdate: (updatedItems: AnalysisItem[]) => void;
}

const AnalysisSection: React.FC<AnalysisSectionProps> = ({ title, items, colorClass, onUpdate }) => {

  const handleVerifyToggle = (id: string) => {
    const updated = items.map(item =>
      item.id === id ? { ...item, isVerified: !item.isVerified } : item
    );
    onUpdate(updated);
  };

  const handleNotesChange = (id: string, notes: string) => {
    const updated = items.map(item =>
      item.id === id ? { ...item, userNotes: notes } : item
    );
    onUpdate(updated);
  };

  const handleDescriptionChange = (id: string, newDescription: string) => {
    const updated = items.map(item =>
      item.id === id ? { ...item, description: newDescription } : item
    );
    onUpdate(updated);
  };

  if (items.length === 0) return (
    <div className={`mb-8 border rounded-lg bg-white shadow-sm ${colorClass} p-6 text-center text-gray-400 italic`}>
      No items identified for {title}.
    </div>
  );

  return (
    <div className={`mb-8 border rounded-lg overflow-hidden bg-white shadow-sm ${colorClass}`}>
      <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
        <h2 className="text-lg font-bold text-gray-800 uppercase tracking-wide">{title}</h2>
        <span className="text-xs text-gray-400 font-medium">Verified items appear in statement</span>
      </div>
      <div className="divide-y divide-gray-100">
        {items.map((item) => (
          <AnalysisRow 
            key={item.id} 
            item={item} 
            onVerify={() => handleVerifyToggle(item.id)}
            onNoteChange={(val) => handleNotesChange(item.id, val)}
            onDescriptionChange={(val) => handleDescriptionChange(item.id, val)}
          />
        ))}
      </div>
    </div>
  );
};

const AnalysisRow: React.FC<{
  item: AnalysisItem; 
  onVerify: () => void; 
  onNoteChange: (s: string) => void;
  onDescriptionChange: (s: string) => void;
}> = ({ item, onVerify, onNoteChange, onDescriptionChange }) => {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = 'auto';
      textAreaRef.current.style.height = textAreaRef.current.scrollHeight + 'px';
    }
  }, [item.description]);

  return (
    <div className={`p-6 transition-colors grid grid-cols-1 lg:grid-cols-12 gap-6 ${item.isVerified ? 'bg-green-50/40' : ''}`}>
      
      {/* 1. Selection & Description (5 cols) */}
      <div className="lg:col-span-5 flex gap-4">
        <div className="flex-shrink-0 pt-1">
          <label className="flex items-center justify-center w-6 h-6 rounded border border-gray-300 cursor-pointer hover:border-blue-500 transition-colors bg-white shadow-sm">
            <input
              type="checkbox"
              checked={item.isVerified}
              onChange={onVerify}
              className="appearance-none w-full h-full rounded checked:bg-green-600 transition-colors"
            />
            {item.isVerified && (
              <svg className="w-3 h-3 text-white absolute pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
            )}
          </label>
        </div>
        <div className="flex-1 space-y-3">
          <textarea
            ref={textAreaRef}
            value={item.description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            className="w-full text-gray-900 font-medium text-lg leading-snug bg-transparent border-none p-0 focus:ring-0 resize-none overflow-hidden placeholder-gray-400"
            rows={1}
            placeholder="Description..."
          />
          {item.quotes.length > 0 && (
            <div className="space-y-2">
               {item.quotes.map((quote, idx) => (
                 <div key={idx} className="relative pl-3 border-l-2 border-blue-200">
                   <p className="text-xs text-gray-500 italic">"{quote}"</p>
                 </div>
               ))}
            </div>
          )}
        </div>
      </div>

      {/* 2. Public Source Verification (4 cols) */}
      <div className="lg:col-span-4 bg-gray-50 rounded p-3 border border-gray-100 text-sm">
        <div className="flex items-center gap-2 mb-2">
           <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Public Source Check</span>
           {item.isSupportedByPublic ? (
             <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-[10px] font-bold border border-green-200">SUPPORTED</span>
           ) : (
             <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-[10px] font-bold border border-orange-200">NOT FOUND / PRIVATE</span>
           )}
        </div>
        <p className={`text-xs ${item.isSupportedByPublic ? 'text-gray-600' : 'text-orange-800/70 italic'}`}>
          {item.publicEvidence || "No evidence found in public documents."}
        </p>
      </div>

      {/* 3. Notes (3 cols) */}
      <div className="lg:col-span-3">
        <textarea
          value={item.userNotes}
          onChange={(e) => onNoteChange(e.target.value)}
          placeholder="Notes on omissions/hallucinations..."
          className="w-full h-full min-h-[80px] text-xs p-2 border border-gray-200 rounded bg-yellow-50/50 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none resize-y"
        />
      </div>

    </div>
  );
}

export default AnalysisSection;
