export const BASELINE_REVIEW_FIELDS = [
  'CUSTOMER_SEGMENT',
  'LIFE_BUSINESS_CONTEXT',
  'JOB_TO_BE_DONE'
] as const;

export type BaselineReviewField = typeof BASELINE_REVIEW_FIELDS[number];

const BASELINE_REVIEW_FIELD_SET = new Set<string>(BASELINE_REVIEW_FIELDS);

export const hasCompleteBaselineReviewFieldOrder = (
  order: unknown
): order is BaselineReviewField[] => {
  if (!Array.isArray(order) || order.length !== BASELINE_REVIEW_FIELDS.length) {
    return false;
  }

  const unique = new Set(order);
  return (
    unique.size === BASELINE_REVIEW_FIELDS.length &&
    order.every((field) => typeof field === 'string' && BASELINE_REVIEW_FIELD_SET.has(field))
  );
};

export const createShuffledBaselineReviewFieldOrder = (
  random: () => number = Math.random
): BaselineReviewField[] => {
  const order = [...BASELINE_REVIEW_FIELDS];

  for (let i = order.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }

  return order;
};

export const resolveBaselineReviewFieldOrder = (
  savedOrder?: unknown,
  random: () => number = Math.random
): BaselineReviewField[] =>
  hasCompleteBaselineReviewFieldOrder(savedOrder)
    ? [...savedOrder]
    : createShuffledBaselineReviewFieldOrder(random);
