# Thiệp mời tốt nghiệp

Next.js 15 + SQLite hoặc Supabase. Chọn **một** trong hai cách deploy; app tự nhận theo biến môi trường (có `SUPABASE_URL` → Supabase, không có → SQLite).

## Mẫu thiệp

| id | Giao diện |
|---|---|
| `tn13` | Collage giấy xé: xanh cobalt, giấy kem, sticker viền cam, 3 layout hero + 4 layout album |
| `tn13-brutal` | TN13 gốc (neo-brutalism tím/vàng, viền đen, bóng đổ cứng), đổi được màu chủ đạo |

Hai mẫu dùng chung schema, editor và logic các section; khác nhau ở "skin" (`templates/tn13/skin.tsx`, `brutal.module.css`). Thêm mẫu mới: đăng ký ở `templates/registry.ts` và `templates/skins.ts`.

## Chạy local

```bash
npm install
npm run dev        # http://localhost:3000, dữ liệu ở ./data (SQLite)
npm test           # build + test API
```

## Cách A: Vercel + Supabase

1. Tạo project trên [supabase.com](https://supabase.com). Vào **SQL Editor**, dán toàn bộ `supabase/schema.sql` rồi Run (tạo bảng, rate-limit, bucket ảnh `uploads`).
2. Lấy **Project URL** và **service_role key** (Project Settings → API).
3. Import repo vào Vercel, thêm env: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (xem `.env.example`). Deploy.

Lưu ý: key `service_role` chỉ dùng ở server. Bảng đã bật RLS và không có policy nên anon key không đọc được dữ liệu.

## Cách B: Chạy trực tiếp Node.js (SQLite)

```bash
npm install
npm run build
npm start          # dữ liệu ở ./data (SQLite + ảnh)
```

Backup hằng đêm (tuỳ chọn): `0 3 * * * cd /path/to/thiep-moi && ./scripts/backup.sh`.

## Ghi chú

- Mất link sửa là không sửa lại được (không có tài khoản). Trình duyệt đã tạo thiệp có danh sách ở `/my`.
- Chạy `npm test` khi có `SUPABASE_*` trong môi trường thì bộ test chạy trên chính project Supabase đó (sẽ tạo vài dòng thiệp thử).
