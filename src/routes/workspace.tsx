import { createFileRoute, redirect } from '@tanstack/react-router'
import { getBootstrap } from '@/lib/bootstrap'
import { Workspace } from '@/components/workspace'
import { workspaceSearch } from '@/lib/workspace-search'
export const Route = createFileRoute('/workspace')({
  validateSearch: workspaceSearch,
  beforeLoad: async () => {
    const { member } = await getBootstrap()
    if (!member) throw redirect({ to: '/' })
    return { member }
  },
  component: () => <Workspace search={Route.useSearch()} />,
})
