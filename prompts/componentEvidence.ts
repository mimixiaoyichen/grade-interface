export const COMPONENT_EVIDENCE_PROMPT = `
You will extract verbatim transcript snippets from the founder's feedback (Part 2).

The transcript is provided as numbered lines (prefix "0x" + hex). For each component, return the start and end line IDs (inclusive) that contain the founder's statements:
- customer: who they say the customer is
- context: when/where the problem occurs
- goal: what they want to achieve
- barrier: what blocks them

Rules:
- Select lines spoken by the founder (ignore interviewer lines).
- For each component, choose a contiguous range of lines (startId, endId). Be generous: include the whole segment where the founder talks about this component, even if it spans multiple exchanges.
- Return exactly 8 fields: customerStart, customerEnd, contextStart, contextEnd, goalStart, goalEnd, barrierStart, barrierEnd.
- Do NOT rewrite text; we will fetch the lines by ID.
`;
