import { z } from 'zod'
import { daySchema } from './inputs'

export const workspaceSearch = z.object({
  tab: z
    .enum([
      'focus',
      'plan',
      'review',
      'analyze',
      'leaderboards',
      'friends',
      'challenges',
      'settings',
    ])
    .default('focus'),
  from: daySchema.optional(),
  to: daySchema.optional(),
  page: z.coerce.number().int().min(0).max(100000).default(0),
  deleted: z.coerce.boolean().default(false),
  search: z.string().max(100).default(''),
  country: z.string().max(60).default(''),
  friendsOnly: z.coerce.boolean().default(false),
  ranking: z.enum(['time', 'streak', 'best-streak']).default('time'),
  period: z.enum(['range', 'all']).default('range'),
  tagId: z.string().max(100).default(''),
  recordType: z
    .enum(['all', 'focus', 'break', 'manual', 'timer'])
    .default('all'),
  memberId: z.string().max(100).optional(),
})
export type WorkspaceSearch = z.infer<typeof workspaceSearch>
