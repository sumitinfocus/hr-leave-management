# HR Leave Management (Minimal Scaffold)

This workspace contains a minimal scaffold for an HR Leave Management system.

- Backend: Node.js + Express + Prisma + PostgreSQL
- Frontend: React + Vite

Quick start (backend):

1. cd backend
2. npm install
3. copy `.env.example` to `.env` and set `DATABASE_URL`
4. npx prisma migrate dev --name init
5. npm run seed
6. npm run dev

Frontend:

1. cd frontend
2. npm install
3. npm run dev

Deployment: Prepare an AWS EC2 or Elastic Beanstalk environment and configure environment variables.
