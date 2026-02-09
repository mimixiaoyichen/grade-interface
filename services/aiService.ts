import OpenAI from "openai";
import { 
  AIAnalysisResponse, 
  BaselineStatement, 
  ComparisonResult, 
  TranscriptSplit,
  TranscriptionResult
} from '../types';
import type { SupportCheckItem } from '../types';
import { ANALYSIS_PROMPT } from '../prompts/analysis';
import { SPLIT_PROMPT } from '../prompts/split';
import { COMPARISON_PROMPT_TEXT } from '../prompts/comparison';
import BASELINE_PROMPT from '../prompts/baseline.md?raw';
import { COMPONENT_EVIDENCE_PROMPT } from '../prompts/componentEvidence';
import { BARRIER_SELECTOR_PROMPT } from '../prompts/barrierSelector';
import { uploadFileToBlob } from '../utils/blobUpload';
import { SUPPORT_CHECK_PROMPT } from '../prompts/supportCheck';

const MODEL_ID = 'gpt-4o';
const COMPONENT_LAYER_MODEL_ID = 'gpt-5.2';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  // Note: this runs in the browser; key is already exposed via Vite define
  dangerouslyAllowBrowser: true
});

type JsonSchema = Record<string, any>;
type LocaleOption = 'en' | 'zh';

const languageMessages = (locale: LocaleOption) => locale === 'zh'
  ? [{
      role: 'system' as const,
      content:
        '请用简体中文回答所有输出。使用符合中文习惯的短句，避免直译腔与堆砌定语。确保每条表述简洁流畅、自然可读。请使用自然、地道、符合母语者习惯的现代中文表达，句式以常见主谓结构为主，避免英文直译的长定语和悬空状语。风格偏书面但简洁；如为列表，保持语法结构一致、用词统一。'
    }]
  : [{ role: 'system' as const, content: 'Respond in English.' }];

const localeToLanguageCode = (locale: LocaleOption): string | undefined => {
  if (locale === 'zh') return 'zho'; // Mandarin Chinese (per API list)
  if (locale === 'en') return 'eng';
  return undefined;
};

const languageHint = (locale: LocaleOption) =>
  locale === 'zh'
    ? '\n\n请将所有输出内容（含要点、摘要和示例）用简体中文撰写，保持自然、地道、简洁。使用主谓结构，避免直译腔和长定语，可拆成短句。列表请统一语法和用词。'
    : '\n\nPlease respond in English.';

const extractMessageText = (content: any): string => {
  if (!content) return '';
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content.map((part) => (typeof part === 'string' ? part : (part?.text ?? ''))).join('');
  }
  if (typeof content === 'object' && 'text' in content) return (content as any).text;
  return '';
};

const callJsonSchemaWithModel = async <T>(
  modelId: string,
  messages: { role: 'system' | 'user'; content: string }[],
  schemaName: string,
  schema: JsonSchema,
  temperature = 0.2
): Promise<T> => {
  const response = await openai.chat.completions.create({
    model: modelId,
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

const callJsonSchema = async <T>(
  messages: { role: 'system' | 'user'; content: string }[],
  schemaName: string,
  schema: JsonSchema,
  temperature = 0.2
): Promise<T> => {
  return callJsonSchemaWithModel<T>(MODEL_ID, messages, schemaName, schema, temperature);
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

const barrierSelectorSchema: JsonSchema = {
  type: "object",
  properties: {
    SPECIFIC_BARRIERS: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 4 }
  },
  required: ["SPECIFIC_BARRIERS"],
  additionalProperties: false
};

const componentJudgeItemSchema: JsonSchema = {
  type: "object",
  properties: {
    needs_rewrite: { type: "boolean" },
    entity_issue: { type: "boolean" },
    confusion_issue: { type: "boolean" },
    redundancy_issue: { type: "boolean" },
    reason: { type: "string" }
  },
  required: ["needs_rewrite", "entity_issue", "confusion_issue", "redundancy_issue", "reason"],
  additionalProperties: false
};

const componentJudgeSchema: JsonSchema = {
  type: "object",
  properties: {
    solution: componentJudgeItemSchema,
    customer: componentJudgeItemSchema,
    context: componentJudgeItemSchema,
    goal: componentJudgeItemSchema,
    barrier: componentJudgeItemSchema
  },
  required: ["solution", "customer", "context", "goal", "barrier"],
  additionalProperties: false
};

const componentRewriteSchema: JsonSchema = {
  type: "object",
  properties: {
    revised_solution: { type: "string" },
    revised_customer: { type: "string" },
    revised_context: { type: "string" },
    revised_goal: { type: "string" },
    revised_barrier: { type: "string" },
    notes: { type: "string" }
  },
  required: ["revised_solution", "revised_customer", "revised_context", "revised_goal", "revised_barrier", "notes"],
  additionalProperties: false
};

type ComponentJudgeItem = {
  needs_rewrite: boolean;
  entity_issue: boolean;
  confusion_issue: boolean;
  redundancy_issue: boolean;
  reason: string;
};

type ComponentJudgeResult = {
  solution: ComponentJudgeItem;
  customer: ComponentJudgeItem;
  context: ComponentJudgeItem;
  goal: ComponentJudgeItem;
  barrier: ComponentJudgeItem;
};

type ComponentRewriteResult = {
  revised_solution: string;
  revised_customer: string;
  revised_context: string;
  revised_goal: string;
  revised_barrier: string;
  notes: string;
};

export type BaselineComponentLayerResult = {
  model: string;
  rewroteAny: boolean;
  judge: ComponentJudgeResult;
  notes: string;
  revisedBaseline: BaselineStatement;
};

const comparisonSchema: JsonSchema = {
  type: "object",
  properties: {
    rows: {
      type: "array",
      minItems: 5,
      maxItems: 5,
      items: {
        type: "object",
        properties: {
          component: { type: "string", enum: ["Solution", "Customer", "Context", "Goal", "Barrier"] },
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

const REQUIRED_COMPARISON_COMPONENTS = ['Solution', 'Customer', 'Context', 'Goal', 'Barrier'] as const;
type ComparisonComponent = typeof REQUIRED_COMPARISON_COMPONENTS[number];

const getBaselineComponentText = (baseline: BaselineStatement, component: ComparisonComponent) => {
  switch (component) {
    case 'Solution':
      return baseline.SOLUTION || '';
    case 'Customer':
      return baseline.CUSTOMER_SEGMENT || '';
    case 'Context':
      return baseline.LIFE_BUSINESS_CONTEXT || '';
    case 'Goal':
      return baseline.JOB_TO_BE_DONE || '';
    case 'Barrier':
      return (baseline.SPECIFIC_BARRIERS || []).join('; ');
    default:
      return '';
  }
};

const getMissingComparisonComponents = (rows: Array<{ component?: string }>) => {
  const present = new Set(rows.map((row) => row.component).filter(Boolean));
  return REQUIRED_COMPARISON_COMPONENTS.filter((component) => !present.has(component));
};

const normalizeComparisonRows = (rows: Array<any>, baseline: BaselineStatement) => {
  const seen = new Set<ComparisonComponent>();
  const normalized: Array<any> = [];

  for (const row of rows) {
    const component = row?.component as ComparisonComponent | undefined;
    if (!component || !REQUIRED_COMPARISON_COMPONENTS.includes(component)) {
      continue;
    }
    if (seen.has(component)) continue;
    seen.add(component);
    normalized.push(row);
  }

  for (const component of REQUIRED_COMPARISON_COMPONENTS) {
    if (seen.has(component)) continue;
    const baselineText = getBaselineComponentText(baseline, component);
    normalized.push({
      component,
      baselineText,
      transcriptModification: baselineText,
      type: 'Confirmation',
      transcriptEvidence: '',
      publicEvidence: '',
      publicEvidenceContext: '',
      isSupportedByPublic: false,
      publicSupport: 'Not found in public info'
    });
  }

  return normalized;
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

const supportCheckSchema: JsonSchema = {
  type: "object",
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          text: { type: "string" },
          type: { type: "string", enum: ["Omission", "Hallucination"] },
          isSupportedByPublic: { type: "boolean" },
          publicEvidence: { type: "string" },
          publicEvidenceContext: { type: "string" },
          publicSupport: { type: "string" }
        },
        required: ["id", "text", "type", "isSupportedByPublic", "publicEvidence", "publicEvidenceContext", "publicSupport"],
        additionalProperties: false
      }
    }
  },
  required: ["items"],
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

const downsampleToMonoWav = async (file: File, targetSampleRate = 16000): Promise<Blob> => {
  const arrayBuffer = await file.arrayBuffer();
  const audioCtx = new AudioContext();
  const decoded = await audioCtx.decodeAudioData(arrayBuffer);

  const offlineCtx = new OfflineAudioContext(1, Math.ceil(decoded.duration * targetSampleRate), targetSampleRate);
  const source = offlineCtx.createBufferSource();
  const monoBuffer = offlineCtx.createBuffer(1, decoded.length, decoded.sampleRate);

  // Mixdown to mono
  const tmp = new Float32Array(decoded.length);
  for (let ch = 0; ch < decoded.numberOfChannels; ch++) {
    decoded.copyFromChannel(tmp, ch);
    offlineCtx.createBuffer(1, decoded.length, decoded.sampleRate).copyToChannel(tmp, 0);
  }
  monoBuffer.copyToChannel(tmp, 0);
  source.buffer = monoBuffer;
  source.connect(offlineCtx.destination);
  source.start(0);
  const rendered = await offlineCtx.startRendering();
  const channel = rendered.getChannelData(0);

  // Encode to 16-bit PCM WAV
  const buffer = new ArrayBuffer(44 + channel.length * 2);
  const view = new DataView(buffer);
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + channel.length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM
  view.setUint16(20, 1, true); // linear PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, targetSampleRate, true);
  view.setUint32(28, targetSampleRate * 2, true); // byte rate (16-bit mono)
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeString(36, 'data');
  view.setUint32(40, channel.length * 2, true);
  let offset = 44;
  for (let i = 0; i < channel.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, channel[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Blob([buffer], { type: 'audio/wav' });
};

export const transcribeAudioWithDiarization = async (file: File, locale: LocaleOption = 'en'): Promise<TranscriptionResult> => {
  const isAudio = (f: File) => (f.type && f.type.startsWith('audio/')) || /\.(wav|mp3|m4a|aac|flac|ogg|oga)$/i.test(f.name || '');
  if (!isAudio(file)) {
    throw new Error('Please upload an audio file (wav, mp3, m4a, aac, flac, ogg).');
  }

  const toBase64 = (f: Blob) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(f);
    });

  let blob: Blob = file;
  try {
    blob = await downsampleToMonoWav(file, 16000);
  } catch (err) {
    console.warn('Client-side downsample failed; sending original file', err);
    blob = file;
  }

  let payload: any = {};
  const languageCode = localeToLanguageCode(locale);
  const sizeMb = blob.size / (1024 * 1024);
  if (sizeMb > 4) {
    const blobUrl = await uploadFileToBlob(file);
    payload = { fileUrl: blobUrl, fileName: (file as any).name || 'audio.wav', mimeType: file.type || 'audio/wav' };
  } else {
    const fileData = await toBase64(blob);
    payload = { fileData, fileName: (file as any).name || 'audio.wav' };
  }

  const resp = await fetch('/api/transcribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...payload,
      ...(languageCode ? { languageCode } : {})
    })
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
  let pageFetchWarning = '';

  if (looksLikeUrl) {
    const normalizedUrl = target.startsWith('http') ? target : `https://${target}`;
    try {
      const resp = await fetch(`/api/fetch?url=${encodeURIComponent(normalizedUrl)}`);
      if (!resp.ok) {
        const snippet = await resp.text().then((t) => t.slice(0, 200)).catch(() => '');
        pageFetchWarning = `Unable to reach ${normalizedUrl}. Please confirm the link is correct or reachable.`;
        sections.push(`[Page fetch failed: ${resp.status} ${resp.statusText}${snippet ? ` — ${snippet}` : ''}]`);
      } else {
        const data = await parseJsonSafe(resp);
        sections.push(`${data.summary}\n\n==========================================\n=== VERBATIM OFFICIAL SITE CONTENT (Cleaned) ===\n==========================================\n\n${data.cleaned}`);
        try {
          const host = new URL(normalizedUrl).hostname.replace(/^www\./, '');
          if (host) searchTerm = host;
        } catch {
          searchTerm = target;
        }
      }
    } catch (err: any) {
      pageFetchWarning = `Unable to reach ${normalizedUrl}. Please confirm the link is correct or reachable. (${err?.message || err})`;
      sections.push(`[Page fetch failed: ${err?.message || err}]`);
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

  const output = sections.join('\n\n').trim();
  if (pageFetchWarning && typeof window !== 'undefined') {
    window.alert(pageFetchWarning);
  }
  return output;
};

export const splitTranscript = async (fullTranscript: string, locale: LocaleOption = 'en'): Promise<TranscriptSplit> => {
  const lines = fullTranscript.split('\n');
  const numberedTranscript = lines.map((line, idx) => {
    const hex = (0x1000 + idx).toString(16).toUpperCase().slice(-4); // 4 hex digits
    return `0x${hex} ${line}`;
  }).join('\n');

  return callJsonSchema<any>(
    [
      ...languageMessages(locale),
      { role: 'system', content: SPLIT_PROMPT },
      { role: 'user', content: `FULL TRANSCRIPT (numbered):\n\n${numberedTranscript}${languageHint(locale)}` }
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
  founderInput: string,
  locale: LocaleOption = 'en'
): Promise<AIAnalysisResponse> => {
  return callJsonSchema<AIAnalysisResponse>(
    [
      ...languageMessages(locale),
      { role: 'system', content: ANALYSIS_PROMPT },
      { role: 'user', content: `FOUNDER'S PRIOR STATEMENT:\n${founderInput}\n\nPUBLIC CONTEXT (Truth Source):\n${publicInfo || "No public context provided."}\n\nTRANSCRIPT SEGMENT:\n${transcriptSegment}${languageHint(locale)}` }
    ],
    "analysis_schema",
    analysisSchema,
    0.2
  );
};

export const generateBaselineStatement = async (
  publicInfo: string,
  locale: LocaleOption = 'en'
): Promise<BaselineStatement> => {
  return callJsonSchema<BaselineStatement>(
    [
      ...languageMessages(locale),
      { role: 'system', content: BASELINE_PROMPT },
      { role: 'user', content: `SOURCE MATERIAL:\n${publicInfo}${languageHint(locale)}` }
    ],
    "baseline_schema",
    baselineSchema,
    0.2
  );
};

export const selectTopBarriers = async (
  baseline: BaselineStatement,
  publicInfo: string,
  locale: LocaleOption = 'en'
): Promise<string[]> => {
  const baselineStr = JSON.stringify(baseline, null, 2);
  const res = await callJsonSchema<{ SPECIFIC_BARRIERS: string[] }>(
    [
      ...languageMessages(locale),
      { role: 'system', content: BARRIER_SELECTOR_PROMPT },
      { role: 'user', content: `BASELINE STATEMENT:\n${baselineStr}\n\nSOURCE MATERIAL:\n${publicInfo || "No public context provided."}${languageHint(locale)}` }
    ],
    "barrier_selector_schema",
    barrierSelectorSchema,
    0.2
  );
  return res.SPECIFIC_BARRIERS;
};

const cleanText = (value: unknown) => (value === null || value === undefined ? '' : String(value).trim());

const baselineToComponents = (baseline: BaselineStatement) => ({
  solution: cleanText(baseline.SOLUTION),
  customer: cleanText(baseline.CUSTOMER_SEGMENT),
  context: cleanText(baseline.LIFE_BUSINESS_CONTEXT),
  goal: cleanText(baseline.JOB_TO_BE_DONE),
  barrier: cleanText((baseline.SPECIFIC_BARRIERS || []).join('; '))
});

const splitBarrierText = (barrierText: string): string[] => {
  const raw = cleanText(barrierText);
  if (!raw) return [];
  const parts = raw
    .split(/[;\n]+/)
    .map((p) => cleanText(p))
    .filter(Boolean);
  const deduped: string[] = [];
  for (const part of parts) {
    if (!deduped.includes(part)) deduped.push(part);
  }
  return deduped;
};

const anyComponentFlagged = (judge: ComponentJudgeResult) =>
  Boolean(
    judge.solution?.needs_rewrite ||
    judge.customer?.needs_rewrite ||
    judge.context?.needs_rewrite ||
    judge.goal?.needs_rewrite ||
    judge.barrier?.needs_rewrite
  );

const applyNonFlaggedCopySafeguard = (
  original: ReturnType<typeof baselineToComponents>,
  judge: ComponentJudgeResult,
  revised: ComponentRewriteResult
): ComponentRewriteResult => {
  const output: ComponentRewriteResult = { ...revised };
  if (!judge.solution.needs_rewrite) output.revised_solution = original.solution;
  if (!judge.customer.needs_rewrite) output.revised_customer = original.customer;
  if (!judge.context.needs_rewrite) output.revised_context = original.context;
  if (!judge.goal.needs_rewrite) output.revised_goal = original.goal;
  if (!judge.barrier.needs_rewrite) output.revised_barrier = original.barrier;
  return output;
};

const COMPONENT_JUDGE_PROMPT = [
  'You are a strict component-level QA judge for startup statements.',
  'For each component (solution, customer, context, goal, barrier), set needs_rewrite=true ONLY if there is a real issue.',
  'Allowed issue types: entity_issue, confusion_issue, redundancy_issue.',
  'Flag needs_rewrite=true if statement uses vague anaphora like "this/that/these/those/it" without explicit referent in same sentence.',
  'entity_issue=true only when startup/company/product/service/feature/trademark names are copied from source.',
  'Generic standards/regulations (HIPAA, GDPR, SOC 2, ISO, FDA, PCI) are NOT entity issues.',
  'confusion_issue=true when a component semantically belongs to another component (e.g., goal phrased as context).',
  'redundancy_issue=true when this component substantially repeats another component meaning.',
  'CRITICAL: style/tone/grammar tightening alone is NOT an issue.',
  'If no true issue exists, set all issue flags false and needs_rewrite=false.',
  'Return JSON only.'
].join(' ');

const COMPONENT_REWRITE_PROMPT = [
  'You are a strict minimal editor.',
  'You receive original statements and per-component issue flags.',
  'Rewrite ONLY components where needs_rewrite=true.',
  'For components where needs_rewrite=false, copy original text EXACTLY, byte-for-byte.',
  'Do NOT make style or tone polishing edits.',
  'Do not use vague references like "this/that/these/those/it".',
  'Hard constraint: rewritten output must not contain the tokens this, that, these, those, or it.',
  'When rewriting, fix only flagged issue types (entity/confusion/redundancy) and preserve core meaning.',
  'Keep solution/customer/context/goal concise single statements; barrier can be semicolon-separated concrete obstacles.',
  'Return JSON only.'
].join(' ');

export const applyGpt52ComponentLayer = async (
  baseline: BaselineStatement,
  publicInfo: string,
  locale: LocaleOption = 'en'
): Promise<BaselineComponentLayerResult> => {
  const original = baselineToComponents(baseline);
  const sourceExcerpt = cleanText(publicInfo).slice(0, 10000);
  const judge = await callJsonSchemaWithModel<ComponentJudgeResult>(
    COMPONENT_LAYER_MODEL_ID,
    [
      ...languageMessages(locale),
      { role: 'system', content: COMPONENT_JUDGE_PROMPT },
      {
        role: 'user',
        content: JSON.stringify({
          source_material_excerpt: sourceExcerpt,
          statements: original
        })
      }
    ],
    'component_gated_judge_schema',
    componentJudgeSchema,
    0
  );

  if (!anyComponentFlagged(judge)) {
    return {
      model: COMPONENT_LAYER_MODEL_ID,
      rewroteAny: false,
      judge,
      notes: 'No rewrite needed (no flagged issues).',
      revisedBaseline: baseline
    };
  }

  const rewritten = await callJsonSchemaWithModel<ComponentRewriteResult>(
    COMPONENT_LAYER_MODEL_ID,
    [
      ...languageMessages(locale),
      { role: 'system', content: COMPONENT_REWRITE_PROMPT },
      {
        role: 'user',
        content: JSON.stringify({
          source_material_excerpt: sourceExcerpt,
          original_statements: original,
          component_flags: judge
        })
      }
    ],
    'component_gated_rewrite_schema',
    componentRewriteSchema,
    0.1
  );

  const safe = applyNonFlaggedCopySafeguard(original, judge, rewritten);
  const revisedBarriers = splitBarrierText(safe.revised_barrier);
  const fallbackBarriers = baseline.SPECIFIC_BARRIERS || [];

  const revisedBaseline: BaselineStatement = {
    SOLUTION: cleanText(safe.revised_solution),
    CUSTOMER_SEGMENT: cleanText(safe.revised_customer),
    LIFE_BUSINESS_CONTEXT: cleanText(safe.revised_context),
    JOB_TO_BE_DONE: cleanText(safe.revised_goal),
    SPECIFIC_BARRIERS: (revisedBarriers.length ? revisedBarriers : fallbackBarriers).slice(0, 4)
  };

  return {
    model: COMPONENT_LAYER_MODEL_ID,
    rewroteAny: true,
    judge,
    notes: cleanText(safe.notes),
    revisedBaseline
  };
};

export const generateComparison = async (
  baseline: BaselineStatement,
  transcriptPart2: string,
  publicInfo: string,
  locale: LocaleOption = 'en'
): Promise<ComparisonResult> => {
  const baselineStr = JSON.stringify(baseline, null, 2);
  const buildMessages = (extraInstruction?: string) => ([
    ...languageMessages(locale),
    {
      role: 'system',
      content: extraInstruction
        ? `${COMPARISON_PROMPT_TEXT}\n\n${extraInstruction}`
        : COMPARISON_PROMPT_TEXT
    },
    { role: 'user', content: `BASELINE STATEMENT:\n${baselineStr}\n\nPUBLIC INFO:\n${publicInfo}\n\nTRANSCRIPT PART 2 (FEEDBACK):\n${transcriptPart2}${languageHint(locale)}` }
  ]);

  const runOnce = (extraInstruction?: string) =>
    callJsonSchema<ComparisonResult>(
      buildMessages(extraInstruction),
      "comparison_schema",
      comparisonSchema,
      0.1
    );

  const firstAttempt = await runOnce();
  const missingFirst = getMissingComparisonComponents(firstAttempt.rows || []);

  if (missingFirst.length === 0 && (firstAttempt.rows?.length === 5)) {
    return firstAttempt;
  }

  try {
    const retry = await runOnce(
      `You must return exactly one row for each component: Solution, Customer, Context, Goal, Barrier. ` +
      `The previous response was missing: ${missingFirst.join(', ') || 'unknown components'}. ` +
      `Return a complete corrected array with all required fields present.`
    );
    return { rows: normalizeComparisonRows(retry.rows || [], baseline) };
  } catch (err) {
    return { rows: normalizeComparisonRows(firstAttempt.rows || [], baseline) };
  }
};

export const checkPublicSupportForItems = async (
  items: SupportCheckItem[],
  publicInfo: string,
  locale: LocaleOption = 'en'
): Promise<SupportCheckItem[]> => {
  const payload = items.map((item, idx) => `${idx + 1}. [${item.type}] id=${item.id} :: ${item.text}`).join('\n');
  const res = await callJsonSchema<{ items: SupportCheckItem[] }>(
    [
      ...languageMessages(locale),
      { role: 'system', content: SUPPORT_CHECK_PROMPT },
      { role: 'user', content: `PUBLIC INFO (truth source):\n${publicInfo || "No public info provided."}\n\nITEMS TO VERIFY:\n${payload}${languageHint(locale)}` }
    ],
    "support_check_schema",
    supportCheckSchema,
    0.1
  );
  return res.items || [];
};

export const extractComponentEvidence = async (
  transcriptPart2: string,
  locale: LocaleOption = 'en'
) => {
  const lines = transcriptPart2.split('\n');
  const numbered = lines.map((line, idx) => {
    const hex = (0x2000 + idx).toString(16).toUpperCase().slice(-4);
    return `0x${hex} ${line}`;
  }).join('\n');

  const res = await callJsonSchema<any>(
    [
      ...languageMessages(locale),
      { role: 'system', content: COMPONENT_EVIDENCE_PROMPT },
      { role: 'user', content: `TRANSCRIPT PART 2 (hex-numbered):\n${numbered}${languageHint(locale)}` }
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
