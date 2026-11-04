import { createHash, timingSafeEqual } from 'node:crypto';
import { nanoid } from 'nanoid';
import { getStore, type CardRow } from './store';

export const newToken = () => nanoid(32);
export const hashToken = (t: string) => createHash('sha256').update(t).digest('hex');

export const json = (error: string, status: number) => Response.json({ error }, { status });

/** Xác thực quyền sửa: Authorization: Bearer <token>. Sai token và id không tồn tại đều trả 401. */
export async function authorize(req: Request, id: string): Promise<{ card: CardRow } | { res: Response }> {
  const token = req.headers.get('authorization')?.replace(/^Bearer /, '') ?? '';
  const card = await (await getStore()).cardById(id);
  const a = Buffer.from(hashToken(token));
  const b = Buffer.from(card?.edit_token_hash ?? '0'.repeat(64));
  if (!card || a.length !== b.length || !timingSafeEqual(a, b)) return { res: json('unauthorized', 401) };
  return { card };
}
