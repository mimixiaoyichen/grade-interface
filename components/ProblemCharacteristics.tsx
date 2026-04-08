
import React, { useState } from 'react';
import {
  createProblemCharacteristicsData,
  toggleSingleSelect,
  type ProblemCharacteristicsData
} from '../utils/problemCharacteristics';
import { useT } from '../utils/strings';

export type { ProblemCharacteristicsData } from '../utils/problemCharacteristics';

interface Props {
  initialData?: ProblemCharacteristicsData;
  onNext: (data: ProblemCharacteristicsData) => void;
  onBack: () => void;
}

const SingleSelectGroup: React.FC<{
  name: string;
  options: string[];
  selected: string[];
  onChange: (option: string) => void;
}> = ({ name, options, selected, onChange }) => {
  const selectedValue = selected[0] || '';
  return (
    <div className="space-y-2 mt-2">
      {options.map((opt) => (
        <label key={opt} className="flex items-start gap-3 cursor-pointer group">
          <input
            type="radio"
            name={name}
            checked={selectedValue === opt}
            onChange={() => onChange(opt)}
            className="mt-0.5 w-4 h-4 border-gray-300 text-blue-600 focus:ring-blue-500 shrink-0"
          />
          <span className="text-sm text-gray-700 group-hover:text-gray-900">{opt}</span>
        </label>
      ))}
    </div>
  );
};

const SectionLabel: React.FC<{ title: string; question: string }> = ({ title, question }) => (
  <div className="mb-3">
    <p className="text-base font-bold text-gray-900 uppercase tracking-wide">{title}</p>
    <p className="text-sm text-gray-600 mt-1">{question}</p>
  </div>
);

const ProblemCharacteristics: React.FC<Props> = ({ initialData, onNext, onBack }) => {
  type SingleSelectKey = 'q1' | 'q2' | 'q3' | 'q4' | 'q5';
  const text = useT().problemCharacteristics;
  const [data, setData] = useState<ProblemCharacteristicsData>(
    () => createProblemCharacteristicsData(initialData)
  );

  const setQ = (key: SingleSelectKey, val: string[]) =>
    setData((d) => ({ ...d, [key]: val.slice(0, 1) }));

  const toggleQ = (key: SingleSelectKey, option: string) =>
    setQ(key, toggleSingleSelect(data[key], option));

  const setQ6 = (val: string) => setData((d) => ({ ...d, q6: val }));

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 animate-fade-in-up">
      {/* Header */}
      <div className="mb-6 border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-800">{text.title}</h2>
        <p className="text-gray-500 mt-1 text-sm">{text.description}</p>
      </div>

      <div className="divide-y divide-gray-100">
        {/* Q1 */}
        <div className="py-8 first:pt-0">
          <SectionLabel
            title={text.questions.informationIntensity.title}
            question={text.questions.informationIntensity.prompt}
          />
          <SingleSelectGroup
            name="information-intensity"
            options={text.questions.informationIntensity.options}
            selected={data.q1}
            onChange={(option) => toggleQ('q1', option)}
          />
        </div>

        {/* Q2 */}
        <div className="py-8">
          <SectionLabel
            title={text.questions.frequency.title}
            question={text.questions.frequency.prompt}
          />
          <SingleSelectGroup
            name="problem-frequency"
            options={text.questions.frequency.options}
            selected={data.q2}
            onChange={(option) => toggleQ('q2', option)}
          />
        </div>

        {/* Q3 */}
        <div className="py-8">
          <SectionLabel
            title={text.questions.stakes.title}
            question={text.questions.stakes.prompt}
          />
          <SingleSelectGroup
            name="stakes"
            options={text.questions.stakes.options}
            selected={data.q3}
            onChange={(option) => toggleQ('q3', option)}
          />
        </div>

        {/* Q4 */}
        <div className="py-8">
          <SectionLabel
            title={text.questions.expertDependency.title}
            question={text.questions.expertDependency.prompt}
          />
          <SingleSelectGroup
            name="expert-dependency"
            options={text.questions.expertDependency.options}
            selected={data.q4}
            onChange={(option) => toggleQ('q4', option)}
          />
        </div>

        {/* Q5 */}
        <div className="py-8">
          <SectionLabel
            title={text.questions.emotionalValence.title}
            question={text.questions.emotionalValence.prompt}
          />
          <SingleSelectGroup
            name="emotional-valence"
            options={text.questions.emotionalValence.options}
            selected={data.q5}
            onChange={(option) => toggleQ('q5', option)}
          />
        </div>

        {/* Q6 */}
        <div className="py-8">
          <SectionLabel
            title={text.questions.problemDiscovery.title}
            question={text.questions.problemDiscovery.prompt}
          />
          <textarea
            value={data.q6}
            onChange={(e) => setQ6(e.target.value)}
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
            rows={4}
          />
        </div>

      </div>

      {/* Footer nav */}
      <div className="mt-8 pt-6 border-t border-gray-100 flex justify-between">
        <button
          onClick={onBack}
          className="text-sm font-semibold text-gray-600 hover:text-gray-800 px-3 py-2 rounded"
        >
          {text.buttons.back}
        </button>
        <button
          onClick={() => onNext(data)}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold shadow-md hover:bg-blue-700 transition-all"
        >
          {text.buttons.continue}
        </button>
      </div>
    </div>
  );
};

export default ProblemCharacteristics;
