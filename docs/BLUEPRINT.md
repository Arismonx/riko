# Riko (ai-chatbot) – App Blueprint

> Foundation document for the app. Read it before designing or adding any feature.
> Last updated: 2026-11-06 · App version: 0.0.1
>
> Project direction is confirmed (A), but non-goals and hosting are still proposals/TBD.

## 1. What is this app?
A backend REST API for a character-based AI chatbot. Users sign up, create characters (name + instructions), and chat with a character through an OpenAI Agent (inferred).
This repo contains the backend only, with no frontend (it expects one at `FRONTEND_HOST`, default `http://localhost:3000`).

## 2. Users & the problem it solves
- **Primary user:** the project owner (Arismonx), for learning and as a portfolio piece. Secondary readers are developers who clone it to read or extend it.
- **Problem:** a character-chatbot backend with a complete, real flow (auth → character → chat), clean code, tests and CI, to show off skills and serve as a base to build on.
- **Chosen direction: A – learning/portfolio project** (chosen 2026-11-06). Success criteria:
  - The flow register → login → create character → chat works end to end.
  - `bun test` covers auth + chat, and CI (lint + test) passes.
  - The README explains setup and the API clearly, and no known security issues remain.
  - (Later options) B = roleplay/companion app, C = agent with real tools — not started until A is complete.
- **Non-goals:** (proposal, awaiting confirmation) no frontend in this repo, no multi-tenant/billing, no long-term memory or public characters during phase A.

## 3. Design principles
1. **Backend-only API** – the frontend lives in a separate repo; the contract is REST + Swagger (`/api/docs`, dev only).
2. **One module per feature** – `index.ts` (routes) · `model.ts` (schemas) · `service.ts` (logic). No business logic in route handlers.
3. **Validate at the boundary** – TypeBox for routes, Zod for env and tool params; invalid env makes the process exit immediately.
4. **Each user owns their data** – every resource query must be scoped by owner (`userId`) *(not complete yet, see section 7)*.
5. **A single Prisma client** – import it from `@/core/db` only.

## 4. Tech stack
| Area | Used | Notes |
|---|---|---|
| Frontend | None in this repo | Expected at `FRONTEND_HOST` |
| Backend / API | Elysia 1.3 (+ jwt, cors, swagger, opentelemetry, elysia-background) | Listens on `:8000` (hard-coded) |
| Database | PostgreSQL + Prisma 6 | Client generated to `src/generated/prisma` (git-ignored) |
| Auth | JWT (`jose`/`@elysiajs/jwt`) + bcrypt (`Bun.password`) | Sets `accessToken`/`refreshToken` cookies |
| AI | `@openai/agents`, model `gpt-4.1-nano` | Has a tool approval flow (unfinished) |
| Hosting | TBD | Builds to a single binary: `bun run build` |
| Mobile | Not applicable | |
| Runtime | Bun ≥ 1.2.17, TypeScript 5.8 strict | Biome 2 (lint + format), path alias `@/*` → `src/*` |

## 5. Data model
```
User {
  id: uuidv7, email: unique, firstName?, lastName?
  hashedPassword: bcrypt
  isActive: bool = false      // ⚠️ no code sets it to true
  emailVerified: bool = false
  deletedAt?                  // soft delete (not used yet)
}
Character { id, name(64), description?(255), instructions(255), userId -> User }
Chat      { id, title?, userId -> User, characterId -> Character }
Message   { id, role, parts: Json /* AgentInputItem */, chatId -> Chat, createdAt }
RefreshToken { id, token: unique, userId -> User, expiresAt }
```
- Relations: User 1–N Character, User 1–N Chat, Character 1–N Chat, Chat 1–N Message (cascade delete).
- DB columns are snake_case via `@map`, models are camelCase, IDs are UUIDv7 strings.
- Notes: the `Character` table maps to `charaters` (typo in `@@map`), and `instructions` is limited to 255 characters.
- **Migration policy:** change the schema only with `bunx prisma migrate dev` and commit the migration file; never edit a committed migration; after a change, update all code that touches that model (use the `prisma-change` skill).
- Existing migrations: `init`, `sync_schema` (syncs Character/Chat/Message/RefreshToken).

## 6. Code structure
```
src/
  index.ts          entrypoint
  app.ts            Elysia app: cors, swagger(dev), auth module, /api/v1 router
  api.ts            apiRouter: error schemas, /health, mounts ai + characters
  errors.ts         HTTPError(status, detail)
  core/             config (Zod env), db (PrismaClient), security (jwt, bcrypt)
  plugins/auth.ts   derives currentUser from JWT (use on protected routes)
  modules/
    auth/           /auth/register|login|logout  (mounted at root, not /api/v1)
    characters/     /api/v1/characters
    ai/             /api/v1/ai/chat
  lib/ai/           agent + tools
prisma/             schema + migrations
```
Data flow: `Client → Elysia route → auth plugin (currentUser) → service → Prisma → Postgres`, and for chat: `/ai/chat → load Message.parts → OpenAI Agent → save new parts`

## 7. Existing features
| Feature | Version | Actual status |
|---|---|---|
| Register / Login / Logout | 0.0.1 | Code exists; register returns `hashedPassword`, the auth module creates its own PrismaClient and reads `process.env` directly |
| Auth plugin (protected routes) | 0.0.1 | ⚠️ Reads cookie `auth` but login sets `accessToken`; `isActive` is always false → **protected routes cannot be called**; has a `console.log` of tokens |
| Characters: create / list / get | 0.0.1 | list and get are not yet scoped to the owner |
| Characters: PATCH / DELETE | – | Stubs |
| AI chat `POST /ai/chat` | 0.0.1 | Stores messages in `Message.parts`; picks the user's *first* character; never confirmed to work end to end |
| Tool approval (`decisions`) | – | State persistence is still a TODO (always responds 404) |
| Health check | 0.0.1 | `/api/v1/health` |

## 8. Roadmap
**Phase 1 – Make the core flow work** (register → login → create character → chat)
- [ ] Fix cookie auth so names match (`accessToken`) + remove `console.log`
- [ ] Set `isActive = true` on register (or build email verification)
- [ ] `/register` must not return `hashedPassword`; use `@/core/db` and `config` instead of `process.env`
- [ ] `/ai/chat` accepts `characterId`
- [ ] Scope `GET /characters` and `/characters/:id` to the owner
- [ ] Test chat end to end for real

**Phase 2 – Make it really usable**
- [ ] Characters PATCH/DELETE
- [ ] Chat history: list / get / delete
- [ ] Refresh token flow (use the `RefreshToken` table)
- [ ] Streaming response (SSE)
- [ ] `bun test` covering auth + chat
- [ ] CI (GitHub Actions: lint + test) — the README mentions it but `.github/` did not exist yet
- [ ] Fix `@@map("charaters")` → `characters` (needs a migration)

**Phase 3 – Polish it as a portfolio piece (direction A)**
- [ ] README: remove claims that are not yet true, add API examples + Swagger
- [ ] A small frontend/demo, or a curl/HTTP collection for trying it out
- [ ] Evaluate extending to B or C once A is complete

## 9. Decision log
| Date | Decision | Reason |
|---|---|---|
| 2026-11-06 | Store chat messages as `Message.parts` (Json, AgentInputItem shape) | Lets us store tool calls/approvals, not just text |
| 2026-11-06 | Create `docs/BLUEPRINT.md` from the actual code (extract) | The project lacked a clear goal |
| 2026-11-06 | Choose direction A (learning/portfolio) before B/C | Same foundation, fastest path to a showable result, and the core flow does not work yet |

## 10. Versioning
- Version numbers follow SemVer and have a single source: `package.json` (currently `0.0.1`).
- Every user-visible change goes in `CHANGELOG.md` under `[Unreleased]` (the file does not exist yet; create it when phase 1 starts).
- Releases are tagged `vX.Y.Z`; commits use Conventional Commits, and PRs target `dev`.
