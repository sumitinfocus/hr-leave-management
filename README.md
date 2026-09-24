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

## Leave email integration

The backend polls an Outlook.com mailbox through IMAP with OAuth2 and sends notifications through SMTP. Set `LEAVE_EMAIL_POLLING_ENABLED=true` only after registering an Entra ID application, completing delegated OAuth consent for the mailbox, obtaining a refresh token, and configuring:

- `OAUTH_TENANT_ID`, `OAUTH_CLIENT_ID`, `OAUTH_CLIENT_SECRET`, and `OAUTH_REFRESH_TOKEN`
- `OAUTH_REDIRECT_URI=http://localhost:4000/oauth/callback`
- `LEAVE_MANAGER_EMAIL` for the mailbox and approval notification recipient
- `LEAVE_DEFAULT_DEPARTMENT_ID` for automatically created employees
- `IMAP_HOST`, `IMAP_PORT`, `SMTP_HOST`, and `SMTP_PORT`
- `LEAVE_POLL_INTERVAL_MS` for the polling interval

The OAuth application needs delegated `IMAP.AccessAsUser.All`, `SMTP.Send`, and `offline_access` permissions. The refresh token is a secret and must not be committed or sent to the frontend. `OAUTH_TENANT_ID=consumers` is appropriate for a personal Outlook.com account; use the organization tenant ID for a work account.

To obtain the refresh token locally, register `http://localhost:4000/oauth/callback` as a Web redirect URI in the Microsoft app registration, save the client settings in `backend/.env`, restart the backend, and open `http://localhost:4000/oauth/authorize` in the same browser. Sign in and consent; the callback page displays the refresh token once for copying into `OAUTH_REFRESH_TOKEN`. The authorization state expires after ten minutes, and the OAuth endpoints accept requests only from localhost.

## Timesheets

Employees can open `/timesheets` to review submissions and upload either a downloaded `.eml` message or its `.xlsx`/`.xls` attachment. The importer reads the sample workbook format (period metadata plus daily date, time, and activity rows), creates a missing employee using the configured manager defaults, and submits the timesheet for approval. Managers and HR administrators review submissions at `/timesheet-approvals`; rejection records a correction reason and allows resubmission.

The import endpoint is `POST /api/timesheets/import` with a multipart `file` field. Duplicate files are ignored using a SHA-256 source fingerprint. When enabled, live mailbox polling routes Outlook workbook attachments through this same importer.

To enable OAuth mailbox polling for both leave messages and timesheet attachments, put the values in `backend/.env` (never in the frontend or source control):

```env
OAUTH_TENANT_ID=consumers
OAUTH_CLIENT_ID=your-client-id
OAUTH_CLIENT_SECRET=your-client-secret
OAUTH_REFRESH_TOKEN=your-refresh-token
LEAVE_EMAIL_POLLING_ENABLED=true
TIMESHEET_EMAIL_POLLING_ENABLED=true
```

The worker reads unread Outlook messages over IMAP using the refresh token. Messages containing `.xlsx` or `.xls` attachments are passed through the same parser and importer used by the upload screen. Existing `.eml` uploads remain available at `/timesheets`, and duplicate attachments are ignored by their fingerprint.

Managers and HR administrators can run the historical Outlook timesheet import with `POST /api/email-sync/sync-timesheets`. It scans messages received from January 1 of the current year whose subject contains `timesheet`, imports workbook attachments as submitted timesheets, and reports imported, duplicate, and failed items. Duplicate fingerprints are skipped rather than creating duplicate approvals.

Messages addressed to the manager mailbox are considered only when the subject contains `Leave` (case-insensitive). The body must contain labeled lines:

```text
Employee Email: employee@example.com
Leave Type: CASUAL
Start Date: 2026-10-01
End Date: 2026-10-03
Reason: Personal leave
```

Use `POST /api/email-sync/sync` with a manager or HR administrator JWT to run a one-shot sync. Message IDs are recorded so the same email cannot create duplicate leave applications. Newly discovered employees are created with role `EMPLOYEE`, the configured department, the configured manager, and a random temporary password marked for reset. The temporary password is sent to the employee's email address; after signing in, use `POST /api/auth/change-password` to replace it.
