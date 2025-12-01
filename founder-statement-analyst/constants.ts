
export const SPLIT_TRANSCRIPT_PROMPT = `
You are an expert transcript analyst. You have been given a transcript of a founder interview that has two distinct parts:
1. **Discovery/Free-form**: The interviewer asks open questions to understand the problem space.
2. **Feedback/Correction**: The interviewer reads back a summary or "problem statement" to the founder, and the founder provides specific corrections, clarifications, or feedback.

Your task is to split the transcript into these two parts.
- **Part 1** should contain the initial conversation up until the interviewer starts presenting the summary.
- **Part 2** should start when the interviewer begins testing their summary/hypothesis and continue to the end.

Return a JSON object with 'part1', 'part2', and a 'reasoning' string explaining where you cut it.
`;

export const ANALYSIS_PROMPT_TEMPLATE = `
You are an expert user researcher. Your task is to extract a structured founder problem statement.
You have been provided with:
1. A TRANSCRIPT of an interview.
2. PUBLIC CONTEXT (e.g., website text, pitch deck info) - this is the "Public Truth".
3. FOUNDER'S PRIOR STATEMENT: A manual statement the founder provided beforehand. Use this as context for what they believe, but prioritize the transcript for what they actually said in the interview.

Instructions:
1. Extract distinct items for: Customer Segments, Contexts (When), Goals (Aspirations), and Barriers (Pain points).
2. Use verbatim quotes from the transcript to support the item.
3. **CRITICAL STEP**: For every item you extract from the transcript, cross-reference it with the PUBLIC CONTEXT provided.
   - If the item is mentioned or supported by the Public Context, set 'isSupportedByPublic' to true and quote the specific text from the Public Context in 'publicEvidence'.
   - If the item is NOT found in the Public Context (it is private info or a hallucination), set 'isSupportedByPublic' to false and write "Not found in public sources" in 'publicEvidence'.
   - If the Public Context is empty, mark everything as false.

Definitions:
- Customer Segment: Who the product is for.
- Context (When): The situations or moments when the problem appears.
- Goal/Aspiration: What the customer is trying to accomplish.
- Barriers: What prevents them from achieving that goal today.

Output strict JSON.
`;

export const COMPARISON_PROMPT = `
You are a rigorous data analyst comparing a "Baseline Statement" (derived from public info) against a "Transcript Feedback Session" (where a founder corrects the statement).

Inputs:
1. BASELINE_STATEMENT: The initial hypothesis.
2. TRANSCRIPT_PART_2: The section where the founder critiques, corrects, or expands on the problem statement.
3. PUBLIC_INFO: The original public source text.

Your Task:
Create a comparison table that identifies discrepancies between the Baseline and the Transcript.
For each component (Customer, Context, Goal, Barrier), identify:
- **Modifications**: The baseline was slightly wrong, and the founder corrected it.
- **Omissions**: The baseline missed something important that the founder added.
- **Hallucinations**: The baseline claimed something that the founder explicitly denied or said was wrong.
- **Confirmations**: The baseline was correct and the founder agreed.

For each row, you MUST:
1. State the Baseline Text (if applicable).
2. State the Transcript Modification (the "truth" according to the interview).
3. Classify the type (Modification, Omission, Hallucination, Confirmation).
4. Provide a Quote from the transcript as evidence.
5. Check if this NEW transcript finding is supported by PUBLIC_INFO. (e.g., "Supported by website: '...'" or "Not found in public info").

Output JSON format:
{
  "rows": [
    {
      "component": "Customer" | "Context" | "Goal" | "Barrier",
      "baselineText": "string",
      "transcriptModification": "string",
      "type": "Modification" | "Omission" | "Hallucination" | "Confirmation",
      "transcriptEvidence": "string",
      "publicSupport": "string"
    }
  ]
}
`;

export const BASELINE_PROMPT_GPT5 = `
You are GPT-5, OpenAI's most advanced model with state-of-the-art performance in analysis and reasoning. You are an expert startup analyst specializing in the Jobs-to-be-Done (JTBD) framework.

Your task is to analyze company information and generate a structured JTBD analysis that captures:
1. What the company offers (SOLUTION)
2. Who they serve (CUSTOMER_SEGMENT)
3. When/where customers need this (LIFE_BUSINESS_CONTEXT)
4. What customers ultimately want to achieve (JOB_TO_BE_DONE)
5. What problems/barriers the solution addresses (SPECIFIC_BARRIERS)

## CRITICAL INSTRUCTIONS

### ✅ ALWAYS DO:
1. **Extract Every Key Detail**: List all adjectives, features, customer descriptors, outcomes.
2. **Use Source Language**: Copy exact product names and technical terms.
3. **Follow JTBD Syntax Strictly**:
   - LIFE_BUSINESS_CONTEXT: **MUST** start with "When..." or "While..."
   - JOB_TO_BE_DONE: **MUST** start with "To..." followed by action verb
   - Be outcome-focused, not feature-focused.
4. **Ground Barriers in Source**: Start with problems explicitly mentioned or strongly implied by solution features.

### ❌ NEVER DO:
1. **Omit Key Information**: Don't drop adjectives or compound concepts.
2. **Hallucinate Facts**: Don't add specific claims, numbers, or features not in source.
3. **Use Vague Language**: Avoid "various", "multiple", "innovative" without specifics.

## OUTPUT FORMAT
Generate **ONLY** valid JSON in this exact format:

{
  "SOLUTION": "Specific product/service with key attributes",
  "CUSTOMER_SEGMENT": "Precise target customer description",
  "LIFE_BUSINESS_CONTEXT": "When [situation] while [constraints/goals]",
  "JOB_TO_BE_DONE": "To [achieve outcome] while [constraints] in [context]",
  "SPECIFIC_BARRIERS": [
    "Specific barrier 1",
    "Specific barrier 2",
    "Specific barrier 3",
    "Specific barrier 4",
    "Specific barrier 5",
    "Specific barrier 6",
    "Specific barrier 7"
  ]
}
`;
