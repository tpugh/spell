import { test, expect } from '@playwright/test'

test.describe('accessibility', () => {
  test('skip link is the first tab stop and moves focus to main content', async ({ page }) => {
    await page.goto('/')

    // The skip link is rendered once the app finishes loading, so wait for the
    // home screen before testing the very first Tab.
    await expect(page.getByRole('heading', { name: 'Spell' })).toBeVisible()

    await page.keyboard.press('Tab')
    const skipLink = page.getByRole('link', { name: /skip to main content/i })
    await expect(skipLink).toBeFocused()

    await page.keyboard.press('Enter')
    await expect(page.locator('#main-content')).toBeFocused()
  })

  test('focus moves to the new screen after navigation', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('button', { name: /manage word lists/i }).click()
    await expect(page.getByRole('heading', { name: 'Word Lists' })).toBeVisible()
    await expect(page.locator('#main-content')).toBeFocused()
  })

  test('easy-read font toggle persists across reloads', async ({ page }) => {
    await page.goto('/')

    const toggle = page.getByRole('button', { name: /easy-read text/i })
    await expect(toggle).toHaveAttribute('aria-pressed', 'false')

    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-pressed', 'true')
    await expect(page.locator('html')).toHaveAttribute('data-font', 'easy-read')

    await page.reload()

    const toggleAfterReload = page.getByRole('button', { name: /easy-read text/i })
    await expect(toggleAfterReload).toHaveAttribute('aria-pressed', 'true')
    await expect(page.locator('html')).toHaveAttribute('data-font', 'easy-read')
  })

  test('home controls meet the 48px minimum tap target', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Spell' })).toBeVisible()

    const controls = page.getByRole('main').getByRole('button')
    const count = await controls.count()
    expect(count).toBeGreaterThan(0)

    for (let index = 0; index < count; index += 1) {
      const box = await controls.nth(index).boundingBox()
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(48)
      expect(box?.width ?? 0).toBeGreaterThanOrEqual(48)
    }
  })
})
