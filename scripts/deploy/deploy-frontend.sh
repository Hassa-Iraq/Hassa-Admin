#!/usr/bin/env bash
set -euo pipefail

DEPLOY_PATH="${DEPLOY_PATH:-$PWD}"
DEPLOY_MODE="${DEPLOY_MODE:-auto}"
SERVICE_NAME="${SERVICE_NAME:-hassa-admin-frontend}"
APP_PORT="${APP_PORT:-3008}"
DOMAIN="${DOMAIN:-}"
ADMIN_DOMAIN="${ADMIN_DOMAIN:-}"
HEALTHCHECK_PATH="${HEALTHCHECK_PATH:-/}"

if [[ -z "${DOMAIN}" ]]; then
  echo "DOMAIN is required."
  exit 1
fi

if [[ -z "${ADMIN_DOMAIN}" ]]; then
  ADMIN_DOMAIN="admin.${DOMAIN}"
fi

cd "${DEPLOY_PATH}"

run_mode="${DEPLOY_MODE}"
if [[ "${DEPLOY_MODE}" == "auto" ]]; then
  if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
    run_mode="docker"
  else
    run_mode="systemd"
  fi
fi

echo "Deploy mode: ${run_mode}"

if [[ "${run_mode}" == "docker" ]]; then
  if ! command -v docker >/dev/null 2>&1; then
    echo "Docker is required for docker mode."
    exit 1
  fi
  if ! docker compose version >/dev/null 2>&1; then
    echo "Docker Compose v2 is required for docker mode."
    exit 1
  fi

  docker compose -f docker-compose.frontend.yml build
  docker compose -f docker-compose.frontend.yml up -d
else
  if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
    echo "Node.js and npm are required for systemd mode."
    exit 1
  fi

  npm ci
  npm run build

  sudo tee "/etc/systemd/system/${SERVICE_NAME}.service" >/dev/null <<EOF
[Unit]
Description=${SERVICE_NAME}
After=network.target

[Service]
Type=simple
WorkingDirectory=${DEPLOY_PATH}
ExecStart=/usr/bin/env npm run start -- --hostname 127.0.0.1 --port ${APP_PORT}
Restart=always
RestartSec=5
Environment=NODE_ENV=production
EnvironmentFile=-${DEPLOY_PATH}/.env.production
User=${USER}

[Install]
WantedBy=multi-user.target
EOF

  sudo systemctl daemon-reload
  sudo systemctl enable "${SERVICE_NAME}"
  sudo systemctl restart "${SERVICE_NAME}"
fi

for attempt in 1 2 3 4 5; do
  if curl -fsS "https://${ADMIN_DOMAIN}${HEALTHCHECK_PATH}" >/dev/null; then
    echo "Health check passed on attempt ${attempt}."
    exit 0
  fi
  sleep 3
done

echo "Health check failed after deploy."
exit 1
