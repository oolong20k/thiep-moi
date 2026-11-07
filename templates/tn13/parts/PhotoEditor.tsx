'use client';
import { useEffect, useRef, useState } from 'react';
import { CoverPhoto, DEFAULT_COVER_TRANSFORM, type CoverTransform } from './CoverPhoto';
import f from '../fields.module.css';

const clamp = (n: number) => Math.max(-100, Math.min(100, n));

export function PhotoEditor({ src, value = DEFAULT_COVER_TRANSFORM, onSave, onCancel }: {
  src: string;
  value?: CoverTransform;
  onSave: (value: CoverTransform) => Promise<void>;
  onCancel: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState({ ...value });
  const [rotating, setRotating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const drag = useRef<{ x: number; y: number; width: number; height: number; value: CoverTransform } | null>(null);
  useEffect(() => {
    const element = dialog.current;
    const previousFocus = document.activeElement;
    element?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      element?.close();
      document.body.style.overflow = previous;
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, []);

  async function save() {
    setSaving(true);
    setError('');
    try { await onSave(draft); }
    catch (e) { setError(e instanceof Error ? e.message : 'Không lưu được ảnh. Anh thử lại nhé.'); setSaving(false); }
  }

  return (
    <dialog ref={dialog} className={f.photoDialog} aria-labelledby="photo-editor-title"
      onCancel={(e) => { e.preventDefault(); if (!saving) onCancel(); }}>
      <header className={f.photoHeader}>
        <h2 id="photo-editor-title">Căn chỉnh ảnh</h2>
        <button type="button" aria-label="Đóng chỉnh ảnh" disabled={saving} onClick={onCancel}>×</button>
      </header>
      <div className={f.photoCanvas}>
        <div className={f.photoViewport} tabIndex={0} aria-label="Kéo ảnh để căn khung; dùng phím mũi tên để di chuyển"
          onKeyDown={(e) => {
            const move = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
            if (!move || saving) return;
            e.preventDefault();
            setDraft((d) => ({ ...d, x: clamp(d.x + move[0]), y: clamp(d.y + move[1]) }));
          }}
          onPointerDown={(e) => {
            if (e.button !== 0 || saving) return;
            const rect = e.currentTarget.getBoundingClientRect();
            drag.current = { x: e.clientX, y: e.clientY, width: rect.width, height: rect.height, value: draft };
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            const d = drag.current;
            if (!d || saving) return;
            setDraft({ ...d.value, x: clamp(d.value.x + (e.clientX - d.x) / d.width * 100), y: clamp(d.value.y + (e.clientY - d.y) / d.height * 100) });
          }}
          onPointerUp={() => { drag.current = null; }}
          onPointerCancel={() => { drag.current = null; }}
          onLostPointerCapture={() => { drag.current = null; }}>
          <CoverPhoto src={src} alt="Ảnh đang căn chỉnh" transform={draft} />
          <div className={f.photoMask} aria-hidden="true"><i /><i /><i /><i /></div>
        </div>
      </div>
      <div className={f.photoTools}>
        <p>Kéo ảnh để căn vừa khung thiệp</p>
        <label className={f.photoZoom}>
          <span aria-hidden="true">−</span>
          <input type="range" aria-label="Thu phóng ảnh" min="0.25" max="3" step="0.01" value={draft.zoom}
            disabled={saving} onChange={(e) => setDraft({ ...draft, zoom: Number(e.target.value) })} />
          <span aria-hidden="true">＋</span>
        </label>
        <div className={f.photoActions}>
          <button type="button" disabled={saving} onClick={() => setDraft((d) => ({ ...d, rotation: (d.rotation + 270) % 360 - 180 }))}>↻ Xoay 90°</button>
          <button type="button" disabled={saving} aria-expanded={rotating} onClick={() => setRotating(!rotating)}>Chỉnh góc</button>
          <button type="button" disabled={saving} onClick={() => setDraft({ ...DEFAULT_COVER_TRANSFORM })}>Đặt lại</button>
        </div>
        {rotating && <label className={f.photoZoom}>
          <span>{draft.rotation}°</span>
          <input type="range" aria-label="Góc xoay ảnh" min="-180" max="180" value={draft.rotation}
            disabled={saving} onChange={(e) => setDraft({ ...draft, rotation: Number(e.target.value) })} />
        </label>}
        {error && <p role="alert">{error}</p>}
      </div>
      <footer className={f.photoFooter}>
        <button type="button" disabled={saving} onClick={onCancel}>Hủy</button>
        <button type="button" disabled={saving} onClick={save}>{saving ? 'Đang lưu…' : 'Lưu ảnh'}</button>
      </footer>
    </dialog>
  );
}
