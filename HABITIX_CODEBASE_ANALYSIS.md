# Habitix Codebase Analysis

## 1. Executive Summary

Habitix is a TypeScript **Next.js 15 App Router** application backed by MongoDB/Mongoose. Its current code implements account authentication, goal/roadmap creation, a normalized task queue, task completion/revision scheduling, basic analytics, spreadsheet task import, browser push subscription/sending, Razorpay order creation, a people-to-people chat UI, and persona-based Gemini chat. The project also retains older/legacy endpoint and UI paths alongside a more structured `/api/v1` API. Evidence: `package.json`, `src/app`, `src/modules`, and `src/models`.

The core task/goal path is comparatively structured: route handlers use `requireUserId`, Zod request schemas, repositories, services, and a common `{ success, data }` envelope (`src/lib/auth/session.ts`, `src/modules/tasks/task.schemas.ts`, `src/lib/api/response.ts`). It is the strongest reuse candidate for a Learning Platform V1.

The application is **not verified as production-ready**. Significant code-evidenced blockers include an email credential embedded in source (intentionally not reproduced here), unauthenticated payment-order, push-send, persona, user-detail, chat-message-list, and health endpoints, and no payment-signature/webhook verification (`src/app/api/email/send-email/route.tsx`, `src/app/api/razorpay-create-order/route.ts`, `src/app/api/notifications/send/route.ts`, `src/app/(personaChat)/api-v2/**`, `src/app/api/users/[userId]/route.ts`, `src/app/api/chats/[chatId]/route.ts`). No tests, CI workflow, rate limiter, monitoring integration, or deployment configuration were found in the inspected files.

## 2. Analysis Scope and Limitations

This report is based on the repository files available at analysis time: 152 non-generated, non-secret files were enumerated; 38 API route files, 9 Mongoose model files, configuration, scripts, route handlers, services, hooks, components, and pages were inspected. `.env*`, key/certificate extensions, dependencies, generated build artifacts, and real database data were excluded. No secrets or values from secret-bearing source are reproduced.

Claims describe code presence, not live deployment behavior. Environment variable values, MongoDB indexes already deployed, OAuth configuration, external service availability, hosting, backups, analytics/monitoring configuration, and runtime socket hosting are **not verified from the codebase**.

`npm.cmd run build` was attempted for this audit. It reached the configured `next build` command but could not run because the local `next` executable was unavailable (the dependency installation is not present/usable in this workspace). Build success is therefore **not verified**.

## 3. Technology Stack

| Area | Verified technology | Evidence |
|---|---|---|
| Web UI / server | Next.js 15.3.8 App Router, React 19, TypeScript | `package.json`, `src/app/**` |
| Styling/UI | Tailwind CSS 4, Material UI 7, Emotion, Lucide, Framer Motion | `package.json`, component imports |
| Database / ODM | MongoDB through Mongoose 8, cached connection helper | `src/lib/db.ts`, `src/models/**`, `src/modules/**/**/*.model.ts` |
| Authentication | NextAuth v4 JWT sessions; Credentials, GitHub, and Google providers | `src/lib/authOptions.ts`, `src/app/api/auth/[...nextauth]/route.ts` |
| Password security | bcryptjs hashing with 10-round generated salt | `src/models/User.ts` |
| Validation | Zod on principal v1 goal/task/roadmap endpoints | `src/modules/tasks/task.schemas.ts`, v1 route files |
| AI | Google GenAI SDK for roadmap generation; OpenAI-compatible SDK configured to Gemini endpoint for persona chat | `src/services/ai/ai.service.ts`, `src/app/(personaChat)/api-v2/chat/[personaId]/route.ts` |
| Payments | Razorpay client and order API | `src/components/razorpay/PaymentButton.tsx`, `src/app/api/razorpay-create-order/route.ts` |
| Notifications | Web Push/VAPID and service worker; Nodemailer/Gmail email route | `public/sw.js`, `src/app/api/notifications/**`, `src/app/api/email/send-email/route.tsx` |
| Real time | Socket.IO server/client package and client chat connections | `src/lib/socket.ts`, `src/app/people/**`, `package.json` |
| Import | SheetJS/xlsx parsing for `.xlsx`, `.xls`, `.csv` | `src/modules/tasks/task-import.service.ts` |
| Build/scripts | npm, Next build/start/dev, TypeScript; one task migration | `package.json`, `scripts/migrate-sync-tasks.ts` |

Redis, queues, cloud object storage, background workers, FCM/OneSignal, automated test tooling, container definitions, and deployment configuration are **not verified from the codebase**.

## 4. Project Structure

```text
src/
  app/                       App Router pages, layouts, route handlers
    (app)/                   Today/goals/performance/mobile-oriented UI
    (auth)/                  Sign-in, sign-up, password-reset UI
    (personaChat)/           Persona pages and /api-v2 route group
    api/                     Legacy APIs plus versioned /api/v1 APIs
    dashboard/, people/, admin/  Additional legacy/admin-facing pages
  components/                Shared UI, auth, today, notification, payment components
  hooks/                     Client-side queue hook
  lib/                       DB, auth, date, Socket.IO, API response helpers
  models/                    Legacy/shared Mongoose models
  modules/                   Domain services, repositories and models
    goals/, tasks/, revisions/, analytics/, scheduling/
  services/ai/               Gemini roadmap service
  types/                     TypeScript view/domain declarations
public/                      Static assets and service worker
scripts/                     Goal-task synchronization migration and UI patch script
```

`src/modules` is the primary domain layer for the newer task system. `src/models/Goal.ts` is a compatibility re-export of `src/modules/goals/goal.model.ts`. Route groups in parentheses do not alter public URLs; therefore `src/app/(personaChat)/api-v2/**` maps to `/api-v2/**`.

## 5. Existing Features

| Feature and status | Workflow / implementation | Primary evidence |
|---|---|---|
| Authentication — implemented | Registration creates a local user; credentials login compares bcrypt hash; OAuth JWT callback finds/creates a user and copies Mongo ID to session. Middleware redirects anonymous visitors from `/dashboard`, `/today`, `/goals`. | `src/app/api/auth/register/route.ts`, `src/lib/authOptions.ts`, `src/models/User.ts`, `src/middleware.ts` |
| Goal creation/list/detail/delete — implemented | Authenticated user submits validated goal data; service normalizes optional nested roadmap and creates/synchronizes normalized tasks. v1 list/detail/delete scopes reads/deletes to owner. | `src/app/api/v1/goals/**`, `src/modules/goals/goal.service.ts` |
| Guided roadmap generation — implemented | Goal-chat screen collects six answers, calls Gemini roadmap endpoint, adds local dates, then saves a v1 goal. AI output is parsed and Zod-validated. | `src/app/dashboard/goal-chat/page.tsx`, `src/services/ai/ai.service.ts` |
| Task queue and management — implemented | Today view loads overdue/today/revision sections; users can create, update/bulk-update, import, complete, skip, reopen, reschedule, delete, or redistribute backlog. Ownership checks are present on v1 task mutations. | `src/components/today/TodayView.tsx`, `src/hooks/useTodayQueue.ts`, `src/app/api/v1/tasks/**` |
| Roadmap-to-task synchronization — implemented with dual representations | Goal nested roadmap tasks are flattened into the `Task` collection on first synchronization. A legacy toggle endpoint updates both representations. | `src/modules/goals/goal-sync.service.ts`, `src/app/api/goals/toggle-task/route.ts` |
| Revision scheduling — implemented | Completing an execution task can create a 20-minute revision task for preset/custom dates and a `Revision` record. | `src/modules/tasks/task-completion.service.ts`, `src/modules/revisions/revision.service.ts` |
| Gamification / progress — partial | Goal days have `unlocked`/`completed`, next roadmap day unlocks when a day’s nested tasks complete; analytics tracks completion/streak/focus score. Stars/rewards are not found in live models/services. | `src/modules/goals/goal.model.ts`, `src/app/api/goals/toggle-task/route.ts`, `src/modules/analytics/analytics.service.ts` |
| Analytics/performance — implemented (basic) | API returns task completion counts, goals, streak/focus fields; Performance page consumes summary and today queue. | `src/app/api/v1/analytics/summary/route.ts`, `src/app/(app)/performance/page.tsx` |
| Spreadsheet import — implemented | Owner-selected goal accepts limited-size xlsx/xls/csv, requires all seven headers, parses to normalized tasks and can replace all goal tasks. | `src/app/api/v1/tasks/import-excel/route.ts`, `src/modules/tasks/task-import.service.ts` |
| Browser push notifications — partial | Browser components request permission and store subscription; send endpoint selects by user/category and cleans invalid subscriptions. Admin page renders sender dashboard. No role guard or scheduler found. | `src/components/notifications/**`, `src/app/api/notifications/**`, `src/app/admin/notifications/page.tsx` |
| Razorpay checkout — partial | Pricing button requests an order then opens Razorpay Checkout and handles client success/failure callbacks. No persistence, signature verification, webhook, entitlement, or authentication in order route was found. | `src/components/razorpay/PaymentButton.tsx`, `src/app/api/razorpay-create-order/route.ts` |
| People chat — partial/insecure | Authenticated UI lists other users, creates a pair chat, persists messages, and opens Socket.IO client connection. Server initialization is not invoked by `/api/socket`; message read/user-detail routes lack access checks. | `src/app/people/**`, `src/app/api/chats/**`, `src/app/api/messages/route.ts`, `src/lib/socket.ts`, `src/app/api/socket/route.ts` |
| Persona chat — partial/insecure | Public persona list/create/get and Gemini chat endpoints accept a client-supplied message history. Persona/threads/message models exist, but chat endpoint does not write `ChatThread`/`ChatMessage`; edit page requests unsupported PUT. | `src/app/(personaChat)/personas/**`, `src/app/(personaChat)/api-v2/**`, `src/models/PersonaChat/**` |
| Email broadcast/admin UI — partial/insecure | Admin email page posts recipient/category/message; route sends via Nodemailer. It has no authentication/authorization and contains a credential in source. | `src/app/admin/email/page.tsx`, `src/app/api/email/send-email/route.tsx` |
| PWA install — partial | Download page listens to browser install prompt; static service worker exists. Manifest/configuration completeness is not verified. | `src/app/download/page.tsx`, `public/sw.js` |
| Proof uploads/social/rewards/password reset — not verified as implemented | Model includes roadmap proof metadata, but no upload/storage route exists. UI page exists for forgot password, but no reset-token/email workflow was found. | `src/modules/goals/goal.model.ts`, `src/app/(auth)/forgot-password/page.tsx` |

## 6. API Route Inventory

All paths below are derived from route file locations. “Owner” means the handler checks session identity against resource user ID; “none” means no route-level authentication was found.

| Method | Path | Auth / authorization | Request validation & main flow | Response / file |
|---|---|---|---|---|
| GET | `/api/health` | none | Connects DB, reports connection state. | health JSON/503; `src/app/api/health/route.ts` |
| POST | `/api/auth/register` | none | Requires truthy fullname/email/password only; calls `registerUser`. | `{user}`/errors; `src/app/api/auth/register/route.ts` |
| GET, POST | `/api/auth/[...nextauth]` | NextAuth | NextAuth handler for login/callback/session actions. | provider-defined; `src/app/api/auth/[...nextauth]/route.ts` |
| POST | `/api/generate-roadmap` | authenticated | Zod `generateRoadmapSchema`; Gemini generation. | `{roadmap}`; `src/app/api/generate-roadmap/route.ts` |
| POST | `/api/goals` | authenticated | Zod goal schema with UI defaults; creates/syncs goal. | `{id}`; `src/app/api/goals/route.ts` |
| GET | `/api/goals/[id]` | optional; owner scope only if logged in | Reads goal; anonymous path calls unscoped lookup. | goal/404; `src/app/api/goals/[id]/route.ts` |
| GET | `/api/goals/count` | authenticated | Counts non-archived owned goals. | `{count}`; `src/app/api/goals/count/route.ts` |
| PATCH | `/api/goals/toggle-task` | owner goal check | Checks only required fields; toggles nested task, syncs normalized task, optionally schedules revision. | `{success:true}`; `src/app/api/goals/toggle-task/route.ts` |
| GET | `/api/get-todays-tasks` | authenticated | Legacy mapped view of today queue. | legacy task shape; `src/app/api/get-todays-tasks/route.ts` |
| POST | `/api/razorpay-create-order` | **none** | Accepts unvalidated `amount`, multiplies by 100, creates INR order. | `{order}`/503; `src/app/api/razorpay-create-order/route.ts` |
| POST | `/api/notifications/subscribe` | **none** | Requires subscription endpoint; upserts endpoint/categories/client-supplied userId. | subscription document; `src/app/api/notifications/subscribe/route.ts` |
| POST | `/api/notifications/send` | **none** | Client supplies message/title/userId/category; sends VAPID notifications. | `{success,sent}`; `src/app/api/notifications/send/route.ts` |
| POST | `/api/email/send-email` | **none** | Requires truthy email/message; sends Gmail mail. | message/errors; `src/app/api/email/send-email/route.tsx` |
| GET | `/api/users` | authenticated, no roles | Lists all other user IDs/fullnames/emails. | user list; `src/app/api/users/route.ts` |
| GET | `/api/users/[userId]` | **none** | ID lookup; selection requests `_id name email` although model defines `fullname`, not `name`. | user/404; `src/app/api/users/[userId]/route.ts` |
| POST | `/api/chats` | authenticated | Takes unvalidated `userId`; finds/creates chat with `$all` participants. | `{chatId}`; `src/app/api/chats/route.ts` |
| GET | `/api/chats/[chatId]` | **none** | Lists messages for arbitrary chat ID. | message array; `src/app/api/chats/[chatId]/route.ts` |
| POST | `/api/messages` | authenticated, no participant check | Accepts arbitrary chatId/text and creates message under caller. | message document; `src/app/api/messages/route.ts` |
| GET | `/api/socket` | none | Returns “Socket initialized”; does not call imported `initSocket`. | text; `src/app/api/socket/route.ts` |
| GET, POST | `/api-v2/personas` | **none** | GET lists; POST passes entire JSON body directly to Persona creation. | personas/persona; `src/app/(personaChat)/api-v2/personas/route.ts` |
| GET | `/api-v2/personas/[id]` | **none** | `findById`, no ID validation. | `{persona}`/404; `src/app/(personaChat)/api-v2/personas/[id]/route.ts` |
| OPTIONS, POST | `/api-v2/chat/[personaId]` | **none**, permissive CORS | Fetches persona, turns supplied messages into Gemini compatible chat history. | `{reply}`; `src/app/(personaChat)/api-v2/chat/[personaId]/route.ts` |
| GET | `/api/v1/today` | authenticated | Synchronizes unsynced goals, queries task queue. | common success envelope; `src/app/api/v1/today/route.ts` |
| GET | `/api/v1/analytics/summary` | authenticated | Summary + active goal count + completed task count. | common envelope; `src/app/api/v1/analytics/summary/route.ts` |
| POST | `/api/v1/scheduling/redistribute` | authenticated | No body; redistributes overdue pending/in-progress tasks. | common envelope; `src/app/api/v1/scheduling/redistribute/route.ts` |
| GET, POST | `/api/v1/goals` | authenticated | GET lists owner active goals; POST uses `createGoalSchema`. | common envelope; `src/app/api/v1/goals/route.ts` |
| GET, DELETE | `/api/v1/goals/[id]` | authenticated, owner | Gets or deletes owned goal; delete removes all associated normalized tasks. | common envelope; `src/app/api/v1/goals/[id]/route.ts` |
| GET | `/api/v1/goals/[id]/tasks` | authenticated, owner | Confirms owned goal then returns its eligible tasks. | common envelope; `src/app/api/v1/goals/[id]/tasks/route.ts` |
| POST | `/api/v1/goals/generate-roadmap` | authenticated | `generateRoadmapSchema`; Gemini call. | common envelope; `src/app/api/v1/goals/generate-roadmap/route.ts` |
| POST | `/api/v1/tasks/create` | authenticated, owner goal | `createManualTaskSchema`; creates normalized task. | common envelope; `src/app/api/v1/tasks/create/route.ts` |
| PATCH | `/api/v1/tasks/bulk-update` | authenticated, owner per item | Array min 1 with limited fields; sequential owner lookup/update. | per-item results; `src/app/api/v1/tasks/bulk-update/route.ts` |
| POST | `/api/v1/tasks/import-excel` | authenticated, owner goal | 5 MB max, extension whitelist, all required headers; optional destructive replacement of goal tasks. | import counts; `src/app/api/v1/tasks/import-excel/route.ts` |
| PATCH | `/api/v1/tasks/[id]/update` | authenticated, owner | Limited Zod update fields. | normalized task fields; `src/app/api/v1/tasks/[id]/update/route.ts` |
| PATCH | `/api/v1/tasks/[id]/complete` | authenticated, owner | Zod note/revision schedule; completion, analytics, optional revision. | completion result; `src/app/api/v1/tasks/[id]/complete/route.ts` |
| PATCH | `/api/v1/tasks/[id]/skip` | authenticated, owner | Optional 500-char reason. | task ID; `src/app/api/v1/tasks/[id]/skip/route.ts` |
| PATCH | `/api/v1/tasks/[id]/reopen` | authenticated, owner | No body; resets task state. | task ID; `src/app/api/v1/tasks/[id]/reopen/route.ts` |
| PATCH | `/api/v1/tasks/[id]/reschedule` | authenticated, owner | Required `YYYY-MM-DD`. | task/date; `src/app/api/v1/tasks/[id]/reschedule/route.ts` |
| DELETE | `/api/v1/tasks/[id]/delete` | authenticated, owner | No body; document removal. | success; `src/app/api/v1/tasks/[id]/delete/route.ts` |

## 7. Database Models and Relationships

| Model | Key fields, defaults, constraints | Relationships / evidence |
|---|---|---|
| `User` | required trimmed `fullname`; required unique lowercased `email`; local-only `password`; provider enum default `local`; optional providerId; timestamps. Password hashes pre-save. | Referenced by Task, Chat participants, Message sender; `src/models/User.ts` |
| `Goal` | string `userId` indexed; title required; target/preferences/motivation; status enum default active; nested roadmap; `tasksSyncedAt`; timestamps; compound user/status index. | Owns embedded roadmap days/tasks; normalized Task records reference it; `src/modules/goals/goal.model.ts` |
| `Task` | required ObjectId user/goal, date/task/topic; type/status/priority enums/defaults; minutes defaults 30; source metadata; completion/reschedule data; timestamps; four query indexes. `date` aliases `scheduledDate`; `topic` aliases `title`. | refs User, Goal, optional Task revision; `src/modules/tasks/task.model.ts` |
| `TaskHistory` | required user/task/goal IDs; event string; mixed payload; created timestamp only; user/date and task/date indexes. | Tracks Task events; `src/modules/tasks/task-history.model.ts` |
| `Revision` | required user/source/revision Task IDs, interval/due date; lifecycle status enum default scheduled; timestamps and indexes. | links original and generated Task; `src/modules/revisions/revision.model.ts` |
| `UserAnalytics` | unique string userId; streak, completion, revision, rate/focus fields default 0; date and Map heatmap; timestamps. | Per-user derived metrics; `src/modules/analytics/user-analytics.model.ts` |
| `PushSubscription` | optional string userId, categories array, required Web Push subscription endpoint/keys; createdAt only. | Notification recipient data; endpoint has no declared unique index (upsert query is by endpoint); `src/models/PushSubscription.ts` |
| `Persona` | required name; optional description/avatar/system prompt; timestamps. | Referenced by persona chat models, but no user ownership field; `src/models/PersonaChat/Persona.ts` |
| `ChatThread` / `ChatMessage` | thread has persona ref, title/status/messages refs; message has persona ref, role/content/date. | Defined but no endpoint/service writes them; `src/models/PersonaChat/*.ts` |
| `Chat` / `Message` | Chat stores User participant ObjectId array, timestamps and array index; Message stores required Chat/User ref/text and timestamps, indexed by chat/date. | People chat persistence; `src/models/PeoplesChat/*.ts` |

```text
User ──< Goal (Goal.userId is a string)
User ──< Task >── Goal
Task ──< TaskHistory
Task (execution) ── Revision ──> Task (revision)
User ──< UserAnalytics / PushSubscription
User >──< Chat ──< Message (sender is User)
Persona ──< ChatThread ──< ChatMessage   [models exist; persistence flow unused]
```

The mixed `Goal.userId: string` versus `Task.userId: ObjectId` design is intentional in current code but creates conversion/coupling requirements. Mongoose-generated `_id` fields in nested roadmap tasks are relied on by synchronization.

## 8. Authentication and Authorization

Implemented: NextAuth credentials, GitHub and Google providers; JWT sessions; server `requireUserId`; bcrypt password hashing; auth-page/selected-page middleware; provider user provisioning; Zod validation on most v1 write APIs; client-rendered React escapes text by default. Files: `src/lib/authOptions.ts`, `src/lib/auth/session.ts`, `src/models/User.ts`, `src/middleware.ts`, `src/modules/tasks/task.schemas.ts`.

Missing or not verified:

- No role field, RBAC utility, or admin authorization check exists. `/admin/email` and `/admin/notifications` pages/routes are not protected by middleware, and their APIs have no session check.
- Middleware protects only `/dashboard`, `/today`, `/goals`; `/people`, `/personas`, `/admin`, `/api`, and `/api-v2` have no middleware protection (`src/middleware.ts`).
- Multiple APIs lack authentication or resource participant/owner checks, enumerated in Section 6.
- Registration has only presence checks: no server email format, password policy, normalization, abuse prevention, or duplicate-specific response (`src/app/api/auth/register/route.ts`, `src/lib/registerUser.ts`).
- No rate limiting, CSRF-specific configuration, security headers/CSP, audit log, account lockout, reset-token flow, or secret scanning is found. NextAuth’s built-in behavior beyond configured code is not evaluated here.
- A hard-coded email credential is present in source; its value is deliberately omitted. This is a critical secret-management issue (`src/app/api/email/send-email/route.tsx`).

## 9. External Integrations

| Integration | Purpose / data flow | Configuration and handling |
|---|---|---|
| MongoDB | Mongoose models/services use cached connection. | `MONGODB_URI` read in `src/lib/db.ts`; missing URI throws. |
| Google/GitHub OAuth | NextAuth providers authenticate users and create local records on JWT callback. | IDs/secrets read in `src/lib/authOptions.ts`; viability not verified. |
| Gemini | Goal service calls Google GenAI `gemini-1.5-flash`; persona endpoint calls Gemini’s OpenAI-compatible endpoint with `gemini-2.0-flash`. | `GEMINI_API_KEY`; errors mapped to 500/structured error. Persona endpoint has no catch. |
| Razorpay | Server creates order; browser opens checkout using public key. | `RAZORPAY_KEY_SECRET` and public ID; create error becomes 503. No verification/webhook. |
| Web Push | Saves Web Push subscriptions and uses VAPID to send. | VAPID variables validated in send route; expired endpoints are deleted. |
| Gmail/Nodemailer | Sends an arbitrary email request. | Source includes a credential instead of environment config; failure returns 500. |
| Socket.IO | Clients connect to a public configured URL and emit messages/typing. | `NEXT_PUBLIC_SOCKET_URL`; `initSocket` server is not wired from API route; deployment integration not verified. |

## 10. Important User Flows

1. **Register/sign in:** sign-up posts name/email/password to `/api/auth/register`; `registerUser` creates the user and model hook hashes local password. Sign-in uses NextAuth credentials; valid session JWT contains Mongo user ID. (`src/app/(auth)/signup/page.tsx`, `src/lib/authOptions.ts`.) Sign-up does not redirect or automatically sign in after success.
2. **Generate a learning-style goal roadmap:** dashboard chat gathers title, duration, availability and motivation; posts to `/api/generate-roadmap`; client adds dates to returned days; posts the completed goal to `/api/v1/goals`; goal service normalizes/saves it and syncs roadmapped tasks. (`src/app/dashboard/goal-chat/page.tsx`, `src/services/ai/ai.service.ts`, `src/modules/goals/goal.service.ts`.)
3. **Use Today queue:** `/api/v1/today` first syncs any unsynced roadmap, then groups overdue/current/revision tasks and returns aggregate load. User actions invoke v1 completion/skip/reschedule and refresh queue. (`src/modules/tasks/today.service.ts`, `src/hooks/useTodayQueue.ts`.)
4. **Complete and revise:** owner task is marked complete, history and analytics are updated; an execution task may create a revision task/record based on a selected interval. (`src/modules/tasks/task-completion.service.ts`, `src/modules/revisions/revision.service.ts`.)
5. **Import tasks:** an authenticated owner submits a spreadsheet with all required headers; parser normalizes rows and inserts tasks. “replace” deletes every normalized Task for the goal before import. (`src/app/api/v1/tasks/import-excel/route.ts`, `src/modules/tasks/task-import.service.ts`.)
6. **Persona chat:** UI fetches persona then sends browser-maintained history to `/api-v2/chat/[personaId]`; handler composes persona prompt and returns Gemini reply. History is not persisted by that handler. (`src/app/(personaChat)/personas/[id]/page.tsx`, `src/app/(personaChat)/api-v2/chat/[personaId]/route.ts`.)
7. **People chat:** UI gets a user, creates/fetches a Chat, reads its messages, posts a message, and separately emits Socket.IO event. The database route does not verify membership. (`src/app/people/[userId]/page.tsx`, `src/app/api/chats/**`, `src/app/api/messages/route.ts`.)
8. **Payments/notifications:** pricing triggers server order then Razorpay browser checkout; notification components save a browser subscription and admin dashboard calls send. Payment completion and notification sender authorization are not verified. (`src/components/razorpay/PaymentButton.tsx`, `src/components/notifications/**`.)

## 11. Architecture Overview

The newer path follows `route -> authentication/validation -> service -> repository/model`, using shared API helpers. For example, task completion flows from `src/app/api/v1/tasks/[id]/complete/route.ts` to `taskCompletionService`, `taskRepository`, history, analytics and optional revision service. This separation makes domain logic reusable.

Legacy paths co-exist: raw `NextResponse` shapes, direct Mongoose access in routes, client-controlled legacy roadmap state, and a second `/api-v2` persona layer. The app therefore has two styles rather than a single consistent API boundary. Some page links in `Footer.tsx` target routes not present in the inspected `src/app` tree; those destinations are not verified as implemented.

## 12. Code Quality Findings

| Severity | Evidence | Observation and suggested improvement |
|---|---|---|
| Critical | `src/app/api/email/send-email/route.tsx` | Email authentication material is hard-coded in source. Revoke/rotate it, move to secret manager/environment variables, and prevent source control recurrence. Value omitted from this report. |
| Critical | `src/app/api/email/send-email/route.tsx`, `src/app/api/notifications/send/route.ts`, `src/app/api/razorpay-create-order/route.ts` | Privileged/send/payment endpoints have no authentication or authorization. Require session plus explicit RBAC/ownership, validate data, and add audit/rate controls. |
| High | `src/app/api/goals/[id]/route.ts`, `src/app/api/users/[userId]/route.ts`, `src/app/api/chats/[chatId]/route.ts`, `src/app/api/messages/route.ts` | Resource reads/writes permit anonymous or non-participant access. Enforce authenticated owner/participant queries at data access boundary. |
| High | `src/components/razorpay/PaymentButton.tsx`, `src/app/api/razorpay-create-order/route.ts` | No payment signature verification, webhook, order-to-user record, or entitlements. Client success callback cannot establish payment truth. Implement server verification before provisioning. |
| High | `src/lib/socket.ts`, `src/app/api/socket/route.ts` | Socket handler trusts claimed handshake userId and `/api/socket` never calls `initSocket`; emitted message is not persisted by server. Authenticate socket tokens, authorize rooms, and host/wire Socket.IO deliberately. |
| Medium | `src/modules/goals/goal.model.ts`, `src/modules/goals/goal-sync.service.ts`, `src/app/api/goals/toggle-task/route.ts` | Tasks are stored both embedded in Goal and normalized Task; sync only inserts if no task exists, so later roadmap edits can diverge. Define one source of truth and transactional/idempotent reconciliation. |
| Medium | `src/app/(personaChat)/api-v2/**`, `src/models/PersonaChat/**` | Persona routes are public, POST accepts arbitrary model fields, CORS is `*`, and models for chat persistence are unused. Add auth/ownership, Zod schemas, bounded histories, and either persist or remove unused models. |
| Medium | `src/app/(personaChat)/personas/[id]/edit/page.tsx`, `src/app/(personaChat)/api-v2/personas/[id]/route.ts` | Edit UI invokes PUT, but API route exports GET only; persona edit cannot be completed through this code path. Add the intended mutation route or remove UI claim. |
| Medium | `src/app/api/auth/register/route.ts`, `src/lib/registerUser.ts` | User input only has truthiness validation. Enforce normalized email/password policy and return suitable conflict status without exposing operational error strings. |
| Medium | `src/app/api/v1/tasks/bulk-update/route.ts`, `src/modules/scheduling/scheduling.service.ts` | Updates run sequentially and backlog redistribution updates one document at a time; this may be slow at scale. Use bulk operations/transactions where consistency requires them. |
| Low | `src/app/api/users/[userId]/route.ts` | Selects `name` but `User` model field is `fullname`, likely producing no name field. Align selection/UI. |
| Low | `src/hooks/useTodayQueue.ts`, `src/app/people/**`, route handlers | Several `any` usages and inconsistent raw/error response envelopes weaken TypeScript/API contracts. Replace with typed DTOs and standardize on API helpers. |
| Low | `README.md`, `Roadmap.md` | Documents contain stale/planned claims that code does not substantiate (for example proof/social features). Treat as historical, update from tested implementation. |

## 13. Production Readiness Assessment

| Area | Status | Evidence/reasoning |
|---|---|---|
| Build/deployment | Partially verified | npm scripts exist; no CI, container, hosting or deployment config found. A build attempt could not start Next because the local executable was unavailable (`package.json`, root file inventory). |
| Environment configuration | Partially verified | Runtime environment variables are used; no safe example/template file found; one email secret is in source. |
| Authentication | Partially verified | NextAuth/JWT/bcrypt present; registration policy/reset/abuse controls absent. |
| Authorization | Appears missing | No roles; several sensitive endpoints have no authentication or resource scope. |
| Database reliability | Partially verified | Cached Mongo connection and useful task indexes exist; transactions, migration rollback, backup/recovery not found. |
| Error handling/logging | Partially verified | v1 shared error helper exists; legacy routes vary and use console output. Central structured logging not found. |
| Monitoring/health | Partially verified | DB health endpoint exists. Metrics, tracing, alerting, and error reporting are not verified. |
| Performance/scalability | Partially verified | Query indexes and bulk insert are present; sequential loops, dual state, no cache/queue, unrestricted expensive AI APIs are concerns. |
| Rate limiting / abuse prevention | Appears missing | No limiter, CAPTCHA, quota, or throttling code found. |
| Payment reliability | Appears missing | Order creation exists; verification/webhook/persistence/entitlement flow absent. |
| Background jobs | Not verified | No worker/queue/cron implementation found. |
| Validation | Partially verified | Strong Zod on v1 task/goal APIs; legacy/auth/persona/payment/chat/push routes are weak or unvalidated. |
| Tests | Appears missing | No test files/framework/scripts found in enumerated project files. |
| Backup/recovery | Not verified | No database backup/restore configuration found. |
| Accessibility/responsive UI | Partially verified | MUI and responsive Tailwind classes are used; no accessibility audit/tests found. |
| SEO | Partially verified | App metadata/SEO strategy not verified; layouts/pages exist but no explicit SEO audit artifacts found. |
| Privacy | Appears missing | Privacy page exists, but data-access gaps and secret exposure conflict with privacy readiness. |

## 14. Reusable Existing Components

| Reusable asset | How Learning Platform V1 could reuse it | Limitation |
|---|---|---|
| Auth/session helper | Use NextAuth session plus `requireUserId` for authenticated learning APIs. | Need role/tenant/authorization expansion. `src/lib/auth/**` |
| Goal/task domain layer | Adapt Goal/Task, schemas, repositories, queue and lifecycle services for learning plans, lessons and assignments. | Goal roadmap and Task are dual representations; resolve source of truth first. `src/modules/goals/**`, `src/modules/tasks/**` |
| Progress/analytics | Streak/completion/focus summaries can seed learner progress reporting. | Analytics is aggregate/basic; no course/lesson dimensions. `src/modules/analytics/**` |
| Revision service | Reuse spaced-review scheduling pattern for learning review tasks. | Presets collapse 1h/3h to same calendar day and no job/reminder process exists. `src/modules/revisions/**`, `src/lib/dates.ts` |
| Spreadsheet import | Reuse secure file-size/header parsing approach for curriculum/task import. | “replace” deletes all goal tasks and format is task-specific. `src/modules/tasks/task-import.service.ts` |
| Today UI/hook | Reuse focus queue, task cards, loading/error state and mutation refresh pattern. | Coupled to current task DTOs. `src/components/today/**`, `src/hooks/useTodayQueue.ts` |
| AI roadmap service | Reuse structured Gemini call/parser pattern for learning-plan generation. | Prompt has a 14-day cap; no quotas/moderation/retry observability. `src/services/ai/ai.service.ts` |
| Push subscription model/components | Reuse browser subscription storage/delivery mechanics. | Add authenticated ownership, roles, scheduling and consent lifecycle. `src/models/PushSubscription.ts`, `src/components/notifications/**` |
| App shell/layout components | Reuse mobile navigation and shared presentation. | Exact layout/component ownership needs product review. `src/components/app/AppShell.tsx`, `src/app/(app)/layout.tsx` |

## 15. Risks and Unknowns

- **Security risk:** source-embedded email credential and public privileged endpoints require immediate manual remediation/rotation (`src/app/api/email/send-email/route.tsx`).
- **Data exposure risk:** anonymous goal/user/chat/persona APIs and unverified chat participation can disclose or modify data (`src/app/api/goals/[id]/route.ts`, `src/app/api/chats/[chatId]/route.ts`, `src/app/api/messages/route.ts`).
- **Payment risk:** no server-side confirmation creates a material mismatch between UI payment success and durable entitlement (`src/components/razorpay/PaymentButton.tsx`).
- **Consistency risk:** nested roadmap tasks and normalized tasks can drift; no database transaction coordinates Goal/Task/History/Analytics writes.
- **Real-time risk:** runtime socket server hosting and correct initialization are not verified; source route does not initialize it.
- **Unknown:** actual deployed database state/migrations, configured providers, service worker registration, email domain deliverability, and production hosting are not available in source.
- **Documentation debt:** README/Roadmap describe features that were not verified from executable implementation.

## 16. Recommended Audit Priorities

1. Immediately rotate the exposed email credential, purge it from version history as appropriate, and use managed secrets.
2. Perform an authorization audit and protect/remove all legacy public routes; add RBAC before relying on admin pages.
3. Build a server-authoritative Razorpay verification/webhook/entitlement flow.
4. Decide and document the canonical source of task completion/roadmap state; add transactional or reconciliation safeguards.
5. Validate Socket.IO architecture in the intended host and secure its authentication/room membership.
6. Add request schemas and rate limits to legacy, AI, chat, payment, push and registration APIs.
7. Add integration tests for authentication, authorization, payment, task lifecycle, import replacement and API contracts; then establish CI and monitoring.

## 17. Appendix: Important File References

- Application/configuration: `package.json`, `next.config.ts`, `tsconfig.json`, `src/app/layout.tsx`, `src/middleware.ts`
- Auth/DB/API foundation: `src/lib/authOptions.ts`, `src/lib/auth/session.ts`, `src/lib/db.ts`, `src/lib/api/**`, `src/lib/registerUser.ts`
- Core domain: `src/modules/goals/**`, `src/modules/tasks/**`, `src/modules/revisions/**`, `src/modules/analytics/**`, `src/modules/scheduling/**`
- Data models: `src/models/User.ts`, `src/models/PushSubscription.ts`, `src/models/PersonaChat/**`, `src/models/PeoplesChat/**`
- Principal UI: `src/components/today/**`, `src/app/dashboard/goal-chat/page.tsx`, `src/app/dashboard/goals/[id]/page.tsx`, `src/app/(app)/**`, `src/app/people/**`, `src/app/(personaChat)/personas/**`
- Integration boundaries: `src/services/ai/ai.service.ts`, `src/components/razorpay/PaymentButton.tsx`, `src/components/notifications/**`, `src/lib/socket.ts`
- Maintenance/docs: `scripts/migrate-sync-tasks.ts`, `README.md`, `Roadmap.md`
