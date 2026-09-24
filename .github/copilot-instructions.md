# Copilot instructions for HR Leave Management

## Repository shape

This repository contains two independently run applications:

- `backend/` is a CommonJS Node.js service using Express, Prisma, and PostgreSQL.
- `frontend/` is a React 18 single-page app built and served with Vite.

The backend is the source of truth for employees, departments, leave entitlements, leave applications, holidays, and leave statuses. The Prisma schema in `backend/prisma/schema.prisma` defines the domain model and enum values used by the route handlers. `backend/src/index.js` creates the Express app, enables CORS and JSON parsing, and mounts route modules under `/api/auth`, `/api/leave`, `/api/report`, `/api/holiday`, and `/api/entitlement`.

Backend routes use Prisma directly and protect most business endpoints with JWT authentication. JWTs carry `userId` and `role`; the frontend stores the token in `localStorage` and sends it in an `Authorization` header. Role checks are implemented in route handlers: `HR_ADMIN` can manage/report broadly, while `MANAGER` handles subordinate approvals. The frontend currently has page components for login, dashboard, leave application, approvals, holidays, and reports; routing in `frontend/src/main.jsx` wires only the currently implemented paths, so check routing before assuming a page is reachable.

## Run and validate

Run commands from the relevant application directory:

```text
# Backend
cd backend
npm install
# Create .env with DATABASE_URL (and JWT_SECRET for non-default JWT signing)
npx prisma migrate dev --name init
npm run seed
npm run dev                 # nodemon, port 4000 by default
npm start                   # production-style node start
npm test                    # Node's built-in backend tests

# Frontend
cd frontend
npm install
npm run dev                 # Vite development server
npm run build               # production build
npm run preview             # preview the production build
```

The root `README.md` is the canonical quick-start sequence. `.vscode/tasks.json` provides equivalent “Start Backend” and “Start Frontend” tasks. Prisma CLI commands can be run through `npm run prisma -- <command>` from `backend`.

The backend uses Node's built-in test runner. Run one test file with `node --test test/leaveEmailParser.test.js`, or select a test name with `node --test --test-name-pattern="parses a labeled leave email"`. There is no lint script. For a change that affects the API or database, validate with the relevant running endpoint and/or Prisma migration/build command. For frontend changes, `npm run build` is the available automated check.

## Backend conventions

- Keep route modules in `backend/src/routes/` and mount new route groups in `backend/src/index.js`.
- Use CommonJS (`require`/`module.exports`) to match the existing Node configuration.
- Use Prisma model and enum names from `schema.prisma`; leave date conversion explicit when accepting request strings (`new Date(...)`).
- Protected handlers read the authenticated identity from `req.user`; preserve the existing JWT payload shape (`userId`, `role`) when changing authentication.
- Preserve role checks at the endpoint that performs the privileged operation. Existing roles are string values such as `HR_ADMIN`, `MANAGER`, and `EMPLOYEE`.
- Keep seed data and schema changes aligned. The seed script assumes department IDs are created in order and creates sample users with the password `password`; treat those as development-only fixtures.
- Database changes require a Prisma migration and, when appropriate, corresponding seed updates. Do not edit generated Prisma client files.
- API errors are returned as JSON objects with an `error` field and an appropriate HTTP status. Follow that shape for new validation or authorization failures.
- Leave-email ingestion is implemented in `backend/src/services/` and exposed through `POST /api/email-sync/sync`; keep Outlook OAuth credentials and manager/department defaults in environment variables, never source code.
- Email requests must use labeled body fields (`Employee Email`, `Leave Type`, `Start Date`, `End Date`, `Reason`). `EmailProcessing.messageId` and `LeaveApplication.sourceMessageId` provide duplicate protection; preserve that idempotency when changing the worker.

## Frontend conventions

- Keep page-level screens under `frontend/src/pages/` and register routes in `frontend/src/main.jsx`.
- Use React function components and hooks, matching the existing JSX style.
- Use Axios for API calls. Existing pages use the absolute backend base URL `http://localhost:4000/api`; preserve or centralize that convention consistently rather than mixing URL styles.
- Authenticated requests send the locally stored JWT as a Bearer token. Keep login/logout and route protection consistent with the token check in `main.jsx`.
- Leave types and statuses should use the Prisma enum spellings (`CASUAL`, `PRIVILEGE`, `SICK`, `MATERNITY`, `PATERNITY`, `OFFICIAL_TOUR`; `PENDING`, `APPROVED`, `REJECTED`) because the API persists those exact values.
- Keep the lightweight existing styling/component approach unless a feature requires introducing a shared UI abstraction.
