<!-- BEGIN:frontend-agent-rules -->
# Frontfront Agent Configuration

This file tells the Antigravity agent that **all operations** (e.g., `npm run dev`, `npm install`, linting, building) should be executed **relative to the `frontend/` directory**.

## How the agent should behave
- **Working directory**: `frontend/`
- **Typical commands**:
  - `npm install` → `npm install --prefix frontend`
  - `npm run dev` → `npm run dev --prefix frontend`
  - `npm run build` → `npm run build --prefix frontend`
- **File paths**: Any file references should be prefixed with `frontend/` unless they are absolute.
- **README guidance**: Follow the project‑wide instructions described in the root `README.md` for overall workflow, but limit actions to this folder.

> **Note**: The frontend uses a custom Next.js setup (see existing `frontend/AGENTS.md` warning). Be sure to consult `node_modules/next/dist/docs/` for version‑specific APIs.

<!-- END:frontend-agent-rules -->
