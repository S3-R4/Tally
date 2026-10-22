import { sql } from 'drizzle-orm'
import {
  sqliteTable,
  text,
  integer,
  index,
  uniqueIndex,
  check,
} from 'drizzle-orm/sqlite-core'

export const user = sqliteTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).notNull(),
  image: text('image'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
})
export const session = sqliteTable(
  'auth_session',
  {
    id: text('id').primaryKey(),
    token: text('token').notNull().unique(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
  },
  (t) => [index('auth_session_user_idx').on(t.userId)],
)
export const account = sqliteTable(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: integer('access_token_expires_at', {
      mode: 'timestamp_ms',
    }),
    refreshTokenExpiresAt: integer('refresh_token_expires_at', {
      mode: 'timestamp_ms',
    }),
    scope: text('scope'),
    password: text('password'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (t) => [
    index('account_user_idx').on(t.userId),
    uniqueIndex('account_provider_idx').on(t.providerId, t.accountId),
  ],
)
export const verification = sqliteTable(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (t) => [index('verification_identifier_idx').on(t.identifier)],
)

export const instance = sqliteTable('instance', {
  id: integer('id').primaryKey(),
  timeZone: text('time_zone').notNull(),
})
export const members = sqliteTable('members', {
  userId: text('user_id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  displayName: text('display_name').notNull(),
  country: text('country').notNull().default(''),
  primaryFocus: text('primary_focus').notNull().default(''),
  bio: text('bio').notNull().default(''),
  timeZone: text('time_zone').notNull().default('Europe/Berlin'),
  theme: text('theme', { enum: ['system', 'light', 'dark'] })
    .notNull()
    .default('system'),
  sound: integer('sound', { mode: 'boolean' }).notNull().default(false),
  focusMinutes: integer('focus_minutes').notNull().default(25),
  breakMinutes: integer('break_minutes').notNull().default(5),
  rounds: integer('rounds').notNull().default(4),
  dailyGoalMinutes: integer('daily_goal_minutes').notNull().default(0),
  weeklyGoalMinutes: integer('weekly_goal_minutes').notNull().default(0),
  leaderboardOptIn: integer('leaderboard_opt_in', { mode: 'boolean' })
    .notNull()
    .default(false),
})
export const tags = sqliteTable(
  'tags',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    color: text('color').notNull().default('#0d9488'),
    archivedAtMs: integer('archived_at_ms'),
  },
  (t) => [index('tags_owner_idx').on(t.userId)],
)
export const tasks = sqliteTable(
  'tasks',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description').notNull().default(''),
    status: text('status', { enum: ['todo', 'in_progress', 'done'] })
      .notNull()
      .default('todo'),
    estimateMinutes: integer('estimate_minutes').notNull().default(0),
    tagId: text('tag_id').references(() => tags.id, { onDelete: 'set null' }),
    position: integer('position').notNull().default(0),
    archivedAtMs: integer('archived_at_ms'),
  },
  (t) => [index('tasks_owner_idx').on(t.userId)],
)
export const focusSessions = sqliteTable(
  'focus_sessions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    source: text('source', { enum: ['timer', 'manual'] }).notNull(),
    kind: text('kind', { enum: ['focus', 'break'] }).notNull(),
    mode: text('mode', {
      enum: ['countdown', 'stopwatch', 'manual'],
    }).notNull(),
    status: text('status', {
      enum: ['running', 'paused', 'completed'],
    }).notNull(),
    plannedDurationMs: integer('planned_duration_ms'),
    deadlineAtMs: integer('deadline_at_ms'),
    round: integer('round').notNull().default(1),
    rounds: integer('rounds').notNull().default(4),
    cycleFocusMinutes: integer('cycle_focus_minutes').notNull().default(25),
    cycleBreakMinutes: integer('cycle_break_minutes').notNull().default(5),
    title: text('title').notNull().default(''),
    note: text('note').notNull().default(''),
    taskId: text('task_id').references(() => tasks.id, {
      onDelete: 'set null',
    }),
    tagId: text('tag_id').references(() => tags.id, { onDelete: 'set null' }),
    revision: integer('revision').notNull().default(0),
    timingEdited: integer('timing_edited', { mode: 'boolean' })
      .notNull()
      .default(false),
    createdAtMs: integer('created_at_ms').notNull(),
    deletedAtMs: integer('deleted_at_ms'),
  },
  (t) => [
    index('focus_sessions_owner_time_idx').on(t.userId, t.createdAtMs),
    uniqueIndex('one_active_timer_per_member')
      .on(t.userId)
      .where(sql`${t.status} in ('running', 'paused')`),
  ],
)
export const intervals = sqliteTable(
  'intervals',
  {
    id: text('id').primaryKey(),
    sessionId: text('session_id')
      .notNull()
      .references(() => focusSessions.id, { onDelete: 'cascade' }),
    startAtMs: integer('start_at_ms').notNull(),
    endAtMs: integer('end_at_ms'),
  },
  (t) => [
    index('interval_session_idx').on(t.sessionId),
    check(
      'positive_interval',
      sql`${t.endAtMs} is null or ${t.endAtMs} > ${t.startAtMs}`,
    ),
  ],
)
export const timingRevisions = sqliteTable(
  'timing_revisions',
  {
    id: text('id').primaryKey(),
    sessionId: text('session_id')
      .notNull()
      .references(() => focusSessions.id, { onDelete: 'cascade' }),
    intervals: text('intervals', { mode: 'json' })
      .$type<{ startAtMs: number; endAtMs: number | null }[]>()
      .notNull(),
    changedAtMs: integer('changed_at_ms').notNull(),
  },
  (t) => [index('timing_revision_session_idx').on(t.sessionId)],
)
export const commands = sqliteTable(
  'timer_commands',
  {
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    requestId: text('request_id').notNull(),
    fingerprint: text('fingerprint').notNull(),
    result: text('result', { mode: 'json' })
      .$type<{ sessionId: string } | { challengeId: string }>()
      .notNull(),
  },
  (t) => [uniqueIndex('command_member_request_idx').on(t.userId, t.requestId)],
)
export const friendships = sqliteTable(
  'friendships',
  {
    id: text('id').primaryKey(),
    firstId: text('first_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    secondId: text('second_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    requesterId: text('requester_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    status: text('status', { enum: ['pending', 'accepted'] }).notNull(),
  },
  (t) => [
    uniqueIndex('friendship_pair_idx').on(t.firstId, t.secondId),
    check('ordered_friend_pair', sql`${t.firstId} < ${t.secondId}`),
  ],
)
export const kudos = sqliteTable(
  'kudos',
  {
    id: text('id').primaryKey(),
    senderId: text('sender_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    recipientId: text('recipient_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    day: text('day').notNull(),
  },
  (t) => [
    uniqueIndex('kudos_pair_day_idx').on(t.senderId, t.recipientId, t.day),
    check('no_self_kudos', sql`${t.senderId} <> ${t.recipientId}`),
  ],
)
export const challenges = sqliteTable(
  'challenges',
  {
    id: text('id').primaryKey(),
    ownerId: text('owner_id').references(() => user.id, {
      onDelete: 'cascade',
    }),
    kind: text('kind', { enum: ['monthly', 'custom'] }).notNull(),
    title: text('title').notNull(),
    startDay: text('start_day').notNull(),
    days: integer('days').notNull(),
    dailyMinutes: integer('daily_minutes').notNull(),
    timeZone: text('time_zone').notNull(),
  },
  (t) => [
    uniqueIndex('monthly_challenge_idx')
      .on(t.startDay)
      .where(sql`${t.kind} = 'monthly'`),
  ],
)
export const participations = sqliteTable(
  'participations',
  {
    id: text('id').primaryKey(),
    challengeId: text('challenge_id')
      .notNull()
      .references(() => challenges.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    shareResults: integer('share_results', { mode: 'boolean' })
      .notNull()
      .default(false),
    cancelledAtMs: integer('cancelled_at_ms'),
  },
  (t) => [uniqueIndex('challenge_member_idx').on(t.challengeId, t.userId)],
)
