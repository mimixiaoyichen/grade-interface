import {
  AIAnalysisResponse,
  BaselineStatement,
  ComparisonResult,
  TranscriptSplit,
  TranscriptionResult
} from '../types';
import type { SupportCheckItem } from '../types';
import { uploadFileToBlob } from '../utils/blobUpload';
import { fetchWithTimeout } from '../utils/timeout';

const TRANSCRIPTION_TIMEOUT_MS = 3 * 60 * 1000;

type LocaleOption = 'en' | 'zh';

const localeToLanguageCode = (locale: LocaleOption): string | undefined => {
  if (locale === 'zh') return 'zho';
  if (locale === 'en') return 'eng';
  return undefined;
};

const apiFetch = async (path: string, body: object): Promise<any> => {
  const resp = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(data?.error || `Request to ${path} failed: ${resp.statusText}`);
  return data;
};

const downsampleToMonoWav = async (file: File, targetSampleRate = 16000): Promise<Blob> => {
  const arrayBuffer = await file.arrayBuffer();
  const audioCtx = new AudioContext();
  const decoded = await audioCtx.decodeAudioData(arrayBuffer);

  const offlineCtx = new OfflineAudioContext(1, Math.ceil(decoded.duration * targetSampleRate), targetSampleRate);
  const source = offlineCtx.createBufferSource();
  const monoBuffer = offlineCtx.createBuffer(1, decoded.length, decoded.sampleRate);

  const tmp = new Float32Array(decoded.length);
  for (let ch = 0; ch < decoded.numberOfChannels; ch++) {
    const channel = new Float32Array(decoded.length);
    decoded.copyFromChannel(channel, ch);
    for (let i = 0; i < channel.length; i++) {
      tmp[i] += channel[i] / decoded.numberOfChannels;
    }
  }
  monoBuffer.copyToChannel(tmp, 0);
  source.buffer = monoBuffer;
  source.connect(offlineCtx.destination);
  source.start(0);
  const rendered = await offlineCtx.startRendering();
  const channel = rendered.getChannelData(0);

  const buffer = new ArrayBuffer(44 + channel.length * 2);
  const view = new DataView(buffer);
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + channel.length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, targetSampleRate, true);
  view.setUint32(28, targetSampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
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
  let uploadedBlobUrl: string | null = null;
  const languageCode = localeToLanguageCode(locale);
  const sizeMb = blob.size / (1024 * 1024);
  if (sizeMb > 4) {
    uploadedBlobUrl = await uploadFileToBlob(file);
    payload = { fileUrl: uploadedBlobUrl, fileName: (file as any).name || 'audio.wav', mimeType: file.type || 'audio/wav' };
  } else {
    const fileData = await toBase64(blob);
    payload = { fileData, fileName: (file as any).name || 'audio.wav' };
  }

  const resp = await fetchWithTimeout(
    '/api/transcribe',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        ...(languageCode ? { languageCode } : {})
      })
    },
    TRANSCRIPTION_TIMEOUT_MS,
    'Transcription timed out after 3 minutes. Try a shorter recording or split the audio into smaller files.'
  );

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

export const fetchPublicInfoFromUrl = async (url: string): Promise<string> => {
  const target = url.trim();
  if (!target) return "No URL provided.";

  const looksLikeUrl = /^https?:\/\//i.test(target) || /^[\w-]+\.[\w.-]+/.test(target);

  const parseJsonSafe = async (resp: Response) => {
    const contentType = resp.headers.get('content-type') || '';
    const text = await resp.text();
    if (contentType.includes('application/json')) {
      try { return JSON.parse(text); } catch {
        throw new Error(`Response claimed JSON but could not parse. Status ${resp.status}.`);
      }
    }
    const snippet = text.slice(0, 200);
    if (snippet.includes('<!DOCTYPE html')) {
      throw new Error(`Unexpected HTML from API. Status ${resp.status}.`);
    }
    throw new Error(`Unexpected response (not JSON). Status ${resp.status}.`);
  };

  const formatSearchResults = (data: any, query: string) => {
    if (data.error) throw new Error(data.error);
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
        } catch { searchTerm = target; }
      }
    } catch (err: any) {
      pageFetchWarning = `Unable to reach ${normalizedUrl}. Please confirm the link is correct or reachable. (${err?.message || err})`;
      sections.push(`[Page fetch failed: ${err?.message || err}]`);
    }
  }

  if (searchTerm) {
    try {
      const resp = await fetch(`/api/search?q=${encodeURIComponent(searchTerm)}`);
      if (!resp.ok) throw new Error(`Failed to search: ${resp.status} ${resp.statusText}`);
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
  return apiFetch('/api/split', { fullTranscript, locale });
};

export const analyzeSegment = async (
  transcriptSegment: string,
  publicInfo: string,
  founderInput: string,
  locale: LocaleOption = 'en'
): Promise<AIAnalysisResponse> => {
  return apiFetch('/api/analyze', { transcriptSegment, publicInfo, founderInput, locale });
};

export const generateBaselineStatement = async (
  publicInfo: string,
  locale: LocaleOption = 'en'
): Promise<BaselineStatement> => {
  return apiFetch('/api/extract', { publicInfo, locale });
};

export const selectTopBarriers = async (
  baseline: BaselineStatement,
  publicInfo: string,
  locale: LocaleOption = 'en'
): Promise<string[]> => {
  const data = await apiFetch('/api/barriers', { baseline, publicInfo, locale });
  return data.SPECIFIC_BARRIERS;
};

export type BaselineComponentLayerResult = {
  model: string;
  rewroteAny: boolean;
  judge: any;
  notes: string;
  revisedBaseline: BaselineStatement;
};

export const applyGpt52ComponentLayer = async (
  baseline: BaselineStatement,
  publicInfo: string,
  locale: LocaleOption = 'en'
): Promise<BaselineComponentLayerResult> => {
  return apiFetch('/api/qa-check', { baseline, publicInfo, locale });
};

export const generateComparison = async (
  baseline: BaselineStatement,
  transcriptPart2: string,
  publicInfo: string,
  locale: LocaleOption = 'en'
): Promise<ComparisonResult> => {
  return apiFetch('/api/compare', { baseline, transcriptPart2, publicInfo, locale });
};

export const checkPublicSupportForItems = async (
  items: SupportCheckItem[],
  publicInfo: string,
  locale: LocaleOption = 'en'
): Promise<SupportCheckItem[]> => {
  const data = await apiFetch('/api/support-check', { items, publicInfo, locale });
  return data.items;
};

export const extractComponentEvidence = async (
  transcriptPart2: string,
  locale: LocaleOption = 'en'
) => {
  return apiFetch('/api/evidence', { transcriptPart2, locale });
};
