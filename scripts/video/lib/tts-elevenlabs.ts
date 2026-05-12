import fs from 'fs';
import { spawnSync, execSync } from 'child_process';

const ENDPOINT = 'https://api.elevenlabs.io/v1/text-to-speech';

interface ElevenLabsOptions {
  /** Voz clonada, ej "21m00Tcm4TlvDq8ikWAM" */
  voiceId: string;
  /** API key sk_... */
  apiKey: string;
  /** "eleven_multilingual_v2" recomendado para espanol. */
  modelId?: string;
  /** 0..1, menos = mas expresivo, mas = mas estable. Default 0.5. */
  stability?: number;
  /** 0..1, cuanto se parece al clone. Default 0.75. */
  similarityBoost?: number;
  /** 0..1, cuanta exageracion de estilo. Default 0.2. */
  style?: number;
}

export async function generateTTSElevenLabs(
  text: string,
  outputWavPath: string,
  opts: ElevenLabsOptions,
): Promise<void> {
  const url = `${ENDPOINT}/${opts.voiceId}`;
  const body = {
    text,
    model_id: opts.modelId ?? 'eleven_multilingual_v2',
    voice_settings: {
      stability: opts.stability ?? 0.5,
      similarity_boost: opts.similarityBoost ?? 0.75,
      style: opts.style ?? 0.2,
      use_speaker_boost: true,
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'xi-api-key': opts.apiKey,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`ElevenLabs TTS failed (${res.status}): ${err.slice(0, 400)}`);
  }

  const mp3 = Buffer.from(await res.arrayBuffer());
  const tmpMp3 = `${outputWavPath}.tmp.mp3`;
  fs.writeFileSync(tmpMp3, mp3);

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

export function getAudioDuration(audioPath: string): number {
  const out = execSync(
    `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioPath}"`,
    { encoding: 'utf-8' },
  );
  return parseFloat(out.trim());
}
