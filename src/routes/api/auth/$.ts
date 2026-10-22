import { createFileRoute } from '@tanstack/react-router'
import { authConfigured } from '@/lib/server/config'
import { getAuth } from '@/lib/server/auth'

const handler = ({ request }: { request: Request }) =>
  authConfigured()
    ? getAuth().handler(request)
    : Response.json(
        {
          error:
            'Google authentication has not been configured by the operator.',
        },
        { status: 503 },
      )

export const Route = createFileRoute('/api/auth/$')({
  server: { handlers: { GET: handler, POST: handler } },
})
