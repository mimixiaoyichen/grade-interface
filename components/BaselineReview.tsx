
import React, { useState } from 'react';
import { BaselineStatement } from '../types';

interface BaselineReviewProps {
  baseline: BaselineStatement;
  onUpdate: (updated: BaselineStatement, notes: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const BaselineReview: React.FC<BaselineReviewProps> = ({ baseline, onUpdate, onNext, onBack }) => {
  const [data, setData] = useState<BaselineStatement>(baseline);
  const [notes, setNotes] = useState<string>('');

  const handleChange = (field: keyof BaselineStatement, value: string | string[]) => {
    const newData = { ...data, [field]: value };
    setData(newData);
    onUpdate(newData, notes);
  };

  const handleBarrierChange = (idx: number, val: string) => {
    const newBarriers = [...data.SPECIFIC_BARRIERS];
    newBarriers[idx] = val;
    handleChange('SPECIFIC_BARRIERS', newBarriers);
  };

  const addBarrier = () => {
    handleChange('SPECIFIC_BARRIERS', [...data.SPECIFIC_BARRIERS, ""]);
  };

  const removeBarrier = (idx: number) => {
    const newBarriers = data.SPECIFIC_BARRIERS.filter((_, i) => i !== idx);
    handleChange('SPECIFIC_BARRIERS', newBarriers);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 animate-fade-in-up">
      <div className="mb-6 border-b border-gray-200 pb-4 flex justify-between items-start">
        <div>
           <h2 className="text-2xl font-bold text-gray-800">3. Review Baseline Statement</h2>
           <p className="text-gray-500 mt-1">This statement was generated from Public Information. Review and edit it before comparing it to the transcript.</p>
        </div>
        <div className="bg-blue-50 text-blue-800 px-3 py-1 rounded text-xs font-bold uppercase tracking-wide">
          Draft Mode
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Editor Column */}
        <div className="lg:col-span-2 space-y-6">
          
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Solution</label>
            <textarea 
              value={data.SOLUTION}
              onChange={(e) => handleChange('SOLUTION', e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
              rows={5}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Customer Segment</label>
            <textarea 
              value={data.CUSTOMER_SEGMENT}
              onChange={(e) => handleChange('CUSTOMER_SEGMENT', e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
              rows={5}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Context</label>
            <textarea 
              value={data.LIFE_BUSINESS_CONTEXT}
              onChange={(e) => handleChange('LIFE_BUSINESS_CONTEXT', e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
              rows={5}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Goal (Job to be done)</label>
            <textarea 
              value={data.JOB_TO_BE_DONE}
              onChange={(e) => handleChange('JOB_TO_BE_DONE', e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
              rows={5}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Specific Barriers</label>
              <button onClick={addBarrier} className="text-xs text-blue-600 hover:underline">+ Add Barrier</button>
            </div>
            <div className="space-y-2">
              {data.SPECIFIC_BARRIERS.map((barrier, idx) => (
                <div key={idx} className="flex gap-2">
                  <span className="text-gray-400 text-sm py-2 w-4">{idx + 1}.</span>
                  <textarea
                    value={barrier}
                    onChange={(e) => handleBarrierChange(idx, e.target.value)}
                    className="flex-1 p-2 bg-gray-50 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
                    rows={1}
                  />
                  <button onClick={() => removeBarrier(idx)} className="text-gray-400 hover:text-red-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Notes Column */}
        <div className="lg:col-span-1 bg-yellow-50 border border-yellow-200 rounded-lg p-4 h-full flex flex-col">
           <h3 className="text-sm font-bold text-yellow-800 mb-2 flex items-center gap-2">
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
             Review Notes
           </h3>
           <textarea
             value={notes}
             onChange={(e) => {
               setNotes(e.target.value);
               onUpdate(data, e.target.value);
             }}
             placeholder="Track your changes or thoughts here..."
             className="w-full flex-1 bg-transparent border-none resize-none focus:ring-0 text-sm text-gray-700 placeholder-yellow-800/40"
           />
           <div className="text-[10px] text-yellow-800/60 mt-2 italic">
             These notes will be used to refine the transcript analysis in the next step.
           </div>
        </div>

      </div>

      <div className="mt-8 pt-6 border-t border-gray-100 flex justify-between">
        <button onClick={onBack} className="text-gray-500 hover:text-gray-800 px-4 py-2 text-sm font-medium">Back</button>
        <button 
          onClick={onNext}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold shadow-md hover:bg-blue-700 transition-all"
        >
          Confirm & Upload Transcript →
        </button>
      </div>
    </div>
  );
};

export default BaselineReview;
