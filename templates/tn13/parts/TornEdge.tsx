import { tornClip } from '@/lib/shapes';
import { useSkin } from '../skin';

/**
 * Khối giấy có mép xé. `edges`: t/b/l/r. `fringe`: màu xơ giấy lộ ra sau mép xé (lệch seed nên không song song với mép chính).
 * className/style áp lên khối chính; wrapper chỉ có khi có fringe.
 */
export function TornEdge({
  edges = 'b',
  seed = 1,
  ampY = 1.4,
  ampX = 1.4,
  fringe,
  className,
  style,
  wrapClassName,
  children,
}: {
  edges?: string;
  seed?: number;
  ampY?: number;
  ampX?: number;
  fringe?: string;
  className?: string;
  style?: React.CSSProperties;
  wrapClassName?: string;
  children?: React.ReactNode;
}) {
  const { s, skin } = useSkin();
  if (skin === 'brutal') return <div className={className} style={{ position: 'relative', ...style }}>{children}</div>;
  const main = (
    <div className={className} style={{ position: 'relative', ...style, clipPath: tornClip(seed, edges, ampY, ampX) }}>
      {children}
    </div>
  );
  if (!fringe) return main;
  const t = edges.includes('t');
  const b = edges.includes('b');
  return (
    <div className={`${s.fringeWrap} ${wrapClassName ?? ''}`}>
      <div
        aria-hidden
        className={s.fringe}
        style={{
          background: fringe,
          top: t ? 'calc(var(--fr, 6px) * -1)' : 0,
          bottom: b ? 'calc(var(--fr, 6px) * -1)' : 0,
          clipPath: tornClip(seed + 7, edges, ampY * 1.4, ampX),
        }}
      />
      {main}
    </div>
  );
}
