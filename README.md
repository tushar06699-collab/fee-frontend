# Invitation Manager

Full-stack wedding invitation list platform: Next.js (TypeScript) + Tailwind + Prisma (MongoDB Atlas) + NextAuth (email/password) + SheetJS/ExcelJS. Data is stored in MongoDB. Live updates via 3s polling. Responsive (sidebar on desktop, bottom nav on phone), 44px tap targets, Hindi (Devanagari) support with Noto Sans.

## Quick start

1. `cp .env.example .env` — set `DATABASE_URL` (MongoDB Atlas connection string), `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `ADMIN_EMAIL/PASSWORD`.
2. `npm install`
3. `npm run db:push` (creates collections + indexes) then `npm run db:seed` (first admin).
4. `npm run dev` → http://localhost:3000 (login with admin creds).
5. `npm test` — Excel parser tests.

## Deploy on Vercel

**1. MongoDB Atlas (free):** cloud.mongodb.com → create cluster → Database Access (add user + password; URL-encode special chars) → Network Access → **Allow `0.0.0.0/0`** (Vercel IPs change) → Connect → Drivers → copy the string and add `/invitation_manager` before the `?`:
`mongodb+srv://<user>:<password>@<cluster>.mongodb.net/invitation_manager?retryWrites=true&w=majority`

**2. Push code to GitHub**, then Vercel → Add New → Project → Import.

**3. Environment variables** (Vercel → Project → Settings → Environment Variables):
| Key | Value |
|---|---|
| `DATABASE_URL` | Atlas string from step 1 |
| `NEXTAUTH_SECRET` | long random string (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | `https://<your-project>.vercel.app` |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | first admin login (used once by seed) |

**4. Deploy.** Build command is `npm run build` (runs `prisma generate` automatically).

**5. One-time database setup** — from your own machine, point at the Atlas DB and run (PowerShell):
```powershell
$env:DATABASE_URL = "mongodb+srv://<user>:<password>@<cluster>.mongodb.net/invitation_manager?retryWrites=true&w=majority"
npm run db:push   # creates collections + indexes
npm run db:seed   # creates the admin user
```

**6. Verify:** open `https://<your-project>.vercel.app/api/health` → `{ "ok": true, "users": 1 }`, then log in.

Notes: no code changes needed between local and Vercel (same env vars); Prisma client is a singleton so serverless connections stay lean; keep Excel imports under ~4 MB (Vercel request limit); every redeploy keeps your MongoDB data.

## Excel format

Sheet `Invitation List`: Row 1 title, Row 3 header `Sr. No. | Name | Remarks`, data from row 4.
- MAIN heading: text in col A, A:C merged, dark-blue fill.
- SUB heading: merged, light-blue fill. Fallback: text-only in col A.
- NAME rows: Sr (blank/dup ok, never used as ID — cuid generated), Name in B, Remarks in C. Duplicates kept.
- Export adds `Invited (Yes/No), Invited on, Invited by, Phone, Guests, Mode, Notes` — re-import safe.
- Import preview shows counts + unparsed rows; modes: Add / Replace; history in `ImportHistory`. (Writes run sequentially — MongoDB transactions need a replica set.)

## Roles

ADMIN (all incl. users/import-confirm/delete sections/activity/backup) · EDITOR (add/edit/tick, no section delete, no users) · VIEWER (read-only). Enforced server-side in every API route.

## Acceptance mapping

- Import → `/import` preview + confirm; duplicates kept; Hindi OK.
- Tick on device A → visible on B in ≤3s (polling on dashboard/sections/datewise); Date-wise groups by `invitedOn`.
- CRUD/restore/move persist (Prisma + MongoDB); Trash restores.
- Export re-imports losslessly (extended columns parsed).
- 360px phone: cards + bottom nav; desktop: sidebar + tables.
