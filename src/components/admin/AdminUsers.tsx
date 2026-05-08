import { useCallback, useEffect, useRef, useState } from 'react';
import { listUsers } from '../../lib/adminApi';
import type { AdminUserRow } from '../../types/admin';
import { UsersTable } from './UsersTable';
import { UserDrawer } from './UserDrawer';

export function AdminUsers() {
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchRows = useCallback(async (q: string) => {
    setLoading(true);
    setError('');
    try {
      const users = await listUsers(q || undefined);
      setRows(users);
    } catch (e: any) {
      setError(e?.message || 'Error desconocido');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchRows(search);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, fetchRows]);

  const handleAfterAction = () => {
    fetchRows(search);
  };

  return (
    <div className="space-y-4">
      <div className="bg-glass-bg backdrop-blur-xl border border-glass-border rounded-2xl shadow-glass px-4 py-3 flex items-center gap-3">
        <svg
          className="w-5 h-5 text-glass-mute shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1 0 6.04 6.04a7.5 7.5 0 0 0 10.61 10.61z"
          />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por email o taller..."
          className="flex-1 bg-transparent text-glass-text placeholder-glass-dim focus:outline-none text-sm"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="text-glass-mute hover:text-glass-text text-sm"
          >
            ✕
          </button>
        )}
      </div>

      <UsersTable
        rows={rows}
        loading={loading}
        error={error}
        onRowClick={setSelectedId}
      />

      {selectedId && (
        <UserDrawer
          userId={selectedId}
          onClose={() => setSelectedId(null)}
          onChanged={handleAfterAction}
        />
      )}
    </div>
  );
}
