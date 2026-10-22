import { z } from 'zod'
import { dayStart, dayAt } from './time'
const id = z.string().min(1).max(100)
const text = (max: number) => z.string().trim().max(max)
export const daySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((day) => {
    const at = dayStart(day, 'UTC')
    return (
      Number.isFinite(at) &&
      dayAt(at, 'UTC') === day &&
      day >= '1900-01-01' &&
      day <= '2100-12-31'
    )
  }, 'Use a valid date between 1900 and 2100')
export const zoneSchema = z
  .string()
  .max(100)
  .refine((zone) => {
    try {
      new Intl.DateTimeFormat('en', { timeZone: zone })
      return true
    } catch {
      return false
    }
  }, 'Use an IANA time zone, such as Europe/Berlin')
export const metadataSchema = z.object({
  title: text(200),
  note: z.string().max(20_000),
  taskId: id.nullable(),
  tagId: id.nullable(),
})
export const closedIntervalsSchema = z
  .array(
    z.object({
      startAtMs: z.number().int().safe().nonnegative(),
      endAtMs: z.number().int().safe().positive(),
    }),
  )
  .min(1)
  .max(100)
const version = { id, expectedRevision: z.number().int().nonnegative() }
export const timerInput = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('start'),
    requestId: id,
    mode: z.enum(['countdown', 'stopwatch']),
    kind: z.enum(['focus', 'break']),
    minutes: z.number().int().min(1).max(1440),
    cycleFocusMinutes: z.number().int().min(1).max(1440).optional(),
    cycleBreakMinutes: z.number().int().min(1).max(1440).optional(),
    round: z.number().int().min(1).max(100),
    rounds: z.number().int().min(1).max(100),
    ...metadataSchema.shape,
  }),
  z.object({
    action: z.enum(['pause', 'resume', 'stop']),
    requestId: id,
    ...version,
  }),
])
export const taskSchema = z.object({
  title: text(200).min(1),
  description: z.string().max(20_000),
  status: z.enum(['todo', 'in_progress', 'done']),
  estimateMinutes: z.number().int().min(0).max(100_000),
  tagId: id.nullable(),
})
export const settingsSchema = z.object({
  displayName: text(60).min(1),
  country: text(60),
  primaryFocus: text(100),
  bio: text(1000),
  timeZone: zoneSchema,
  theme: z.enum(['system', 'light', 'dark']),
  sound: z.boolean(),
  focusMinutes: z.number().int().min(1).max(1440),
  breakMinutes: z.number().int().min(1).max(1440),
  rounds: z.number().int().min(1).max(100),
  dailyGoalMinutes: z.number().int().min(0).max(1440),
  weeklyGoalMinutes: z.number().int().min(0).max(10080),
  leaderboardOptIn: z.boolean(),
})
export const mutationInput = z.discriminatedUnion('action', [
  ...timerInput.options,
  z.object({
    action: z.literal('manual'),
    parts: closedIntervalsSchema,
    ...metadataSchema.shape,
  }),
  z.object({
    action: z.literal('metadata'),
    ...version,
    ...metadataSchema.shape,
  }),
  z.object({
    action: z.literal('correct'),
    ...version,
    parts: closedIntervalsSchema,
  }),
  z.object({
    action: z.enum(['delete-session', 'restore-session']),
    ...version,
  }),
  z.object({
    action: z.literal('save-task'),
    id: id.optional(),
    ...taskSchema.shape,
  }),
  z.object({ action: z.literal('archive-task'), id, archived: z.boolean() }),
  z.object({
    action: z.literal('move-task'),
    id,
    status: taskSchema.shape.status,
    beforeId: id.nullable(),
  }),
  z.object({
    action: z.literal('save-tag'),
    id: id.optional(),
    name: text(60).min(1),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  }),
  z.object({ action: z.literal('archive-tag'), id, archived: z.boolean() }),
  z.object({ action: z.literal('settings'), ...settingsSchema.shape }),
  z.object({
    action: z.enum([
      'request-friend',
      'accept-friend',
      'remove-friend',
      'give-kudos',
      'retract-kudos',
    ]),
    memberId: id,
  }),
  z.object({
    action: z.literal('join-challenge'),
    id,
    shareResults: z.boolean(),
  }),
  z.object({
    action: z.literal('share-challenge'),
    id,
    shareResults: z.boolean(),
  }),
  z.object({ action: z.literal('cancel-challenge'), id }),
  z.object({
    action: z.literal('create-challenge'),
    requestId: id,
    title: text(100).min(1),
    startDay: daySchema,
    days: z.number().int().min(1).max(366),
    dailyMinutes: z.number().int().min(1).max(1440),
    shareResults: z.boolean(),
  }),
  z.object({
    action: z.enum(['reset', 'delete-account']),
    confirmation: z.string(),
  }),
])
export type MutationInput = z.infer<typeof mutationInput>
export const viewInput = z.object({
  view: z.enum(['workspace', 'social', 'challenges']),
  from: daySchema.optional(),
  to: daySchema.optional(),
  page: z.number().int().min(0).max(100_000).default(0),
  deleted: z.boolean().default(false),
  search: text(100).default(''),
  country: text(60).default(''),
  friendsOnly: z.boolean().default(false),
  ranking: z.enum(['time', 'streak', 'best-streak']).default('time'),
  period: z.enum(['range', 'all']).default('range'),
  tagId: z.string().max(100).default(''),
  recordType: z
    .enum(['all', 'focus', 'break', 'manual', 'timer'])
    .default('all'),
  daily: z.boolean().default(false),
  memberId: id.optional(),
})
export type ViewInput = z.infer<typeof viewInput>
