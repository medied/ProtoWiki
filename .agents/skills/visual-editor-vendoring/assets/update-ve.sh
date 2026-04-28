#!/usr/bin/env bash
# Snapshot the upstream Wikipedia VisualEditor bundle into
# public/visualeditor/ so it ships with the prototype.
#
# Usage:
#   bash update-ve.sh                  # writes to ./public/visualeditor/
#   bash update-ve.sh path/to/dir/
#
# Re-run every few months; VE moves fast.

set -euo pipefail

OUT_DIR="${1:-public/visualeditor}"
mkdir -p "$OUT_DIR"

UA='ProtoWiki-VE-snapshot/0.1 (https://github.com/<org>/protowiki; <contact>)'
HOST='https://en.wikipedia.org'

# VE platform prerequisites (must load before VE itself)
PLATFORM_MODULES='startup|jquery|mediawiki.base|mediawiki.util|mediawiki.user|oojs|oojs-ui-core|oojs-ui-windows|oojs-ui-toolbars|oojs-ui-widgets'

# VE itself (init + the most common dependencies)
VE_MODULES='ext.visualEditor.core|ext.visualEditor.mwcore|ext.visualEditor.mwformatting|ext.visualEditor.mwlink|ext.visualEditor.mwimage|ext.visualEditor.mwtransclusion|ext.visualEditor.mwreference|ext.visualEditor.toolbar|ext.visualEditor.targetLoader|ext.visualEditor.desktopArticleTarget|ext.visualEditor.desktopArticleTarget.init'

encode() {
  python3 -c 'import sys,urllib.parse;print(urllib.parse.quote(sys.argv[1], safe=""))' "$1"
}

fetch_bundle() {
  local label=$1
  local modules=$2
  local kind=$3   # 'styles' or 'scripts'
  local ext=$4    # 'css' or 'js'
  local file="$OUT_DIR/${label}.${ext}"

  local encoded
  encoded=$(encode "$modules")

  local url="$HOST/w/load.php?lang=en&modules=${encoded}&only=${kind}&skin=vector-2022&debug=false"

  echo "Fetching $label.$ext"
  curl -sSL --user-agent "$UA" "$url" > "$file"
  echo "  → $(wc -c < "$file") bytes"
}

fetch_bundle 'platform' "$PLATFORM_MODULES" 'styles'  'css'
fetch_bundle 'platform' "$PLATFORM_MODULES" 'scripts' 'js'
fetch_bundle 've'        "$VE_MODULES"       'styles'  'css'
fetch_bundle 've'        "$VE_MODULES"       'scripts' 'js'

# Rewrite :root in VE / platform CSS to [data-theme="light"] so the
# bundle plays nicely with ProtoWiki's runtime theme attribute.
for f in "$OUT_DIR/platform.css" "$OUT_DIR/ve.css"; do
  python3 -c "
import re, sys
p = sys.argv[1]
s = open(p, encoding='utf-8').read()
s = re.sub(r':root\b', '[data-theme=\"light\"]', s)
open(p, 'w', encoding='utf-8').write(s)
" "$f"
done

cat <<EOF > "$OUT_DIR/README.md"
# Vendored VisualEditor bundle

Snapshotted by \`update-ve.sh\` from \`$HOST\` for ProtoWiki.

Files:
- \`platform.{js,css}\` — MediaWiki / OOjs / OOjs UI base.
- \`ve.{js,css}\` — VisualEditor core + common modules.

CSS \`:root\` selectors have been rewritten to \`[data-theme="light"]\`.

To refresh: \`bash update-ve.sh\`.
EOF

echo "Done. Vendored VE in $OUT_DIR/."
