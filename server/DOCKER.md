# HRMS Backend — Docker & Infrastructure Guide

This document covers everything you need to know about running the HRMS backend infrastructure using Docker — from local development to production deployment.

---

## Table of Contents

1. [Why Docker?](#why-docker)
2. [Architecture Overview](#architecture-overview)
3. [Local Development Setup](#local-development-setup)
4. [Container Details](#container-details)
5. [Secret Management with Vault](#secret-management-with-vault)
6. [Database Setup](#database-setup)
7. [Caching with Redis](#caching-with-redis)
8. [Production Deployment](#production-deployment)
9. [Troubleshooting](#troubleshooting)
10. [Command Reference](#command-reference)

---

## Why Docker?

Docker solves several critical problems for this project:

| Problem | Docker Solution |
|---------|----------------|
| "It works on my machine" | Every developer runs the exact same Redis, MongoDB, and Vault versions |
| Secrets in source code | Vault runs locally, secrets never touch `.env` files in git |
| Complex manual installs | `docker compose up` starts everything with one command |
| Environment drift | Containers are reproducible across machines |
| Production parity | Dev mirrors production topology (same services, same configs) |
| Easy teardown | `docker compose down` removes everything cleanly |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Your Machine (Host)                   │
│                                                         │
│   ┌──────────────┐                                      │
│   │  Node.js App │ ◄── Reads secrets from Vault         │
│   │  (port 5000) │ ◄── Connects to MongoDB (port 27017) │
│   │              │ ◄── Connects to Redis (port 6379)     │
│   └──────┬───────┘                                      │
│          │                                              │
└──────────┼──────────────────────────────────────────────┘
           │
    ┌──────┼──────────────────────────────────┐
    │      │        Docker Network             │
    │  ┌───┴────┐  ┌──────────┐  ┌─────────┐ │
    │  │ Redis  │  │  Vault   │  │ MongoDB │ │
    │  │ :6379  │  │  :8200   │  │ :27017  │ │
    │  └────────┘  └──────────┘  └─────────┘ │
    └─────────────────────────────────────────┘
```

The Node.js application runs **outside** Docker (on your host machine) during development. It connects to three Docker containers through their mapped ports.

---

## Local Development Setup

### Prerequisites

1. **Docker Desktop** installed and running ([Download](https://www.docker.com/products/docker-desktop))
2. **Node.js v20+** and **npm** installed ([Download](https://nodejs.org))
3. **Git** installed

### Step 1 — Start All Containers

```bash
# From the repository root (C:\Users\Admin\Downloads\HRMS)
docker compose up -d
```

This command starts three containers:

| Container | Image | Port | Purpose |
|-----------|-------|------|---------|
| `hrms-redis` | `redis:7-alpine` | 6379 | Caching & token blacklist |
| `hrms-vault` | `hashicorp/vault:latest` | 8200 | Secret management |
| `hrms-mongo` | `mongo:6` | 27017 | Primary database |

### Step 2 — Verify Containers Are Running

```bash
docker ps --filter "name=hrms-"
```

Expected output:

```
NAMES         IMAGE                STATUS          PORTS
hrms-redis    redis:7-alpine       Up (healthy)    0.0.0.0:6379->6379
hrms-vault    hashicorp/vault:latest Up (healthy)  0.0.0.0:8200->8200
hrms-mongo    mongo:6              Up              0.0.0.0:27017->27017
```

### Step 3 — Seed Vault with Secrets

The first time you start the stack, Vault is empty. You need to store all sensitive configuration:

```bash
# Set the Vault address (used by the CLI inside the container)
docker exec -e VAULT_ADDR=http://127.0.0.1:8200 hrms-vault vault kv put secret/hrms \
  MONGODB_URI="mongodb://localhost:27017/hrms" \
  JWT_SECRET="replace-with-a-strong-random-string" \
  JWT_REFRESH_SECRET="replace-with-another-strong-random-string" \
  ENCRYPTION_KEY="replace-with-a-32-character-hex-string" \
  CLOUDINARY_CLOUD_NAME="your-cloud-name" \
  CLOUDINARY_API_KEY="your-api-key" \
  CLOUDINARY_API_SECRET="your-api-secret" \
  EMAIL_HOST="smtp.example.com" \
  EMAIL_PORT="587" \
  EMAIL_USER="your-smtp-user" \
  EMAIL_PASSWORD="your-smtp-password" \
  EMAIL_FROM="no-reply@yourdomain.com"
```

> **Note:** This is a one-time operation. Secrets persist as long as the Vault container is running (dev mode stores data in memory). If you restart the Vault container, you must re-seed.

A helper script is available at `scripts/vault-setup.sh` that automates this with random key generation.

### Step 4 — Configure Server Environment

Create `server/.env` with only non-secret values:

```dotenv
PORT=5000
CLIENT_URL=http://localhost:5173
VAULT_ADDR=http://127.0.0.1:8200
VAULT_TOKEN=root-token
RATE_LIMIT_ENABLED=true
```

> **Why so few entries?** All sensitive values (database URI, JWT secrets, API keys) are stored in Vault and loaded at runtime. The `.env` file only contains values that are safe to commit or are not security-critical.

### Step 5 — Install Dependencies & Start the Server

```bash
cd server
npm install
npm run dev
```

You should see:

```
MongoDB connected successfully
Server running on port 5000 in development mode
Socket.io initialized
Socket.io Redis adapter initialized
```

### Step 6 — Verify Everything Works

```bash
# Health check
curl http://localhost:5000/api/v1/health
```

---

## Container Details

### Redis (`hrms-redis`)

**Image:** `redis:7-alpine`
**Port:** `6379`
**Purpose:** In-memory caching for master data (holidays, shifts, etc.) and the JWT token blacklist.

**Configuration:**
- Append-only persistence enabled (`--appendonly yes`)
- Health check: `redis-cli ping` every 5 seconds
- Data is ephemeral (lost on container restart — acceptable for dev)

**Why Redis?**
- Token blacklist needs to persist across server restarts (MongoDB-backed blacklist was too slow)
- Future Socket.io clustering requires a shared pub/sub layer
- Cache hit rates reduce MongoDB load by 80%+ on frequently-read master data

### Vault (`hrms-vault`)

**Image:** `hashicorp/vault:latest`
**Port:** `8200`
**Purpose:** Secure storage for all application secrets.

**Configuration:**
- Running in **dev mode** (in-memory storage, unsealed, static root token)
- Root token: `root-token` (set via `VAULT_DEV_ROOT_TOKEN_ID`)
- Health check: `vault status -format=json` with `VAULT_ADDR` set to HTTP
- IPC_LOCK capability prevents the Vault process from being swapped to disk

**Important:** Dev mode is **not** for production. See the [Production Deployment](#production-deployment) section for proper Vault setup.

**How Vault Works:**
1. The app starts and calls `VaultService.loadAll()`
2. This makes an HTTP GET request to `http://127.0.0.1:8200/v1/secret/data/hrms`
3. Vault returns all secrets stored under the `secret/hrms` path
4. Secrets are cached in memory for the lifetime of the process
5. `env.ts` reads from this cache instead of `process.env`

### MongoDB (`hrms-mongo`)

**Image:** `mongo:6`
**Port:** `27017`
**Purpose:** Primary application database.

**Configuration:**
- No authentication (dev only — production MUST enable auth)
- Data stored in anonymous Docker volume (persists across container restarts)
- The connection string in Vault uses `localhost:27017` (host-accessible port)

---

## Secret Management with Vault

### Where Are Secrets Stored?

| Secret | Used For | Example Value |
|--------|----------|---------------|
| `MONGODB_URI` | Database connection | `mongodb://localhost:27017/hrms` |
| `JWT_SECRET` | Access token signing | Random base64 string |
| `JWT_REFRESH_SECRET` | Refresh token signing | Random base64 string |
| `ENCRYPTION_KEY` | Data encryption at rest | 32-char hex string |
| `CLOUDINARY_CLOUD_NAME` | File storage | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | File storage | API key |
| `CLOUDINARY_API_SECRET` | File storage | API secret |
| `EMAIL_HOST` | SMTP email | `smtp.gmail.com` |
| `EMAIL_PORT` | SMTP port | `587` |
| `EMAIL_USER` | SMTP auth | Email address |
| `EMAIL_PASSWORD` | SMTP auth | App password |
| `EMAIL_FROM` | Sender address | `no-reply@domain.com` |

### How the App Reads Secrets

```
Server Start
    │
    ▼
env.ts imports VaultService
    │
    ▼
VaultService.loadAll() → HTTP GET → http://127.0.0.1:8200/v1/secret/data/hrms
    │
    ▼
Vault returns JSON with all secrets
    │
    ▼
Secrets cached in VaultService.cachedSecrets
    │
    ▼
env object populated: env.JWT_SECRET = cachedSecrets.JWT_SECRET
    │
    ▼
All modules import env and use env.JWT_SECRET, env.MONGODB_URI, etc.
```

### Viewing Stored Secrets

```bash
# List all keys under secret/hrms
docker exec -e VAULT_ADDR=http://127.0.0.1:8200 hrms-vault vault kv get secret/hrms

# Get as JSON (useful for debugging)
docker exec -e VAULT_ADDR=http://127.0.0.1:8200 hrms-vault vault kv get -format=json secret/hrms
```

### Updating a Secret

```bash
# Re-run the put command with the updated value — it creates a new version
docker exec -e VAULT_ADDR=http://127.0.0.1:8200 hrms-vault vault kv put secret/hrms \
  JWT_SECRET="new-strong-secret" \
  MONGODB_URI="mongodb://localhost:27017/hrms"
```

> **Note:** You must include ALL keys when re-seeding. Vault replaces the entire secret, not individual fields.

---

## Database Setup

### MongoDB Connection

The app connects using the `MONGODB_URI` from Vault:

```
mongodb://localhost:27017/hrms
```

Connection pool settings (from `env.ts`):
- Max pool size: 20
- Min pool size: 5
- Server selection timeout: 30s
- Socket timeout: 60s

### Running the Seed Script

After the database is running, populate it with initial data:

```bash
cd server
npm run seed
```

This creates:
- Default super-admin user
- Sample departments and designations
- Default company settings
- Sample shift and holiday data

### Database Backup (Development)

```bash
# Export data
docker exec hrms-mongo mongodump --db hrms --out /tmp/backup
docker cp hrms-mongo:/tmp/backup ./backup

# Import data
docker cp ./backup hrms-mongo:/tmp/restore
docker exec hrms-mongo mongorestore --db hrms /tmp/restore/hrms
```

---

## Caching with Redis

### What Gets Cached?

| Cache Key | Data | TTL |
|-----------|------|-----|
| Master data (holidays, shifts, etc.) | Full collections | 1 hour |
| `CompanySettings` | Notification config | Process lifetime |
| Token blacklist | Revoked JWT tokens | Token expiry |

### Verifying Redis Connection

```bash
# Check if Redis is accepting connections
docker exec hrms-redis redis-cli ping
# Should return: PONG

# Check stored keys
docker exec hrms-redis redis-cli keys "*"

# Check memory usage
docker exec hrms-redis redis-cli info memory
```

---

## Production Deployment

> **Warning:** The dev setup uses in-memory Vault and unauthenticated MongoDB. Production requires a completely different configuration.

### Production Checklist

| Component | Dev | Production |
|-----------|-----|------------|
| Vault | Dev mode (in-memory) | Production mode (Raft/S3 storage, auto-unseal) |
| MongoDB | No auth, localhost | Auth enabled, replica set, TLS |
| Redis | Single instance | Sentinel or Cluster, password auth |
| Secrets | Static root token | Dynamic secrets, lease rotation |
| TLS | HTTP only | HTTPS everywhere |
| Container isolation | Host networking | Dedicated Docker network, no port exposure |

### Production Docker Compose

```yaml
services:
  app:
    build:
      context: ./server
      dockerfile: Dockerfile
    ports:
      - "5000:5000"
    environment:
      NODE_ENV: production
      VAULT_ADDR: http://vault:8200
      VAULT_TOKEN: ${VAULT_TOKEN}
      REDIS_URL: redis://redis:6379
    depends_on:
      redis:
        condition: service_healthy
      vault:
        condition: service_healthy
      mongodb:
        condition: service_started
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: ["redis-server", "--requirepass", "${REDIS_PASSWORD}", "--appendonly", "yes"]
    volumes:
      - redis-data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  vault:
    image: hashicorp/vault:latest
    cap_add:
      - IPC_LOCK
    environment:
      VAULT_ADDR: http://127.0.0.1:8200
    volumes:
      - vault-config:/vault/config
      - vault-data:/vault/file
    command: server -config=/vault/config/vault.hcl
    restart: unless-stopped

  mongodb:
    image: mongo:6
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_USER}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD}
    volumes:
      - mongo-data:/data/db
    restart: unless-stopped

volumes:
  redis-data:
  vault-data:
  vault-config:
  mongo-data:
```

### Production Step-by-Step

#### 1. Set Up Vault (Production Mode)

```bash
# Create vault config directory
mkdir -p vault/config

# Create vault.hcl (production config)
cat > vault/config/vault.hcl <<EOF
storage "raft" {
  path = "/vault/file"
  node_id = "vault-node-1"
}

listener "tcp" {
  address     = "0.0.0.0:8200"
  tls_disable = 1  # Enable TLS in real production
}

api_addr = "http://vault:8200"
cluster_addr = "https://vault:8201"
ui = true
EOF
```

#### 2. Initialize Vault

```bash
# Start only Vault first
docker compose up -d vault

# Initialize (requires 1 unseal key, 1 key share for dev)
docker exec -e VAULT_ADDR=http://127.0.0.1:8200 hrms-vault \
  vault operator init -key-shares=1 -key-threshold=1 -format=json

# Save the unseal key and root token!
```

#### 3. Unseal Vault

```bash
docker exec -e VAULT_ADDR=http://127.0.0.1:8200 hrms-vault \
  vault operator unseal <UNSEAL_KEY>
```

#### 4. Enable KV Secrets Engine

```bash
docker exec -e VAULT_ADDR=http://127.0.0.1:8200 \
  -e VAULT_TOKEN=<ROOT_TOKEN> hrms-vault \
  vault secrets enable -path=secret kv-v2
```

#### 5. Seed Production Secrets

```bash
docker exec -e VAULT_ADDR=http://127.0.0.1:8200 \
  -e VAULT_TOKEN=<ROOT_TOKEN> hrms-vault \
  vault kv put secret/hrms \
    MONGODB_URI="mongodb://${MONGO_USER}:${MONGO_PASSWORD}@mongodb:27017/hrms?authSource=admin" \
    JWT_SECRET="<generated-strong-secret>" \
    JWT_REFRESH_SECRET="<generated-strong-secret>" \
    ENCRYPTION_KEY="<32-char-hex>" \
    CLOUDINARY_CLOUD_NAME="<real-value>" \
    CLOUDINARY_API_KEY="<real-value>" \
    CLOUDINARY_API_SECRET="<real-value>" \
    EMAIL_HOST="smtp.example.com" \
    EMAIL_PORT="587" \
    EMAIL_USER="<real-user>" \
    EMAIL_PASSWORD="<real-password>" \
    EMAIL_FROM="noreply@yourdomain.com"
```

#### 6. Start the Full Stack

```bash
docker compose up -d
```

#### 7. Create a `.env.production` (on the server)

```dotenv
NODE_ENV=production
PORT=5000
CLIENT_URL=https://yourdomain.com
VAULT_ADDR=http://vault:8200
VAULT_TOKEN=<root-token-or-app-token>
REDIS_URL=redis://redis:6379
RATE_LIMIT_ENABLED=true
```

#### 8. Verify Production Health

```bash
curl -f http://localhost:5000/api/v1/health
```

### Production Security Checklist

- [ ] Vault running in production mode (not `-dev`)
- [ ] MongoDB authentication enabled
- [ ] Redis password protected
- [ ] All secrets stored in Vault (not in `.env` or source code)
- [ ] TLS enabled for all services
- [ ] `.env` file is in `.gitignore`
- [ ] No `VAULT_DEV_ROOT_TOKEN_ID` in production
- [ ] Container images pinned to specific versions (not `latest`)
- [ ] Docker network isolated (no unnecessary port exposure)
- [ ] Regular database backups configured
- [ ] Log aggregation set up
- [ ] Monitoring and alerting configured

---

## Troubleshooting

### Container Won't Start

```bash
# Check container logs
docker logs hrms-redis
docker logs hrms-vault
docker logs hrms-mongo

# Check if port is already in use
netstat -ano | findstr ":6379"
netstat -ano | findstr ":8200"
netstat -ano | findstr ":27017"
```

### Vault Health Check Fails

```bash
# The vault image doesn't have curl. Use vault status instead:
docker exec -e VAULT_ADDR=http://127.0.0.1:8200 hrms-vault vault status

# If it says "sealed", unseal it:
docker exec -e VAULT_ADDR=http://127.0.0.1:8200 hrms-vault \
  vault operator unseal <YOUR_UNSEAL_KEY>
```

### Node Server Can't Connect to MongoDB

```
Error: getaddrinfo ENOTFOUND mongo
```

This means your `MONGODB_URI` in Vault uses the Docker service name `mongo`. Since Node runs on the host, use `localhost` instead:

```bash
docker exec -e VAULT_ADDR=http://127.0.0.1:8200 hrms-vault \
  vault kv put secret/hrms MONGODB_URI="mongodb://localhost:27017/hrms"
```

### Vault Returns 404 on Secret Read

This usually means the secret path is wrong. In KV v2, the CLI command `vault kv put secret/hrms` stores at path `hrms`, and the HTTP API reads at `/v1/secret/data/hrms`.

```bash
# Verify the secret exists:
docker exec -e VAULT_ADDR=http://127.0.0.1:8200 hrms-vault vault kv list -mount=secret

# If you see "data/" instead of "hrms", delete and reseed:
docker exec -e VAULT_ADDR=http://127.0.0.1:8200 hrms-vault \
  vault kv delete -mount=secret data/hrms

# Then reseed at the correct path (no "data/" prefix):
docker exec -e VAULT_ADDR=http://127.0.0.1:8200 hrms-vault \
  vault kv put secret/hrms MONGODB_URI="mongodb://localhost:27017/hrms" ...
```

### Redis Connection Refused

```bash
# Check if Redis is running and healthy:
docker ps --filter "name=hrms-redis"

# Test connection from host:
docker exec hrms-redis redis-cli ping
```

### Reset Everything

```bash
# Stop all containers and remove volumes
docker compose down -v

# Start fresh
docker compose up -d

# Re-seed Vault
docker exec -e VAULT_ADDR=http://127.0.0.1:8200 hrms-vault \
  vault kv put secret/hrms MONGODB_URI="mongodb://localhost:27017/hrms" ...

# Re-seed database
cd server && npm run seed
```

---

## Command Reference

### Docker Compose

| Command | Description |
|---------|-------------|
| `docker compose up -d` | Start all containers in background |
| `docker compose up -d redis vault` | Start only Redis and Vault |
| `docker compose down` | Stop all containers |
| `docker compose down -v` | Stop and remove all data |
| `docker compose ps` | Show container status |
| `docker compose logs -f` | Follow logs from all containers |
| `docker compose logs -f vault` | Follow Vault logs only |
| `docker compose up -d --force-recreate` | Force recreate all containers |

### Vault CLI Commands (Inside Container)

```bash
# Always prefix with VAULT_ADDR for dev mode
VAULT="docker exec -e VAULT_ADDR=http://127.0.0.1:8200 hrms-vault vault"

# List secret engines
$VAULT secrets list

# List keys at a path
$VAULT kv list -mount=secret

# Read a secret
$VAULT kv get secret/hrms

# Read as JSON
$VAULT kv get -format=json secret/hrms

# Write/update a secret
$VAULT kv put secret/hrms KEY="value"

# Delete a secret
$VAULT kv delete secret/hrms

# Check Vault status
$VAULT status
```

### Redis CLI Commands

```bash
# Connect to Redis
docker exec -it hrms-redis redis-cli

# Inside the Redis CLI:
PING                    # Test connection
KEYS *                  # List all keys
GET <key>               # Get a value
SET <key> <value>       # Set a value
DEL <key>               # Delete a key
TTL <key>               # Check expiry
INFO memory             # Memory usage
```

---

## Command Reference

| Command | Description |
|---------|-------------|
| `docker compose up -d` | Start all containers in detached mode |
| `docker compose up -d redis vault` | Start only Redis and Vault |
| `docker compose down` | Stop all containers |
| `docker compose down -v` | Stop and remove all data volumes |
| `docker compose ps` | List running containers |
| `docker compose logs -f vault` | Follow Vault logs |
| `docker exec -e VAULT_ADDR=... hrms-vault vault ...` | Run Vault CLI commands |
| `docker exec hrms-redis redis-cli ...` | Run Redis CLI commands |
| `docker exec hrms-mongo mongosh ...` | Run MongoDB shell commands |
| `docker volume ls` | List Docker volumes |
| `docker volume rm <name>` | Remove a specific volume |
