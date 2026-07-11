# Ishlab chiqarish nazorati

Internal production tracking tool: 3D -> Qolip -> Sotuv pipeline.

## Stack

Next.js 14 (App Router) + TypeScript, PostgreSQL + Prisma, Tailwind CSS, NextAuth (Credentials).

## Local setup

1. Postgres must be running and reachable at the URL in `.env` (`DATABASE_URL`).
2. Install deps: `npm install`
3. Push schema: `npx prisma db push`
4. Seed demo data + users: `npm run seed`
5. Run dev server: `npm run dev`

## Seeded accounts (password: `parol123` for all)

| login | role |
|---|---|
| admin | admin |
| 3d | dept_3d |
| mold | dept_mold |
| sales | dept_sales |

## Notes

- Business rule: only `admin` can set/change an item's deadline (`PATCH /api/items/:id/deadline`), enforced server-side, not just hidden in the UI.
- Advancing a stage (`POST /api/items/:id/finish`) clears the deadline — admin sets a new one for the next stage.
- All user-facing UI text is Uzbek (Latin script). Code stays in English.
