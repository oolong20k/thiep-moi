import { nanoid, customAlphabet } from 'nanoid';
import { getStore } from '@/lib/store';
import { newToken, hashToken, json } from '@/lib/auth';
import { clientIp } from '@/lib/ratelimit';
import { isTemplate, templates } from '@/templates/registry';

const slugId = customAlphabet('abcdefghjkmnpqrstuvwxyz23456789', 8);

export async function POST(req: Request) {
  const store = await getStore();
  if (await store.hit(`create:${clientIp(req)}`, 20, 3600_000)) return json('too many requests', 429);
  const body = (await req.json().catch(() => ({}))) as { template?: string };
  const template = body.template ?? 'tn13';
  if (!isTemplate(template)) return json('unknown template', 400);

  const id = nanoid(12);
  const slug = slugId();
  const token = newToken();
  await store.createCard({ id, slug, template, edit_token_hash: hashToken(token), draft_json: JSON.stringify(templates[template].sample) }, Date.now());
  return Response.json({ id, slug, editToken: token }, { status: 201 });
}
