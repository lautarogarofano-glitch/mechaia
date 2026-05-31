#!/usr/bin/env tsx
/**
 * Aplica la migración de contract_acceptances (tabla + RLS) contra Supabase via PAT.
 * Idempotente (CREATE TABLE/INDEX/POLICY IF NOT EXISTS / DROP+CREATE).
 *
 * Uso: npx tsx scripts/apply-contract-acceptances.ts
 */
import fs from 'fs';
import path from 'path';

const envFile = path.resolve('.env.local');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
    const [key, ...rest] = line.split('=');
    if (key && rest.length) process.env[key.trim()] = rest.join('=').trim();
  }
}

import { runSql, getProjectRef } from './lib/supabase-mgmt';

async function main() {
  const sql = fs.readFileSync(path.resolve('supabase/contract_acceptances.sql'), 'utf8');
  console.log(`Proyecto: ${getProjectRef()}.supabase.co`);
  console.log(`→ supabase/contract_acceptances.sql (${sql.split('\n').length} líneas)`);

  const result = await runSql(sql);
  if (result.ok) {
    console.log('  ✔ Migración aplicada.');
  } else {
    console.error(`  ✗ ERROR: ${result.error}`);
    process.exit(1);
  }

  // Verificación: la tabla existe y devuelve 0 filas.
  const check = await runSql(
    "SELECT count(*)::int AS n, (SELECT relrowsecurity FROM pg_class WHERE relname='contract_acceptances') AS rls FROM contract_acceptances;"
  );
  console.log('  Verificación:', JSON.stringify(check.rows));
}

main().catch((e) => { console.error(e); process.exit(1); });
