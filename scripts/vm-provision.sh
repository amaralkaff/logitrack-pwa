#!/usr/bin/env bash
# Runs ON the VM. Installs Node 22, MongoDB 7, Caddy, prepares /srv/logitrack.
set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then exec sudo -E bash "$0" "$@"; fi

export DEBIAN_FRONTEND=noninteractive

echo "▶ apt update"
apt-get update -y
apt-get install -y curl gnupg ca-certificates lsb-release git ufw

# ── Node 22 (NodeSource) ────────────────────────────────────────────────
if ! command -v node >/dev/null || [[ "$(node -v)" != v22.* ]]; then
  echo "▶ Install Node 22"
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi

# ── MongoDB 7 (official repo) ───────────────────────────────────────────
if ! command -v mongod >/dev/null; then
  echo "▶ Install MongoDB 7"
  curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg -o /usr/share/keyrings/mongo-7.gpg --dearmor
  echo "deb [arch=amd64,arm64 signed-by=/usr/share/keyrings/mongo-7.gpg] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" \
    > /etc/apt/sources.list.d/mongodb-org-7.0.list
  apt-get update -y
  apt-get install -y mongodb-org
  # Bind only to localhost (Node reaches it over loopback).
  sed -i 's/^  bindIp:.*/  bindIp: 127.0.0.1/' /etc/mongod.conf
  systemctl enable --now mongod
fi

# ── Caddy (auto-HTTPS reverse proxy) ────────────────────────────────────
if ! command -v caddy >/dev/null; then
  echo "▶ Install Caddy"
  apt-get install -y debian-keyring debian-archive-keyring apt-transport-https
  curl -fsSL https://dl.cloudsmith.io/public/caddy/stable/gpg.key | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -fsSL https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt > /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -y
  apt-get install -y caddy
fi

# ── App user + dir ──────────────────────────────────────────────────────
id -u app >/dev/null 2>&1 || useradd --system --shell /usr/sbin/nologin --home /srv/logitrack app
mkdir -p /srv/logitrack
chown -R app:app /srv/logitrack

# ── systemd service for Node API ────────────────────────────────────────
cat >/etc/systemd/system/logitrack.service <<'UNIT'
[Unit]
Description=LogiTrack API
After=network.target mongod.service
Requires=mongod.service

[Service]
Type=simple
User=app
WorkingDirectory=/srv/logitrack
EnvironmentFile=/etc/logitrack.env
ExecStart=/usr/bin/node build/server/index.js
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
UNIT

# Env file — populated by deploy step.
[[ -f /etc/logitrack.env ]] || cat >/etc/logitrack.env <<'ENV'
NODE_ENV=production
PORT=8080
MONGODB_URI=mongodb://127.0.0.1:27017/logitrack
MONGODB_DB=logitrack
CORS_ORIGINS=https://logitrack-pwa.vercel.app
ENV
chmod 640 /etc/logitrack.env

systemctl daemon-reload
systemctl enable logitrack.service || true

echo "▶ Provision done. Deploy code next."
