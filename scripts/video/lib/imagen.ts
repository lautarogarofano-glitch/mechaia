import fs from 'fs';
import { execSync } from 'child_process';

const MODEL = process.env.MECHAIA_IMAGE_MODEL || 'gemini-2.5-flash-image';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

interface GeminiImageResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ inlineData?: { mimeType?: string; data?: string } }>;
    };
  }>;
  error?: { message?: string; status?: string };
}

export type Orientation = 'horizontal' | 'vertical';

const ORIENTATION_HINTS: Record<Orientation, string> = {
  horizontal: 'Ultra-wide 16:9 cinematic landscape composition, widescreen aspect ratio, horizontal framing.',
  vertical: 'Vertical 9:16 portrait composition for mobile reels, tall framing, subject centered vertically.',
};

export interface GenerateImageOptions {
  /** Path a una imagen PNG/JPG que se manda como reference para mantener la
   *  identidad del personaje a traves de generaciones (avatar persistente). */
  referenceImagePath?: string;
}

export async function generateImage(
  prompt: string,
  outputPngPath: string,
  orientation: Orientation,
  apiKey: string,
  options: GenerateImageOptions = {},
): Promise<void> {
  const characterDirective = options.referenceImagePath
    ? 'The SAME character shown in the reference image (preserve face, hair, build, style precisely). '
    : '';
  const fullPrompt =
    `${characterDirective}${prompt}. ${ORIENTATION_HINTS[orientation]} ` +
    `No text, no logos, no watermarks. Photorealistic. High detail.`;

  const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];

  if (options.referenceImagePath) {
    const refBytes = fs.readFileSync(options.referenceImagePath);
    const mimeType = options.referenceImagePath.toLowerCase().endsWith('.jpg') ||
                     options.referenceImagePath.toLowerCase().endsWith('.jpeg')
      ? 'image/jpeg'
      : 'image/png';
    parts.push({ inlineData: { mimeType, data: refBytes.toString('base64') } });
  }
  parts.push({ text: fullPrompt });

  const body = {
    contents: [{ parts }],
    generationConfig: { responseModalities: ['IMAGE'] },
  };

  const url = `${ENDPOINT}?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Gemini Image failed (${res.status}): ${errBody.slice(0, 500)}`);
  }

  const json = (await res.json()) as GeminiImageResponse;
  if (json.error) {
    throw new Error(`Gemini Image error: ${json.error.message || json.error.status}`);
  }

  const responseParts = json.candidates?.[0]?.content?.parts || [];
  const imagePart = responseParts.find((p) => p.inlineData?.data);
  if (!imagePart?.inlineData?.data) {
    throw new Error('Gemini Image returned no image data. Prompt may have been blocked.');
  }

  const pngBytes = Buffer.from(imagePart.inlineData.data, 'base64');
  const tmpPath = `${outputPngPath}.raw.png`;
  fs.writeFileSync(tmpPath, pngBytes);

  const [w, h] = orientation === 'horizontal' ? [1920, 1080] : [1080, 1920];
  try {
    execSync(
      `ffmpeg -y -i "${tmpPath}" -vf "scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h}" "${outputPngPath}" -loglevel error`,
      { stdio: 'pipe' },
    );
  } finally {
    if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
  }
}
