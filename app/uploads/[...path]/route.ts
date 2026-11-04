import { getStore } from '@/lib/store';

// Chỉ dùng cho bản SQLite/VM. Bản Supabase trả thẳng URL CDN nên route này không có file để phục vụ (404).
export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const parts = (await params).path;
  // Chỉ nhận đúng dạng <cardId>/<file>.webp, chặn path traversal.
  if (parts.length !== 2 || !/^[\w-]+$/.test(parts[0]) || !/^[\w-]+\.webp$/.test(parts[1])) {
    return new Response('not found', { status: 404 });
  }
  const buf = await (await getStore()).getImage(parts[0], parts[1]);
  if (!buf) return new Response('not found', { status: 404 });
  return new Response(new Uint8Array(buf), {
    headers: { 'content-type': 'image/webp', 'cache-control': 'public, max-age=31536000, immutable' },
  });
}
