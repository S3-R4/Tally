import { Link } from '@tanstack/react-router'
import { Card, CardContent } from '../ui/card'
import { DateFilter, Empty, PageTitle, Stat, useWorkspace } from '../workspace'
import {
  dayAt,
  formatDuration,
  shiftDay,
  weekStart,
  dayStart,
  shiftMonth,
} from '@/lib/time'

export function AnalyzePage() {
  const { data, search, now } = useWorkspace(),
    report = data.report
  const today = dayAt(now, data.member.timeZone),
    year = (search.from ?? today).slice(0, 4)
  const presets = [
    ['Today', today, shiftDay(today, 1)],
    ['Week', weekStart(today), shiftDay(weekStart(today), 7)],
    [
      'Month',
      `${today.slice(0, 7)}-01`,
      `${Number(today.slice(5, 7)) === 12 ? `${Number(today.slice(0, 4)) + 1}-01` : `${today.slice(0, 4)}-${String(Number(today.slice(5, 7)) + 1).padStart(2, '0')}`}-01`,
    ],
    ['Year', `${year}-01-01`, `${Number(year) + 1}-01-01`],
  ]
  const calendar = Array.from({ length: 366 }, (_, index) =>
    shiftDay(`${year}-01-01`, index),
  ).filter((day) => day.startsWith(year))
  const monthTotals = Object.entries(report.byMonth)
    .filter(([month]) => month.startsWith(year))
    .sort(([a], [b]) => a.localeCompare(b))
  return (
    <>
      <PageTitle
        title="Understand where time goes."
        detail={`Finalized focus in ${data.member.timeZone}. Manual and corrected time is included. Active timers and breaks are excluded.`}
      />
      <nav
        className="mb-5 flex flex-wrap gap-3 text-sm"
        aria-label="Report periods"
      >
        {presets.map(([label, from, to]) => (
          <Link
            key={label}
            to="/workspace"
            search={{ tab: 'analyze', from, to }}
            className="rounded-lg border bg-card px-4 py-2 hover:bg-accent"
          >
            {label}
          </Link>
        ))}
      </nav>
      <DateFilter />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Selected range"
          value={formatDuration(report.rangeDurationMs)}
          detail={`${report.sessionCount} sessions · average ${formatDuration(report.sessionCount ? report.rangeDurationMs / report.sessionCount : 0)}`}
        />
        <Stat
          label="Lifetime"
          value={formatDuration(report.lifetimeDurationMs)}
        />
        <Stat
          label="Current streak"
          value={`${report.streak.current} days`}
          detail={`Best: ${report.streak.best} days · 5 min/day`}
        />
        <Stat
          label="Best day"
          value={formatDuration(report.bestDayDurationMs)}
          detail={`Best week ${formatDuration(report.bestWeekDurationMs)} · month ${formatDuration(report.bestMonthDurationMs)}`}
        />
      </div>
      <div className="my-6 grid gap-6 lg:grid-cols-2">
        <Goal
          title="Daily goal"
          actual={report.todayDurationMs}
          minutes={data.member.dailyGoalMinutes}
        />
        <Goal
          title="Weekly goal"
          actual={report.weekDurationMs}
          minutes={data.member.weeklyGoalMinutes}
        />
      </div>
      <section className="mt-9">
        <h2 className="mb-4 text-lg font-semibold">Weekly comparison</h2>
        <Bars
          entries={Object.entries(report.byWeek)
            .filter(
              ([day]) =>
                day >= weekStart(data.range.from) && day < data.range.to,
            )
            .sort(([a], [b]) => a.localeCompare(b))}
          empty="No weekly totals yet."
        />
      </section>
      <section className="mt-9">
        <h2 className="mb-4 text-lg font-semibold">Focus timeline</h2>
        {report.timeline.length ? (
          <div className="max-h-80 overflow-auto rounded-xl border bg-card p-5">
            <ol className="space-y-3">
              {report.timeline.map((part, i) => (
                <li key={i} className="border-l-2 border-primary pl-4 text-sm">
                  <strong>{part.day}</strong> ·{' '}
                  {new Date(part.startAtMs).toLocaleTimeString(undefined, {
                    timeZone: data.member.timeZone,
                  })}
                  –
                  {new Date(part.endAtMs).toLocaleTimeString(undefined, {
                    timeZone: data.member.timeZone,
                  })}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {part.title || 'Focus'} ·{' '}
                    {formatDuration(part.endAtMs - part.startAtMs)}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        ) : (
          <Empty>No focus intervals in this range.</Empty>
        )}
      </section>
      <section className="mt-9">
        <h2 className="mb-4 text-lg font-semibold">Daily focus</h2>
        <Bars
          entries={Object.entries(report.days).sort(([a], [b]) =>
            a.localeCompare(b),
          )}
          empty="No finalized focus in this range."
        />
      </section>
      <div className="mt-9 grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-4 text-lg font-semibold">By tag</h2>
          <Bars
            entries={Object.entries(report.byTag).map(([id, value]) => [
              data.tags.find((tag) => tag.id === id)?.name ?? 'Untagged',
              value,
            ])}
            empty="No tag totals yet."
          />
        </section>
        <section>
          <h2 className="mb-4 text-lg font-semibold">By task</h2>
          <Bars
            entries={Object.entries(report.byTask).map(([id, value]) => [
              data.tasks.find((task) => task.id === id)?.title ?? 'Unassigned',
              value,
            ])}
            empty="No task totals yet."
          />
        </section>
      </div>
      <MonthCalendar month={(search.from ?? today).slice(0, 7)} />
      <section className="mt-9">
        <h2 className="mb-4 text-lg font-semibold">{year} focus calendar</h2>
        <p className="mb-4 text-xs text-muted-foreground">
          Each day links to its records. Accessible labels include the date and
          total.
        </p>
        <div className="grid grid-cols-7 gap-1 sm:grid-cols-14 md:grid-cols-21">
          {calendar.map((day) => {
            const ms = report.allDays[day] ?? 0
            return (
              <Link
                key={day}
                to="/workspace"
                search={{ tab: 'review', from: day, to: shiftDay(day, 1) }}
                title={`${day}: ${formatDuration(ms)}`}
                aria-label={`${day}: ${formatDuration(ms)}`}
                className="flex aspect-square min-h-6 items-center justify-center rounded-sm border text-[9px]"
                style={{
                  background: ms ? 'var(--primary)' : 'var(--muted)',
                  color: ms
                    ? 'var(--primary-foreground)'
                    : 'var(--muted-foreground)',
                  opacity: ms ? Math.min(1, 0.4 + ms / 7_200_000) : 1,
                }}
              >
                {Number(day.slice(8))}
              </Link>
            )
          })}
        </div>
        <details className="mt-4 text-sm">
          <summary>Calendar text totals</summary>
          <table className="mt-3 w-full text-left">
            <caption className="sr-only">{year} daily focus totals</caption>
            <tbody>
              {calendar.map((day) => (
                <tr key={day}>
                  <th className="py-1 font-normal">{day}</th>
                  <td>{formatDuration(report.allDays[day] ?? 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </section>
      <section className="mt-9">
        <h2 className="mb-4 text-lg font-semibold">{year} by month</h2>
        <Bars entries={monthTotals} empty="No focus in this year." />
      </section>
      <section className="mt-9">
        <h2 className="mb-4 text-lg font-semibold">Year totals</h2>
        <Bars
          entries={Object.entries(report.byYear).sort(([a], [b]) =>
            b.localeCompare(a),
          )}
          empty="No yearly totals yet."
        />
      </section>
      <section className="mt-9">
        <h2 className="mb-4 text-lg font-semibold">
          Task estimates and actual time (lifetime)
        </h2>
        {data.tasks.length ? (
          <div className="overflow-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b">
                  <th className="p-3">Task</th>
                  <th className="p-3">Estimate</th>
                  <th className="p-3">Actual</th>
                </tr>
              </thead>
              <tbody>
                {data.tasks.map((task) => (
                  <tr key={task.id} className="border-b">
                    <td className="p-3">{task.title}</td>
                    <td className="p-3">
                      {task.estimateMinutes
                        ? formatDuration(task.estimateMinutes * 60000)
                        : 'Unset'}
                    </td>
                    <td className="p-3">
                      {formatDuration(report.taskActual[task.id] ?? 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty>No tasks yet.</Empty>
        )}
      </section>
    </>
  )
}
function Goal({
  title,
  actual,
  minutes,
}: {
  title: string
  actual: number
  minutes: number
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <h2 className="mb-3 font-medium">{title}</h2>
        {minutes ? (
          <>
            <progress
              className="h-3 w-full accent-primary"
              value={Math.min(actual, minutes * 60000)}
              max={minutes * 60000}
              aria-label={title}
            />
            <p className="mt-2 text-sm">
              {formatDuration(actual)} / {formatDuration(minutes * 60000)}
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Set a goal in Settings.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
function Bars({
  entries,
  empty,
}: {
  entries: [string, number][]
  empty: string
}) {
  const max = Math.max(1, ...entries.map(([, value]) => value))
  return entries.length ? (
    <div className="space-y-3 rounded-xl border bg-card p-5">
      {entries.map(([label, value], index) => (
        <div key={`${label}-${index}`}>
          <div className="mb-1 flex justify-between gap-3 text-xs">
            <span className="min-w-0 break-words">{label}</span>
            <span className="shrink-0 tabular-nums">
              {formatDuration(value)}
            </span>
          </div>
          <div aria-hidden="true" className="h-2 rounded bg-muted">
            <div
              className="h-2 rounded bg-primary/75"
              style={{ width: `${(value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  ) : (
    <Empty>{empty}</Empty>
  )
}

function MonthCalendar({ month }: { month: string }) {
  const { data } = useWorkspace()
  const start = `${month}-01`
  const days = Array.from({ length: 31 }, (_, index) =>
    shiftDay(start, index),
  ).filter((day) => day.startsWith(month))
  const offset = (new Date(dayStart(start, 'UTC')).getUTCDay() + 6) % 7
  const previous = shiftDay(start, -1).slice(0, 7) + '-01'
  const next = shiftDay(days.at(-1)!, 1)
  return (
    <section className="mt-9">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{month} calendar</h2>
        <div className="flex gap-4 text-sm">
          <Link
            to="/workspace"
            search={{ tab: 'analyze', from: previous, to: start }}
            className="text-primary underline"
          >
            Previous month
          </Link>
          <Link
            to="/workspace"
            search={{
              tab: 'analyze',
              from: next,
              to: shiftMonth(next, 1),
            }}
            className="text-primary underline"
          >
            Next month
          </Link>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <span
            key={day}
            className="py-2 text-center text-xs text-muted-foreground"
          >
            {day}
          </span>
        ))}
        {Array.from({ length: offset }, (_, index) => (
          <span key={index} />
        ))}
        {days.map((day) => (
          <Link
            key={day}
            to="/workspace"
            search={{ tab: 'review', from: day, to: shiftDay(day, 1) }}
            className="min-w-0 rounded-lg border bg-card p-2 text-center text-xs hover:bg-accent"
          >
            <span className="block font-medium">{Number(day.slice(8))}</span>
            <span className="mt-2 block text-[10px] text-primary sm:text-xs">
              {formatDuration(data.report.allDays[day] ?? 0)}
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
