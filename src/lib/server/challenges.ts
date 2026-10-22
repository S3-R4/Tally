import { randomUUID } from 'node:crypto'
import { and, eq, isNull } from 'drizzle-orm'
import type { AppDatabase } from './db'
import { challenges, participations, instance, commands } from './schema'
import { dayAt, shiftDay, dayStart } from '../time'
import { focusSummary } from './reporting'
import { discoverMembers } from './social'
import { reconcile } from './time-records'
import { fail } from './domain'
import type { MutationInput } from '../inputs'

export function monthlyChallenge(db: AppDatabase, now: number) {
  const zone = db.select().from(instance).get()!.timeZone
  const startDay = `${dayAt(now, zone).slice(0, 7)}-01`
  const date = new Date(dayStart(startDay, 'UTC'))
  const days = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0),
  ).getUTCDate()
  db.insert(challenges)
    .values({
      id: randomUUID(),
      kind: 'monthly',
      title: `${startDay.slice(0, 7)} · Daily focus`,
      startDay,
      days,
      dailyMinutes: 25,
      timeZone: zone,
    })
    .onConflictDoNothing()
    .run()
  return db
    .select()
    .from(challenges)
    .where(
      and(eq(challenges.kind, 'monthly'), eq(challenges.startDay, startDay)),
    )
    .get()!
}
export function challengeData(
  db: AppDatabase,
  userId: string,
  now: number,
  page = 0,
  memberId?: string,
) {
  reconcile(db, now)
  const monthly = monthlyChallenge(db, now)
  const allowed = discoverMembers(db)
  const definitions = db.select().from(challenges).all()
  const entries = db
    .select()
    .from(participations)
    .all()
    .filter((part) => allowed.some((member) => member.id === part.userId))
  const summaries = new Map<string, ReturnType<typeof focusSummary>>()
  function progress(
    definition: (typeof definitions)[number],
    memberId: string,
  ) {
    const key = `${memberId}:${definition.timeZone}`
    if (!summaries.has(key))
      summaries.set(
        key,
        focusSummary(db, memberId, definition.timeZone, now, true),
      )
    const days = summaries.get(key)!.days
    const calendar = Array.from({ length: definition.days }, (_, i) => {
      const day = shiftDay(definition.startDay, i)
      return {
        day,
        durationMs: days[day] ?? 0,
        qualified: (days[day] ?? 0) >= definition.dailyMinutes * 60_000,
      }
    })
    const qualifiedDays = calendar.filter((day) => day.qualified).length
    return {
      calendar,
      qualifiedDays,
      complete: qualifiedDays === definition.days,
      ended:
        dayAt(now, definition.timeZone) >=
        shiftDay(definition.startDay, definition.days),
    }
  }
  const own = definitions
    .filter(
      (def) =>
        def.id === monthly.id ||
        def.ownerId === userId ||
        entries.some(
          (part) => part.userId === userId && part.challengeId === def.id,
        ),
    )
    .map((def) => {
      const enrollment =
        entries.find(
          (part) => part.userId === userId && part.challengeId === def.id,
        ) ?? null
      return { ...def, enrollment, progress: progress(def, userId) }
    })
    .sort((a, b) => b.startDay.localeCompare(a.startDay))
  const community = entries
    .filter(
      (entry) =>
        entry.shareResults &&
        entry.cancelledAtMs === null &&
        (!memberId || entry.userId === memberId),
    )
    .map((entry) => {
      const definition = definitions.find(
        (def) => def.id === entry.challengeId,
      )!
      const result = progress(definition, entry.userId)
      const member = allowed.find((row) => row.id === entry.userId)!
      return {
        id: entry.id,
        challengeId: definition.id,
        title: definition.title,
        kind: definition.kind,
        startDay: definition.startDay,
        days: definition.days,
        dailyMinutes: definition.dailyMinutes,
        displayName: member.displayName,
        memberId: member.id,
        qualifiedDays: result.qualifiedDays,
        complete: result.complete,
        ended: result.ended,
      }
    })
  return {
    monthlyId: monthly.id,
    zone: monthly.timeZone,
    totalOwn: own.length,
    totalCommunity: community.length,
    own: own.slice(page * 50, (page + 1) * 50),
    community: community
      .sort((a, b) => b.startDay.localeCompare(a.startDay))
      .slice(page * 50, (page + 1) * 50),
  }
}
export function mutateChallenge(
  db: AppDatabase,
  userId: string,
  input: MutationInput,
  now: number,
) {
  return db.transaction((tx) => {
    const monthly = monthlyChallenge(tx, now)
    if (input.action === 'create-challenge') {
      const previous = tx
        .select()
        .from(commands)
        .where(
          and(
            eq(commands.userId, userId),
            eq(commands.requestId, input.requestId),
          ),
        )
        .get()
      if (previous) {
        if (previous.fingerprint !== JSON.stringify(input))
          fail('CONFLICT', 'Request identifier already used.')
        return
      }

      const today = dayAt(now, monthly.timeZone)
      if (input.startDay !== today && input.startDay !== shiftDay(today, 1))
        fail(
          'INVALID_INPUT',
          'A custom challenge must start today or tomorrow in the group time zone.',
        )
      const active = tx
        .select({ startDay: challenges.startDay, days: challenges.days })
        .from(challenges)
        .innerJoin(
          participations,
          eq(participations.challengeId, challenges.id),
        )
        .where(
          and(
            eq(challenges.ownerId, userId),
            eq(challenges.kind, 'custom'),
            eq(participations.userId, userId),
            isNull(participations.cancelledAtMs),
          ),
        )
        .all()
      if (active.some((entry) => shiftDay(entry.startDay, entry.days) > today))
        fail('CONFLICT', 'Finish or cancel your active custom challenge first.')
      const id = randomUUID()
      tx.insert(challenges)
        .values({
          id,
          ownerId: userId,
          kind: 'custom',
          title: input.title,
          startDay: input.startDay,
          days: input.days,
          dailyMinutes: input.dailyMinutes,
          timeZone: monthly.timeZone,
        })
        .run()
      tx.insert(participations)
        .values({
          id: randomUUID(),
          userId,
          challengeId: id,
          shareResults: input.shareResults,
        })
        .run()
      tx.insert(commands)
        .values({
          userId,
          requestId: input.requestId,
          fingerprint: JSON.stringify(input),
          result: { challengeId: id },
        })
        .run()
    } else if (
      input.action === 'join-challenge' ||
      input.action === 'share-challenge' ||
      input.action === 'cancel-challenge'
    ) {
      const definition = tx
        .select()
        .from(challenges)
        .where(eq(challenges.id, input.id))
        .get()
      if (
        !definition ||
        (definition.kind === 'custom' && definition.ownerId !== userId)
      )
        fail('NOT_FOUND', 'Challenge not found.')
      const where = and(
        eq(participations.userId, userId),
        eq(participations.challengeId, input.id),
      )
      const entry = tx.select().from(participations).where(where).get()
      if (input.action === 'join-challenge') {
        if (
          dayAt(now, definition.timeZone) >=
          shiftDay(definition.startDay, definition.days)
        )
          fail('CONFLICT', 'This challenge has ended.')
        if (definition.kind === 'custom')
          fail('CONFLICT', 'Create a new custom challenge to begin again.')
        if (entry)
          tx.update(participations)
            .set({ cancelledAtMs: null, shareResults: input.shareResults })
            .where(where)
            .run()
        else
          tx.insert(participations)
            .values({
              id: randomUUID(),
              challengeId: input.id,
              userId,
              shareResults: input.shareResults,
            })
            .run()
      } else {
        if (!entry) fail('NOT_FOUND', 'Enrollment not found.')
        tx.update(participations)
          .set(
            input.action === 'share-challenge'
              ? { shareResults: input.shareResults }
              : { cancelledAtMs: now, shareResults: false },
          )
          .where(where)
          .run()
      }
    } else fail('INVALID_INPUT', 'Unknown challenge operation.')
  })
}
