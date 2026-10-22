import { expect, test, type BrowserContext } from '@playwright/test'
import { createHmac } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import {
  fixtureSecret,
  fixtureURL,
  workflowToken,
  partnerToken,
} from './fixture'

async function authenticate(context: BrowserContext, token: string) {
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

test('plans work, recovers a timer, corrects history, reports and exports owned data, and uses group features', async ({
  page,
  context,
  browser,
}) => {
  test.setTimeout(60000)
  let serverFunctionURL = ''
  page.on('request', (request) => {
    if (request.method() === 'GET' && request.url().includes('/_serverFn/'))
      serverFunctionURL = request.url()
  })
  await authenticate(context, workflowToken)
  await page.goto(`${fixtureURL}/workspace?tab=plan`)
  await expect(
    page.getByRole('heading', { name: 'Give your day a shape.' }),
  ).toBeVisible()
  await expect.poll(() => serverFunctionURL).not.toBe('')
  const crossSite = await context.request.get(serverFunctionURL, {
    headers: {
      origin: 'https://untrusted.example',
      'sec-fetch-site': 'cross-site',
    },
  })
  expect(crossSite.status()).toBe(403)
  await page.getByLabel('Tag name', { exact: true }).fill('Browser work')
  await page.getByRole('button', { name: 'Add tag', exact: true }).click()
  await expect(
    page.locator('span').filter({ hasText: /^Browser work$/ }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'New task', exact: true }).click()
  await page.getByLabel('Task title', { exact: true }).fill('Browser task')
  await page
    .getByLabel('Description (Markdown)', { exact: true })
    .fill('A **private** task')
  await page
    .getByLabel('Task tag', { exact: true })
    .selectOption({ label: 'Browser work' })
  await page.getByRole('button', { name: 'Save task', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Browser task', exact: true }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'New task', exact: true }).click()
  await page.getByLabel('Task title', { exact: true }).fill('Secondary task')
  await page.getByRole('button', { name: 'Save task', exact: true }).click()
  const handle = page.getByRole('button', {
    name: 'Drag Browser task',
    exact: true,
  })
  await expect(
    page.getByRole('heading', { name: 'Secondary task', exact: true }),
  ).toBeVisible()
  await expect(handle).toBeEnabled()
  await handle.focus()
  await page.keyboard.press('Space', { delay: 80 })
  await expect(handle).toHaveAttribute('aria-pressed', 'true')
  await page.keyboard.press('ArrowDown', { delay: 80 })
  await expect(page.getByRole('status').last()).toContainText(
    'over Secondary task',
  )
  await page.keyboard.press('Space', { delay: 80 })
  await expect(page.locator('h3')).toHaveText([
    'Secondary task',
    'Browser task',
  ])
  const taskCard = page.locator('[data-slot="card"]').filter({
    has: page.getByRole('heading', { name: 'Browser task', exact: true }),
  })
  await taskCard
    .getByLabel('Status', { exact: true })
    .selectOption('in_progress')
  await expect(taskCard.getByLabel('Status', { exact: true })).toHaveValue(
    'in_progress',
  )

  await page.getByRole('link', { name: 'Focus', exact: true }).click()
  await page.getByLabel('Timer mode', { exact: true }).selectOption('stopwatch')
  await page
    .getByLabel('Session title', { exact: true })
    .fill('Browser private focus')
  await page
    .getByLabel('Task', { exact: true })
    .selectOption({ label: 'Browser task' })
  await expect(page.getByLabel('Tag', { exact: true })).toHaveValue(/.+/)
  await page.getByRole('button', { name: 'Start focus', exact: true }).click()
  await expect(
    page.getByRole('button', { name: 'Pause', exact: true }),
  ).toBeVisible()
  await page.screenshot({
    path: 'test-results/tally-focus-desktop.png',
    fullPage: true,
  })
  await context.setOffline(true)
  await expect(page.getByText('Offline.', { exact: false })).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Pause', exact: true }),
  ).toBeDisabled()
  await context.setOffline(false)
  await page.getByRole('button', { name: 'Pause', exact: true }).click()
  await expect(
    page.getByRole('button', { name: 'Resume', exact: true }),
  ).toBeVisible()
  await page.reload()
  await expect(
    page.getByRole('button', { name: 'Resume', exact: true }),
  ).toBeEnabled()
  await page
    .getByLabel('Notes (Markdown)', { exact: true })
    .fill('Saved **focus** note. <img src="https://invalid.example/track">')
  await page.getByRole('button', { name: 'Save details', exact: true }).click()
  await expect(page.locator('.markdown strong')).toHaveText('focus')
  await expect(page.locator('.markdown img')).toHaveCount(0)
  await page.getByRole('button', { name: 'Resume', exact: true }).click()
  await page
    .getByRole('button', { name: 'Finish session', exact: true })
    .click()
  await expect(
    page.getByRole('button', { name: 'Start focus', exact: true }),
  ).toBeVisible()
  await page.getByRole('link', { name: 'Review', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Browser private focus', exact: true }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Edit record', exact: true }).click()
  await page
    .getByLabel('Session title', { exact: true })
    .fill('Reviewed private focus')
  await page.getByRole('button', { name: 'Save record', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Reviewed private focus', exact: true }),
  ).toBeVisible()
  page.once('dialog', (dialog) => void dialog.accept())
  await page.getByRole('button', { name: 'Delete', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Reviewed private focus', exact: true }),
  ).toHaveCount(0)
  await page
    .getByRole('link', { name: 'Show deleted records', exact: true })
    .click()
  await page.getByRole('button', { name: 'Restore', exact: true }).click()
  await page.getByRole('link', { name: 'Show records', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Reviewed private focus', exact: true }),
  ).toBeVisible()

  await page
    .getByRole('button', { name: 'Add manual focus', exact: true })
    .click()
  await page
    .getByLabel('Session title', { exact: true })
    .fill('Manual private focus')
  await page.getByRole('button', { name: 'Save record', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Manual private focus', exact: true }),
  ).toBeVisible()
  await page.getByRole('link', { name: 'Analyze', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Understand where time goes.' }),
  ).toBeVisible()
  await expect(page.getByText('0h 25m', { exact: true }).first()).toBeVisible()
  await page.getByRole('link', { name: 'Settings', exact: true }).click()
  await page.getByLabel('Display name', { exact: true }).fill('Browser member')
  await page
    .getByLabel('Daily goal minutes (0 for unset)', { exact: true })
    .fill('60')
  await page
    .getByLabel('Show my aggregate eligible time', { exact: false })
    .check()
  await page.getByRole('button', { name: 'Save settings', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('Saved.')
  await page.getByLabel('Theme', { exact: true }).selectOption('dark')
  await page.getByRole('button', { name: 'Save settings', exact: true }).click()
  await expect(page.locator('html')).toHaveClass('dark')
  await page.getByLabel('Theme', { exact: true }).selectOption('light')
  await page.getByRole('button', { name: 'Save settings', exact: true }).click()
  await expect(page.locator('html')).not.toHaveClass('dark')
  const downloadEvent = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export JSON', exact: true }).click()
  const download = await downloadEvent
  expect(download.suggestedFilename()).toMatch(/^tally-.*\.json$/)
  const path = await download.path()
  const exported = JSON.parse(await readFile(path!, 'utf8'))
  expect(exported.schemaVersion).toBe(1)
  expect(exported.sessions).toHaveLength(2)
  expect(
    exported.sessions.every(
      (record: { userId: string }) => record.userId === 'approved',
    ),
  ).toBe(true)
  expect(exported).not.toHaveProperty('account')

  await page.getByRole('link', { name: 'Friends', exact: true }).click()
  await expect(
    page.getByRole('link', { name: 'Partner', exact: true }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Add friend', exact: true }).click()
  await expect(page.getByText('Request sent', { exact: true })).toBeVisible()
  const partnerContext = await browser.newContext()
  await authenticate(partnerContext, partnerToken)
  const partner = await partnerContext.newPage()
  await partner.goto(`${fixtureURL}/workspace?tab=friends`)
  await expect(
    partner.getByText('Wants to connect with you', { exact: true }),
  ).toBeVisible()
  await partner
    .getByRole('button', { name: 'Accept request', exact: true })
    .click()
  await expect(
    partner.getByRole('button', { name: 'Remove friend', exact: true }),
  ).toBeVisible()
  await expect(
    partner.getByText('Reviewed private focus', { exact: true }),
  ).toHaveCount(0)
  await expect(partner.getByText('Browser task', { exact: true })).toHaveCount(
    0,
  )
  await page.reload()
  await page
    .getByRole('button', { name: 'Give kudos (0)', exact: true })
    .click()
  await expect(
    page.getByRole('button', { name: 'Retract kudos (1)', exact: true }),
  ).toBeVisible()
  await page.getByRole('link', { name: 'Leaderboards', exact: true }).click()
  await expect(
    page.getByRole('cell', { name: 'Browser member (you)', exact: false }),
  ).toBeVisible()
  await expect(
    page.getByRole('cell', { name: 'Partner', exact: true }),
  ).toHaveCount(0)
  await page.getByRole('link', { name: 'Challenges', exact: true }).click()
  await page
    .getByRole('button', {
      name: 'Join monthly challenge privately',
      exact: true,
    })
    .click()
  await expect(
    page.getByLabel('Share this result and badge with the group'),
  ).not.toBeChecked()
  await page
    .getByLabel('Challenge title', { exact: true })
    .fill('Browser challenge')
  await page.getByLabel('Days', { exact: true }).fill('2')
  await page
    .getByRole('button', { name: 'Create challenge', exact: true })
    .click()
  await expect(
    page.getByRole('heading', { name: 'Browser challenge', exact: true }),
  ).toBeVisible()
  await partnerContext.close()
  await page.screenshot({
    path: 'test-results/tally-challenges-desktop.png',
    fullPage: true,
  })

  await page.setViewportSize({ width: 360, height: 780 })
  await page
    .getByRole('button', { name: 'Toggle navigation', exact: true })
    .click()
  await page.getByRole('link', { name: 'Plan', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Browser task', exact: true }),
  ).toBeVisible()
  await page.screenshot({
    path: 'test-results/tally-plan-mobile.png',
    fullPage: true,
  })
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
  await page.getByRole('button', { name: 'List view', exact: true }).click()
  await expect(
    page.getByRole('button', { name: 'Board view', exact: true }),
  ).toBeVisible()
})
