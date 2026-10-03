#!/bin/bash
# Install/reinstall the current user's LaunchAgent using modern launchctl.
set -euo pipefail

LABEL="com.rooms.suita-eyecatch-local-share"
PROJECT_DIR="/Users/uemuranaoya/rooms-suita-eyecatch-tool"
SOURCE="$PROJECT_DIR/launchd/$LABEL.plist"
TARGET="$HOME/Library/LaunchAgents/$LABEL.plist"
USER_ID="$(id -u)"

mkdir -p "$HOME/Library/LaunchAgents" "$HOME/Library/Logs"
/usr/bin/install -m 644 "$SOURCE" "$TARGET"

# A missing prior registration is normal. Only this exact label is removed.
/bin/launchctl bootout "gui/$USER_ID/$LABEL" 2>/dev/null || true
/bin/launchctl bootstrap "gui/$USER_ID" "$TARGET"
/bin/launchctl kickstart -k "gui/$USER_ID/$LABEL"

echo "Installed and started: $LABEL"
echo "Logs: $HOME/Library/Logs/rooms-local-share.log"
