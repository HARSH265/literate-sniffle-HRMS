#!/usr/bin/env bash
# scripts/vault-setup.sh – Seed local Vault with HRMS secrets (dev only)
# -----------------------------------------------------------------
# Ensure VAULT_ADDR and VAULT_TOKEN are set (defaults for local dev)
#   VAULT_ADDR defaults to http://127.0.0.1:8200
#   VAULT_TOKEN defaults to the root token defined in docker-compose.yml
# -----------------------------------------------------------------

set -e

VAULT_ADDR=${VAULT_ADDR:-http://127.0.0.1:8200}
VAULT_TOKEN=${VAULT_TOKEN:-root-token}

# Helper: print a nice message
info() { echo -e "\033[1;34m[INFO]\033[0m $*"; }

info "Seeding Vault at ${VAULT_ADDR} with path secret/data/hrms"

vault kv put secret/data/hrms \
  MONGODB_URI="mongodb://user:pass@host:27017/hrms" \
  JWT_SECRET="$(openssl rand -base64 32)" \
  JWT_REFRESH_SECRET="$(openssl rand -base64 32)" \
  ENCRYPTION_KEY="$(openssl rand -hex 32)" \
  CLOUDINARY_CLOUD_NAME="mycloud" \
  CLOUDINARY_API_KEY="123456789" \
  CLOUDINARY_API_SECRET="abcdefg" \
  EMAIL_HOST="smtp.example.com" \
  EMAIL_PORT="587" \
  EMAIL_USER="smtp_user" \
  EMAIL_PASSWORD="smtp_password" \
  EMAIL_FROM="no-reply@example.com"

info "✅ Vault secret store populated under secret/data/hrms"
