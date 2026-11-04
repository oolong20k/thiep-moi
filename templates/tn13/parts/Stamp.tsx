import { useS } from '../skin';

/** Con tem viền răng cưa (mask radial-gradient). Dùng làm icon thẻ tiêu đề section và trang trí hero. */
export function Stamp({
  children,
  className,
  style,
}: {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const s = useS();
  return (
    <span className={`${s.stamp} ${className ?? ''}`} style={style}>
      <span className={s.stampInner}>
        {children ?? (
          <svg viewBox="-12 -12 24 24" aria-hidden>
            <polygon fill="var(--butter)" points="0,-10 2.9,-4 9.5,-3.1 4.7,1.5 5.9,8.1 0,5 -5.9,8.1 -4.7,1.5 -9.5,-3.1 -2.9,-4" />
          </svg>
        )}
      </span>
    </span>
  );
}
