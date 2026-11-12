import { readFile } from 'node:fs/promises'
import { test, expect } from '@playwright/test'

const backupFixture = {
  app: 'spell',
  version: 1,
  exportedAt: 1730000000000,
  wordLists: [
    {
      id: 'backup-list-1',
      name: 'Backup List',
      words: [
        { id: 'backup-word-1', text: 'cat' },
        { id: 'backup-word-2', text: 'dog' },
      ],
      createdAt: 1730000000000,
      updatedAt: 1730000000000,
    },
  ],
  testResults: [
    {
      id: 'backup-result-1',
      wordListId: 'backup-list-1',
      wordListName: 'Backup List',
      date: 1730000000000,
      totalWords: 2,
      correctCount: 1,
      missedWords: ['dog'],
      durationMs: 12000,
    },
  ],
}

function backupFile() {
  return {
    name: 'spell-backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(backupFixture)),
  }
}

test('a parent can restore a backup and use the imported list', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /grown-ups/i }).click()

  await expect(page.getByRole('heading', { name: /back up & restore/i })).toBeVisible()
  await expect(page.getByText(/0 word lists and 0 test results are saved/i)).toBeVisible()

  await page.locator('#backup-file').setInputFiles(backupFile())
  await expect(page.locator('#backup-status')).toContainText(/ready to restore 1 word list and 1 test result/i)

  await page.getByRole('button', { name: /restore backup/i }).click()
  await expect(page.locator('#backup-status')).toContainText(/restored 1 word list and 1 test result/i)

  await page.getByRole('button', { name: /^home$/i }).click()
  await expect(page.locator('#word-list-select')).toContainText('Backup List (2 words)')
})

test('a parent can download a backup of everything on the device', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /grown-ups/i }).click()
  await page.locator('#backup-file').setInputFiles(backupFile())
  await page.getByRole('button', { name: /restore backup/i }).click()
  await expect(page.locator('#backup-status')).toContainText(/restored/i)

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: /save a backup/i }).click(),
  ])

  expect(download.suggestedFilename()).toMatch(/^spell-backup-\d{4}-\d{2}-\d{2}\.json$/)

  const path = await download.path()
  expect(path).not.toBeNull()
  const parsed = JSON.parse(await readFile(path ?? '', 'utf8'))

  expect(parsed.app).toBe('spell')
  expect(parsed.version).toBe(1)
  expect(parsed.wordLists).toHaveLength(1)
  expect(parsed.wordLists[0].name).toBe('Backup List')
  expect(parsed.testResults).toHaveLength(1)
})

test('a damaged backup file is rejected without changing data', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /grown-ups/i }).click()

  await page.locator('#backup-file').setInputFiles({
    name: 'not-a-backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"hello":"world"}'),
  })

  await expect(page.locator('#backup-status')).toContainText(/not created by Spell/i)
  await expect(page.getByRole('button', { name: /restore backup/i })).toHaveCount(0)
})
