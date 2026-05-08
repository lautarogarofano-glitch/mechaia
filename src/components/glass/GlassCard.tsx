import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  liquid?: boolean;
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, liquid = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'bg-glass-bg backdrop-blur-xl border border-glass-border rounded-2xl shadow-glass',
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
GlassCard.displayName = 'GlassCard';
