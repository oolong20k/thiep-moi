/**
 * Lớp lưu trữ duy nhất mà route/page được phép gọi. Hai bản cài đặt:
 *  - SQLite + đĩa (VM/Docker): mặc định.
 *  - Supabase (Postgres + Storage): bật khi có SUPABASE_URL (dùng cho Vercel).
 */
export type CardRow = {
  id: string;
  slug: string;
  template: string;
  edit_token_hash: string;
  draft_json: string;
  published_json: string | null;
  created_at: number;
  updated_at: number;
  published_at: number | null;
};

export type Store = {
  createCard(c: Pick<CardRow, 'id' | 'slug' | 'template' | 'edit_token_hash' | 'draft_json'>, now: number): Promise<void>;
  cardById(id: string): Promise<CardRow | undefined>;
  cardBySlug(slug: string): Promise<CardRow | undefined>;
  saveDraft(id: string, json: string, now: number): Promise<void>;
  publish(id: string, json: string, now: number): Promise<void>;

  addRsvp(cardId: string, guestName: string, status: string, note: string, now: number): Promise<void>;
  addWish(cardId: string, name: string, message: string, now: number): Promise<void>;
  rsvps(cardId: string): Promise<{ id: number; guestName: string; status: string; note: string; createdAt: number }[]>;
  wishes(cardId: string): Promise<{ id: number; name: string; message: string; hidden: number; createdAt: number }[]>;
  publicWishes(cardId: string): Promise<{ id: number; name: string; message: string; createdAt: number }[]>;
  hideWish(cardId: string, wishId: number, hidden: boolean): Promise<boolean>;

  /** Rate-limit: true = bị chặn. */
  hit(key: string, max: number, windowMs: number): Promise<boolean>;

  imageCount(cardId: string): Promise<number>;
  /** Lưu ảnh webp, trả về URL dùng trong thiệp. */
  putImage(cardId: string, name: string, data: Buffer): Promise<string>;
  /** Chỉ bản SQLite phục vụ ảnh qua /uploads; Supabase trả URL CDN nên không dùng. */
  getImage(cardId: string, name: string): Promise<Buffer | null>;
};

const g = globalThis as { __store?: Promise<Store> };

export function getStore(): Promise<Store> {
  // import động: Vercel không nạp better-sqlite3 khi dùng Supabase, và ngược lại.
  return (g.__store ??= process.env.SUPABASE_URL
    ? import('./store-supabase').then((m) => m.create())
    : import('./store-sqlite').then((m) => m.create()));
}
