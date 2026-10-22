import { describe, expect, it } from 'vitest'
import { dayStart, splitDays, streaks, eligible } from '../src/lib/time'
import { mutationInput, daySchema, zoneSchema } from '../src/lib/inputs'

describe('shared calendar and eligibility rules', () => {
  it('splits full DST days into 23 and 25 actual hours, including midnight and range clipping', () => {
    for (const [day, next, hours] of [
      ['2026-03-29', '2026-03-30', 23],
      ['2026-10-25', '2026-10-26', 25],
    ] as const) {
      const startAtMs = dayStart(day, 'Europe/Berlin'),
        endAtMs = dayStart(next, 'Europe/Berlin')
      expect(
        splitDays([{ startAtMs, endAtMs }], 'Europe/Berlin', 0, endAtMs),
      ).toEqual({ [day]: hours * 3_600_000 })
      expect(
        splitDays(
          [{ startAtMs: startAtMs - 60000, endAtMs: endAtMs + 60000 }],
          'Europe/Berlin',
          startAtMs,
          endAtMs,
        ),
      ).toEqual({ [day]: hours * 3_600_000 })
    }
  })
  it('keeps a streak current through yesterday and records its best run', () => {
    const days = {
      '2026-10-10': 300000,
      '2026-10-11': 300000,
      '2026-10-12': 299999,
      '2026-10-13': 300000,
      '2026-10-14': 300000,
    }
    expect(streaks(days, '2026-10-15')).toEqual({ current: 2, best: 2 })
    expect(streaks(days, '2026-10-16').current).toBe(0)
    expect(
      eligible({
        source: 'timer',
        kind: 'focus',
        status: 'completed',
        timingEdited: false,
        deletedAtMs: null,
      }),
    ).toBe(true)
    expect(
      eligible({
        source: 'timer',
        kind: 'focus',
        status: 'completed',
        timingEdited: true,
        deletedAtMs: null,
      }),
    ).toBe(false)
  })
  it('rejects malformed boundary inputs', () => {
    expect(daySchema.safeParse('2026-02-30').success).toBe(false)
    expect(zoneSchema.safeParse('Imaginary/Zone').success).toBe(false)
    expect(
      mutationInput.safeParse({ action: 'start', minutes: Infinity }).success,
    ).toBe(false)
  })
})
