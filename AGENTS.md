# Tally — instructions for every agent

This is the only agent instruction entrypoint, regardless of provider. Read it before changing anything. Read [docs/STATE.md](docs/STATE.md), `PLAN.md`, `docs/CONTRACTS.md`, `docs/DESIGN.md`, `docs/WORKFLOW.md`, and the assigned task next. `docs/RESEARCH.md` is evidence, not an implementation specification.

## Durable project memory

- Chat history, model memory, context summaries, and a previous agent's final reply are not durable project records. Every actionable rule, decision, constraint, requirement, assumption, rejected approach that matters, and unresolved question must be written in the appropriate repository document. Never leave necessary information only in chat.
- Save user decisions before doing work that depends on them. Keep standing instructions here, product decisions in `PLAN.md`, interfaces/invariants in `docs/CONTRACTS.md`, design in `docs/DESIGN.md`, process in `docs/WORKFLOW.md`, operational procedures in `docs/OPERATIONS.md`, and ownership/results in the task files. Link to the authoritative record instead of maintaining conflicting copies.
- Keep [docs/STATE.md](docs/STATE.md) as a concise, current resume checkpoint: objective, owner, branch/worktree/commit, existing work, local changes, verified checks, limits, blockers, pending decisions, temporary runtime resources, and exact next steps. Record facts separately from assumptions and user decisions.
- Update the checkpoint and task handoff after meaningful decisions, milestones, failures, or changes of direction, before long-running work, and before ending a turn or handing off. Save incrementally; automatic compaction or interruption can happen before a final summary.
- After compaction, interruption, or a new chat, reread the saved checkpoint and relevant canonical documents, verify them against Git and current files, and resume only the remaining work. Do not restart completed work or rely on remembered conversation details. Correct stale records when evidence changes.
- Record whether work is local, committed, pushed, merged, or deployed, with refs/commit IDs when known. Another checkout cannot receive local-only edits. Do not claim other agents have been notified or have read new instructions without evidence; record distribution as pending until verified. Follow existing authorization rules for publishing and messaging.
- Never persist secrets, tokens, cookies, credential values, private exports, or unnecessary personal data in documentation. Record environment variable names, safe file locations, and recreation instructions instead. Ignored files and temporary process handles are not portable handoffs.

## Communication

- Be factual and direct. Do not flatter the user, praise prompts, or add promotional language. State disagreement and uncertainty plainly; say when something cannot be established with reasonable precision.
- Use evidence for factual/technical claims; distinguish creative proposals and opinions. Attribute opinions to named sources rather than vague groups.
- Keep change summaries concise and functional. Avoid meta-chat such as “Certainly,” “Let me know,” or “Here is a draft,” and do not acknowledge instruction blocks in replies.
- Ask questions only when they serve the task; do not add questions merely to prolong the conversation.
- Read `/home/s3r4/.codex/RTK.md` when available for this host's command-output rules. Condensed command output is intentional; bypass it only when the result is unusable.

## Authority and scope

- Direct user instructions take precedence. Preserve the agreed product decisions in `PLAN.md`; distinguish them from engineering defaults and unverified research.
- Work only on the assigned task and its dependencies. Read the connected callers, validation, schema, tests, fixtures, configuration, and exports before editing.
- One integrator owns shared contracts, dependencies, migrations, and integration. Propose contract changes before implementing incompatible behavior. Update contracts and callers together.
- Do not copy Kairu source, assets, branding, or private account data. Implement the documented behavior with an original design.
- Do not log secrets, OAuth tokens, session notes, or personal exports. Never commit credentials, production databases, or backups.

## Implementation rules

- Required stack: TypeScript, React/TanStack Start, Tailwind CSS, shadcn/ui, Better Auth (Google only), Drizzle, and a local SQLite file. No external database container or hosted database.
- Prefer existing code, platform features, and the smallest complete solution. No speculative abstractions or unused dependencies. Keep domain rules on the server, shared between all consumers.
- TypeScript is strict. Validate unknown input at server boundaries; infer shared types from schemas rather than duplicating them. Avoid `any`, blanket lint suppression, and unsafe casts.
- Use kebab-case filenames, PascalCase React components, camelCase TypeScript fields, and snake_case database columns. Follow the formatter and surrounding code.
- Use integer UTC epoch milliseconds and explicitly named duration units. Never trust client-supplied ownership, elapsed time, or competitive eligibility.
- Authenticate and check allowlist membership on every protected server operation. Check row ownership even if the route already checks authentication.
- All timer changes are acknowledged only after persistence. Preserve validation and error handling when moving code. Timing corrections retain original records and permanently remove competitive eligibility.
- Use semantic, keyboard-accessible controls; drag-and-drop must have a non-drag alternative. Do not use color alone to convey state.
- Disable JavaScript-dependent actions until hydration attaches their handlers; use the framework's existing hydration hook.
- Comments explain a non-obvious reason, not the code. Document a deliberate limit as `shortcut: <limit>, <when to upgrade>`.

## Verification and reporting

- Non-trivial logic requires a focused behavior test. Do not add tests that merely duplicate implementation, and do not skip timing, authorization, or data-loss checks.
- Run the task's checks and relevant existing checks. Shared changes require the full check suite. Fix failures caused by the change.
- State exactly which checks ran and their outcomes. Never claim a manual flow, OAuth callback, deployment, or load test passed without observing it.
- Use the task/handoff format in `docs/WORKFLOW.md`. Record open issues and assumptions rather than hiding them. Report concise factual outcomes; no praise, promotional language, or invented certainty.
- Instructions alone do not enforce compliance. Integration review and automated checks are mandatory before a task is marked done.

## Git and parallel work

- At every new conversation, new feature request, and task resume, check [pending human approvals](docs/APPROVALS.md) and current branch/PR state. Remind the user of pending branches, what to test, and the approval needed. This blocks merging the affected changes, not further development; continue authorized work on isolated branches. Follow the [human approval workflow](docs/WORKFLOW.md#human-approval-for-major-changes).
- Major changes must be pushed to a test/pending task branch and may only be merged after explicit human approval for the reviewed scope/revision and target. Automated tests or agent reviews never substitute for human approval.
- Before starting or resuming any task, fetch all configured remotes and inspect local branches, remote branches, registered worktrees, and the task ledger. Follow the mandatory preflight in [docs/WORKFLOW.md](docs/WORKFLOW.md#check-existing-work-before-implementation).
- Search other branches' commits, diffs, and source for the requested behavior before writing it. Absence from the current branch or `main` does not mean the feature is missing. Reuse, finish, or review existing work; do not independently rebuild it.
- Check task ownership and uncommitted work in registered worktrees before claiming overlapping files. Record inspected refs/commit IDs, existing implementation, and the remaining work in the task handoff. Repeat the check before integration or when another agent's work may have advanced.
- If fetching or inspecting another checkout fails, record the limitation and continue only with work known not to overlap. Never treat stale refs or unpublished work as proof that no implementation exists.
- Use isolated task branches/worktrees for parallel work, with separate development databases. Do not overwrite another agent's changes.
- Branch names: `codex/<task-id>-<description>`. Before repository history is initialized, the integrator may prepare the initial workspace without inventing a baseline commit.
- Always use merge commits for branch integration: `git merge --no-ff`. Do not squash or fast-forward integrations.
- Only the integrator resolves shared-file conflicts and regenerates combined migrations. Never hand-edit generated route trees or generated migration metadata.
- Standing user authorization (2026-10-22): every completed change that passes its required tests/checks must be committed and pushed to its task branch before handoff. This includes documentation and instruction changes. Do not leave passing work local-only or ask again for routine commit/push approval. Follow the [tested-change publication workflow](docs/WORKFLOW.md#commit-and-push-tested-changes).
- Review the diff and stage only the verified task scope. Never include another agent's unrelated work, credentials, databases, backups, or generated temporary reports. Recheck any edits made after testing before committing them.
- If checks fail, fix the change before publishing. If commit/push is blocked or fails, preserve the work and record the exact blocker, local commit state, and pending push in the checkpoint; never report a failed push as successful. Do not force-push or rewrite shared history to bypass a rejection.
- Standing commit/push authorization does not authorize branch integration, deployment, destructive operations, or contacting other people/external agents. Those actions still require applicable user authorization.
