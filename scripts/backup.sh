#!/bin/sh
# Backup SQLite an toàn khi đang chạy (dùng .backup, không cp). Cron hằng đêm trên VM:
#   0 3 * * * cd /path/to/thiep-moi && ./scripts/backup.sh
# Ảnh upload nằm ở data/uploads: rsync/tar thư mục đó riêng nếu cần.
set -eu
DATA="${DATA_DIR:-./data}"
OUT="${BACKUP_DIR:-./backups}"
mkdir -p "$OUT"
sqlite3 "$DATA/app.db" ".backup '$OUT/app-$(date +%Y%m%d-%H%M%S).db'"
find "$OUT" -name 'app-*.db' -mtime +14 -delete
