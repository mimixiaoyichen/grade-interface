import { describe, expect, it, vi } from 'vitest';
import {
  BASELINE_REVIEW_FIELDS,
  createShuffledBaselineReviewFieldOrder,
  resolveBaselineReviewFieldOrder
} from '../utils/baselineReviewOrder';

describe('baselineReviewOrder', () => {
  it('reuses a saved complete order', () => {
    const savedOrder = [
      'JOB_TO_BE_DONE',
      'CUSTOMER_SEGMENT',
      'LIFE_BUSINESS_CONTEXT'
    ] as const;

    expect(resolveBaselineReviewFieldOrder(savedOrder)).toEqual(savedOrder);
  });

  it('falls back to a shuffled full order when saved data is missing', () => {
    const random = vi
      .fn<() => number>()
      .mockReturnValueOnce(0.4)
      .mockReturnValueOnce(0.1);

    const order = resolveBaselineReviewFieldOrder(undefined, random);

    expect(order).toHaveLength(BASELINE_REVIEW_FIELDS.length);
    expect([...order].sort()).toEqual([...BASELINE_REVIEW_FIELDS].sort());
    expect(order).toEqual(createShuffledBaselineReviewFieldOrder(() => 0.4));
  });

  it('regenerates when the saved order is incomplete', () => {
    const random = vi
      .fn<() => number>()
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0);

    expect(resolveBaselineReviewFieldOrder(['CUSTOMER_SEGMENT'], random)).toEqual([
      'LIFE_BUSINESS_CONTEXT',
      'JOB_TO_BE_DONE',
      'CUSTOMER_SEGMENT'
    ]);
  });
});
