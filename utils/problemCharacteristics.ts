export interface ProblemCharacteristicsData {
  q1: string[];
  q2: string[];
  q3: string[];
  q4: Record<string, string>;
  q5: string[];
  q6: string[];
}

const normalizeSingleSelect = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).slice(0, 1);
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    return [value];
  }
  return [];
};

const normalizeBarrierSelections = (value: unknown): Record<string, string> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};

  return Object.entries(value as Record<string, unknown>).reduce<Record<string, string>>((acc, [key, raw]) => {
    if (typeof raw === 'string' && raw.trim().length > 0) {
      acc[key] = raw;
    }
    return acc;
  }, {});
};

export const createProblemCharacteristicsData = (
  initialData?: Partial<ProblemCharacteristicsData> | null
): ProblemCharacteristicsData => ({
  q1: normalizeSingleSelect(initialData?.q1),
  q2: normalizeSingleSelect(initialData?.q2),
  q3: normalizeSingleSelect(initialData?.q3),
  q4: normalizeBarrierSelections(initialData?.q4),
  q5: normalizeSingleSelect(initialData?.q5),
  q6: normalizeSingleSelect(initialData?.q6)
});

export const toggleSingleSelect = (current: string[], option: string): string[] =>
  current[0] === option ? [] : [option];
