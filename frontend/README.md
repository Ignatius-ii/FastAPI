# Lenovo Support — Frontend (React + TypeScript)

Matches the FastAPI backend (auth + tickets, 3 roles: admin, staff, customer).

## Setup

```bash
npm install
cp .env.example .env   # optional — only needed if backend isn't on localhost:8000
npm run dev
```

Opens at `http://localhost:5173`. API calls to `/api/*` are proxied to
`http://localhost:8000` by `vite.config.ts` during dev — make sure your
FastAPI backend is running there first (`uvicorn main:app --reload`).

## Structure

```
src/
├── types/index.ts        Mirrors backend/models.py + schemas.py exactly
├── api/
│   ├── client.ts          Fetch wrapper: bearer auth, silent refresh-on-401
│   ├── auth.ts             Login, register, refresh, logout, password reset
│   ├── tickets.ts          Ticket CRUD + notes + events
│   └── users.ts            User list/role-update/deactivate
├── context/AuthContext.tsx Session state, login/logout, restores session on reload
├── components/
│   ├── Badge.tsx            Status + priority pills (color-coded)
│   ├── StatCard.tsx         Dashboard summary number
│   ├── Layout.tsx           Top nav shell with role indicator + logout
│   └── ProtectedRoute.tsx   Auth + role route guard
├── pages/
│   ├── LoginPage.tsx
│   ├── AdminDashboard.tsx    Dense filterable ticket table
│   ├── StaffDashboard.tsx    Kanban queue (new / in_repair / escalated)
│   ├── CustomerDashboard.tsx Friendly ticket cards + new-ticket CTA
│   ├── TicketDetailPage.tsx  Shared detail view, role-gated status control
│   └── NewTicketPage.tsx     Ticket creation form
└── styles/tokens.css       CSS custom properties (same tokens as the Figma-stage mockup)
```

## How role-based access works

`AuthContext` holds the logged-in `User` (including `role`). `App.tsx`
renders a different dashboard component at `/` depending on that role — no
separate routes needed for "admin home" vs "customer home". `ProtectedRoute`
optionally restricts a route to specific roles via `allowedRoles`, though
right now the backend itself is the real enforcement layer — the frontend
role checks are there to keep controls from even appearing (e.g. hiding the
status-change dropdown from customers on `TicketDetailPage`), not as the
security boundary. Never rely on hiding a button as your only protection —
the backend's `require_roles`/`require_self_or_roles` dependencies are what
actually block a disallowed request.

## Token handling

Matches the backend's token design: **access tokens live only in memory**
(`client.ts` module state, never localStorage) to reduce XSS exposure, while
the **refresh token is in localStorage** so a session survives a page
reload. On a 401, `client.ts` automatically calls `/auth/refresh` once and
retries the original request — most of the app never needs to think about
token expiry.

## Known limitations / what to verify yourself

This project was written and manually reviewed (brace/paren balance, no
unimported type references) but **could not be built or type-checked here**
since this environment had no npm registry access. Before relying on it:

```bash
npm install
npm run build   # runs tsc -b, will surface any remaining type errors
```

Also worth doing before shipping:
- [ ] Add loading skeletons instead of plain "Loading…" text
- [ ] Add an admin-only user management page (list/deactivate/change role) —
      the `usersApi` client is ready, just needs a page wired to it
- [ ] Add toast notifications for note-added / status-changed confirmations
- [ ] Add pagination controls to `AdminDashboard` (API supports `skip`/`limit`
      already, UI doesn't expose it yet)
- [ ] Wire up `/auth/forgot-password` and `/auth/reset-password` pages
