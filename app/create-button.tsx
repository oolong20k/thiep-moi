'use client';
import { useState } from 'react';
import { saveCard } from '@/lib/mycards';
import s from './site.module.css';

export function CreateButton({ template }: { template: string }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  async function create() {
    setBusy(true);
    setErr('');
    const r = await fetch('/api/cards', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ template }) }).catch(() => null);
    if (!r?.ok) {
      setErr(r?.status === 429 ? 'Bạn tạo hơi nhiều, thử lại sau nhé.' : 'Chưa tạo được thiệp, thử lại giúp mình nhé.');
      return setBusy(false);
    }
    const { id, slug, editToken } = await r.json();
    saveCard({ id, slug, token: editToken, createdAt: Date.now() });
    location.href = `/edit/${id}#${editToken}`;
  }
  return (
    <>
      <button className={s.btn} onClick={create} disabled={busy}>
        {busy ? 'Đang tạo…' : 'Dùng mẫu này'}
      </button>
      {err && <p role="alert">{err}</p>}
    </>
  );
}
