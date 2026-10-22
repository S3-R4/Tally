import { randomUUID } from 'node:crypto'
import { and, eq, or } from 'drizzle-orm'
import type { AppDatabase } from './db'
import { members, user, friendships, kudos, instance } from './schema'
import { isAllowedEmail } from './config'
import { fail } from './domain'
import { calendarRange, focusSummary } from './reporting'
import { reconcile } from './time-records'
import { dayAt, dayStart, splitDays, shiftDay } from '../time'
import type { MutationInput, ViewInput } from '../inputs'

export function discoverMembers(db: AppDatabase) {
  return db
    .select({
      id: members.userId,
      displayName: members.displayName,
      country: members.country,
      primaryFocus: members.primaryFocus,
      bio: members.bio,
      leaderboardOptIn: members.leaderboardOptIn,
      email: user.email,
      verified: user.emailVerified,
      image: user.image,
    })
    .from(members)
    .innerJoin(user, eq(user.id, members.userId))
    .all()
    .filter((row) => row.verified && isAllowedEmail(row.email))
    .map((row) => ({
      id: row.id,
      displayName: row.displayName,
      country: row.country,
      primaryFocus: row.primaryFocus,
      bio: row.bio,
      leaderboardOptIn: row.leaderboardOptIn,
      image: row.image,
    }))
}
export function social(
  db: AppDatabase,
  userId: string,
  input: ViewInput,
  now: number,
) {
  reconcile(db, now)
  const zone = db.select().from(instance).get()!.timeZone
  const range =
    input.period === 'all'
      ? {
          from: '1970-01-01',
          to: shiftDay(dayAt(now, zone), 1),
          fromAtMs: 0,
          toAtMs: dayStart(shiftDay(dayAt(now, zone), 1), zone),
        }
      : calendarRange(input, zone, now)
  const allMembers = discoverMembers(db)
  const relations = db
    .select()
    .from(friendships)
    .where(
      or(eq(friendships.firstId, userId), eq(friendships.secondId, userId)),
    )
    .all()
    .filter((row) =>
      allMembers.some(
        (member) =>
          member.id === (row.firstId === userId ? row.secondId : row.firstId),
      ),
    )
  const friends = new Set(
    relations
      .filter((row) => row.status === 'accepted')
      .map((row) => (row.firstId === userId ? row.secondId : row.firstId)),
  )
  const today = dayAt(now, zone)
  const todayKudos = db.select().from(kudos).where(eq(kudos.day, today)).all()
  const safeMembers = allMembers.map((member) => ({
    ...member,
    relation:
      relations.find(
        (row) => row.firstId === member.id || row.secondId === member.id,
      ) ?? null,
    gaveKudos: todayKudos.some(
      (row) => row.senderId === userId && row.recipientId === member.id,
    ),
    receivedKudos: todayKudos.filter(
      (row) =>
        row.recipientId === member.id &&
        allMembers.some((m) => m.id === row.senderId),
    ).length,
  }))
  function stats(id: string) {
    const summary = focusSummary(db, id, zone, now, true)
    const ms = Object.values(
      splitDays(
        summary.focus.flatMap((row) => row.intervals),
        zone,
        range.fromAtMs,
        Math.min(now, range.toAtMs),
      ),
    ).reduce((a, b) => a + b, 0)
    return {
      durationMs: ms,
      streak: summary.streak,
      lifetimeDurationMs: summary.lifetimeDurationMs,
    }
  }
  const ranked = safeMembers
    .filter(
      (member) =>
        member.leaderboardOptIn &&
        (!input.friendsOnly ||
          friends.has(member.id) ||
          member.id === userId) &&
        (!input.country ||
          member.country.toLowerCase() === input.country.toLowerCase()),
    )
    .map((member) => ({ ...member, ...stats(member.id) }))
  const score = (row: (typeof ranked)[number]) =>
    input.ranking === 'time'
      ? row.durationMs
      : input.ranking === 'best-streak'
        ? row.streak.best
        : row.streak.current
  ranked.sort(
    (a, b) =>
      score(b) - score(a) ||
      a.displayName.localeCompare(b.displayName) ||
      a.id.localeCompare(b.id),
  )
  const rankings = ranked.map((row, index) => ({
    ...row,
    rank:
      index === 0 || score(ranked[index - 1]) !== score(row)
        ? index + 1
        : ranked.findIndex((other) => score(other) === score(row)) + 1,
  }))
  const profile = input.memberId
    ? safeMembers.find((member) => member.id === input.memberId)
    : undefined
  return {
    zone,
    range,
    members: safeMembers
      .filter(
        (member) =>
          !input.search ||
          `${member.displayName} ${member.primaryFocus} ${member.country}`
            .toLowerCase()
            .includes(input.search.toLowerCase()),
      )
      .slice(input.page * 50, (input.page + 1) * 50),
    totalMembers: safeMembers.filter(
      (member) =>
        !input.search ||
        `${member.displayName} ${member.primaryFocus} ${member.country}`
          .toLowerCase()
          .includes(input.search.toLowerCase()),
    ).length,
    relations,
    rankings: rankings.slice(input.page * 50, (input.page + 1) * 50),
    totalRanked: rankings.length,
    own: {
      ...stats(userId),
      rank: rankings.find((row) => row.id === userId)?.rank ?? null,
    },
    profile: profile
      ? {
          ...profile,
          stats:
            profile.leaderboardOptIn || profile.id === userId
              ? stats(profile.id)
              : null,
        }
      : null,
  }
}
export function mutateSocial(
  db: AppDatabase,
  userId: string,
  input: MutationInput,
  now: number,
) {
  if (!('memberId' in input)) fail('INVALID_INPUT', 'Unknown social operation.')
  if (input.memberId === userId) fail('INVALID_INPUT', 'Choose another member.')
  if (!discoverMembers(db).some((member) => member.id === input.memberId))
    fail('NOT_FOUND', 'Member not found.')
  const [firstId, secondId] = [userId, input.memberId].sort()
  db.transaction((tx) => {
    const where = and(
      eq(friendships.firstId, firstId),
      eq(friendships.secondId, secondId),
    )
    const row = tx.select().from(friendships).where(where).get()
    if (input.action === 'request-friend') {
      if (!row)
        tx.insert(friendships)
          .values({
            id: randomUUID(),
            firstId,
            secondId,
            requesterId: userId,
            status: 'pending',
          })
          .run()
      else if (row.requesterId !== userId && row.status === 'pending')
        tx.update(friendships).set({ status: 'accepted' }).where(where).run()
    } else if (input.action === 'accept-friend') {
      if (!row || row.requesterId === userId)
        fail('NOT_FOUND', 'Incoming request not found.')
      tx.update(friendships).set({ status: 'accepted' }).where(where).run()
    } else if (input.action === 'remove-friend')
      tx.delete(friendships).where(where).run()
    else if (
      input.action === 'give-kudos' ||
      input.action === 'retract-kudos'
    ) {
      const zone = tx.select().from(instance).get()!.timeZone
      const day = dayAt(now, zone)
      const predicate = and(
        eq(kudos.senderId, userId),
        eq(kudos.recipientId, input.memberId),
        eq(kudos.day, day),
      )
      if (input.action === 'give-kudos')
        tx.insert(kudos)
          .values({
            id: randomUUID(),
            senderId: userId,
            recipientId: input.memberId,
            day,
          })
          .onConflictDoNothing()
          .run()
      else tx.delete(kudos).where(predicate).run()
    } else fail('INVALID_INPUT', 'Unknown social operation.')
  })
}
