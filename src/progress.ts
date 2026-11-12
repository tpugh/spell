import type { Progress, Word, WordList } from './types'

/**
 * Motivation rules for Spell (issues #4 and #11).
 *
 * Everything here is deliberately positive: a finished session always earns
 * at least one star, and a missed day never removes stars or shows a loss
 * message. Pure functions only, so the rules are easy to test.
 */

/** Games are capped per day so they cannot out-earn practice and tests. */
export const GAME_STAR_DAILY_CAP = 3

export const EMPTY_PROGRESS: Progress = {
  stars: 0,
  streakDays: 0,
  bestStreak: 0,
  lastPracticeDay: null,
  totalSessions: 0,
  gameStars: 0,
  gameStarsDay: null,
}

/**
 * Fill in fields added after the first release. Older saved progress (and
 * older chrome.storage values) simply has no game fields yet.
 */
export function normalizeProgress(progress: Partial<Progress>): Progress {
  return {
    stars: progress.stars ?? 0,
    streakDays: progress.streakDays ?? 0,
    bestStreak: progress.bestStreak ?? 0,
    lastPracticeDay: progress.lastPracticeDay ?? null,
    totalSessions: progress.totalSessions ?? 0,
    gameStars: progress.gameStars ?? 0,
    gameStarsDay: progress.gameStarsDay ?? null,
  }
}

/** Local calendar day key, e.g. "2026-11-12". Local, not UTC, so bedtime matters. */
export function dayKey(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function previousDayKey(date: Date): string {
  return dayKey(new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1))
}

/**
 * Practice: one star for finishing, two for a clean run where no word needed
 * a retry. Mistakes never cost a star.
 */
export function starsForPractice(missedCount: number, wordCount: number): number {
  if (wordCount <= 0) return 0
  return missedCount === 0 ? 2 : 1
}

/**
 * Test: one star for finishing, plus one at 70% and another at 90%.
 * A completed test is never worth zero stars.
 */
export function starsForTest(correctCount: number, totalWords: number): number {
  if (totalWords <= 0) return 0
  const ratio = correctCount / totalWords
  if (ratio >= 0.9) return 3
  if (ratio >= 0.7) return 2
  return 1
}

/**
 * Game: one star for finishing a round, two if no wrong letter was eaten.
 * The daily cap is applied by `recordGameSession`.
 */
export function starsForGame(cleanRound: boolean): number {
  return cleanRound ? 2 : 1
}

/**
 * Add a finished session to the saved progress. Streaks grow on consecutive
 * local days and simply restart at 1 after a gap - no penalty, no loss copy.
 */
export function recordSession(
  progress: Progress,
  stars: number,
  date: Date = new Date(),
): Progress {
  const today = dayKey(date)
  let streakDays = 1

  if (progress.lastPracticeDay === today) {
    streakDays = Math.max(progress.streakDays, 1)
  } else if (progress.lastPracticeDay === previousDayKey(date)) {
    streakDays = progress.streakDays + 1
  }

  return {
    ...progress,
    stars: progress.stars + Math.max(0, Math.round(stars)),
    streakDays,
    bestStreak: Math.max(progress.bestStreak, streakDays),
    lastPracticeDay: today,
    totalSessions: progress.totalSessions + 1,
  }
}

export interface GameStars {
  progress: Progress
  /** Stars actually added, after the daily cap. */
  awarded: number
}

/**
 * Record a finished game round, honouring the daily game cap. A capped round
 * still advances the streak - playing is practising, even with no stars left.
 */
export function recordGameSession(
  progress: Progress,
  requestedStars: number,
  date: Date = new Date(),
): GameStars {
  const today = dayKey(date)
  const used = progress.gameStarsDay === today ? progress.gameStars : 0
  const awarded = Math.max(0, Math.min(Math.round(requestedStars), GAME_STAR_DAILY_CAP - used))
  const next = recordSession(progress, awarded, date)

  return {
    awarded,
    progress: {
      ...next,
      gameStars: used + awarded,
      gameStarsDay: today,
    },
  }
}

/**
 * Pick one word for "word of the day". Deterministic for a given local date,
 * drawn from every saved list, so the same word shows all day on every screen.
 */
export function wordOfTheDay(lists: WordList[], date: Date = new Date()): Word | null {
  const words = lists
    .flatMap((list) => list.words)
    .filter((word) => word.text.trim().length > 0)

  if (words.length === 0) return null

  // Sorting makes the pick independent of list/word order.
  const sorted = [...words].sort((a, b) => a.text.localeCompare(b.text))
  let hash = 0
  for (const character of dayKey(date)) {
    hash = (hash * 31 + character.charCodeAt(0)) % 1_000_003
  }

  return sorted[hash % sorted.length]
}

/** Star glyphs for a 0-3 score, with a friendly fallback. */
export function starGlyphs(stars: number): string {
  if (stars <= 0) return '💪'
  return '⭐'.repeat(Math.min(stars, 3))
}

export function starLabel(stars: number): string {
  if (stars <= 0) return 'Keep practising'
  return `${stars} ${stars === 1 ? 'star' : 'stars'} earned`
}
