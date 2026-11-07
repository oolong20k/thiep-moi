// Chạy bằng `npm test` (build trước rồi `next start` với DB tạm). Chỉ dùng node:test, không framework.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, type ChildProcess } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import sharp from 'sharp';

const PORT = 3199;
const BASE = `http://127.0.0.1:${PORT}`;
let server: ChildProcess;
let dataDir: string;

before(async () => {
  dataDir = mkdtempSync(path.join(tmpdir(), 'thiep-test-'));
  server = spawn('npx', ['next', 'start', '-p', String(PORT)], { env: { ...process.env, DATA_DIR: dataDir }, stdio: 'ignore' });
  for (let i = 0; i < 60; i++) {
    if (await fetch(`${BASE}/api/cards`, { method: 'GET' }).then(() => true, () => false)) return;
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('server không lên');
});
after(() => {
  server?.kill();
  rmSync(dataDir, { recursive: true, force: true });
});

const bearer = (t: string) => ({ authorization: `Bearer ${t}` });
async function create() {
  const r = await fetch(`${BASE}/api/cards`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ template: 'tn13' }) });
  assert.equal(r.status, 201);
  return (await r.json()) as { id: string; slug: string; editToken: string };
}
async function draftOf(c: { id: string; editToken: string }) {
  return (await (await fetch(`${BASE}/api/cards/${c.id}`, { headers: bearer(c.editToken) })).json()).draft;
}
const put = (c: { id: string }, token: string, body: unknown) =>
  fetch(`${BASE}/api/cards/${c.id}`, { method: 'PUT', headers: { ...bearer(token), 'content-type': 'application/json' }, body: JSON.stringify(body) });

test('token sai bị 401, token đúng sửa được', async () => {
  const c = await create();
  const d = await draftOf(c);
  assert.equal((await put(c, 'sai-token', d)).status, 401);
  assert.equal((await fetch(`${BASE}/api/cards/${c.id}`)).status, 401);
  d.graduate.nickname = 'Đã Sửa';
  assert.equal((await put(c, c.editToken, d)).status, 200);
  assert.equal((await draftOf(c)).graduate.nickname, 'Đã Sửa');
});

test('dữ liệu không hợp lệ bị 400 (url javascript:)', async () => {
  const c = await create();
  const d = await draftOf(c);
  d.graduate.coverPhoto = 'javascript:alert(1)';
  assert.equal((await put(c, c.editToken, d)).status, 400);
});

test('/t/ chỉ hiện bản đã xuất bản, không phải bản nháp', async () => {
  const c = await create();
  assert.equal((await fetch(`${BASE}/t/${c.slug}`)).status, 404); // chưa xuất bản

  const d = await draftOf(c);
  d.graduate.nickname = 'TenDaXuatBan';
  await put(c, c.editToken, d);
  assert.equal((await fetch(`${BASE}/api/cards/${c.id}/publish`, { method: 'POST' })).status, 401);
  assert.equal((await fetch(`${BASE}/api/cards/${c.id}/publish`, { method: 'POST', headers: bearer(c.editToken) })).status, 200);

  d.graduate.nickname = 'TenBanNhapMoi';
  await put(c, c.editToken, d);
  const html = await (await fetch(`${BASE}/t/${c.slug}`)).text();
  assert.ok(html.includes('TenDaXuatBan'), 'phải có bản published');
  assert.ok(!html.includes('TenBanNhapMoi'), 'không được lộ bản draft');
});

test('RSVP: status sai bị 400, đúng thì chủ thiệp thấy; lời chúc ẩn được', async () => {
  const c = await create();
  const post = (p: string, body: unknown) => fetch(`${BASE}/api/t/${c.slug}/${p}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  assert.equal((await post('rsvp', { guestName: 'Lan', status: 'yes' })).status, 404); // chưa xuất bản
  const d = await draftOf(c);
  d.interact.wishes = true; // Kiểm tra API lời chúc dù mẫu mặc định đã tắt phần này.
  assert.equal((await put(c, c.editToken, d)).status, 200);
  await fetch(`${BASE}/api/cards/${c.id}/publish`, { method: 'POST', headers: bearer(c.editToken) });

  assert.equal((await post('rsvp', { guestName: 'Lan', status: 'definitely' })).status, 400);
  assert.equal((await post('rsvp', { guestName: '', status: 'yes' })).status, 400);
  assert.equal((await post('rsvp', { guestName: 'Lan', status: 'yes', note: 'Mình đến' })).status, 201);

  assert.equal((await fetch(`${BASE}/api/cards/${c.id}/rsvps`)).status, 401);
  const owner = await (await fetch(`${BASE}/api/cards/${c.id}/rsvps`, { headers: bearer(c.editToken) })).json();
  assert.equal(owner.rsvps.length, 1);
  assert.equal(owner.rsvps[0].guestName, 'Lan');

  assert.equal((await post('wishes', { name: 'Minh', message: 'Chúc mừng!' })).status, 201);
  const wid = (await (await fetch(`${BASE}/api/cards/${c.id}/rsvps`, { headers: bearer(c.editToken) })).json()).wishes[0].id;
  const pub = async () => (await (await fetch(`${BASE}/api/t/${c.slug}/wishes`)).json()).wishes.length;
  assert.equal(await pub(), 1);
  await fetch(`${BASE}/api/cards/${c.id}/wishes/${wid}`, { method: 'PATCH', headers: { ...bearer(c.editToken), 'content-type': 'application/json' }, body: JSON.stringify({ hidden: true }) });
  assert.equal(await pub(), 0);
});

test('upload: PNG có alpha → sticker, JPG → torn, file không phải ảnh → 400', async () => {
  const c = await create();
  const up = (buf: Buffer, name: string) => {
    const fd = new FormData();
    fd.set('file', new File([new Uint8Array(buf)], name));
    return fetch(`${BASE}/api/cards/${c.id}/upload`, { method: 'POST', headers: bearer(c.editToken), body: fd });
  };
  const base = { create: { width: 40, height: 40, channels: 4 as const } };
  const png = await sharp({ create: { ...base.create, background: { r: 255, g: 0, b: 0, alpha: 0 } } }).png().toBuffer();
  const opaquePng = await sharp({ create: { ...base.create, background: { r: 255, g: 0, b: 0, alpha: 1 } } }).png().toBuffer();
  const jpg = await sharp({ create: { width: 40, height: 40, channels: 3, background: '#2459d6' } }).jpeg().toBuffer();

  const a = await (await up(png, 'a.png')).json();
  assert.equal(a.hasAlpha, true);
  assert.equal(a.defaultLayout, 'sticker');
  assert.equal((await (await up(opaquePng, 'o.png')).json()).defaultLayout, 'torn'); // kênh alpha nhưng đặc 100%
  const j = await (await up(jpg, 'b.jpg')).json();
  assert.equal(j.defaultLayout, 'torn');

  const served = await fetch(a.url.startsWith('http') ? a.url : `${BASE}${a.url}`); // Supabase trả URL CDN tuyệt đối
  assert.equal(served.status, 200);
  assert.equal(served.headers.get('content-type'), 'image/webp');
  assert.equal((await up(Buffer.from('không phải ảnh'), 'x.png')).status, 400);
  assert.equal((await fetch(`${BASE}/uploads/${c.id}/..%2F..%2Fapp.db`)).status, 404);
});

test('mẫu tn13: tạo được, mainColor sai bị 400, mẫu lạ bị 400', async () => {
  const r = await fetch(`${BASE}/api/cards`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ template: 'tn13' }) });
  assert.equal(r.status, 201);
  const c = (await r.json()) as { id: string; slug: string; editToken: string };
  const info = await (await fetch(`${BASE}/api/cards/${c.id}`, { headers: bearer(c.editToken) })).json();
  assert.equal(info.template, 'tn13');
  assert.equal(info.draft.graduate.mainColor, '#eab8c2');
  assert.equal(info.draft.graduate.accentColor, '#1a561e');
  assert.equal(info.draft.album.visible, false);
  assert.deepEqual(info.draft.album.photos, []);
  assert.equal(info.draft.interact.wishes, false);
  assert.equal(info.draft.gift.visible, false);
  assert.deepEqual(info.draft.schedule.items.map((item: { time: string }) => item.time), ['16:00', '16:15', '16:45', '17:00']);
  assert.equal(info.draft.music.url, 'https://www.youtube.com/watch?v=sctrgmZ_JNM&list=RDsctrgmZ_JNM&start_radio=1');
  assert.doesNotMatch(JSON.stringify(info.draft), /tung mũ|hàng đầu|giữ ghế/i);


  const d = info.draft;
  d.graduate.mainColor = 'red; background:url(x)';
  assert.equal((await put(c, c.editToken, d)).status, 400);
  d.graduate.mainColor = '#e02fdf';
  assert.equal((await put(c, c.editToken, d)).status, 200);

  const bad = await fetch(`${BASE}/api/cards`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ template: 'nope' }) });
  assert.equal(bad.status, 400);
});

test('custom colors persist, publish, reset and reject invalid CSS', async () => {
  const c = await create();
  const d = await draftOf(c);
  const colors = { textColor: '#123456', pageColor: '#fedcba', cardColor: '#ffffff', envelopeColor: '#98dfb0' };
  Object.assign(d.graduate, colors);
  assert.equal((await put(c, c.editToken, d)).status, 200);
  const saved = await draftOf(c);
  for (const [key, value] of Object.entries(colors)) assert.equal(saved.graduate[key], value);
  assert.equal((await fetch(`${BASE}/api/cards/${c.id}/publish`, { method: 'POST', headers: bearer(c.editToken) })).status, 200);
  const html = await (await fetch(`${BASE}/t/${c.slug}`)).text();
  for (const [variable, value] of Object.entries({ '--ct-ink': colors.textColor, '--ct-page-bg': colors.pageColor, '--ct-card-bg': colors.cardColor, '--ct-envelope': colors.envelopeColor })) {
    assert.ok(html.includes(`${variable}:${value}`));
  }
  for (const key of Object.keys(colors)) {
    assert.equal((await put(c, c.editToken, { ...d, graduate: { ...d.graduate, [key]: 'red; background: url(evil)' } })).status, 400);
    delete d.graduate[key];
  }
  assert.equal((await put(c, c.editToken, d)).status, 200);
  const reset = await draftOf(c);
  for (const key of Object.keys(colors)) assert.equal(reset.graduate[key], undefined);
});

test('opening has no intermediate portrait and YouTube is prepared at 00:05', async () => {
  const c = await create();
  const d = await draftOf(c);
  d.music = { visible: true, url: 'https://youtu.be/sctrgmZ_JNM' };
  assert.equal((await put(c, c.editToken, d)).status, 200);
  assert.equal((await fetch(`${BASE}/api/cards/${c.id}/publish`, { method: 'POST', headers: bearer(c.editToken) })).status, 200);
  const html = await (await fetch(`${BASE}/t/${c.slug}`)).text();
  const opening = html.match(/role="dialog"[\s\S]*?<\/section>/)?.[0];
  assert.ok(opening, 'envelope opening must be rendered');
  assert.ok(opening.includes('Mở thiệp tốt nghiệp'));
  assert.ok(!opening.includes('<img'), 'portrait belongs only in the inner content');
  assert.match(html, /youtube\.com\/embed\/sctrgmZ_JNM\?[^"<>]*start=5/);
});

test('portrait framing persists and rejects transforms outside the editor limits', async () => {
  const c = await create();
  const d = await draftOf(c);
  const transform = { zoom: 1.4, rotation: 30, x: 12, y: -8 };
  d.graduate.coverTransform = transform;
  assert.equal((await put(c, c.editToken, d)).status, 200);
  assert.deepEqual((await draftOf(c)).graduate.coverTransform, transform);
  for (const invalid of [{ zoom: 0 }, { zoom: 4 }, { rotation: 181 }, { x: 101 }, { y: -101 }]) {
    assert.equal((await put(c, c.editToken, { ...d, graduate: { ...d.graduate, coverTransform: { ...transform, ...invalid } } })).status, 400);
  }
  assert.equal((await fetch(`${BASE}/api/cards/${c.id}/publish`, { method: 'POST', headers: bearer(c.editToken) })).status, 200);
  const html = await (await fetch(`${BASE}/t/${c.slug}?to=KhachThu`)).text();
  assert.ok(html.includes('translate(12%, -8%) rotate(30deg) scale(1.4)'));
  const hero = html.match(/class="ct-hero"[\s\S]*?<\/section>/)?.[0];
  assert.ok(hero?.includes('Thân mời') || hero?.includes('THÂN MỜI'));
  assert.ok(hero?.includes('KhachThu'));
  assert.ok(hero && !hero.includes('ct-introcard'), 'hero keeps school metadata and the guest note');
  const invitation = html.match(/class="ct-section ct-intro reveal"[\s\S]*?<\/section>/)?.[0];
  assert.ok(invitation?.includes('01'));
  assert.ok(invitation?.includes('Người mời'));
  assert.ok(invitation?.includes('Võ Thị Ngọc Hiền'));
  assert.ok(invitation?.includes(d.messages.invitation.split('\n')[0]));
  assert.ok(html.indexOf('class="ct-section ct-intro reveal"') > html.indexOf('class="ct-hero"'));
});
