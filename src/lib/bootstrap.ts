import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'

export const getBootstrap = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { authConfigured } = await import('./server/config')
    if (!authConfigured())
      return {
        configured: false,
        member: null,
        denied: false,
        unavailable: false,
      }
    const { currentMember } = await import('./server/member')
    try {
      return {
        configured: true,
        member: await currentMember(getRequestHeaders()),
        denied: false,
        unavailable: false,
      }
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('FORBIDDEN:'))
        return {
          configured: true,
          member: null,
          denied: true,
          unavailable: false,
        }
      console.error('Tally authentication storage is unavailable.', {
        errorType: error instanceof Error ? error.name : 'unknown',
      })
      return {
        configured: true,
        member: null,
        denied: false,
        unavailable: true,
      }
    }
  },
)
