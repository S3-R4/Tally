import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card, CardContent } from '../ui/card'
import { Empty, Field, PageTitle, Pagination, useWorkspace } from '../workspace'
import { getAppData } from '@/lib/app-api'
import { dayAt, formatDuration, shiftDay } from '@/lib/time'

export function ChallengesPage() {
  const { run, now, search } = useWorkspace()
  const query = useQuery({
    queryKey: ['tally', 'challenges', search.page],
    queryFn: async () => {
      const result = await getAppData({
        data: { view: 'challenges', page: search.page },
      })
      if (result.view !== 'challenges') throw new Error('Unexpected response')
      return result.data
    },
    refetchInterval: 60000,
    refetchOnWindowFocus: 'always',
    refetchOnReconnect: 'always',
  })
  const [title, setTitle] = useState(''),
    [days, setDays] = useState(7),
    [minutes, setMinutes] = useState(25),
    [tomorrow, setTomorrow] = useState(false),
    [share, setShare] = useState(false)
  const data = query.data
  return (
    <>
      <PageTitle
        title="Build a rhythm that lasts."
        detail="Monthly and personal challenges use unedited timer focus in the group calendar. Enroll explicitly; share results only if you choose."
      />
      {!data ? (
        query.isError ? (
          <p role="alert">
            Could not load challenges.{' '}
            <Button variant="outline" onClick={() => void query.refetch()}>
              Retry
            </Button>
          </p>
        ) : (
          <p role="status">Loading challenges…</p>
        )
      ) : (
        <>
          <p className="mb-6 text-xs text-muted-foreground">
            Group calendar: {data.zone}. Monthly goal: 25 minutes every day.
            Joining during the month includes earlier eligible days.
          </p>
          <div className="space-y-5">
            {data.own.map((challenge) => {
              const enrolled =
                challenge.enrollment &&
                challenge.enrollment.cancelledAtMs === null
              return (
                <Card key={challenge.id}>
                  <CardContent className="space-y-5 p-6">
                    <div className="flex flex-wrap justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-semibold">
                          {challenge.title}
                        </h2>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {challenge.startDay} through{' '}
                          {shiftDay(challenge.startDay, challenge.days - 1)} ·{' '}
                          {challenge.dailyMinutes} min/day · {challenge.days}{' '}
                          days
                        </p>
                      </div>
                      <span className="text-sm font-medium text-primary">
                        {challenge.enrollment?.cancelledAtMs
                          ? 'Cancelled'
                          : !enrolled
                            ? 'Not enrolled'
                            : challenge.progress.complete
                              ? 'Badge earned'
                              : challenge.progress.ended
                                ? 'Finished'
                                : 'In progress'}
                      </span>
                    </div>
                    {enrolled && (
                      <>
                        <progress
                          className="h-3 w-full accent-primary"
                          value={challenge.progress.qualifiedDays}
                          max={challenge.days}
                          aria-label={`${challenge.title} qualifying days`}
                        />
                        <p className="text-sm">
                          {challenge.progress.qualifiedDays} / {challenge.days}{' '}
                          qualifying days
                          {challenge.progress.complete &&
                            ' · Completion badge earned'}
                        </p>
                        <details>
                          <summary className="cursor-pointer text-sm">
                            Daily progress
                          </summary>
                          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-6">
                            {challenge.progress.calendar.map((day) => (
                              <p
                                key={day.day}
                                className={`rounded-lg border p-3 text-xs ${day.qualified ? 'bg-accent text-primary' : 'bg-muted/30'}`}
                              >
                                <span className="block">{day.day}</span>
                                <strong className="mt-2 block">
                                  {day.qualified ? '✓ ' : ''}
                                  {formatDuration(day.durationMs)}
                                </strong>
                              </p>
                            ))}
                          </div>
                        </details>
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={challenge.enrollment!.shareResults}
                            onChange={(e) =>
                              void run({
                                action: 'share-challenge',
                                id: challenge.id,
                                shareResults: e.target.checked,
                              })
                            }
                          />
                          Share this result and badge with the group
                        </label>
                        {!challenge.progress.ended && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (
                                window.confirm(
                                  'Cancel this challenge enrollment and hide its shared result?',
                                )
                              )
                                void run({
                                  action: 'cancel-challenge',
                                  id: challenge.id,
                                })
                            }}
                          >
                            Cancel enrollment
                          </Button>
                        )}
                      </>
                    )}
                    {!enrolled &&
                      challenge.id === data.monthlyId &&
                      !challenge.progress.ended && (
                        <Button
                          onClick={() =>
                            void run({
                              action: 'join-challenge',
                              id: challenge.id,
                              shareResults: false,
                            })
                          }
                        >
                          Join monthly challenge privately
                        </Button>
                      )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
          <section className="mt-10">
            <h2 className="mb-4 text-lg font-semibold">
              Create a personal challenge
            </h2>
            <Card>
              <CardContent className="p-6">
                <form
                  className="space-y-5"
                  onSubmit={async (e) => {
                    e.preventDefault()
                    if (
                      await run({
                        action: 'create-challenge',
                        requestId: crypto.randomUUID(),
                        title,
                        days,
                        dailyMinutes: minutes,
                        startDay: shiftDay(
                          dayAt(now, data.zone),
                          tomorrow ? 1 : 0,
                        ),
                        shareResults: share,
                      })
                    )
                      setTitle('')
                  }}
                >
                  <Field label="Challenge title">
                    <Input
                      value={title}
                      maxLength={100}
                      required
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </Field>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Days">
                      <Input
                        type="number"
                        value={days}
                        min={1}
                        max={366}
                        required
                        onChange={(e) => setDays(Number(e.target.value))}
                      />
                    </Field>
                    <Field label="Daily minutes">
                      <Input
                        type="number"
                        value={minutes}
                        min={1}
                        max={1440}
                        required
                        onChange={(e) => setMinutes(Number(e.target.value))}
                      />
                    </Field>
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={tomorrow}
                      onChange={(e) => setTomorrow(e.target.checked)}
                    />
                    Start tomorrow (otherwise today)
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={share}
                      onChange={(e) => setShare(e.target.checked)}
                    />
                    Share this challenge’s result with the group
                  </label>
                  <Button>Create challenge</Button>
                  <p className="text-xs text-muted-foreground">
                    One active custom challenge at a time. Personal definitions
                    do not create shared rooms.
                  </p>
                </form>
              </CardContent>
            </Card>
          </section>
          <section className="mt-10">
            <h2 className="mb-4 text-lg font-semibold">Community progress</h2>
            {data.community.length ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {data.community.map((entry) => (
                  <Card key={entry.id}>
                    <CardContent className="space-y-2 p-5">
                      <p className="font-semibold">{entry.displayName}</p>
                      <p className="text-sm">{entry.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {entry.qualifiedDays}/{entry.days} days
                        {entry.complete
                          ? ' · Badge earned'
                          : entry.ended
                            ? ' · Ended'
                            : ' · In progress'}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Empty>No shared results yet.</Empty>
            )}
          </section>
          <section className="mt-10">
            <h2 className="mb-4 text-lg font-semibold">Wall of fame</h2>
            {data.community.some((entry) => entry.complete) ? (
              <ul className="space-y-3">
                {data.community
                  .filter((entry) => entry.complete)
                  .map((entry) => (
                    <li
                      key={entry.id}
                      className="rounded-xl border bg-accent p-5 text-sm"
                    >
                      <strong>{entry.displayName}</strong> · {entry.title} ·{' '}
                      {entry.days} qualifying days
                    </li>
                  ))}
              </ul>
            ) : (
              <Empty>Completed, shared challenges appear here.</Empty>
            )}
          </section>
          <Pagination total={Math.max(data.totalOwn, data.totalCommunity)} />
        </>
      )}
    </>
  )
}
