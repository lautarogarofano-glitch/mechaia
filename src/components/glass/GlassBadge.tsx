import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

type Tone =
  | 'violet'
  | 'cyan'
  | 'pink'
  | 'green'
  | 'amber'
  | 'red'
  | 'slate'
  | 'neutral';

interface GlassBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

const toneClasses: Record<Tone, string> = {
  violet: 'bg-accent-violet/20 text-violet-200 border-accent-violet/30',
  cyan: 'bg-accent-cyan/20 text-cyan-200 border-accent-cyan/30',
  pink: 'bg-accent-pink/20 text-pink-200 border-accent-pink/30',
  green: 'bg-emerald-500/15 text-emerald-200 border-emerald-400/30',
  amber: 'bg-amber-500/15 text-amber-200 border-amber-400/30',
  red: 'bg-red-500/20 text-red-200 border-red-400/40',
  slate: 'bg-slate-500/20 text-slate-200 border-slate-400/30',
  neutral: 'bg-glass-bg text-glass-mute border-glass-border',
};

export function GlassBadge({
  tone = 'neutral',
  className,
  children,
  ...props
}: GlassBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium',
        toneClasses[tone],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
