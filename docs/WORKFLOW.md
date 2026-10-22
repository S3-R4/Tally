# Provider-independent workflow

All providers use AGENTS.md and the same documents. The Git revision of PLAN.md plus the CONTRACTS.md revision identifies a task's specification. Do not duplicate provider-specific rule sets.

## Assignment and ownership

The human or integrator assigns one numbered task and its allowed files. The integrator records assignments before parallel work begins. No two agents simultaneously own the same files. One agent can complete several tasks sequentially, but records separate outcomes. Use isolated branches/worktrees and separate SQLite files for parallel work; do not share a development database.

`ready` means the task specification is written. Begin implementation only after its dependencies are complete and ownership is assigned. `review` means the implementation and its recorded checks are ready for review; it does not mean a release is deployed.

The integrator owns package manifests/lockfile, global config/styles/UI primitives, database schema/migrations, auth boundaries, shared time logic, contracts, and route integration. Feature agents request shared changes with an exact proposed contract and affected callers. Generated route output is regenerated after integration, never edited manually.

Roles are provider-independent: integrator, assigned feature implementer, and reviewer. The same agent may implement sequential tasks; meaningful security/timing changes still require review before integration. Do not spawn or message external agents unless the user or existing applicable instructions authorize it.

## Standard task format

```markdown
# TNN — Title

- Status: ready | in_progress | blocked | review | done
- Owner: unassigned or agent identifier
- Branch: codex/tnn-description or initial workspace
- Plan revision: 1.0 / Git SHA when available
- Contract revision: 1.0
- Dependencies: task IDs
- Allowed files: explicit directories/files

## Requirements

- Observable behavior, including failure/privacy cases.

## Acceptance criteria

- Verifiable completion conditions.

## Verification

- Command or manual scenario; actual result once run.

## Handoff

- Changed: concise behavior and relevant files.
- Checks: exact commands/results; distinguish automated/manual.
- Not checked: explicit omissions and reasons.
- Risks/blockers: factual limits or none known.
- Integration: migrations, config, contract effects, follow-up task IDs.
```

Do not mark done on a proposal or merely passing type checks. Use blocked only for a concrete missing dependency/input, not ordinary implementation difficulty. Document partial work as in_progress with a handoff; do not call it complete.

## Integration

1. Confirm dependencies and contract revision, inspect the connected implementation, and review acceptance/privacy requirements.
2. Run relevant checks; shared changes run the complete suite. Reconcile failures before merge.
3. Review source and handoff, including untested behavior and dependency/security implications. Update documentation when actual interfaces change.
4. Integrate with `git merge --no-ff`; no fast-forward or squash integration. Resolve shared/generated files centrally and rerun affected checks.
5. Record the verified result. Keep deployment separate from source completion. Do not push/deploy without authorization.

Required command names once scaffolded: `pnpm dev`, `pnpm build`, `pnpm start`, `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test`, `pnpm test:e2e`, `pnpm check`, `pnpm db:generate`, `pnpm db:migrate`, and `pnpm db:backup`.

CI checks formatting, lint, types, domain/integration tests, key browser journeys, migrations on disposable SQLite, and production build. No real OAuth secrets or production data in CI; use isolated auth fixtures without shipping a production login bypass. Real Google sign-in is an operator-configured manual acceptance check.

## Change decisions

When a user steers scope, update PLAN.md and the affected contracts/task before continuing dependent work. Record the decision, source (user or engineering default), date, and affected task IDs. Do not turn suggestions into allegedly approved requirements. Keep summaries factual, concise, and explicit about what was not checked.
