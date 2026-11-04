export function youtubeId(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') return null;
    const host = url.hostname.replace(/^www\./, '');
    const id = host === 'youtu.be' ? url.pathname.slice(1)
      : ['youtube.com', 'm.youtube.com'].includes(host)
        ? (url.pathname === '/watch' ? url.searchParams.get('v') : url.pathname.startsWith('/embed/') ? url.pathname.split('/')[2] : null)
        : null;
    return id && /^[\w-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}
