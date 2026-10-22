# Provider-independent workflow

All providers use AGENTS.md and the same documents. The Git revision of PLAN.md plus the CONTRACTS.md revision identifies a task's specification. Do not duplicate provider-specific rule sets.

## Persistent records and resume protocol

Repository documents must contain everything needed to continue without the originating chat. Record each actionable user clarification, rule, constraint, decision, and unresolved issue as it arises; do not wait for the end of a long task. Label user decisions, engineering defaults, assumptions, and observed results distinctly. Keep rejected approaches and their reasons when forgetting them would cause repeated work.

Use AGENTS.md's document ownership map. Update the authoritative document and link to it from the task handoff; do not copy entire conversations or maintain competing specifications. `docs/STATE.md` is a current checkpoint and index, not another instruction entrypoint or a replacement for task details.

At every meaningful checkpoint, before a long-running operation, and before yielding or handing off:

1. Save the current objective, task owner, branch/worktree and inspected commits, completed behavior, remaining work, and affected files.
2. Save the exact checks and results, including failures and verification limits. Historical passing checks must not be described as rerun checks after later changes.
3. Save blockers, open decisions, scope changes and reasons, and the concrete next action. Preserve necessary reproduction steps and links to relevant source, rather than relying on chat recollection.
4. Record safe runtime details for active previews/jobs: purpose, loopback URL or output location, command to recreate them, and cleanup needs. Never include credentials or cookie values. Verify availability when resuming; process handles, expiring fixture sessions, ignored files, and temporary databases may no longer exist.
5. Update commit/push/merge/deployment state. If shared instructions exist only locally, say so in the checkpoint. Other checkouts and running agents still need the updated files; writing them does not distribute or enforce them automatically.

On a new chat or after compaction/interruption, read AGENTS.md, docs/STATE.md, canonical specifications and the assigned task, then repeat the branch/worktree preflight below. Compare the saved checkpoint with current Git/files and available runtime resources. Reconcile stale facts and continue the recorded remaining work, not the entire original project. Unknown state must remain explicitly unknown until checked.

## Assignment and ownership

The human or integrator assigns one numbered task and its allowed files. The integrator records assignments before parallel work begins. No two agents simultaneously own the same files. One agent can complete several tasks sequentially, but records separate outcomes. Use isolated branches/worktrees and separate SQLite files for parallel work; do not share a development database.

`ready` means the task specification is written. Begin implementation only after its dependencies are complete and ownership is assigned. `review` means the implementation and its recorded checks are ready for review; it does not mean a release is deployed.

The integrator owns package manifests/lockfile, global config/styles/UI primitives, database schema/migrations, auth boundaries, shared time logic, contracts, and route integration. Feature agents request shared changes with an exact proposed contract and affected callers. Generated route output is regenerated after integration, never edited manually.

Roles are provider-independent: integrator, assigned feature implementer, and reviewer. The same agent may implement sequential tasks; meaningful security/timing changes still require review before integration. Do not spawn or message external agents unless the user or existing applicable instructions authorize it.

## Check existing work before implementation

Every agent/provider must perform this preflight before starting or resuming a task, before creating a task branch, and again before integration:

```sh
git fetch --all
git status --short --branch
git branch --all --verbose --verbose
git worktree list
git log --all --decorate --oneline -30
```

1. Read the task ledger and relevant handoffs, including their versions on branches containing newer work. Check ownership, claimed files, and dependencies before taking an assignment. A task marked ready in an older checkout may already be complete elsewhere.
2. Search all branches' history for the feature's paths and behavior. Inspect relevant commits, diffs, and source using `git log --all -- path/to/feature`, `git diff HEAD...branch-name -- path/to/feature`, and `git show branch-name:path/to/file`, substituting real paths and refs. A branch list or recent log alone is not enough to establish whether the feature exists.
3. Inspect the status and relevant files of registered worktrees for unfinished, uncommitted work. Do not switch branches, reset, clean, or otherwise disturb another agent's checkout to inspect it. Separate clones and unpublished branches may be undiscoverable; keep task claims and handoffs current.
4. When overlapping work exists, reuse it and implement only the missing behavior. Finish or review an existing implementation instead of recreating it. Report ownership conflicts to the integrator before changing claimed files; branch integration still requires the documented review and `git merge --no-ff`.
5. Record inspected refs and commit IDs, existing work, ownership conflicts, and the remaining implementation in the task's Integration handoff before coding; update it after the task. If fetching or inspection fails, record which information is stale or unavailable and continue only with work known not to overlap. Do not conclude that a feature is absent from `main` alone.

This preflight is required coordination. Standing user authorization below governs ordinary tested commits/pushes; the preflight itself does not authorize branch integration, deployment, destructive operations, or external-agent messaging. Instruction changes must reach other checkouts and be reread by running agents; editing one checkout does not notify them automatically.

## Commit and push tested changes

User instruction recorded 2026-10-22: every change that passes its tests must be committed and pushed. This is standing authorization for ordinary commits and pushes to the task branch, across agents/providers and future sessions; no additional confirmation is needed. It includes code, tests, configuration, documentation, instructions and checkpoint updates.

1. Complete the scoped change, review its diff, and run its required checks. Application changes require the affected tests and regressions; shared application changes require the full suite. Documentation-only changes require formatting, documentation/link/task-format checks and `git diff --check`. Do not invent irrelevant tests or describe older passing checks as a fresh run.
2. If files change after a successful check, rerun the checks affected by those edits. Stage explicit reviewed paths, inspect the staged diff, and exclude unrelated work and private/generated runtime data. A passing test does not authorize publishing credentials or another agent's changes.
3. Commit the verified change with a factual message and push it to the intended task branch/upstream. Set upstream tracking with `git push --set-upstream origin branch-name` when missing, substituting the actual branch. Do not change the target remote or branch silently.
4. Verify publication succeeded and the intended remote ref matches the local commit. Record observed commit/ref and check results in the task handoff/checkpoint. A checkpoint can reference the implementation commit and derive its own current publication state from Git, avoiding a self-referential commit-ID update loop.
5. A rejected push is not permission to force-push, reset another agent's work, or rewrite history. Refresh refs, inspect divergence and follow the integrator/merge rules for authorized integration. If credentials, network, permissions, or conflicts block publication, preserve the local work/commit and write down the blocker and next action; do not claim it is pushed.

This standing authorization does not authorize deployments, branch integration, destructive Git operations or external-agent messaging. Required merge commits remain `git merge --no-ff`. Passing work should not be handed off as local-only unless a concrete publication failure is recorded.

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
- Integration: inspected refs/commit IDs, existing work reused, remaining scope/ownership conflicts, migrations/config/contracts, follow-up task IDs.
```

Do not mark done on a proposal or merely passing type checks. Use blocked only for a concrete missing dependency/input, not ordinary implementation difficulty. Document partial work as in_progress with a handoff; do not call it complete.

## Integration

1. Repeat the branch/worktree preflight, confirm dependencies and contract revision, inspect the connected implementation, and review acceptance/privacy requirements.
2. Run relevant checks; shared changes run the complete suite. Reconcile failures before merge.
3. Review source and handoff, including untested behavior and dependency/security implications. Update documentation when actual interfaces change.
4. Integrate with `git merge --no-ff`; no fast-forward or squash integration. Resolve shared/generated files centrally and rerun affected checks.
5. Record the verified result. Commit and push passing task changes under the standing authorization above; verify the remote ref. Keep deployment separate from source completion and obtain authorization for actions not covered by that rule.

Required command names once scaffolded: `pnpm dev`, `pnpm build`, `pnpm start`, `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test`, `pnpm test:e2e`, `pnpm check`, `pnpm db:generate`, `pnpm db:migrate`, and `pnpm db:backup`.

CI checks formatting, lint, types, domain/integration tests, key browser journeys, migrations on disposable SQLite, and production build. No real OAuth secrets or production data in CI; use isolated auth fixtures without shipping a production login bypass. Real Google sign-in is an operator-configured manual acceptance check.

## Change decisions

When a user steers scope, update PLAN.md and the affected contracts/task before continuing dependent work. Record the decision, source (user or engineering default), date, and affected task IDs. Do not turn suggestions into allegedly approved requirements. Keep summaries factual, concise, and explicit about what was not checked.
