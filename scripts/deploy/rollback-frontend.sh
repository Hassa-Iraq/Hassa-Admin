#!/usr/bin/env bash
set -euo pipefail

DEPLOY_PATH="${DEPLOY_PATH:-$PWD}"
DEPLOY_BRANCH="${DEPLOY_BRANCH:-main}"
DEPLOY_MODE="${DEPLOY_MODE:-auto}" # auto|docker|systemd
SERVICE_NAME="${SERVICE_NAME:-hassa-admin-frontend}"

cd "${DEPLOY_PATH}"

if [[ ! -f ".deploy/previous_commit" ]]; then
  echo "Rollback marker not found at .deploy/previous_commit"
  exit 1
fi

target_commit="$(cat .deploy/previous_commit)"
echo "Rolling back to ${target_commit}"

git fetch origin "${DEPLOY_BRANCH}"
git checkout "${target_commit}"

run_mode="${DEPLOY_MODE}"
if [[ "${DEPLOY_MODE}" == "auto" ]]; then
  if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
    run_mode="docker"
  else
    run_mode="systemd"
  fi
fi

if [[ "${run_mode}" == "docker" ]]; then
  docker compose -f docker-compose.frontend.yml build
  docker compose -f docker-compose.frontend.yml up -d
else
  npm ci
  npm run build
  sudo systemctl restart "${SERVICE_NAME}"
fi

echo "Rollback completed."
