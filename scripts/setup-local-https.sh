#!/bin/bash
# One-time administrator setup: create the local CA/server certificate and
# trust its CA in this Mac user's login keychain.
set -euo pipefail

PROJECT_DIR="/Users/uemuranaoya/rooms-suita-eyecatch-tool"
"$PROJECT_DIR/scripts/ensure-local-https.sh"
CA_CERT="$PROJECT_DIR/.local-certs/rooms-local-ca-cert.pem"
OWNER_USER="$(/usr/bin/stat -f%Su "$PROJECT_DIR")"
OWNER_HOME="$(/usr/bin/dscl . -read "/Users/$OWNER_USER" NFSHomeDirectory | /usr/bin/awk '{print $2}')"
SECURITY_ARGS=(add-trusted-cert -d -r trustRoot -k "$OWNER_HOME/Library/Keychains/login.keychain-db" "$CA_CERT")
if [[ "$(/usr/bin/id -u)" -eq 0 && "$OWNER_USER" != "root" ]]; then
  /usr/bin/sudo -u "$OWNER_USER" /usr/bin/security "${SECURITY_ARGS[@]}"
else
  /usr/bin/security "${SECURITY_ARGS[@]}"
fi
echo "Local CA is trusted on this Mac. Install $PROJECT_DIR/.local-certs/rooms-local-ca-cert.cer on iPhone once, then enable full trust in Settings."
