import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { z } from 'zod'
import { mutationInput, viewInput } from './inputs'

export const getAppData = createServerFn({ method: 'GET' })
  .validator((input: unknown) => viewInput.parse(input))
  .handler(async ({ data }) => {
    const [
      { requireMember },
      { database },
      { workspace },
      { social },
      { challengeData },
      { timerState },
    ] = await Promise.all([
      import('./server/member'),
      import('./server/db'),
      import('./server/reporting'),
      import('./server/social'),
      import('./server/challenges'),
      import('./server/time-records'),
    ])
    const member = await requireMember(getRequestHeaders()),
      { db } = database(),
      now = Date.now()
    if (data.view === 'social')
      return {
        view: 'social' as const,
        data: social(db, member.userId, data, now),
      }
    if (data.view === 'challenges')
      return {
        view: 'challenges' as const,
        data: challengeData(db, member.userId, now, data.page, data.memberId),
      }
    return {
      view: 'workspace' as const,
      data: {
        ...workspace(db, member.userId, data, now),
        timer: timerState(db, member.userId, now),
      },
    }
  })
export const changeAppData = createServerFn({ method: 'POST' })
  .validator((input: unknown) => mutationInput.parse(input))
  .handler(async ({ data }) => {
    const [
      { requireMember },
      { database },
      { DomainError },
      time,
      planning,
      reporting,
      social,
      challenge,
    ] = await Promise.all([
      import('./server/member'),
      import('./server/db'),
      import('./server/domain'),
      import('./server/time-records'),
      import('./server/planning'),
      import('./server/reporting'),
      import('./server/social'),
      import('./server/challenges'),
    ])
    const member = await requireMember(getRequestHeaders()),
      { db } = database(),
      now = Date.now()
    try {
      if (
        [
          'start',
          'pause',
          'resume',
          'stop',
          'manual',
          'metadata',
          'correct',
          'delete-session',
          'restore-session',
        ].includes(data.action)
      )
        time.mutateTime(db, member.userId, data, now)
      else if (
        [
          'save-task',
          'archive-task',
          'move-task',
          'save-tag',
          'archive-tag',
        ].includes(data.action)
      )
        planning.mutatePlanning(db, member.userId, data, now)
      else if (['settings', 'reset', 'delete-account'].includes(data.action))
        reporting.mutateSettings(db, member.userId, data)
      else if (
        [
          'request-friend',
          'accept-friend',
          'remove-friend',
          'give-kudos',
          'retract-kudos',
        ].includes(data.action)
      )
        social.mutateSocial(db, member.userId, data, now)
      else challenge.mutateChallenge(db, member.userId, data, now)
      return {
        ok: true as const,
        timer: time.timerState(db, member.userId, now),
      }
    } catch (error) {
      if (error instanceof DomainError)
        return {
          ok: false as const,
          code: error.code,
          message: error.message,
          timer: time.timerState(db, member.userId, now),
        }
      console.error(
        'Tally mutation failed',
        error instanceof Error ? error.name : 'Unknown',
      )
      return {
        ok: false as const,
        code: 'UNAVAILABLE',
        message:
          'The change could not be saved. Reload and check your connection before retrying.',
        timer: time.timerState(db, member.userId, now),
      }
    }
  })
export const downloadData = createServerFn({ method: 'POST' })
  .validator((input: unknown) => z.enum(['csv', 'json']).parse(input))
  .handler(async ({ data }) => {
    const [{ requireMember }, { database }, { exportData }] = await Promise.all(
      [
        import('./server/member'),
        import('./server/db'),
        import('./server/reporting'),
      ],
    )
    const member = await requireMember(getRequestHeaders())
    return exportData(database().db, member.userId, data, Date.now())
  })
