import { test, expect, type Page } from '@playwright/test'

const seedBackup = {
  app: 'spell',
  version: 1,
  exportedAt: 1730000000000,
  wordLists: [
    {
      id: 'gam-list-1',
      name: 'Star List',
      words: [{ id: 'gam-word-1', text: 'cat' }],
      createdAt: 1730000000000,
      updatedAt: 1730000000000,
    },
  ],
  testResults: [],
}

/**
 * Restore a one-word list so the tests can finish a session quickly without
 * walking the word-list editor for every case.
 */
async function seedList(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: /grown-ups/i }).click()
  await page.locator('#backup-file').setInputFiles({
    name: 'gamification.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(seedBackup)),
  })
  await expect(page.locator('#backup-status')).toContainText(/ready to restore/i)
  await page.getByRole('button', { name: /restore backup/i }).click()
  await expect(page.locator('#backup-status')).toContainText(/restored/i)

  await page.getByRole('button', { name: /^home$/i }).click()
  await expect(page.locator('#word-list-select')).toContainText('Star List')
  await page.locator('#word-list-select').selectOption('gam-list-1')
  await expect(page.getByRole('button', { name: /^practice$/i })).toBeEnabled()
}

test('a clean practice earns two stars and starts a streak', async ({ page }) => {
  await seedList(page)

  await page.getByRole('button', { name: /^practice$/i }).click()
  await page.getByLabel(/listen, then type the word/i).fill('cat')
  await page.getByRole('button', { name: /^check$/i }).click()
  await page.getByRole('button', { name: /finish/i }).click()

  await expect(page.getByRole('heading', { name: /great job/i })).toBeVisible()
  await expect(page.getByText(/you earned 2 stars/i)).toBeVisible()

  await page.getByRole('button', { name: /^home$/i }).click()
  await expect(page.locator('#progress-stars')).toHaveText('2')
  await expect(page.locator('#progress-streak')).toHaveText('1')
})

test('a mistake never costs a star', async ({ page }) => {
  await seedList(page)

  await page.getByRole('button', { name: /^practice$/i }).click()
  const answer = page.getByLabel(/listen, then type the word/i)
  await answer.fill('dog')
  await page.getByRole('button', { name: /^check$/i }).click()
  await page.getByRole('button', { name: /try again/i }).click()

  await answer.fill('cat')
  await page.getByRole('button', { name: /^check$/i }).click()
  await page.getByRole('button', { name: /finish/i }).click()

  await expect(page.getByText(/you earned 1 star/i)).toBeVisible()
  await expect(page.getByText(/every practice counts/i)).toBeVisible()

  await page.getByRole('button', { name: /^home$/i }).click()
  await expect(page.locator('#progress-stars')).toHaveText('1')
})

test('a perfect test celebrates and adds three stars', async ({ page }) => {
  await seedList(page)

  await page.getByRole('button', { name: /take a test/i }).click()
  await page.getByLabel(/listen, then type the word/i).fill('cat')
  await page.getByRole('button', { name: /finish test/i }).click()

  await expect(page.getByRole('heading', { name: /test results/i })).toBeVisible()
  await expect(page.getByText(/\+3 stars earned/i)).toBeVisible()
  await expect(page.getByText(/perfect score/i)).toBeVisible()
  await expect(page.locator('.confetti-piece')).toHaveCount(18)

  await page.getByRole('button', { name: /^home$/i }).click()
  await expect(page.locator('#progress-stars')).toHaveText('3')
  await expect(page.locator('#progress-streak')).toHaveText('1')
})
