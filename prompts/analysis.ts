export const ANALYSIS_PROMPT = `
You are an interview analyst. Given:
- Founder's prior statement (manual input)
- Public context (truth source)
- A transcript segment (Discovery)

Extract:
1) Customers: who they are
2) Contexts: where/when the problem occurs
3) Goals: what they are trying to achieve
4) Barriers: what blocks them

For each item:
- Provide supporting quotes from the transcript (verbatim).
- publicEvidence: if supported by public info, copy the exact matching text (no summaries).
- publicEvidenceContext: include 20–80 surrounding characters from public info (verbatim) with the evidence inside it.
- isSupportedByPublic: true/false.

Finally, draft a concise problem statement.
`;
