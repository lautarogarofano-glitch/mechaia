import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

export interface AssembleOptions {
  audioFiles: string[];
  imageFiles: string[];
  beatDurations: number[];
  subtitlesFile: string;
  width: number;
  height: number;
  outputPath: string;
  tmpDir: string;
  /** Path opcional a MP3/WAV de musica de fondo. Si esta, se mezcla al 12%
   *  con loop infinito hasta cubrir la duracion de la voz. */
  bgMusicPath?: string;
  /** Volumen relativo de la musica (0-1). Default 0.12. */
  bgMusicVolume?: number;
}

const FPS = 30;
const FADE = 0.35;

function ffmpeg(args: string[], label: string): void {
  const res = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', ...args], { encoding: 'utf-8' });
  if (res.status !== 0) {
    const stderr = (res.stderr || '').trim().slice(0, 1500);
    throw new Error(`ffmpeg failed (${label}): ${stderr || 'unknown error'}`);
  }
}

export function assembleVideo(opts: AssembleOptions): void {
  const { audioFiles, imageFiles, beatDurations, subtitlesFile, width, height, outputPath, tmpDir } = opts;
  const bgMusicPath = opts.bgMusicPath && fs.existsSync(opts.bgMusicPath) ? opts.bgMusicPath : undefined;
  const bgMusicVolume = opts.bgMusicVolume ?? 0.12;

  if (audioFiles.length !== imageFiles.length || audioFiles.length !== beatDurations.length) {
    throw new Error(
      `Mismatch: audios=${audioFiles.length}, images=${imageFiles.length}, durations=${beatDurations.length}`,
    );
  }

  const clipPaths: string[] = [];
  for (let i = 0; i < imageFiles.length; i++) {
    const clip = path.join(tmpDir, `clip-${i}.mp4`);
    const D = Math.max(1.0, beatDurations[i]);
    const frames = Math.max(2, Math.round(D * FPS));
    const fadeOutStart = Math.max(0, D - FADE);
    const fadeEnabled = D > FADE * 2 + 0.5;

    const fadeFilter = fadeEnabled ? `,fade=t=in:st=0:d=${FADE},fade=t=out:st=${fadeOutStart.toFixed(3)}:d=${FADE}` : '';

    const vf =
      `scale=${width * 2}:${height * 2}:force_original_aspect_ratio=increase,` +
      `crop=${width * 2}:${height * 2},` +
      `zoompan=z='min(1+0.0015*on,1.18)':x='iw/2-(iw/zoom)/2':y='ih/2-(ih/zoom)/2'` +
      `:d=${frames}:s=${width}x${height}:fps=${FPS},setsar=1` +
      fadeFilter;

    ffmpeg(
      [
        '-loop', '1',
        '-t', D.toFixed(3),
        '-i', imageFiles[i],
        '-vf', vf,
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        '-r', String(FPS),
        '-t', D.toFixed(3),
        clip,
      ],
      `clip-${i}`,
    );
    clipPaths.push(clip);
  }

  // El concat demuxer resuelve paths relativos al archivo .txt; usamos absolutos.
  const concatVideoList = path.join(tmpDir, 'clips.txt');
  fs.writeFileSync(
    concatVideoList,
    clipPaths.map((p) => `file '${path.resolve(p).replace(/'/g, "'\\''")}'`).join('\n'),
  );
  const videoOnly = path.join(tmpDir, 'video.mp4');
  ffmpeg(['-f', 'concat', '-safe', '0', '-i', concatVideoList, '-c', 'copy', videoOnly], 'concat-video');

  const audioList = path.join(tmpDir, 'audios.txt');
  fs.writeFileSync(
    audioList,
    audioFiles.map((p) => `file '${path.resolve(p).replace(/'/g, "'\\''")}'`).join('\n'),
  );
  const audioMerged = path.join(tmpDir, 'audio.wav');
  ffmpeg(['-f', 'concat', '-safe', '0', '-i', audioList, '-c', 'copy', audioMerged], 'concat-audio');

  // Si el path tiene caracteres especiales (`:`, espacios), conviene usar relativo
  // desde cwd. El .ass trae su propio estilo, no necesitamos force_style.
  const subsRel = path.relative(process.cwd(), subtitlesFile);
  const vfSubs = `subtitles=${subsRel}`;

  if (bgMusicPath) {
    // Mux con musica de fondo loopeada y mezclada bajo la voz.
    const filterComplex =
      `[1:a]volume=1.0[voice];` +
      `[2:a]aloop=loop=-1:size=2e+09,volume=${bgMusicVolume.toFixed(2)},afade=t=in:st=0:d=0.6[music];` +
      `[voice][music]amix=inputs=2:duration=first:dropout_transition=0[aout]`;

    ffmpeg(
      [
        '-i', videoOnly,
        '-i', audioMerged,
        '-i', bgMusicPath,
        '-filter_complex', filterComplex,
        '-vf', vfSubs,
        '-map', '0:v',
        '-map', '[aout]',
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        '-c:a', 'aac',
        '-b:a', '192k',
        '-shortest',
        outputPath,
      ],
      'mux-subs-music',
    );
  } else {
    ffmpeg(
      [
        '-i', videoOnly,
        '-i', audioMerged,
        '-vf', vfSubs,
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        '-c:a', 'aac',
        '-b:a', '192k',
        '-shortest',
        outputPath,
      ],
      'mux-subs',
    );
  }
}
