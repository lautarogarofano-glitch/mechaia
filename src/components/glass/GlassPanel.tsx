import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> {
  liquid?: boolean;
}

export const GlassPanel = forwardRef<HTMLDivElement, GlassPanelProps>(
  ({ className, liquid = true, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'bg-glass-elevated backdrop-blur-xl border border-glass-border-strong rounded-3xl shadow-glass-strong',
          liquid && 'liquid-distort',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
GlassPanel.displayName = 'GlassPanel';
