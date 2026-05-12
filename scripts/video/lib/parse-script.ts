import fs from 'fs';
import path from 'path';

export interface Beat {
  name: string;
  index: number;
  text: string;
  imagePrompt: string;
}

export interface ScriptMeta {
  title: string;
  duration: string;
  audience: string;
  tone: string;
  voice: string;
  edgeVoice?: string;
  edgeRate?: string;
}

export interface ParsedScript {
  meta: ScriptMeta;
  beats: Beat[];
}

const DEFAULT_IMAGE_PROMPT =
  'Cinematic photorealistic shot related to automotive diagnostics and modern mechanics workshop, premium quality, 16:9 composition';

export function parseScript(filePath: string): ParsedScript {
  const abs = path.resolve(filePath);
  const raw = fs.readFileSync(abs, 'utf-8');

  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!fmMatch) {
    throw new Error(`Script ${filePath} is missing frontmatter (--- block at top)`);
  }
  const frontmatterRaw = fmMatch[1];
  const body = fmMatch[2];

  const meta: ScriptMeta = {
    title: pickMeta(frontmatterRaw, 'title') ?? 'Untitled',
    duration: pickMeta(frontmatterRaw, 'duration') ?? '60s',
    audience: pickMeta(frontmatterRaw, 'audience') ?? 'general',
    tone: pickMeta(frontmatterRaw, 'tone') ?? 'profesional',
    voice: pickMeta(frontmatterRaw, 'voice') ?? 'Charon',
    edgeVoice: pickMeta(frontmatterRaw, 'edge_voice') ?? undefined,
    edgeRate: pickMeta(frontmatterRaw, 'edge_rate') ?? undefined,
  };

  const beatRegex = /^\[([A-ZÁÉÍÓÚÑ_]+)\s*·[^\]]*\]\s*\n([\s\S]*?)(?=^\[[A-ZÁÉÍÓÚÑ_]+\s*·|$(?![\r\n]))/gm;
  const beats: Beat[] = [];
  let match: RegExpExecArray | null;
  let idx = 0;

  while ((match = beatRegex.exec(body)) !== null) {
    const name = match[1].trim();
    const block = match[2].trim();

    let imagePrompt = DEFAULT_IMAGE_PROMPT;
    let text = block;

    const imageMatch = block.match(/^@image:\s*(.+?)(?:\n|$)/);
    if (imageMatch) {
      imagePrompt = imageMatch[1].trim();
      text = block.replace(imageMatch[0], '').trim();
    }

    if (text.length === 0) continue;

    beats.push({ name, index: idx++, text, imagePrompt });
  }

  if (beats.length === 0) {
    throw new Error(`No beats parsed from ${filePath}. Use the format [BEAT_NAME · 0:00-0:00] followed by text.`);
  }

  return { meta, beats };
}

function pickMeta(frontmatter: string, key: string): string | null {
  const re = new RegExp(`^${key}:\\s*(.+)$`, 'm');
  const m = frontmatter.match(re);
  return m ? m[1].trim() : null;
}
