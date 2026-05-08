import type { HTMLAttributes, ThHTMLAttributes, TdHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export function GlassTable({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'bg-glass-bg backdrop-blur-xl border border-glass-border rounded-2xl shadow-glass overflow-hidden',
        className
      )}
      {...props}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">{children}</table>
      </div>
    </div>
  );
}

export function GlassTHead({ children }: { children: React.ReactNode }) {
  return (
    <thead className="bg-glass-elevated/60 backdrop-blur-sm border-b border-glass-border">
      {children}
    </thead>
  );
}

export function GlassTH({
  className,
  children,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      scope="col"
      className={cn(
        'px-4 py-3 text-xs font-semibold text-glass-mute uppercase tracking-wider',
        className
      )}
      {...props}
    >
      {children}
    </th>
  );
}

export function GlassTBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-glass-border">{children}</tbody>;
}

export function GlassTR({
  className,
  children,
  onClick,
  ...props
}: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        'transition-colors',
        onClick && 'cursor-pointer hover:bg-glass-elevated/40',
        className
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </tr>
  );
}

export function GlassTD({
  className,
  children,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={cn('px-4 py-3 text-glass-text align-middle', className)} {...props}>
      {children}
    </td>
  );
}
