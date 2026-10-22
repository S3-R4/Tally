# Tally — instructions for every agent

This is the only agent instruction entrypoint, regardless of provider. Read it before changing anything. Read `PLAN.md`, `docs/CONTRACTS.md`, `docs/DESIGN.md`, `docs/WORKFLOW.md`, and the assigned task next. `docs/RESEARCH.md` is evidence, not an implementation specification.

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

- Use isolated task branches/worktrees for parallel work, with separate development databases. Do not overwrite another agent's changes.
- Branch names: `codex/<task-id>-<description>`. Before repository history is initialized, the integrator may prepare the initial workspace without inventing a baseline commit.
- Always use merge commits for branch integration: `git merge --no-ff`. Do not squash or fast-forward integrations.
- Only the integrator resolves shared-file conflicts and regenerates combined migrations. Never hand-edit generated route trees or generated migration metadata.
- Do not push, deploy, or perform destructive operations unless the user has authorized that action. Do not contact other people or external agents on the user's behalf without authorization.
