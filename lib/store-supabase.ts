import { createClient } from '@supabase/supabase-js';
import type { CardRow, Store } from './store';

const BUCKET = 'uploads';

/** Chạy phía server với service_role key (bỏ qua RLS). Bảng bật RLS và không có policy nên anon key không đọc được gì. */
export function create(): Store {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('Thiếu SUPABASE_SERVICE_ROLE_KEY');
  const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const ok = <T>(r: { data: T; error: { message: string } | null }) => {
    if (r.error) throw new Error(r.error.message);
    return r.data;
  };

  const list = <T>(r: { data: T[] | null; error: { message: string } | null }) => ok(r) ?? [];

  return {
    async createCard(c, now) {
      ok(await sb.from('cards').insert({ ...c, created_at: now, updated_at: now }));
    },
    async cardById(id) {
      return (ok(await sb.from('cards').select('*').eq('id', id).maybeSingle()) as CardRow | null) ?? undefined;
    },
    async cardBySlug(slug) {
      return (ok(await sb.from('cards').select('*').eq('slug', slug).maybeSingle()) as CardRow | null) ?? undefined;
    },
    async saveDraft(id, json, now) {
      ok(await sb.from('cards').update({ draft_json: json, updated_at: now }).eq('id', id));
    },
    async publish(id, json, now) {
      ok(await sb.from('cards').update({ published_json: json, published_at: now }).eq('id', id));
    },
    async addRsvp(cardId, guestName, status, note, now) {
      ok(await sb.from('rsvps').insert({ card_id: cardId, guest_name: guestName, status, note, created_at: now }));
    },
    async addWish(cardId, name, message, now) {
      ok(await sb.from('wishes').insert({ card_id: cardId, name, message, created_at: now }));
    },
    async rsvps(cardId) {
      const rows = list(await sb.from('rsvps').select('id, guest_name, status, note, created_at').eq('card_id', cardId).order('id', { ascending: false }));
      return rows.map((r) => ({ id: r.id, guestName: r.guest_name, status: r.status, note: r.note, createdAt: r.created_at }));
    },
    async wishes(cardId) {
      const rows = list(await sb.from('wishes').select('id, name, message, hidden, created_at').eq('card_id', cardId).order('id', { ascending: false }));
      return rows.map((r) => ({ id: r.id, name: r.name, message: r.message, hidden: r.hidden, createdAt: r.created_at }));
    },
    async publicWishes(cardId) {
      const rows = list(
        await sb.from('wishes').select('id, name, message, created_at').eq('card_id', cardId).eq('hidden', 0).order('id', { ascending: false }).limit(100),
      );
      return rows.map((r) => ({ id: r.id, name: r.name, message: r.message, createdAt: r.created_at }));
    },
    async hideWish(cardId, wishId, hidden) {
      const rows = list(await sb.from('wishes').update({ hidden: hidden ? 1 : 0 }).eq('id', wishId).eq('card_id', cardId).select('id'));
      return rows.length > 0;
    },
    async hit(k, max, windowMs) {
      const n = ok(await sb.rpc('rate_hit', { k, win_ms: windowMs })) as number;
      return n > max;
    },
    async imageCount(cardId) {
      return list(await sb.storage.from(BUCKET).list(cardId, { limit: 100 })).length;
    },
    async putImage(cardId, name, data) {
      const p = `${cardId}/${name}`;
      const { error } = await sb.storage.from(BUCKET).upload(p, data, { contentType: 'image/webp', cacheControl: '31536000' });
      if (error) throw new Error(error.message);
      return sb.storage.from(BUCKET).getPublicUrl(p).data.publicUrl;
    },
    async getImage() {
      return null;
    },
  };
}
