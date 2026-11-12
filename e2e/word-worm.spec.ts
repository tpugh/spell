import { test, expect, type Page } from '@playwright/test'

const seedBackup = {
  app: 'spell',
  version: 1,
  exportedAt: 1730000000000,
  wordLists: [
    {
      id: 'worm-list-1',
      name: 'Worm List',
      words: [{ id: 'worm-word-1', text: 'cat' }],
      createdAt: 1730000000000,
      updatedAt: 1730000000000,
    },
    {
      id: 'worm-list-2',
      name: 'Second List',
      words: [
        { id: 'worm-word-2', text: 'dog' },
        { id: 'worm-word-3', text: 'sun' },
      ],
      createdAt: 1730000000000,
      updatedAt: 1730000000000,
    },
  ],
  testResults: [],
}

async function seedLists(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: /grown-ups/i }).click()
  await page.locator('#backup-file').setInputFiles({
    name: 'word-worm.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(seedBackup)),
  })
  await expect(page.locator('#backup-status')).toContainText(/ready to restore/i)
  await page.getByRole('button', { name: /restore backup/i }).click()
  await expect(page.locator('#backup-status')).toContainText(/restored/i)
  await page.getByRole('button', { name: /^home$/i }).click()
  await expect(page.getByRole('heading', { name: 'Spell' })).toBeVisible()
}

async function openWorm(page: Page, listId: string) {
  await page.getByRole('button', { name: /^games$/i }).click()
  await expect(page.getByRole('heading', { name: 'Games' })).toBeVisible()
  await page.locator('#game-word-list').selectOption(listId)
  await page.getByRole('button', { name: /^play$/i }).click()
  await expect(page.getByRole('heading', { name: 'Word Worm' })).toBeVisible()
  await expect(page.locator('#worm-word')).toBeVisible()
}

const COLUMNS = 15
const ROWS = 11
const DIRECTIONS = [
  { x: 0, y: -1 },
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
]

/**
 * Shortest route to the target, stepping around every other letter so the
 * walk cannot accidentally eat a distractor and change the board mid-test.
 */
function routeTo(
  from: { x: number; y: number },
  target: { x: number; y: number },
  blocked: Set<string>,
): { x: number; y: number }[] {
  const startKey = `${from.x},${from.y}`
  const cameFrom = new Map<string, string | null>([[startKey, null]])
  const queue: { x: number; y: number }[] = [from]

  while (queue.length > 0) {
    const point = queue.shift()
    if (!point) break

    if (point.x === target.x && point.y === target.y) {
      const reversed: { x: number; y: number }[] = []
      let key: string | null = `${point.x},${point.y}`
      while (key) {
        const [x, y] = key.split(',').map(Number)
        reversed.push({ x, y })
        key = cameFrom.get(key) ?? null
      }
      return reversed.reverse().slice(1)
    }

    for (const direction of DIRECTIONS) {
      const next = { x: point.x + direction.x, y: point.y + direction.y }
      if (next.x < 0 || next.x >= COLUMNS || next.y < 0 || next.y >= ROWS) continue
      const key = `${next.x},${next.y}`
      if (cameFrom.has(key) || blocked.has(key)) continue
      cameFrom.set(key, `${point.x},${point.y}`)
      queue.push(next)
    }
  }

  throw new Error(`no route to ${target.x},${target.y}`)
}

/** Click one cell at a time until the head reaches the target. */
async function walkTo(page: Page, targetX: number, targetY: number) {
  const stage = page.locator('#worm-stage')
  const headX = Number(await stage.getAttribute('data-head-x'))
  const headY = Number(await stage.getAttribute('data-head-y'))

  const blocked = new Set(
    await page
      .locator('[data-correct="false"]')
      .evaluateAll((cells) => cells.map((cell) => cell.getAttribute('data-cell') ?? '')),
  )
  blocked.delete(`${targetX},${targetY}`)

  const route = routeTo({ x: headX, y: headY }, { x: targetX, y: targetY }, blocked)

  for (const step of route) {
    await page.locator(`[data-cell="${step.x},${step.y}"]`).click({ force: true })
    await expect(stage).toHaveAttribute('data-head-x', String(step.x))
    await expect(stage).toHaveAttribute('data-head-y', String(step.y))
  }
}

async function eatTarget(page: Page, selector: string) {
  const target = page.locator(selector)
  await expect(target).toHaveCount(1)
  const cell = await target.getAttribute('data-cell')
  if (!cell) throw new Error('letter cell is missing its coordinates')
  const [x, y] = cell.split(',').map(Number)
  await walkTo(page, x, y)
}

test('the games screen offers a word-list choice and explains when it cannot play', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: /^games$/i }).click()

  await expect(page.getByRole('heading', { name: 'Games' })).toBeVisible()
  await expect(page.getByText(/no word lists yet/i)).toBeVisible()
  await expect(page.getByRole('button', { name: /^play$/i })).toBeDisabled()
  await expect(page.getByRole('button', { name: /manage word lists/i })).toBeVisible()
})

test('choosing a list on the games screen updates the list used everywhere', async ({ page }) => {
  await seedLists(page)
  await page.getByRole('button', { name: /^games$/i }).click()

  await page.locator('#game-word-list').selectOption('worm-list-2')
  await expect(page.locator('#game-word-list')).toContainText('Second List (2 words)')

  await page.getByRole('button', { name: /back to home/i }).click()
  await expect(page.locator('#word-list-select')).toHaveValue('worm-list-2')
})

test('a child spells a word, sees the letters fill in, and finishes the round', async ({ page }) => {
  await seedLists(page)
  await openWorm(page, 'worm-list-1')

  // The word itself is never rendered: three blanks only.
  await expect(page.locator('#worm-word span')).toHaveCount(3)
  await expect(page.locator('#worm-word span[data-filled="true"]')).toHaveCount(0)

  for (let letter = 1; letter <= 3; letter += 1) {
    await eatTarget(page, '[data-correct="true"]')
    await expect(page.locator('#worm-word span[data-filled="true"]')).toHaveCount(letter)
  }

  const nextWord = page.getByRole('button', { name: /next word/i })
  await expect(nextWord).toBeVisible()
  await nextWord.click()

  await expect(page.getByRole('heading', { name: /round complete/i })).toBeVisible()
  await expect(page.locator('#worm-stars')).toContainText(/star/i)
  await expect(page.getByText(/1 of 1 words spelled/i)).toBeVisible()

  await page.getByRole('button', { name: /back to games/i }).click()
  await expect(page.getByRole('heading', { name: 'Games' })).toBeVisible()
})

test('a wrong letter never ends the round or loses a star', async ({ page }) => {
  await seedLists(page)
  await openWorm(page, 'worm-list-1')

  await eatTarget(page, '[data-correct="false"]')

  await expect(page.locator('#worm-word span[data-filled="true"]')).toHaveCount(0)
  await expect(page.locator('#worm-status')).toContainText(/listen again|not that one/i)
  await expect(page.getByRole('heading', { name: 'Word Worm' })).toBeVisible()
  await expect(page.getByRole('button', { name: /move right/i })).toBeEnabled()

  // The missed word is reviewed at the end, even though the round goes on.
  for (let letter = 1; letter <= 3; letter += 1) {
    await eatTarget(page, '[data-correct="true"]')
  }
  await page.getByRole('button', { name: /next word/i }).click()

  await expect(page.getByRole('heading', { name: /round complete/i })).toBeVisible()
  await expect(page.getByText(/words to practise/i)).toBeVisible()
  await expect(page.getByText('cat', { exact: true })).toBeVisible()
})

test('the game can be paused and resumed without a pointer', async ({ page }) => {
  await seedLists(page)
  await openWorm(page, 'worm-list-1')

  await page.keyboard.press('Escape')
  await expect(page.getByText('Paused', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: /quit to games/i })).toBeVisible()

  await page.keyboard.press('Escape')
  await expect(page.getByText('Paused', { exact: true })).toHaveCount(0)
})

test('the movement buttons meet the 48px target size', async ({ page }) => {
  await seedLists(page)
  await openWorm(page, 'worm-list-1')

  const pad = page.getByRole('group', { name: /move the worm/i }).getByRole('button')
  await expect(pad).toHaveCount(4)

  const count = await pad.count()
  for (let index = 0; index < count; index += 1) {
    const box = await pad.nth(index).boundingBox()
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(48)
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(48)
  }
})
