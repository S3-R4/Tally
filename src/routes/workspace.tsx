import { useState } from 'react'
import { createFileRoute, redirect, useHydrated } from '@tanstack/react-router'
import { LockKeyhole, LogOut, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { authClient } from '@/lib/auth-client'
import { getBootstrap } from '@/lib/bootstrap'

export const Route = createFileRoute('/workspace')({
  beforeLoad: async () => {
    const { member } = await getBootstrap()
    if (!member) throw redirect({ to: '/' })
    return { member }
  },
  component: Workspace,
})

function Workspace() {
  const hydrated = useHydrated()
  const { member } = Route.useRouteContext()
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  async function signOut() {
    setPending(true)
    try {
      const response = await authClient.signOut()
      if (response.error) throw new Error('Sign-out failed')
      window.location.assign('/')
    } catch {
      setError('Sign-out failed. Check your connection and try again.')
      setPending(false)
    }
  }
  return (
    <div className="min-h-svh">
      <header className="mx-auto flex max-w-5xl items-center justify-between border-b px-6 py-6">
        <a href="/" aria-label="Tally home" className="flex items-center gap-3">
          <img src="/favicon.svg" alt="" className="size-10" />
          <span className="text-2xl font-semibold tracking-tight">Tally.</span>
        </a>
        <Button
          variant="ghost"
          disabled={!hydrated || pending}
          onClick={signOut}
        >
          <LogOut className="size-4" />
          Sign out
        </Button>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-16">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">
          Private workspace
        </p>
        <h1 className="text-4xl font-semibold tracking-tight">
          Signed in to Tally.
        </h1>
        <p className="mt-4 text-muted-foreground">
          Your account is approved for this group.
        </p>
        <Card className="mt-10">
          <CardContent className="space-y-6 p-8">
            <div className="flex items-center gap-3">
              <ShieldCheck className="size-6 text-primary" />
              <div>
                <h2 className="font-medium">{member.displayName}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Member time zone: {member.timeZone}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 border-t pt-6">
              <LockKeyhole className="mt-0.5 size-5 shrink-0 text-primary" />
              <p className="text-sm leading-6 text-muted-foreground">
                {member.leaderboardOptIn
                  ? 'You have enabled sharing your aggregate focus statistics in group leaderboards.'
                  : 'Your focus statistics are private. You have not opted in to leaderboards.'}
              </p>
            </div>
          </CardContent>
        </Card>
        {error && (
          <p role="alert" className="mt-5 text-destructive">
            {error}
          </p>
        )}
      </main>
    </div>
  )
}
