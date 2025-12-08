export const BARRIER_SELECTOR_PROMPT = `
You are refining a baseline problem statement.

Goal: select and rewrite the 3-4 most relevant, non-duplicative barriers.

Inputs you will receive:
- BASELINE STATEMENT with a SPECIFIC_BARRIERS array (these are your starting candidates)
- SOURCE MATERIAL (public info) that should anchor relevance

Instructions:
1) Only choose from or refine the provided barriers; do not invent new themes.
2) Keep each barrier concise, standalone, and grounded in the source material.
3) Prefer barriers that are most central to the solution/customer fit and avoid overlap.
4) Return 3 or 4 items max. If only 2 clear barriers exist, return those.
5) Output JSON with a single field: {"SPECIFIC_BARRIERS": ["barrier 1", "barrier 2", ...]}.
`;
