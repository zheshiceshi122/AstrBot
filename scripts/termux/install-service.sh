#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail

DISTRO="${1:-ubuntu}"
ASTRBOT_DIR="${2:-/root/AstrBot}"
SERVICE_NAME="astrbot"
SERVICE_PARENT="${PREFIX:?Run this script from Termux, not inside the Ubuntu proot}/var/service"
SERVICE_DIR="$SERVICE_PARENT/$SERVICE_NAME"

if ! command -v proot-distro >/dev/null 2>&1; then
  echo "Install proot-distro first: pkg install proot-distro" >&2
  exit 1
fi
if ! command -v sv-enable >/dev/null 2>&1 || [ ! -x "$PREFIX/share/termux-services/svlogger" ]; then
  echo "Install termux-services, open a new Termux session, then run this script again." >&2
  exit 1
fi
if [[ ! "$DISTRO" =~ ^[A-Za-z0-9_-]+$ ]]; then
  echo "Distro name may contain only letters, numbers, underscores, and hyphens." >&2
  exit 1
fi
if [[ ! "$ASTRBOT_DIR" =~ ^/[A-Za-z0-9_./-]+$ ]]; then
  echo "AstrBot path must be an absolute path without spaces or shell characters." >&2
  exit 1
fi
if [ -e "$SERVICE_DIR" ]; then
  echo "Service already exists at $SERVICE_DIR; refusing to overwrite it." >&2
  exit 1
fi

TMP_SERVICE_DIR="$(mktemp -d "$PREFIX/tmp/astrbot-service.XXXXXX")"
trap 'rm -rf -- "$TMP_SERVICE_DIR"' EXIT
mkdir -p "$TMP_SERVICE_DIR/log"
touch "$TMP_SERVICE_DIR/down"
cat > "$TMP_SERVICE_DIR/run" <<EOF
#!$PREFIX/bin/sh
exec proot-distro login --user root '$DISTRO' -- /bin/sh -lc 'export PATH="$HOME/.local/bin:$PATH"; cd "$ASTRBOT_DIR" && exec uv run --no-sync main.py'
EOF
cat > "$TMP_SERVICE_DIR/log/run" <<EOF
#!$PREFIX/bin/sh
exec $PREFIX/share/termux-services/svlogger
EOF
chmod 700 "$TMP_SERVICE_DIR/run" "$TMP_SERVICE_DIR/log/run"
mv "$TMP_SERVICE_DIR" "$SERVICE_DIR"
trap - EXIT
sv-enable "$SERVICE_NAME"
echo "AstrBot service enabled. Check it with: sv status $SERVICE_NAME"
