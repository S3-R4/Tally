import { useState } from 'react'
import { createFileRoute, redirect, useHydrated } from '@tanstack/react-router'
import {
  ArrowRight,
  Check,
  Clock3,
  Focus,
  LockKeyhole,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getBootstrap } from '@/lib/bootstrap'
import { authClient } from '@/lib/auth-client'

export const Route = createFileRoute('/')({
  loader: async () => {
    const data = await getBootstrap()
    if (data.member) throw redirect({ to: '/workspace' })
    return data
  },
  component: Welcome,
})

function Welcome() {
  const hydrated = useHydrated()
  const { configured, denied, unavailable } = Route.useLoaderData()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  async function signIn() {
    setPending(true)
    setError('')
    try {
      const result = await authClient.signIn.social({
        provider: 'google',
        callbackURL: '/workspace',
        errorCallbackURL: '/',
      })
      if (result.error)
        throw new Error(
          result.error.message || 'Google sign-in could not start.',
        )
    } catch {
      setError(
        'Google sign-in could not start. Check your connection and try again.',
      )
      setPending(false)
    }
  }
  return (
    <div className="min-h-svh">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-7 sm:px-10">
        <a href="/" className="flex items-center gap-3" aria-label="Tally home">
          <img src="/favicon.svg" alt="" className="size-10" />
          <span className="text-2xl font-semibold tracking-tight">
            Tally<span className="text-primary">.</span>
          </span>
        </a>
        <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <LockKeyhole className="size-3.5" aria-hidden="true" />
          Private workspace
        </span>
      </header>
      <main className="mx-auto grid max-w-6xl gap-14 px-6 pb-20 pt-14 sm:px-10 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:gap-20 lg:pt-28">
        <section>
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary">
            <span className="size-1.5 rounded-full bg-primary" />
            Time, with intention
          </div>
          <h1 className="max-w-xl text-5xl leading-[1.08] font-semibold tracking-[-0.045em] sm:text-6xl">
            Make room for
            <br />
            <span className="text-primary">focused work.</span>
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-muted-foreground">
            A quieter place to plan your work, understand your time, and build
            consistency with your group.
          </p>
          <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <Check className="size-4 text-primary" aria-hidden="true" />
              Private by default
            </span>
            <span className="flex items-center gap-2">
              <Check className="size-4 text-primary" aria-hidden="true" />
              Your time, your records
            </span>
          </div>
          <div className="mt-16 grid max-w-md grid-cols-3 gap-6 border-t pt-6">
            {[
              {
                icon: Focus,
                title: 'Find your focus',
                text: 'Work with intention.',
              },
              {
                icon: Clock3,
                title: 'See your time',
                text: 'Keep a clear record.',
              },
              {
                icon: ShieldCheck,
                title: 'Choose what to share',
                text: 'Stay in control.',
              },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title}>
                <Icon className="mb-3 size-5 text-primary" aria-hidden="true" />
                <h2 className="text-xs font-semibold leading-5">{title}</h2>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </section>
        <section aria-labelledby="sign-in-title" className="lg:pl-4">
          <Card className="overflow-hidden rounded-2xl border-border/70 shadow-[0_16px_70px_-30px_oklch(0.3_0.04_180/0.2)]">
            <CardContent className="px-7 py-10 sm:px-10 sm:py-12">
              <div className="mb-8 flex size-12 items-center justify-center rounded-2xl bg-accent text-primary">
                <ArrowRight className="size-6" aria-hidden="true" />
              </div>
              <h2
                id="sign-in-title"
                className="text-2xl font-semibold tracking-tight"
              >
                Your time starts here.
              </h2>
              <p className="mb-8 mt-3 text-sm leading-6 text-muted-foreground">
                Sign in with your approved Google account to enter your group’s
                workspace.
              </p>
              <Button
                onClick={signIn}
                disabled={!hydrated || !configured || unavailable || pending}
                className="h-12 w-full rounded-lg text-sm"
                variant="outline"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="mr-1 size-5"
                >
                  <path
                    fill="currentColor"
                    d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.36Z"
                  />
                  <path
                    fill="currentColor"
                    opacity=".65"
                    d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.24-2.51c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H3.07v2.59A10 10 0 0 0 12 22Z"
                  />
                  <path
                    fill="currentColor"
                    opacity=".45"
                    d="M6.41 13.92a6 6 0 0 1 0-3.84V7.49H3.07a10 10 0 0 0 0 9.02l3.34-2.59Z"
                  />
                  <path
                    fill="currentColor"
                    opacity=".8"
                    d="M12 5.96c1.47 0 2.79.5 3.82 1.5l2.86-2.85A9.58 9.58 0 0 0 12 2a10 10 0 0 0-8.93 5.49l3.34 2.59A5.99 5.99 0 0 1 12 5.96Z"
                  />
                </svg>
                {pending ? 'Connecting to Google…' : 'Continue with Google'}
                <ArrowRight
                  className="ml-auto size-4 text-muted-foreground"
                  aria-hidden="true"
                />
              </Button>
              {!configured && (
                <p
                  role="status"
                  className="mt-5 rounded-lg bg-muted px-4 py-3 text-sm leading-6 text-muted-foreground"
                >
                  Sign-in is not configured yet. The workspace operator needs to
                  finish setup before members can join.
                </p>
              )}
              {unavailable && (
                <p role="alert" className="mt-5 text-sm text-destructive">
                  The workspace is temporarily unavailable. The operator should
                  check storage and authentication setup.
                </p>
              )}
              {denied && (
                <p
                  role="alert"
                  className="mt-5 text-sm leading-6 text-destructive"
                >
                  This Google account isn’t approved for this workspace. Contact
                  the group administrator.
                </p>
              )}
              {error && (
                <p role="alert" className="mt-5 text-sm text-destructive">
                  {error}
                </p>
              )}
              <div className="mt-8 flex items-start gap-2 border-t pt-5 text-xs leading-5 text-muted-foreground">
                <LockKeyhole
                  className="mt-0.5 size-3.5 shrink-0"
                  aria-hidden="true"
                />
                <p>
                  Access is limited to approved group members. Your activity
                  stays private unless you choose to share statistics.
                </p>
              </div>
            </CardContent>
          </Card>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            One account. A little more intention.
          </p>
        </section>
      </main>
      <footer className="mx-auto flex max-w-6xl flex-wrap justify-between gap-3 border-t px-6 py-6 text-xs text-muted-foreground sm:px-10">
        <span>Tally · A place for focused work</span>
        <span>For your group. On your terms.</span>
      </footer>
    </div>
  )
}
