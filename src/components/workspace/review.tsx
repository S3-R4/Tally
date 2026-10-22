import { useState } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import { Input } from '../ui/input'
import {
  AssociationFields,
  DateFilter,
  Empty,
  Field,
  NoteInput,
  PageTitle,
  Pagination,
  Select,
  useWorkspace,
} from '../workspace'
import { duration, eligible, formatDuration } from '@/lib/time'
import { Link } from '@tanstack/react-router'
import { Markdown } from './markdown'

type Session = ReturnType<typeof useWorkspace>['data']['sessions'][number]
function localInput(atMs: number) {
  const date = new Date(atMs)
  return new Date(atMs - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 19)
}
export function ReviewPage() {
  const { data, run, search } = useWorkspace()
  const [editing, setEditing] = useState<Session | 'manual' | null>(null)
  return (
    <>
      <PageTitle
        title="A record you can correct."
        detail="Review focus and breaks, edit notes, or add missing time. Manual and timing-corrected records count toward your personal goals only."
      >
        <Button onClick={() => setEditing('manual')}>Add manual focus</Button>
      </PageTitle>
      <DateFilter />
      <form action="/workspace" className="mb-6 flex flex-wrap items-end gap-3">
        <input type="hidden" name="tab" value="review" />
        <input type="hidden" name="from" value={data.range.from} />
        <input type="hidden" name="to" value={data.range.to} />
        <Field label="Search records">
          <Input name="search" defaultValue={search.search} maxLength={100} />
        </Field>
        <Field label="Tag">
          <Select name="tagId" defaultValue={search.tagId}>
            <option value="">All tags</option>
            {data.tags.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Record type">
          <Select name="recordType" defaultValue={search.recordType}>
            {['all', 'focus', 'break', 'manual', 'timer'].map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </Select>
        </Field>
        <Button variant="outline">Filter records</Button>
      </form>
      <div className="mb-6 flex gap-4 text-sm">
        <Link
          to="/workspace"
          search={{ ...search, page: 0, deleted: !search.deleted }}
          className="text-primary underline"
        >
          {search.deleted ? 'Show records' : 'Show deleted records'}
        </Link>
        <Link
          to="/workspace"
          search={{
            ...search,
            page: 0,
            from: new Date(
              Date.parse(data.range.from + 'T00:00:00Z') - 86400000,
            )
              .toISOString()
              .slice(0, 10),
            to: data.range.from,
          }}
          className="text-primary underline"
        >
          Previous day
        </Link>
        <Link
          to="/workspace"
          search={{
            ...search,
            page: 0,
            from: data.range.to,
            to: new Date(Date.parse(data.range.to + 'T00:00:00Z') + 86400000)
              .toISOString()
              .slice(0, 10),
          }}
          className="text-primary underline"
        >
          Next day
        </Link>
        <span className="text-muted-foreground">
          Calendar: {data.member.timeZone}
        </span>
      </div>
      {editing && (
        <SessionEditor
          key={typeof editing === 'string' ? 'manual' : editing.id}
          record={editing === 'manual' ? undefined : editing}
          close={() => setEditing(null)}
        />
      )}
      <div className="space-y-4">
        {data.sessions.map((row) => (
          <Card key={row.id}>
            <CardContent className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="break-words font-semibold">
                    {row.title ||
                      (row.kind === 'focus' ? 'Focus session' : 'Break')}
                  </h2>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {new Date(
                      row.intervals[0]?.startAtMs ?? row.createdAtMs,
                    ).toLocaleString(undefined, {
                      timeZone: data.member.timeZone,
                    })}{' '}
                    · {row.kind} · {row.mode} · {row.status}
                  </p>
                </div>
                <strong className="tabular-nums">
                  {formatDuration(
                    duration(row.intervals, data.timer.serverAtMs),
                  )}
                </strong>
              </div>
              <p className="mt-3 text-xs text-primary">
                {eligible(row)
                  ? 'Eligible timer focus'
                  : row.timingEdited
                    ? 'Timing corrected · personal only'
                    : row.source === 'manual'
                      ? 'Manual · personal only'
                      : row.kind === 'break'
                        ? 'Break · excluded from focus totals'
                        : 'Active · excluded until finalized'}
                {row.deletedAtMs !== null && ' · Deleted'}
              </p>
              {row.tagId && (
                <p className="mt-2 text-xs">
                  Tag: {data.tags.find((tag) => tag.id === row.tagId)?.name}
                </p>
              )}
              {row.taskId && (
                <p className="mt-2 text-xs">
                  Task:{' '}
                  {data.tasks.find((task) => task.id === row.taskId)?.title}
                </p>
              )}
              {row.note && (
                <div className="mt-4">
                  <Markdown>{row.note}</Markdown>
                </div>
              )}
              <details className="mt-4 text-xs">
                <summary className="cursor-pointer">
                  Intervals and timing history ({row.timingRevisions.length}{' '}
                  corrections)
                </summary>
                <ul className="mt-3 space-y-2">
                  {row.intervals.map((part) => (
                    <li key={part.id}>
                      {new Date(part.startAtMs).toISOString()} →{' '}
                      {part.endAtMs === null
                        ? 'running'
                        : new Date(part.endAtMs).toISOString()}
                    </li>
                  ))}
                </ul>
                {row.timingRevisions.map((revision) => (
                  <div key={revision.id} className="mt-3">
                    <p>
                      Before correction at{' '}
                      {new Date(revision.changedAtMs).toISOString()}:
                    </p>
                    {revision.intervals.map((part, i) => (
                      <p key={i}>
                        {new Date(part.startAtMs).toISOString()} →{' '}
                        {part.endAtMs === null
                          ? 'open'
                          : new Date(part.endAtMs).toISOString()}
                      </p>
                    ))}
                  </div>
                ))}
              </details>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditing(row)}
                >
                  Edit record
                </Button>
                {row.status === 'completed' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (
                        row.deletedAtMs !== null ||
                        window.confirm(
                          'Delete this record? You can restore it from deleted records.',
                        )
                      )
                        void run({
                          action:
                            row.deletedAtMs === null
                              ? 'delete-session'
                              : 'restore-session',
                          id: row.id,
                          expectedRevision: row.revision,
                        })
                    }}
                  >
                    {row.deletedAtMs === null ? 'Delete' : 'Restore'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {!data.sessions.length && <Empty>No records in this range.</Empty>}
      </div>
      <Pagination total={data.totalSessions} />
    </>
  )
}
function SessionEditor({
  record,
  close,
}: {
  record?: Session
  close: () => void
}) {
  const { run, now } = useWorkspace()
  const [title, setTitle] = useState(record?.title ?? ''),
    [note, setNote] = useState(record?.note ?? ''),
    [taskId, setTaskId] = useState(record?.taskId ?? ''),
    [tagId, setTagId] = useState(record?.tagId ?? '')
  const [parts, setParts] = useState(
    (record?.intervals.length
      ? record.intervals
      : [{ startAtMs: now - 30 * 60000, endAtMs: now - 5 * 60000 }]
    ).map((part) => ({
      start: localInput(part.startAtMs),
      end: part.endAtMs === null ? '' : localInput(part.endAtMs),
    })),
  )
  const [correcting, setCorrecting] = useState(!record),
    [error, setError] = useState('')
  async function save() {
    setError('')
    const closed = parts.map((part) => ({
      startAtMs: new Date(part.start).getTime(),
      endAtMs: new Date(part.end).getTime(),
    }))
    if (
      correcting &&
      closed.some(
        (part) =>
          !Number.isSafeInteger(part.startAtMs) ||
          !Number.isSafeInteger(part.endAtMs),
      )
    ) {
      setError('Enter a valid start and end for every interval.')
      return
    }
    const metadata = {
      title,
      note,
      taskId: taskId || null,
      tagId: tagId || null,
    }
    if (!record) {
      if (await run({ action: 'manual', ...metadata, parts: closed })) close()
    } else if (correcting) {
      if (
        await run({
          action: 'correct',
          id: record.id,
          expectedRevision: record.revision,
          parts: closed,
        })
      )
        close()
    } else if (
      await run({
        action: 'metadata',
        id: record.id,
        expectedRevision: record.revision,
        ...metadata,
      })
    )
      close()
  }
  return (
    <Card className="mb-6 border-primary/40">
      <CardContent className="space-y-5 p-6">
        <h2 className="font-semibold">
          {record ? 'Edit record' : 'Add manual focus'}
        </h2>
        {!correcting && (
          <>
            <Field label="Session title">
              <Input
                maxLength={200}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </Field>
            <AssociationFields
              taskId={taskId}
              tagId={tagId}
              setTaskId={setTaskId}
              setTagId={setTagId}
              historical
            />
            <NoteInput value={note} onChange={setNote} />
          </>
        )}
        {!record && (
          <>
            <Field label="Session title">
              <Input
                maxLength={200}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </Field>
            <AssociationFields
              taskId={taskId}
              tagId={tagId}
              setTaskId={setTaskId}
              setTagId={setTagId}
            />
            <NoteInput value={note} onChange={setNote} />
          </>
        )}
        {record?.status === 'completed' && (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={correcting}
              onChange={(e) => setCorrecting(e.target.checked)}
            />
            Correct timing (permanently personal-only)
          </label>
        )}
        {correcting && (
          <>
            <p className="text-xs text-muted-foreground">
              Times below use this device’s local time zone. Separate intervals
              preserve pauses. Records must be in the past and must not overlap.
            </p>
            {parts.map((part, index) => (
              <div
                key={index}
                className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_auto]"
              >
                <Field label={`Start ${index + 1}`}>
                  <Input
                    type="datetime-local"
                    step="1"
                    value={part.start}
                    onChange={(e) =>
                      setParts(
                        parts.map((item, i) =>
                          i === index
                            ? { ...item, start: e.target.value }
                            : item,
                        ),
                      )
                    }
                  />
                </Field>
                <Field label={`End ${index + 1}`}>
                  <Input
                    type="datetime-local"
                    step="1"
                    value={part.end}
                    onChange={(e) =>
                      setParts(
                        parts.map((item, i) =>
                          i === index ? { ...item, end: e.target.value } : item,
                        ),
                      )
                    }
                  />
                </Field>
                <Button
                  variant="ghost"
                  disabled={parts.length === 1}
                  onClick={() => setParts(parts.filter((_, i) => i !== index))}
                >
                  Remove
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              onClick={() => setParts([...parts, { start: '', end: '' }])}
            >
              Add interval
            </Button>
          </>
        )}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <div className="flex gap-3">
          <Button onClick={() => void save()}>Save record</Button>
          <Button variant="ghost" onClick={close}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
