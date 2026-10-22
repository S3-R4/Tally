import { afterEach, describe, expect, it, vi } from 'vitest'
import { and, eq } from 'drizzle-orm'
import { featureFixture, now, input, tracked, view } from './feature-fixture'
import { mutatePlanning, planning } from '../src/lib/server/planning'
import {
  workspace,
  exportData,
  mutateSettings,
} from '../src/lib/server/reporting'
import { mutateSocial, social, discoverMembers } from '../src/lib/server/social'
import { challengeData, mutateChallenge } from '../src/lib/server/challenges'
import { mutateTime, records } from '../src/lib/server/time-records'
import { dayStart, dayAt } from '../src/lib/time'
import {
  members,
  tasks,
  friendships,
  kudos,
  focusSessions,
  user,
} from '../src/lib/server/schema'

afterEach(() => vi.unstubAllEnvs())
function allowed() {
  vi.stubEnv(
    'TALLY_ALLOWED_EMAILS',
    'alpha@example.com,beta@example.com,gamma@example.com',
  )
}
describe('planning, reports, and owned data', () => {
  it('persists task order and archive history while rejecting cross-owner links', () => {
    const { db, sqlite } = featureFixture()
    mutatePlanning(
      db,
      'alpha',
      input({ action: 'save-tag', name: 'Work', color: '#0d9488' }),
      now,
    )
    const tag = planning(db, 'alpha').tags[0]
    for (const title of ['One', 'Two'])
      mutatePlanning(
        db,
        'alpha',
        input({
          action: 'save-task',
          title,
          description: '**note**',
          estimateMinutes: 30,
          tagId: tag.id,
          status: 'todo',
        }),
        now,
      )
    const [one, two] = planning(db, 'alpha').tasks
    mutatePlanning(
      db,
      'alpha',
      input({
        action: 'move-task',
        id: two.id,
        status: 'todo',
        beforeId: one.id,
      }),
      now,
    )
    expect(planning(db, 'alpha').tasks.map((task) => task.title)).toEqual([
      'Two',
      'One',
    ])
    expect(() =>
      mutatePlanning(
        db,
        'beta',
        input({
          action: 'move-task',
          id: one.id,
          status: 'done',
          beforeId: null,
        }),
        now,
      ),
    ).toThrow('not found')
    expect(() =>
      mutatePlanning(
        db,
        'beta',
        input({
          action: 'save-task',
          title: 'bad',
          description: '',
          estimateMinutes: 0,
          tagId: tag.id,
          status: 'todo',
        }),
        now,
      ),
    ).toThrow('unavailable')
    mutatePlanning(
      db,
      'alpha',
      input({ action: 'archive-task', id: one.id, archived: true }),
      now,
    )
    expect(
      db.select().from(tasks).where(eq(tasks.id, one.id)).get()?.archivedAtMs,
    ).toBe(now)
    sqlite.close()
  })
  it('deduplicates range session counts and splits personal totals across local midnight', () => {
    const { db, sqlite } = featureFixture()
    const midnight = dayStart('2026-10-15', 'Europe/Berlin')
    tracked(db, 'alpha', midnight - 600000, midnight + 600000)
    mutateTime(
      db,
      'alpha',
      input({
        action: 'manual',
        title: '',
        note: '',
        taskId: null,
        tagId: null,
        parts: [{ startAtMs: midnight + 600000, endAtMs: midnight + 900000 }],
      }),
      now,
    )
    const result = workspace(
      db,
      'alpha',
      view({ from: '2026-10-14', to: '2026-10-16' }),
      now,
    )
    expect(result.report.rangeDurationMs).toBe(1500000)
    expect(result.report.sessionCount).toBe(2)
    expect(result.report.daySessions).toEqual({
      '2026-10-14': 1,
      '2026-10-15': 2,
    })
    expect(result.report.streak.current).toBe(2)
    expect(
      workspace(
        db,
        'alpha',
        view({ from: '2026-10-15', to: '2026-10-16', recordType: 'manual' }),
        now,
      ).sessions,
    ).toHaveLength(1)
    sqlite.close()
  })
  it('exports private records safely and isolates reset and account deletion', () => {
    allowed()
    const { db, sqlite } = featureFixture()
    tracked(db, 'alpha', now - 600000, now)
    tracked(db, 'beta', now - 600000, now)
    mutatePlanning(
      db,
      'alpha',
      input({
        action: 'save-task',
        title: 'Kept task',
        description: '',
        estimateMinutes: 0,
        tagId: null,
        status: 'todo',
      }),
      now,
    )
    mutateSocial(
      db,
      'alpha',
      input({ action: 'request-friend', memberId: 'beta' }),
      now,
    )
    const csv = exportData(db, 'alpha', 'csv', now)
    expect(csv).toContain('"\'=PRIVATE TITLE"')
    const json = JSON.parse(exportData(db, 'alpha', 'json', now))
    expect(json.schemaVersion).toBe(1)
    expect(json.sessions).toHaveLength(1)
    expect(json.sessions[0].userId).toBe('alpha')
    expect(Object.keys(json)).not.toContain('account')
    expect(() =>
      mutateSettings(
        db,
        'alpha',
        input({ action: 'reset', confirmation: 'yes' }),
      ),
    ).toThrow('confirmation')
    mutateSettings(
      db,
      'alpha',
      input({ action: 'reset', confirmation: 'RESET FOCUS' }),
    )
    expect(records(db, 'alpha')).toHaveLength(0)
    expect(planning(db, 'alpha').tasks).toHaveLength(1)
    expect(db.select().from(friendships).all()).toHaveLength(1)
    expect(records(db, 'beta')).toHaveLength(1)
    mutateSettings(
      db,
      'alpha',
      input({ action: 'delete-account', confirmation: 'DELETE ACCOUNT' }),
    )
    expect(
      db.select().from(user).where(eq(user.id, 'alpha')).get(),
    ).toBeUndefined()
    expect(db.select().from(friendships).all()).toHaveLength(0)
    expect(records(db, 'beta')).toHaveLength(1)
    sqlite.close()
  })
})
describe('social privacy and challenge eligibility', () => {
  it('enforces opt-in, revoked membership, equal ranks, and long unedited timer eligibility', () => {
    allowed()
    const { db, sqlite } = featureFixture()
    tracked(db, 'alpha', now - 4 * 3600000, now)
    tracked(db, 'beta', now - 4 * 3600000, now)
    db.update(members)
      .set({ leaderboardOptIn: true })
      .where(eq(members.userId, 'alpha'))
      .run()
    let result = social(db, 'gamma', view({ view: 'social' }), now)
    expect(result.rankings.map((row) => row.id)).toEqual(['alpha'])
    expect(result.rankings[0].durationMs).toBe(4 * 3600000)
    const wire = JSON.stringify(result)
    expect(wire).not.toContain('@example.com')
    expect(wire).not.toContain('PRIVATE TITLE')
    expect(wire).not.toContain('PRIVATE NOTE')
    expect(
      social(db, 'alpha', view({ view: 'social', memberId: 'beta' }), now)
        .profile?.stats,
    ).toBeNull()
    db.update(members)
      .set({ leaderboardOptIn: true })
      .where(eq(members.userId, 'beta'))
      .run()
    result = social(db, 'gamma', view({ view: 'social' }), now)
    expect(result.rankings.map((row) => row.rank)).toEqual([1, 1])
    const beta = records(db, 'beta')[0]
    mutateTime(
      db,
      'beta',
      input({
        action: 'correct',
        id: beta.id,
        expectedRevision: beta.revision,
        parts: [{ startAtMs: now - 4 * 3600000, endAtMs: now }],
      }),
      now,
    )
    expect(
      social(db, 'gamma', view({ view: 'social' }), now).rankings.find(
        (row) => row.id === 'beta',
      )?.durationMs,
    ).toBe(0)
    vi.stubEnv('TALLY_ALLOWED_EMAILS', 'beta@example.com,gamma@example.com')
    expect(discoverMembers(db).some((row) => row.id === 'alpha')).toBe(false)
    expect(
      social(
        db,
        'gamma',
        view({ view: 'social', period: 'all' }),
        now,
      ).rankings.some((row) => row.id === 'alpha'),
    ).toBe(false)
    sqlite.close()
  })
  it('accepts crossed friendship requests and deduplicates retractable daily kudos', () => {
    allowed()
    const { db, sqlite } = featureFixture()
    mutateSocial(
      db,
      'alpha',
      input({ action: 'request-friend', memberId: 'beta' }),
      now,
    )
    mutateSocial(
      db,
      'beta',
      input({ action: 'request-friend', memberId: 'alpha' }),
      now,
    )
    expect(
      db
        .select()
        .from(friendships)
        .all()
        .map((row) => row.status),
    ).toEqual(['accepted'])
    const request = input({ action: 'give-kudos', memberId: 'beta' })
    mutateSocial(db, 'alpha', request, now)
    mutateSocial(db, 'alpha', request, now)
    expect(db.select().from(kudos).all()).toHaveLength(1)
    expect(() =>
      mutateSocial(
        db,
        'alpha',
        input({ action: 'give-kudos', memberId: 'alpha' }),
        now,
      ),
    ).toThrow('another member')
    mutateSocial(
      db,
      'alpha',
      input({ action: 'retract-kudos', memberId: 'beta' }),
      now,
    )
    expect(db.select().from(kudos).all()).toHaveLength(0)
    sqlite.close()
  })
  it('enrolls monthly once, deduplicates custom creation, separates sharing, and recalculates badges', () => {
    allowed()
    const { db, sqlite } = featureFixture()
    const monthly = challengeData(db, 'alpha', now).monthlyId
    for (let count = 0; count < 2; count++)
      mutateChallenge(
        db,
        'alpha',
        input({ action: 'join-challenge', id: monthly, shareResults: false }),
        now,
      )
    const custom = input({
      action: 'create-challenge',
      requestId: 'custom',
      title: 'One day',
      days: 1,
      dailyMinutes: 25,
      startDay: dayAt(now, 'Europe/Berlin'),
      shareResults: true,
    })
    mutateChallenge(db, 'alpha', custom, now)
    mutateChallenge(db, 'alpha', custom, now)
    expect(
      challengeData(db, 'alpha', now).own.filter(
        (row) => row.kind === 'custom',
      ),
    ).toHaveLength(1)
    expect(() =>
      mutateChallenge(
        db,
        'alpha',
        input({ ...custom, requestId: 'different' }),
        now,
      ),
    ).toThrow('active custom')
    const id = tracked(db, 'alpha', now - 25 * 60000, now)
    let result = challengeData(db, 'alpha', now)
    expect(
      result.own.find((row) => row.id === monthly)?.progress.qualifiedDays,
    ).toBe(1)
    expect(result.community).toHaveLength(1)
    expect(result.community[0].complete).toBe(true)
    expect(
      db.select().from(members).where(eq(members.userId, 'alpha')).get()
        ?.leaderboardOptIn,
    ).toBe(false)
    mutateTime(
      db,
      'alpha',
      input({
        action: 'correct',
        id,
        expectedRevision: 1,
        parts: [{ startAtMs: now - 25 * 60000, endAtMs: now }],
      }),
      now,
    )
    result = challengeData(db, 'alpha', now)
    expect(result.community[0].complete).toBe(false)
    const customId = result.own.find((row) => row.kind === 'custom')!.id
    mutateChallenge(
      db,
      'alpha',
      input({ action: 'share-challenge', id: customId, shareResults: false }),
      now,
    )
    expect(challengeData(db, 'beta', now).community).toHaveLength(0)
    expect(() =>
      mutateChallenge(
        db,
        'beta',
        input({ action: 'join-challenge', id: customId, shareResults: false }),
        now,
      ),
    ).toThrow('not found')
    expect(
      db
        .select()
        .from(focusSessions)
        .where(
          and(
            eq(focusSessions.userId, 'alpha'),
            eq(focusSessions.timingEdited, true),
          ),
        )
        .all(),
    ).toHaveLength(1)
    sqlite.close()
  })
})
