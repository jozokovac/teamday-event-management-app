# Event Management App

Full-stack event management application with public registration and admin CRUD.

## Stack

- **Frontend**: Vite + React + TypeScript + Tailwind CSS + React Router v6
- **Backend**: Node.js / Express (TypeScript via tsx)
- **Database**: SQLite (`better-sqlite3`) by default — see Postgres notes below

## Quick Start

```bash
# 1. Install dependencies
bun install        # or: npm install

# 2. Copy env config (optional — defaults work out of the box)
cp .env.example .env

# 3. Start development (frontend :5173 + API :3001)
bun run dev        # or: npm run dev
```

Open **http://localhost:5173** — public events listing.
Admin dashboard at **http://localhost:5173/admin**.

## Scripts

| Script | Description |
|---|---|
| `dev` | Vite dev server + Express API (concurrently) |
| `build` | Bundle frontend to `dist/` + type-check server |
| `start` | Production: Express serves `dist/` + API on PORT (default 3001) |

## Database

SQLite file auto-created at `./data/events.db` on first start. No setup required.

### Migrate to PostgreSQL

1. Add `pg` package: `bun add pg @types/pg`
2. Replace `server/db.ts` — swap `better-sqlite3` for `pg.Pool` with async queries
3. Update SQL syntax (`$1` placeholders instead of `?`, `gen_random_uuid()` for IDs)
4. Set `DATABASE_URL=postgresql://user:pass@host:5432/dbname` in `.env`

## API Reference

| Method | Path | Description |
|---|---|---|
| GET | `/api/events` | Published events (public) |
| GET | `/api/events/all` | All events including drafts (admin) |
| GET | `/api/events/:id` | Single event with registration count |
| POST | `/api/events` | Create event |
| PUT | `/api/events/:id` | Update event |
| DELETE | `/api/events/:id` | Delete event |
| POST | `/api/events/:id/registrations` | Register for event |
| GET | `/api/events/:id/registrations` | List registrations for event |

## Features

- Admin event CRUD: title, description, date/time, capacity, status (draft/published/cancelled)
- Public event listing (published events only)
- Public registration form with name + email
- Overbooking prevention enforced at the database level
- Duplicate registration prevention (unique constraint on event_id + email)
- Registration confirmation displayed in-browser
- Admin registration list per event
- Validation, loading, empty, and error states throughout
- Responsive layout (mobile-friendly)
