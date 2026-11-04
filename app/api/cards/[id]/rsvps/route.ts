import { getStore } from '@/lib/store';
import { authorize } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const a = await authorize(req, (await params).id);
  if ('res' in a) return a.res;
  const store = await getStore();
  const [rsvps, wishes] = await Promise.all([store.rsvps(a.card.id), store.wishes(a.card.id)]);
  return Response.json({ rsvps, wishes });
}
