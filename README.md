# HelpDeskPro — Example Help Desk Application

HelpDeskPro is a sample help-desk web application built with Next.js (App Router), TypeScript and Prisma. It includes a minimal UI and a small API for tickets, comments and authentication so you can run and extend a basic support workflow locally.

## Key features

- Next.js app (App Router) with React + TypeScript.
- Prisma ORM (MySQL) for persistence. A memory-based fallback is provided for development if the DB is not available.
- Simple JWT authentication using an httpOnly cookie (`token`).
- Two roles: CLIENT and AGENT.
  - CLIENT: can create tickets and view only their own tickets.
  - AGENT: can view all tickets, update status/priority/assignment and delete tickets (full CRUD on tickets).
- API endpoints for tickets, ticket detail, comments and users (agents list).
- Tailwind CSS utility classes used in components. In development the app injects the Tailwind CDN to render styles quickly.

## Quick start (development)

1. Install dependencies

   ```bash
   npm install
   ```

2. Environment

   Create a `.env` file at the project root with these variables (example):

   ```env
   DATABASE_URL="mysql://user:password@localhost:3306/helpdeskpro"
   JWT_SECRET="change-this-secret-in-production"
   NEXT_PUBLIC_BASE_URL="http://localhost:3000"
   ```

3. Prisma (if you have a DB)

   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   npm run prisma:seed
   ```

   If you do not have a MySQL instance or prefer quick development, the project includes a fallback in-memory Prisma-like implementation so the app runs without migrations.

4. Run the app

   ```bash
   npm run dev
   # open http://localhost:3000
   ```

## Authentication & demo credentials

- Auth uses a JSON Web Token stored in an httpOnly cookie called `token`.
- Demo users (when using the in-memory fallback) included by default:
  - Client: `client@helpdeskpro.com` / `123456`
  - Agent: `agent@helpdeskpro.com` / `12345678`

## API overview

- `POST /api/auth/login` — authenticate (sets httpOnly cookie)
- `GET /api/auth/me` — return current user
- `POST /api/auth/logout` — clear cookie
- `GET /api/tickets` — list tickets (agents see all, clients see their own)
- `POST /api/tickets` — create ticket (clients create for themselves; agents can create for any user)
- `GET/PUT/DELETE /api/tickets/:id` — read/update/delete a ticket (update/delete restricted to agents)
- `GET /api/comments`, `POST /api/comments` — comments endpoints
- `GET /api/users` — returns agents (restricted to authenticated agents)

## Important security notes (read before deployment)

- Some development shortcuts exist in this repository: the login endpoint was temporarily relaxed to allow easier testing (no password check in the dev flow) and a memory fallback is available when Prisma cannot initialize. These shortcuts are insecure and must be removed or gated (`NODE_ENV !== 'production'`) before deploying to production.
- Passwords in the example seed are plaintext for simplicity. Use proper password hashing (bcrypt/argon2) in any real application.
- JWT secret must be changed in production and kept secret.

## Development tips

- If your MySQL user cannot create a shadow database for Prisma migrations, either provide a separate shadow database URL via `PRISMA_SHADOW_DATABASE_URL` or use the in-memory fallback for local development.
- Tailwind is injected from the CDN during development for fast iteration; for production builds ensure PostCSS/Tailwind are configured and dev CDN injection is disabled.

If you want, I can:

- Re-enable strict password checking and remove the development backdoor safely (only for `NODE_ENV !== 'production'`).
- Add more API documentation or OpenAPI spec.
- Implement a modal detail view instead of a separate page for ticket editing.
