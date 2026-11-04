import type { Tn13Data } from './schema';
import { dateParts, initialsOf, nameLenClass } from './date';
import { buildOpeningCaps, hashSeed } from './parts/Cap';

export type Phase = 'idle' | 'tossing' | 'rising' | 'fading' | 'done';

/** Màn mở thiệp và chuyển cảnh vào lời mời. */
export function Opening({
  data,
  guest,
  phase,
  onToss,
}: {
  data: Tn13Data;
  guest?: string;
  phase: Phase;
  onToss: () => void;
}) {
  const g = data.graduate;
  const c = data.ceremony;
  const d = dateParts(c.date);
  const displayName = g.nickname || g.fullName || '';
  const seed = hashSeed(displayName || 'traothiep');
  const caps = buildOpeningCaps(seed, 14);
  const initials = initialsOf(displayName) || '·';
  const lenCls = nameLenClass(displayName);
  const isTossing = phase === 'tossing' || phase === 'rising' || phase === 'fading';
  const isRising = phase === 'rising' || phase === 'fading';
  const isFading = phase === 'fading';

  const dateLine = [`${d.weekdayShort} · ${d.short}`, c.time ? `${c.time}${c.endTime ? ` – ${c.endTime}` : ''}` : ''].filter(Boolean).join(' · ');
  const guestNote = g.guestNote ?? 'Hẹn bạn ở sảnh chính của trường, tụi mình chụp thật nhiều hình kỷ niệm nha!';

  return (
    <section
      className={[
        'cto cto-cover',
        isTossing ? 'is-tossing' : '',
        isRising ? 'is-rising' : '',
        isFading ? 'is-fading' : '',
        g.coverPhoto ? 'has-photo' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      role="dialog"
      aria-label="Mở thiệp mời"
    >
      <div className="cto-content">
        <header className="cto-top">
          <span className="cto-label">Thiệp mời tốt nghiệp</span>
          {g.year && <span className="cto-year">{g.year}</span>}
        </header>

        <div className={['cto-head', lenCls].filter(Boolean).join(' ')}>
          <span className="cto-kicker">Lễ tốt nghiệp của</span>
          {displayName && <h1 className="cto-name">{displayName}</h1>}
          {(g.school || g.classInfo) && (
            <p className="cto-meta">
              {g.school && <span className="cto-school">{g.school}</span>}
              {g.classInfo && <span className="cto-chip">{g.classInfo}</span>}
            </p>
          )}
        </div>

        <div className="cto-stage">
          <i className="cto-backdrop" aria-hidden="true" />
          {caps.map((cap) => (
            <span
              key={cap.id}
              className={`ct-cap cto-cap ct-cap--c${cap.color} is-${cap.layer}`}
              style={cap.style}
              aria-hidden="true"
            >
              <i className="ct-tassel" />
            </span>
          ))}
          <div className="cto-photo-wrap">
            <i className="cto-burst" aria-hidden="true" />
            <figure className={`cto-photo ${g.coverPhoto ? 'has-photo' : ''}`.trim()}>
              {g.coverPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={g.coverPhoto} alt={displayName || 'Thiệp mời tốt nghiệp'} />
              ) : (
                <span className="cto-photo-initials" aria-hidden="true">
                  {initials}
                </span>
              )}
            </figure>
            <span className="cto-role">Tân cử nhân</span>
          </div>
          <span className={`cto-count ${isTossing ? 'is-go' : ''}`.trim()}>
            {isTossing ? 'Chụp!' : '1 · 2 · 3'}
          </span>
        </div>

        <p className="cto-caption">1, 2, 3… cười thật tươi chụp hình nào!</p>

        {(c.title || dateLine || c.venueName) && (
          <div className="cto-foot">
            {c.title && <strong className="cto-headline">{c.title}</strong>}
            {dateLine && <span className="cto-date">{dateLine}</span>}
            {c.venueName && <span className="cto-venue">{c.venueName}</span>}
          </div>
        )}

        {guest && (
          <div className="cto-note">
            <span className="cto-note-label">Thân mời</span>
            <strong className="cto-note-name">{guest}</strong>
            {guestNote && <small className="cto-note-text">{guestNote}</small>}
          </div>
        )}

        <button type="button" className="cto-open" onClick={onToss} disabled={phase !== 'idle'}>
          <span className="ct-cap cto-open-cap ct-cap--c2" aria-hidden="true">
            <i className="ct-tassel" />
          </span>
          <span className="cto-open-text">Mở thiệp</span>
        </button>
        <p className="cto-hint">Chạm để mở thiệp mời</p>
      </div>
    </section>
  );
}
