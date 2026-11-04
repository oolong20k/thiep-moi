import { getStore } from '@/lib/store';
import { authorize, json } from '@/lib/auth';
import { isTemplate, templates } from '@/templates/registry';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Ctx) {
  const a = await authorize(req, (await params).id);
  if ('res' in a) return a.res;
  const c = a.card;
  return Response.json({
    id: c.id,
    slug: c.slug,
    template: c.template,
    draft: JSON.parse(c.draft_json),
    published: c.published_json !== null,
    dirty: c.published_json !== c.draft_json,
    publishedAt: c.published_at,
    updatedAt: c.updated_at,
  });
}

export async function PUT(req: Request, { params }: Ctx) {
  const a = await authorize(req, (await params).id);
  if ('res' in a) return a.res;
  const tpl = a.card.template === 'tn13-brutal' ? 'tn13' : a.card.template;
  if (!isTemplate(tpl)) return json('unknown template', 400);
  const parsed = templates[tpl].schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'invalid', issues: parsed.error.issues }, { status: 400 });
  const now = Date.now();
  const draft = JSON.stringify(parsed.data);
  await (await getStore()).saveDraft(a.card.id, draft, now);
  return Response.json({ ok: true, updatedAt: now, dirty: a.card.published_json !== draft });
}
