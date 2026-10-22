# Human approval ledger

Read this at every new conversation, feature request and resume, alongside fetched branches and available PR/review state. Follow the [human approval workflow](WORKFLOW.md#human-approval-for-major-changes). Task completion and automated checks do not mean human approval. Keep pending entries until explicit approval and observed integration; preserve approval evidence afterward.

## A01 — First release

- Status: changes requested; current frontend rejected, replacement design system required.
- Branch: `codex/complete-first-release`; target: `main`.
- Scope: first-release application implemented in `9695f32`, plus subsequent coordination documentation. Last inspected branch tip before T09: `8d27897`; target `484107b`. Derive the current tip with Git; this ledger's own documentation commit is not an approved application revision.
- Human decision (2026-10-22, direct user instruction): “I will not approve the first frontend”; the user selected Claude Design for frontend design. Replacement proposal must be reviewed before frontend implementation and release approval. No backend rejection was stated.
- Human approval: none recorded. No human testing or merge approval is inferred from previous requests to implement, preview, or push.
- Automated evidence: historical application checks and browser journeys in [T07](tasks/T07.md); documentation publication checks in [T08](tasks/T08.md). These do not establish human acceptance.
- Human testing requested: timer start/pause/resume/stop and recovery; task/list/Kanban flows; manual entries, corrections and restore; reports/goals; profiles, friends, privacy, rankings and challenges; export/settings/data controls on a disposable database; desktop/mobile usability. Real Google login requires operator credentials/configuration and remains unverified.
- Approval needed: a human must explicitly approve merging a named reviewed revision/scope into `main`, with statement or review URL saved here. Record requested fixes and retest outcomes before approval. Subsequent substantive changes reopen review.
- Inspection limit: local/remote Git refs and repository records were inspected; hosted PR reviews and branch-protection settings were not verified. No merge or deployment has occurred.

## Entry fields for future changes

Use a stable ID, status (`pending`, `changes requested`, `approved`, `merged`), branch and target, major-change scope/classification, reviewed commit, dependencies, checks and human test checklist, approval identity/date/statement or URL, and observed merge commit when applicable. Reconcile entries against current Git/PR state rather than assuming this file is sufficient evidence by itself.
