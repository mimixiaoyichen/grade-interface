export const COMPARISON_PROMPT_TEXT = `
You compare a baseline statement (from public truth) with a transcript Part 2 (feedback/corrections).
Return rows where the transcript modifies, omits, hallucinates, or confirms the baseline components (Customer, Context, Goal, Barrier).
For each row include: component, baselineText, transcriptModification, type, transcriptEvidence, publicSupport.
`;
