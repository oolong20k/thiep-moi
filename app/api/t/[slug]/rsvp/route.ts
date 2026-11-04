import { z } from 'zod';
import { getStore } from '@/lib/store';
import { json } from '@/lib/auth';
import { clientIp } from '@/lib/ratelimit';

const body = z.object({
  guestName: z.string().trim().min(1).max(80),
  status: z.enum(['yes', 'no', 'maybe']),
  note: z.string().trim().max(300).default(''),
});

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const store = await getStore();
  if (await store.hit(`rsvp:${clientIp(req)}:${slug}`, 10, 60_000)) return json('too many requests', 429);
  const card = await store.cardBySlug(slug);
  if (!card?.published_json) return json('not found', 404);
  if (!JSON.parse(card.published_json).interact?.rsvp) return json('rsvp disabled', 403);
  const p = body.safeParse(await req.json().catch(() => null));
  if (!p.success) return json('invalid', 400);
  await store.addRsvp(card.id, p.data.guestName, p.data.status, p.data.note, Date.now());
  return Response.json({ ok: true }, { status: 201 });
}
