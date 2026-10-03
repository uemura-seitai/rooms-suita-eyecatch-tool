#!/bin/bash
# LaunchAgent entrypoint. Keep the absolute Node/npm path because launchd does
# not inherit the interactive shell's PATH (nvm/Homebrew setup included).
set -euo pipefail

PROJECT_DIR="/Users/uemuranaoya/rooms-suita-eyecatch-tool"
export PATH="/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

cd "$PROJECT_DIR"
exec /usr/local/bin/npm run local-share
