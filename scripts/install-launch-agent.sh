#!/bin/bash
# Install/reinstall the current user's LaunchAgent using modern launchctl.
set -euo pipefail

LABEL="com.rooms.suita-eyecatch-local-share"
PROJECT_DIR="/Users/uemuranaoya/rooms-suita-eyecatch-tool"
SOURCE="$PROJECT_DIR/launchd/$LABEL.plist"
OWNER_USER="$(/usr/bin/stat -f%Su "$PROJECT_DIR")"
OWNER_HOME="$(/usr/bin/dscl . -read "/Users/$OWNER_USER" NFSHomeDirectory | /usr/bin/awk '{print $2}')"
TARGET="$OWNER_HOME/Library/LaunchAgents/$LABEL.plist"
USER_ID="$(/usr/bin/id -u "$OWNER_USER")"

mkdir -p "$OWNER_HOME/Library/LaunchAgents" "$OWNER_HOME/Library/Logs"
/usr/bin/install -m 644 "$SOURCE" "$TARGET"

# A missing prior registration is normal. Only this exact label is removed.
/bin/launchctl bootout "gui/$USER_ID/$LABEL" 2>/dev/null || true
/bin/launchctl bootstrap "gui/$USER_ID" "$TARGET"
/bin/launchctl kickstart -k "gui/$USER_ID/$LABEL"

echo "Installed and started: $LABEL"
echo "Logs: $HOME/Library/Logs/rooms-local-share.log"
