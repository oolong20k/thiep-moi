import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import Database from 'better-sqlite3';

test('backup restores committed WAL data and uploaded images without changing the live database', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'thiep-backup-'));
  const data = path.join(root, 'data');
  const output = path.join(root, 'backups');
  mkdirSync(path.join(data, 'uploads', 'card'), { recursive: true });
  const image = Buffer.from([0, 1, 254, 255]);
  writeFileSync(path.join(data, 'uploads', 'card', 'avatar.webp'), image);
  const live = new Database(path.join(data, 'app.db'));
  try {
    live.pragma('journal_mode = WAL');
    live.pragma('wal_autocheckpoint = 0');
    live.exec('CREATE TABLE cards (id TEXT PRIMARY KEY, published_json TEXT, edit_token_hash TEXT)');
    live.prepare('INSERT INTO cards VALUES (?, ?, ?)').run('reviewed-card', '{"name":"Ngọc Hiền"}', 'preserved-token-hash');
    assert(existsSync(path.join(data, 'app.db-wal')));
    const result = spawnSync('sh', ['scripts/backup.sh'], {
      env: { ...process.env, DATA_DIR: data, BACKUP_DIR: output }, encoding: 'utf8',
    });
    assert.equal(result.status, 0, result.stderr);
    const restored = path.join(root, 'restored');
    mkdirSync(restored);
    const extract = spawnSync('tar', ['-xzf', result.stdout.trim(), '-C', restored], { encoding: 'utf8' });
    assert.equal(extract.status, 0, extract.stderr);
    const snapshot = new Database(path.join(restored, 'app.db'), { readonly: true });
    try {
      assert.equal(snapshot.pragma('integrity_check', { simple: true }), 'ok');
      assert.deepEqual(snapshot.prepare('SELECT * FROM cards').all(), live.prepare('SELECT * FROM cards').all());
      assert.deepEqual(readFileSync(path.join(restored, 'uploads', 'card', 'avatar.webp')), image);
    } finally { snapshot.close(); }
    assert.equal(live.prepare('SELECT count(*) AS n FROM cards').get().n, 1);
  } finally {
    live.close();
    rmSync(root, { recursive: true, force: true });
  }
});

test('backup fails for a missing database instead of creating an empty one', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'thiep-backup-missing-'));
  try {
    const data = path.join(root, 'missing');
    const result = spawnSync('sh', ['scripts/backup.sh'], {
      env: { ...process.env, DATA_DIR: data, BACKUP_DIR: path.join(root, 'out') }, encoding: 'utf8',
    });
    assert.notEqual(result.status, 0);
    assert.equal(existsSync(path.join(data, 'app.db')), false);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
