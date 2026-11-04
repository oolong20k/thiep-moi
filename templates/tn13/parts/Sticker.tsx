import { useS } from '../skin';

/** Ảnh cắt nền kiểu sticker: viền cam dày làm bằng các lớp drop-shadow chồng nhau (xem .sticker trong CSS). */
export function Sticker({ src, alt = '', className }: { src: string; alt?: string; className?: string }) {
  const s = useS();
  // eslint-disable-next-line @next/next/no-img-element
  return <img className={`${s.sticker} ${className ?? ''}`} src={src} alt={alt} draggable={false} />;
}
