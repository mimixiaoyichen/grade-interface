const BARRIER_LEAD_IN =
  /^the customer cannot achieve the aspiration because[\s,:-]*/i;

export const stripBarrierLeadIn = (text: string | undefined | null): string =>
  (text || '').replace(BARRIER_LEAD_IN, '').trim();

export const stripBarrierLeadInList = (
  barriers: Array<string | undefined | null> | undefined | null
): string[] => (barriers || []).map((barrier) => stripBarrierLeadIn(barrier));
