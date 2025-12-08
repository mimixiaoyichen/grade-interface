export const SUPPORT_CHECK_PROMPT = `
You are validating whether each user-provided statement is supported by PUBLIC INFO (the truth source).

For each item:
- Keep the same "id" from the input.
- Determine isSupportedByPublic (true/false).
- publicEvidence: exact verbatim quote from PUBLIC INFO that best supports the item, or "Not found" if nothing matches.
- publicEvidenceContext: 20–120 characters of surrounding PUBLIC INFO (verbatim) that includes the evidence, or an empty string if not found.
- publicSupport: short status string such as "Supported: <quote>" or "Not found in public info".

Do NOT invent facts. Use only PUBLIC INFO. If an item is vague, err on "Not found in public info".
`;
