import { and, eq } from 'drizzle-orm'
import type { AppDatabase } from './db'
import { tasks, tags } from './schema'

export class DomainError extends Error {
  constructor(
    public code: 'INVALID_INPUT' | 'NOT_FOUND' | 'CONFLICT' | 'FORBIDDEN',
    message: string,
  ) {
    super(message)
  }
}
export function fail(code: DomainError['code'], message: string): never {
  throw new DomainError(code, message)
}
export function ownedLinks(
  db: AppDatabase,
  userId: string,
  taskId: string | null,
  tagId: string | null,
  historical = false,
) {
  const task = taskId
    ? db
        .select()
        .from(tasks)
        .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
        .get()
    : null
  const tag = tagId
    ? db
        .select()
        .from(tags)
        .where(and(eq(tags.id, tagId), eq(tags.userId, userId)))
        .get()
    : null
  if (
    (taskId && (!task || (!historical && task.archivedAtMs !== null))) ||
    (tagId && (!tag || (!historical && tag.archivedAtMs !== null)))
  )
    fail('NOT_FOUND', 'Task or tag is unavailable.')
  return { task, tag }
}
