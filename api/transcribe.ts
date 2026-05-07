import type { VercelRequest, VercelResponse } from '@vercel/node';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { del } from '@vercel/blob';

const cwd = process.cwd();
const envLocal = path.join(cwd, '.env.local');
const envDefault = path.join(cwd, '.env');
if (fs.existsSync(envLocal)) dotenv.config({ path: envLocal });
else dotenv.config({ path: envDefault });

const MODEL_ID = process.env.ELEVENLABS_MODEL || 'scribe_v2';
const LANGUAGE_CODE = process.env.LANGUAGE_CODE || 'eng';
const DIARIZE = process.env.DIARIZATION !== 'false';
const TAG_AUDIO_EVENTS = process.env.TAG_AUDIO_EVENTS !== 'false';
const DEFAULT_OUTPUT = 'Speaker transcript not available.';
const MAX_MB = Number(process.env.MAX_AUDIO_MB || 4.5);
const BLOB_CLEANUP_TIMEOUT_MS = 5 * 1000;

const client = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY || '',
});

const parseDataUrl = (raw: string) => {
  const match = raw.match(/^data:.*?;base64,(.*)$/);
  return match ? match[1] : raw;
};

const sizeMb = (buf: Buffer | string) => {
  const len = typeof buf === 'string' ? fs.statSync(buf).size : buf.length;
  return len / (1024 * 1024);
};

const formatTs = (seconds: any) => {
  if (seconds === undefined || seconds === null || Number.isNaN(Number(seconds))) return '';
  const total = Number(seconds);
  const m = Math.floor(total / 60);
  const s = Math.floor(total % 60)
    .toString()
    .padStart(2, '0');
  const ms = Math.floor((total * 1000) % 1000)
    .toString()
    .padStart(3, '0');
  return `${m}:${s}.${ms}`;
};

const buildDiarized = (result: any) => {
  const words = Array.isArray(result?.words) ? result.words : [];
  if (!words.length) return result?.text || DEFAULT_OUTPUT;

  const speakerFor = (w: any) => w?.speaker_id ?? w?.speaker ?? w?.speakerId ?? '?';
  let out: string[] = [];
  let currentSpeaker = speakerFor(words[0]) ?? 'Speaker';
  let buffer: string[] = [];
  let segStart = words[0]?.start ?? words[0]?.ts ?? 0;
  let segEnd = words[0]?.end ?? words[0]?.te ?? segStart;

  const flush = () => {
    if (buffer.length) {
      const startStr = formatTs(segStart);
      const endStr = formatTs(segEnd);
      const timing = startStr || endStr ? ` [${startStr || '?:??'}-${endStr || '?:??'}]` : '';
      out.push(`Speaker ${currentSpeaker}${timing}: ${buffer.join('').trim()}`);
      buffer = [];
    }
  };

  for (const w of words) {
    const speaker = speakerFor(w) ?? currentSpeaker;
    if (speaker !== currentSpeaker) {
      flush();
      currentSpeaker = speaker;
      segStart = w?.start ?? w?.ts ?? segStart;
    }
    segEnd = w?.end ?? w?.te ?? segEnd;
    if (w?.type === 'word' || w?.type === 'audio_event') {
      buffer.push(w.text || '');
    } else if (w?.type === 'spacing') {
      buffer.push(' ');
    }
  }
  flush();
  return out.join('\n');
};

const guessMime = (name: string) => {
  const lower = (name || '').toLowerCase();
  if (lower.endsWith('.wav')) return 'audio/wav';
  if (lower.endsWith('.mp3')) return 'audio/mpeg';
  if (lower.endsWith('.m4a') || lower.endsWith('.aac')) return 'audio/mp4';
  if (lower.endsWith('.webm')) return 'audio/webm';
  if (lower.endsWith('.ogg') || lower.endsWith('.opus')) return 'audio/ogg';
  return 'audio/ogg';
};

const transcribeBuffer = async (buffer: Buffer, fileName: string, modelId: string, languageCode: string, mimeType?: string) => {
  const audioBytes = new Uint8Array(buffer.length);
  audioBytes.set(buffer);
  const blob = new Blob([audioBytes.buffer], { type: mimeType || guessMime(fileName) });

  const response: any = await client.speechToText.convert({
    file: blob,
    modelId,
    diarize: DIARIZE,
    tagAudioEvents: TAG_AUDIO_EVENTS,
    languageCode,
  });

  const diarizedText = buildDiarized(response);
  const speakers = Array.isArray(response?.words)
    ? new Set(
        response.words
          .map((w: any) => w?.speaker_id ?? w?.speaker ?? w?.speakerId)
          .filter((v: any) => v !== undefined && v !== null)
      ).size
    : 0;

  return {
    text: response?.text || diarizedText,
    diarizedText,
    speakers,
    words: response?.words || [],
    modelUsed: modelId,
    fileName,
  };
};

const deleteUploadedBlob = async (fileUrl?: string | null) => {
  if (!fileUrl) return;
  const token = process.env.BLOB_READ_WRITE_TOKEN || process.env.VITE_BLOB_READ_WRITE_TOKEN;
  if (!token) {
    console.warn('Skipping uploaded audio blob cleanup: BLOB_READ_WRITE_TOKEN is missing.');
    return;
  }

  try {
    await Promise.race([
      del(fileUrl, { token }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Blob cleanup timed out.')), BLOB_CLEANUP_TIMEOUT_MS)),
    ]);
  } catch (err: any) {
    console.warn('Failed to clean up uploaded audio blob:', err?.message || err);
  }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.ELEVENLABS_API_KEY) {
    return res.status(500).json({ error: 'ELEVENLABS_API_KEY is missing on the server.' });
  }

  let uploadedFileUrl: string | null = null;
  try {
    const { fileData, fileUrl, fileName = 'audio.webm', modelId = MODEL_ID, languageCode, mimeType } = req.body || {};

    let buffer: Buffer | null = null;

    if (fileUrl && typeof fileUrl === 'string') {
      uploadedFileUrl = fileUrl;
      const resp = await fetch(fileUrl);
      if (!resp.ok) return res.status(400).json({ error: `Failed to fetch blob: ${resp.status}` });
      const arr = await resp.arrayBuffer();
      buffer = Buffer.from(arr);
    } else if (fileData && typeof fileData === 'string') {
      const b64 = parseDataUrl(fileData);
      buffer = Buffer.from(b64, 'base64');
    } else {
      return res.status(400).json({ error: 'Provide either fileUrl (preferred) or fileData (base64/data URL).' });
    }

    if (!buffer.length) return res.status(400).json({ error: 'Decoded audio is empty.' });

    // Send as-is (no server-side compression or size cap)
    const result = await transcribeBuffer(
      buffer,
      fileName,
      modelId,
      languageCode || LANGUAGE_CODE,
      mimeType || guessMime(fileName)
    );
    return res.status(200).json(result);
  } catch (err: any) {
    console.error('Transcribe API error:', err);
    return res.status(500).json({ error: err?.message || 'Internal error' });
  } finally {
    await deleteUploadedBlob(uploadedFileUrl);
  }
}
