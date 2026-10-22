# Task ledger

Specification: PLAN.md 1.0; CONTRACTS.md 1.0. One integrator assigns work. Per-task files use the template in docs/WORKFLOW.md and contain requirements, acceptance criteria, verification, and handoff.

| Task          | Status | Owner              | Dependencies | Work                                                                             |
| ------------- | ------ | ------------------ | ------------ | -------------------------------------------------------------------------------- |
| [T00](T00.md) | done   | current integrator | None         | Save and cross-check all planning documents.                                     |
| [T01](T01.md) | done   | current integrator | T00          | Scaffold stack, SQLite/auth, shared contracts/UI, checks.                        |
| [T02](T02.md) | done   | current integrator | T01          | Timer, recovery, session records/corrections, shared time rules.                 |
| [T03](T03.md) | done   | current integrator | T01          | Tags/tasks/list/Kanban and task linking.                                         |
| [T04](T04.md) | done   | current integrator | T02,T03      | Analytics/goals/settings/data controls.                                          |
| [T05](T05.md) | done   | current integrator | T02,T04      | Profiles/friends/rankings/kudos/privacy.                                         |
| [T06](T06.md) | done   | current integrator | T02,T05      | Challenges/results/history/badges.                                               |
| [T07](T07.md) | done   | current integrator | T01–T06      | Cross-feature validation, deployment instructions, backup/restore.               |
| [T08](T08.md) | done   | current integrator | T07          | Durable project records, checkpoint/resume rules, and shared agent instructions. |
| [T09](T09.md) | done   | current integrator | T08          | Human approval gate, pending review ledger and startup reminders.                |
| [T10](T10.md) | done   | current integrator | T09          | Claude Design brief and recorded frontend rejection; no redesign implementation. |

The initial first-release source tasks are complete; the user subsequently rejected the frontend. T10 supplies a replacement-design brief; redesign implementation is not assigned or complete. Verification and limits are recorded per task. This does not mark live OAuth, CI execution, server deployment, or off-server backups as verified; see [T07](T07.md).

Read [docs/STATE.md](../STATE.md) for the current checkpoint before claiming or resuming work. Preserve actionable decisions and task state in repository files rather than relying on a chat or a particular agent's memory.

Source tasks marked done are not human merge approvals. The first release has changes requested for its frontend and remains unapproved in [the approval ledger](../APPROVALS.md).
