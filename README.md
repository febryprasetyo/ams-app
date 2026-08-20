# AMS ITSM App

A comprehensive Asset Management System (AMS) and IT Service Management (ITSM) platform built with modern full-stack technologies. This application provides enterprise-grade asset tracking, infrastructure management, ticket handling, license management, and employee administration.

## Stack

- **Language:** TypeScript
- **Backend:** Node.js + Express.js
- **Frontend:** Next.js (Standalone build) with React
- **Database:** PostgreSQL with Drizzle ORM (Journal-based migrations)
- **Reverse Proxy / Ingress:** Nginx (Same-origin routing)
- **Containerization & Deployment:** Docker Compose, GitHub Actions, LAN SSH deployment

---

## Operational Runbooks

Comprehensive guides for development, infrastructure setup, deployments, and disaster recovery:

1. 📖 **[Development Runbook](docs/operations/development.md)** — SSH IDE workflow, local Compose stack, database migrations, and testing.
2. 🛠️ **[Server Setup Runbook](docs/operations/server-setup.md)** — Host preparation for Ubuntu 22.04 LTS (Docker, native PostgreSQL 16, systemd units, SSH keys).
3. 🚀 **[Release & Deployment Runbook](docs/operations/release.md)** — Tagged release workflow, GHCR container publishing, manual approval gating, and health-checked LAN deployment.
4. 💾 **[Database Recovery Runbook](docs/operations/database-recovery.md)** — Native PostgreSQL backups, checksum verification, and non-destructive isolated restore workflows.

---

## Quick Start (Development)

The fastest way to run the entire AMS stack locally or on the development server:

```bash
# 1. Clone repository
git clone https://github.com/<owner>/ams-app.git
cd ams-app

# 2. Setup environment files
cp .env.example .env
cp backend/.env.example backend/.env

# 3. Start development stack (PostgreSQL, Backend, Frontend with hot-reload)
npm run dev:up

# 4. Apply database migrations
npm run db:migrate --prefix backend

# 5. (Optional) Seed initial data
npm run seed --prefix backend
```

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000/api/v1
- **Readiness Check:** http://localhost:5000/health/ready
- **PostgreSQL:** `127.0.0.1:5432` (`ams_dev_db`)

---

## Development Commands

```bash
npm run dev:up        # Start development containers in background
npm run dev:logs      # View streaming logs from dev containers
npm run dev:check     # Validate Compose syntax and check running status
npm run dev:down      # Stop development containers
npm run ci            # Run full local validation pipeline (lint, test, build)
```

---

## Production Architecture

In production:
- **Nginx Reverse Proxy** routes browser traffic on port 80 to Next.js (`/`) and Express.js (`/api/v1/`), providing same-origin cookies and API calls.
- **Native PostgreSQL 16** runs directly on the host system managed by systemd, with automated daily backups (`/var/backups/ams-app/postgres`) and weekly restore verification.
- **Deployment State Machine** (`deploy/scripts/deploy.sh`) performs zero-downtime health-gated rollouts with automatic rollback on failure and atomic version tracking.
