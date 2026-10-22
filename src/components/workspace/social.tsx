import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import { Input } from '../ui/input'
import {
  DateFilter,
  Empty,
  Field,
  PageTitle,
  Pagination,
  Select,
  Stat,
  useWorkspace,
} from '../workspace'
import { getAppData } from '@/lib/app-api'
import {
  formatDuration,
  dayAt,
  shiftDay,
  shiftMonth,
  weekStart,
} from '@/lib/time'

export function SocialPage() {
  const { data, search, run, now } = useWorkspace()
  const query = useQuery({
    queryKey: ['tally', 'social', search],
    queryFn: async () => {
      const result = await getAppData({ data: { ...search, view: 'social' } })
      if (result.view !== 'social') throw new Error('Unexpected response')
      return result.data
    },
    refetchInterval: 60000,
    refetchOnWindowFocus: 'always',
    refetchOnReconnect: 'always',
  })
  const badges = useQuery({
    queryKey: ['tally', 'challenges', search.memberId],
    queryFn: async () => {
      const result = await getAppData({
        data: { view: 'challenges', memberId: search.memberId },
      })
      if (result.view !== 'challenges') throw new Error('Unexpected response')
      return result.data
    },
    enabled: Boolean(search.memberId),
  })
  const today = dayAt(now, query.data?.zone ?? data.member.timeZone)
  const social = query.data,
    ownId = data.member.userId
  return (
    <>
      <PageTitle
        title={
          search.tab === 'friends'
            ? 'A little shared momentum.'
            : 'Focus, together.'
        }
        detail="Only approved group members are visible. Statistics require leaderboard opt-in; private titles, notes, tasks, and logs stay private."
      />
      {!social ? (
        query.isError ? (
          <p role="alert">
            Could not load group members.{' '}
            <Button variant="outline" onClick={() => void query.refetch()}>
              Retry
            </Button>
          </p>
        ) : (
          <p role="status">Loading group…</p>
        )
      ) : (
        <>
          <p className="mb-5 text-xs text-muted-foreground">
            Group calendar: {social.zone}. Eligible, finalized, unedited timer
            focus only. No duration cutoff.
          </p>
          {social.profile && (
            <Card className="mb-7">
              <CardContent className="space-y-4 p-6">
                <h2 className="text-xl font-semibold">
                  {social.profile.displayName}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {[social.profile.country, social.profile.primaryFocus]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
                <p className="whitespace-pre-wrap text-sm">
                  {social.profile.bio || 'No bio yet.'}
                </p>
                {social.profile.stats ? (
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Stat
                      label="Selected period"
                      value={formatDuration(social.profile.stats.durationMs)}
                    />
                    <Stat
                      label="Lifetime eligible"
                      value={formatDuration(
                        social.profile.stats.lifetimeDurationMs,
                      )}
                    />
                    <Stat
                      label="Current streak"
                      value={`${social.profile.stats.streak.current} days`}
                    />
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    This member’s statistics are private.
                  </p>
                )}
                <p className="text-sm">
                  {social.profile.receivedKudos} kudos today
                </p>
                {badges.data?.community
                  .filter(
                    (entry) =>
                      entry.memberId === social.profile!.id && entry.complete,
                  )
                  .map((entry) => (
                    <p
                      key={entry.id}
                      className="rounded-lg bg-accent p-3 text-sm text-primary"
                    >
                      Achievement: {entry.title} · {entry.days} qualifying days
                    </p>
                  ))}
              </CardContent>
            </Card>
          )}
          {search.tab === 'leaderboards' ? (
            <>
              <div className="mb-6 grid gap-4 sm:grid-cols-3">
                <Stat
                  label="Your eligible time"
                  value={formatDuration(social.own.durationMs)}
                />
                <Stat
                  label="Your ranked streak"
                  value={`${social.own.streak.current} days`}
                />
                <Stat
                  label="Visibility"
                  value={data.member.leaderboardOptIn ? 'Sharing' : 'Private'}
                  detail="Change in Settings"
                />
              </div>
              <p className="mb-4 text-sm text-muted-foreground">
                Your rank: {social.own.rank ?? 'Unranked'} · {social.range.from}{' '}
                through {social.range.to} (exclusive)
              </p>
              <nav
                className="mb-5 flex flex-wrap gap-3 text-sm"
                aria-label="Ranking periods"
              >
                {[
                  ['Day', today, shiftDay(today, 1)],
                  ['Week', weekStart(today), shiftDay(weekStart(today), 7)],
                  [
                    'Month',
                    `${today.slice(0, 7)}-01`,
                    shiftMonth(`${today.slice(0, 7)}-01`, 1),
                  ],
                  [
                    'Year',
                    `${today.slice(0, 4)}-01-01`,
                    `${Number(today.slice(0, 4)) + 1}-01-01`,
                  ],
                ].map(([label, from, to]) => (
                  <Link
                    key={label}
                    to="/workspace"
                    search={{ ...search, page: 0, from, to, period: 'range' }}
                    className="rounded-lg border bg-card px-4 py-2"
                  >
                    {label}
                  </Link>
                ))}
                <Link
                  to="/workspace"
                  search={{ ...search, page: 0, period: 'all' }}
                  className="rounded-lg border bg-card px-4 py-2"
                >
                  All time
                </Link>
              </nav>
              <DateFilter />
              <form
                action="/workspace"
                className="mb-6 flex flex-wrap items-end gap-3"
              >
                <input type="hidden" name="tab" value="leaderboards" />
                {search.from && (
                  <input type="hidden" name="from" value={search.from} />
                )}
                {search.to && (
                  <input type="hidden" name="to" value={search.to} />
                )}
                <Field label="Rank by">
                  <Select name="ranking" defaultValue={search.ranking}>
                    <option value="time">Focus time</option>
                    <option value="streak">Current streak</option>
                    <option value="best-streak">Best streak</option>
                  </Select>
                </Field>
                <Field label="Period">
                  <Select name="period" defaultValue={search.period}>
                    <option value="range">Selected date range</option>
                    <option value="all">All time</option>
                  </Select>
                </Field>
                <Field label="Country">
                  <Input
                    name="country"
                    defaultValue={search.country}
                    placeholder="All countries"
                    maxLength={60}
                  />
                </Field>
                <label className="mb-3 flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="friendsOnly"
                    value="true"
                    defaultChecked={search.friendsOnly}
                  />
                  Friends only
                </label>
                <Button variant="outline">Apply filters</Button>
              </form>
              {social.rankings.length ? (
                <div className="overflow-auto rounded-xl border bg-card">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b text-muted-foreground">
                        <th className="p-4">Rank</th>
                        <th className="p-4">Member</th>
                        <th className="p-4">Focus</th>
                        <th className="p-4">Streak</th>
                        <th className="p-4">Kudos today</th>
                      </tr>
                    </thead>
                    <tbody>
                      {social.rankings.map((member) => (
                        <tr key={member.id} className="border-b last:border-0">
                          <td className="p-4 font-semibold">{member.rank}</td>
                          <td className="p-4">
                            <Link
                              to="/workspace"
                              search={{ ...search, memberId: member.id }}
                              className="font-medium text-primary underline"
                            >
                              {member.displayName}
                              {member.id === ownId && ' (you)'}
                            </Link>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {member.country}
                            </p>
                          </td>
                          <td className="whitespace-nowrap p-4 tabular-nums">
                            {formatDuration(member.durationMs)}
                          </td>
                          <td className="p-4">{member.streak.current} days</td>
                          <td className="p-4">
                            {member.id === ownId ? (
                              member.receivedKudos
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  void run({
                                    action: member.gaveKudos
                                      ? 'retract-kudos'
                                      : 'give-kudos',
                                    memberId: member.id,
                                  })
                                }
                              >
                                {member.gaveKudos ? 'Retract' : 'Give kudos'} ·{' '}
                                {member.receivedKudos}
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Empty>No opted-in members match these filters.</Empty>
              )}
              <Pagination total={social.totalRanked} />
            </>
          ) : (
            <>
              <form
                action="/workspace"
                className="mb-6 flex flex-wrap items-end gap-3"
              >
                <input type="hidden" name="tab" value="friends" />
                <Field label="Find a member">
                  <Input
                    name="search"
                    defaultValue={search.search}
                    placeholder="Name, country, focus"
                    maxLength={100}
                  />
                </Field>
                <Button variant="outline">Search</Button>
              </form>
              <h2 className="mb-4 text-lg font-semibold">
                Requests and connections
              </h2>
              <p className="mb-5 text-sm text-muted-foreground">
                {
                  social.relations.filter(
                    (relation) => relation.status === 'accepted',
                  ).length
                }{' '}
                friends ·{' '}
                {
                  social.relations.filter(
                    (relation) =>
                      relation.status === 'pending' &&
                      relation.requesterId !== ownId,
                  ).length
                }{' '}
                incoming requests
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                {social.members
                  .filter((member) => member.id !== ownId)
                  .map((member) => (
                    <Card key={member.id}>
                      <CardContent className="space-y-4 p-5">
                        <div className="flex items-center gap-3">
                          <span
                            aria-hidden="true"
                            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent font-semibold text-primary"
                          >
                            {member.displayName.slice(0, 2).toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <Link
                              to="/workspace"
                              search={{ ...search, memberId: member.id }}
                              className="break-words font-semibold text-primary underline"
                            >
                              {member.displayName}
                            </Link>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {[member.country, member.primaryFocus]
                                .filter(Boolean)
                                .join(' · ') || 'Group member'}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {member.relation?.status === 'accepted'
                            ? 'Friends'
                            : member.relation?.status === 'pending'
                              ? member.relation.requesterId === ownId
                                ? 'Request sent'
                                : 'Wants to connect with you'
                              : 'Not connected'}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {!member.relation ? (
                            <Button
                              size="sm"
                              onClick={() =>
                                void run({
                                  action: 'request-friend',
                                  memberId: member.id,
                                })
                              }
                            >
                              Add friend
                            </Button>
                          ) : (
                            <>
                              {member.relation.status === 'pending' &&
                                member.relation.requesterId !== ownId && (
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      void run({
                                        action: 'accept-friend',
                                        memberId: member.id,
                                      })
                                    }
                                  >
                                    Accept request
                                  </Button>
                                )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  void run({
                                    action: 'remove-friend',
                                    memberId: member.id,
                                  })
                                }
                              >
                                {member.relation.status === 'accepted'
                                  ? 'Remove friend'
                                  : member.relation.requesterId === ownId
                                    ? 'Cancel request'
                                    : 'Decline request'}
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              void run({
                                action: member.gaveKudos
                                  ? 'retract-kudos'
                                  : 'give-kudos',
                                memberId: member.id,
                              })
                            }
                          >
                            {member.gaveKudos ? 'Retract kudos' : 'Give kudos'}{' '}
                            ({member.receivedKudos})
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
              {social.members.filter((member) => member.id !== ownId).length ===
                0 && <Empty>No other members match your search.</Empty>}
              <Pagination total={social.totalMembers} />
            </>
          )}
        </>
      )}
    </>
  )
}
