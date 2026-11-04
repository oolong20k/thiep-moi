import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { limited } from './ratelimit';
import type { CardRow, Store } from './store';

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');

function open() {
  fs.mkdirSync(path.join(DATA_DIR, 'uploads'), { recursive: true });
  const d = new Database(path.join(DATA_DIR, 'app.db'));
  d.pragma('journal_mode = WAL');
  d.pragma('foreign_keys = ON');
  d.exec(`
    CREATE TABLE IF NOT EXISTS cards (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      template TEXT NOT NULL,
      edit_token_hash TEXT NOT NULL,
      draft_json TEXT NOT NULL,
      published_json TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      published_at INTEGER
    );
    CREATE TABLE IF NOT EXISTS rsvps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      card_id TEXT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
      guest_name TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('yes','no','maybe')),
      note TEXT NOT NULL DEFAULT '',
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS wishes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      card_id TEXT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      message TEXT NOT NULL,
      hidden INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS rsvps_card ON rsvps(card_id);
    CREATE INDEX IF NOT EXISTS wishes_card ON wishes(card_id);
  `);
  return d;
}

export function create(): Store {
  const db = open();
  const dir = (cardId: string) => path.join(DATA_DIR, 'uploads', cardId);
  return {
    async createCard(c, now) {
      db.prepare('INSERT INTO cards (id, slug, template, edit_token_hash, draft_json, created_at, updated_at) VALUES (?,?,?,?,?,?,?)').run(
        c.id, c.slug, c.template, c.edit_token_hash, c.draft_json, now, now,
      );
    },
    async cardById(id) {
      return db.prepare('SELECT * FROM cards WHERE id = ?').get(id) as CardRow | undefined;
    },
    async cardBySlug(slug) {
      return db.prepare('SELECT * FROM cards WHERE slug = ?').get(slug) as CardRow | undefined;
    },
    async saveDraft(id, json, now) {
      db.prepare('UPDATE cards SET draft_json = ?, updated_at = ? WHERE id = ?').run(json, now, id);
    },
    async publish(id, json, now) {
      db.prepare('UPDATE cards SET published_json = ?, published_at = ? WHERE id = ?').run(json, now, id);
    },
    async addRsvp(cardId, guestName, status, note, now) {
      db.prepare('INSERT INTO rsvps (card_id, guest_name, status, note, created_at) VALUES (?,?,?,?,?)').run(cardId, guestName, status, note, now);
    },
    async addWish(cardId, name, message, now) {
      db.prepare('INSERT INTO wishes (card_id, name, message, created_at) VALUES (?,?,?,?)').run(cardId, name, message, now);
    },
    async rsvps(cardId) {
      return db.prepare('SELECT id, guest_name AS guestName, status, note, created_at AS createdAt FROM rsvps WHERE card_id = ? ORDER BY id DESC').all(cardId) as never;
    },
    async wishes(cardId) {
      return db.prepare('SELECT id, name, message, hidden, created_at AS createdAt FROM wishes WHERE card_id = ? ORDER BY id DESC').all(cardId) as never;
    },
    async publicWishes(cardId) {
      return db.prepare('SELECT id, name, message, created_at AS createdAt FROM wishes WHERE card_id = ? AND hidden = 0 ORDER BY id DESC LIMIT 100').all(cardId) as never;
    },
    async hideWish(cardId, wishId, hidden) {
      return db.prepare('UPDATE wishes SET hidden = ? WHERE id = ? AND card_id = ?').run(hidden ? 1 : 0, wishId, cardId).changes > 0;
    },
    async hit(key, max, windowMs) {
      return limited(key, max, windowMs);
    },
    async imageCount(cardId) {
      try {
        return fs.readdirSync(dir(cardId)).length;
      } catch {
        return 0;
      }
    },
    async putImage(cardId, name, data) {
      fs.mkdirSync(dir(cardId), { recursive: true });
      fs.writeFileSync(path.join(dir(cardId), name), data);
      return `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/uploads/${cardId}/${name}`;
    },
    async getImage(cardId, name) {
      try {
        return fs.readFileSync(path.join(dir(cardId), name));
      } catch {
        return null;
      }
    },
  };
}
