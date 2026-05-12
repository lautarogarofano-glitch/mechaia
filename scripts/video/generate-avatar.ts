#!/usr/bin/env tsx
/**
 * generate-avatar.ts
 * Genera 4 variantes del personaje "tecnico-fundador" para Mechaia.
 * El usuario elige una y la copiamos a marketing/avatar/base.png, que despues
 * se usa como reference image en cada generacion de video (consistencia visual).
 *
 * Uso: npm run avatar:variants
 */
import fs from 'fs';
import path from 'path';

const envFile = path.resolve('.env.local');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf-8').split('\n')) {
    const [key, ...rest] = line.split('=');
    if (key && rest.length) process.env[key.trim()] = rest.join('=').trim();
  }
}

import { sleep, withRetry } from './lib/retry.js';

const apiKey = process.env.MECHAIA_IMAGE_KEY || process.env.GOOGLE_AI_API_KEY;
if (!apiKey) {
  console.error('❌ Falta GOOGLE_AI_API_KEY en .env.local');
  process.exit(1);
}

const MODEL = 'gemini-2.5-flash-image';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const BASE_CHARACTER =
  'Photorealistic portrait of a man, 40 years old, intelligent confident gaze, ' +
  'dark brown hair short well-groomed with subtle gray at temples, light short stubble beard, ' +
  'hazel-green eyes, athletic professional build, dark navy or charcoal long-sleeve technical ' +
  'fleece or premium henley shirt (NOT corporate suit, NOT streetwear hoodie), look of automotive ' +
  'engineer / SaaS founder hybrid, professional and approachable, technical authority.';

interface Variant {
  name: string;
  description: string;
  scene: string;
}

const VARIANTS: Variant[] = [
  {
    name: 'variant-1-studio',
    description: 'Studio portrait, mirada directa, fondo neutro oscuro',
    scene:
      'Studio portrait against dark charcoal gradient background. Subject facing camera straight on, ' +
      'neutral confident expression with slight hint of warmth in the eyes, no smile. ' +
      'Professional rim lighting from upper left, soft key light. Shallow depth of field. ' +
      'Premium executive photography aesthetic like Apple keynote presenter portraits.',
  },
  {
    name: 'variant-2-workshop',
    description: 'Contexto de taller moderno, leve sonrisa, mirada lateral',
    scene:
      'Portrait in a clean modern automotive workshop. Subject looking slightly off-camera as if ' +
      'thinking, soft genuine half-smile, leaning casually against a workbench. Modern car partially ' +
      'visible blurred in background. Warm tungsten workshop lighting mixed with cool natural light ' +
      'from windows. Cinematic shallow depth of field.',
  },
  {
    name: 'variant-3-office',
    description: 'Oficina tech / SaaS founder, gradient moderno, mirada confiable',
    scene:
      'Portrait in a modern minimal office. Subject seated or leaning at a clean desk with a laptop ' +
      'visible blurred in foreground. Looking directly at camera with confident professional expression. ' +
      'Premium SaaS founder aesthetic — think Linear, Vercel, Notion founders. Soft natural window light ' +
      'from left, dark gradient background. Shallow depth of field.',
  },
  {
    name: 'variant-4-cinematic',
    description: 'Cinematográfico moody, dramatic lighting, dark background',
    scene:
      'Cinematic dramatic portrait. Subject lit by single warm directional key light from upper left, ' +
      'deep shadows on right side of face, rim light separating from completely black background. ' +
      'Looking at camera with serious confident expression. Reminiscent of Vanity Fair / The Atlantic ' +
      'editorial portraiture. Premium cinematic photography.',
  },
];

async function generateVariant(v: Variant): Promise<void> {
  const outputDir = path.resolve('marketing/avatar/variants');
  const outputPath = path.join(outputDir, `${v.name}.png`);

  const fullPrompt =
    `${BASE_CHARACTER} ${v.scene} ` +
    `Square 1:1 composition centered. Photorealistic. Ultra high detail. ` +
    `No text, no logos, no watermarks.`;

  const body = {
    contents: [{ parts: [{ text: fullPrompt }] }],
    generationConfig: { responseModalities: ['IMAGE'] },
  };

  const res = await fetch(`${ENDPOINT}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini Image failed (${res.status}): ${err.slice(0, 400)}`);
  }

  const json: any = await res.json();
  const parts = json.candidates?.[0]?.content?.parts || [];
  const imagePart = parts.find((p: any) => p.inlineData?.data);
  if (!imagePart?.inlineData?.data) {
    throw new Error('Gemini returned no image data (possibly blocked by safety filters)');
  }

  const buf = Buffer.from(imagePart.inlineData.data, 'base64');
  fs.writeFileSync(outputPath, buf);
  console.log(`   ✅ ${path.relative(process.cwd(), outputPath)} (${(buf.length / 1024).toFixed(0)} KB)`);
}

async function main(): Promise<void> {
  console.log(`🎨 Generando ${VARIANTS.length} variantes del personaje "técnico-fundador"…`);
  console.log('');
  for (let i = 0; i < VARIANTS.length; i++) {
    const v = VARIANTS[i];
    console.log(`▶  ${v.name} — ${v.description}`);
    await withRetry(() => generateVariant(v), { label: v.name });
    if (i < VARIANTS.length - 1) await sleep(8_000);
  }
  console.log('');
  console.log('🖼   Listo. Abrí marketing/avatar/variants/ y elegí una.');
  console.log('     Decime cual y la copio a marketing/avatar/base.png.');
}

main().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});
