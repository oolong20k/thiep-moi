import sharp from 'sharp';
import { nanoid } from 'nanoid';
import { getStore } from '@/lib/store';
import { authorize, json } from '@/lib/auth';

const MAX_BYTES = 10 * 1024 * 1024;
const MAX_FILES_PER_CARD = 60;

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await authorize(req, id);
  if ('res' in a) return a.res;

  const file = (await req.formData().catch(() => null))?.get('file');
  if (!(file instanceof File)) return json('missing file', 400);
  if (file.size > MAX_BYTES) return json('file too large (max 10MB)', 413);

  const store = await getStore();
  if ((await store.imageCount(id)) >= MAX_FILES_PER_CARD) return json('too many files', 400);

  const input = Buffer.from(await file.arrayBuffer());
  let hasAlpha = false;
  let out: Buffer;
  try {
    const meta = await sharp(input).metadata();
    // PNG xuất từ nhiều công cụ có kênh alpha nhưng đặc 100%: chỉ tính là "có alpha" nếu thật sự có điểm trong suốt.
    if (meta.hasAlpha) hasAlpha = ((await sharp(input).stats()).channels[3]?.min ?? 255) < 255;
    out = await sharp(input)
      .rotate()
      .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    return json('not an image', 400);
  }

  const url = await store.putImage(id, `${nanoid(10)}.webp`, out);
  return Response.json({ url, hasAlpha, defaultLayout: hasAlpha ? 'sticker' : 'torn' });
}
