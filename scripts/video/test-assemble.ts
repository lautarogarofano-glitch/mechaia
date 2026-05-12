#!/usr/bin/env tsx
/**
 * test-assemble.ts
 * Re-ensambla un video desde un tmp/ existente, sin tocar las APIs.
 * Uso: npx tsx scripts/video/test-assemble.ts <tmpDir> <scriptName>
 */
import fs from 'fs';
import path from 'path';

import { parseScript } from './lib/parse-script.js';
import { getAudioDuration } from './lib/tts.js';
import { generateSubtitles, type BeatTiming } from './lib/subtitles.js';
import { assembleVideo } from './lib/assemble.js';

const tmpDir = process.argv[2];
const scriptName = process.argv[3] || 'pitch-60s';
const orientation: 'horizontal' | 'vertical' = process.argv.includes('--vertical') ? 'vertical' : 'horizontal';

if (!tmpDir || !fs.existsSync(tmpDir)) {
  console.error('❌ Falta tmpDir valido. Uso: npx tsx scripts/video/test-assemble.ts <tmpDir>');
  process.exit(1);
}

const script = parseScript(`marketing/scripts/${scriptName}.md`);
const [width, height] = orientation === 'horizontal' ? [1920, 1080] : [1080, 1920];

const audioFiles: string[] = [];
const imageFiles: string[] = [];
const beatDurations: number[] = [];
const timings: BeatTiming[] = [];
let cursor = 0;

for (const beat of script.beats) {
  const a = path.join(tmpDir, `audio-${beat.index}-${beat.name}.wav`);
  const i = path.join(tmpDir, `image-${beat.index}-${beat.name}.png`);
  if (!fs.existsSync(a) || !fs.existsSync(i)) {
    console.error(`❌ Falta asset para beat ${beat.name}: ${a} o ${i}`);
    process.exit(1);
  }
  const d = getAudioDuration(a);
  audioFiles.push(a);
  imageFiles.push(i);
  beatDurations.push(d);
  timings.push({ beat, startSec: cursor, durationSec: d });
  cursor += d;
}

const subsPath = path.join(tmpDir, 'subs.ass');
generateSubtitles(timings, subsPath, { width, height });
console.log(`📝 ASS generado: ${subsPath}`);

const outputPath = path.join('marketing', 'output', `${scriptName}-${orientation}.mp4`);
console.log(`🎞  Ensamblando…`);
assembleVideo({
  audioFiles, imageFiles, beatDurations,
  subtitlesFile: subsPath,
  width, height,
  outputPath,
  tmpDir,
});
console.log(`✅ ${outputPath}`);
