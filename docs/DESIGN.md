# Design contract

Revision: 1.0. These are engineering defaults, not a claim that the user approved a finished visual design.

- Original Tally wordmark and interface. Do not copy competitor assets, text, CSS, or screenshots into the product.
- shadcn/ui primitives, neutral/slate surfaces, teal primary accent, system sans font, tabular numerals for time. Shared CSS variables define color, radius, and spacing. Light/dark/system themes; system initially.
- Desktop sidebar: Focus, Plan, Review, Analyze, Leaderboards, Challenges, Friends; Settings in the account area. Small screens use a navigation sheet. Every route retains access to an active timer indicator.
- Focus is the main screen: timer, selected task/tag, clear phase/mode, start/pause/resume/stop, compact configuration, notes, today's saved focus and current session separated. Pending phase transitions require an explicit action.
- Plan provides list/board views over the same tasks. Three fixed states. Support keyboard/touch drag, plus an explicit status control. Filters and task totals are consistent across views.
- Review places date/filter controls above chronological session cards. Distinguish manual, timing-edited, deleted, focus, and break records using text/icons as well as color. Explain unranked status. Timing edit views show intervals and preserved history.
- Analyze uses a shared date range, summary cards, charts plus accessible text/table summaries, calendar, tag/task breakdown, goals, and streak explanation. Label personal versus group time zone wherever boundaries matter.
- Leaderboards expose period/date/group-friends/country controls, explicit opt-in, own rank, sorted rows, shared ties, and rule explanation. No implied verification of productive work.
- Challenges separate overview, own progress, community results, and history. Sharing defaults off. Wall of fame shows only opted-in achievements.
- Friends/profile screens expose only approved basic profile fields and consented aggregate statistics. Private logs never appear on a friend's profile.
- Markdown editor is a labeled text area with preview, no rich-text toolbar, raw HTML, or remote image rendering. Preserve drafts on a save failure.
- Show real loading, empty, denied, conflict, disconnected, and save-failed states. No fake seeded production statistics, silent failures, or placeholder actions presented as working features.
- Keep JavaScript-dependent controls disabled until hydrated, so early clicks cannot silently do nothing.
- Use semantic landmarks, labels, visible focus, sufficient contrast, reduced-motion preferences, and keyboard access. Charts must have text equivalents. A timer need not announce every second to screen readers; announce phase/state changes.
- Destructive confirmations explain scope; offer export access before reset/deletion. Ordinary saves and navigation do not need confirmation dialogs.
- Initial language: English. Mobile layouts must work at 360px without horizontal page overflow; desktop review at 1440px. Tables may scroll within their own region.
