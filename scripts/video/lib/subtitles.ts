import fs from 'fs';
import type { Beat } from './parse-script.js';

export interface BeatTiming {
  beat: Beat;
  startSec: number;
  durationSec: number;
}

export interface SubtitleStyle {
  width: number;
  height: number;
  /** Override fontsize (default: width/48 horizontal, width/30 vertical) */
  fontSize?: number;
}

const MAX_LINES_PER_CUE = 2;
const MIN_CUE_SEC = 1.2;

/**
 * Emite un archivo .ass (Advanced SubStation Alpha) con estilo embedido.
 * Preferido sobre .srt porque ffmpeg-subtitles tira problemas de escaping
 * cuando se usa force_style en linea de comando.
 */
export function generateSubtitles(
  timings: BeatTiming[],
  outputAssPath: string,
  style: SubtitleStyle,
): void {
  const width = style.width;
  const height = style.height;
  const fontSize = style.fontSize ?? Math.round(width / 48);
  const maxCharsPerLine = Math.round(width / (fontSize * 0.55));

  const cues: Array<{ start: number; end: number; text: string }> = [];

  for (const { beat, startSec, durationSec } of timings) {
    const chunks = chunkTextForSubtitles(beat.text, maxCharsPerLine);
    if (chunks.length === 0) continue;

    const totalChars = chunks.reduce((acc, c) => acc + c.replace(/\\N/g, '').length, 0) || 1;
    let cursor = startSec;

    for (const chunk of chunks) {
      const chunkLen = chunk.replace(/\\N/g, '').length;
      const proportion = chunkLen / totalChars;
      const cueDur = Math.max(MIN_CUE_SEC, durationSec * proportion);
      const end = Math.min(startSec + durationSec, cursor + cueDur);
      cues.push({ start: cursor, end, text: chunk });
      cursor = end;
    }
  }

  const header = buildAssHeader(width, height, fontSize);
  const dialogues = cues
    .map(
      (c) =>
        `Dialogue: 0,${formatAssTime(c.start)},${formatAssTime(c.end)},Default,,0,0,0,,${escapeAssText(c.text)}`,
    )
    .join('\n');

  fs.writeFileSync(outputAssPath, header + dialogues + '\n');
}

function buildAssHeader(width: number, height: number, fontSize: number): string {
  // Colors en formato ASS: &HAABBGGRR. AA=alpha (00=opaque, FF=transparent).
  const primary = '&H00FFFFFF'; // blanco
  const outline = '&H00000000'; // negro
  const back = '&H80000000'; // negro semi-transparente
  const marginV = Math.round(height * 0.08);

  return `[Script Info]
ScriptType: v4.00+
PlayResX: ${width}
PlayResY: ${height}
WrapStyle: 2
ScaledBorderAndShadow: yes
YCbCr Matrix: TV.709

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Helvetica,${fontSize},${primary},${primary},${outline},${back},1,0,0,0,100,100,0,0,1,3,1,2,40,40,${marginV},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;
}

function chunkTextForSubtitles(text: string, maxCharsPerLine: number): string[] {
  const sentences = text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?:])\s+/)
    .filter(Boolean);

  const chunks: string[] = [];
  for (const sentence of sentences) {
    const words = sentence.split(' ');
    let line1 = '';
    let line2 = '';

    for (const w of words) {
      if (!line1 || (line1 + ' ' + w).length <= maxCharsPerLine) {
        line1 = line1 ? `${line1} ${w}` : w;
      } else if (MAX_LINES_PER_CUE >= 2 && (!line2 || (line2 + ' ' + w).length <= maxCharsPerLine)) {
        line2 = line2 ? `${line2} ${w}` : w;
      } else {
        chunks.push(line2 ? `${line1}\\N${line2}` : line1);
        line1 = w;
        line2 = '';
      }
    }
    if (line1) {
      chunks.push(line2 ? `${line1}\\N${line2}` : line1);
    }
  }

  return chunks;
}

function formatAssTime(sec: number): string {
  const cs = Math.max(0, Math.round(sec * 100));
  const totalSec = Math.floor(cs / 100);
  const csec = cs % 100;
  const s = totalSec % 60;
  const m = Math.floor(totalSec / 60) % 60;
  const h = Math.floor(totalSec / 3600);
  const pad = (n: number, len = 2) => String(n).padStart(len, '0');
  return `${h}:${pad(m)}:${pad(s)}.${pad(csec)}`;
}

function escapeAssText(text: string): string {
  // ASS dialog format: { y } son override markers. Comas dentro del texto OK.
  return text.replace(/\{/g, '\\{').replace(/\}/g, '\\}');
}
