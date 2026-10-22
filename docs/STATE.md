# Current project checkpoint

Updated: 2026-10-22 (Europe/Berlin). This is a factual checkpoint, not another instruction entrypoint. Start with [AGENTS.md](../AGENTS.md), verify this snapshot against Git/files, and follow the [workflow](WORKFLOW.md).

## Current objective and ownership

- User instruction: preserve all actionable project information in repository documents so future agents and chats can resume without this conversation. Also require checking other branches before implementation to prevent duplicate work.
- Current owner: integrator; task [T08](tasks/T08.md) is in progress for its publication follow-up. User instruction dated 2026-10-22 now requires committing and pushing every change after its required checks pass; this is standing authorization for ordinary task-branch commits/pushes. The accumulated documentation is being checked and published under that rule. Application behavior is unchanged.
- First-release implementation tasks T00–T07 are recorded as complete in the [task ledger](tasks/README.md). Do not rebuild the application from an older branch. Use the existing implementation and inspect actual source/tests for subsequent changes.

## Git snapshot and unpublished work

- Fetched all remotes and inspected local/remote branches, history, the registered worktree, and task ownership on 2026-10-22.
- Checkout/worktree: `/home/s3r4/Projects/Tally`, branch `codex/complete-first-release`.
- `codex/complete-first-release` and `origin/codex/complete-first-release`: `9695f32` (`takla version`), containing the full first-release implementation. This branch was successfully pushed and its upstream configured. The normal command for subsequent authorized pushes is `git push`.
- `main` and `origin/main`: `484107b` (`amogus`), the earlier foundation. No branch integration has occurred. Required integration style is `git merge --no-ff`.
- Only this worktree and those two branch names were found. Unpublished work in other clones cannot be inferred from this inventory. Repeat the preflight before new work; these commit IDs are a snapshot.
- Local documentation follow-up: AGENTS.md, PLAN.md, README.md, docs/WORKFLOW.md, docs/STATE.md, docs/tasks/README.md, docs/tasks/T07.md, and docs/tasks/T08.md. Inspect `git status` for the actual set. These follow-up edits have not been committed or pushed; other checkouts do not yet have them. Source commit `9695f32` is already published.
- No deployment has been performed. Ordinary tested task-branch commits/pushes now have standing user authorization under AGENTS.md and docs/WORKFLOW.md. Branch integration, deployments, destructive operations and external-agent messaging are not authorized by that rule. Record publication from observed Git results; do not infer it from file edits.

## Authoritative information map

| Information                                                                                     | Record                                                                            |
| ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Standing agent rules, user communication preferences, persistence and branch-check requirements | [AGENTS.md](../AGENTS.md)                                                         |
| Product scope, user decisions versus engineering defaults, and dated coordination amendments    | [PLAN.md](../PLAN.md)                                                             |
| Shared types/boundaries, timer state/eligibility, privacy and reporting rules                   | [CONTRACTS.md](CONTRACTS.md)                                                      |
| UI, accessibility and original design                                                           | [DESIGN.md](DESIGN.md)                                                            |
| Assignments, preflight, checkpoints, handoffs and merge process                                 | [WORKFLOW.md](WORKFLOW.md)                                                        |
| Owners, completed behavior, checks, limits and integration state                                | [Task ledger](tasks/README.md) and individual task handoffs                       |
| Environment variable names, OAuth setup, commands                                               | [README.md](../README.md) and `.env.example`; never copy actual secrets into docs |
| Single-server setup, proxy/client-IP trust, consistent backup and restore                       | [OPERATIONS.md](OPERATIONS.md)                                                    |
| Kairu observations, advertised features and unverified research                                 | [RESEARCH.md](RESEARCH.md)                                                        |

## Existing implementation and verification

- Stack: TypeScript, TanStack Start, Tailwind CSS, shadcn/ui, Better Auth with Google only, Drizzle, and file-based SQLite. No external database container. The full source is on the feature branch above.
- Features: timers/recovery/corrections, tasks/tags/Kanban, review, personal analytics/goals, settings/data controls/exports, safe profiles/friends/kudos, opt-in rankings, and monthly/custom challenges. Detailed behavior and evidence are in the plan, contracts, and T01–T07 handoffs.
- Last full application checks, against the implementation preceding commit `9695f32`: `pnpm check` passed (format, lint, production build, strict types, 27 tests in nine files). `pnpm test:e2e` and `pnpm test:e2e:production` each passed four Chromium journeys. Migration upgrade/reapply, consistent backup/reopen/integrity, mode-0600 backup, peer dependencies, and desktop/mobile fixture screenshots were checked. These are historical results; rerun relevant checks for future application changes.
- Local checks used Node 26.1.0; CI targets Node 24. A committed CI workflow is not evidence that remote CI has run.
- Still unverified: real Google OAuth/callback, actual Node 24 CI execution, deployed domain/systemd/HTTPS proxy and client-IP behavior, off-server backup transfer/real production restore, production load, and physical touch/screen-reader hardware. Browser sound delivery while suspended is not guaranteed. See [T07](tasks/T07.md).
- Current publication follow-up: pnpm check passed (format, lint, production build, strict types, 27 tests in nine files). Earlier persistence checks also passed targeted Prettier, tests/docs.test.ts (1 test), and git diff --check. Browser suites were not rerun for these documentation-only changes. Canonical-document ownership, saved refs, standing publication authorization and resume steps were reviewed; final checkpoint-only edits use targeted documentation checks. See [T08](tasks/T08.md).

## Temporary preview and local tooling

- A disposable authenticated preview was started for the user's earlier request and verified then at `http://127.0.0.1:3102/`, redirecting to the application on port 3101. It uses test accounts, a temporary SQLite database, and expiring signed fixture sessions. This was not real Google login or a production deployment. Its current availability/expiry is not reverified by this documentation task.
- The local helper `.cache/preview.ts` exists in this checkout but is ignored and will not arrive in another clone. It was launched with `TALLY_E2E_PRODUCTION=1 node --import tsx .cache/preview.ts`; the built application is required. It reuses `tests/e2e/server.ts` and `tests/e2e/fixture.ts`. If a future preview is requested, inspect/reuse that fixture infrastructure and recreate a local-only helper if missing; never add a fixture-login bypass to production routes or reuse a real database.
- Preview process handles are session-local and may be invalid after interruption/new chat. Check health/ownership before claiming the preview is running or stopping a process. Do not persist cookies or auth-secret values here.
- This host uses RTK-condensed output. A Vitest reporter parse failure has produced `.vitest/json/output.json`; when that occurs, inspect its `success` and passed/failed test counts before reporting a result. Generated reports are temporary, not source; clean up only files created by the current run.

## Next steps

1. Verify the latest tested-change publication rule and accumulated documentation, then commit and push them to codex/complete-first-release. Confirm the remote ref, finalize T08/checkpoint, and publish that checked checkpoint update too. No new application task is assigned.
2. Keep this checkpoint and the task ledger current before yielding, handing off, or starting long-running work. Future user decisions must be saved before dependent implementation.
3. Standing user authorization now requires committing and pushing every change after required checks pass, including documentation/checkpoint edits. Do not ask again for routine commit/push approval or leave passing work local-only without recording a concrete publication blocker. Verify the remote result; running agents must fetch and reread the updated instructions. No other agents have been contacted by this documentation task.
4. For any future feature/fix, verify existing branches and task state first, claim only remaining work, and follow the existing tests/contracts. Deployment and real OAuth acceptance remain separate operator steps; do not silently turn them into completed work.
