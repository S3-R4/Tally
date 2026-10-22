import { randomUUID } from 'node:crypto'
import { and, eq, asc } from 'drizzle-orm'
import type { AppDatabase } from './db'
import type { MutationInput } from '../inputs'
import { tags, tasks } from './schema'
import { fail, ownedLinks } from './domain'

export function planning(db: AppDatabase, userId: string) {
  return {
    tags: db.select().from(tags).where(eq(tags.userId, userId)).all(),
    tasks: db
      .select()
      .from(tasks)
      .where(eq(tasks.userId, userId))
      .orderBy(asc(tasks.position), asc(tasks.id))
      .all(),
  }
}
export function mutatePlanning(
  db: AppDatabase,
  userId: string,
  input: MutationInput,
  now: number,
) {
  return db.transaction((tx) => {
    if (input.action === 'save-tag') {
      if (
        input.id &&
        !planning(tx, userId).tags.some((tag) => tag.id === input.id)
      )
        fail('NOT_FOUND', 'Tag not found.')
      if (input.id)
        tx.update(tags)
          .set({ name: input.name, color: input.color })
          .where(and(eq(tags.id, input.id), eq(tags.userId, userId)))
          .run()
      else
        tx.insert(tags)
          .values({
            id: randomUUID(),
            userId,
            name: input.name,
            color: input.color,
          })
          .run()
    } else if (input.action === 'save-task') {
      ownedLinks(tx, userId, input.id ?? null, input.tagId, Boolean(input.id))
      const { title, description, status, estimateMinutes, tagId } = input
      if (input.id)
        tx.update(tasks)
          .set({ title, description, status, estimateMinutes, tagId })
          .where(and(eq(tasks.id, input.id), eq(tasks.userId, userId)))
          .run()
      else
        tx.insert(tasks)
          .values({
            id: randomUUID(),
            userId,
            title,
            description,
            status,
            estimateMinutes,
            tagId,
            position: planning(tx, userId).tasks.length,
          })
          .run()
    } else if (
      input.action === 'archive-tag' ||
      input.action === 'archive-task'
    ) {
      ownedLinks(
        tx,
        userId,
        input.action === 'archive-task' ? input.id : null,
        input.action === 'archive-tag' ? input.id : null,
        true,
      )
      const table = input.action === 'archive-task' ? tasks : tags
      tx.update(table)
        .set({ archivedAtMs: input.archived ? now : null })
        .where(and(eq(table.id, input.id), eq(table.userId, userId)))
        .run()
    } else if (input.action === 'move-task') {
      const all = planning(tx, userId).tasks
      const moved = all.find(
        (task) => task.id === input.id && task.archivedAtMs === null,
      )
      if (!moved) fail('NOT_FOUND', 'Task not found.')
      const target = all.filter(
        (task) =>
          task.status === input.status &&
          task.archivedAtMs === null &&
          task.id !== input.id,
      )
      const at =
        input.beforeId === null
          ? target.length
          : target.findIndex((task) => task.id === input.beforeId)
      if (at < 0) fail('NOT_FOUND', 'Destination task not found.')
      target.splice(at, 0, { ...moved, status: input.status })
      target.forEach((task, position) =>
        tx
          .update(tasks)
          .set({ status: input.status, position })
          .where(and(eq(tasks.id, task.id), eq(tasks.userId, userId)))
          .run(),
      )
    } else fail('INVALID_INPUT', 'Unknown planning operation.')
  })
}
