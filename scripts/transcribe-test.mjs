import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawn } from 'child_process';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import ffmpegPath from 'ffmpeg-static';

const cwd = process.cwd();
const envLocal = path.join(cwd, '.env.local');
const envDefault = path.join(cwd, '.env');
if (fs.existsSync(envLocal)) dotenv.config({ path: envLocal });
else dotenv.config({ path: envDefault });

const INPUT_PATH = process.env.INPUT_PATH
  ? path.resolve(process.cwd(), process.env.INPUT_PATH)
  : path.join(process.cwd(), 'audio_test', 'GMT20251008-171659_Recording.m4a');

const SEGMENT_SEC = Number(process.env.SEGMENT_SEC || 1200); // chunk duration target
const MAX_BYTES = 24 * 1024 * 1024; // safety buffer under 25MB limit
const MODEL = process.env.ASR_MODEL || 'gpt-4o-transcribe-diarize';
const CONCURRENCY = Math.max(1, Number(process.env.CONCURRENCY || 2));
const OUTPUT_PATH = process.env.OUTPUT_PATH
  ? path.resolve(process.cwd(), process.env.OUTPUT_PATH)
  : path.join(process.cwd(), 'audio_test', 'transcript.txt');

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const formatBytes = (bytes) => `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
const formatDuration = (ms) => `${(ms / 1000).toFixed(1)}s`;

const renderProgress = (done, total, label = 'Progress') => {
  const pct = total ? Math.round((done / total) * 100) : 0;
  const width = 24;
  const filled = Math.round((pct / 100) * width);
  const bar = `${'█'.repeat(filled)}${'░'.repeat(width - filled)}`;
  process.stdout.write(`\r${label}: [${bar}] ${pct}% (${done}/${total})`);
  if (done >= total) process.stdout.write('\n');
};

const runFfmpeg = (args, label) =>
  new Promise((resolve, reject) => {
    if (!ffmpegPath) return reject(new Error('ffmpeg-static not found for this platform.'));
    const proc = spawn(ffmpegPath, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = '';
    proc.stderr.on('data', (d) => (stderr += d.toString()));
    proc.on('error', reject);
    proc.on('close', (code) => {
      if (code === 0) return resolve();
      reject(new Error(`${label} failed (code ${code}): ${stderr.slice(0, 2000)}`));
    });
  });

const transcribeFile = async (filePath, idx, total) => {
  const started = Date.now();
  console.log(`Transcribing part ${idx + 1}/${total}: ${path.basename(filePath)} (${formatBytes(fs.statSync(filePath).size)})`);
  const stream = fs.createReadStream(filePath);
  const payload = {
    file: await OpenAI.toFile(stream, path.basename(filePath)),
    model: MODEL,
    response_format: MODEL.includes('diarize') ? 'diarized_json' : 'verbose_json',
    chunking_strategy: 'auto',
    language: 'en',
  };
  const tick = setInterval(() => {
    process.stdout.write(`\r  ... waiting on API (${formatDuration(Date.now() - started)})`);
  }, 15000);
  const result = await client.audio.transcriptions.create(payload);
  clearInterval(tick);
  process.stdout.write('\r');
  console.log(`  -> finished in ${formatDuration(Date.now() - started)}`);

  const hasSegments = Array.isArray(result?.segments) && result.segments.length > 0;
  const hasSpeakers = hasSegments && result.segments.some((seg) => seg?.speaker !== undefined && seg?.speaker !== null);

  let diarizedText = (result?.text || '').trim();
  if (hasSegments) {
    diarizedText = result.segments
      .map((seg) => {
        const label = hasSpeakers ? `Speaker ${seg.speaker ?? '?'}` : 'Speaker';
        return `${label}: ${seg.text?.trim() || ''}`.trim();
      })
      .filter(Boolean)
      .join('\n');
  }

  const snippet = diarizedText.slice(0, 200).replace(/\s+/g, ' ');
  console.log(`  -> segments: ${hasSegments ? result.segments.length : 0}, speaker labels present: ${hasSpeakers}`);
  console.log(`  -> text length: ${diarizedText.length}, snippet: "${snippet}"\n`);
  if (!hasSpeakers) {
    console.warn('  !! No speaker labels returned; the model may have fallen back to plain transcript.');
  }
  return diarizedText;
};

const prepareSegments = async () => {
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is not set.');
  if (!fs.existsSync(INPUT_PATH)) throw new Error(`File not found at ${INPUT_PATH}`);
  if (!ffmpegPath) throw new Error('ffmpeg-static binary not available for this platform.');

  const inputSize = fs.statSync(INPUT_PATH).size;
  console.log(`File: ${INPUT_PATH} (${formatBytes(inputSize)})`);

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'whisper-test-'));
  const segmentOnce = async (source, label) => {
    console.log(`Segmenting ${label} into ~${SEGMENT_SEC}s parts (keeping under ${formatBytes(MAX_BYTES)} each)...`);
    const pattern = path.join(tmpDir, 'segment-%03d.ogg');
    await runFfmpeg(['-y', '-i', source, '-f', 'segment', '-segment_time', `${SEGMENT_SEC}`, '-acodec', 'copy', pattern], 'segment');
    const files = fs
      .readdirSync(tmpDir)
      .filter((f) => f.startsWith('segment-') && f.endsWith('.ogg'))
      .map((f) => path.join(tmpDir, f))
      .filter((fullPath) => fs.statSync(fullPath).size > 0)
      .sort();
    return files;
  };

  let files = [];
  try {
    files = await segmentOnce(INPUT_PATH, 'original audio');
  } catch (err) {
    console.warn('Direct segmentation failed, will re-encode to ogg and retry:', err?.message || err);
    const compressedPath = path.join(tmpDir, 'compressed.ogg');
    console.log('Re-encoding to mono 64kbps @ 16kHz for stable segmentation...');
    await runFfmpeg(['-y', '-i', INPUT_PATH, '-ac', '1', '-b:a', '64k', '-ar', '16000', compressedPath], 'compress');
    files = await segmentOnce(compressedPath, 're-encoded audio');
  }

  if (!files.length) {
    console.warn('Segmentation produced no files; using input directly.');
    return { segments: [INPUT_PATH], tempDir: tmpDir };
  }
  files.forEach((f, i) => console.log(`  segment ${i + 1}: ${path.basename(f)} (${formatBytes(fs.statSync(f).size)})`));
  return { segments: files, tempDir: tmpDir };
};

const run = async () => {
  const { segments, tempDir } = await prepareSegments();
  const combined = new Array(segments.length);
  let done = 0;
  renderProgress(0, segments.length, 'Transcription');

  let nextIndex = 0;
  const worker = async () => {
    while (true) {
      const idx = nextIndex;
      nextIndex += 1;
      if (idx >= segments.length) return;
      const text = await transcribeFile(segments[idx], idx, segments.length);
      combined[idx] = segments.length > 1 ? `--- Segment ${idx + 1}/${segments.length} ---\n${text}` : text;
      done += 1;
      renderProgress(done, segments.length, 'Transcription');
    }
  };

  const workers = Array.from({ length: Math.min(CONCURRENCY, segments.length) }, () => worker());
  await Promise.all(workers);

  const finalText = combined.join('\n\n');
  console.log('\nCombined summary:');
  console.log(`Total length: ${finalText.length}`);
  console.log(`First 400 chars:\n${finalText.slice(0, 400).replace(/\s+/g, ' ')}\n`);

  try {
    fs.writeFileSync(OUTPUT_PATH, finalText, 'utf8');
    console.log(`Full transcript saved to ${OUTPUT_PATH}`);
  } catch (err) {
    console.warn(`Could not write transcript to ${OUTPUT_PATH}:`, err);
  }

  // optional cleanup
  try {
    fs.rmSync(tempDir, { recursive: true, force: true });
  } catch (err) {
    console.warn('Could not clean temp dir', err);
  }
};

run().catch((err) => {
  console.error('Transcription failed:', err?.response?.data || err);
  process.exit(1);
});
