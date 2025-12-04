import OpenAI from "openai";
import { 
  AIAnalysisResponse, 
  BaselineStatement, 
  ComparisonResult, 
  TranscriptSplit,
  TranscriptionResult
} from '../types';
import { ANALYSIS_PROMPT } from '../prompts/analysis';
import { SPLIT_PROMPT } from '../prompts/split';
import { COMPARISON_PROMPT_TEXT } from '../prompts/comparison';
import BASELINE_PROMPT from '../prompts/baseline.md?raw';
import { COMPONENT_EVIDENCE_PROMPT } from '../prompts/componentEvidence';

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
    hexId: { type: "string", description: "Hex line ID (e.g., 0x00AF) where Part 2 begins" },
    reasoning: { type: "string", description: "Explanation of why the split was made here" }
  },
  required: ["hexId", "reasoning"],
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
          publicEvidenceContext: { type: "string" },
          isSupportedByPublic: { type: "boolean" }
        },
        required: ["description", "quotes", "publicEvidence", "publicEvidenceContext", "isSupportedByPublic"],
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
          publicEvidence: { type: "string" },
          publicEvidenceContext: { type: "string" },
          isSupportedByPublic: { type: "boolean" },
          publicSupport: { type: "string" }
        },
        required: ["component", "baselineText", "transcriptModification", "type", "transcriptEvidence", "publicEvidence", "publicEvidenceContext", "isSupportedByPublic", "publicSupport"],
        additionalProperties: false
      }
    }
  },
  required: ["rows"],
  additionalProperties: false
};

const componentEvidenceSchema: JsonSchema = {
  type: "object",
  properties: {
    customerStart: { type: "string" },
    customerEnd: { type: "string" },
    contextStart: { type: "string" },
    contextEnd: { type: "string" },
    goalStart: { type: "string" },
    goalEnd: { type: "string" },
    barrierStart: { type: "string" },
    barrierEnd: { type: "string" }
  },
  required: ["customerStart","customerEnd","contextStart","contextEnd","goalStart","goalEnd","barrierStart","barrierEnd"],
  additionalProperties: false
};

const buildDiarizedText = (payload: any) => {
  const segments = Array.isArray(payload?.segments) ? payload.segments : [];
  if (!segments.length) return (payload?.text || '').trim();

  const lines = segments.map((seg: any, idx: number) => {
    const speakerFromWords = Array.isArray(seg?.words) ? seg.words.find((w: any) => w?.speaker !== undefined)?.speaker : undefined;
    const speakerId = seg?.speaker ?? speakerFromWords;
    const speakerLabel = speakerId === undefined ? 'Speaker' : `Speaker ${speakerId}`;
    const segmentText = typeof seg?.text === 'string'
      ? seg.text
      : Array.isArray(seg?.words)
        ? seg.words.map((w: any) => w?.word || '').join('').trim()
        : '';
    const text = segmentText?.trim();
    if (!text) return null;
    return `${speakerLabel}: ${text}`;
  }).filter(Boolean);

  if (!lines.length) return (payload?.text || '').trim();
  return lines.join('\n');
};

export const transcribeAudioWithDiarization = async (file: File): Promise<TranscriptionResult> => {
  const toBase64 = (f: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(f);
    });

  const fileData = await toBase64(file);
  const resp = await fetch('/api/transcribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileData, fileName: file.name })
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || `Transcription failed: ${resp.statusText}`);
  }

  const data = await resp.json();
  return {
    text: data.text || '',
    diarizedText: data.diarizedText || data.text || '',
    segments: undefined,
    words: data.words,
    speakers: data.speakers
  };
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

  const parseJsonSafe = async (resp: Response) => {
    const contentType = resp.headers.get('content-type') || '';
    const text = await resp.text();
    if (contentType.includes('application/json')) {
      try {
        return JSON.parse(text);
      } catch {
        const snippet = text.slice(0, 200);
        throw new Error(`Response claimed JSON but could not parse. Status ${resp.status}. Body starts: ${snippet}`);
      }
    }
    const snippet = text.slice(0, 200);
    if (snippet.includes('<!DOCTYPE html')) {
      throw new Error(`Unexpected HTML from API (check /api/fetch or /api/search). Status ${resp.status}. Body starts: ${snippet}`);
    }
    throw new Error(`Unexpected response (not JSON). Status ${resp.status}. Body starts: ${snippet}`);
  };

  const formatSearchResults = (data: any, query: string) => {
    if (data.error) {
      throw new Error(data.error);
    }
    if (!Array.isArray(data.results) || data.results.length === 0) {
      if (Array.isArray(data.filteredOut) && data.filteredOut.length > 0) {
        return `All fetched pages were filtered out (no mention of ${data.targetDomain || 'target'}).`;
      }
      return `No results found for "${query}".`;
    }

    const combined = data.results.map((r: any, idx: number) => {
      if (r.error) return `Source ${idx + 1}: ${r.url}\nERROR: ${r.error}\n`;
      const tag = r.isOfficial ? '[OFFICIAL]' : '[THIRD-PARTY]';
      return `${tag} Source ${idx + 1}: ${r.title || r.url}\n${r.content}\n`;
    }).join('\n------------------------------\n');

    const filteredNote = Array.isArray(data.filteredOut) && data.filteredOut.length > 0
      ? `\n\nFiltered out ${data.filteredOut.length} sources that did not mention ${data.targetDomain || 'target domain'}.`
      : '';

    const errorNote = Array.isArray(data.errored) && data.errored.length > 0
      ? `\n\nSkipped ${data.errored.length} sources due to fetch errors.`
      : '';

    return `${combined}${filteredNote}${errorNote}`;
  };

  const sections: string[] = [];
  let searchTerm = target;

  if (looksLikeUrl) {
    const normalizedUrl = target.startsWith('http') ? target : `https://${target}`;
    const resp = await fetch(`/api/fetch?url=${encodeURIComponent(normalizedUrl)}`);
    if (!resp.ok) {
      throw new Error(`Failed to fetch URL: ${resp.status} ${resp.statusText}`);
    }
    const data = await parseJsonSafe(resp);
    sections.push(`${data.summary}\n\n==========================================\n=== VERBATIM PAGE CONTENT (Cleaned) ===\n==========================================\n\n${data.cleaned}`);

    try {
      const host = new URL(normalizedUrl).hostname.replace(/^www\./, '');
      if (host) searchTerm = host;
    } catch {
      searchTerm = target;
    }
  }

  if (searchTerm) {
    try {
      const resp = await fetch(`/api/search?q=${encodeURIComponent(searchTerm)}`);
      if (!resp.ok) {
        throw new Error(`Failed to search: ${resp.status} ${resp.statusText}`);
      }
      const data = await parseJsonSafe(resp);
      sections.push(`=== Web Search Sources (${searchTerm}) ===\n${formatSearchResults(data, searchTerm)}`);
    } catch (e: any) {
      sections.push(`[Search failed: ${e.message}]`);
    }
  }

  return sections.join('\n\n').trim();
};

export const splitTranscript = async (fullTranscript: string): Promise<TranscriptSplit> => {
  const lines = fullTranscript.split('\n');
  const numberedTranscript = lines.map((line, idx) => {
    const hex = (0x1000 + idx).toString(16).toUpperCase().slice(-4); // 4 hex digits
    return `0x${hex} ${line}`;
  }).join('\n');

  return callJsonSchema<any>(
    [
      { role: 'user', content: SPLIT_PROMPT },
      { role: 'user', content: `FULL TRANSCRIPT (numbered):\n\n${numberedTranscript}` }
    ],
    "split_transcript_schema",
    splitSchema,
    0.1
  ).then((res: any) => {
    const hexId = (res.hexId || '').toString().trim();
    const idx = lines.findIndex((_, i) => {
      const hex = (0x1000 + i).toString(16).toUpperCase().slice(-4);
      return `0x${hex}`.toLowerCase() === hexId.toLowerCase();
    });
    const clampedIdx = idx >= 0 ? idx : Math.floor(lines.length / 2);
    const part1 = lines.slice(0, clampedIdx).join('\n');
    const part2 = lines.slice(clampedIdx).join('\n');
    const usedFallback = idx === -1;
    return {
      part1,
      part2,
      reasoning: usedFallback
        ? `Could not find hex line ID ("${hexId}"). Split at index ${clampedIdx} (fallback midpoint). Please review manually.`
        : `${res.reasoning || 'Split decided'} (line ${hexId})`
    };
  });
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

export const extractComponentEvidence = async (
  transcriptPart2: string
) => {
  const lines = transcriptPart2.split('\n');
  const numbered = lines.map((line, idx) => {
    const hex = (0x2000 + idx).toString(16).toUpperCase().slice(-4);
    return `0x${hex} ${line}`;
  }).join('\n');

  const res = await callJsonSchema<any>(
    [
      { role: 'user', content: COMPONENT_EVIDENCE_PROMPT },
      { role: 'user', content: `TRANSCRIPT PART 2 (hex-numbered):\n${numbered}` }
    ],
    "component_evidence_schema",
    componentEvidenceSchema,
    0.1
  );

  const idToIndex = (id: string) => {
    const match = id?.trim().toLowerCase();
    if (!match) return -1;
    return lines.findIndex((_, i) => {
      const hex = (0x2000 + i).toString(16).toUpperCase().slice(-4);
      return `0x${hex}`.toLowerCase() === match;
    });
  };

  const sliceRange = (startId: string, endId: string, pad: number) => {
    const startIdx = idToIndex(startId);
    const endIdx = idToIndex(endId);
    if (startIdx === -1 || endIdx === -1) return '';
    const s = Math.min(startIdx, endIdx);
    const e = Math.max(startIdx, endIdx);
    const ctxStart = Math.max(0, s - pad);
    const ctxEnd = Math.min(lines.length - 1, e + pad);
    const core = lines.slice(s, e + 1).join('\n');
    const before = lines.slice(ctxStart, s).join('\n');
    const after = lines.slice(e + 1, ctxEnd + 1).join('\n');
    const context = [before, core, after].filter(Boolean).join('\n');
    return { context, core };
  };

  return {
    customer: sliceRange(res.customerStart, res.customerEnd, 4),
    context: sliceRange(res.contextStart, res.contextEnd, 4),
    goal: sliceRange(res.goalStart, res.goalEnd, 4),
    barrier: sliceRange(res.barrierStart, res.barrierEnd, 4)
  };
};
