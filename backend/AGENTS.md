<!-- BEGIN:backend-agent-rules -->
# Backend Agent Configuration

This file tells the Antigravity agent that **all operations** (e.g., `npm run dev`, `npm install`, linting, building, migrations) should be executed **relative to the `backend/` directory**.

## How the agent should behave
- **Working directory**: `backend/`
- **Typical commands**:
  - `npm install` → `npm install --prefix backend`
  - `npm run dev` → `npm run dev --prefix backend`
  - `npm run build` → `npm run build --prefix backend`
  - `npm run start` → `npm start --prefix backend`
- **File paths**: Any file references should be prefixed with `backend/` unless they are absolute.
- **README guidance**: Follow the overall workflow described in the root `README.md`, but keep actions scoped to this folder.

> **Note**: The backend may use environment variables defined in `backend/.env` (see `.env.example`). Ensure they are loaded before running the server.

<!-- END:backend-agent-rules -->
