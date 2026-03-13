#!/usr/bin/env bash
set -euo pipefail

DEPLOY_PATH="${DEPLOY_PATH:-$PWD}"
DEPLOY_BRANCH="${DEPLOY_BRANCH:-main}"
DEPLOY_MODE="${DEPLOY_MODE:-auto}" # auto|docker|systemd
APP_NAME="${APP_NAME:-hassa-admin-frontend}"
SERVICE_NAME="${SERVICE_NAME:-hassa-admin-frontend}"
APP_PORT="${APP_PORT:-3008}"
SITE_FILENAME="${SITE_FILENAME:-hassa-admin-frontend.conf}"
DOMAIN="${DOMAIN:-}"
ADMIN_DOMAIN="${ADMIN_DOMAIN:-}"
LETSENCRYPT_EMAIL="${LETSENCRYPT_EMAIL:-}"
HEALTHCHECK_PATH="${HEALTHCHECK_PATH:-/}"

reload_or_restart_nginx() {
  if sudo systemctl is-active --quiet nginx; then
    sudo systemctl reload nginx
  else
    # Some hosts have nginx installed but inactive after package changes.
    sudo systemctl restart nginx
  fi
}

if [[ -z "${DOMAIN}" ]]; then
  echo "DOMAIN is required."
  exit 1
fi

if [[ -z "${ADMIN_DOMAIN}" ]]; then
  ADMIN_DOMAIN="admin.${DOMAIN}"
fi

if [[ -z "${LETSENCRYPT_EMAIL}" ]]; then
  echo "LETSENCRYPT_EMAIL is required."
  exit 1
fi

rollback_marker_dir="${DEPLOY_PATH}/.deploy"
mkdir -p "${rollback_marker_dir}"

cd "${DEPLOY_PATH}"

current_commit="$(git rev-parse --short HEAD)"
echo "${current_commit}" > "${rollback_marker_dir}/previous_commit"

git fetch origin "${DEPLOY_BRANCH}"
git checkout "${DEPLOY_BRANCH}"
git pull --ff-only origin "${DEPLOY_BRANCH}"

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
Description=${APP_NAME}
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

sudo mkdir -p /var/www/certbot

sudo tee "/etc/nginx/sites-available/${SITE_FILENAME}" >/dev/null <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${ADMIN_DOMAIN};

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF

if [[ ! -L "/etc/nginx/sites-enabled/${SITE_FILENAME}" ]]; then
  sudo ln -s "/etc/nginx/sites-available/${SITE_FILENAME}" "/etc/nginx/sites-enabled/${SITE_FILENAME}"
fi

sudo nginx -t
reload_or_restart_nginx

if command -v certbot >/dev/null 2>&1; then
  sudo certbot certonly --webroot -w /var/www/certbot -d "${ADMIN_DOMAIN}" \
    --agree-tos --email "${LETSENCRYPT_EMAIL}" --non-interactive --keep-until-expiring
fi

if [[ -f "/etc/letsencrypt/live/${ADMIN_DOMAIN}/fullchain.pem" && -f "/etc/letsencrypt/live/${ADMIN_DOMAIN}/privkey.pem" ]]; then
  sudo tee "/etc/nginx/sites-available/${SITE_FILENAME}" >/dev/null <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${ADMIN_DOMAIN};

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://\$host\$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${ADMIN_DOMAIN};

    ssl_certificate /etc/letsencrypt/live/${ADMIN_DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${ADMIN_DOMAIN}/privkey.pem;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:10m;
    ssl_session_tickets off;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF
fi

sudo nginx -t
reload_or_restart_nginx

for attempt in 1 2 3 4 5; do
  if curl -fsS "https://${ADMIN_DOMAIN}${HEALTHCHECK_PATH}" >/dev/null; then
    echo "Health check passed on attempt ${attempt}."
    exit 0
  fi
  sleep 3
done

echo "Health check failed after deploy."
exit 1
