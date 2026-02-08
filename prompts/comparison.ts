export const COMPARISON_PROMPT_TEXT = `
You compare a baseline statement (from public truth) with a transcript Part 2 (feedback/corrections).
Return exactly one row for each baseline component (Solution, Customer, Context, Goal, Barrier).
If the transcript does not change a component, return it as a Confirmation.
For each row include:
- component, baselineText, transcriptModification, type (Modification | Omission | Hallucination | Confirmation)
- transcriptEvidence: verbatim snippet from the transcript that justifies the change
- publicEvidence: exact matching text from public info (no summaries)
- publicEvidenceContext: 20–80 surrounding characters from public info (verbatim) with the evidence inside it
- isSupportedByPublic: boolean
- publicSupport: short status string such as "Supported: <quote>" or "Not found in public info"
`;
