#!/bin/sh
# Chỉ deploy code; database và ảnh production luôn được giữ lại.
set -eu
cd "$(dirname "$0")/.."
REMOTE=ubuntu@18.143.143.25
KEY="$HOME/.ssh/aws-boom-tag.pem"

# Snapshot SQLite và uploads trước khi chạm vào code đang chạy.
scp -i "$KEY" -o IdentitiesOnly=yes scripts/backup.sh "$REMOTE:/tmp/thiep-moi-backup.sh"
ssh -i "$KEY" -o IdentitiesOnly=yes "$REMOTE" \
  'cd /opt/thiep-moi && DATA_DIR=/opt/thiep-moi/data BACKUP_DIR=/home/ubuntu/backups/thiep-moi sh /tmp/thiep-moi-backup.sh'

# Không thêm --delete-excluded: các thư mục bị loại trừ là dữ liệu phải giữ.
rsync -az --delete -e "ssh -i $KEY -o IdentitiesOnly=yes" \
  --exclude='/data/' --exclude='/backups/' --exclude='/.env*' \
  --exclude='/.git/' --exclude='/node_modules/' --exclude='/.next*' \
  --exclude='*.tsbuildinfo' --exclude='/next-env.d.ts' \
  ./ "$REMOTE:/opt/thiep-moi/"

ssh -i "$KEY" -o IdentitiesOnly=yes "$REMOTE" 'sh -s' <<'REMOTE'
set -eu
cd /opt/thiep-moi
sudo systemctl stop thiep-moi
trap 'sudo systemctl start thiep-moi' EXIT
npm ci
NEXT_PUBLIC_BASE_PATH=/thiep-moi SITE_URL=https://minihub.io.vn npm run build
REMOTE
