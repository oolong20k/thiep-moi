'use client';
import { useEffect, useRef, useState } from 'react';
import type { AlbumLayout, HeroLayout, Tn13Data } from './schema';
import { Opening, type Phase } from './Opening';
import { Hero, Invite, Album, Quote, Ceremony, Timeline, MapSection, Rsvp, Faq, Thanks } from './sections';
import { MusicButton } from './parts/MusicButton';
import { loadYoutubeAPI, type YoutubePlayer } from './parts/youtube-api';
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
  const [youtubeOpen, setYoutubeOpen] = useState(false);
  const youtubeMountRef = useRef<HTMLDivElement>(null);
  const youtubePlayerRef = useRef<YoutubePlayer | null>(null);
  const youtubeReady = useRef(false);
  const youtubeWanted = useRef(false);
  const youtubeSeekPending = useRef(false);
  const [musicError, setMusicError] = useState('');
  const musicCloseRef = useRef<HTMLButtonElement>(null);
  const musicTriggerRef = useRef<HTMLButtonElement>(null);
  const audioStartPending = useRef(false);

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

    // Audio must start in this click handler, before the opening animation.
    if (data.music.visible !== false) {
      if (videoId) playYoutube(true);
      else playAudio(true);
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

  function playAudio(fromStart = false) {
    const audio = audioRef.current;
    if (!audio) return;
    setMusicError('');
    if (fromStart) audioStartPending.current = true;
    if (audio.error) audio.load();
    if (audio.readyState >= 1) seekAudioStart();
    audio.muted = false;
    // Do not wait for metadata: that loses the user gesture in some WebViews.
    void audio.play().catch(() => {
      setPlaying(false);
      setMusicError('Chạm nút nhạc để thử phát lại.');
    });
  }

  function seekAudioStart() {
    const audio = audioRef.current;
    if (!audio || !audioStartPending.current) return;
    try {
      audio.currentTime = Number.isFinite(audio.duration) && audio.duration <= 5 ? 0 : 5;
      audioStartPending.current = false;
    } catch { /* Metadata is not available yet; loadedmetadata will retry the seek. */ }
  }

  function playYoutube(fromStart = false) {
    youtubeWanted.current = true;
    if (fromStart) youtubeSeekPending.current = true;
    setYoutubeOpen(true);
    setMusicError('');
    const player = youtubePlayerRef.current;
    if (!player || !youtubeReady.current) return;
    if (youtubeSeekPending.current) {
      player.seekTo(5, true);
      youtubeSeekPending.current = false;
    }
    player.unMute();
    player.setVolume(100);
    player.playVideo();
  }

  useEffect(() => {
    const mount = youtubeMountRef.current;
    if (!videoId || data.music.visible === false || !mount) return;
    let cancelled = false;
    let player: YoutubePlayer | undefined;
    const blocked = () => {
      if (cancelled) return;
      setPlaying(false);
      if (youtubeWanted.current) setMusicError('Trình duyệt đang chặn nhạc. Chạm ▶ trong khung nhạc để thử lại.');
    };
    void loadYoutubeAPI().then((YT) => {
      if (cancelled) return;
      const host = document.createElement('div');
      mount.appendChild(host);
      player = new YT.Player(host, {
        videoId, width: '100%', height: 214,
        playerVars: { autoplay: 0, playsinline: 1, fs: 0, start: 5, loop: 1, playlist: videoId, origin: window.location.origin },
        events: {
          onReady: () => {
            if (cancelled) return;
            youtubeReady.current = true;
            if (youtubeWanted.current) playYoutube();
          },
          onStateChange: ({ data: state }) => {
            if (cancelled) return;
            setPlaying(state === 1);
            if (state === 1) setMusicError('');
          },
          onError: blocked,
          onAutoplayBlocked: blocked,
        },
      });
      youtubePlayerRef.current = player;
      const iframe = mount.querySelector('iframe');
      if (iframe) {
        iframe.title = 'Nhạc nền YouTube';
        iframe.allow = "autoplay; encrypted-media; picture-in-picture 'none'; fullscreen 'none'";
        iframe.referrerPolicy = 'strict-origin-when-cross-origin';
        iframe.allowFullscreen = false;
      }
    }).catch(() => {
      if (!cancelled) setMusicError('Không tải được trình phát. Anh/chị có thể mở bài nhạc trên YouTube.');
    });
    return () => {
      cancelled = true;
      youtubeReady.current = false;
      youtubeWanted.current = false;
      youtubeSeekPending.current = false;
      youtubePlayerRef.current = null;
      player?.destroy();
      mount.replaceChildren();
    };
  }, [videoId, data.music.url, data.music.visible]);

  function toggleMusic() {
    if (videoId) {
      if (youtubeOpen) closeYoutube();
      else playYoutube();
      return;
    }
    if (audioRef.current?.paused) playAudio();
    else audioRef.current?.pause();
  }

  function closeYoutube() {
    youtubeWanted.current = false;
    youtubePlayerRef.current?.pauseVideo();
    setPlaying(false);
    setYoutubeOpen(false);
    musicTriggerRef.current?.focus();
  }

  useEffect(() => {
    if (youtubeOpen) musicCloseRef.current?.focus();
  }, [youtubeOpen]);

  useEffect(() => {
    audioStartPending.current = false;
    setYoutubeOpen(false);
    setPlaying(false);
    setMusicError('');
  }, [data.music.url, data.music.visible]);

  useEffect(() => {
    const onVis = () => {
      if (document.hidden) {
        audioRef.current?.pause();
        youtubeWanted.current = false;
        youtubePlayerRef.current?.pauseVideo();
        setYoutubeOpen(false);
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
      {showMusic && !videoId && (
        <audio ref={audioRef} src={data.music.url} loop preload="auto"
          onLoadedMetadata={seekAudioStart}
          onPlaying={() => { setPlaying(true); setMusicError(''); }}
          onPause={() => setPlaying(false)}
          onWaiting={() => setPlaying(false)}
          onError={() => { setPlaying(false); setMusicError('Không tải được nhạc. Chạm nút nhạc để thử lại.'); }} />
      )}
      {showMusic && videoId && (
        <section className="ct-music-player" aria-label="Trình phát nhạc YouTube" data-no-autoscroll-toggle=""
          inert={!youtubeOpen} aria-hidden={!youtubeOpen}
          style={{ visibility: youtubeOpen || phase === 'idle' ? undefined : 'hidden', zIndex: youtubeOpen ? 80 : 50 }}
          onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); closeYoutube(); } }}>
          <header><strong>Nhạc nền</strong><button ref={musicCloseRef} type="button" onClick={closeYoutube} aria-label="Đóng và dừng nhạc">×</button></header>
          <p>Nhạc phát từ giây 00:05 khi mở thiệp. Nếu chưa nghe thấy, chạm ▶ để thử lại.</p>
          <div ref={youtubeMountRef} className="ct-youtube" />
          <a href={`https://www.youtube.com/watch?v=${videoId}&t=5s`} target="_blank" rel="noopener noreferrer">Không phát được? Mở trên YouTube ↗</a>
        </section>
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
            <MusicButton playing={playing} onToggle={toggleMusic} buttonRef={musicTriggerRef}
              youtube={Boolean(videoId)} expanded={youtubeOpen} error={musicError} />

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
