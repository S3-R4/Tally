import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  authConfigured,
  authConfiguration,
  instanceTimeZone,
  isAllowedEmail,
} from '../src/lib/server/config'

afterEach(() => vi.unstubAllEnvs())

describe('private group admission', () => {
  it('denies an empty allowlist and compares exact normalized addresses', () => {
    expect(isAllowedEmail('member@example.com', '')).toBe(false)
    expect(
      isAllowedEmail(
        ' Member@Example.com ',
        'other@example.com, member@example.com',
      ),
    ).toBe(true)
    expect(
      isAllowedEmail('member+alias@example.com', 'member@example.com'),
    ).toBe(false)
    expect(isAllowedEmail('attacker@example.com', 'member@example.com')).toBe(
      false,
    )
  })
  it('does not advertise an unconfigured or weak-secret sign-in', () => {
    vi.stubEnv('GOOGLE_CLIENT_ID', '')
    expect(authConfigured()).toBe(false)
    vi.stubEnv('GOOGLE_CLIENT_ID', 'fixture-client')
    vi.stubEnv('GOOGLE_CLIENT_SECRET', 'fixture-client-secret')
    vi.stubEnv('BETTER_AUTH_SECRET', 'weak')
    expect(authConfigured()).toBe(false)
    vi.stubEnv(
      'BETTER_AUTH_SECRET',
      'fixture-secret-which-is-at-least-32-characters',
    )
    expect(authConfigured()).toBe(true)
  })
  it('validates the base URL and IANA time zone', () => {
    vi.stubEnv('BETTER_AUTH_URL', 'invalid')
    expect(() => authConfiguration()).toThrow()
    vi.stubEnv('TALLY_TIME_ZONE', 'Europe/Berlin')
    expect(instanceTimeZone()).toBe('Europe/Berlin')
    vi.stubEnv('TALLY_TIME_ZONE', 'not-a-zone')
    expect(() => instanceTimeZone()).toThrow()
  })
  it('requires HTTPS for a production domain while allowing a local production smoke test', () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('GOOGLE_CLIENT_ID', 'fixture-client')
    vi.stubEnv('GOOGLE_CLIENT_SECRET', 'fixture-client-secret')
    vi.stubEnv(
      'BETTER_AUTH_SECRET',
      'fixture-secret-which-is-at-least-32-characters',
    )
    vi.stubEnv('BETTER_AUTH_URL', 'http://tally.example.com')
    expect(() => authConfiguration()).toThrow('HTTPS')
    vi.stubEnv('BETTER_AUTH_URL', 'https://tally.example.com')
    expect(authConfiguration().baseURL).toBe('https://tally.example.com')
    vi.stubEnv('BETTER_AUTH_URL', 'http://localhost:3000')
    expect(authConfiguration().baseURL).toBe('http://localhost:3000')
    vi.stubEnv('BETTER_AUTH_URL', 'ftp://tally.example.com')
    expect(() => authConfiguration()).toThrow()
  })
})
