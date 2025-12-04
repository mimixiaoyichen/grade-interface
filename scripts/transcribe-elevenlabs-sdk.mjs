import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

const cwd = process.cwd();
const envLocal = path.join(cwd, '.env.local');
const envDefault = path.join(cwd, '.env');
if (fs.existsSync(envLocal)) dotenv.config({ path: envLocal });
else dotenv.config({ path: envDefault });

const API_KEY = process.env.ELEVENLABS_API_KEY;
const INPUT_PATH = process.env.INPUT_PATH
  ? path.resolve(cwd, process.env.INPUT_PATH)
  : path.join(cwd, 'audio_test', 'GMT20251008-171659_Recording.m4a');
const MODEL_ID = process.env.ELEVENLABS_MODEL || 'scribe_v1';
const LANGUAGE_CODE = process.env.LANGUAGE_CODE || 'eng'; // per docs
const DIARIZE = 'true'; // default true
const TAG_AUDIO_EVENTS = 'true'; // default true
const OUTPUT_PATH = process.env.OUTPUT_PATH
  ? path.resolve(cwd, process.env.OUTPUT_PATH)
  : path.join(cwd, 'audio_test', 'transcript-elevenlabs-sdk.txt');

const formatTs = (seconds) => {
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

const buildDiarized = (result) => {
  const words = Array.isArray(result?.words) ? result.words : [];
  if (!words.length) return result?.text || '';
  let out = [];
  const speakerFor = (w) => w?.speaker_id ?? w?.speaker ?? w?.speakerId ?? '?';
  let currentSpeaker = speakerFor(words[0]) ?? 'Speaker';
  let buffer = [];
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

if (!API_KEY) {
  console.error('ELEVENLABS_API_KEY is not set.');
  process.exit(1);
}

if (!fs.existsSync(INPUT_PATH)) {
  console.error(`Input file not found: ${INPUT_PATH}`);
  process.exit(1);
}

const client = new ElevenLabsClient({ apiKey: API_KEY });

const run = async () => {
  try {
    const sizeMb = (fs.statSync(INPUT_PATH).size / (1024 * 1024)).toFixed(2);
    console.log(`Uploading ${path.basename(INPUT_PATH)} (${sizeMb} MB) via SDK...`);

    const buffer = fs.readFileSync(INPUT_PATH);
    const blob = new Blob([buffer], { type: 'audio/m4a' });

    const transcription = await client.speechToText.convert({
      file: blob,
      modelId: MODEL_ID,
      diarize: DIARIZE,
      tagAudioEvents: TAG_AUDIO_EVENTS,
      languageCode: LANGUAGE_CODE,
    });

    const hasWords = Array.isArray(transcription?.words);
    const speakers = hasWords
      ? new Set(
          transcription.words
            .map((w) => w?.speaker_id ?? w?.speaker ?? w?.speakerId)
            .filter((v) => v !== undefined && v !== null)
        ).size
      : 0;

    const diarizedText = buildDiarized(transcription);

    console.log('--- Transcription complete (SDK) ---');
    console.log(`Model: ${MODEL_ID}, diarization: ${DIARIZE ? 'on' : 'off'}, language: ${LANGUAGE_CODE}`);
    console.log(`Speakers detected (word-level): ${speakers}`);
    console.log(`Transcript length: ${diarizedText.length}`);
    console.log(`Preview:\n${diarizedText.slice(0, 400)}`);

    try {
      fs.writeFileSync(OUTPUT_PATH, diarizedText, 'utf8');
      console.log(`Full transcript saved to ${OUTPUT_PATH}`);
    } catch (err) {
      console.warn(`Could not write transcript to ${OUTPUT_PATH}:`, err);
    }
  } catch (err) {
    console.error('Transcription failed:', err?.message || err);
    process.exit(1);
  }
};

run();
