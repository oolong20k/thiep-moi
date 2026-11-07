'use client';
import { useEffect, useRef, useState } from 'react';
import type { AlbumLayout, HeroLayout, Tn13Data } from './schema';
import { Opening, type Phase } from './Opening';
import { Hero, Invite, Album, Quote, Ceremony, Timeline, MapSection, Rsvp, Faq, Thanks } from './sections';
import { MusicButton } from './parts/MusicButton';
import { RevealAll, useAutoScroll, useScrollReveal } from './parts/Reveal';
import type { Skin } from './skin';
import { youtubeId } from '@/lib/music';
import { shades } from '@/lib/color';

export type CardProps = {
  data: Tn13Data;
  slug?: string; // có slug = thiệp công khai, RSVP/lời chúc ghi vào DB
  guest?: string; // tên khách (?to=)
  preview?: boolean; // trong editor: bỏ màn mở thiệp, hiện hết nội dung
  skipOpening?: boolean;
  heroLayout?: HeroLayout;
  albumLayout?: AlbumLayout;
  skin?: Skin;
};

export default function Card({
  data,
  slug,
  guest,
  preview = false,
  skipOpening = false,
  albumLayout,
}: CardProps) {
  const rootStyle = shades(data.graduate.mainColor, data.graduate.accentColor, data.graduate) as React.CSSProperties;
  const album = albumLayout ?? data.album.layout;

  const [phase, setPhase] = useState<Phase>(preview || skipOpening ? 'done' : 'idle');
  const [detailVisible, setDetailVisible] = useState<boolean>(preview || skipOpening);
  const [playing, setPlaying] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const videoId = youtubeId(data.music.url);
  const youtubeRef = useRef<HTMLIFrameElement>(null);
  const youtubeWanted = useRef(false);

  const detailRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const { refreshScrollReveal } = useScrollReveal(detailRef, detailVisible, preview);
  const { startAutoScroll } = useAutoScroll({
    disabled: () => preview || !detailVisible || lightboxOpen,
  });

  useEffect(() => {
    return () => timersRef.current.forEach(clearTimeout);
  }, []);

  // Nếu vào thẳng với skipOpening=true (nhưng không phải preview trong editor), kích hoạt scroll reveal ngay
  useEffect(() => {
    if (skipOpening && !preview) {
      setDetailVisible(true);
    }
  }, [skipOpening, preview]);

  function toss() {
    if (phase !== 'idle') return;

    if (videoId) {
      youtubeWanted.current = true;
      youtubeCommand('seekTo', [5, true]);
      youtubeCommand('playVideo');
    }

    const audio = audioRef.current;
    if (audio) {
      try {
        audio.currentTime = 5;
        audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
      } catch {
        setPlaying(false);
      }
    }

    const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    setPhase('tossing');

    const t1 = setTimeout(() => {
      setPhase('rising');
    }, reduced ? 0 : 900);

    const t2 = setTimeout(() => {
      setPhase('fading');
      setDetailVisible(true);
      requestAnimationFrame(() => refreshScrollReveal());
    }, reduced ? 20 : 1150);

    const t3 = setTimeout(() => {
      setPhase('done');
      startAutoScroll(900);
    }, reduced ? 60 : 1650);

    timersRef.current.push(t1, t2, t3);
  }

  function toggleMusic() {
    if (videoId) {
      youtubeWanted.current = !youtubeWanted.current;
      youtubeCommand(youtubeWanted.current ? 'playVideo' : 'pauseVideo');
      return;
    }
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      a.play()
        .then(() => setPlaying(true))
        .catch(() => setPlaying(false));
    } else {
      a.pause();
      setPlaying(false);
    }
  }

  function youtubeCommand(func: string, args: (number | boolean)[] = []) {
    youtubeRef.current?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args }), 'https://www.youtube.com');
  }

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://www.youtube.com' || event.source !== youtubeRef.current?.contentWindow) return;
      let message;
      try { message = typeof event.data === 'string' ? JSON.parse(event.data) : event.data; } catch { return; }
      if (message?.event === 'onReady' && youtubeWanted.current) youtubeCommand('playVideo');
      const state = message?.event === 'onStateChange' ? message.info : message?.info?.playerState;
      if (typeof state === 'number') setPlaying(state === 1);
      if (message?.event === 'onError' || message?.event === 'onAutoplayBlocked') {
        youtubeWanted.current = false;
        setPlaying(false);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [videoId]);

  useEffect(() => {
    youtubeWanted.current = false;
    setPlaying(false);
  }, [data.music.url, data.music.visible]);

  useEffect(() => {
    const onVis = () => {
      if (document.hidden) {
        audioRef.current?.pause();
        youtubeWanted.current = false;
        youtubeCommand('pauseVideo');
        setPlaying(false);
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  let n = 0;
  const num = () => String(++n).padStart(2, '0');

  const showMessages = data.messages.visible !== false;
  const showCeremony = data.ceremony.visible !== false;
  const showInteract = data.interact.visible !== false;
  const showMusic = Boolean(data.music.visible !== false && data.music.url);

  const showInvite = Boolean(showMessages && (data.graduate.fullName || data.messages.invitation.trim() || data.messages.guestPersonalNote?.trim()));
  const showAlbum = Boolean(data.album.visible && data.album.photos.filter(Boolean).length > 0);
  const showQuote = Boolean(showMessages && data.messages.quote.trim());
  const showParty = Boolean(showCeremony && (data.ceremony.title || data.ceremony.date || data.ceremony.time || data.ceremony.venueName));
  const showTimeline = Boolean(data.schedule.visible && data.schedule.items.some((i) => i.time.trim() || i.content.trim()));
  const showMap = Boolean(showCeremony && (data.ceremony.address || data.ceremony.venueName || data.ceremony.mapsUrl));
  const showRsvp = Boolean(showInteract && data.interact.rsvp);
  const showFaq = Boolean(data.faq.visible && data.faq.items.some((i) => i.q.trim() || i.a.trim()));
  const showThanks = Boolean(showMessages && (data.messages.thanks.trim() || data.graduate.nickname || data.graduate.fullName));

  const cardArticle = (
    <article className={`ct ${preview ? 'is-compact is-preview' : ''}`.trim()} style={rootStyle}>
      {showMusic && videoId && (
        <iframe
          ref={youtubeRef}
          title="Nhạc nền YouTube"
          className="ct-youtube"
          src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1&playsinline=1&start=5&loop=1&playlist=${videoId}`}
          allow="autoplay; encrypted-media"
          tabIndex={-1}
          aria-hidden="true"
          onLoad={() => {
            youtubeRef.current?.contentWindow?.postMessage(JSON.stringify({ event: 'listening', id: 'card-music' }), 'https://www.youtube.com');
            youtubeRef.current?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: 'addEventListener', args: ['onStateChange'] }), 'https://www.youtube.com');
            if (youtubeWanted.current) youtubeCommand('playVideo');
          }}
        />
      )}
      {phase !== 'done' && <Opening data={data} guest={guest} phase={phase} onToss={toss} />}
      <div
        ref={detailRef}
        className="ct-detail"
        style={{ display: detailVisible ? undefined : 'none' }}
      >
        <Hero data={data} guest={guest} />
        {showInvite && <Invite data={data} num={num()} />}
        {showAlbum && <Album data={data} layout={album} num={num()} onLightboxChange={setLightboxOpen} />}
        {showQuote && <Quote data={data} num={num()} />}
        {showParty && <Ceremony data={data} num={num()} compact={preview} />}
        {showTimeline && <Timeline data={data} num={num()} />}
        {showMap && <MapSection data={data} num={num()} />}
        {showRsvp && <Rsvp data={data} slug={slug} guest={guest} num={num()} />}
        {showFaq && <Faq data={data} num={num()} />}
        {showThanks && <Thanks data={data} num={num()} />}
        {showMusic && (
          <>
            <MusicButton playing={playing} onToggle={toggleMusic} />
            {!videoId && <audio ref={audioRef} src={data.music.url} loop preload="auto" onPause={() => setPlaying(false)} onError={() => setPlaying(false)} />}
          </>
        )}
      </div>
    </article>
  );

  return (
    <RevealAll.Provider value={preview}>
      {preview ? cardArticle : <div className="demo-page" style={rootStyle}>{cardArticle}</div>}
    </RevealAll.Provider>
  );
}

/** Ảnh thu nhỏ cho trang chủ (gallery): hiển thị phần Hero. */
export function HeroThumb({ data }: { data: Tn13Data; skin?: Skin }) {
  const rootStyle = shades(data.graduate.mainColor, data.graduate.accentColor, data.graduate) as React.CSSProperties;
  return (
    <RevealAll.Provider value={true}>
      <article className="ct is-compact is-preview" style={{ ...rootStyle, maxHeight: 'none', overflow: 'hidden', boxShadow: 'none' }}>
        <div className="ct-detail" style={{ paddingBottom: 20 }}>
          <Hero data={data} />
        </div>
      </article>
    </RevealAll.Provider>
  );
}
