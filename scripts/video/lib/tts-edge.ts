import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

/**
 * Edge TTS (Microsoft Edge Read Aloud API) - 100% gratis, sin signup, sin key.
 * Requiere el CLI instalado: `pipx install edge-tts` y que `edge-tts` este en PATH.
 *
 * Voces argentinas naturales:
 *   - es-AR-TomasNeural (masculino, Friendly/Positive)
 *   - es-AR-ElenaNeural (femenina, Friendly/Positive)
 *
 * Otras LATAM utiles:
 *   - es-MX-JorgeNeural, es-MX-DaliaNeural
 *   - es-CO-GonzaloNeural, es-CO-SalomeNeural
 *   - es-CL-LorenzoNeural
 *   - es-US-AlonsoNeural (mas neutro USA)
 */

// Si pipx puso edge-tts en ~/.local/bin, lo agregamos al PATH del subproceso.
const EDGE_PATH = [process.env.PATH || '', `${process.env.HOME}/.local/bin`].filter(Boolean).join(':');

export interface EdgeTTSOptions {
  /** Codigo de voz tipo "es-AR-TomasNeural". Ver `edge-tts --list-voices`. */
  voice: string;
  /** "+10%" o "-10%" relativo a velocidad base. Default 0%. */
  rate?: string;
  /** "+5Hz" o "-5Hz" relativo a pitch base. Default 0Hz. */
  pitch?: string;
  /** "+20%" o "-20%". Default 0%. */
  volume?: string;
}

export async function generateTTSEdge(
  text: string,
  outputWavPath: string,
  opts: EdgeTTSOptions,
): Promise<void> {
  const tmpMp3 = `${outputWavPath}.tmp.mp3`;

  const args = [
    '--voice', opts.voice,
    '--text', text,
    '--write-media', tmpMp3,
  ];
  if (opts.rate) args.push('--rate', opts.rate);
  if (opts.pitch) args.push('--pitch', opts.pitch);
  if (opts.volume) args.push('--volume', opts.volume);

  const res = spawnSync('edge-tts', args, {
    encoding: 'utf-8',
    env: { ...process.env, PATH: EDGE_PATH },
  });

  if (res.status !== 0 || !fs.existsSync(tmpMp3)) {
    const stderr = (res.stderr || res.error?.message || '').toString();
    throw new Error(`edge-tts failed: ${stderr.slice(0, 400)}`);
  }

  // Convert MP3 a WAV 44.1kHz stereo (consistente con el resto del pipeline).
  try {
    const conv = spawnSync(
      'ffmpeg',
      ['-y', '-i', tmpMp3, '-ar', '44100', '-ac', '2', outputWavPath, '-loglevel', 'error'],
      { encoding: 'utf-8' },
    );
    if (conv.status !== 0) {
      throw new Error(`ffmpeg mp3->wav failed: ${(conv.stderr || '').slice(0, 400)}`);
    }
  } finally {
    if (fs.existsSync(tmpMp3)) fs.unlinkSync(tmpMp3);
  }
}

export function isEdgeTTSAvailable(): boolean {
  const res = spawnSync('edge-tts', ['--version'], {
    encoding: 'utf-8',
    env: { ...process.env, PATH: EDGE_PATH },
  });
  return res.status === 0;
}
