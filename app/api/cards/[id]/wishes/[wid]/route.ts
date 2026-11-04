import { getStore } from '@/lib/store';
import { authorize, json } from '@/lib/auth';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; wid: string }> }) {
  const { id, wid } = await params;
  const a = await authorize(req, id);
  if ('res' in a) return a.res;
  const body = (await req.json().catch(() => null)) as { hidden?: unknown } | null;
  if (typeof body?.hidden !== 'boolean') return json('invalid', 400);
  const ok = await (await getStore()).hideWish(a.card.id, Number(wid), body.hidden);
  return ok ? Response.json({ ok: true }) : json('not found', 404);
}
