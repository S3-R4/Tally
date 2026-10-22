# Design contract

Revision: 1.1. User decision, 2026-10-22: the existing first frontend is rejected. Claude Design will propose a new frontend and design system for human review before implementation. The previous teal/slate palette, typography, sidebar, card layouts and other visual defaults are superseded; do not treat the current frontend as an approved reference.

## Design exploration

- User clarification (2026-10-22): Claude Design will not see the existing frontend. The external prompt must describe Tally independently, without prior-design, replacement/reskin or implementation-reuse framing. Keep rejection history in internal project records only.
- The standalone [Claude Design brief](design/claude-design-brief.md) describes product scope, workflows, required behavior and deliverables without prescribing a concrete visual system. The user will provide it to Claude Design; no external service has been contacted by this task.
- Claude Design may choose visual identity, palette, typography, spacing/density, component styling, navigation and screen grouping. Use original Tally design, not competitor assets, layouts, text or source.
- The implementation stack remains TypeScript, React/TanStack Start, Tailwind CSS and shadcn/ui. The primitives are an implementation foundation, not a required stock appearance. Existing backend/domain behavior and shared contracts remain reusable.
- Sketches/prototypes are proposals. Save the selected proposal and human decision in the repository before changing the frontend; update this contract and affected tasks then. This brief does not authorize a redesign implementation or merge. Track release changes requested in [APPROVALS.md](APPROVALS.md).

## Functional and interaction constraints

- Preserve PLAN.md capabilities and CONTRACTS.md time-record/privacy rules. Capability labels do not require matching pages or fixed navigation.
- Keep the current timer accessible across navigation. Show mode, phase, running/paused/completed state and confirmed versus provisional time. Next phases require explicit start. Preserve input on save failures and clearly resolve conflicting device edits.
- Planning provides list/Kanban, ordering, three task states, filters and explicit task completion. Dragging has a keyboard/touch-friendly non-drag alternative.
- Review distinguishes manual, timing-corrected, deleted, focus and break records through text/icons as well as color. Explain competitive eligibility and preserved correction history.
- Analytics expose required periods/breakdowns/goals/streaks with accessible text/table equivalents for charts; label personal/group calendar context where it affects results.
- Member profiles expose only approved fields and consented aggregates. Emails, tasks, tags, session details, notes and exports stay private. Leaderboards and challenge results have separate opt-ins.
- Markdown writing/preview must remain safe: no raw HTML or embedded images. The interaction pattern is open to design exploration.
- Show loading, empty, denied, conflict, disconnected, validation and save-failed states. Never show failed writes as saved or fake demo data as production statistics.
- Keep JavaScript-dependent actions disabled until hydrated. Use semantic controls, labels, keyboard access, visible focus, sufficient contrast, reduced motion and usable touch targets. Do not announce every timer second.
- Destructive confirmations explain reset/deletion scope and offer export access first. Ordinary saves/navigation do not require confirmation dialogs.
- Initial language: English. Responsive use starts at 360px; avoid page overflow. Support light/dark/system appearance. Exact breakpoints, layout and visual tokens remain the designer's choice.
