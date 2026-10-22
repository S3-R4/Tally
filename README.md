# Tally

Private-group productivity and time tracking inspired by Kairu, with reliable and correctable records.

Required stack: TypeScript, TanStack Start, Tailwind CSS, shadcn/ui, Better Auth (Google only), Drizzle, and a file-based SQLite database. One Linux application server; no external database container.

## Read first

- Every agent/provider starts with [AGENTS.md](AGENTS.md).
- [Pending human approvals](docs/APPROVALS.md) lists branches awaiting testing and explicit merge approval; check it on every new conversation or feature request.
- [Current checkpoint](docs/STATE.md) records where to resume, existing branches, pending work, and verification limits without relying on chat history.
- [PLAN.md](PLAN.md) records the user's decisions, engineering defaults, scope, and acceptance criteria.
- [Research](docs/RESEARCH.md) distinguishes observed Kairu features from advertised behavior and unverified assumptions.
- [Contracts](docs/CONTRACTS.md), [design](docs/DESIGN.md), and [workflow](docs/WORKFLOW.md) define shared implementation and handoff rules.
- [Task ledger](docs/tasks/README.md) records actual progress. A planned feature is not a completed feature.

## Current implementation

The first-release source covers countdown/stopwatch timers and recovery, tasks/tags/Kanban, manual records and timing revisions, personal reports/goals, profiles/friends/kudos, opt-in rankings, monthly/custom challenges, exports, and account/data controls. The workspace is at `/workspace`; tabs and filters are linkable search parameters. The plan and provider-independent agent instructions are saved in this repository.

Source checks and local production verification passed: `pnpm check` (27 tests) and four Chromium journeys in each of development and production modes. [T07](docs/tasks/T07.md) records the checks and remaining limits. Live Google OAuth and deployment still need operator configuration and observed verification.

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
| `pnpm test:e2e`                        | Chromium journeys with disposable databases and signed member fixtures, ports 3100/3101.   |
| `pnpm test:e2e:production`             | Run the same journeys against the built production server. Build first.                    |
| `pnpm db:generate` / `pnpm db:migrate` | Generate reviewed schema migrations; apply committed migrations.                           |
| `pnpm db:backup`                       | Consistent online backup under `backups/`. An optional destination can follow the command. |

Install the test browser once with `pnpm exec playwright install chromium`. Tests use disposable data and signed fixture cookies; no production test-login route exists. A real Google callback remains a separate manual check requiring configured credentials. CI is configured for Node 24; a committed workflow is not evidence of a completed CI run.

Never commit `.env` files, SQLite databases, backups, or personal exports. See [operations](docs/OPERATIONS.md) for deployment and restore. Do not deploy merely because a development build succeeds.
