import type { Tn13Data } from './schema';
import { buildOpeningCaps, hashSeed } from './parts/Cap';
import s from './opening.module.css';

export type Phase = 'idle' | 'tossing' | 'rising' | 'fading' | 'done';

/** Phong bì mở ra trước khi chuyển vào nội dung thiệp. */
export function Opening({ data, guest, phase, onToss }: {
  data: Tn13Data;
  guest?: string;
  phase: Phase;
  onToss: () => void;
}) {
  const g = data.graduate;
  const name = g.nickname || g.fullName;
  const caps = buildOpeningCaps(hashSeed(name));

  return (
    <section className={s.opening} role="dialog" data-phase={phase} aria-label="Thiệp mời tốt nghiệp">
      <div className={s.border} aria-hidden="true" />
      <header className={s.header}>
        <span>Một cột mốc đáng nhớ</span>
        <span>{g.year}</span>
      </header>
      <div className={s.heading}>
        <p>Thiệp mời tốt nghiệp</p>
        <h1>{name}</h1>
      </div>

      <div className={s.scene}>
        <span className={`${s.spark} ${s.sparkOne}`} aria-hidden="true">✧</span>
        <span className={`${s.spark} ${s.sparkTwo}`} aria-hidden="true">✦</span>
        <span className={`${s.spark} ${s.sparkThree}`} aria-hidden="true">✧</span>
        <span className={`${s.spark} ${s.sparkFour}`} aria-hidden="true">✦</span>
        <span className={`${s.spark} ${s.sparkFive}`} aria-hidden="true">✧</span>
        <span className={`${s.spark} ${s.sparkSix}`} aria-hidden="true">✦</span>
        <span className={`${s.spark} ${s.sparkSeven}`} aria-hidden="true">✧</span>
        <span className={`${s.spark} ${s.sparkEight}`} aria-hidden="true">✦</span>
        <span className={`${s.spark} ${s.sparkNine}`} aria-hidden="true">✧</span>
        <span className={`${s.spark} ${s.sparkTen}`} aria-hidden="true">✦</span>
        <span className={`${s.spark} ${s.sparkEleven}`} aria-hidden="true">✧</span>
        <span className={`${s.flower} ${s.flowerFour}`} aria-hidden="true"><Sunflower /></span>
        <span className={`${s.flower} ${s.flowerOne}`} aria-hidden="true"><Sunflower /></span>
        <span className={`${s.flower} ${s.flowerTwo}`} aria-hidden="true"><Sunflower /></span>
        <span className={`${s.flower} ${s.flowerThree}`} aria-hidden="true"><Sunflower /></span>
        {caps.map(cap => <span key={cap.id} className={s.flyingCap} style={cap.style} aria-hidden="true"><GraduationCap /></span>)}
        <div className={s.envelope}>
          <div className={s.back} />
          <div className={s.pocket} aria-hidden="true" />
          <div className={s.flap} aria-hidden="true" />
          <button className={s.envelopeButton} type="button" onClick={onToss}
            aria-label={`Mở thiệp tốt nghiệp của ${name}`} disabled={phase !== 'idle'}>
            <span className={s.seal}><GraduationCap /></span>
          </button>
          <div className={s.envelopeInscription} aria-hidden="true">
            <span>Hẹn bạn ở ngày rực rỡ</span>
            <strong>{name}</strong>
          </div>
        </div>
      </div>

      <footer className={s.footer} aria-hidden={phase !== 'idle'}>
        <p className={s.prompt}>Chạm phong bì để mở thiệp</p>
        {guest && <p className={s.guest}>Thân gửi <strong>{guest}</strong></p>}
      </footer>
    </section>
  );
}

function GraduationCap() {
  return <svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
    <path d="m8 26 24-13 24 13-24 13L8 26Z" fill="currentColor" />
    <path d="M18 34v12c9 7 19 7 28 0V34M55 28v17" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    <circle cx="55" cy="48" r="3" fill="currentColor" />
  </svg>;
}

/** Nét mực và cánh màu giấy, đồng bộ với minh hoạ tốt nghiệp. */
function Sunflower() {
  return <svg viewBox="0 0 120 210" fill="none" aria-hidden="true">
    <path d="M61 72c-12 44 15 84-3 130" stroke="#738061" strokeWidth="4" strokeLinecap="round" />
    <path d="M62 155c-25 0-39-19-39-36 26 0 41 17 39 36Z" fill="#a6b18a" stroke="#738061" strokeWidth="1.5" />
    <path d="M64 130c23-3 34-22 32-36-23 4-35 19-32 36Z" fill="#b4bc96" stroke="#738061" strokeWidth="1.5" />
    <path d="m30 127 32 28m2-25 25-27" stroke="#738061" strokeWidth="1.4" />
    {Array.from({ length: 12 }, (_, i) => <ellipse key={i} cx="60" cy="31" rx={i % 2 ? 9 : 10} ry="25"
      transform={`rotate(${i * 30} 60 61)`} fill={i % 2 ? '#e5b65a' : '#f1cd78'} stroke="#b28a49" strokeWidth="1.2" />)}
    <circle cx="60" cy="61" r="22" fill="#816448" stroke="#67553f" strokeWidth="2" />
    <circle cx="60" cy="61" r="16" stroke="#c39a62" strokeWidth="1.5" strokeDasharray="1 4" />
    <path d="m51 55 2 1m8-5 1 2m7 5-2 1m-11 6 2 1m6 3 1-2m-15-5 1 1" stroke="#dbc191" strokeWidth="2.5" strokeLinecap="round" />
  </svg>;
}
