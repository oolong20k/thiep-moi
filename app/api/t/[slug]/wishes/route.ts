import { z } from 'zod';
import { getStore } from '@/lib/store';
import { json } from '@/lib/auth';
import { clientIp } from '@/lib/ratelimit';

const body = z.object({
  name: z.string().trim().min(1).max(60),
  message: z.string().trim().min(1).max(300),
});

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const store = await getStore();
  const card = await store.cardBySlug((await params).slug);
  if (!card?.published_json) return json('not found', 404);
  return Response.json({ wishes: await store.publicWishes(card.id) });
}

export async function POST(req: Request, { params }: Ctx) {
  const { slug } = await params;
  const store = await getStore();
  if (await store.hit(`wish:${clientIp(req)}:${slug}`, 5, 60_000)) return json('too many requests', 429);
  const card = await store.cardBySlug(slug);
  if (!card?.published_json) return json('not found', 404);
  if (!JSON.parse(card.published_json).interact?.wishes) return json('wishes disabled', 403);
  const p = body.safeParse(await req.json().catch(() => null));
  if (!p.success) return json('invalid', 400);
  await store.addWish(card.id, p.data.name, p.data.message, Date.now());
  return Response.json({ ok: true }, { status: 201 });
}
