import type { RefObject } from 'react';

export function MusicButton({ playing, onToggle, buttonRef, youtube, expanded, error }: {
  playing: boolean;
  onToggle: () => void;
  buttonRef: RefObject<HTMLButtonElement | null>;
  youtube: boolean;
  expanded: boolean;
  error: string;
}) {
  return (
    <div className="ct-music-rail" data-no-autoscroll-toggle="">
      {error && <span className="ct-music-error" role="status">{error}</span>}
      <button
        ref={buttonRef}
        type="button"
        className={`ct-music ${playing ? 'is-playing' : ''}`.trim()}
        data-no-autoscroll-toggle=""
        aria-label={youtube ? (expanded ? 'Đóng và dừng nhạc YouTube' : 'Mở nhạc YouTube') : (playing ? 'Tắt nhạc nền' : 'Bật nhạc nền')}
        aria-pressed={youtube ? undefined : playing}
        aria-expanded={youtube ? expanded : undefined}
        onClick={onToggle}
      >
        <span className="ct-cap ct-music-cap ct-cap--c2" aria-hidden="true">
          <i className="ct-tassel" />
        </span>
        <span className="ct-music-dot" aria-hidden="true" />
      </button>
    </div>
  );
}
