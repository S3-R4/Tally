import { expect, test } from '@playwright/test'
import { createHmac } from 'node:crypto'
import {
  fixtureSecret,
  fixtureURL,
  approvedToken,
  outsiderToken,
} from './fixture'

test('shows honest setup state and guards private routes', async ({
  page,
  request,
}) => {
  await page.goto('/')
  await expect(
    page.getByRole('heading', { name: 'Make room for focused work.' }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Continue with Google' }),
  ).toBeDisabled()
  await expect(page.getByRole('status')).toContainText(
    'Sign-in is not configured yet',
  )
  await page.goto('/workspace')
  await expect(page).toHaveURL('http://127.0.0.1:3100/')
  expect((await request.get('/health')).status()).toBe(200)
  expect(
    (
      await request.post('/api/auth/sign-in/social', {
        data: { provider: 'google' },
      })
    ).status(),
  ).toBe(503)
})

test('keeps the sign-in screen usable on a narrow viewport', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 780 })
  await page.goto('/')
  await expect(
    page.getByRole('heading', { name: 'Your time starts here.' }),
  ).toBeVisible()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
})

test('admits a signed approved session, signs out, and denies an unapproved existing session', async ({
  page,
  context,
}) => {
  async function cookie(token: string) {
    const signature = createHmac('sha256', fixtureSecret)
      .update(token)
      .digest('base64')
    await context.addCookies([
      {
        name: 'better-auth.session_token',
        value: encodeURIComponent(`${token}.${signature}`),
        url: fixtureURL,
        httpOnly: true,
        sameSite: 'Lax',
      },
    ])
  }
  await cookie(approvedToken)
  await page.goto(`${fixtureURL}/workspace`)
  await expect(
    page.getByRole('heading', { name: 'Signed in to Tally.' }),
  ).toBeVisible()
  await expect(page.getByText('Private Google name')).toHaveCount(0)
  await expect(
    page.getByText('You have not opted in to leaderboards.', { exact: false }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Sign out' }).click()
  await expect(page).toHaveURL(`${fixtureURL}/`)
  await expect(
    page.getByRole('button', { name: 'Continue with Google' }),
  ).toBeEnabled()
  await cookie(outsiderToken)
  await page.goto(`${fixtureURL}/workspace`)
  await expect(page).toHaveURL(`${fixtureURL}/`)
  await expect(page.getByRole('alert')).toContainText('isn’t approved')
})
