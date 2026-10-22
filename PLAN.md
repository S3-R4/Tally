# Tally product and development plan

Revision: 1.0. Recorded: 2026-10-22 (Europe/Berlin).

## Status and authority

The user authorized recording the research and decisions, followed by implementation. The earlier chat proposal was premature: it is not evidence that every suggested detail was explicitly approved. The choices below marked **agreed** were selected by the user. The remaining details are **engineering defaults** chosen to make implementation coherent and are open to user steering. No feature is complete merely because it appears here.

## Agreed decisions

| Topic             | Decision                                                                                                                                                                         |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Product           | Tally is a productive time tracker influenced by Kairu, with improvements.                                                                                                       |
| Stack             | TypeScript, TanStack Start, Tailwind CSS, shadcn/ui, Better Auth with Google login only, Drizzle, and SQLite stored in a file; no external database container.                   |
| Audience          | An approved private group.                                                                                                                                                       |
| Release breadth   | Planning, tracking, review, analytics, friends, leaderboards, and challenges belong in the first release.                                                                        |
| Main improvement  | Reliable, controllable time records: recovery, corrections, time-zone accuracy, privacy, and export.                                                                             |
| Hosting           | One Linux server.                                                                                                                                                                |
| Membership        | An administrator manages an email allowlist.                                                                                                                                     |
| Competitive time  | Only timer-origin records whose timing has never been edited count in rankings and shared challenges. Manual/time-corrected records still count in personal analytics and goals. |
| Long sessions     | All unaltered tracked time counts competitively; no three-hour cutoff.                                                                                                           |
| Sharing           | Basic member discovery; statistics are opt-in. Leaderboards and shared challenge results require explicit participation.                                                         |
| Calendar          | Personal reports use the saved member time zone; group rankings/challenges use the instance zone, initially Europe/Berlin.                                                       |
| Timer transitions | Explicitly confirm the start of each focus or break phase.                                                                                                                       |
| Connectivity      | Continue displaying an existing timer offline and reconcile on reconnect; saved changes require connectivity.                                                                    |
| Existing data     | Start fresh, provide manual entries and CSV/JSON export, and document whole-instance backup/restore. No import.                                                                  |
| Notes             | Markdown.                                                                                                                                                                        |
| Design            | Familiar workflow with original Tally design and responsive light/dark themes.                                                                                                   |
| Agents            | One AGENTS.md entrypoint for all providers; no provider-specific instruction files.                                                                                              |
| Git               | Integrate branches with `git merge --no-ff`.                                                                                                                                     |

## First release

| Area             | Required behavior                                                                                                                                                                                                       |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Access           | Google sign-in, allowlist enforcement on login and subsequent requests, sign-out, clear denied/error states.                                                                                                            |
| Planning         | Private tasks with title, Markdown description, optional estimate and tag; status/tag filters; ordered Todo/In Progress/Done Kanban; link a task to focus work.                                                         |
| Focus            | Countdown and stopwatch, focus/break phases, pause/resume/stop, configurable focus/break durations and cycle length, optional completion sound, task/tag selection, Markdown notes, persistent indicator across routes. |
| Review           | Daily history and date navigation, text/tag/type filters, manual entries, editing, timing corrections with history, recoverable deletion/restore.                                                                       |
| Analytics        | Daily timeline, weekly comparisons, monthly calendar, yearly/monthly breakdown, tag/task totals, lifetime totals, session counts/averages, best periods, task estimate versus recorded time.                            |
| Goals            | Configurable personal daily/weekly focus goals, current/best streaks, progress against goals.                                                                                                                           |
| Profiles/friends | Chosen display name, Google avatar or initials, optional country/focus/bio, member search, requests, accept/reject/cancel/remove, kudos. No sharing of email addresses.                                                 |
| Rankings         | Focus time for day/week/month/year/all time, current/best streaks, historical periods, group/friend/country filters, own rank and period statistics.                                                                    |
| Challenges       | Monthly consistency challenge, personal custom challenge with optional community results, progress/history, completion badges, opt-in wall of fame.                                                                     |
| Data/settings    | Theme, saved IANA time zone, profile and sharing controls, CSV sessions, versioned JSON owned-data export, focus reset, account deletion.                                                                               |

## Engineering defaults and behavioral rules

- One private community per deployment; no organizations, billing, paid tiers, quotas, or public member pages. Every approved member has the same feature access. Membership is deployment configuration, not an invitation/approval interface.
- Default countdown: four rounds of 25 minutes focus plus 5 minutes break. Durations and round count are configurable. Each phase requires an explicit start. Completion stops at the stored deadline; it never creates unattended subsequent focus phases.
- One running or paused session per member, across tabs/devices. Pauses are explicit intervals and contribute no focus time. Stopwatch time continues until stopped, including while offline or the server is restarting. A running timer is not proof of productive work.
- Saved mutations require connectivity. An offline timer display is provisional; controls explain why saving is unavailable. On reconnect, server state wins. A lost response is resolved using idempotency and re-fetching, not by creating duplicate records.
- Reports use finalized focus sessions; an active session is displayed separately until stopped or its countdown expires. Breaks are preserved in history but excluded from focus totals, goals, streaks, rankings, and challenges.
- Manual entries contain one or more past, positive, non-overlapping intervals. Corrections edit effective intervals without destroying original timing. Paused gaps remain gaps. Timing edits permanently remove competitive eligibility even if later changed back. Metadata edits do not.
- Reject overlaps with the member's other non-deleted effective intervals, including an active interval. Use half-open ranges so adjacent intervals are valid. Deleted records do not count. Restore rejects a newly conflicting interval.
- Store integer UTC epoch milliseconds; split effective intervals at boundaries in the requested IANA time zone. Weeks begin Monday. Re-bucket personal history when a member changes their saved zone; group calculations remain in the fixed instance zone.
- Personal streak threshold: five accumulated focus minutes per local day, including manual/corrected records. Ranked streaks use eligible focus in the group zone. A streak remains current when today or yesterday qualifies.
- Sessions spanning a report range count once when they contribute positive focus in that range. Daily counts are distinct sessions touching that day; range totals deduplicate sessions.
- Personal goals default to unset. They use all valid recorded focus. A task's status never changes merely because its timer ends. One optional task and one optional tag per session avoid ambiguous attribution; a task tag is copied initially and can be overridden.
- Monthly challenges use 25 eligible minutes per group-calendar day. A member may join during the month, with eligible work across that month counted. Completing every day earns the month's badge. Custom challenges use a specified positive day count, daily minute target, and today/tomorrow start; qualification uses the same eligible-time rules. One active custom challenge per member.
- Custom challenges are personal definitions with optional community result sharing, not separate social rooms. Joining a challenge and sharing results are explicit. Leaderboard opt-in is independent. Opt-out removes historical visibility too. Corrections/deletions re-evaluate results and badges; historical rankings describe currently valid records, not immutable snapshots.
- Basic profiles expose only chosen fields to approved members. Session titles, notes, tasks, tags, email, and exports remain private even between friends. Shared statistics are aggregates, not activity logs.
- Rank ties share the same rank, with deterministic name/id ordering for display. Kudos are retractable, at most one per sender/recipient/group day, never to oneself. Friend requests are unique per unordered member pair; crossed requests accept one friendship atomically.
- Notes use CommonMark with safe links, no raw HTML or embedded images. Task/tag archival retains historical links. Session deletion is recoverable; focus reset and account deletion require explicit confirmation and explain their permanent scope.
- Focus reset removes sessions, personal challenge participation/history, and derived achievements, while preserving tasks, tags, profile, goals, preferences, and friendships. Account deletion removes all owned personal records and social associations; deployment allowlisting is separate.

## Delivery sequence and acceptance

| Task                   | Dependency | Acceptance                                                                                                                                     |
| ---------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| T00 Documentation      | None       | Research, decisions/defaults, contracts, design, agent workflow, and task specifications are saved and internally consistent.                  |
| T01 Foundation         | T00        | Requested stack boots, Google-only auth/allowlist boundaries work, migrated SQLite persists data, common UI/contracts and checks exist.        |
| T02 Time records       | T01        | Timers and recovery, review/manual entries/corrections/deletion, shared eligibility and time-splitting logic pass focused tests.               |
| T03 Planning           | T01        | Tasks/tags/list/Kanban and session task selection work; keyboard/touch alternatives exist. May proceed alongside T02 after contracts freeze.   |
| T04 Personal reporting | T02,T03    | Analytics/goals/streaks, settings/export/reset/delete use the same effective records and pass data-isolation checks.                           |
| T05 Social             | T02,T04    | Private profiles/friends/opt-in rankings/kudos and historical periods use shared eligibility/privacy rules.                                    |
| T06 Challenges         | T02,T05    | Monthly/custom progress, optional community results, history/badges/wall of fame match contracts.                                              |
| T07 Integration        | T01–T06    | Cross-feature journeys, accessibility, production build/start, migrations and restore rehearsal pass; untested deployment inputs are recorded. |

## Exclusions and unverified items

No billing, public signup, imports, full offline writes/sync, native application, push notifications, custom avatar uploads, AI features, calendar integrations, website blocking, or externally hosted database. Browser sound delivery while suspended cannot be guaranteed. No existing Kairu data is copied.

Kairu's timer recovery, cross-device consistency, editing semantics, exports/imports, paid behavior, and backend implementation were not tested. Live Tally Google OAuth requires operator-provided credentials and callback configuration. Actual domain, server provisioning, and off-server backup destination are deployment inputs, not reasons to invent services or credentials.
