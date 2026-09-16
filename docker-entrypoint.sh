#!/bin/sh
set -eu

CONFIG_FILE="/app/dist/fit-admin/browser/fitadmin-config.js"
API_URL_ESCAPED="$(printf '%s' "${FITADMIN_API_URL:-}" | sed "s/'/'\\\\''/g")"

cat > "$CONFIG_FILE" <<EOF
window.__FITADMIN_API_URL__ = '$API_URL_ESCAPED';
EOF

exec "$@"
