
import React, { useState } from 'react';
import { BaselineStatement } from '../types';
import { useT } from '../utils/strings';

interface BaselineReviewProps {
  baseline: BaselineStatement;
  onUpdate: (updated: BaselineStatement) => void;
  onNext: () => void;
  onBack: () => void;
}

const BaselineReview: React.FC<BaselineReviewProps> = ({ baseline, onUpdate, onNext, onBack }) => {
  const [data, setData] = useState<BaselineStatement>(baseline);
  const t = useT().baselineReview;

  const handleChange = (field: keyof BaselineStatement, value: string | string[]) => {
    const newData = { ...data, [field]: value };
    setData(newData);
    onUpdate(newData);
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
           <h2 className="text-2xl font-bold text-gray-800">{t.title}</h2>
           <p className="text-gray-500 mt-1">{t.description}</p>
        </div>
        <div className="bg-blue-50 text-blue-800 px-3 py-1 rounded text-xs font-bold uppercase tracking-wide">
          {t.draft}
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{t.labels.solution}</label>
          <textarea 
            value={data.SOLUTION}
            onChange={(e) => handleChange('SOLUTION', e.target.value)}
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
            rows={5}
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{t.labels.customer}</label>
          <textarea 
            value={data.CUSTOMER_SEGMENT}
            onChange={(e) => handleChange('CUSTOMER_SEGMENT', e.target.value)}
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
            rows={5}
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{t.labels.context}</label>
          <textarea 
            value={data.LIFE_BUSINESS_CONTEXT}
            onChange={(e) => handleChange('LIFE_BUSINESS_CONTEXT', e.target.value)}
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
            rows={5}
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{t.labels.goal}</label>
          <textarea 
            value={data.JOB_TO_BE_DONE}
            onChange={(e) => handleChange('JOB_TO_BE_DONE', e.target.value)}
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
            rows={5}
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">{t.labels.barriers}</label>
            <button onClick={addBarrier} className="text-xs text-blue-600 hover:underline">{t.addBarrier}</button>
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

      <div className="mt-8 pt-6 border-t border-gray-100 flex justify-between">
        <button onClick={onBack} className="text-sm font-semibold text-gray-600 hover:text-gray-800 px-3 py-2 rounded">{t.back}</button>
        <button 
          onClick={onNext}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold shadow-md hover:bg-blue-700 transition-all"
        >
          {t.confirm}
        </button>
      </div>
    </div>
  );
};

export default BaselineReview;
