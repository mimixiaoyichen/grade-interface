import type { VercelRequest, VercelResponse } from '@vercel/node';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

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

const client = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY || '',
});

const parseDataUrl = (raw: string) => {
  const match = raw.match(/^data:.*?;base64,(.*)$/);
  return match ? match[1] : raw;
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.ELEVENLABS_API_KEY) {
    return res.status(500).json({ error: 'ELEVENLABS_API_KEY is missing on the server.' });
  }

  try {
    const { fileData, fileName = 'audio.webm', modelId = MODEL_ID } = req.body || {};
    if (!fileData || typeof fileData !== 'string') {
      return res.status(400).json({ error: 'fileData (base64 string or data URL) is required.' });
    }

    const b64 = parseDataUrl(fileData);
    const buffer = Buffer.from(b64, 'base64');
    if (!buffer.length) return res.status(400).json({ error: 'Decoded audio is empty.' });

    const blob = new Blob([buffer], { type: 'audio/m4a' });

    const response: any = await client.speechToText.convert({
      file: blob,
      modelId,
      diarize: DIARIZE,
      tagAudioEvents: TAG_AUDIO_EVENTS,
      languageCode: LANGUAGE_CODE,
    });

    const diarizedText = buildDiarized(response);
    const speakers = Array.isArray(response?.words)
      ? new Set(
          response.words
            .map((w: any) => w?.speaker_id ?? w?.speaker ?? w?.speakerId)
            .filter((v: any) => v !== undefined && v !== null)
        ).size
      : 0;

    return res.status(200).json({
      text: response?.text || diarizedText,
      diarizedText,
      speakers,
      words: response?.words || [],
      modelUsed: modelId,
      fileName,
    });
  } catch (err: any) {
    console.error('Transcribe API error:', err);
    return res.status(500).json({ error: err?.message || 'Internal error' });
  }
}
