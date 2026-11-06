'use client';
import { useRef, useState } from 'react';
import type { AlbumLayout, HeroLayout, Tn13Data } from './schema';
import { lastTwo } from './date';
import type { Skin } from './skin';
import f from './fields.module.css';

export type Upload = (file: File) => Promise<{ url: string; hasAlpha: boolean; defaultLayout: HeroLayout }>;

const ALBUM_OPTIONS: readonly ('stack' | 'grid' | 'slider')[] = ['stack', 'grid', 'slider'];

const C = { purple: '#b8cbea', yellow: '#f3dfb5', paper: '#fdf9ed', ink: '#344452' };
const THUMBS: Record<'stack' | 'grid' | 'slider', React.ReactNode> = {
  stack: (
    <>
      <rect width="60" height="70" fill={C.paper} />
      {[
        [10, 10, -10, C.yellow],
        [18, 12, 8, '#e02fdf'],
        [14, 14, -2, C.purple],
      ].map(([x, y, r, c], i) => (
        <g key={i} transform={`rotate(${r} ${Number(x) + 14} ${Number(y) + 18})`}>
          <rect x={x as number} y={y as number} width="28" height="36" rx="4" fill="#fff" stroke={C.ink} strokeWidth="2" />
          <rect x={Number(x) + 3} y={Number(y) + 3} width="22" height="30" rx="2" fill={c as string} />
        </g>
      ))}
    </>
  ),
  grid: (
    <>
      <rect width="60" height="70" fill={C.paper} />
      {[
        [7, 8, C.purple],
        [32, 8, C.yellow],
        [7, 37, '#ff6257'],
        [32, 37, C.purple],
      ].map(([x, y, col], i) => (
        <rect
          key={i}
          x={x as number}
          y={y as number}
          width="21"
          height="25"
          rx="4"
          fill={col as string}
          stroke={C.ink}
          strokeWidth="2"
        />
      ))}
    </>
  ),
  slider: (
    <>
      <rect width="60" height="70" fill={C.paper} />
      <rect x="-6" y="14" width="18" height="40" rx="4" fill={C.yellow} stroke={C.ink} strokeWidth="2" />
      <rect x="16" y="10" width="28" height="48" rx="5" fill={C.purple} stroke={C.ink} strokeWidth="2" />
      <rect x="48" y="14" width="18" height="40" rx="4" fill="#ff6257" stroke={C.ink} strokeWidth="2" />
    </>
  ),
};

const LABELS: Record<'stack' | 'grid' | 'slider', string> = {
  stack: 'Xếp lớp',
  grid: 'Dạng lưới',
  slider: 'Trượt ngang',
};

function normalizeAlbumOption(v: AlbumLayout): 'stack' | 'grid' | 'slider' {
  if (v === 'stack' || v === 'grid' || v === 'slider') return v;
  if (v === 'scatter') return 'stack';
  return 'grid';
}

function Picker({ value, onChange }: { value: AlbumLayout; onChange: (v: AlbumLayout) => void }) {
  const active = normalizeAlbumOption(value);
  return (
    <div className={f.picker} role="radiogroup">
      {ALBUM_OPTIONS.map((o) => (
        <button
          key={o}
          type="button"
          role="radio"
          aria-checked={active === o}
          className={`${f.opt} ${active === o ? f.optOn : ''}`}
          onClick={() => onChange(o)}
        >
          <svg viewBox="0 0 60 70" aria-hidden>
            {THUMBS[o]}
          </svg>
          {LABELS[o]}
        </button>
      ))}
    </div>
  );
}

function Text({
  label,
  value,
  onChange,
  area,
  type = 'text',
  max,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  area?: boolean;
  type?: string;
  max?: number;
  placeholder?: string;
}) {
  const common = {
    value,
    maxLength: max,
    placeholder,
    onChange: (e: React.ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) => onChange(e.target.value),
  };
  return (
    <label className={f.field}>
      <span>{label}</span>
      {area ? <textarea rows={4} {...common} /> : <input type={type} {...common} />}
    </label>
  );
}

function Check({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className={f.check}>
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} /> {label}
    </label>
  );
}

function Group({
  title,
  open,
  visible,
  onVisibleChange,
  children,
}: {
  title: string;
  open?: boolean;
  visible?: boolean;
  onVisibleChange?: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <details className={`${f.group} ${visible === false ? f.groupMuted : ''}`} open={open}>
      <summary className={f.summary}>
        <span className={f.summaryTitle}>{title}</span>
        {onVisibleChange !== undefined && visible !== undefined && (
          <span
            className={f.visToggle}
            role="radiogroup"
            aria-label={`Hiển thị ${title}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <button
              type="button"
              role="radio"
              aria-checked={visible}
              className={`${f.visOpt} ${visible ? f.visOn : ''}`}
              onClick={() => onVisibleChange(true)}
            >
              Hiện
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={!visible}
              className={`${f.visOpt} ${!visible ? f.visOff : ''}`}
              onClick={() => onVisibleChange(false)}
            >
              Ẩn
            </button>
          </span>
        )}
      </summary>
      <div className={f.body}>{children}</div>
    </details>
  );
}

export function Tn13Fields({
  data,
  onChange,
  upload,
}: {
  data: Tn13Data;
  onChange: (d: Tn13Data) => void;
  upload: Upload;
  skin?: Skin;
}) {
  const set = (fn: (d: Tn13Data) => void) => {
    const d = structuredClone(data);
    fn(d);
    onChange(d);
  };
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const coverInput = useRef<HTMLInputElement>(null);
  const albumInput = useRef<HTMLInputElement>(null);

  async function run(files: File[], apply: (r: Awaited<ReturnType<Upload>>) => void) {
    setBusy(true);
    setErr('');
    try {
      for (const file of files) apply(await upload(file));
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Tải ảnh thất bại');
    }
    setBusy(false);
  }

  const g = data.graduate;
  return (
    <div className={f.fields}>
      <Group title="1. Thông tin tân cử nhân" open>
        <Text
          label="Họ tên tân cử nhân"
          value={g.fullName}
          max={80}
          onChange={(v) =>
            set((d) => {
              if (d.graduate.nickname === lastTwo(d.graduate.fullName)) d.graduate.nickname = lastTwo(v);
              d.graduate.fullName = v;
            })
          }
        />
        <Text label="Tên gọi thân mật (hiện lớn)" value={g.nickname} max={40} onChange={(v) => set((d) => (d.graduate.nickname = v))} />
        <Text label="Trường" value={g.school} max={100} onChange={(v) => set((d) => (d.graduate.school = v))} />
        <Text label="Lớp / ngành" value={g.classInfo} max={100} onChange={(v) => set((d) => (d.graduate.classInfo = v))} />
        <Text label="Niên khóa" value={g.year} max={10} onChange={(v) => set((d) => (d.graduate.year = v))} />
        <Text label="Phụ đề dưới tên" value={g.greeting} area max={300} onChange={(v) => set((d) => (d.graduate.greeting = v))} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, alignItems: 'end' }}>
          <label className={f.field}>
            <span>Màu chủ đạo</span>
            <input
              type="color"
              value={g.mainColor ?? '#b8cbea'}
              onChange={(e) => set((d) => (d.graduate.mainColor = e.target.value))}
              style={{ height: 40, padding: 2, cursor: 'pointer' }}
            />
          </label>
          <label className={f.field}>
            <span>Màu nhấn</span>
            <input
              type="color"
              value={g.accentColor ?? '#f3dfb5'}
              onChange={(e) => set((d) => (d.graduate.accentColor = e.target.value))}
              style={{ height: 40, padding: 2, cursor: 'pointer' }}
            />
          </label>
          <button
            type="button"
            className={f.mini}
            style={{ height: 40 }}
            onClick={() =>
              set((d) => {
                d.graduate.mainColor = '#b8cbea';
                d.graduate.accentColor = '#f3dfb5';
              })
            }
          >
            Mặc định
          </button>
        </div>

        <p className={f.hint}>Màu được áp dụng đồng bộ cho phong bì, chữ, nút và nền thiệp.</p>

        <input
          ref={coverInput}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (file) run([file], (r) => set((d) => (d.graduate.coverPhoto = r.url)));
          }}
        />
        <button type="button" className={f.mini} disabled={busy} onClick={() => coverInput.current?.click()}>
          {busy ? 'Đang tải…' : g.coverPhoto ? 'Đổi ảnh đại diện' : 'Tải ảnh đại diện'}
        </button>
      </Group>

      <Group
        title="2. Lời mời & Trích dẫn"
        open
        visible={data.messages.visible !== false}
        onVisibleChange={(v) => set((d) => (d.messages.visible = v))}
      >
        <Text label="Lời mời" value={data.messages.invitation} area max={1200} onChange={(v) => set((d) => (d.messages.invitation = v))} />
        <Text label="Trích dẫn / tâm sự (xuống dòng để tách câu)" value={data.messages.quote} area max={300} onChange={(v) => set((d) => (d.messages.quote = v))} />
        <Text label="Lời nhắn riêng cho khách mời" value={g.guestNote ?? ''} area max={300} onChange={(v) => set((d) => (d.graduate.guestNote = v))} />
        <Text label="Lời cảm ơn cuối thiệp" value={data.messages.thanks} area max={600} onChange={(v) => set((d) => (d.messages.thanks = v))} />
      </Group>

      <Group
        title="3. Thời gian & Địa điểm"
        visible={data.ceremony.visible !== false}
        onVisibleChange={(v) => set((d) => (d.ceremony.visible = v))}
      >
        <Text label="Tiêu đề buổi lễ" value={data.ceremony.title} max={100} onChange={(v) => set((d) => (d.ceremony.title = v))} />
        <Text label="Ngày" type="date" value={data.ceremony.date} onChange={(v) => v && set((d) => (d.ceremony.date = v))} />
        <Text label="Giờ" type="time" value={data.ceremony.time} onChange={(v) => v && set((d) => (d.ceremony.time = v))} />
        <Text label="Giờ kết thúc (không bắt buộc)" type="time" value={data.ceremony.endTime ?? ''} onChange={(v) => set((d) => (d.ceremony.endTime = v))} />
        <Text label="Địa điểm" value={data.ceremony.venueName} max={100} onChange={(v) => set((d) => (d.ceremony.venueName = v))} />
        <Text label="Địa chỉ (dùng cho bản đồ)" value={data.ceremony.address} max={200} onChange={(v) => set((d) => (d.ceremony.address = v))} />
        <Text label="Link Google Maps (https, không bắt buộc)" value={data.ceremony.mapsUrl ?? ''} max={500} onChange={(v) => set((d) => (d.ceremony.mapsUrl = v))} />
      </Group>

      <Group
        title="4. Chương trình buổi lễ"
        visible={data.schedule.visible}
        onVisibleChange={(v) => set((d) => (d.schedule.visible = v))}
      >
        <Text label="Tiêu đề lịch trình" value={data.schedule.title ?? 'Lịch trình buổi lễ'} max={100} onChange={(v) => set((d) => (d.schedule.title = v))} />
        {data.schedule.items.map((it, i) => (
          <div key={i} className={f.row}>
            <input type="time" value={it.time} onChange={(e) => set((d) => (d.schedule.items[i].time = e.target.value))} aria-label="Giờ" />
            <input value={it.content} maxLength={120} onChange={(e) => set((d) => (d.schedule.items[i].content = e.target.value))} aria-label="Nội dung" />
            <button type="button" className={`${f.mini} ${f.danger}`} aria-label="Xoá mốc" onClick={() => set((d) => void d.schedule.items.splice(i, 1))}>
              ×
            </button>
          </div>
        ))}
        <button type="button" className={f.mini} disabled={data.schedule.items.length >= 20} onClick={() => set((d) => void d.schedule.items.push({ time: '16:00', content: '' }))}>
          + Thêm mốc thời gian
        </button>
      </Group>

      <Group
        title="5. Album ảnh kỷ niệm"
        visible={data.album.visible}
        onVisibleChange={(v) => set((d) => (d.album.visible = v))}
      >
        <span className={f.legend}>Kiểu hiển thị album</span>
        <Picker value={data.album.layout} onChange={(v) => set((d) => (d.album.layout = v))} />
        <input
          ref={albumInput}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            const files = [...(e.target.files ?? [])].slice(0, 24);
            e.target.value = '';
            if (files.length) run(files, (r) => set((d) => void (d.album.photos.length < 24 && d.album.photos.push(r.url))));
          }}
        />
        <button type="button" className={f.mini} disabled={busy} onClick={() => albumInput.current?.click()}>
          {busy ? 'Đang tải…' : 'Thêm ảnh'}
        </button>
        <div className={f.thumbs}>
          {data.album.photos.map((src, i) => (
            <div key={src + i} className={f.thumb}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" />
              <div className={f.thumbBtns}>
                <button type="button" aria-label="Dời trước" disabled={i === 0} onClick={() => set((d) => void d.album.photos.splice(i - 1, 0, ...d.album.photos.splice(i, 1)))}>
                  ‹
                </button>
                <button type="button" aria-label="Xoá ảnh" onClick={() => set((d) => void d.album.photos.splice(i, 1))}>
                  ×
                </button>
                <button type="button" aria-label="Dời sau" disabled={i === data.album.photos.length - 1} onClick={() => set((d) => void d.album.photos.splice(i + 1, 0, ...d.album.photos.splice(i, 1)))}>
                  ›
                </button>
              </div>
            </div>
          ))}
        </div>
      </Group>
      {err && <p className={f.err}>{err}</p>}

      <Group
        title="6. Xác nhận tham dự"
        visible={data.interact.visible !== false && data.interact.rsvp}
        onVisibleChange={(v) =>
          set((d) => {
            d.interact.visible = v;
            if (v && !d.interact.rsvp) {
              d.interact.rsvp = true;
            }
          })
        }
      >
        <Check label="Cho khách xác nhận tham dự (RSVP)" value={data.interact.rsvp} onChange={(v) => set((d) => (d.interact.rsvp = v))} />
        <Text label="Lời nhắn phần RSVP" value={data.interact.rsvpNote} area max={300} onChange={(v) => set((d) => (d.interact.rsvpNote = v))} />
      </Group>

      <Group
        title="7. Câu hỏi thường gặp (FAQ)"
        visible={data.faq.visible}
        onVisibleChange={(v) => set((d) => (d.faq.visible = v))}
      >
        {data.faq.items.map((it, i) => (
          <div key={i} className={`${f.row} ${f.qa}`}>
            <div className={f.field}>
              <input value={it.q} maxLength={120} placeholder="Câu hỏi" onChange={(e) => set((d) => (d.faq.items[i].q = e.target.value))} />
              <textarea rows={2} value={it.a} maxLength={400} placeholder="Trả lời" onChange={(e) => set((d) => (d.faq.items[i].a = e.target.value))} />
            </div>
            <button type="button" className={`${f.mini} ${f.danger}`} aria-label="Xoá câu hỏi" onClick={() => set((d) => void d.faq.items.splice(i, 1))}>
              ×
            </button>
          </div>
        ))}
        <button type="button" className={f.mini} disabled={data.faq.items.length >= 12} onClick={() => set((d) => void d.faq.items.push({ q: '', a: '' }))}>
          + Thêm câu hỏi
        </button>
      </Group>

      <Group
        title="8. Nhạc nền"
        visible={data.music.visible !== false}
        onVisibleChange={(v) => set((d) => (d.music.visible = v))}
      >
        <Text label="Link nhạc nền (YouTube hoặc file .mp3)" value={data.music.url} max={500} onChange={(v) => set((d) => (d.music.url = v))} />
        <p className={f.hint}>Dán link YouTube hoặc link file nhạc https. Để trống nếu không dùng nhạc. Nhạc phát sau khi khách bấm &ldquo;Mở thiệp&rdquo;.</p>
      </Group>
    </div>
  );
}
