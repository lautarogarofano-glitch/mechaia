#!/usr/bin/env tsx
/**
 * generate-video.ts
 * Genera un video pitch end-to-end para Mechaia usando solo IA:
 *   1. Lee marketing/scripts/<name>.md (parsea beats + image prompts).
 *   2. Genera TTS por beat con Gemini 2.5 Flash TTS.
 *   3. Genera imagen por beat con Gemini 2.5 Flash Image (Nano Banana).
 *   4. Mide duraciones reales con ffprobe.
 *   5. Genera SRT con timing sincronizado.
 *   6. Ensambla con ffmpeg: Ken Burns + concat + audio + subs.
 *
 * Uso:
 *   npm run video -- pitch-60s
 *   npm run video -- pitch-60s --vertical
 *   npm run video -- pitch-30s --vertical
 *
 * Requiere: ffmpeg en PATH + GOOGLE_AI_API_KEY_INGEST (o GOOGLE_AI_API_KEY) en .env.local
 */

import fs from 'fs';
import path from 'path';

// .env.local manual loader (mismo patron que process-docs.ts).
const envFile = path.resolve('.env.local');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf-8').split('\n')) {
    const [key, ...rest] = line.split('=');
    if (key && rest.length) process.env[key.trim()] = rest.join('=').trim();
  }
}

import { parseScript } from './lib/parse-script.js';
import { generateTTS, getAudioDuration } from './lib/tts.js';
import { generateTTSElevenLabs } from './lib/tts-elevenlabs.js';
import { generateTTSEdge, isEdgeTTSAvailable } from './lib/tts-edge.js';
import { generateImage, type Orientation } from './lib/imagen.js';
import { generateSubtitles, type BeatTiming } from './lib/subtitles.js';
import { assembleVideo } from './lib/assemble.js';
import { withRetry, sleep } from './lib/retry.js';

type TTSProvider = 'edge' | 'elevenlabs' | 'gemini';

// Free tier: gemini-2.5-flash-tts = 10 RPM, gemini-2.5-flash-image = 10 RPM,
// pero comparten ventana de cuota a nivel proyecto. 12s entre beats + jitter
// nos da ~4-5 req/min sostenido, bien debajo del limite.
const DELAY_BETWEEN_BEATS_MS = 12_000;

const ROOT = process.cwd();
const SCRIPTS_DIR = path.join(ROOT, 'marketing', 'scripts');
const OUTPUT_DIR = path.join(ROOT, 'marketing', 'output');
const TMP_DIR = path.join(ROOT, 'marketing', 'tmp');

interface CliArgs {
  scriptName: string;
  orientation: Orientation;
  voice?: string;
  keepTmp: boolean;
}

function parseArgs(): CliArgs {
  const argv = process.argv.slice(2);
  if (argv.length === 0) {
    console.error('❌ Uso: npm run video -- <script-name> [--vertical] [--voice=NAME] [--keep-tmp]');
    console.error('   Ej:  npm run video -- pitch-60s');
    process.exit(1);
  }
  const scriptName = argv[0].replace(/\.md$/, '');
  const orientation: Orientation = argv.includes('--vertical') ? 'vertical' : 'horizontal';
  const voiceFlag = argv.find((a) => a.startsWith('--voice='));
  const voice = voiceFlag ? voiceFlag.split('=')[1] : undefined;
  const keepTmp = argv.includes('--keep-tmp');
  return { scriptName, orientation, voice, keepTmp };
}

async function main(): Promise<void> {
  const args = parseArgs();

  // TTS provider preferencia:
  //   1. MECHAIA_TTS_PROVIDER explicito (edge|elevenlabs|gemini)
  //   2. ElevenLabs si tiene key+voice_id configurados
  //   3. Edge TTS si el CLI esta instalado (es-AR-TomasNeural, free forever)
  //   4. Gemini Charon como fallback
  const elevenLabsKey = process.env.ELEVENLABS_API_KEY;
  const elevenLabsVoice = process.env.ELEVENLABS_VOICE_ID;
  const explicitProvider = process.env.MECHAIA_TTS_PROVIDER as TTSProvider | undefined;

  let provider: TTSProvider;
  if (explicitProvider) {
    provider = explicitProvider;
  } else if (elevenLabsKey && elevenLabsVoice) {
    provider = 'elevenlabs';
  } else if (isEdgeTTSAvailable()) {
    provider = 'edge';
  } else {
    provider = 'gemini';
  }

  // Imagen: la key de prod tiene la capacidad activa, la INGEST no.
  const ttsKey = process.env.MECHAIA_VIDEO_KEY || process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_AI_API_KEY_INGEST;
  const imageKey = process.env.MECHAIA_IMAGE_KEY || process.env.MECHAIA_VIDEO_KEY || process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_AI_API_KEY_INGEST;
  if (!ttsKey || !imageKey) {
    console.error('❌ Falta GOOGLE_AI_API_KEY o GOOGLE_AI_API_KEY_INGEST en .env.local');
    process.exit(1);
  }

  // Avatar de referencia: si existe marketing/avatar/base.png, lo usamos para
  // mantener la identidad del personaje a traves de todos los beats del video.
  const avatarBasePath = path.resolve('marketing/avatar/base.png');
  const useAvatar = fs.existsSync(avatarBasePath);

  const scriptPath = path.join(SCRIPTS_DIR, `${args.scriptName}.md`);
  if (!fs.existsSync(scriptPath)) {
    console.error(`❌ Script no encontrado: ${scriptPath}`);
    console.error(`   Disponibles: ${fs.readdirSync(SCRIPTS_DIR).filter((f) => f.endsWith('.md')).join(', ')}`);
    process.exit(1);
  }

  const script = parseScript(scriptPath);
  const voice = args.voice || script.meta.voice;

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const runId = `${args.scriptName}-${args.orientation}-${Date.now()}`;
  const runTmp = path.join(TMP_DIR, runId);
  fs.mkdirSync(runTmp, { recursive: true });

  const [width, height] = args.orientation === 'horizontal' ? [1920, 1080] : [1080, 1920];

  // Voz default por provider si el script no especifica una compatible.
  const edgeVoice = process.env.MECHAIA_EDGE_VOICE || script.meta.edgeVoice || 'es-AR-TomasNeural';
  const edgeRate = process.env.MECHAIA_EDGE_RATE || script.meta.edgeRate || '+12%';
  const voiceLabel =
    provider === 'elevenlabs' ? `ElevenLabs[${elevenLabsVoice!.slice(0, 8)}…]`
    : provider === 'edge' ? `Edge[${edgeVoice}]`
    : `Gemini[${voice}]`;
  console.log(`🎬 ${script.meta.title}`);
  console.log(`   Beats: ${script.beats.length} | Voz: ${voiceLabel} | ${args.orientation} ${width}x${height}`);
  console.log(`   Avatar persistente: ${useAvatar ? 'sí (marketing/avatar/base.png)' : 'no (cada beat se genera independiente)'}`);
  console.log(`   Tmp: ${runTmp}`);
  console.log('');

  const audioFiles: string[] = [];
  const imageFiles: string[] = [];
  const beatDurations: number[] = [];
  const timings: BeatTiming[] = [];

  let cumulativeSec = 0;

  for (let i = 0; i < script.beats.length; i++) {
    const beat = script.beats[i];
    console.log(`▶  [${beat.name}] ${beat.text.slice(0, 60)}${beat.text.length > 60 ? '…' : ''}`);

    const audioPath = path.join(runTmp, `audio-${beat.index}-${beat.name}.wav`);
    const imagePath = path.join(runTmp, `image-${beat.index}-${beat.name}.png`);

    process.stdout.write('   • TTS… ');
    await withRetry(
      () => {
        if (provider === 'elevenlabs') {
          return generateTTSElevenLabs(beat.text, audioPath, {
            voiceId: elevenLabsVoice!,
            apiKey: elevenLabsKey!,
          });
        }
        if (provider === 'edge') {
          return generateTTSEdge(beat.text, audioPath, { voice: edgeVoice, rate: edgeRate });
        }
        return generateTTS(beat.text, voice, audioPath, ttsKey!);
      },
      { label: 'TTS' },
    );
    const dur = getAudioDuration(audioPath);
    console.log(`${dur.toFixed(2)}s`);

    process.stdout.write('   • Image… ');
    await withRetry(
      () =>
        generateImage(beat.imagePrompt, imagePath, args.orientation, imageKey!, {
          referenceImagePath: useAvatar ? avatarBasePath : undefined,
        }),
      { label: 'Image' },
    );
    console.log('ok');

    audioFiles.push(audioPath);
    imageFiles.push(imagePath);
    beatDurations.push(dur);
    timings.push({ beat, startSec: cumulativeSec, durationSec: dur });
    cumulativeSec += dur;

    if (i < script.beats.length - 1) {
      await sleep(DELAY_BETWEEN_BEATS_MS);
    }
  }

  const totalSec = beatDurations.reduce((a, b) => a + b, 0);
  console.log('');
  console.log(`📐 Duración total estimada: ${totalSec.toFixed(2)}s`);

  const subsPath = path.join(runTmp, 'subs.ass');
  generateSubtitles(timings, subsPath, { width, height });
  console.log(`📝 Subtítulos: ${path.relative(ROOT, subsPath)}`);

  const bgMusicPath = path.resolve('marketing/music/bg.mp3');
  const hasBgMusic = fs.existsSync(bgMusicPath);
  console.log(`🎵 Musica de fondo: ${hasBgMusic ? 'sí (marketing/music/bg.mp3 al 12%)' : 'no (drop un MP3 en marketing/music/bg.mp3 para activarla)'}`);

  const outputPath = path.join(OUTPUT_DIR, `${args.scriptName}-${args.orientation}.mp4`);
  console.log(`🎞  Ensamblando con ffmpeg…`);
  assembleVideo({
    audioFiles,
    imageFiles,
    beatDurations,
    subtitlesFile: subsPath,
    width,
    height,
    outputPath,
    tmpDir: runTmp,
    bgMusicPath: hasBgMusic ? bgMusicPath : undefined,
  });

  if (!args.keepTmp) {
    fs.rmSync(runTmp, { recursive: true, force: true });
  }

  console.log('');
  console.log(`✅ Listo: ${path.relative(ROOT, outputPath)}`);
}

main().catch((err) => {
  console.error('');
  console.error('❌ Falló:', err.message);
  if (process.env.DEBUG) console.error(err.stack);
  process.exit(1);
});
