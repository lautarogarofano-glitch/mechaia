/**
 * Llama a `fn`. Si tira un error con "(429)" o "RESOURCE_EXHAUSTED", espera el
 * tiempo sugerido por la API (parseando "retry in Xs") y reintenta hasta
 * `maxAttempts` veces. Otros errores se propagan inmediatamente.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: { maxAttempts?: number; label?: string; fallbackDelayMs?: number } = {},
): Promise<T> {
  const maxAttempts = opts.maxAttempts ?? 3;
  const label = opts.label ?? 'op';
  const fallbackDelayMs = opts.fallbackDelayMs ?? 30_000;

  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : String(err);
      const is429 = /\(429\)/.test(msg) || /RESOURCE_EXHAUSTED/i.test(msg);
      if (!is429 || attempt === maxAttempts) throw err;

      const retryMatch = msg.match(/retry in ([\d.]+)s/i);
      const delayMs = retryMatch ? Math.ceil(parseFloat(retryMatch[1]) * 1000) + 1500 : fallbackDelayMs;
      process.stdout.write(`\n     ↻ rate-limited (${label}), esperando ${(delayMs / 1000).toFixed(0)}s y reintentando… `);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw lastErr;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
