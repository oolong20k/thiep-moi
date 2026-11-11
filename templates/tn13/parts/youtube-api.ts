export type YoutubePlayer = {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  unMute(): void;
  setVolume(volume: number): void;
  destroy(): void;
};
type YoutubeAPI = {
  Player: new (element: HTMLElement, options: {
    videoId: string;
    width: string;
    height: number;
    playerVars: Record<string, string | number>;
    events: {
      onReady(): void;
      onStateChange(event: { data: number }): void;
      onError(): void;
      onAutoplayBlocked(): void;
    };
  }) => YoutubePlayer;
};
let api: Promise<YoutubeAPI> | undefined;

export function loadYoutubeAPI(): Promise<YoutubeAPI> {
  const win = window as typeof window & { YT?: YoutubeAPI; onYouTubeIframeAPIReady?: () => void };
  if (win.YT?.Player) return Promise.resolve(win.YT);
  if (!api) api = new Promise((resolve, reject) => {
    const previous = win.onYouTubeIframeAPIReady;
    win.onYouTubeIframeAPIReady = () => {
      if (win.YT) resolve(win.YT);
      previous?.();
    };
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.onerror = () => reject(new Error('YouTube API unavailable'));
    document.head.appendChild(script);
  });
  return api;
}
