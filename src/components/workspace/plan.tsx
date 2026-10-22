import { useState } from 'react'
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDroppable,
  closestCorners,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Plus } from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import { Input } from '../ui/input'
import {
  Empty,
  Field,
  NoteInput,
  PageTitle,
  Select,
  useWorkspace,
} from '../workspace'
import { formatDuration } from '@/lib/time'
import { Markdown } from './markdown'

type Task = ReturnType<typeof useWorkspace>['data']['tasks'][number]
const columns = [
  ['todo', 'Todo'],
  ['in_progress', 'In progress'],
  ['done', 'Done'],
] as const
export function PlanPage() {
  const { data, run } = useWorkspace()
  const [statusFilter, setStatusFilter] = useState(''),
    [view, setView] = useState('board'),
    [archived, setArchived] = useState(false),
    [filter, setFilter] = useState(''),
    [tagFilter, setTagFilter] = useState(''),
    [editing, setEditing] = useState<Task | 'new' | null>(null)
  const [tagEditing, setTagEditing] = useState(''),
    [tagName, setTagName] = useState(''),
    [tagColor, setTagColor] = useState('#0d9488')
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      scrollBehavior: 'auto',
    }),
  )
  const visible = data.tasks.filter(
    (task) =>
      (!statusFilter || task.status === statusFilter) &&
      (task.archivedAtMs !== null) === archived &&
      (!filter || task.title.toLowerCase().includes(filter.toLowerCase())) &&
      (!tagFilter || task.tagId === tagFilter),
  )
  const dragLabel = (id: string | number) =>
    data.tasks.find((task) => task.id === id)?.title ??
    columns.find(([status]) => `column-${status}` === id)?.[1] ??
    'task'
  async function dropped(event: DragEndEvent) {
    const moved = data.tasks.find((task) => task.id === event.active.id),
      over = event.over
    if (!moved || !over || moved.id === over.id || archived) return
    const target = data.tasks.find((task) => task.id === over.id)
    const status =
      target?.status ??
      columns.find(([status]) => `column-${status}` === over.id)?.[0]
    if (!status) return
    let ordered = data.tasks.filter(
      (task) => task.archivedAtMs === null && task.status === status,
    )
    if (moved.status === status && target)
      ordered = arrayMove(
        ordered,
        ordered.findIndex((task) => task.id === moved.id),
        ordered.findIndex((task) => task.id === target.id),
      )
    else {
      ordered = ordered.filter((task) => task.id !== moved.id)
      ordered.splice(
        target
          ? ordered.findIndex((task) => task.id === target.id)
          : ordered.length,
        0,
        { ...moved, status },
      )
    }
    const index = ordered.findIndex((task) => task.id === moved.id)
    await run({
      action: 'move-task',
      id: moved.id,
      status,
      beforeId: ordered[index + 1]?.id ?? null,
    })
  }
  return (
    <>
      <PageTitle
        title="Give your day a shape."
        detail="Keep a small, ordered plan. Starting or finishing a timer never changes a task’s status."
      >
        <Button onClick={() => setEditing('new')}>
          <Plus />
          New task
        </Button>
      </PageTitle>
      {editing && (
        <TaskEditor
          key={typeof editing === 'string' ? 'new' : editing.id}
          task={editing === 'new' ? undefined : editing}
          close={() => setEditing(null)}
        />
      )}
      <div className="mb-6 flex flex-wrap items-end gap-3">
        <Field label="Find a task">
          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search titles"
          />
        </Field>
        <Field label="Tag filter">
          <Select
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
          >
            <option value="">All tags</option>
            {data.tags.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Status filter">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All statuses</option>
            {columns.map(([status, label]) => (
              <option key={status} value={status}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <Button
          variant="outline"
          onClick={() => setView(view === 'board' ? 'list' : 'board')}
        >
          {view === 'board' ? 'List view' : 'Board view'}
        </Button>
        <Button
          variant="outline"
          aria-pressed={archived}
          onClick={() => setArchived(!archived)}
        >
          {archived ? 'Show active' : 'Show archived'}
        </Button>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        accessibility={{
          announcements: {
            onDragStart: ({ active }) => `Picked up ${dragLabel(active.id)}.`,
            onDragOver: ({ active, over }) =>
              over
                ? `Moving ${dragLabel(active.id)} over ${dragLabel(over.id)}.`
                : 'Outside a task column.',
            onDragEnd: ({ active, over }) =>
              over
                ? `Dropped ${dragLabel(active.id)} on ${dragLabel(over.id)}. Saving order.`
                : 'Task move cancelled.',
            onDragCancel: () => 'Task move cancelled.',
          },
        }}
        onDragEnd={(event) => void dropped(event)}
      >
        <div
          className={
            view === 'board' ? 'grid gap-5 xl:grid-cols-3' : 'space-y-6'
          }
        >
          {columns.map(([status, label]) => (
            <TaskColumn
              key={status}
              status={status}
              label={label}
              tasks={visible.filter((task) => task.status === status)}
              editing={setEditing}
            />
          ))}
        </div>
      </DndContext>
      <section className="mt-12">
        <h2 className="mb-4 text-lg font-semibold">Tags</h2>
        <form
          className="mb-5 flex flex-wrap items-end gap-3"
          onSubmit={async (e) => {
            e.preventDefault()
            if (
              await run({
                action: 'save-tag',
                id: tagEditing || undefined,
                name: tagName,
                color: tagColor,
              })
            ) {
              setTagName('')
              setTagEditing('')
            }
          }}
        >
          <Field label="Tag name">
            <Input
              value={tagName}
              onChange={(e) => setTagName(e.target.value)}
              maxLength={60}
              required
            />
          </Field>
          <Field label="Color">
            <Input
              className="w-16 p-1"
              type="color"
              value={tagColor}
              onChange={(e) => setTagColor(e.target.value)}
            />
          </Field>
          <Button type="submit">{tagEditing ? 'Save tag' : 'Add tag'}</Button>
          {tagEditing && (
            <Button
              variant="ghost"
              type="button"
              onClick={() => {
                setTagEditing('')
                setTagName('')
              }}
            >
              Cancel edit
            </Button>
          )}
        </form>
        <div className="flex flex-wrap gap-3">
          {data.tags.map((tag) => (
            <div
              key={tag.id}
              className="flex flex-wrap items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm"
            >
              <span
                className="size-3 rounded-full"
                style={{ background: tag.color }}
              />
              <span>
                {tag.name}
                {tag.archivedAtMs !== null && ' (archived)'}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setTagEditing(tag.id)
                  setTagName(tag.name)
                  setTagColor(tag.color)
                }}
              >
                Edit
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  void run({
                    action: 'archive-tag',
                    id: tag.id,
                    archived: tag.archivedAtMs === null,
                  })
                }
              >
                {tag.archivedAtMs === null ? 'Archive' : 'Restore'}
              </Button>
            </div>
          ))}
        </div>
        {!data.tags.length && (
          <Empty>No tags yet. Add a tag to group your focus time.</Empty>
        )}
      </section>
    </>
  )
}
function TaskColumn({
  status,
  label,
  tasks,
  editing,
}: {
  status: Task['status']
  label: string
  tasks: Task[]
  editing: (task: Task) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `column-${status}` })
  return (
    <section
      ref={setNodeRef}
      className={`min-w-0 rounded-xl bg-muted/50 p-3 ${isOver ? 'ring-2 ring-primary' : ''}`}
    >
      <h2 className="mb-4 px-1 text-sm font-semibold">
        {label}{' '}
        <span className="ml-2 text-muted-foreground">{tasks.length}</span>
      </h2>
      <SortableContext
        items={tasks.map((task) => task.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} edit={() => editing(task)} />
          ))}
          {!tasks.length && <Empty>No tasks.</Empty>}
        </div>
      </SortableContext>
    </section>
  )
}
function TaskCard({ task, edit }: { task: Task; edit: () => void }) {
  const { data, run, disabled } = useWorkspace()
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
  } = useSortable({
    id: task.id,
    disabled: disabled || task.archivedAtMs !== null,
  })
  const tag = data.tags.find((tag) => tag.id === task.tagId)
  return (
    <Card
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <CardContent className="space-y-4 p-4">
        <div className="flex items-start gap-2">
          <button
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            disabled={disabled || task.archivedAtMs !== null}
            aria-label={`Drag ${task.title}`}
            className="touch-none rounded p-1 text-muted-foreground"
          >
            <GripVertical className="size-4" />
          </button>
          <h3 className="min-w-0 flex-1 break-words text-sm font-semibold">
            {task.title}
          </h3>
        </div>
        {tag && <p className="text-xs text-primary">{tag.name}</p>}
        {task.description && <Markdown>{task.description}</Markdown>}
        <p className="text-xs text-muted-foreground">
          {formatDuration(data.report.taskActual[task.id] ?? 0)} actual
          {task.estimateMinutes > 0 &&
            ` / ${formatDuration(task.estimateMinutes * 60000)} estimate`}
        </p>
        <Field label="Status">
          <Select
            value={task.status}
            disabled={task.archivedAtMs !== null}
            onChange={(e) => {
              const status = columns.find(
                ([status]) => status === e.target.value,
              )?.[0]
              if (status)
                void run({
                  action: 'move-task',
                  id: task.id,
                  status,
                  beforeId: null,
                })
            }}
          >
            {columns.map(([status, label]) => (
              <option key={status} value={status}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <div className="flex flex-wrap gap-1">
          <Button size="sm" variant="ghost" onClick={edit}>
            Edit
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() =>
              void run({
                action: 'archive-task',
                id: task.id,
                archived: task.archivedAtMs === null,
              })
            }
          >
            {task.archivedAtMs === null ? 'Archive' : 'Restore'}
          </Button>
          {task.archivedAtMs === null && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                const first = data.tasks.find(
                  (other) =>
                    other.status === task.status &&
                    other.archivedAtMs === null &&
                    other.id !== task.id,
                )
                void run({
                  action: 'move-task',
                  id: task.id,
                  status: task.status,
                  beforeId: first?.id ?? null,
                })
              }}
            >
              Move to top
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
function TaskEditor({ task, close }: { task?: Task; close: () => void }) {
  const { run, data } = useWorkspace()
  const [title, setTitle] = useState(task?.title ?? ''),
    [description, setDescription] = useState(task?.description ?? ''),
    [estimate, setEstimate] = useState(task?.estimateMinutes ?? 0),
    [tagId, setTagId] = useState(task?.tagId ?? '')
  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <form
          className="space-y-5"
          onSubmit={async (e) => {
            e.preventDefault()
            if (
              await run({
                action: 'save-task',
                id: task?.id,
                title,
                description,
                estimateMinutes: estimate,
                tagId: tagId || null,
                status: task?.status ?? 'todo',
              })
            )
              close()
          }}
        >
          <h2 className="font-semibold">{task ? 'Edit task' : 'New task'}</h2>
          <Field label="Task title">
            <Input
              required
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Field>
          <NoteInput
            label="Description (Markdown)"
            value={description}
            onChange={setDescription}
          />
          <Field label="Estimate (minutes, 0 for unset)">
            <Input
              type="number"
              min={0}
              max={100000}
              value={estimate}
              onChange={(e) => setEstimate(Number(e.target.value))}
            />
          </Field>
          <Field label="Task tag">
            <Select value={tagId} onChange={(e) => setTagId(e.target.value)}>
              <option value="">No tag</option>
              {data.tags
                .filter((tag) => tag.archivedAtMs === null || tag.id === tagId)
                .map((tag) => (
                  <option key={tag.id} value={tag.id}>
                    {tag.name}
                  </option>
                ))}
            </Select>
          </Field>
          <div className="flex gap-3">
            <Button>Save task</Button>
            <Button type="button" variant="ghost" onClick={close}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
