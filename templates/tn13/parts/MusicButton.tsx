export function MusicButton({ playing, onToggle }: { playing: boolean; onToggle: () => void }) {
  return (
    <div className="ct-music-rail" data-no-autoscroll-toggle="">
      <button
        type="button"
        className={`ct-music ${playing ? 'is-playing' : ''}`.trim()}
        data-no-autoscroll-toggle=""
        aria-label="Nhạc nền"
        aria-pressed={playing}
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
