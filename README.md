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

## Production Operations

Deployment scripts and configuration are in `deploy/`. Use the isolated LAN
workflow with `npm run prod:init`, `npm run prod:release -- <unique-version>`,
`npm run prod:status`, and `npm run prod:backup`. Runtime credentials and backups
are stored outside this repository. Internal documentation is kept locally.

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
docker compose -f compose.dev.yml exec backend npm run db:migrate

# 5. (Optional) Seed initial data
docker compose -f compose.dev.yml exec backend npm run seed
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

The active office deployment uses `deploy/compose.lan.yml`: Nginx, standalone
Next.js, Express, and PostgreSQL in the separate `ams-live` Compose project.
Production is available at http://192.168.10.23:8080. Development runs on port 3000.
The database and backend have no published host ports. The LAN deployment currently uses HTTP within the office subnet.
Use the production commands above for releases and backups.

`deploy/compose.prod.yml` and the GHCR scripts are a separate deployment path
for a host with PostgreSQL and an upstream TLS proxy. They are not the active
LAN deployment. A container replacement can cause a brief interruption; schema
migrations are not automatically reversed during an application rollback.

## Design Master

Before adding menus, pages, features, or styles, read [DESIGN.md](DESIGN.md) and the
[GAJIANICH / AMS UI design master](UI_DESIGN_SYSTEM_GUIDE.md). New modules follow the
existing Emerald Enterprise theme and shared components. Page-specific notes cannot
replace the application's visual identity.
