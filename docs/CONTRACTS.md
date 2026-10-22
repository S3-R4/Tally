# Shared contracts

Revision: 1.0. Product behavior is defined by PLAN.md. One integrator changes this file and shared exports; dependent agents must cite this revision in handoffs.

## Boundaries and naming

- Browser routes call typed TanStack Start server functions. Better Auth alone owns `/api/auth/*`. Do not introduce a second REST API for the same domain operations.
- Authenticated functions obtain the member identity from the server session, verify the current email allowlist, and check ownership/visibility. Never accept an authoritative userId, elapsed duration, or ranking eligibility from the browser.
- Time fields use `*AtMs` and duration fields use `*DurationMs`; wire values are finite safe integers. Stored SQL names are snake_case. Dates for queries use YYYY-MM-DD and a validated IANA zone; do not parse an unzoned date as a UTC instant.
- Public feature types derive from validation/schema definitions. Success returns typed data; failures use `INVALID_INPUT`, `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, or `CONFLICT` plus a safe message. Validation errors may identify fields, never SQL/secrets.
- Mutations are POST operations. Timer commands carry requestId and expectedRevision where updating an existing session. A retry must not repeat a committed transition. A stale revision returns conflict and current state; no silent overwrite.

## Model

| Domain          | Records and invariants                                                                                                                                                                                                                                                                                         |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authentication  | Better Auth user/session/account/verification schema. Google is the sole sign-in provider. The deployment allowlist is checked again on protected requests.                                                                                                                                                    |
| Member          | Chosen display name, optional country/focus/bio, Google avatar or initials, saved time zone, theme, sound preference, countdown settings, optional daily/weekly goals, leaderboard opt-in (false initially). Email is not a profile field returned to another member.                                          |
| Tag             | Owner, name, color, archive timestamp. Archived tags remain usable in historical display, not new selections.                                                                                                                                                                                                  |
| Task            | Owner, title, Markdown description, optional estimate/tag, todo/in_progress/done state, integer order, archive timestamp. Moving a task changes state/order atomically.                                                                                                                                        |
| Session         | Owner, source timer/manual, kind focus/break, mode countdown/stopwatch/manual, running/paused/completed state, planned duration/deadline, cycle position/settings snapshot, optional task/tag/title/Markdown note, revision, timingEdited flag, deletion timestamp. At most one non-completed timer per owner. |
| Interval        | Session, UTC start/end, original timing retained when corrected. Effective intervals are positive and non-overlapping. An open interval belongs only to a running timer.                                                                                                                                       |
| Timing revision | Session, prior interval snapshot, changed timestamp. Captures corrections; timingEdited never resets.                                                                                                                                                                                                          |
| Idempotency     | Member/request identifier and committed timer result. Enforce uniqueness transactionally.                                                                                                                                                                                                                      |
| Friendship      | Canonical unordered member pair, requester, pending/accepted status. Reject self pairs. Crossed requests accept the existing pair.                                                                                                                                                                             |
| Kudos           | Sender, recipient, group-calendar date; unique tuple, no self kudos, retractable.                                                                                                                                                                                                                              |
| Challenge       | Monthly or personal custom definition, group zone, calendar bounds, daily target; custom owner and one-active constraint. Monthly definitions are unique per month.                                                                                                                                            |
| Participation   | Challenge/member, explicit enrollment, shareResults flag (false initially), cancellation. Progress and completion are calculated from eligible records; visibility requires sharing.                                                                                                                           |

Keep the instance zone fixed after initial database setup. Use owner/time indexes and foreign keys; member deletion cascades owned personal/social records. Unrelated members' records must survive reset/deletion.

## Timer state transitions

| Command/event      | Behavior                                                                                                                                                                                 |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Start              | Validate task/tag ownership/settings; reconcile a due countdown; reject another active session; create first interval with server time and return snapshot.                              |
| Pause              | Close the open interval at server time (or countdown deadline if earlier); pause unless already due/completed.                                                                           |
| Resume             | Open an interval at server time; move countdown deadline by the paused duration; reject completed state.                                                                                 |
| Stop               | Close the open interval or use closed paused intervals; complete the session; retain partial positive focus.                                                                             |
| Countdown deadline | Complete exactly at the persisted deadline. Reconcile on subsequent server access/commands and after restart; correctness must not depend on a browser callback or an in-memory timeout. |
| Next phase         | Present the next configured phase and wait for start. Never create subsequent focus records automatically.                                                                               |
| Offline/reconnect  | Display the last-confirmed snapshot using a monotonic client clock. Disable saved actions while disconnected. Re-fetch on reconnect/focus; server snapshot wins.                         |

The client refreshes current timer state every 15 seconds while visible, and after mutations/focus/reconnect. Same-tab mutations update shared query state; BroadcastChannel may trigger re-fetch in sibling tabs but is not authoritative. Separate devices reconcile through the server. Display server acknowledgement failures without losing unsaved note drafts.

## Single reporting implementation

Shared functions must expose effective finalized intervals, interval splitting by zone/range, totals, streaks, and competitive eligibility. Analytics/rankings/challenges must not implement their own alternatives.

- Countdown intervals clip to their deadline; paused intervals exclude the pause; future and deleted time never counts.
- Eligible competitive sessions: finalized timer-origin focus, never timing-edited, not deleted. Long duration does not invalidate them.
- Personal reporting includes finalized focus from manual and corrected records. Running totals are shown separately.
- Split at local midnight, including 23/25-hour days; range endpoints are exclusive. Count distinct contributing sessions once per range.
- Personal five-minute streaks use saved member zone and all valid focus; ranked streaks use instance zone and competitive focus. Today can still be pending without breaking yesterday's streak.
- Leaderboards read current valid historical data; ties share rank. Only opted-in, currently allowed members appear. Filtered statistics cannot expose excluded members.
- Monthly/custom challenge qualification uses the same competitive intervals. Wall of fame and community results require explicit sharing. Recalculate after edits/deletion, including badges.

## Operations and UI contracts

| Feature            | Required operation families                                                                                                |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| Membership/profile | current member; update own profile/preferences; searchable safe member summaries; safe profile view                        |
| Planning           | list/create/update/archive tags and tasks; move/reorder tasks; estimate/actual summary                                     |
| Time               | current/start/pause/resume/stop; list sessions; manual entry; metadata update; timing correction/revisions; delete/restore |
| Reporting          | range totals, daily slices/timeline, tag/task split, month calendar, year breakdown, lifetime/best periods, goals/streaks  |
| Social             | request/cancel/accept/reject/remove friendship; pending/accepted lists; rankings/statistics; give/retract kudos            |
| Challenges         | list definitions/history; enroll/cancel; create custom; own progress; sharing preference; community results/badges         |
| Data               | own CSV sessions/versioned JSON; confirmed focus reset; confirmed account deletion                                         |

Query filters/date ranges belong in validated router search parameters where linkable. Lists use bounded pagination. A forbidden private record is indistinguishable from a missing record to other members. Mutations invalidate all affected queries. Save failed/empty/loading states are visible and accessible.

CSV must escape quotes/newlines and neutralize spreadsheet formulas. JSON has schemaVersion and exportedAtMs and excludes auth tokens and others' private fields. Whole-instance backups use SQLite's online backup API; never copy just a live WAL-mode main file. Restore stops the service and checks integrity before replacement/restart.
