#!/usr/bin/env bash
# Runs FROM local machine. Builds server + ships to VM + reloads systemd unit.
set -euo pipefail

PROJECT="${PROJECT:-logitrack-pwa}"
ZONE="${ZONE:-asia-southeast1-b}"
INSTANCE="${INSTANCE:-logitrack-backend}"

SSH() { gcloud compute ssh "$INSTANCE" --zone "$ZONE" --project "$PROJECT" --command "$*"; }
SCP() { gcloud compute scp --zone "$ZONE" --project "$PROJECT" --recurse "$@"; }

echo "▶ Build server locally"
node node_modules/typescript/bin/tsc -p tsconfig.server.json

echo "▶ Ship build + package.json to /srv/logitrack"
# Stage in /tmp first (app user owns /srv/logitrack)
SSH "sudo rm -rf /tmp/logitrack-stage && mkdir -p /tmp/logitrack-stage"
SCP build package.json "$INSTANCE:/tmp/logitrack-stage/"
SSH "sudo rsync -a --delete /tmp/logitrack-stage/ /srv/logitrack/ && sudo chown -R app:app /srv/logitrack"

echo "▶ Install prod deps on VM"
SSH "cd /srv/logitrack && sudo -u app npm install --omit=dev"

echo "▶ Ensure Caddyfile + restart Caddy + logitrack"
IP="$(gcloud compute instances describe "$INSTANCE" --zone "$ZONE" --project "$PROJECT" --format='value(networkInterfaces[0].accessConfigs[0].natIP)')"
DOMAIN="${IP//./-}.sslip.io"
echo "▶ Using domain: $DOMAIN"

CADDYFILE="$(cat <<EOF
$DOMAIN {
  encode zstd gzip
  reverse_proxy 127.0.0.1:8080
}
EOF
)"

SSH "echo '$CADDYFILE' | sudo tee /etc/caddy/Caddyfile >/dev/null && sudo systemctl restart caddy"
SSH "sudo systemctl restart logitrack && sudo systemctl status logitrack --no-pager -l | head -20"

echo "▶ Health check"
sleep 3
curl -fsSL "https://$DOMAIN/healthz" && echo
echo "▶ Done. Backend: https://$DOMAIN"
