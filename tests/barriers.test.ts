import { describe, expect, it } from 'vitest';
import { stripBarrierLeadIn, stripBarrierLeadInList } from '../utils/barriers';

describe('barriers', () => {
  it('strips the stock lead-in from a barrier string', () => {
    expect(
      stripBarrierLeadIn(
        'The customer cannot achieve the aspiration because manual handoffs slow every deployment.'
      )
    ).toBe('manual handoffs slow every deployment.');
  });

  it('leaves unrelated barrier text unchanged', () => {
    expect(stripBarrierLeadIn('Small teams cannot monitor every site overnight.')).toBe(
      'Small teams cannot monitor every site overnight.'
    );
  });

  it('strips the lead-in across a list of barriers', () => {
    expect(
      stripBarrierLeadInList([
        'The customer cannot achieve the aspiration because procurement takes weeks.',
        'Training new operators is inconsistent.'
      ])
    ).toEqual([
      'procurement takes weeks.',
      'Training new operators is inconsistent.'
    ]);
  });
});
