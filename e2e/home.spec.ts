import { test, expect } from '@playwright/test'

test('home page loads and shows Spell heading', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Spell' })).toBeVisible()
})

test('can open the word list manager', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /Manage Word Lists/i }).click()
  await expect(page.getByRole('heading', { name: /Word Lists/i })).toBeVisible()
})
