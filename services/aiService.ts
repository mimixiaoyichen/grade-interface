import OpenAI from "openai";
import { 
  AIAnalysisResponse, 
  BaselineStatement, 
  ComparisonResult, 
  TranscriptSplit 
} from '../types';
import { ANALYSIS_PROMPT } from '../prompts/analysis';
import { SPLIT_PROMPT } from '../prompts/split';
import { COMPARISON_PROMPT_TEXT } from '../prompts/comparison';
import BASELINE_PROMPT from '../prompts/baseline.md?raw';

const MODEL_ID = 'gpt-4o';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  // Note: this runs in the browser; key is already exposed via Vite define
  dangerouslyAllowBrowser: true
});

type JsonSchema = Record<string, any>;

const extractMessageText = (content: any): string => {
  if (!content) return '';
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content.map((part) => (typeof part === 'string' ? part : (part?.text ?? ''))).join('');
  }
  if (typeof content === 'object' && 'text' in content) return (content as any).text;
  return '';
};

const callJsonSchema = async <T>(
  messages: { role: 'system' | 'user'; content: string }[],
  schemaName: string,
  schema: JsonSchema,
  temperature = 0.2
): Promise<T> => {
  const response = await openai.chat.completions.create({
    model: MODEL_ID,
    messages,
    temperature,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: schemaName,
        schema: { ...schema, additionalProperties: false },
        strict: true,
      }
    }
  });

  const text = extractMessageText(response.choices[0]?.message?.content);
  if (!text) throw new Error("No response from model");
  return JSON.parse(text) as T;
};

const callText = async (
  messages: { role: 'system' | 'user'; content: string }[],
  temperature = 0.2
): Promise<string> => {
  const response = await openai.chat.completions.create({
    model: MODEL_ID,
    messages,
    temperature,
  });
  const text = extractMessageText(response.choices[0]?.message?.content);
  if (!text) throw new Error("No response from model");
  return text;
};

const splitSchema: JsonSchema = {
  type: "object",
  properties: {
    part1: { type: "string", description: "The first part of the interview (Discovery)" },
    part2: { type: "string", description: "The second part of the interview (Feedback/Correction)" },
    reasoning: { type: "string", description: "Explanation of why the split was made here" }
  },
  required: ["part1", "part2", "reasoning"],
  additionalProperties: false
};

const analysisSchema: JsonSchema = {
  type: "object",
  properties: {
    customers: {
      type: "array",
      items: {
        type: "object",
        properties: {
          description: { type: "string" },
          quotes: { type: "array", items: { type: "string" } },
          publicEvidence: { type: "string" },
          isSupportedByPublic: { type: "boolean" }
        },
        required: ["description", "quotes", "publicEvidence", "isSupportedByPublic"],
        additionalProperties: false
      }
    },
    contexts: {
      type: "array",
      items: {
        type: "object",
        properties: {
          description: { type: "string" },
          quotes: { type: "array", items: { type: "string" } },
          publicEvidence: { type: "string" },
          isSupportedByPublic: { type: "boolean" }
        },
        required: ["description", "quotes", "publicEvidence", "isSupportedByPublic"],
        additionalProperties: false
      }
    },
    goals: {
      type: "array",
      items: {
        type: "object",
        properties: {
          description: { type: "string" },
          quotes: { type: "array", items: { type: "string" } },
          publicEvidence: { type: "string" },
          isSupportedByPublic: { type: "boolean" }
        },
        required: ["description", "quotes", "publicEvidence", "isSupportedByPublic"],
        additionalProperties: false
      }
    },
    barriers: {
      type: "array",
      items: {
        type: "object",
        properties: {
          description: { type: "string" },
          quotes: { type: "array", items: { type: "string" } },
          publicEvidence: { type: "string" },
          isSupportedByPublic: { type: "boolean" }
        },
        required: ["description", "quotes", "publicEvidence", "isSupportedByPublic"],
        additionalProperties: false
      }
    },
    finalStatement: { type: "string" }
  },
  required: ["customers", "contexts", "goals", "barriers", "finalStatement"],
  additionalProperties: false
};

const baselineSchema: JsonSchema = {
  type: "object",
  properties: {
    SOLUTION: { type: "string" },
    CUSTOMER_SEGMENT: { type: "string" },
    LIFE_BUSINESS_CONTEXT: { type: "string" },
    JOB_TO_BE_DONE: { type: "string" },
    SPECIFIC_BARRIERS: { type: "array", items: { type: "string" } }
  },
  required: ["SOLUTION", "CUSTOMER_SEGMENT", "LIFE_BUSINESS_CONTEXT", "JOB_TO_BE_DONE", "SPECIFIC_BARRIERS"],
  additionalProperties: false
};

const comparisonSchema: JsonSchema = {
  type: "object",
  properties: {
    rows: {
      type: "array",
      items: {
        type: "object",
        properties: {
          component: { type: "string", enum: ["Customer", "Context", "Goal", "Barrier"] },
          baselineText: { type: "string" },
          transcriptModification: { type: "string" },
          type: { type: "string", enum: ["Modification", "Omission", "Hallucination", "Confirmation"] },
          transcriptEvidence: { type: "string" },
          publicSupport: { type: "string" }
        },
        required: ["component", "baselineText", "transcriptModification", "type", "transcriptEvidence", "publicSupport"],
        additionalProperties: false
      }
    }
  },
  required: ["rows"],
  additionalProperties: false
};

/**
 * Helper to fetch and clean raw HTML using aggressive filtering.
 */
const fetchCleanTextFromUrl = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url);
    if (!response.ok) return `[Failed to fetch content: ${response.statusText}]`;
    const rawHtml = await response.text();

    // Parse HTML to DOM
    const parser = new DOMParser();
    const doc = parser.parseFromString(rawHtml, 'text/html');

    const junkSelectors = [
      'script', 'style', 'noscript', 'iframe', 'svg', 
      'link', 'meta', 'head', 'input', 'button', 'form', 
      'textarea', 'select', 'option', 'template', 'object', 
      'embed', 'map', 'area', 'nav', 'footer', 'aside'
    ];
    junkSelectors.forEach(sel => doc.querySelectorAll(sel).forEach(el => el.remove()));

    const blockSelectors = ['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'br', 'tr', 'article', 'section', 'blockquote'];
    blockSelectors.forEach(sel => doc.querySelectorAll(sel).forEach(el => el.prepend(doc.createTextNode('\n'))));

    const textContent = doc.body.textContent || "";

    return textContent
      .split('\n')
      .map(line => line.trim())
      .filter(line => {
        if (!line) return false;
        if (line.length < 3) return false;
        if (line.includes('{') && line.includes('}')) return false;
        if (line.includes('function(') || line.includes('=>') || line.includes('return ')) return false;
        if (line.startsWith('/*') || line.startsWith('//')) return false;
        if (line.includes('var ') || line.includes('const ') || line.includes('let ')) return false;
        if (line.length > 500 && !line.includes(' ')) return false;
        return true;
      })
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

  } catch (e: any) {
    return `[Error cleaning content: ${e.message}]`;
  }
};

export const fetchPublicInfoFromUrl = async (url: string): Promise<string> => {
  const target = url.trim();
  if (!target) return "No URL provided.";

  const looksLikeUrl = /^https?:\/\//i.test(target) || /^[\w-]+\.[\w.-]+/.test(target);

  if (looksLikeUrl) {
    const resp = await fetch(`/api/fetch?url=${encodeURIComponent(target.startsWith('http') ? target : `https://${target}`)}`);
    if (!resp.ok) {
      throw new Error(`Failed to fetch URL: ${resp.status} ${resp.statusText}`);
    }
    const data = await resp.json();
    return `${data.summary}\n\n==========================================\n=== VERBATIM PAGE CONTENT (Cleaned) ===\n==========================================\n\n${data.cleaned}`;
  } else {
    const resp = await fetch(`/api/search?q=${encodeURIComponent(target)}`);
    if (!resp.ok) {
      throw new Error(`Failed to search: ${resp.status} ${resp.statusText}`);
    }
    const data = await resp.json();
    if (!Array.isArray(data.results) || data.results.length === 0) {
      const filteredNote = Array.isArray(data.filteredOut) && data.filteredOut.length > 0
        ? `All fetched pages were filtered out (no mention of ${data.targetDomain || 'target'}).`
        : "No results found.";
      return filteredNote;
    }

    const combined = data.results.map((r: any, idx: number) => {
      if (r.error) return `Source ${idx + 1}: ${r.url}\nERROR: ${r.error}\n`;
      return `Source ${idx + 1}: ${r.title || r.url}\n${r.content}\n`;
    }).join('\n------------------------------\n');

    if (Array.isArray(data.filteredOut) && data.filteredOut.length > 0) {
      return `${combined}\n\nFiltered out ${data.filteredOut.length} sources that did not mention ${data.targetDomain || 'target domain'}.`;
    }

    return combined;
  }
};

export const splitTranscript = async (fullTranscript: string): Promise<TranscriptSplit> => {
  return callJsonSchema<TranscriptSplit>(
    [
      { role: 'user', content: SPLIT_PROMPT },
      { role: 'user', content: `FULL TRANSCRIPT:\n\n${fullTranscript}` }
    ],
    "split_transcript_schema",
    splitSchema,
    0.1
  );
};

export const analyzeSegment = async (
  transcriptSegment: string, 
  publicInfo: string,
  founderInput: string
): Promise<AIAnalysisResponse> => {
  return callJsonSchema<AIAnalysisResponse>(
    [
      { role: 'user', content: ANALYSIS_PROMPT },
      { role: 'user', content: `FOUNDER'S PRIOR STATEMENT:\n${founderInput}\n\nPUBLIC CONTEXT (Truth Source):\n${publicInfo || "No public context provided."}\n\nTRANSCRIPT SEGMENT:\n${transcriptSegment}` }
    ],
    "analysis_schema",
    analysisSchema,
    0.2
  );
};

export const generateBaselineStatement = async (
  publicInfo: string
): Promise<BaselineStatement> => {
  return callJsonSchema<BaselineStatement>(
    [
      { role: 'user', content: BASELINE_PROMPT },
      { role: 'user', content: `SOURCE MATERIAL:\n${publicInfo}` }
    ],
    "baseline_schema",
    baselineSchema,
    0.2
  );
};

export const generateComparison = async (
  baseline: BaselineStatement,
  transcriptPart2: string,
  publicInfo: string
): Promise<ComparisonResult> => {
  const baselineStr = JSON.stringify(baseline, null, 2);
  return callJsonSchema<ComparisonResult>(
    [
      { role: 'user', content: COMPARISON_PROMPT_TEXT },
      { role: 'user', content: `BASELINE STATEMENT:\n${baselineStr}\n\nPUBLIC INFO:\n${publicInfo}\n\nTRANSCRIPT PART 2 (FEEDBACK):\n${transcriptPart2}` }
    ],
    "comparison_schema",
    comparisonSchema,
    0.1
  );
};
