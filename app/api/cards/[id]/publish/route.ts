import { getStore } from '@/lib/store';
import { authorize, json } from '@/lib/auth';
import { isTemplate, templates } from '@/templates/registry';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const a = await authorize(req, (await params).id);
  if ('res' in a) return a.res;
  if (!isTemplate(a.card.template)) return json('unknown template', 400);
  // Re-validate để chắc chắn bản đang công khai luôn hợp lệ.
  if (!templates[a.card.template].schema.safeParse(JSON.parse(a.card.draft_json)).success) return json('invalid draft', 400);
  const now = Date.now();
  await (await getStore()).publish(a.card.id, a.card.draft_json, now);
  return Response.json({ ok: true, slug: a.card.slug, publishedAt: now });
}
