#!/bin/sh
# Snapshot nhất quán của SQLite đang chạy, kèm toàn bộ ảnh upload.
set -eu
python3 - "${DATA_DIR:-./data}" "${BACKUP_DIR:-./backups}" <<'PY'
import datetime
import pathlib
import sqlite3
import sys
import tarfile
import tempfile

source, output = map(pathlib.Path, sys.argv[1:])
source = source.resolve()
output.mkdir(parents=True, exist_ok=True)
stamp = datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%d-%H%M%S-%f')
archive = output / f'thiep-moi-data-{stamp}.tar.gz'
with tempfile.TemporaryDirectory(dir=output) as temporary:
    snapshot = pathlib.Path(temporary) / 'app.db'
    with sqlite3.connect(f'{source.as_uri()}/app.db?mode=ro', uri=True) as live:
        with sqlite3.connect(snapshot) as destination:
            live.backup(destination)
            if destination.execute('PRAGMA integrity_check').fetchone()[0] != 'ok':
                raise RuntimeError('SQLite integrity check failed')
    with tarfile.open(archive, 'w:gz') as bundle:
        bundle.add(snapshot, arcname='app.db')
        if (source / 'uploads').exists():
            bundle.add(source / 'uploads', arcname='uploads')
print(archive.resolve())
PY
