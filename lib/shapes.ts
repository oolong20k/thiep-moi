/** Hình khối sinh bằng code. Mọi hàm đều deterministic theo seed để SSR và client ra cùng kết quả (không lệch hydration). */

export function rng(seed: number) {
  let s = (seed * 2654435761) >>> 0 || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const r2 = (n: number) => Math.round(n * 100) / 100;

/** Điểm polygon của starburst trong viewBox -100..100. */
export function burstPoints(points = 14, inner = 0.62, seed = 1, jitter = 0.1) {
  const rand = rng(seed);
  const out: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const r = (i % 2 ? inner : 1) * (1 + (rand() - 0.5) * jitter * 2);
    const a = (i / (points * 2)) * Math.PI * 2;
    out.push(`${r2(Math.cos(a) * r * 100)},${r2(Math.sin(a) * r * 100)}`);
  }
  return out.join(' ');
}

function offsets(rand: () => number, n: number, amp: number) {
  const coarse = Array.from({ length: Math.ceil(n / 4) + 2 }, rand);
  return Array.from({ length: n + 1 }, (_, i) => {
    const f = i / 4;
    const a = Math.floor(f);
    const c = coarse[a] * (1 - (f - a)) + coarse[a + 1] * (f - a);
    return amp * (0.65 * c + 0.35 * rand());
  });
}

/**
 * clip-path polygon() mép giấy xé. `edges` gồm các chữ t/b/l/r = cạnh nào bị xé.
 * ampY/ampX tính theo % chiều cao/rộng của phần tử.
 */
export function tornClip(seed: number, edges = 'b', ampY = 1.4, ampX = 1.4) {
  const rand = rng(seed);
  const N = 44;
  const M = 44;
  const has = (c: string) => edges.includes(c);
  const T = offsets(rand, N, has('t') ? ampY : 0);
  const R = offsets(rand, M, has('r') ? ampX : 0);
  const B = offsets(rand, N, has('b') ? ampY : 0);
  const L = offsets(rand, M, has('l') ? ampX : 0);
  const p: string[] = [];
  const push = (x: number, y: number) => p.push(`${r2(x)}% ${r2(y)}%`);
  for (let i = 0; i <= N; i++) push((i / N) * 100, T[i]);
  for (let j = 1; j <= M; j++) push(100 - R[j], (j / M) * 100);
  for (let i = N; i >= 0; i--) push((i / N) * 100, 100 - B[i]);
  for (let j = M - 1; j >= 1; j--) push(L[j], (j / M) * 100);
  return `polygon(${p.join(',')})`;
}

/** Tham số cho một chiếc mũ bay (giá trị theo khoảng trong CSS gốc TN13). */
export function capParams(i: number, count: number) {
  const rand = rng(i + 11);
  const layer = i % 3; // 0 back, 1 mid, 2 front
  return {
    layer,
    x: r2(((i + 0.5) / count) * 100 + (rand() - 0.5) * 3),
    y: r2(layer * 5 + rand() * 6),
    s: r2(0.7 + layer * 0.14 + rand() * 0.2),
    r0: Math.round((rand() - 0.5) * 50),
    r1: Math.round((rand() < 0.5 ? -1 : 1) * (150 + rand() * 170)),
    dx: Math.round((rand() - 0.5) * 160),
    dy: -Math.round(300 + rand() * 190),
    dl: Math.round(150 + rand() * 60 + (i % 5) * 18),
    du: Math.round(900 + rand() * 300),
    fl: r2(3.2 + rand() * 0.2),
    color: i % 4,
  };
}
