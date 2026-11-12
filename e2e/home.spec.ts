import { test, expect } from '@playwright/test'

test('home page loads and shows Spell heading', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Spell' })).toBeVisible()
})

test('tap counter increments', async ({ page }) => {
  await page.goto('/')
  const button = page.getByRole('button', { name: /Taps:/ })
  await expect(button).toContainText('Taps: 0')
  await button.click()
  await expect(button).toContainText('Taps: 1')
})