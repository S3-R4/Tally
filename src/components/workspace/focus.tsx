import { useState } from 'react'
import { Play, Pause, Square } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card, CardContent } from '../ui/card'
import {
  AssociationFields,
  Field,
  NoteInput,
  PageTitle,
  Select,
  Stat,
  useWorkspace,
} from '../workspace'
import { duration, formatDuration } from '@/lib/time'
import { Markdown } from './markdown'

export function FocusPage() {
  const { data, run, now } = useWorkspace()
  const active = data.timer.active,
    latest = data.timer.latest
  const [mode, setMode] = useState<'countdown' | 'stopwatch'>('countdown')
  const [kind, setKind] = useState<'focus' | 'break'>('focus')
  const [minutes, setMinutes] = useState(data.member.focusMinutes)
  const [rounds, setRounds] = useState(data.member.rounds)
  const [title, setTitle] = useState(''),
    [note, setNote] = useState(''),
    [taskId, setTaskId] = useState(''),
    [tagId, setTagId] = useState('')
  const elapsed = active
    ? duration(
        active.intervals,
        active.status === 'running'
          ? Math.min(now, active.deadlineAtMs ?? now)
          : data.timer.serverAtMs,
      )
    : 0
  const displayMs =
    active?.mode === 'countdown'
      ? Math.max(0, (active.plannedDurationMs ?? 0) - elapsed)
      : elapsed
  const seconds = Math.floor(displayMs / 1000)
  async function start(next?: {
    kind: 'focus' | 'break'
    round: number
    rounds: number
  }) {
    await run({
      action: 'start',
      requestId: crypto.randomUUID(),
      mode: next ? 'countdown' : mode,
      kind: next?.kind ?? kind,
      minutes: next
        ? next.kind === 'focus'
          ? latest!.cycleFocusMinutes
          : latest!.cycleBreakMinutes
        : minutes,
      cycleFocusMinutes: next ? latest!.cycleFocusMinutes : undefined,
      cycleBreakMinutes: next ? latest!.cycleBreakMinutes : undefined,
      round: next?.round ?? 1,
      rounds: next?.rounds ?? rounds,
      title,
      note,
      taskId: taskId || null,
      tagId: tagId || null,
    })
  }
  return (
    <>
      <PageTitle
        title="Make room for focus."
        detail="Choose one thing. Your time is saved on the server, including pauses and interruptions."
      />
      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardContent className="flex min-h-[400px] flex-col items-center justify-center p-6 sm:p-10">
            <p className="text-sm font-medium capitalize text-primary">
              {active
                ? `${active.kind} · Round ${active.round} of ${active.rounds}`
                : 'Ready when you are'}
            </p>
            <div className="my-8 flex size-56 items-center justify-center rounded-full border-[7px] border-primary/15 bg-accent/30 sm:size-64">
              <p
                role="timer"
                aria-label={
                  active ? `${active.kind} ${active.mode}` : 'Timer ready'
                }
                className="font-mono text-5xl font-medium tabular-nums sm:text-6xl"
              >
                {active
                  ? `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
                  : mode === 'stopwatch'
                    ? '00:00'
                    : `${String(minutes).padStart(2, '0')}:00`}
              </p>
            </div>
            {active ? (
              <>
                <p className="mb-5 text-sm text-muted-foreground">
                  {active.status === 'paused'
                    ? 'Paused — no time is being recorded.'
                    : active.title || 'One thing at a time.'}
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Button
                    onClick={() =>
                      void run({
                        action: active.status === 'paused' ? 'resume' : 'pause',
                        id: active.id,
                        expectedRevision: active.revision,
                        requestId: crypto.randomUUID(),
                      })
                    }
                  >
                    {active.status === 'paused' ? <Play /> : <Pause />}
                    {active.status === 'paused' ? 'Resume' : 'Pause'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      void run({
                        action: 'stop',
                        id: active.id,
                        expectedRevision: active.revision,
                        requestId: crypto.randomUUID(),
                      })
                    }
                  >
                    <Square />
                    Finish session
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Button size="lg" onClick={() => void start()}>
                  <Play />
                  Start {kind}
                </Button>
                {latest &&
                  latest.status === 'completed' &&
                  latest.mode === 'countdown' && (
                    <div className="mt-5 text-center">
                      <p className="mb-3 text-xs text-muted-foreground">
                        Last phase finished. The next phase waits for you.
                      </p>
                      {latest.kind === 'focus' ? (
                        <Button
                          variant="outline"
                          onClick={() =>
                            void start({
                              kind: 'break',
                              round: latest.round,
                              rounds: latest.rounds,
                            })
                          }
                        >
                          Start break
                        </Button>
                      ) : latest.round < latest.rounds ? (
                        <Button
                          variant="outline"
                          onClick={() =>
                            void start({
                              kind: 'focus',
                              round: latest.round + 1,
                              rounds: latest.rounds,
                            })
                          }
                        >
                          Start round {latest.round + 1}
                        </Button>
                      ) : (
                        <p className="text-sm text-primary">Cycle complete.</p>
                      )}
                    </div>
                  )}
              </>
            )}
          </CardContent>
        </Card>
        <div className="space-y-6">
          {!active && (
            <Card>
              <CardContent className="space-y-5 p-6">
                <h2 className="font-semibold">Set your intention</h2>
                {(active ?? latest) && (
                  <ActiveNotes
                    key={(active ?? latest)!.id}
                    record={(active ?? latest)!}
                  />
                )}
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Timer mode">
                    <Select
                      value={mode}
                      onChange={(e) =>
                        setMode(
                          e.target.value === 'stopwatch'
                            ? 'stopwatch'
                            : 'countdown',
                        )
                      }
                    >
                      <option value="countdown">Countdown</option>
                      <option value="stopwatch">Stopwatch</option>
                    </Select>
                  </Field>
                  <Field label="Phase">
                    <Select
                      value={kind}
                      onChange={(e) => {
                        const next =
                          e.target.value === 'break' ? 'break' : 'focus'
                        setKind(next)
                        setMinutes(
                          next === 'focus'
                            ? data.member.focusMinutes
                            : data.member.breakMinutes,
                        )
                      }}
                    >
                      <option value="focus">Focus</option>
                      <option value="break">Break</option>
                    </Select>
                  </Field>
                  {mode === 'countdown' && (
                    <Field label="Minutes">
                      <Input
                        type="number"
                        min={1}
                        max={1440}
                        value={minutes}
                        onChange={(e) => setMinutes(Number(e.target.value))}
                      />
                    </Field>
                  )}
                  <Field label="Rounds">
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={rounds}
                      onChange={(e) => setRounds(Number(e.target.value))}
                    />
                  </Field>
                </div>
                <Field label="Session title">
                  <Input
                    value={title}
                    maxLength={200}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="What will you work on?"
                  />
                </Field>
                <AssociationFields
                  taskId={taskId}
                  tagId={tagId}
                  setTaskId={setTaskId}
                  setTagId={setTagId}
                />
                <NoteInput value={note} onChange={setNote} />
              </CardContent>
            </Card>
          )}
          {(active ?? latest) && (
            <ActiveNotes
              key={(active ?? latest)!.id}
              record={(active ?? latest)!}
            />
          )}
          <div className="grid grid-cols-2 gap-4">
            <Stat
              label="Today"
              value={formatDuration(data.report.todayDurationMs)}
              detail={
                data.member.dailyGoalMinutes
                  ? `Goal: ${data.member.dailyGoalMinutes} minutes`
                  : 'Finalized focus'
              }
            />
            <Stat
              label="Current streak"
              value={`${data.report.streak.current} days`}
              detail="5 minutes per day"
            />
          </div>
        </div>
      </div>
    </>
  )
}
function ActiveNotes({
  record: active,
}: {
  record: NonNullable<
    ReturnType<typeof useWorkspace>['data']['timer']['latest']
  >
}) {
  const { run, drafts, setDraft } = useWorkspace()
  const metadataFingerprint = JSON.stringify([
    active.title,
    active.note,
    active.taskId,
    active.tagId,
  ])
  const draft = drafts[active.id] ?? {
    title: active.title,
    note: active.note,
    taskId: active.taskId ?? '',
    tagId: active.tagId ?? '',
    revision: active.revision,
    metadataFingerprint,
  }
  const { title, note, taskId, tagId } = draft
  const setTitle = (title: string) =>
    setDraft(active.id, (current) => ({ ...(current ?? draft), title }))
  const setNote = (note: string) =>
    setDraft(active.id, (current) => ({ ...(current ?? draft), note }))
  const setTaskId = (taskId: string) =>
    setDraft(active.id, (current) => ({ ...(current ?? draft), taskId }))
  const setTagId = (tagId: string) =>
    setDraft(active.id, (current) => ({ ...(current ?? draft), tagId }))
  return (
    <Card>
      <CardContent className="space-y-5 p-6">
        <h2 className="font-semibold">
          {active.status === 'completed'
            ? 'Last session details'
            : 'Session details'}
        </h2>
        <Field
          label={
            active.status === 'completed'
              ? 'Last session title'
              : 'Session title'
          }
        >
          <Input
            value={title}
            maxLength={200}
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
        <NoteInput
          label={
            active.status === 'completed'
              ? 'Last session notes (Markdown)'
              : 'Notes (Markdown)'
          }
          value={note}
          onChange={setNote}
        />
        <Button
          variant="outline"
          onClick={async () => {
            if (
              await run({
                action: 'metadata',
                id: active.id,
                expectedRevision:
                  draft.metadataFingerprint === metadataFingerprint
                    ? active.revision
                    : draft.revision,
                title,
                note,
                taskId: taskId || null,
                tagId: tagId || null,
              })
            )
              setDraft(active.id, null)
          }}
        >
          Save details
        </Button>
        {drafts[active.id] && (
          <Button variant="ghost" onClick={() => setDraft(active.id, null)}>
            Reload saved details
          </Button>
        )}
        {note && <Markdown>{note}</Markdown>}
      </CardContent>
    </Card>
  )
}
