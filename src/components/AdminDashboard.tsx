import { useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { LiquidBackground } from './glass/LiquidBackground';
import { GlassButton } from './glass/GlassButton';
import { AdminTabs, type AdminTab } from './admin/AdminTabs';
import { AdminStats } from './admin/AdminStats';
import { AdminUsers } from './admin/AdminUsers';

interface AdminDashboardProps {
  user: User;
  onBack: () => void;
}

export function AdminDashboard({ user, onBack }: AdminDashboardProps) {
  const [tab, setTab] = useState<AdminTab>('stats');

  return (
    <div className="min-h-screen relative isolate text-glass-text bg-slate-950 font-geist">
      <LiquidBackground />

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8 lg:px-8 safe-pt">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="MechaIA" className="w-10 h-10 object-contain" />
            <div>
              <h1 className="text-xl font-bold text-glass-text">Admin Dashboard</h1>
              <p className="text-xs text-glass-mute">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <GlassButton variant="ghost" onClick={onBack}>
              ← Volver
            </GlassButton>
          </div>
        </div>

        <div className="mb-6">
          <AdminTabs value={tab} onChange={setTab} />
        </div>

        {tab === 'stats' ? <AdminStats /> : <AdminUsers />}
      </div>
    </div>
  );
}
