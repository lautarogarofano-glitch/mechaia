import { cn } from '../../lib/utils';

export type AdminTab = 'stats' | 'users';

interface AdminTabsProps {
  value: AdminTab;
  onChange: (value: AdminTab) => void;
}

const TABS: { id: AdminTab; label: string }[] = [
  { id: 'stats', label: 'Estadisticas' },
  { id: 'users', label: 'Usuarios' },
];

export function AdminTabs({ value, onChange }: AdminTabsProps) {
  return (
    <div className="inline-flex p-1 bg-glass-bg backdrop-blur-xl border border-glass-border rounded-2xl shadow-glass">
      {TABS.map((tab) => {
        const active = tab.id === value;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              'px-4 py-1.5 text-sm font-medium rounded-xl transition-all duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-violet/60',
              active
                ? 'bg-glass-elevated text-glass-text border border-glass-border-strong shadow-glass'
                : 'text-glass-mute hover:text-glass-text border border-transparent'
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
