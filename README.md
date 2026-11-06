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

## Server hiện tại: giữ nguyên dữ liệu khi deploy

- Service: `thiep-moi.service`, code tại `/opt/thiep-moi`.
- `DATA_DIR=/opt/thiep-moi/data` chứa SQLite (`app.db` và WAL) cùng `uploads/`.
- Nội dung đã duyệt nằm trong database, không nằm trong `templates/tn13/sample.ts`. Không seed hoặc ghi đè database khi cập nhật giao diện.
- Ảnh mẫu cũ `/sample/person.svg` chuyển tới hình tốt nghiệp mới qua redirect, giữ nguyên URL đã lưu trong thiệp.

Chạy local với cùng đường dẫn gốc như production để xem database đồng bộ mà không sửa URL trong dữ liệu:

```sh
NEXT_PUBLIC_BASE_PATH=/thiep-moi NEXT_DIST_DIR=.next-dev npm run dev -- --port 4010
# http://localhost:4010/thiep-moi/t/h2m4ns3n
```

Khi cần deploy, chạy `sh scripts/deploy.sh`. Script tạo snapshot SQLite nhất quán kèm ảnh vào `/home/ubuntu/backups/thiep-moi`, sau đó rsync **chỉ code**, giữ nguyên `data/`, `backups/` và `.env*` trên server. Không dùng `--delete-excluded`, không copy `data/` local lên production. Build dùng `NEXT_PUBLIC_BASE_PATH=/thiep-moi` và restart service với `DATA_DIR` hiện tại. Nếu build lỗi, script trả lỗi và thử khởi động lại service; có thể cần deploy lại code để phục hồi giao diện, snapshot dữ liệu vẫn được giữ.

Backup riêng: `DATA_DIR=/opt/thiep-moi/data BACKUP_DIR=/home/ubuntu/backups/thiep-moi sh scripts/backup.sh`. Script dùng Python 3 có sẵn trên server, không cần CLI `sqlite3`.

Để khôi phục: dừng service, giữ thêm bản sao thư mục `data/` hiện tại, giải nén snapshot vào **thư mục data mới**, đặt lại quyền cho `ubuntu`, rồi đổi thư mục và khởi động service. Không giải nén database lên một kết nối SQLite đang mở hoặc giữ lại WAL cũ khi thay database.

Màu chủ đạo và màu nhấn trong editor được áp dụng đồng bộ cho hoạt cảnh, chữ, nút, nền thiệp và preview. Nút Mặc định khôi phục bảng màu xanh pastel và vàng dịu. Toàn bộ lượt mở phong bì và hiện ảnh mất khoảng 1,2 giây trước khi bắt đầu tự cuộn.
