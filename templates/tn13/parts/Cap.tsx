import type React from 'react';

const COLOR_RING = [1, 2, 3, 4, 1, 2, 5, 6, 3, 1, 2, 4] as const;

/** FNV-1a 32-bit hash từ chuỗi tên để cố định vị trí mũ giữa SSR và CSR. */
export function hashSeed(str: string): number {
  let h = 2166136261;
  for (const ch of String(str || 'traothiep')) {
    h ^= ch.codePointAt(0)!;
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

/** Mulberry32 PRNG chuẩn 1:1 với bản gốc TN13. */
export function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t + 1831565813) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const f1 = (n: number) => Number(n.toFixed(1));

export type OpeningCapItem = {
  id: string;
  color: number;
  layer: 'back' | 'mid' | 'front';
  style: React.CSSProperties;
};

/** 14 mũ ở màn mở thiệp (Opening stage). */
export function buildOpeningCaps(seed: number, count = 14): OpeningCapItem[] {
  const rand = mulberry32(seed);
  const out: OpeningCapItem[] = [];
  for (let i = 0; i < count; i += 1) {
    const layer = i % 5 === 0 ? 'back' : i % 3 === 1 ? 'front' : 'mid';
    const color = COLOR_RING[(i + Math.floor(rand() * 3)) % COLOR_RING.length];
    out.push({
      id: `cap-${i}`,
      color,
      layer,
      style: {
        '--x': `${f1(3 + (i * 86) / (count - 1) + (rand() - 0.5) * 3)}%`,
        '--y': `${f1(2 + rand() * 9)}%`,
        '--s': `${f1(((15 + rand() * 11) / 340) * 100)}%`,
        '--r0': `${f1((rand() - 0.5) * 16)}deg`,
        '--r1': `${f1((rand() > 0.5 ? 1 : -1) * (140 + rand() * 220))}deg`,
        '--dx': `${Math.round((rand() - 0.5) * 240)}px`,
        '--dy': `${-Math.round(300 + rand() * 190)}px`,
        '--dl': `${Math.round(rand() * 300)}ms`,
        '--du': `${Math.round(900 + rand() * 320)}ms`,
        '--fl': `${Math.round(2200 + rand() * 1400)}ms`,
        '--tr': `${f1(-40 + rand() * 24)}deg`,
      } as React.CSSProperties,
    });
  }
  return out;
}

export type FrozenCapItem = {
  id: string;
  color: number;
  style: React.CSSProperties;
};

/** Mũ lơ lửng cố định (Hero frame: salt=1, Quote: salt=2, Thanks: salt=3). */
export function buildFrozenCaps(
  seed: number,
  count: number,
  opts: { xMin?: number; xMax?: number; yMin?: number; yMax?: number; sMin?: number; sMax?: number; salt?: number } = {},
): FrozenCapItem[] {
  const { xMin = 0, xMax = 100, yMin = 0, yMax = 100, sMin = 12, sMax = 24, salt = 0 } = opts;
  const rand = mulberry32((seed ^ Math.imul(salt, 2654435769)) >>> 0);
  const out: FrozenCapItem[] = [];
  for (let i = 0; i < count; i += 1) {
    const color = COLOR_RING[(i * 2 + Math.floor(rand() * 4)) % COLOR_RING.length];
    out.push({
      id: `fz-${salt}-${i}`,
      color,
      style: {
        '--x': `${f1(xMin + ((xMax - xMin) * (i + 0.15 + rand() * 0.7)) / count)}%`,
        '--y': `${f1(yMin + rand() * (yMax - yMin))}%`,
        '--s': `${Math.round(sMin + rand() * (sMax - sMin))}px`,
        '--r0': `${f1((rand() - 0.5) * 70)}deg`,
        '--tr': `${f1(-50 + rand() * 40)}deg`,
        '--fl': `${Math.round(2600 + rand() * 1600)}ms`,
      } as React.CSSProperties,
    });
  }
  return out;
}

/** 7 mũ hàng ngang dưới bảng Giờ tung mũ (Ceremony board). */
export function buildBoardCaps(seed: number): FrozenCapItem[] {
  const rand = mulberry32((seed ^ 81) >>> 0);
  return Array.from({ length: 7 }, (_, i) => ({
    id: `bd-${i}`,
    color: COLOR_RING[(i * 3 + Math.floor(rand() * 5)) % COLOR_RING.length],
    style: {
      '--i': i,
      '--r0': `${f1((rand() - 0.5) * 20)}deg`,
    } as React.CSSProperties,
  }));
}

/** Mũ tốt nghiệp nhìn từ trên đỉnh (top-down square mortarboard + tassel). */
export function Cap({
  color = 1,
  className = '',
  style,
}: {
  color?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span className={`ct-cap ct-cap--c${color} ${className}`.trim()} style={style} aria-hidden="true">
      <i className="ct-tassel" />
    </span>
  );
}
