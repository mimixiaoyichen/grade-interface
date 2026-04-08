export interface ProblemCharacteristicsData {
  q1: string[];
  q2: string[];
  q3: string[];
  q4: string[];
  q5: string[];
  q6: string;
}

export type ProblemCharacteristicsRaw = Record<string, unknown>;

const normalizeSingleSelect = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).slice(0, 1);
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    return [value];
  }
  return [];
};

export const createProblemCharacteristicsData = (
  initialData?: Partial<ProblemCharacteristicsData> | null
): ProblemCharacteristicsData => ({
  q1: normalizeSingleSelect(initialData?.q1),
  q2: normalizeSingleSelect(initialData?.q2),
  q3: normalizeSingleSelect(initialData?.q3),
  q4: normalizeSingleSelect(initialData?.q4),
  q5: normalizeSingleSelect(initialData?.q5),
  q6: typeof initialData?.q6 === 'string' ? initialData.q6 : ''
});

export const toggleSingleSelect = (current: string[], option: string): string[] =>
  current[0] === option ? [] : [option];

const NEW_SCHEMA_KEYS = [
  'information_intensity',
  'expert_dependency',
  'emotional_valence',
  'problem_discovery'
] as const;

const LEGACY_SCHEMA_KEYS = [
  'frequency',
  'urgency',
  'temporal_frame',
  'barrier_types',
  'goal_orientation',
  'stakes'
] as const;

const isObjectRecord = (value: unknown): value is ProblemCharacteristicsRaw =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

export const hasProblemCharacteristicsAnswers = (data?: ProblemCharacteristicsData | null): boolean =>
  Boolean(
    data &&
    (
      data.q1.length ||
      data.q2.length ||
      data.q3.length ||
      data.q4.length ||
      data.q5.length ||
      data.q6.trim()
    )
  );

export const parseImportedProblemCharacteristics = (
  value: unknown
): { data?: ProblemCharacteristicsData; rawLegacy: ProblemCharacteristicsRaw | null } => {
  if (!isObjectRecord(value)) {
    return { data: undefined, rawLegacy: null };
  }

  const hasNewSchema = NEW_SCHEMA_KEYS.some((key) => key in value);
  if (hasNewSchema) {
    return {
      data: createProblemCharacteristicsData({
        q1: value.information_intensity,
        q2: value.frequency,
        q3: value.stakes,
        q4: value.expert_dependency,
        q5: value.emotional_valence,
        q6: typeof value.problem_discovery === 'string' ? value.problem_discovery : ''
      }),
      rawLegacy: null
    };
  }

  const hasLegacySchema = LEGACY_SCHEMA_KEYS.some((key) => key in value);
  if (!hasLegacySchema) {
    return { data: undefined, rawLegacy: null };
  }

  return {
    data: createProblemCharacteristicsData({
      q2: value.frequency,
      q3: value.stakes
    }),
    rawLegacy: { ...value }
  };
};
