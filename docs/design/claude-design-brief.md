# Tally — Claude Design brief

Design an original frontend and design system for **Tally**, a web application for planning focused work, tracking time, understanding habits and sharing selected progress with a private group.

Create a coherent product design proposal and reviewable sketches/prototype using the product requirements below. This brief is self-contained; no prior design or repository access is needed.

## Your creative scope

Own the visual identity, typography, color system, spacing, density, layout, navigation model, components, data visualization and motion language. Choose how the features are grouped and progressively revealed. The capability names below describe jobs users need to do, not mandatory page names or a required navigation structure.

We are deliberately not prescribing a palette, aesthetic, font, sidebar, dashboard layout, card pattern, timer shape or reference screenshots. Develop a system appropriate to this product and explain the main choices briefly. Use shadcn/ui as an implementation foundation where useful; its default appearance is not the desired design direction.

Tally is influenced by the productivity workflows of Kairu, but must have its own identity. Do not copy its branding, assets, text, layouts or source. No competitor access is necessary to fulfill this brief.

## Product and audience

Tally serves individuals doing focused work within an approved private community. They may be studying, writing, coding, researching or working on personal projects. The primary use is personal: decide what to work on, start a session with little friction, and return later to understand what happened. Friends, rankings and challenges provide optional social context.

Typical use ranges from a quick timer interaction to reviewing a dense history. Design for repeated daily use, both while someone is concentrating and while they are planning or reflecting. Let frequent actions remain easy to find without showing every advanced option at once. Avoid guilt-driven engagement, misleading productivity claims or pressure to share.

Design the application experience rather than a marketing site. It has no billing, subscription tiers, public signup or enterprise organization hierarchy.

## Core capabilities

### Access and first use

- Google is the only sign-in method. Access is restricted to an administrator-managed email allowlist.
- Provide understandable sign-in, denied-access, expired-session and sign-out experiences. Do not add password forms, other providers or an invitation-management product.
- First use starts with genuinely empty personal data. Explain enough to help someone begin their first session, create a task or understand optional sharing. Avoid a mandatory onboarding questionnaire.

### Planning

- Private tasks have a title, Markdown description, optional time estimate and optional tag.
- Provide list and Kanban views of the same tasks, with Todo, In Progress and Done states; support ordering, editing, filtering by status/tag and finding tasks by title.
- Tags are user-managed, named and colored. Tasks and tags can be archived without erasing their historical associations.
- A session may link to one task and one tag. A task's tag can be used initially and overridden for the session.
- Task completion is explicit; finishing a timer does not automatically complete the task.
- Dragging must have an accessible non-drag alternative, on both desktop and mobile.

### Focus and time tracking

- Countdown and stopwatch modes, with focus and break sessions.
- Start, pause, resume and stop; configurable focus/break durations and round count; optional completion sound.
- One running or paused timer per person across tabs/devices. Keep the active timer accessible when the user navigates elsewhere, using a pattern you choose.
- Sessions may have a title, linked task, tag and Markdown notes. Make it possible to capture notes without losing track of the current timer.
- Default countdown settings are four rounds with 25-minute focus and 5-minute breaks; these are editable defaults, not a prescribed visual structure.
- Each subsequent focus/break phase requires an explicit start. Do not imply that cycles continue unattended.
- Paused time does not count. An expired countdown finishes at its saved deadline. A stopwatch runs until stopped.
- Distinguish finalized recorded focus from an active session's provisional elapsed time.
- An existing timer remains visible offline, but changes cannot be saved offline. Explain connection/save state and reconciliation on reconnect; a failed save must never look successful.
- Address idle, running, paused, completed, next-phase-ready, offline and stale/conflicting states. Preserve unsaved input on save failure and explain conflicts from another device without silent overwrite.

### History and review

- Browse daily history and other dates, filter by text, tag and session type, and inspect individual records.
- Add manual entries; edit titles/tags/tasks/notes; correct timing; inspect retained timing revision history; delete and restore records.
- Distinguish focus/break, timer/manual, timing-corrected and deleted records with understandable labels, not color alone.
- Invalid, future or overlapping time entries must produce useful feedback. Preserve entered values so a user can fix the problem.
- Explain the consequences of timing changes before the user commits them, especially the competitive eligibility rule below.

### Personal analytics and goals

- Daily timeline, weekly comparisons, monthly calendar, yearly/monthly breakdowns and selectable reporting periods.
- Total focus, session count and average, lifetime totals, best periods, task/tag breakdowns and estimated versus actual task time.
- Optional daily/weekly focus goals, progress and current/best streaks. Personal streaks require five accumulated focus minutes per day.
- Reports include finalized focus from timer, manual and corrected entries; breaks and active timers are excluded from finalized totals.
- Personal reports use the user's saved time zone. Group rankings and challenges use the fixed community time zone, initially Europe/Berlin; weeks begin Monday. Explain zone/date context where it affects interpretation without exposing technical date formats everywhere.
- Use visualizations that answer actual user questions and remain understandable with little data, zero values, missing days and long labels. Include accessible text/table equivalents.

### Profiles, friends and encouragement

- Approved members can discover other members and see chosen display name, Google avatar or initials, and optional country, focus area and bio.
- Search members; send, cancel, accept or reject friend requests; remove friends.
- Give or retract kudos, limited to one per sender/recipient per community day; no self-kudos.
- Friendship does not grant access to another person's private work records. Do not design a public activity feed of private sessions or notes.

### Rankings

- Optional community rankings for focus time and current/best streaks.
- Day, week, month, year and all-time focus views; historical periods; group/friends/country filters; own position and period statistics; shared ranks for ties.
- Participation is opt-in. Provide an understandable nonparticipant state and privacy controls, without coercive prompts.
- Rankings show currently valid records rather than immutable historical snapshots.

### Challenges

- Monthly consistency challenge: 25 eligible focus minutes on every community-calendar day of the month; explicit enrollment, progress/history and completion badges.
- Personal custom challenges: daily minute target and positive day count, beginning today or tomorrow; one active custom challenge per person.
- Optional community result sharing and wall of fame. Joining a challenge, sharing challenge results and joining leaderboards are separate choices.
- Custom challenges are personal commitments with optional shared results, not multiplayer rooms or team competitions.
- Progress and badges reflect currently valid records, including later corrections/deletions. Do not portray them as permanent awards immune to changes.

### Settings and data ownership

- Light, dark and system appearance; saved time zone; profile, timer/sound, goal and sharing preferences.
- Export owned session data as CSV and owned application data as versioned JSON.
- Focus reset and account deletion are separate destructive actions with clear scope, explicit confirmation and an opportunity to export first.
- Focus reset removes recorded sessions and personal challenge history/derived achievements while retaining tasks, tags, profile, goals, preferences and friendships. Account deletion removes owned personal records and social associations.
- No import UI, password settings or public admin console is required.

## Rules the design must communicate

**Personal records and competitive records differ.** Manual entries and timing-corrected sessions count in personal reports and goals, but never in rankings or shared challenges. Only finalized, undeleted, timer-origin focus whose timing has never been edited is competitively eligible. Editing metadata does not remove eligibility. Correcting timing permanently removes it, even if changed back. Long untouched sessions remain eligible; there is no three-hour cutoff. Tracking a timer is not proof of productive work.

**Sharing is intentional and limited.** Tasks, tags, session titles, notes, detailed activity, email addresses and exports are private. Basic chosen profile fields are visible to approved members. Statistics are private by default; leaderboard participation and challenge-result sharing are separate opt-ins. Social designs may show consented aggregates, not another person's work log. Opt-out removes historical visibility too.

**Time and persistence must be trustworthy.** Saved records are authoritative. Offline display, unsaved edits and confirmed saves must be distinguishable. Handle another device changing a timer or record, recovery after interruption, and requests that fail without losing the user's input. Avoid exposing implementation details unless they help resolve the situation.

## Interaction and implementation constraints

- Responsive web application, initially in English. Support small screens from 360px and substantial desktop use; adapt interactions instead of merely shrinking a desktop screen.
- TypeScript, React with TanStack Start, Tailwind CSS and shadcn/ui. Authentication is Better Auth with Google only; persistence is Drizzle with a local SQLite file. No hosted database or container is needed. These are engineering constraints, not UI content to show users.
- Create a reusable design system that can be translated into tokens and components with this stack. No backend implementation, real OAuth integration or production deployment is requested in this design exercise.
- Provide semantic controls, keyboard navigation, visible focus, sufficient contrast, usable touch targets, reduced-motion behavior and screen-reader-friendly names/state changes. Do not use color alone for meaning or announce a timer every second.
- Address loading, empty, populated, validation error, denied access, offline, conflict, saving, success and destructive confirmation states where relevant. Long content, large durations, archived references and small datasets must not break the design.
- Markdown needs safe writing/preview behavior; raw HTML and embedded images are unsupported.
- Prototype interactions may use local synthetic data, clearly identified as demonstration data. Never imply that a prototype's OAuth, exports, persistence or account deletion are production integrations.

## What to deliver

1. A brief product interpretation and proposed information architecture showing how the capabilities fit together. Make reasonable design assumptions and label them; do not stall the initial exploration on a questionnaire.
2. A cohesive original design direction, with a concise rationale and reusable foundations: typography hierarchy, colors/semantic states, spacing, density, component patterns and theme behavior. You choose the values and aesthetic.
3. Representative desktop and mobile sketches or a clickable prototype that demonstrate one connected journey: plan/select work, track a focus session, review/correct it, understand progress and optionally share/participate. Include enough examples of social/challenge/settings flows to establish the system's reach; they need not all have equal fidelity initially.
4. Key alternative states, especially a first-time empty workspace, paused/offline timer, correction/eligibility explanation, privacy opt-in and destructive confirmation. Show at least a representative light/dark pair and explain how the system extends across both.
5. A short coverage/handoff note identifying screens and states shown, deferred sketches, reusable components/tokens, interaction behavior, accessibility considerations and open decisions. Separate optional future suggestions from the required scope.

Prioritize a coherent, reviewable first proposal over an exhaustive set of disconnected screens. We will review the proposed system before implementation. You have room to choose screen boundaries and the visual language; preserve the product capabilities, privacy boundaries and time-record semantics above.
