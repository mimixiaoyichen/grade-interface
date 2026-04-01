
import React, { useMemo, useState } from 'react';

export interface ProblemCharacteristicsData {
  q1: string[];
  q2: string[];
  q3: string[];
  q4: Record<string, string>;
  q5: string[];
  q6: string[];
}

interface Props {
  initialData?: ProblemCharacteristicsData;
  onNext: (data: ProblemCharacteristicsData) => void;
  onBack: () => void;
}

const BARRIER_GROUPS = [
  {
    group: 'Internal',
    items: [
      {
        label: 'Information & Search',
        sub: 'Customers cannot easily find, access, or evaluate the right information or available options'
      },
      {
        label: 'Cognitive & Epistemic',
        sub: "Information exists but the customer struggle to understand or decide what to do with it"
      },
      {
        label: 'Behavioral & Motivational',
        sub: "Customers know what they should do but fail to take action (inertia, shame, avoidance)"
      }
    ]
  },
  {
    group: 'External',
    items: [
      {
        label: 'Access & Structural',
        sub: 'Geographic unavailability, economic exclusion, regulatory/legal gatekeeping, infrastructure gaps'
      },
      {
        label: 'Market & Coordination',
        sub: 'Multi-party misalignment, trust failures, switching costs, timing/liquidity problems'
      },
      {
        label: 'Social & Relational',
        sub: 'Customers depend on trust, relationships, or social norms that make the problem difficult to address.'
      }
    ]
  }
];

const PROBLEM_FREQUENCY_OPTIONS = [
  'Low: Rare or occasional occurrence',
  'Moderate: Occurs regularly but not constantly',
  'High: Occurs frequently or as a persistent issue'
];

const PROBLEM_URGENCY_OPTIONS = [
  'Deferrable: Can be addressed later without significant consequences',
  'Schedulable: Needs attention but can be planned in advance',
  'Time-sensitive: Requires prompt action',
  'Urgent: Requires immediate resolution'
];

const TEMPORAL_FRAME_OPTIONS = [
  'Continuous: Ongoing and persistent',
  'Episodic: Recurs at intervals or under certain conditions',
  'Discrete: One-time or event-based'
];

const GOAL_ORIENTATION_OPTIONS = [
  'Prevention: Avoid a negative outcome or decline',
  'Promotion: Achieve growth, improvement, or gain',
  'Maintenance: Sustain or stabilize an existing state'
];

const STAKES_OPTIONS = [
  'Low: Limited consequences; minimal disruption to livelihood or well-being',
  'High: Significant consequences (e.g., financial, legal, medical, or identity-related impact)'
];

const CheckboxGroup: React.FC<{
  options: string[];
  selected: string[];
  onChange: (val: string[]) => void;
}> = ({ options, selected, onChange }) => {
  const toggle = (opt: string) =>
    onChange(selected.includes(opt) ? selected.filter((s) => s !== opt) : [...selected, opt]);
  return (
    <div className="space-y-2 mt-2">
      {options.map((opt) => (
        <label key={opt} className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={selected.includes(opt)}
            onChange={() => toggle(opt)}
            className="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 shrink-0"
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
  const [data, setData] = useState<ProblemCharacteristicsData>(
    initialData ?? { q1: [], q2: [], q3: [], q4: {}, q5: [], q6: [] }
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

  const setQ = (key: keyof ProblemCharacteristicsData, val: string[]) =>
    setData((d) => ({ ...d, [key]: val }));

  const setQ4Row = (row: string, val: string) =>
    setData((d) => ({ ...d, q4: { ...d.q4, [row]: val } }));

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 animate-fade-in-up">
      {/* Header */}
      <div className="mb-6 border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-800">Characterizing the Problem</h2>
        <p className="text-gray-500 mt-1 text-sm">
          Now that you've written your problem statement, we'd like to understand more about the nature of the
          problem your startup addresses. The following questions focus on different aspects of your customers'
          problems.
        </p>
      </div>

      <div className="divide-y divide-gray-100">

        {/* Q4 – Matrix */}
        <div className="py-8 first:pt-0">
          <SectionLabel
            title="Barrier Types (Internal vs External)"
            question="What types of barriers prevent customers from achieving their goals if your solution didn’t exist? What specific obstacles stand in their way?"
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
                    <tr key={row.label} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="py-3 pr-4 text-left">
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(data.q4[row.label])}
                            onChange={() =>
                              setQ4Row(row.label, data.q4[row.label] ? '' : 'present')
                            }
                            className="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span>
                            <span className="font-semibold text-gray-800">{row.label}</span>
                            <span className="text-gray-400 text-xs block">({row.sub})</span>
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
                          <span className="text-xs font-bold text-gray-700 uppercase tracking-widest">{group.group}</span>
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
            title="Problem Frequency"
            question="How frequently do your customers encounter this problem?"
          />
          <CheckboxGroup options={PROBLEM_FREQUENCY_OPTIONS} selected={data.q1} onChange={(v) => setQ('q1', v)} />
        </div>

        {/* Q2 */}
        <div className="py-8">
          <SectionLabel
            title="Problem Urgency"
            question="How quickly must this problem be resolved to avoid harm or negative outcomes?"
          />
          <CheckboxGroup options={PROBLEM_URGENCY_OPTIONS} selected={data.q2} onChange={(v) => setQ('q2', v)} />
        </div>

        {/* Q3 */}
        <div className="py-8">
          <SectionLabel
            title="Temporal Frame"
            question="What is the time structure of this problem?"
          />
          <CheckboxGroup options={TEMPORAL_FRAME_OPTIONS} selected={data.q3} onChange={(v) => setQ('q3', v)} />
        </div>

        {/* Q5 */}
        <div className="py-8">
          <SectionLabel
            title="Goal Orientation"
            question="What type of outcome are customers trying to achieve when addressing this problem?"
          />
          <CheckboxGroup options={GOAL_ORIENTATION_OPTIONS} selected={data.q5} onChange={(v) => setQ('q5', v)} />
        </div>

        {/* Q6 */}
        <div className="py-8">
          <SectionLabel
            title="Stakes (Impact of Failure)"
            question="How costly is a negative outcome if the problem is not solved?"
          />
          <CheckboxGroup options={STAKES_OPTIONS} selected={data.q6} onChange={(v) => setQ('q6', v)} />
        </div>

      </div>

      {/* Footer nav */}
      <div className="mt-8 pt-6 border-t border-gray-100 flex justify-between">
        <button
          onClick={onBack}
          className="text-sm font-semibold text-gray-600 hover:text-gray-800 px-3 py-2 rounded"
        >
          Back
        </button>
        <button
          onClick={() => onNext(data)}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold shadow-md hover:bg-blue-700 transition-all"
        >
          Continue →
        </button>
      </div>
    </div>
  );
};

export default ProblemCharacteristics;
