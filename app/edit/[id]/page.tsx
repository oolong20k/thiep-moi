'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { TemplateCard, TemplateFields } from '@/templates/ui';
import type { Tn13Data } from '@/templates/tn13/schema';
import { saveCard, tokenFor } from '@/lib/mycards';
import { shrink } from '@/lib/shrink';
import s from './editor.module.css';

type Meta = { slug: string; published: boolean; dirty: boolean };
type Resp = {
  rsvps: { id: number; guestName: string; status: string; note: string }[];
  wishes: { id: number; name: string; message: string; hidden: number }[];
};
const STATUS_LABEL: Record<string, string> = { yes: 'Có mặt', no: 'Vắng mặt', maybe: 'Chưa chắc' };

export default function Editor() {
  const { id } = useParams<{ id: string }>();
  const [token, setToken] = useState<string | null>(null);
  const [data, setData] = useState<Tn13Data | null>(null);
  const [template, setTemplate] = useState('tn13');
  const [meta, setMeta] = useState<Meta | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'unauthorized' | 'error'>('loading');
  const [save, setSave] = useState<'saved' | 'saving' | 'error'>('saved');
  const [tab, setTab] = useState<'edit' | 'preview'>('edit');
  const [resp, setResp] = useState<Resp | null>(null);
  const [copied, setCopied] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [guestText, setGuestText] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const dirtyData = useRef<Tn13Data | null>(null);

  const auth = useCallback((t = token) => ({ authorization: `Bearer ${t}` }), [token]);

  // Token nằm ở hash (#token) nên không lộ qua log server/Referer. Không có hash thì lấy từ localStorage.
  useEffect(() => {
    const t = location.hash.slice(1) || tokenFor(id);
    if (!t) return setState('unauthorized');
    setToken(t);
    fetch(`/api/cards/${id}`, { headers: { authorization: `Bearer ${t}` } })
      .then(async (r) => {
        if (r.status === 401) return setState('unauthorized');
        if (!r.ok) return setState('error');
        const j = await r.json();
        saveCard({ id, slug: j.slug, token: t, createdAt: Date.now() });
        setData(j.draft);
        setGuestText((j.draft?.guests ?? []).join('\n'));
        setTemplate(j.template);
        setMeta({ slug: j.slug, published: j.published, dirty: j.dirty });
        setState('ready');
      })
      .catch(() => setState('error'));
  }, [id]);

  const flush = useCallback(async () => {
    clearTimeout(timer.current);
    const d = dirtyData.current;
    if (!d || !token) return true;
    dirtyData.current = null;
    setSave('saving');
    const r = await fetch(`/api/cards/${id}`, { method: 'PUT', headers: { ...auth(), 'content-type': 'application/json' }, body: JSON.stringify(d) }).catch(() => null);
    if (!r?.ok) {
      dirtyData.current ??= d;
      setSave('error');
      return false;
    }
    const j = await r.json();
    setMeta((m) => m && { ...m, dirty: j.dirty });
    setSave('saved');
    return true;
  }, [id, token, auth]);

  function change(d: Tn13Data) {
    setData(d);
    dirtyData.current = d;
    setSave('saving');
    clearTimeout(timer.current);
    timer.current = setTimeout(flush, 800);
  }

  // Rời trang khi chưa lưu: cảnh báo.
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => dirtyData.current && e.preventDefault();
    addEventListener('beforeunload', h);
    return () => removeEventListener('beforeunload', h);
  }, []);

  async function upload(file: File) {
    const fd = new FormData();
    fd.set('file', await shrink(file));
    const r = await fetch(`/api/cards/${id}/upload`, { method: 'POST', headers: auth(), body: fd });
    if (!r.ok) throw new Error(r.status === 413 ? 'Ảnh quá lớn (tối đa 10MB)' : 'Tải ảnh thất bại, kiểm tra lại file ảnh');
    return r.json();
  }

  async function publish() {
    setPublishing(true);
    if (await flush()) {
      const r = await fetch(`/api/cards/${id}/publish`, { method: 'POST', headers: auth() });
      if (r.ok) setMeta((m) => m && { ...m, published: true, dirty: false });
    }
    setPublishing(false);
  }

  const loadResp = useCallback(async () => {
    if (!token) return;
    const r = await fetch(`/api/cards/${id}/rsvps`, { headers: auth() });
    if (r.ok) setResp(await r.json());
  }, [id, token, auth]);
  useEffect(() => {
    if (state === 'ready' && meta?.published) loadResp();
  }, [state, meta?.published, loadResp]);

  async function toggleWish(wid: number, hidden: boolean) {
    await fetch(`/api/cards/${id}/wishes/${wid}`, { method: 'PATCH', headers: { ...auth(), 'content-type': 'application/json' }, body: JSON.stringify({ hidden }) });
    loadResp();
  }

  const copy = (label: string, text: string) => navigator.clipboard?.writeText(text).then(() => (setCopied(label), setTimeout(() => setCopied(''), 1500)));

  if (state === 'loading') return <div className={`${s.page} ${s.center}`}>Đang tải…</div>;
  if (state !== 'ready' || !data || !meta)
    return (
      <div className={`${s.page} ${s.center}`}>
        <p>{state === 'unauthorized' ? 'Link sửa không đúng hoặc thiếu mã. Hãy mở lại đúng link sửa bạn đã lưu.' : 'Không tải được thiệp, thử lại sau nhé.'}</p>
      </div>
    );

  const origin = typeof location === 'undefined' ? '' : location.origin;
  const publicUrl = `${origin}/t/${meta.slug}`;
  const editUrl = `${origin}/edit/${id}#${token}`;

  const guestList = guestText
    .split(/\r?\n/)
    .map((x) => x.trim().slice(0, 80))
    .filter(Boolean)
    .slice(0, 500);

  function updateGuestText(raw: string) {
    setGuestText(raw);
    if (!data) return;
    const guests = raw
      .split(/\r?\n/)
      .map((x) => x.trim().slice(0, 80))
      .filter(Boolean)
      .slice(0, 500);
    change({ ...data, guests });
  }

  const rsvps = resp?.rsvps ?? [];
  const wishes = resp?.wishes ?? [];
  const norm = (str: string) => str.trim().toLowerCase().replace(/\s+/g, ' ');

  // Ghép trạng thái phản hồi cho từng khách trong danh sách + khách ngoài danh sách (điền qua link chung)
  const rsvpMap = new Map<string, (typeof rsvps)[number]>();
  for (const r of rsvps) {
    if (!rsvpMap.has(norm(r.guestName))) {
      rsvpMap.set(norm(r.guestName), r);
    }
  }

  const plannedSet = new Set(guestList.map(norm));
  const extraRsvps = rsvps.filter((r) => !plannedSet.has(norm(r.guestName)));

  const yesCount = rsvps.filter((r) => r.status === 'yes').length;
  const noCount = rsvps.filter((r) => r.status === 'no').length;
  const maybeCount = rsvps.filter((r) => r.status === 'maybe').length;
  const waitCount = guestList.filter((g) => !rsvpMap.has(norm(g))).length;

  function linkForGuest(guestName: string) {
    return `${publicUrl}?to=${encodeURIComponent(guestName)}`;
  }

  function exportCsv() {
    const esc = (v: string) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows: string[][] = [
      ['STT', 'Tên khách mời', 'Nguồn', 'Trạng thái tham dự', 'Ghi chú RSVP', 'Lời chúc', 'Link thiệp riêng'],
    ];
    const wishByGuest = new Map<string, string>();
    for (const w of wishes) {
      const k = norm(w.name);
      wishByGuest.set(k, wishByGuest.has(k) ? `${wishByGuest.get(k)} | ${w.message}` : w.message);
    }

    let idx = 1;
    for (const g of guestList) {
      const r = rsvpMap.get(norm(g));
      const w = wishByGuest.get(norm(g)) ?? '';
      rows.push([
        String(idx++),
        g,
        'Danh sách mời',
        r ? (STATUS_LABEL[r.status] ?? r.status) : 'Chưa phản hồi',
        r?.note ?? '',
        w,
        linkForGuest(g),
      ]);
    }
    for (const r of extraRsvps) {
      const w = wishByGuest.get(norm(r.guestName)) ?? '';
      rows.push([
        String(idx++),
        r.guestName,
        'Link chung',
        STATUS_LABEL[r.status] ?? r.status,
        r.note ?? '',
        w,
        publicUrl,
      ]);
    }
    // Thêm những người chỉ gửi lời chúc mà chưa gửi RSVP và không nằm trong danh sách
    for (const w of wishes) {
      const k = norm(w.name);
      if (!plannedSet.has(k) && !rsvpMap.has(k)) {
        rows.push([String(idx++), w.name, 'Link chung (Lời chúc)', 'Chưa xác nhận', '', w.message, publicUrl]);
      }
    }

    const csv = '\uFEFF' + rows.map((r) => r.map(esc).join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `danh-sach-khach-moi-${meta?.slug || id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className={s.page}>
      <div className={s.bar}>
        <h1>Chỉnh sửa thiệp</h1>
        <span className={s.status} role="status">
          {save === 'saving' ? 'Đang lưu…' : save === 'error' ? 'Lưu lỗi, đang thử lại khi bạn sửa tiếp' : meta.dirty && meta.published ? 'Đã lưu nháp · chưa xuất bản' : 'Đã lưu'}
        </span>
        <button className={s.btn} onClick={publish} disabled={publishing || (meta.published && !meta.dirty && save === 'saved')}>
          {publishing ? 'Đang xuất bản…' : meta.published ? (meta.dirty ? 'Xuất bản thay đổi' : 'Đã xuất bản') : 'Xuất bản'}
        </button>
      </div>

      <div className={s.notice}>
        <b>Lưu link sửa này (Bí mật):</b>
        <code>{editUrl}</code>
        <button className={s.copy} onClick={() => copy('edit', editUrl)}>
          {copied === 'edit' ? 'Đã chép' : 'Chép'}
        </button>
      </div>
      {meta.published && (
        <div className={s.notice}>
          <b>Link gửi chung (mọi người tự điền tên):</b>
          <a href={publicUrl} target="_blank" rel="noopener noreferrer">
            {publicUrl}
          </a>
          <button className={s.copy} onClick={() => copy('pub', publicUrl)}>
            {copied === 'pub' ? 'Đã chép' : 'Chép link chung'}
          </button>
        </div>
      )}

      <div className={s.tabs} role="tablist">
        <button role="tab" aria-selected={tab === 'edit'} onClick={() => setTab('edit')}>
          Sửa
        </button>
        <button role="tab" aria-selected={tab === 'preview'} onClick={() => setTab('preview')}>
          Xem trước
        </button>
      </div>

      <div className={s.cols}>
        <div className={`${s.form} ${tab === 'preview' ? s.hideMobile : ''}`}>
          {/* Panel Tạo link hàng loạt theo danh sách khách mời & Thống kê phản hồi */}
          <section className={s.panel}>
            <div className={s.panelHead}>
              <h2>Danh sách khách mời & Thống kê tham dự</h2>
              <div className={s.panelActions}>
                {meta.published && (
                  <button type="button" className={s.mini} onClick={loadResp}>
                    Làm mới phản hồi
                  </button>
                )}
                {(guestList.length > 0 || rsvps.length > 0 || wishes.length > 0) && (
                  <button type="button" className={s.mini} onClick={exportCsv}>
                    ⬇ Tải CSV / Excel
                  </button>
                )}
              </div>
            </div>
            <p className={s.sub}>
              Dán danh sách tên khách mời (mỗi dòng 1 tên) để tạo hàng loạt link thiệp mời riêng cho từng người. Nếu gửi <b>Link chung</b>, khách sẽ tự điền tên vào form xác nhận.
            </p>
            <textarea
              className={s.guestTextarea}
              placeholder={'Ví dụ (mỗi dòng 1 tên):\nLê Phương Thảo\nNguyễn Minh Tuấn\nTrần Ngọc Mai'}
              value={guestText}
              onChange={(e) => updateGuestText(e.target.value)}
            />

            <div className={s.statsBar}>
              <span className={s.statBadge}>Tổng danh sách: {guestList.length}</span>
              <span className={`${s.statBadge} ${s.statYes}`}>Có mặt: {yesCount}</span>
              <span className={`${s.statBadge} ${s.statMaybe}`}>Chưa chắc: {maybeCount}</span>
              <span className={`${s.statBadge} ${s.statNo}`}>Vắng mặt: {noCount}</span>
              {guestList.length > 0 && <span className={`${s.statBadge} ${s.statWait}`}>Chưa phản hồi: {waitCount}</span>}
              <span className={s.statBadge}>Lời chúc: {wishes.length}</span>
            </div>

            {guestList.length > 0 && (
              <>
                <div className={s.panelActions} style={{ marginBottom: 8 }}>
                  <button
                    type="button"
                    className={s.copy}
                    onClick={() =>
                      copy(
                        'all-links',
                        guestList.map((g) => `${g}\t${linkForGuest(g)}`).join('\n'),
                      )
                    }
                  >
                    {copied === 'all-links' ? 'Đã chép toàn bộ (Tên + Link)' : 'Chép toàn bộ (dán vào Excel/Sheet)'}
                  </button>
                </div>
                <div className={s.tableWrap}>
                  <table className={s.guestTable}>
                    <thead>
                      <tr>
                        <th className={s.colIdx}>#</th>
                        <th>Khách mời & Link riêng</th>
                        <th className={s.colStatus}>Trạng thái</th>
                        <th className={s.colActions}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {guestList.map((g, i) => {
                        const r = rsvpMap.get(norm(g));
                        const gUrl = linkForGuest(g);
                        const copyKey = `g-${i}`;
                        const msgKey = `m-${i}`;
                        return (
                          <tr key={`${g}-${i}`}>
                            <td className={s.colIdx}>{i + 1}</td>
                            <td className={s.colGuest}>
                              <div className={s.guestName}>{g}</div>
                              <a href={gUrl} target="_blank" rel="noopener noreferrer" className={s.linkCode} title={gUrl}>
                                ?to={g}
                              </a>
                              {r?.note && <div className={s.guestNote}>Ghi chú: {r.note}</div>}
                            </td>
                            <td className={s.colStatus}>
                              {r ? (
                                <span
                                  className={`${s.statBadge} ${
                                    r.status === 'yes' ? s.statYes : r.status === 'no' ? s.statNo : s.statMaybe
                                  }`}
                                >
                                  {STATUS_LABEL[r.status] ?? r.status}
                                </span>
                              ) : (
                                <span className={s.waitLabel}>Chưa phản hồi</span>
                              )}
                            </td>
                            <td className={s.colActions}>
                              <div className={s.rowBtns}>
                                <button type="button" className={s.copy} onClick={() => copy(copyKey, gUrl)}>
                                  {copied === copyKey ? 'Đã chép' : 'Chép link'}
                                </button>
                                <button
                                  type="button"
                                  className={s.copy}
                                  onClick={() =>
                                    copy(
                                      msgKey,
                                      `Thân mời ${g} đến tham dự ${data.ceremony.title || 'Lễ tốt nghiệp'} cùng ${
                                        data.graduate.nickname || data.graduate.fullName
                                      }! Xem thiệp mời dành riêng cho bạn tại: ${gUrl}`,
                                    )
                                  }
                                >
                                  {copied === msgKey ? 'Đã chép lời mời' : 'Chép lời mời'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {extraRsvps.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <b style={{ fontSize: 13 }}>Khách đăng ký thêm qua Link chung ({extraRsvps.length}):</b>
                <ul className={s.resp} style={{ marginTop: 6 }}>
                  {extraRsvps.map((r) => (
                    <li key={r.id}>
                      <span>
                        <b>{r.guestName}</b> · {STATUS_LABEL[r.status]} {r.note && `· ${r.note}`}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {wishes.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <b style={{ fontSize: 13 }}>Lời chúc gửi tới bạn ({wishes.length}):</b>
                <ul className={s.resp} style={{ marginTop: 6 }}>
                  {wishes.map((w) => (
                    <li key={`w${w.id}`} className={w.hidden ? s.hidden : undefined}>
                      <span>
                        💌 <b>{w.name}</b>: {w.message}
                      </span>
                      <button type="button" className={s.mini} onClick={() => toggleWish(w.id, !w.hidden)}>
                        {w.hidden ? 'Hiện' : 'Ẩn'}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <TemplateFields template={template} data={data} onChange={change} upload={upload} />
        </div>
        <div className={`${s.phone} ${tab === 'edit' ? s.hideMobile : ''}`}>
          <TemplateCard template={template} data={data} preview guest={guestList[0]} />
        </div>
      </div>
    </div>
  );
}
