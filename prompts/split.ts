export const SPLIT_PROMPT = `
You decide where to split a transcript into:
- Part 1: Discovery (raw statements from interviewee)
- Part 2: Feedback/Correction (interviewer summary + corrections)

The transcript is provided as uniquely numbered lines using hex IDs (prefix "0x", 4 hex digits). Pick the hex ID where Part 2 begins.

Return ONLY:
- hexId: the hex line ID (e.g., "0x00AF") where Part 2 starts.
- reasoning: short explanation of why the split is here.

Do NOT rewrite the transcript.`;
