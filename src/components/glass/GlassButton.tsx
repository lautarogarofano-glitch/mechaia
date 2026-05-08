import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

type Variant = 'default' | 'primary' | 'danger' | 'ghost';

interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const variantClasses: Record<Variant, string> = {
  default:
    'bg-glass-bg hover:bg-glass-elevated border-glass-border text-glass-text',
  primary:
    'bg-accent-violet/20 hover:bg-accent-violet/30 border-accent-violet/40 text-white',
  danger:
    'bg-red-500/15 hover:bg-red-500/25 border-red-400/40 text-red-200',
  ghost:
    'bg-transparent hover:bg-glass-bg border-transparent text-glass-mute hover:text-glass-text',
};

export const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, variant = 'default', children, type = 'button', ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border backdrop-blur-md',
          'text-sm font-medium transition-all duration-150',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-violet/60',
          variantClasses[variant],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
GlassButton.displayName = 'GlassButton';
