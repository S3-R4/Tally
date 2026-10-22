# Current project checkpoint

Updated: 2026-10-22 (Europe/Berlin). This is a factual checkpoint, not another instruction entrypoint. Start with [AGENTS.md](../AGENTS.md), verify this snapshot against Git/files, and follow the [workflow](WORKFLOW.md).

## Current objective and ownership

- Latest user decision: the current frontend is rejected. Claude Design will sketch a replacement design system; the current task is to provide a detailed standalone brief while leaving visual choices open.
- Current owner: integrator; [T10](tasks/T10.md) prepares the [Claude Design brief](design/claude-design-brief.md) and updates [DESIGN.md](DESIGN.md) to revision 1.1. No replacement implementation is assigned or approved. Existing backend/domain behavior is reusable.
- [A01](APPROVALS.md#a01--first-release) is changes requested, not approved for merge. Initial T00–T07 source completion is historical and does not mean the redesigned frontend is complete. Do not ask the user to approve the rejected frontend again; obtain review of the replacement proposal when available. Other acceptance checks remain outstanding.

## Git snapshot and unpublished work

- Fetched all remotes and inspected local/remote branches, history, the registered worktree, and task ownership on 2026-10-22.
- Checkout/worktree: `/home/s3r4/Projects/Tally`, branch `codex/complete-first-release`.
- Published implementation base: `9695f32` (`takla version`). The coordination/persistence/publication policy was subsequently published in `67cf138` on `codex/complete-first-release` and `origin/codex/complete-first-release`; push succeeded and both refs were verified equal, with zero ahead/behind. The branch has an upstream; the normal command for passing changes is `git push`. This completion checkpoint follows that policy commit; derive its own latest commit/ref from Git rather than expecting a file to contain its own commit hash.
- `main` and `origin/main`: `484107b` (`amogus`), the earlier foundation. No branch integration has occurred. Required integration style is `git merge --no-ff`.
- Only this worktree and those two branch names were found. Unpublished work in other clones cannot be inferred from this inventory. Repeat the preflight before new work; these commit IDs are a snapshot.
- The accumulated documentation follow-up (AGENTS.md, PLAN.md, README.md, workflow/checkpoint/task records) is published in `67cf138`. This final completion checkpoint updates docs/STATE.md and task records under the same tested commit/push rule. Inspect `git status --short --branch`, `git log -1 -- docs/STATE.md`, and `git rev-list --left-right --count HEAD...@{upstream}` to verify the latest checkpoint itself is committed/synced. Any remaining local checkpoint edits must also pass documentation checks and be committed/pushed; do not assume completion from these words alone.
- No deployment has been performed. Ordinary tested task-branch commits/pushes now have standing user authorization under AGENTS.md and docs/WORKFLOW.md. Branch integration, deployments, destructive operations and external-agent messaging are not authorized by that rule. Record publication from observed Git results; do not infer it from file edits.

## Authoritative information map

| Information                                                                                     | Record                                                                            |
| ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Pending reviews, human testing checklists and revision-scoped merge approval evidence           | [APPROVALS.md](APPROVALS.md)                                                      |
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

1. Check [pending approvals](APPROVALS.md) against current refs and available PR reviews at every new conversation/feature request; report A01 changes requested and review the replacement proposal when available; do not treat the rejected frontend as awaiting routine approval. Continue independent work; dependent branches inherit the gate. Do not merge the release while approval is pending.

2. The rule and accumulated documentation were published in 67cf138; T08 is complete. Verify the final checkpoint commit is synced using Git as described above, finishing any local/unpushed documentation edits under the standing rule. T10 records the subsequent design brief; await a reviewed replacement proposal before frontend implementation and reuse existing domain code.
3. Keep this checkpoint and the task ledger current before yielding, handing off, or starting long-running work. Future user decisions must be saved before dependent implementation.
4. Standing user authorization now requires committing and pushing every change after required checks pass, including documentation/checkpoint edits. Do not ask again for routine commit/push approval or leave passing work local-only without recording a concrete publication blocker. Verify the remote result; running agents must fetch and reread the updated instructions. No other agents have been contacted by this documentation task.
5. For any future feature/fix, verify existing branches and task state first, claim only remaining work, and follow the existing tests/contracts. Deployment and real OAuth acceptance remain separate operator steps; do not silently turn them into completed work.

## Latest policy follow-up — T09

- Preflight fetched all remotes and inspected branches, documentation history/diffs, task ownership and the sole worktree. Starting HEAD/upstream: 8d27897; main/origin/main: 484107b. Working tree was clean. Major-change approval rules were absent and are now documented without changing the application.
- Documentation checks: targeted Prettier passed for all eight changed documents; pnpm exec vitest run tests/docs.test.ts passed (1 test, 0 failures; RTK JSON report inspected); git diff --check passed. Application/browser tests were not rerun for this documentation-only change. Publication follows verified checks on the existing pending branch; derive this checkpoint commit and push state from Git rather than embedding its own hash.
- Hosted PR reviews and branch protection were not inspected; no approval or protection enforcement is assumed. A01 remains pending, with testing checklist saved. No merge, deployment or external-agent contact.

## Latest design follow-up — T10

- User rejected the first frontend and requested an extensive Claude Design prompt with functional constraints and creative freedom. Saved in PLAN.md, DESIGN.md 1.1 and APPROVALS.md before design work. The previous palette, typography and layout defaults are superseded.
- Starting HEAD/upstream: 960b5f3; main/origin/main 484107b. Fetched remotes and inspected refs/history, sole worktree, task ownership and connected documents/source. No other pending implementation or owner found.
- Brief covers all first-release areas, time/eligibility/privacy semantics, responsive/accessibility/error states, stack and review deliverables. This is a prompt artifact; Claude Design has not been contacted and no new frontend has been implemented.
- Documentation checks: targeted Prettier passed for all eight changed documents; pnpm exec vitest run tests/docs.test.ts passed (1 test, 0 failures; RTK JSON report inspected); git diff --check passed. Manual coverage review checked the brief against PLAN.md/CONTRACTS.md. Publication follows verified checks under standing task-branch authorization; derive this checkpoint commit/sync state from Git. Full app/browser tests were not rerun for this documentation-only change.
- Next: user supplies the brief to Claude Design, reviews the proposal, and records selected design/artifacts before assigning replacement implementation. Release integration still requires explicit human approval.
