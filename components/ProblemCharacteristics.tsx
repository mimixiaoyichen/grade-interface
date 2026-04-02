
import React, { useMemo, useState } from 'react';
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

const BARRIER_GROUPS = [
  {
    group: 'internal',
    items: [
      {
        id: 'Information & Search',
        key: 'informationSearch'
      },
      {
        id: 'Cognitive & Epistemic',
        key: 'cognitiveEpistemic'
      },
      {
        id: 'Behavioral & Motivational',
        key: 'behavioralMotivational'
      }
    ]
  },
  {
    group: 'external',
    items: [
      {
        id: 'Access & Structural',
        key: 'accessStructural'
      },
      {
        id: 'Market & Coordination',
        key: 'marketCoordination'
      },
      {
        id: 'Social & Relational',
        key: 'socialRelational'
      }
    ]
  }
];

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
  type SingleSelectKey = 'q1' | 'q2' | 'q3' | 'q5' | 'q6';
  const text = useT().problemCharacteristics;
  const [data, setData] = useState<ProblemCharacteristicsData>(
    () => createProblemCharacteristicsData(initialData)
  );
  const randomizedBarrierGroups = useMemo(() => {
    const shuffle = <T,>(arr: T[]) => {
      const copy = [...arr];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    };
    return shuffle(BARRIER_GROUPS).map((group) => ({
      ...group,
      items: shuffle(group.items)
    }));
  }, []);

  const setQ = (key: SingleSelectKey, val: string[]) =>
    setData((d) => ({ ...d, [key]: val.slice(0, 1) }));

  const toggleQ = (key: SingleSelectKey, option: string) =>
    setQ(key, toggleSingleSelect(data[key], option));

  const setQ4Row = (row: string, val: string) =>
    setData((d) => ({ ...d, q4: { ...d.q4, [row]: val } }));

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 animate-fade-in-up">
      {/* Header */}
      <div className="mb-6 border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-800">{text.title}</h2>
        <p className="text-gray-500 mt-1 text-sm">{text.description}</p>
      </div>

      <div className="divide-y divide-gray-100">

        {/* Q4 – Matrix */}
        <div className="py-8 first:pt-0">
          <SectionLabel
            title={text.questions.barrierTypes.title}
            question={text.questions.barrierTypes.prompt}
          />
          <div className="overflow-x-auto mt-3">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 pr-4 w-full" />
                </tr>
              </thead>
              <tbody>
                {randomizedBarrierGroups.flatMap((group, groupIdx) => {
                  const rows = group.items.map((row, idx) => (
                    <tr key={row.id} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="py-3 pr-4 text-left">
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(data.q4[row.id])}
                            onChange={() =>
                              setQ4Row(row.id, data.q4[row.id] ? '' : 'present')
                            }
                            className="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span>
                            <span className="font-semibold text-gray-800">{text.barrierItems[row.key].label}</span>
                            <span className="text-gray-400 text-xs block">({text.barrierItems[row.key].sub})</span>
                          </span>
                        </label>
                      </td>
                    </tr>
                  ));
                  const needsSpacer = groupIdx < randomizedBarrierGroups.length - 1;
                  return [
                    (
                      <tr key={`${group.group}-${groupIdx}`} className="bg-slate-100">
                        <td className="py-2 pr-4 text-left" colSpan={1}>
                          <span className="text-xs font-bold text-gray-700 uppercase tracking-widest">{text.groups[group.group]}</span>
                        </td>
                      </tr>
                    ),
                    ...rows,
                    ...(needsSpacer
                      ? [(
                          <tr key={`${group.group}-${groupIdx}-gap`} className="bg-white">
                            <td className="h-3" />
                          </tr>
                        )]
                      : [])
                  ];
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Q1 */}
        <div className="py-8">
          <SectionLabel
            title={text.questions.frequency.title}
            question={text.questions.frequency.prompt}
          />
          <SingleSelectGroup
            name="problem-frequency"
            options={text.questions.frequency.options}
            selected={data.q1}
            onChange={(option) => toggleQ('q1', option)}
          />
        </div>

        {/* Q2 */}
        <div className="py-8">
          <SectionLabel
            title={text.questions.urgency.title}
            question={text.questions.urgency.prompt}
          />
          <SingleSelectGroup
            name="problem-urgency"
            options={text.questions.urgency.options}
            selected={data.q2}
            onChange={(option) => toggleQ('q2', option)}
          />
        </div>

        {/* Q3 */}
        <div className="py-8">
          <SectionLabel
            title={text.questions.temporalFrame.title}
            question={text.questions.temporalFrame.prompt}
          />
          <SingleSelectGroup
            name="temporal-frame"
            options={text.questions.temporalFrame.options}
            selected={data.q3}
            onChange={(option) => toggleQ('q3', option)}
          />
        </div>

        {/* Q5 */}
        <div className="py-8">
          <SectionLabel
            title={text.questions.goalOrientation.title}
            question={text.questions.goalOrientation.prompt}
          />
          <SingleSelectGroup
            name="goal-orientation"
            options={text.questions.goalOrientation.options}
            selected={data.q5}
            onChange={(option) => toggleQ('q5', option)}
          />
        </div>

        {/* Q6 */}
        <div className="py-8">
          <SectionLabel
            title={text.questions.stakes.title}
            question={text.questions.stakes.prompt}
          />
          <SingleSelectGroup
            name="stakes"
            options={text.questions.stakes.options}
            selected={data.q6}
            onChange={(option) => toggleQ('q6', option)}
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
