'use client';
import { useEffect, useRef, useState } from 'react';
import type { AlbumLayout, Tn13Data } from './schema';
import { dateParts, initialsOf, monthGrid, targetMs } from './date';
import { buildBoardCaps, buildFrozenCaps, hashSeed } from './parts/Cap';
import { SectionTag } from './parts/SectionTag';

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || '';

const paras = (t: string) =>
  String(t || '')
    .split(/\n+/)
    .map((x) => x.trim())
    .filter(Boolean);

/* ───────────── Hero ───────────── */

export function Hero({ data, guest, textOnly = false }: { data: Tn13Data; guest?: string; textOnly?: boolean }) {
  const g = data.graduate;
  const c = data.ceremony;
  const displayName = g.nickname || g.fullName || '';
  const seed = hashSeed(displayName || 'traothiep');
  const frameCaps = buildFrozenCaps(seed, 5, { xMin: 2, xMax: 98, yMin: -6, yMax: 24, sMin: 14, sMax: 22, salt: 1 }).map((cap, idx) => {
    const rawX = parseFloat(String((cap.style as Record<string, string>)['--x'] ?? '50'));
    const rawY = parseFloat(String((cap.style as Record<string, string>)['--y'] ?? '0'));
    // Tránh đặt mũ đè vào vùng mặt nhân vật ở chính giữa khung ảnh (x: 24%..76%, y > 2%)
    const safeY = idx >= 2 && rawX > 24 && rawX < 76 && rawY > 2 ? `${-(2 + (rawY % 5)).toFixed(1)}%` : (cap.style as Record<string, string>)['--y'];
    return {
      ...cap,
      style: { ...cap.style, '--y': safeY } as React.CSSProperties,
    };
  });
  const initials = initialsOf(displayName);
  const hasMeta = Boolean(g.school || g.classInfo || g.year);
  const guestNote = g.guestNote ?? 'Hẹn bạn ở sảnh chính của trường, tụi mình chụp thật nhiều hình kỷ niệm nha!';

  return (
    <section className="ct-hero">
      <div className="ct-col">
        {!textOnly && <>
          <div className="ct-kicker reveal-piece" style={{ '--piece-delay': '20ms' } as React.CSSProperties}>
            <i className="ct-kicker-line" aria-hidden="true" />
            <span className="ct-kicker-pill">Ngày tốt nghiệp của mình</span>
            <i className="ct-kicker-line" aria-hidden="true" />
          </div>

          <p className="ct-hero-title reveal-piece" style={{ '--piece-delay': '60ms' } as React.CSSProperties}>
            {c.title || 'Lễ tốt nghiệp'}
          </p>

          {(g.coverPhoto || initials) && (
            <div
              className={`ct-frame reveal-piece ${g.coverPhoto ? 'has-photo' : ''}`.trim()}
              style={{ '--piece-delay': '120ms' } as React.CSSProperties}
            >
              {frameCaps.map((cap, idx) => (
                <span
                  key={cap.id}
                  className={`ct-cap ct-frame-cap ct-cap--c${cap.color} ${idx < 2 ? 'is-back' : 'is-front'}`}
                  style={cap.style}
                  aria-hidden="true"
                >
                  <i className="ct-tassel" />
                </span>
              ))}
              <figure className="ct-hero-photo">
                {g.coverPhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={g.coverPhoto} alt={displayName} />
                ) : (
                  <span className="ct-hero-initials" aria-hidden="true">
                    {initials}
                  </span>
                )}
              </figure>
              <span className="ct-frame-tab">Tân cử nhân</span>
            </div>
          )}

        </>}

        <div className="ct-hero-text reveal-piece" style={{ '--piece-delay': '180ms' } as React.CSSProperties}>
          {displayName && (textOnly ? <h2 className="ct-hero-name">{displayName}</h2> : <h1 className="ct-hero-name">{displayName}</h1>)}
          {g.greeting && <p className="ct-hero-sub">{g.greeting}</p>}
        </div>

        {hasMeta && (
          <dl className="ct-meta reveal-piece" style={{ '--piece-delay': '240ms' } as React.CSSProperties}>
            {g.school && (
              <div className="ct-meta-item ct-meta-item--wide">
                <dt>Trường</dt>
                <dd data-text-style-key="heroSchoolName">{g.school}</dd>
              </div>
            )}
            {g.classInfo && (
              <div className="ct-meta-item">
                <dt>Lớp</dt>
                <dd data-text-style-key="heroClassName">{g.classInfo}</dd>
              </div>
            )}
            {g.year && (
              <div className="ct-meta-item">
                <dt>Niên khóa</dt>
                <dd data-text-style-key="heroYear">{g.year}</dd>
              </div>
            )}
          </dl>
        )}

        {guest && (
          <div className="ct-note ct-hero-note reveal-piece" style={{ '--piece-delay': '300ms' } as React.CSSProperties}>
            <span className="ct-note-label">Thân mời</span>
            <strong className="ct-note-name">{guest}</strong>
            {guestNote && <small className="ct-note-text">{guestNote}</small>}
          </div>
        )}
      </div>
    </section>
  );
}

/* ───────────── 01 Lời mời ───────────── */

export function Invite({ data, num }: { data: Tn13Data; num: string }) {
  const lines = paras(data.messages.invitation);
  const personal = data.messages.guestPersonalNote?.trim();
  if (!data.graduate.fullName && !lines.length && !personal) return null;
  return (
    <section className="ct-section ct-intro reveal">
      <div className="ct-col">
        <SectionTag num={num} label="Lời mời" />
        <div className="ct-card ct-introcard reveal-piece">
          {data.graduate.fullName && (
            <p className="ct-intro-from">
              <span className="ct-intro-from-label">Người mời</span>
              <strong className="ct-intro-host">{data.graduate.fullName}</strong>
            </p>
          )}
          {lines.length > 0 && (
            <div className="ct-intro-body">
              {lines.map((line, i) => (
                <p key={i} className="ct-intro-line">
                  {line}
                </p>
              ))}
            </div>
          )}
          {personal && (
            <div className="ct-note ct-intro-guest">
              <span className="ct-note-label">Nhắn riêng bạn</span>
              <p className="ct-intro-guest-text">{personal}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ───────────── 02 Khoảnh khắc (stack / grid / slider + Lightbox) ───────────── */

function normalizeAlbumLayout(layout: AlbumLayout): 'stack' | 'grid' | 'slider' {
  if (layout === 'grid' || layout === 'slider' || layout === 'stack') return layout;
  if (layout === 'scatter') return 'stack';
  return 'grid';
}

function stackStyleFor(index: number, count: number): React.CSSProperties {
  const mid = (count - 1) / 2;
  const diff = index - mid;
  const abs = Math.abs(diff);
  const rot = [-9, 7, -5, 4, 0, -4, 5, -7, 9][index] || 0;
  const scale = 1 - Math.min(abs * 0.075, 0.34);
  const opacity = 1 - Math.min(abs * 0.14, 0.58);
  const blur = Math.min(abs * 0.55, 2.4);
  const x = diff * 42;
  const y = abs * 9;
  return {
    '--album-x': `${x}px`,
    '--album-y': `${y}px`,
    '--album-rotate': `${rot}deg`,
    '--album-hover-rotate': `${rot * 0.45}deg`,
    '--album-scale': scale,
    '--album-hover-scale': scale + 0.05,
    '--album-opacity': opacity,
    '--album-blur': `${blur}px`,
    '--album-z': Math.round(100 - abs * 10),
  } as React.CSSProperties;
}

export function Album({
  data,
  layout,
  num,
  onLightboxChange,
}: {
  data: Tn13Data;
  layout: AlbumLayout;
  num: string;
  onLightboxChange?: (open: boolean) => void;
}) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const photos = data.album.photos.filter(Boolean);
  const mode = normalizeAlbumLayout(layout);
  const stackPhotos = photos.slice(0, 9);
  const gridPhotos = photos.slice(0, 4);
  const moreCount = Math.max(photos.length - 4, 0);

  const openAt = (i: number) => {
    setOpenIdx(i);
    onLightboxChange?.(true);
  };
  const close = () => {
    setOpenIdx(null);
    onLightboxChange?.(false);
  };

  useEffect(() => {
    if (openIdx === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') setOpenIdx((i) => (i === null ? null : (i + 1) % photos.length));
      if (e.key === 'ArrowLeft') setOpenIdx((i) => (i === null ? null : (i - 1 + photos.length) % photos.length));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openIdx, photos.length]);

  if (!photos.length) return null;

  return (
    <section className="ct-section ct-album reveal">
      <div className="ct-col">
        <SectionTag num={num} label="Khoảnh khắc" />
        <div className="ct-card ct-albumcard reveal-piece">
          <section className={`wedding-album wedding-album--${mode}`}>
            {mode === 'stack' && (
              <div className="wedding-album__stack">
                {stackPhotos.map((src, i) => (
                  <button
                    key={`${src}-${i}`}
                    type="button"
                    className="wedding-album__photo wedding-album__photo--stack"
                    data-no-autoscroll-toggle=""
                    style={stackStyleFor(i, stackPhotos.length)}
                    onClick={() => openAt(i)}
                    aria-label={`Xem ảnh ${i + 1}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" loading="eager" decoding="async" />
                  </button>
                ))}
              </div>
            )}

            {mode === 'grid' && (
              <div className="wedding-album__grid">
                {gridPhotos.map((src, i) => (
                  <button
                    key={`${src}-${i}`}
                    type="button"
                    className="wedding-album__photo wedding-album__photo--grid"
                    data-no-autoscroll-toggle=""
                    onClick={() => openAt(i)}
                    aria-label={`Xem ảnh ${i + 1}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" loading="lazy" decoding="async" />
                    {i === 3 && moreCount > 0 && (
                      <span className="wedding-album__more">
                        <small>+{moreCount}</small>
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {mode === 'slider' && (
              <div className="wedding-album__slider">
                {photos.map((src, i) => (
                  <button
                    key={`${src}-${i}`}
                    type="button"
                    className="wedding-album__photo wedding-album__photo--slide"
                    data-no-autoscroll-toggle=""
                    onClick={() => openAt(i)}
                    aria-label={`Xem ảnh ${i + 1}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" loading="lazy" decoding="async" />
                  </button>
                ))}
              </div>
            )}

            <p className="wedding-album__caption">Chạm vào ảnh để xem lớn.</p>
          </section>
        </div>
      </div>

      {openIdx !== null && photos[openIdx] && (
        <div
          className="image-lightbox"
          role="dialog"
          aria-modal="true"
          data-no-autoscroll-toggle=""
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <button type="button" className="lightbox-close" aria-label="Đóng" onClick={close}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
          {photos.length > 1 && (
            <button
              type="button"
              className="lightbox-nav is-prev"
              aria-label="Ảnh trước"
              onClick={() => setOpenIdx((openIdx - 1 + photos.length) % photos.length)}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
          )}
          <figure>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photos[openIdx]} alt="" />
            {photos.length > 1 && (
              <figcaption>
                {openIdx + 1} / {photos.length}
              </figcaption>
            )}
          </figure>
          {photos.length > 1 && (
            <button
              type="button"
              className="lightbox-nav is-next"
              aria-label="Ảnh tiếp theo"
              onClick={() => setOpenIdx((openIdx + 1) % photos.length)}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          )}
        </div>
      )}
    </section>
  );
}

/* ───────────── 03 Một câu muốn nói ───────────── */

export function Quote({ data, num }: { data: Tn13Data; num: string }) {
  const lines = paras(data.messages.quote);
  if (!lines.length) return null;
  const displayName = data.graduate.nickname || data.graduate.fullName || '';
  const seed = hashSeed(displayName || 'traothiep');
  const quoteCaps = buildFrozenCaps(seed, 4, { xMin: 62, xMax: 96, yMin: 8, yMax: 26, sMin: 10, sMax: 18, salt: 2 });
  const cite = [displayName, data.graduate.year].filter(Boolean).join(' · ');

  return (
    <section className="ct-section ct-quote reveal">
      <div className="ct-col">
        <SectionTag num={num} label="Một câu muốn nói" />
        <div className="ct-ink ct-quotebox reveal-piece">
          {quoteCaps.map((cap) => (
            <span key={cap.id} className={`ct-cap ct-frozen ct-cap--c${cap.color}`} style={cap.style} aria-hidden="true">
              <i className="ct-tassel" />
            </span>
          ))}
          <span className="ct-quote-label">Nói nhỏ thôi</span>
          {lines.map((line, i) => (
            <p key={i} className="ct-quote-line">
              {line}
            </p>
          ))}
          {cite && <p className="ct-quote-cite">{cite}</p>}
        </div>
      </div>
    </section>
  );
}

/* ───────────── 04 Mời bạn vào lúc: bảng + đếm ngược + lịch ───────────── */

function useNow() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function CountdownBox({ target }: { target: number }) {
  const now = useNow();
  const left = now === null ? null : Math.max(0, target - now);
  if (left !== null && left <= 0) {
    return <p className="ct-card ct-count-done">Đã tới giờ hẹn rồi!</p>;
  }
  const vals =
    left === null
      ? ['--', '--', '--', '--']
      : [Math.floor(left / 864e5), Math.floor(left / 36e5) % 24, Math.floor(left / 6e4) % 60, Math.floor(left / 1e3) % 60].map(String);

  return (
    <div className="countdown ct-countdown" role="timer" aria-label="Đếm ngược tới giờ hẹn">
      {['Ngày', 'Giờ', 'Phút', 'Giây'].map((label, i) => (
        <div key={label} className="countdown-box">
          <strong>{vals[i]}</strong>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

export function Ceremony({ data, num, compact = false }: { data: Tn13Data; num: string; compact?: boolean }) {
  const c = data.ceremony;
  const d = dateParts(c.date);
  const grid = monthGrid(c.date);
  const displayName = data.graduate.nickname || data.graduate.fullName || '';
  const boardCaps = buildBoardCaps(hashSeed(displayName || 'traothiep'));
  const boardTime = c.time ? `${c.time}${c.endTime ? ` – ${c.endTime}` : ''}` : '';

  return (
    <section className="ct-section ct-party reveal">
      <div className="ct-col">
        <SectionTag num={num} label="Mời bạn vào lúc" />
        <div className={`ct-card ct-board reveal-piece ${boardTime ? 'has-right' : ''} ${c.date ? 'has-left' : ''}`.trim()}>
          {c.title && <h2 className="ct-board-title">{c.title}</h2>}
          <div className="ct-board-grid">
            <div className={`ct-board-cell ct-board-left ${!boardTime ? 'ct-board-cell--wide' : ''}`.trim()}>
              <span className="ct-board-head">Ngày</span>
              <b className="ct-board-day">{d.dd}</b>
              <span className="ct-board-month">
                Tháng {d.m} · {d.y}
              </span>
              <span className="ct-board-weekday">{d.weekday}</span>
            </div>
            {boardTime && (
              <div className="ct-board-cell ct-board-right">
                <span className="ct-board-head">Giờ</span>
                <b className="ct-board-time">{boardTime}</b>
              </div>
            )}
            {c.venueName && (
              <div className="ct-board-cell ct-board-venue ct-board-cell--wide">
                <span className="ct-board-head">Địa điểm</span>
                <span className="ct-board-v">{c.venueName}</span>
              </div>
            )}
          </div>
          <div className="ct-board-caps" aria-hidden="true">
            {boardCaps.map((cap) => (
              <span key={cap.id} className={`ct-cap ct-board-cap ct-cap--c${cap.color}`} style={cap.style}>
                <i className="ct-tassel" />
              </span>
            ))}
          </div>
        </div>

        {!compact && (
          <div className="ct-countwrap reveal-piece">
            <p className="ct-count-title">Đếm ngược tới giờ hẹn</p>
            <CountdownBox target={targetMs(c.date, c.time)} />
          </div>
        )}

        <div className="ct-card ct-calendar reveal-piece">
          <div className="mini-calendar">
            <header>
              <span>Tháng {d.m}</span>
              <strong>Năm {d.y}</strong>
            </header>
            <div className="calendar-grid">
              {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((w) => (
                <span key={w} className="weekday">
                  {w}
                </span>
              ))}
              {grid.map((n, i) =>
                n === null ? (
                  <span key={i} />
                ) : (
                  <span key={i} className={`day ${n === d.d ? 'is-wedding' : ''}`.trim()}>
                    {n}
                  </span>
                ),
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────── 05 Lịch trình ───────────── */

export function Timeline({ data, num }: { data: Tn13Data; num: string }) {
  const items = data.schedule.items.filter((it) => it && (it.time.trim() || it.content.trim()));
  if (!items.length) return null;
  const times = items.map((it) => it.time.trim()).filter(Boolean);
  const range = times.length > 1 ? `${times[0]} – ${times[times.length - 1]}` : times[0] || '';
  const meta = [`${items.length} mốc`, range].filter(Boolean).join(' · ');

  return (
    <section className="ct-section ct-timeline reveal">
      <div className="ct-col">
        <SectionTag num={num} label="Lịch trình" />
        <div className="ct-card ct-run">
          <div className="ct-run-head reveal-piece">
            <h2 className="ct-run-title">{data.schedule.title?.trim() || 'Lịch trình buổi lễ'}</h2>
            {meta && <span className="ct-run-meta">{meta}</span>}
          </div>
          <ol className="ct-cord">
            <i className="ct-cord-line reveal-piece" aria-hidden="true" />
            {items.map((it, idx) => {
              const isLast = idx === items.length - 1;
              return (
                <li
                  key={idx}
                  className={`ct-knot reveal-piece ${isLast ? 'is-last' : ''}`.trim()}
                  style={{ '--piece-delay': `${120 + idx * 70}ms` } as React.CSSProperties}
                >
                  <i className="ct-knot-dot" aria-hidden="true">
                    {isLast && <i className="ct-tassel" />}
                  </i>
                  <div className="ct-knot-when">
                    {it.time ? (
                      <time className="ct-knot-time">{it.time}</time>
                    ) : (
                      <span className="ct-knot-time ct-knot-time--blank" aria-hidden="true" />
                    )}
                  </div>
                  <div className="ct-knot-body">
                    <strong className="ct-knot-title">{it.content}</strong>
                    {it.description && <p className="ct-knot-desc">{it.description}</p>}
                  </div>
                  <b className="ct-knot-no">{String(idx + 1).padStart(2, '0')}</b>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}

/* ───────────── 06 Đường đến ───────────── */

export function MapSection({ data, num }: { data: Tn13Data; num: string }) {
  const c = data.ceremony;
  if (!c.address && !c.venueName && !c.mapsUrl) return null;
  const q = encodeURIComponent(c.address || c.venueName);
  const linkUrl = c.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${q}`;

  return (
    <section className="ct-section ct-map reveal">
      <div className="ct-col">
        <SectionTag num={num} label="Đường đến" />
        <div className="ct-card ct-mapcard reveal-piece">
          <div className="ct-map-head">
            <i className="ct-map-pin" aria-hidden="true" />
            <div className="ct-map-text">
              {c.venueName && <h2 className="ct-map-venue">{c.venueName}</h2>}
              {c.address && <p className="ct-map-address">{c.address}</p>}
            </div>
          </div>
          <div className="ct-mapframe">
            <div className="map-embed">
              <iframe
                title="Bản đồ"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://maps.google.com/maps?q=${q}&output=embed`}
              />
              <a className="map-link" href={linkUrl} target="_blank" rel="noreferrer">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polygon points="3 11 22 2 13 21 11 13 3 11" />
                </svg>{' '}
                Chỉ đường
              </a>
            </div>
          </div>
          <p className="ct-map-hint">Chạm bản đồ để mở chỉ đường.</p>
        </div>
      </div>
    </section>
  );
}

/* ───────────── 07 Bạn đến chứ? (RSVP) ───────────── */

type Status = 'yes' | 'no' | 'maybe';
const STATUS_OPTIONS: [Status, string][] = [
  ['yes', 'Có mặt'],
  ['no', 'Vắng mặt'],
  ['maybe', 'Chưa chắc'],
];

export function Rsvp({ data, slug, guest, num }: { data: Tn13Data; slug?: string; guest?: string; num: string }) {
  const [status, setStatus] = useState<Status>('yes');
  const [name, setName] = useState(guest ?? '');
  const [note, setNote] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');

  useEffect(() => {
    if (guest !== undefined) setName(guest);
  }, [guest]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setState('busy');
    if (!slug) return setState('done');
    const r = await fetch(`${BASE}/api/t/${slug}/rsvp`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ guestName: name, status, note }),
    }).catch(() => null);
    setState(r?.ok ? 'done' : 'error');
  }

  return (
    <section className="ct-section ct-rsvp reveal" data-no-autoscroll-toggle="">
      <div className="ct-col">
        <SectionTag num={num} label="Bạn đến chứ?" />
        <div className="ct-card ct-formcard ct-rsvpcard reveal-piece">
          <h2 className="ct-form-title">Bạn đến chứ?</h2>
          <p className="ct-form-msg">
            {data.interact.rsvpNote || 'Bạn ghé được thì nhắn mình một tiếng nha, để mình biết đường đón bạn!'}
          </p>
          {state === 'done' ? (
            <div className="rsvp-confirmed">
              <span className="confirmed-mark">✓</span>
              <h4>Mình nhận được rồi, cảm ơn bạn nhé!</h4>
              <p>Hẹn gặp bạn ở buổi lễ tốt nghiệp.</p>
              <button type="button" className="change-button" onClick={() => setState('idle')}>
                Đổi phản hồi
              </button>
            </div>
          ) : (
            <form className="rsvp-form" onSubmit={submit}>
              <div className="rsvp-options" role="radiogroup" aria-label="Trạng thái tham dự">
                {STATUS_OPTIONS.map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    role="radio"
                    aria-checked={status === val}
                    className={status === val ? 'is-active' : ''}
                    onClick={() => setStatus(val)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <input
                className="form-input"
                placeholder="Tên của bạn"
                maxLength={80}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              {slug && (
                <input
                  className="form-input"
                  placeholder="Ghi chú (không bắt buộc)"
                  maxLength={300}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              )}
              <button type="submit" className="base-button" disabled={state === 'busy'}>
                Gửi xác nhận
              </button>
              {state === 'error' && <p className="ct-form-err">Chưa gửi được, bạn thử lại giúp mình nhé.</p>}
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

/* ───────────── 08 Lời chúc ───────────── */

type Wish = { id: number | string; name: string; message: string };

export function Wishes({ slug, guest, num }: { slug?: string; guest?: string; num: string }) {
  const [list, setList] = useState<Wish[]>([]);
  const [name, setName] = useState(guest ?? '');
  const [msg, setMsg] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'error'>('idle');

  useEffect(() => {
    if (guest !== undefined) setName(guest);
  }, [guest]);

  useEffect(() => {
    if (!slug) return;
    fetch(`${BASE}/api/t/${slug}/wishes`)
      .then((r) => r.json())
      .then((j) => setList(j.wishes ?? []))
      .catch(() => {});
  }, [slug]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !msg.trim()) return;
    setState('busy');
    if (slug) {
      const r = await fetch(`${BASE}/api/t/${slug}/wishes`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, message: msg }),
      }).catch(() => null);
      if (!r?.ok) return setState('error');
    }
    setList((l) => [{ id: Date.now(), name, message: msg }, ...l]);
    setMsg('');
    setState('idle');
  }

  return (
    <section className="ct-section ct-wishes reveal" data-no-autoscroll-toggle="">
      <div className="ct-col">
        <SectionTag num={num} label="Lời chúc" />
        <div className="ct-card ct-formcard ct-wishcard reveal-piece">
          <h2 className="ct-form-title">Gửi một lời chúc</h2>
          {list.length === 0 && <p className="ct-form-msg ct-wish-empty">Chưa có lời chúc nào. Bạn mở hàng nhé!</p>}
          <form className="wish-form" onSubmit={submit}>
            <input
              className="form-input"
              placeholder="Tên của bạn"
              maxLength={60}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <textarea
              className="form-textarea"
              placeholder="Đôi dòng gửi tân cử nhân"
              maxLength={300}
              rows={3}
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              required
            />
            <button type="submit" className="base-button" disabled={state === 'busy'}>
              Gửi lời chúc
            </button>
            {state === 'error' && <p className="ct-form-err">Chưa gửi được, bạn thử lại giúp mình nhé.</p>}
          </form>
          {list.length > 0 && (
            <div className="wish-list" style={{ marginTop: 14 }}>
              {list.map((w) => (
                <div key={w.id} className="wish-card">
                  <strong>{w.name}</strong>
                  <p>{w.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ───────────── 09 Quà mừng + Modal VietQR ───────────── */

const BANK_NAMES: Record<string, string> = {
  VCB: 'Ngân hàng TMCP Ngoại thương Việt Nam',
  Vietcombank: 'Ngân hàng TMCP Ngoại thương Việt Nam',
  TCB: 'Ngân hàng TMCP Kỹ thương Việt Nam',
  Techcombank: 'Ngân hàng TMCP Kỹ thương Việt Nam',
  MB: 'Ngân hàng TMCP Quân đội',
  MBBank: 'Ngân hàng TMCP Quân đội',
  ACB: 'Ngân hàng TMCP Á Châu',
  BIDV: 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam',
  CTG: 'Ngân hàng TMCP Công thương Việt Nam',
  VietinBank: 'Ngân hàng TMCP Công thương Việt Nam',
  TPB: 'Ngân hàng TMCP Tiên Phong',
  VPB: 'Ngân hàng TMCP Việt Nam Thịnh Vượng',
};

export function Gift({
  data,
  num,
  onModalChange,
}: {
  data: Tn13Data;
  num: string;
  onModalChange?: (open: boolean) => void;
}) {
  const g = data.gift;
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const modalRef = useRef<HTMLElement>(null);

  const toggleModal = (next: boolean) => {
    setOpen(next);
    onModalChange?.(next);
  };

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        toggleModal(false);
      }
    };
    window.addEventListener('keydown', onKey);
    modalRef.current?.focus();
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!g.accountNumber && !g.accountName && !g.note) return null;

  const title = g.title?.trim() || 'Quà mừng tốt nghiệp';
  const bankLabel = g.bankName?.trim() || BANK_NAMES[g.bank.trim()] || g.bank;
  const cleanAcc = g.accountNumber.replace(/\s+/g, '');
  const displayName = data.graduate.nickname || data.graduate.fullName || '';
  const addInfo = displayName ? `Mung tot nghiep ${displayName}` : 'Mung tot nghiep';
  const qrUrl =
    g.bank && cleanAcc
      ? `https://img.vietqr.io/image/${encodeURIComponent(g.bank.trim())}-${encodeURIComponent(cleanAcc)}-compact2.png?accountName=${encodeURIComponent(g.accountName)}&addInfo=${encodeURIComponent(addInfo)}`
      : '';

  return (
    <>
      <section className="ct-section ct-gift reveal" data-no-autoscroll-toggle="">
        <div className="ct-col">
          <SectionTag num={num} label="Quà mừng" />
          <div className="ct-fill ct-giftbox reveal-piece">
            <span className="ct-cap ct-gift-cap ct-cap--c6" aria-hidden="true">
              <i className="ct-tassel" />
            </span>
            <h2 className="ct-gift-title">{title}</h2>
            {g.note && <p className="ct-gift-note">{g.note}</p>}
            <button type="button" className="ct-key" onClick={() => toggleModal(true)}>
              <span className="ct-key-text">Xem tài khoản</span>
            </button>
          </div>
        </div>
      </section>

      {open && (
        <div
          className="ct-modal-bg"
          data-no-autoscroll-toggle=""
          onClick={(e) => {
            if (e.target === e.currentTarget) toggleModal(false);
          }}
        >
          <section
            ref={modalRef}
            className="ct-modal ct-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ct-modal-title"
            tabIndex={-1}
          >
            <button type="button" className="ct-modal-close" aria-label="Đóng" onClick={() => toggleModal(false)}>
              <span aria-hidden="true" />
            </button>
            <h3 id="ct-modal-title" className="ct-modal-title">
              {title}
            </h3>
            <p className="ct-modal-hint">Bạn có mặt đã là món quà lớn nhất. Quét mã nếu muốn gửi thêm chút lòng.</p>
            <div className="ct-bank-list">
              <article className="ct-bank-item">
                <div className="ct-bank-info">
                  {bankLabel && <span className="ct-bank-name">{bankLabel}</span>}
                  {g.accountName && <span className="ct-bank-holder">{g.accountName}</span>}
                  {g.accountNumber && (
                    <div className="ct-bank-number-row">
                      <b className="ct-bank-number">{g.accountNumber}</b>
                      <button
                        type="button"
                        className="ct-btn ct-btn--outline"
                        onClick={() => {
                          navigator.clipboard?.writeText(cleanAcc).then(() => {
                            setCopied(true);
                            setTimeout(() => setCopied(false), 1800);
                          });
                        }}
                      >
                        {copied ? 'Đã sao chép' : 'Sao chép'}
                      </button>
                    </div>
                  )}
                </div>
                {qrUrl && (
                  <>
                    <div className="ct-qr">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={qrUrl} alt="VietQR" loading="lazy" />
                    </div>
                    <a className="ct-btn ct-btn--outline qr-download-button" href={qrUrl} target="_blank" rel="noopener noreferrer" download="vietqr.png">
                      <span>Tải ảnh QR</span>
                    </a>
                  </>
                )}
              </article>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

/* ───────────── 10 Hỏi nhanh đáp gọn (FAQ Accordion) ───────────── */

export function Faq({ data, num }: { data: Tn13Data; num: string }) {
  const items = data.faq.items.filter((it) => it.q.trim() || it.a.trim());
  const [openIndex, setOpenIndex] = useState<number>(0);

  if (!items.length) return null;

  return (
    <div className="ct-section ct-faq">
      <div className="ct-col">
        <SectionTag num={num} label="Hỏi nhanh" />
        <div className="ct-card ct-faqcard">
          <section className="ifq-section reveal">
            <div className="ifq-title reveal-piece">
              <span className="ifq-caps">Hỏi nhanh đáp gọn</span>
            </div>
            <div className="ifq-list">
              {items.map((item, idx) => {
                const isOpen = openIndex === idx;
                return (
                  <article
                    key={idx}
                    className="ifq-item reveal-piece"
                    style={{ '--ifq-rd': `${(idx * 0.12).toFixed(2)}s` } as React.CSSProperties}
                  >
                    <button
                      type="button"
                      className={`ifq-q ${isOpen ? 'is-open' : ''}`.trim()}
                      data-no-autoscroll-toggle=""
                      onClick={() => setOpenIndex(isOpen ? -1 : idx)}
                    >
                      <span>{item.q}</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="ifq-chevron"
                        aria-hidden="true"
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </button>
                    <div className={`ifq-a-wrap ${isOpen ? 'is-open' : ''}`.trim()}>
                      <p className="ifq-a">{item.a}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

/* ───────────── 11 Cảm ơn ───────────── */

export function Thanks({ data, num }: { data: Tn13Data; num: string }) {
  const displayName = data.graduate.nickname || data.graduate.fullName || '';
  const lines = paras(data.messages.thanks || 'Cảm ơn bạn đã đến chung vui và chụp hình cùng mình nha!');
  const seed = hashSeed(displayName || 'traothiep');
  const thanksCaps = buildFrozenCaps(seed, 8, { xMin: 4, xMax: 96, yMin: 3, yMax: 11, sMin: 11, sMax: 22, salt: 3 });
  const d = dateParts(data.ceremony.date);
  const timeRange = data.ceremony.time ? `${data.ceremony.time}${data.ceremony.endTime ? ` – ${data.ceremony.endTime}` : ''}` : '';
  const metaLine = [d.short, timeRange, data.ceremony.venueName].filter(Boolean).join(' · ');

  return (
    <section className="ct-section ct-thanks reveal">
      <div className="ct-col">
        <SectionTag num={num} label="Cảm ơn" />
        <div className="ct-ink ct-thanksbox reveal-piece">
          {thanksCaps.map((cap) => (
            <span key={cap.id} className={`ct-cap ct-frozen ct-cap--c${cap.color}`} style={cap.style} aria-hidden="true">
              <i className="ct-tassel" />
            </span>
          ))}
          <div className="ct-thanks-body">
            <p className="ct-thanks-etch">Cảm ơn bạn</p>
            <p className="ct-thanks-line">
              <i className="ct-cap ct-thanks-line-cap ct-cap--c2" aria-hidden="true">
                <i className="ct-tassel" />
              </i>
              <span className="ct-thanks-line-text">Cảm ơn vì đã là một phần thanh xuân</span>
            </p>
            {lines.map((line, i) => (
              <p key={i} className="ct-thanks-msg">
                {line}
              </p>
            ))}
            {displayName && (
              <p className="ct-thanks-sign">
                <span className="ct-thanks-sign-text">{displayName}</span>
              </p>
            )}
            {metaLine && <p className="ct-thanks-meta">{metaLine}</p>}
          </div>
        </div>
        <div className="ct-end reveal-piece">
          <i className="ct-end-line" aria-hidden="true" />
          <span className="ct-end-text">Hẹn gặp bạn trong khung hình ngày tốt nghiệp</span>
          <i className="ct-end-line" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}
