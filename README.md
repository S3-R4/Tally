# Tally

Private-group productivity and time tracking inspired by Kairu, with reliable and correctable records.

Required stack: TypeScript, TanStack Start, Tailwind CSS, shadcn/ui, Better Auth (Google only), Drizzle, and a file-based SQLite database. One Linux application server; no external database container.

## Read first

- Every agent/provider starts with [AGENTS.md](AGENTS.md).
- [PLAN.md](PLAN.md) records the user's decisions, engineering defaults, scope, and acceptance criteria.
- [Research](docs/RESEARCH.md) distinguishes observed Kairu features from advertised behavior and unverified assumptions.
- [Contracts](docs/CONTRACTS.md), [design](docs/DESIGN.md), and [workflow](docs/WORKFLOW.md) define shared implementation and handoff rules.
- [Task ledger](docs/tasks/README.md) records actual progress. A planned feature is not a completed feature.

## Current implementation

The planning package is recorded. The application foundation includes a responsive sign-in page, protected account page, Google-only Better Auth, request-time allowlist checks, the shared Drizzle schema, migrations, backups, and automated checks. **The tracker, planning, reports, and social/challenge features are still scheduled in T02–T07.** This is not a completed tracker release.

## Local setup

Use Node 24 LTS and pnpm 11.3.0. Local checks in this workspace also run on the available Node 26 runtime; Node 24 is the CI target. Install the native SQLite build prerequisites if a prebuilt binary is unavailable (Python, make, and a C++ compiler on Linux).

```sh
pnpm install --frozen-lockfile
pnpm db:migrate
pnpm dev
```

Open [Tally locally](http://localhost:3000). Without authentication configuration, the page explains that sign-in is unavailable; no demo account or authentication bypass is enabled.

For actual sign-in, copy `.env.example` to `.env` and fill in:

| Variable                                   | Purpose                                                                                                         |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| `BETTER_AUTH_URL`                          | `http://localhost:3000` locally; the public HTTPS origin in production.                                         |
| `BETTER_AUTH_SECRET`                       | A random secret of at least 32 characters; generate privately, for example with `openssl rand -base64 32`.      |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google OAuth credentials for a Web application.                                                                 |
| `TALLY_ALLOWED_EMAILS`                     | Comma-separated exact Google email addresses. Empty denies all members; aliases are not automatically expanded. |
| `TALLY_DATABASE_PATH`                      | Database file; defaults to `./data/tally.sqlite`. Keep its parent directory private and persistent.             |
| `TALLY_TIME_ZONE`                          | Group calendar zone, initially `Europe/Berlin`. The migration records it; changing it afterward is rejected.    |

In Google Cloud, register `http://localhost:3000/api/auth/callback/google` as a development redirect URI and `https://YOUR_DOMAIN/api/auth/callback/google` for production. Request only normal sign-in scopes. Restart the server after configuration/allowlist changes. A removed address is denied on subsequent protected requests even if its Google session cookie still exists.

## Commands and verification

| Command                                | Action                                                                                     |
| -------------------------------------- | ------------------------------------------------------------------------------------------ |
| `pnpm dev`                             | Local Vite development server on loopback, port 3000.                                      |
| `pnpm build` / `pnpm start`            | Build client/server bundles; run the production server on loopback.                        |
| `pnpm check`                           | Formatting, lint, production build, TypeScript, domain/integration checks.                 |
| `pnpm test`                            | Focused tests; the browser-bundle check is skipped if no build exists.                     |
| `pnpm test:e2e`                        | Isolated Chromium checks with sign-in disabled; test server uses port 3100.                |
| `pnpm db:generate` / `pnpm db:migrate` | Generate reviewed schema migrations; apply committed migrations.                           |
| `pnpm db:backup`                       | Consistent online backup under `backups/`. An optional destination can follow the command. |

Install the test browser once with `pnpm exec playwright install chromium`. Tests use disposable data and signed fixture cookies; no production test-login route exists. A real Google callback remains a separate manual check requiring configured credentials. CI is configured for Node 24; a committed workflow is not evidence of a completed CI run.

Never commit `.env` files, SQLite databases, backups, or personal exports. See [operations](docs/OPERATIONS.md) for deployment and restore. Do not deploy merely because a development build succeeds.
