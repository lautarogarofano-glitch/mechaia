import fs from 'fs';
import { execSync } from 'child_process';

const TTS_MODEL = 'gemini-2.5-flash-preview-tts';
const TTS_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${TTS_MODEL}:generateContent`;

interface InlineData {
  mimeType?: string;
  data?: string;
}
interface GeminiTTSResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ inlineData?: InlineData }> };
  }>;
  error?: { message?: string; status?: string };
}

export async function generateTTS(
  text: string,
  voice: string,
  outputWavPath: string,
  apiKey: string,
): Promise<void> {
  const body = {
    contents: [{ parts: [{ text }] }],
    generationConfig: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: voice },
        },
      },
    },
  };

  const url = `${TTS_ENDPOINT}?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Gemini TTS failed (${res.status}): ${errBody.slice(0, 500)}`);
  }

  const json = (await res.json()) as GeminiTTSResponse;
  if (json.error) {
    throw new Error(`Gemini TTS error: ${json.error.message || json.error.status}`);
  }

  const inline = json.candidates?.[0]?.content?.parts?.[0]?.inlineData;
  if (!inline?.data) {
    throw new Error('Gemini TTS returned no audio data');
  }

  const mime = inline.mimeType || 'audio/L16;rate=24000';
  const rateMatch = mime.match(/rate=(\d+)/);
  const sampleRate = rateMatch ? parseInt(rateMatch[1], 10) : 24000;

  const pcm = Buffer.from(inline.data, 'base64');
  const tmpPcm = `${outputWavPath}.pcm`;
  fs.writeFileSync(tmpPcm, pcm);

  try {
    execSync(
      `ffmpeg -y -f s16le -ar ${sampleRate} -ac 1 -i "${tmpPcm}" -ar 44100 -ac 2 "${outputWavPath}" -loglevel error`,
      { stdio: 'pipe' },
    );
  } finally {
    fs.unlinkSync(tmpPcm);
  }
}

export function getAudioDuration(audioPath: string): number {
  const out = execSync(
    `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioPath}"`,
    { encoding: 'utf-8' },
  );
  return parseFloat(out.trim());
}
