#!/usr/bin/env bash
set -euo pipefail

DEST="/var/www/lioneto-cms/node_modules/@strapi/admin/dist/server/server/build"
SRC="/var/www/lioneto-cms/dist/build"

if [ ! -f "$SRC/index.html" ]; then
  echo "[fix] ERROR: $SRC/index.html not found. Run: npm run build"
  exit 1
fi

rm -rf "$DEST"
mkdir -p "$(dirname "$DEST")"
ln -s "$SRC" "$DEST"

echo "[fix] OK: linked $DEST -> $SRC"
