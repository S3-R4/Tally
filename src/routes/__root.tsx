import {
  createRootRoute,
  HeadContent,
  Link,
  Outlet,
  Scripts,
} from '@tanstack/react-router'
import styles from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Tally — Time, with intention' },
      {
        name: 'description',
        content:
          'A private place to plan your work, protect your focus, and understand your time.',
      },
    ],
    links: [
      { rel: 'stylesheet', href: styles },
      { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
    ],
  }),
  component: () => (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <Outlet />
        <Scripts />
      </body>
    </html>
  ),
  errorComponent: ({ reset }) => (
    <main className="mx-auto max-w-lg p-10">
      <h1 className="text-2xl font-semibold">Tally couldn’t load this page</h1>
      <p className="mt-3 text-muted-foreground">
        Check your connection. If this continues, the operator should check the
        database and server configuration.
      </p>
      <button
        onClick={reset}
        className="mt-6 rounded-lg bg-primary px-4 py-2 text-primary-foreground"
      >
        Try again
      </button>
    </main>
  ),
  notFoundComponent: () => (
    <main className="mx-auto max-w-lg p-10">
      <h1 className="text-2xl">Page not found</h1>
      <Link to="/" className="mt-4 inline-block text-primary underline">
        Return to Tally
      </Link>
    </main>
  ),
})
