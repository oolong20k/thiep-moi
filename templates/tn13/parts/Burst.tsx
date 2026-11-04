import { burstPoints } from '@/lib/shapes';

/** Starburst vàng bơ. preserveAspectRatio="none" nên kéo giãn được thành hình elip dẹt phía sau tiêu đề. */
export function Burst({
  points = 14,
  inner = 0.6,
  seed = 1,
  color = 'var(--butter)',
  className,
  style,
}: {
  points?: number;
  inner?: number;
  seed?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg className={className} style={style} viewBox="-105 -105 210 210" preserveAspectRatio="none" aria-hidden>
      <polygon points={burstPoints(points, inner, seed)} fill={color} />
    </svg>
  );
}
