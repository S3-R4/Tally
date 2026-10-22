import {
  cloneElement,
  isValidElement,
  useId,
  lazy,
  Suspense,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useHydrated } from '@tanstack/react-router'
import {
  LogOut,
  Menu,
  Timer,
  ListTodo,
  NotebookPen,
  ChartNoAxesCombined,
  Trophy,
  Users,
  Flag,
  Settings,
  CircleCheck,
  WifiOff,
} from 'lucide-react'
import { Button } from './ui/button'
import { Label } from './ui/label'
import { Card, CardContent } from './ui/card'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { authClient } from '@/lib/auth-client'
import { getAppData, changeAppData } from '@/lib/app-api'
import type { MutationInput } from '@/lib/inputs'
import { duration, formatDuration } from '@/lib/time'
const FocusPage = lazy(() =>
  import('./workspace/focus').then((module) => ({ default: module.FocusPage })),
)
const PlanPage = lazy(() =>
  import('./workspace/plan').then((module) => ({ default: module.PlanPage })),
)
const ReviewPage = lazy(() =>
  import('./workspace/review').then((module) => ({
    default: module.ReviewPage,
  })),
)
const AnalyzePage = lazy(() =>
  import('./workspace/analyze').then((module) => ({
    default: module.AnalyzePage,
  })),
)
const SocialPage = lazy(() =>
  import('./workspace/social').then((module) => ({
    default: module.SocialPage,
  })),
)
const ChallengesPage = lazy(() =>
  import('./workspace/challenges').then((module) => ({
    default: module.ChallengesPage,
  })),
)
const SettingsPage = lazy(() =>
  import('./workspace/settings').then((module) => ({
    default: module.SettingsPage,
  })),
)

import type { WorkspaceSearch } from '@/lib/workspace-search'
type WorkspaceResponse = Extract<
  Awaited<ReturnType<typeof getAppData>>,
  { view: 'workspace' }
>['data']
type SessionDraft = {
  title: string
  note: string
  taskId: string
  tagId: string
  revision: number
  metadataFingerprint: string
}
type Context = {
  drafts: Record<string, SessionDraft>
  setDraft: (
    id: string,
    draft:
      | SessionDraft
      | null
      | ((current: SessionDraft | undefined) => SessionDraft),
  ) => void
  data: WorkspaceResponse
  search: WorkspaceSearch
  run: (input: MutationInput) => Promise<boolean>
  disabled: boolean
  now: number
}
const WorkspaceContext = createContext<Context | null>(null)
export function useWorkspace() {
  const value = useContext(WorkspaceContext)
  if (!value) throw new Error('Workspace context is required')
  return value
}
export function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  const id = useId()
  return (
    <div className="grid min-w-0 gap-2 text-sm font-medium">
      <Label htmlFor={id}>{label}</Label>
      {isValidElement<{ id?: string }>(children)
        ? cloneElement(children, { id })
        : children}
    </div>
  )
}
export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`h-10 w-full min-w-0 rounded-md border bg-background px-3 text-sm ${props.className ?? ''}`}
    />
  )
}
export function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
      {children}
    </p>
  )
}
export function PageTitle({
  title,
  detail,
  children,
}: {
  title: string
  detail: string
  children?: ReactNode
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[.2em] text-primary">
          Your workspace
        </p>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          {detail}
        </p>
      </div>
      {children}
    </div>
  )
}
export function Stat({
  label,
  value,
  detail,
}: {
  label: string
  value: ReactNode
  detail?: string
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="mt-3 text-2xl font-semibold tabular-nums">{value}</p>
        {detail && (
          <p className="mt-2 text-xs text-muted-foreground">{detail}</p>
        )}
      </CardContent>
    </Card>
  )
}
export function DateFilter() {
  const { search, disabled, data } = useWorkspace()
  return (
    <form action="/workspace" className="mb-6 flex flex-wrap items-end gap-3">
      <input type="hidden" name="tab" value={search.tab} />
      <Field label="From">
        <Input
          type="date"
          name="from"
          defaultValue={search.from ?? data.range.from}
          required
        />
      </Field>
      <Field label="Until (exclusive)">
        <Input
          type="date"
          name="to"
          defaultValue={search.to ?? data.range.to}
          required
        />
      </Field>
      <Button disabled={disabled} variant="outline">
        Apply range
      </Button>
    </form>
  )
}
export function Pagination({ total }: { total: number }) {
  const { search } = useWorkspace()
  return (
    <nav
      aria-label="Pagination"
      className="mt-6 flex items-center gap-4 text-sm"
    >
      <Link
        to="/workspace"
        search={{ ...search, page: Math.max(0, search.page - 1) }}
        aria-disabled={search.page === 0}
        className={
          search.page === 0 ? 'pointer-events-none opacity-40' : 'underline'
        }
      >
        Previous
      </Link>
      <span>
        Page {search.page + 1} · {total} records
      </span>
      <Link
        to="/workspace"
        search={{ ...search, page: search.page + 1 }}
        aria-disabled={(search.page + 1) * 50 >= total}
        className={
          (search.page + 1) * 50 >= total
            ? 'pointer-events-none opacity-40'
            : 'underline'
        }
      >
        Next
      </Link>
    </nav>
  )
}
export function AssociationFields({
  taskId,
  tagId,
  setTaskId,
  setTagId,
  historical = false,
}: {
  taskId: string
  tagId: string
  setTaskId: (id: string) => void
  setTagId: (id: string) => void
  historical?: boolean
}) {
  const { data } = useWorkspace()
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Task">
        <Select
          value={taskId}
          onChange={(event) => {
            setTaskId(event.target.value)
            const task = data.tasks.find((row) => row.id === event.target.value)
            if (task)
              setTagId(
                data.tags.find(
                  (tag) =>
                    tag.id === task.tagId &&
                    (historical || tag.archivedAtMs === null),
                )?.id ?? '',
              )
          }}
        >
          <option value="">No task</option>
          {data.tasks
            .filter((task) => historical || task.archivedAtMs === null)
            .map((task) => (
              <option key={task.id} value={task.id}>
                {task.title}
                {task.archivedAtMs !== null ? ' (archived)' : ''}
              </option>
            ))}
        </Select>
      </Field>
      <Field label="Tag">
        <Select
          value={tagId}
          onChange={(event) => setTagId(event.target.value)}
        >
          <option value="">No tag</option>
          {data.tags
            .filter((tag) => historical || tag.archivedAtMs === null)
            .map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
                {tag.archivedAtMs !== null ? ' (archived)' : ''}
              </option>
            ))}
        </Select>
      </Field>
    </div>
  )
}
export function NoteInput({
  value,
  onChange,
  label = 'Notes (Markdown)',
}: {
  value: string
  onChange: (value: string) => void
  label?: string
}) {
  return (
    <Field label={label}>
      <Textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={20000}
        rows={4}
      />
    </Field>
  )
}
export function Workspace({ search }: { search: WorkspaceSearch }) {
  const [drafts, setDrafts] = useState<Record<string, SessionDraft>>({})
  const setDraft: Context['setDraft'] = (id, draft) =>
    setDrafts((current) => {
      const next = { ...current }
      const resolved = typeof draft === 'function' ? draft(current[id]) : draft
      if (resolved) next[id] = resolved
      else delete next[id]
      return next
    })
  const hydrated = useHydrated(),
    queryClient = useQueryClient()
  const [online, setOnline] = useState(true),
    [menu, setMenu] = useState(false),
    [notice, setNotice] = useState(''),
    [error, setError] = useState('')
  const query = useQuery({
    queryKey: [
      'tally',
      'workspace',
      search.from,
      search.to,
      search.page,
      search.deleted,
      search.search,
      search.tagId,
      search.recordType,
      search.tab === 'review',
    ],
    queryFn: async () => {
      const response = await getAppData({
        data: { ...search, view: 'workspace', daily: search.tab === 'review' },
      })
      if (response.view !== 'workspace') throw new Error('Unexpected response')
      return response.data
    },
    refetchInterval: 15000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: 'always',
    refetchOnReconnect: 'always',
  })
  const mutation = useMutation({
    mutationFn: changeAppData,
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['tally'] }),
  })
  const [now, setNow] = useState(0)
  const anchor = useRef({ serverAtMs: 0, monotonicAt: 0 })
  const soundPlayed = useRef('')
  useEffect(() => {
    const changed = () => setOnline(navigator.onLine)
    changed()
    window.addEventListener('online', changed)
    window.addEventListener('offline', changed)
    return () => {
      window.removeEventListener('online', changed)
      window.removeEventListener('offline', changed)
    }
  }, [])
  useEffect(() => {
    if (!query.data) return
    anchor.current = {
      serverAtMs: query.data.timer.serverAtMs,
      monotonicAt: performance.now(),
    }
    setNow(query.data.timer.serverAtMs)
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () =>
      document.documentElement.classList.toggle(
        'dark',
        query.data.member.theme === 'dark' ||
          (query.data.member.theme === 'system' && media.matches),
      )
    apply()
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [query.data])
  useEffect(() => {
    const tick = setInterval(
      () =>
        setNow(
          anchor.current.serverAtMs +
            performance.now() -
            anchor.current.monotonicAt,
        ),
      250,
    )
    return () => clearInterval(tick)
  }, [])
  const active = query.data?.timer.active
  useEffect(() => {
    if (
      active?.status === 'running' &&
      active.deadlineAtMs !== null &&
      now >= active.deadlineAtMs &&
      soundPlayed.current !== active.id
    ) {
      soundPlayed.current = active.id
      setNotice('Phase complete. Start the next phase when you are ready.')
      void queryClient.invalidateQueries({ queryKey: ['tally'] })
      if (query.data?.member.sound) {
        try {
          const audio = new AudioContext()
          const tone = audio.createOscillator(),
            gain = audio.createGain()
          tone.connect(gain)
          gain.connect(audio.destination)
          gain.gain.value = 0.08
          tone.frequency.value = 660
          tone.start()
          tone.stop(audio.currentTime + 0.3)
          tone.onended = () => void audio.close()
        } catch {
          /* Browser sound permission can remain suspended. */
        }
      }
    }
  }, [active, now, query.data?.member.sound, queryClient])
  async function run(input: MutationInput) {
    setError('')
    setNotice('')
    try {
      const result = await mutation.mutateAsync({ data: input })
      if (!result.ok) {
        setError(result.message)
        return false
      }
      setNotice('Saved.')
      return true
    } catch {
      setError(
        'Could not save. Check your connection and reload before retrying. Your draft is still here.',
      )
      return false
    }
  }
  async function signOut() {
    setError('')
    try {
      const response = await authClient.signOut()
      if (response.error) throw new Error('Sign out failed')
      window.location.assign('/')
    } catch {
      setError('Sign-out failed. Check your connection and try again.')
    }
  }
  const navigation = [
    ['focus', 'Focus', Timer],
    ['plan', 'Plan', ListTodo],
    ['review', 'Review', NotebookPen],
    ['analyze', 'Analyze', ChartNoAxesCombined],
    ['leaderboards', 'Leaderboards', Trophy],
    ['challenges', 'Challenges', Flag],
    ['friends', 'Friends', Users],
    ['settings', 'Settings', Settings],
  ] as const
  const disabled = !hydrated || !online || mutation.isPending
  const content = (
    <>
      <header className="mb-8 flex items-center justify-between gap-3 border-b pb-5">
        <span className="truncate text-sm text-muted-foreground">
          {query.data?.member.displayName ?? 'Tally'}{' '}
          <span className="hidden sm:inline">
            / {query.data?.member.timeZone}
          </span>
        </span>
        <Button variant="ghost" size="sm" onClick={signOut} disabled={disabled}>
          <LogOut className="size-4" />
          Sign out
        </Button>
      </header>
      {!online && (
        <p
          role="status"
          className="mb-5 flex items-center gap-2 rounded-lg bg-muted p-4 text-sm"
        >
          <WifiOff className="size-4" />
          Offline. The timer display continues; reconnect to save changes.
        </p>
      )}
      {query.isError && (
        <p
          role="alert"
          className="mb-5 rounded-lg border border-destructive p-4"
        >
          Could not refresh your workspace.{' '}
          <Button variant="link" onClick={() => void query.refetch()}>
            Retry
          </Button>
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="mb-5 rounded-lg border border-destructive p-4 text-sm text-destructive"
        >
          {error}
        </p>
      )}
      <p
        role="status"
        aria-live="polite"
        className="mb-3 min-h-5 text-sm text-primary"
      >
        {notice && (
          <>
            <CircleCheck className="mr-2 inline size-4" />
            {notice}
          </>
        )}
      </p>
      {!query.data ? (
        <p role="status">Loading workspace…</p>
      ) : (
        <WorkspaceContext.Provider
          value={{
            drafts,
            setDraft,
            data: query.data,
            search,
            run,
            disabled,
            now: now || query.data.timer.serverAtMs,
          }}
        >
          {active && search.tab !== 'focus' && (
            <Link
              to="/workspace"
              search={{ tab: 'focus' }}
              className="mb-7 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-primary/30 bg-accent p-4 text-sm"
            >
              <span>
                {active.kind === 'focus' ? 'Focus' : 'Break'} timer ·{' '}
                {active.status}
              </span>
              <strong className="tabular-nums">
                {formatDuration(
                  duration(
                    active.intervals,
                    Math.min(now, active.deadlineAtMs ?? now),
                  ),
                )}
              </strong>
            </Link>
          )}
          <fieldset disabled={disabled} className="min-w-0">
            <Suspense fallback={<p role="status">Loading view…</p>}>
              {search.tab === 'focus' ? (
                <FocusPage />
              ) : search.tab === 'plan' ? (
                <PlanPage />
              ) : search.tab === 'review' ? (
                <ReviewPage />
              ) : search.tab === 'analyze' ? (
                <AnalyzePage />
              ) : search.tab === 'challenges' ? (
                <ChallengesPage />
              ) : search.tab === 'settings' ? (
                <SettingsPage />
              ) : (
                <SocialPage />
              )}
            </Suspense>
          </fieldset>
        </WorkspaceContext.Provider>
      )}
    </>
  )
  return (
    <div className="min-h-svh lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="border-b bg-card lg:sticky lg:top-0 lg:h-svh lg:border-r lg:border-b-0">
        <div className="flex items-center justify-between p-5 lg:p-8">
          <Link
            to="/workspace"
            search={{ tab: 'focus' }}
            className="flex items-center gap-3 text-2xl font-semibold tracking-tight"
          >
            <img src="/favicon.svg" alt="" className="size-9" />
            Tally.
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Toggle navigation"
            aria-expanded={menu}
            disabled={!hydrated}
            onClick={() => setMenu(!menu)}
          >
            <Menu />
          </Button>
        </div>
        <nav
          aria-label="Workspace"
          className={`${menu ? 'grid' : 'hidden'} gap-1 px-4 pb-5 lg:grid`}
        >
          {navigation.map(([tab, label, Icon]) => (
            <Link
              key={tab}
              to="/workspace"
              search={{ tab }}
              onClick={() => setMenu(false)}
              aria-current={search.tab === tab ? 'page' : undefined}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium ${search.tab === tab ? 'bg-accent text-primary' : 'text-muted-foreground hover:bg-muted'}`}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="hidden px-8 pt-8 text-xs leading-6 text-muted-foreground lg:block">
          A little intention.
          <br />A clearer day.
        </div>
      </aside>
      <main className="mx-auto w-full min-w-0 max-w-7xl px-4 py-4 sm:px-8 lg:px-12 lg:py-8">
        {content}
      </main>
    </div>
  )
}
