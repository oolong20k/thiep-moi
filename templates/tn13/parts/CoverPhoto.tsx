'use client';
import { useState } from 'react';
import type { Tn13Data } from '../schema';

export type CoverTransform = NonNullable<Tn13Data['graduate']['coverTransform']>;
export const DEFAULT_COVER_TRANSFORM: CoverTransform = { zoom: 1, rotation: 0, x: 0, y: 0 };

/** Giữ toàn bộ ảnh gốc để thu nhỏ hoặc kéo lại phần nằm ngoài khung 4:5. */
export function CoverPhoto({ src, alt, transform = DEFAULT_COVER_TRANSFORM }: {
  src: string;
  alt: string;
  transform?: CoverTransform;
}) {
  const [ratio, setRatio] = useState(4 / 5);
  const fill = Math.max(ratio / (4 / 5), (4 / 5) / ratio);
  return (
    <div className="ct-cover-image" style={{ transform: `translate(${transform.x}%, ${transform.y}%) rotate(${transform.rotation}deg) scale(${transform.zoom})` }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} draggable={false}
        onLoad={(e) => setRatio(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight)}
        style={{ objectFit: 'contain', transform: `scale(${fill})` }} />
    </div>
  );
}
