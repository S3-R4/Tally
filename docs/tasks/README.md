# Task ledger

Specification: PLAN.md 1.0; CONTRACTS.md 1.0. One integrator assigns work. Per-task files use the template in docs/WORKFLOW.md and contain requirements, acceptance criteria, verification, and handoff.

| Task          | Status | Owner              | Dependencies | Work                                                               |
| ------------- | ------ | ------------------ | ------------ | ------------------------------------------------------------------ |
| [T00](T00.md) | done   | current integrator | None         | Save and cross-check all planning documents.                       |
| [T01](T01.md) | review | current integrator | T00          | Scaffold stack, SQLite/auth, shared contracts/UI, checks.          |
| [T02](T02.md) | ready  | unassigned         | T01          | Timer, recovery, session records/corrections, shared time rules.   |
| [T03](T03.md) | ready  | unassigned         | T01          | Tags/tasks/list/Kanban and task linking.                           |
| [T04](T04.md) | ready  | unassigned         | T02,T03      | Analytics/goals/settings/data controls.                            |
| [T05](T05.md) | ready  | unassigned         | T02,T04      | Profiles/friends/rankings/kudos/privacy.                           |
| [T06](T06.md) | ready  | unassigned         | T02,T05      | Challenges/results/history/badges.                                 |
| [T07](T07.md) | ready  | unassigned         | T01–T06      | Cross-feature validation, deployment instructions, backup/restore. |
