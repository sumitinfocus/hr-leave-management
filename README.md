# HR Leave Management (Minimal Scaffold)

This workspace contains a minimal scaffold for an HR Leave Management system.

- Backend: Node.js + Express + Prisma + PostgreSQL
- Frontend: React + Vite

Quick start:

1. Start a local PostgreSQL instance (for example with Docker):
   `docker run --name hr-leave-db -e POSTGRES_PASSWORD=password -e POSTGRES_DB=hr_leave -p 5432:5432 -d postgres:16-alpine`
2. cd backend
3. npm install
4. copy `.env.example` to `.env` (already included in this repo for local development)
5. npx prisma migrate dev --name init
6. npm run seed
7. npm run dev

Frontend:

1. cd frontend
2. npm install
3. npm run dev

Deployment: Prepare an AWS EC2 or Elastic Beanstalk environment and configure environment variables.
