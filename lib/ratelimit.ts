const hits = new Map<string, number[]>();

/** true = bị chặn. In-memory: chỉ đúng với 1 process (bản SQLite/VM). Bản Supabase dùng hàm SQL rate_hit. */
export function limited(key: string, max: number, windowMs: number) {
  const now = Date.now();
  if (hits.size > 5000) for (const [k, v] of hits) if (now - v[v.length - 1] > windowMs) hits.delete(k);
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(key, recent);
  return recent.length > max;
}

export const clientIp = (req: Request) =>
  req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'local';
