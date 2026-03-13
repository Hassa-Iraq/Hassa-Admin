#!/usr/bin/env bash
set -euo pipefail

DOMAIN="${1:-}"
ADMIN_DOMAIN="${2:-}"

if [[ -z "${DOMAIN}" ]]; then
  echo "Usage: $0 <root-domain> [admin-domain]"
  exit 1
fi

if [[ -z "${ADMIN_DOMAIN}" ]]; then
  ADMIN_DOMAIN="admin.${DOMAIN}"
fi

echo "== VPS Discovery Report =="
echo

echo "-- System --"
uname -a || true
if command -v lsb_release >/dev/null 2>&1; then
  lsb_release -a || true
fi
if [[ -f /etc/os-release ]]; then
  echo "os-release:"
  sed -n '1,12p' /etc/os-release || true
fi
echo

echo "-- Runtime Tooling --"
for bin in nginx docker docker-compose node npm pnpm yarn certbot ufw firewall-cmd ss; do
  if command -v "${bin}" >/dev/null 2>&1; then
    printf "%-15s installed\n" "${bin}"
  else
    printf "%-15s missing\n" "${bin}"
  fi
done
echo

echo "-- Versions --"
nginx -v 2>&1 || true
docker --version 2>/dev/null || true
docker compose version 2>/dev/null || true
node --version 2>/dev/null || true
npm --version 2>/dev/null || true
pnpm --version 2>/dev/null || true
yarn --version 2>/dev/null || true
certbot --version 2>/dev/null || true
echo

echo "-- Services --"
systemctl is-active nginx 2>/dev/null || true
systemctl is-enabled nginx 2>/dev/null || true
if command -v docker >/dev/null 2>&1; then
  docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Ports}}\t{{.Status}}' || true
fi
echo

echo "-- Nginx Active Server Blocks --"
if command -v nginx >/dev/null 2>&1; then
  sudo nginx -T 2>/dev/null | sed -n '/server_name/p' || true
fi
echo

echo "-- Nginx Routes Using /api --"
if command -v nginx >/dev/null 2>&1; then
  sudo nginx -T 2>/dev/null | grep -E "location\s+(/api|/backend-api)|proxy_pass" || true
fi
echo

echo "-- Listening Ports --"
if command -v ss >/dev/null 2>&1; then
  sudo ss -tulpn | sed -n '1,40p' || true
fi
echo

echo "-- Firewall --"
if command -v ufw >/dev/null 2>&1; then
  sudo ufw status verbose || true
fi
if command -v firewall-cmd >/dev/null 2>&1; then
  sudo firewall-cmd --list-all || true
fi
echo

echo "-- DNS --"
if command -v dig >/dev/null 2>&1; then
  echo "A records for ${DOMAIN}:"
  dig +short A "${DOMAIN}" || true
  echo "A records for ${ADMIN_DOMAIN}:"
  dig +short A "${ADMIN_DOMAIN}" || true
else
  echo "dig not installed; skipping DNS lookups."
fi
echo

echo "== End Report =="
