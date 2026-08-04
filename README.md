# AMS ITSM App

A comprehensive Asset Management System (AMS) and IT Service Management (ITSM) platform built with modern full-stack technologies. This application provides enterprise-grade asset tracking, infrastructure management, ticket handling, license management, and employee administration.

## Stack

- **Language(s):** TypeScript (99.6% of codebase)
- **Framework / Runtime:** 
  - Backend: Node.js + Express.js 4.19
  - Frontend: Next.js 16.2 with React 19.2
- **Database:** PostgreSQL with Drizzle ORM
- **Notable Libraries:**
  - **Backend:** Drizzle ORM (database), bcrypt (password hashing), jsonwebtoken (JWT auth), zod (validation), helmet (security), cors
  - **Frontend:** Tailwind CSS 4 (styling), Lucide React (icons), qrcode (QR code generation)

## How It's Organized

```
ams-app/
├── backend/                 Express.js API server
│   ├── src/
│   │   ├── server.ts       Application entry point
│   │   ├── routes/         API endpoints (auth, assets, employees, tickets, licenses, infrastructure, master)
│   │   ├── controllers/    Business logic handlers
│   │   ├── middleware/     Auth, validation, error handling middleware
│   │   ├── db/             Database schema and migrations
│   │   └── config/         Configuration files
│   ├── drizzle.config.ts   Drizzle ORM configuration
│   └── package.json        Dependencies (Express, Drizzle, bcrypt, JWT)
│
├── frontend/               Next.js application
│   ├── app/               App Router pages and layouts
│   ├── components/        Reusable React components
│   ├── styles/            Tailwind CSS configuration
│   └── package.json       Dependencies (Next.js, React, Tailwind)
│
├── design-system/         Shared UI design system components
├── package.json          Root workspace configuration (monorepo setup)
└── package-lock.json
```

**How it fits together:**

The application follows a monorepo structure with separate backend and frontend. Requests flow from the Next.js frontend to Express.js API endpoints at `/api/v1/`. The backend handles authentication via JWT tokens, manages PostgreSQL data through Drizzle ORM, and exposes REST endpoints for:
- **Authentication:** User login and session management
- **Assets:** Equipment and asset lifecycle tracking
- **Employees:** Staff management and assignments
- **Tickets:** IT service requests and incident management
- **Licenses:** Software license tracking and compliance
- **Infrastructure:** IT infrastructure inventory and monitoring
- **Master Data:** Reference data management

## How to Run It

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 12+ running and accessible
- Environment variables configured

### Setup & Installation

1. **Clone and install dependencies:**
   ```bash
   git clone https://github.com/febryprasetyo/ams-app.git
   cd ams-app
   npm install
   cd backend && npm install && cd ..
   cd frontend && npm install && cd ..
   ```

2. **Configure environment variables:**
   ```bash
   # Backend environment
   cp backend/.env.example backend/.env
   # Edit backend/.env with your database credentials
   ```

3. **Setup database:**
   ```bash
   cd backend
   npm run db:generate    # Generate migrations from schema
   npm run db:push        # Apply migrations to database
   npm run seed           # (Optional) Seed initial data
   cd ..
   ```

### Development

Run both backend and frontend concurrently:
```bash
npm run dev
```

Or run them separately:
```bash
# Terminal 1: Backend (runs on http://localhost:5000)
npm run dev:backend

# Terminal 2: Frontend (runs on http://localhost:3000)
npm run dev:frontend
```

### Production Build

```bash
# Build both backend and frontend
npm run build

# Start backend production server
cd backend && npm start

# Start frontend production server
cd frontend && npm start
```

### Backend-Only Commands

```bash
cd backend

npm run dev              # Development server with hot reload
npm run build            # Compile TypeScript to JavaScript
npm start                # Run compiled backend
npm run seed             # Seed database with initial data
npm run db:migrate       # Run database migrations
npm run db:generate      # Generate migration files from schema changes
npm run db:push          # Push schema changes to database
```

### Frontend-Only Commands

```bash
cd frontend

npm run dev              # Development server on port 3000
npm run build            # Build for production
npm start                # Start production server
npm run lint             # Run ESLint
```

## API Overview

The backend exposes a RESTful API at `http://localhost:5000/api/v1/` with the following main endpoints:

- `POST /auth/login` - User authentication
- `GET /auth/me` - Get current user (requires token)
- `/employees` - Employee management
- `/assets` - Asset tracking and management
- `/tickets` - IT service tickets
- `/licenses` - Software license management
- `/infrastructure` - IT infrastructure
- `/master` - Master data reference tables
- `GET /health` - Health check endpoint

## Environment Variables

### Backend (.env)

```
PORT=port
NODE_ENV=development
DATABASE_URL=postgres://user:password@host:port/dbname
DB_HOST=your_host
DB_PORT=5432
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=dbname
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
```

