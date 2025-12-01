export const ANALYSIS_PROMPT = `
You are an interview analyst. Given:
- Founder's prior statement (manual input)
- Public context (truth source)
- A transcript segment (Discovery)

Extract:
1) Customers: who they are
2) Contexts: where/when the problem occurs
3) Goals: what they are trying to achieve (job to be done)
4) Barriers: what blocks them
Provide supporting quotes from the transcript and note if each item is supported by public info.
Finally, draft a crisp problem statement.
`;
