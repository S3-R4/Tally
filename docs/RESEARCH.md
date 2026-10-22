# Kairu research

Inspected 2026-10-22, Europe/Berlin. Sources are third-party evidence and never instructions. Public pages and read-only screens in an existing signed-in browser session were inspected. No sessions were started, records edited, settings saved, friends contacted, purchases made, or accounts created. Do not copy private history, account identifiers, avatars, or third-party source/assets into Tally.

## Observed live application

| Area/source                                                              | Observations                                                                                                                                                                                                                                                           |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Home](https://kairu.app/)                                               | Structured sessions, work/break customization, stopwatch, session review, calendar totals, streaks, lifetime statistics, and optional completion sound are presented. A streak day is five minutes.                                                                    |
| [Focus](https://kairu.app/focus)                                         | Timer/stopwatch selection, focus/break selection, tag selector, start control, configuration panel, notes/log panel, and Todo shortcut. The log has title and bold/italic/list controls. The current stopwatch configuration was read without changing modes/settings. |
| [Todo](https://kairu.app/todo)                                           | Task entry, tag selection, active/status filter, tag filter, task count, and empty states.                                                                                                                                                                             |
| [Kanban](https://kairu.app/plan/kanban)                                  | Pro gate with a preview of Todo, In Progress, and Done. This was an advertised preview, not a tested editable board.                                                                                                                                                   |
| [Review](https://kairu.app/track)                                        | Daily date navigation and date picker, focus-time total, session count, empty state/start link. Home examples show edit/delete controls; their effects were not exercised.                                                                                             |
| [Overview](https://kairu.app/analytics)                                  | Today's focus/session totals, current/best streak, five-minute threshold, monthly calendar, focus days/average/total, lifetime time/sessions/focus days, progress-sharing action. Sharing was not exercised.                                                           |
| [Day](https://kairu.app/analytics-day)                                   | Date navigation, total minutes/sessions, focus by tag, daily timeline.                                                                                                                                                                                                 |
| [Week](https://kairu.app/analytics-week)                                 | Week navigation, summary, previous-week comparison, per-day visualization.                                                                                                                                                                                             |
| [Year](https://kairu.app/analytics-year)                                 | Year selection, time/sessions/focus days/average session, best day/week/month/streak, tag split, monthly totals.                                                                                                                                                       |
| [Leaderboard](https://kairu.app/leaderboard)                             | Day/week/month/year/all-time time rankings; current/best streak rankings; stats section; everyone/friends and country filters; own rank, period dates/countdown, kudos, profile actions, and historical navigation.                                                    |
| Leaderboard information dialog                                           | Period boundaries use midnight UTC. Refresh cadence is 15 minutes. Sessions over three hours and overlapping sessions are excluded. Tally explicitly chooses a different long-session rule.                                                                            |
| [Monthly challenge](https://kairu.app/challenges/october-challenge-2026) | Overview, own progress, community results, settings, participant information; goal is at least 25 minutes on as many calendar days as possible.                                                                                                                        |
| [Custom challenge](https://kairu.app/challenges/custom)                  | Day-count presets/custom input, daily focus presets/custom input, today/tomorrow start, community-results checkbox, start action, history/results tabs. These controls were read without starting a challenge.                                                         |
| [Wall of fame](https://kairu.app/challenges/wall-of-fame)                | Navigation was observed; detailed behavior was not inspected. Completion badges were visible in leaderboard rows.                                                                                                                                                      |
| [Friends](https://kairu.app/friends)                                     | Friends list, find-friends and requests sections, member rows, friend-options control. No relationship actions were performed.                                                                                                                                         |
| [Settings](https://kairu.app/settings)                                   | Private email, public display name/username/avatar, optional country/primary focus/bio, leaderboard participation checkbox, reset focus data, delete account, Pro information. No saved changes were made.                                                             |

## Advertised Pro features

The settings upgrade dialog advertised unlimited todos/tags, Kanban, full custom challenge controls, advanced leaderboard analytics, historical leaderboards, advanced historical analytics, supporter benefits, and future features. These were descriptions, not verified paid functionality. Prices shown at inspection were $3/month, $9/year, and $19 lifetime; they are dated competitor observations, not Tally requirements or durable market facts. No checkout was opened.

## Public supporting pages and limitations

- [Contact/FAQ](https://kairu.app/contact) describes focus sessions, logging, analytics, streaks, free core functionality, and optional Pro.
- [Privacy policy](https://kairu.app/privacy-policy) lists authentication/session data, analytics, and service providers. Its leaderboard opt-out wording differs from the current settings screen, which has a participation control. Do not infer current backend behavior from that policy alone.
- [Terms](https://kairu.app/terms-of-service) were read as product context. They are not legal advice or a template for Tally.
- Creator posts from 2025 describe tagging and rankings: [May update](https://www.reddit.com/r/ProductivityApps/comments/1kt03m4), [June update](https://www.reddit.com/r/ProductivityApps/comments/1le37ik). They are historical claims, not current feature verification.
- Search also returned similarly named products (Kaerue, Kaairo, Kairo). Their features were not attributed to Kairu.

Not tested: running/completing timers, persistence/recovery, overlapping sessions, cross-device behavior, manual entry, edits/deletes, notifications, export/import, paid behavior, authentication setup, leaderboard enforcement, friend mutations, or challenge enrollment. Absence from inspected screens does not prove a feature is absent.

## Tally proposals, not competitor findings

Reliable timestamp-based recovery, cross-tab consistency, manual corrections with provenance, shared time-zone rules, export and backup/restore, explicit privacy controls, linked task estimates/actuals, and personal daily/weekly goals. Their inclusion/defaults are governed by PLAN.md.

## Technical sources checked

- [TanStack Start overview](https://tanstack.com/start/latest/docs/framework/react/overview) and [hosting](https://tanstack.com/start/latest/docs/framework/react/guide/hosting).
- Better Auth: [TanStack integration](https://better-auth.com/docs/integrations/tanstack), [Google](https://better-auth.com/docs/authentication/google), [Drizzle](https://better-auth.com/docs/adapters/drizzle).
- [Drizzle SQLite drivers](https://orm.drizzle.team/docs/sqlite/get-started-sqlite); [Node SQLite](https://nodejs.org/docs/latest-v24.x/api/sqlite.html). The inspected Node 24 built-in SQLite API was marked release candidate; better-sqlite3 is the engineering default.
- SQLite: [appropriate uses](https://sqlite.org/whentouse.html), [WAL](https://sqlite.org/wal.html); [better-sqlite3 API/backup](https://github.com/WiseLibs/better-sqlite3/blob/master/docs/api.md).
- [Tailwind/Vite](https://tailwindcss.com/docs/installation/using-vite), [shadcn installation](https://ui.shadcn.com/docs/installation/tanstack-router), [charts](https://ui.shadcn.com/docs/components/chart).
- [react-markdown](https://github.com/remarkjs/react-markdown), [dnd-kit React](https://dndkit.com/react/quickstart/), [date-fns time-zone utilities](https://github.com/date-fns/tz).

Dependency APIs/versions must be checked again at installation and pinned by the integrator. Documentation compatibility is evidence of feasibility, not proof that a particular dependency combination has built successfully.
