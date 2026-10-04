#!/bin/bash
# Create a private LAN CA and a Bonjour-name server certificate if missing.
# This script deliberately does not alter Keychain trust, so it is safe for
# launchd to call on every login. Run setup-local-https.sh once for trust.
set -euo pipefail

PROJECT_DIR="/Users/uemuranaoya/rooms-suita-eyecatch-tool"
CERT_DIR="$PROJECT_DIR/.local-certs"
CA_KEY="$CERT_DIR/rooms-local-ca-key.pem"
CA_CERT="$CERT_DIR/rooms-local-ca-cert.pem"
CA_CERT_IOS="$CERT_DIR/rooms-local-ca-cert.cer"
SERVER_KEY="$CERT_DIR/server-key.pem"
SERVER_CERT="$CERT_DIR/server-cert.pem"

LOCAL_NAME="$(/usr/sbin/scutil --get LocalHostName 2>/dev/null || /bin/hostname -s)"
LOCAL_NAME="${LOCAL_NAME%.local}"
BONJOUR_NAME="$LOCAL_NAME.local"

if [[ -f "$CA_KEY" && -f "$CA_CERT" && -f "$SERVER_KEY" && -f "$SERVER_CERT" && -f "$CA_CERT_IOS" ]]; then
  exit 0
fi

umask 077
mkdir -p "$CERT_DIR"
if [[ ! -f "$CA_KEY" || ! -f "$CA_CERT" ]]; then
  /usr/bin/openssl genrsa -out "$CA_KEY" 4096
  /usr/bin/openssl req -x509 -new -nodes -key "$CA_KEY" -sha256 -days 3650 \
    -subj "/CN=ROOMs Shared Library Local CA" -out "$CA_CERT"
fi
/usr/bin/openssl x509 -in "$CA_CERT" -outform der -out "$CA_CERT_IOS"

/usr/bin/openssl genrsa -out "$SERVER_KEY" 2048
CONFIG_FILE="$(/usr/bin/mktemp)"
trap '/bin/rm -f "$CONFIG_FILE"' EXIT
cat > "$CONFIG_FILE" <<EOF
[req]
distinguished_name = dn
prompt = no
[dn]
CN = $BONJOUR_NAME
[v3_server]
subjectAltName = DNS:$BONJOUR_NAME,DNS:localhost,IP:127.0.0.1
keyUsage = critical,digitalSignature,keyEncipherment
extendedKeyUsage = serverAuth
EOF
/usr/bin/openssl req -new -key "$SERVER_KEY" -out "$CERT_DIR/server.csr" -config "$CONFIG_FILE"
/usr/bin/openssl x509 -req -in "$CERT_DIR/server.csr" -CA "$CA_CERT" -CAkey "$CA_KEY" -CAcreateserial \
  -CAserial "$CERT_DIR/rooms-local-ca-cert.srl" -out "$SERVER_CERT" -days 825 -sha256 -extfile "$CONFIG_FILE" -extensions v3_server
/bin/rm -f "$CERT_DIR/server.csr" "$CERT_DIR/rooms-local-ca-cert.srl"
echo "Created local HTTPS certificate for https://$BONJOUR_NAME:8787"
