import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import dotenv from 'dotenv';
import ffmpegPath from 'ffmpeg-static';

const cwd = process.cwd();
const envLocal = path.join(cwd, '.env.local');
const envDefault = path.join(cwd, '.env');
if (fs.existsSync(envLocal)) dotenv.config({ path: envLocal });
else if (fs.existsSync(envDefault)) dotenv.config({ path: envDefault });

const INPUT_PATH = process.env.INPUT_PATH
  ? path.resolve(cwd, process.env.INPUT_PATH)
  : path.join(cwd, 'audio_test', 'GMT20251008-171659_Recording.m4a');
const OUTPUT_DIR = process.env.OUTPUT_DIR ? path.resolve(cwd, process.env.OUTPUT_DIR) : path.dirname(INPUT_PATH);
const MAX_MB = Number(process.env.MAX_MB || 4.5);
const SAMPLE_RATE = process.env.SAMPLE_RATE || '16000';
const BITRATES = (process.env.BITRATES || '20k,18k,16k,14k')
  .split(',')
  .map((b) => b.trim())
  .filter(Boolean);
const SEGMENT_TIME = Number(process.env.SEGMENT_TIME || 600); // seconds
const SEGMENT_OVERLAP = Number(process.env.SEGMENT_OVERLAP || 1); // seconds

const sizeMb = (p) => fs.statSync(p).size / (1024 * 1024);

const run = (cmd, args) =>
  new Promise((resolve, reject) => {
    const ps = spawn(cmd, args, { stdio: 'inherit' });
    ps.on('error', reject);
    ps.on('exit', (code) => {
      if (code === 0) return resolve();
      reject(new Error(`${cmd} ${args.join(' ')} failed with code ${code}`));
    });
  });

const compress = async (input, bitrate, outPath) => {
  const args = ['-y', '-i', input, '-ac', '1', '-ar', SAMPLE_RATE, '-c:a', 'libopus', '-b:a', bitrate, outPath];
  await run(ffmpegPath, args);
  return outPath;
};

const segment = async (input, bitrate, baseName) => {
  // Clean up any old segments for the same base
  fs.readdirSync(OUTPUT_DIR)
    .filter((f) => f.startsWith(`${baseName}_seg_`) && f.endsWith('.ogg'))
    .forEach((f) => fs.rmSync(path.join(OUTPUT_DIR, f)));

  const pattern = path.join(OUTPUT_DIR, `${baseName}_seg_%03d.ogg`);
  const args = [
    '-y',
    '-i',
    input,
    '-f',
    'segment',
    '-segment_time',
    String(SEGMENT_TIME),
    '-segment_overlap',
    String(SEGMENT_OVERLAP),
    '-ac',
    '1',
    '-ar',
    SAMPLE_RATE,
    '-c:a',
    'libopus',
    '-b:a',
    bitrate,
    pattern,
  ];
  await run(ffmpegPath, args);
  return fs
    .readdirSync(OUTPUT_DIR)
    .filter((f) => f.startsWith(`${baseName}_seg_`) && f.endsWith('.ogg'))
    .map((f) => path.join(OUTPUT_DIR, f))
    .sort();
};

const main = async () => {
  if (!fs.existsSync(INPUT_PATH)) {
    console.error(`Input file not found: ${INPUT_PATH}`);
    process.exit(1);
  }

  if (!ffmpegPath) {
    console.error('ffmpeg-static not found. Install it or set FFMPEG_PATH.');
    process.exit(1);
  }

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const { name: baseName } = path.parse(INPUT_PATH);

  console.log(`Input: ${INPUT_PATH}`);
  console.log(`Max size: ${MAX_MB} MB`);
  console.log(`Bitrate ladder: ${BITRATES.join(', ')}`);

  let chosen = '';
  let lastOut = '';

  for (const br of BITRATES) {
    const outPath = path.join(OUTPUT_DIR, `${baseName}_${br}.ogg`);
    console.log(`Compressing at ${br}...`);
    await compress(INPUT_PATH, br, outPath);
    const mb = sizeMb(outPath);
    console.log(`  -> ${mb.toFixed(2)} MB`);
    lastOut = outPath;
    if (mb <= MAX_MB) {
      chosen = outPath;
      console.log(`✅ Within limit at ${br}: ${outPath}`);
      break;
    }
  }

  if (chosen) {
    return;
  }

  const lowest = BITRATES.at(-1) || '14k';
  console.warn(
    `Still above ${MAX_MB} MB after trying ${BITRATES.join(', ')}. Chunking at ${lowest} with ${SEGMENT_TIME}s segments...`
  );

  const segments = await segment(lastOut, lowest, baseName);
  if (!segments.length) {
    console.error('Chunking failed or produced no segments.');
    process.exit(1);
  }

  console.log('Produced segments (speaker IDs may reset per chunk):');
  segments.forEach((p) => {
    console.log(` - ${p} (${sizeMb(p).toFixed(2)} MB)`);
  });
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
