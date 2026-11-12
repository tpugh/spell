import { describe, expect, it } from 'vitest'
import {
  EMPTY_PROGRESS,
  dayKey,
  recordSession,
  starGlyphs,
  starLabel,
  starsForPractice,
  starsForTest,
  wordOfTheDay,
} from './progress'
import type { WordList } from './types'

function listOf(...texts: string[]): WordList {
  return {
    id: 'list-1',
    name: 'Week 1',
    words: texts.map((text, index) => ({ id: `word-${index}`, text })),
    createdAt: 1,
    updatedAt: 1,
  }
}

describe('star rules', () => {
  it('always rewards a finished practice, with a bonus for a clean run', () => {
    expect(starsForPractice(0, 5)).toBe(2)
    expect(starsForPractice(1, 5)).toBe(1)
    expect(starsForPractice(4, 5)).toBe(1)
    expect(starsForPractice(0, 0)).toBe(0)
  })

  it('never gives a finished test zero stars', () => {
    expect(starsForTest(0, 10)).toBe(1)
    expect(starsForTest(6, 10)).toBe(1)
    expect(starsForTest(7, 10)).toBe(2)
    expect(starsForTest(9, 10)).toBe(3)
    expect(starsForTest(10, 10)).toBe(3)
    expect(starsForTest(0, 0)).toBe(0)
  })

  it('describes stars positively, including zero', () => {
    expect(starGlyphs(2)).toBe('⭐⭐')
    expect(starLabel(1)).toBe('1 star earned')
    expect(starLabel(3)).toBe('3 stars earned')
    expect(starLabel(0)).toBe('Keep practising')
    expect(starGlyphs(0)).toBe('💪')
  })
})

describe('dayKey', () => {
  it('uses the local calendar day', () => {
    expect(dayKey(new Date(2026, 0, 5))).toBe('2026-01-05')
    expect(dayKey(new Date(2026, 10, 12, 23, 59))).toBe('2026-11-12')
  })
})

describe('recordSession', () => {
  it('starts a streak on the first session', () => {
    const next = recordSession(EMPTY_PROGRESS, 2, new Date(2026, 10, 10))

    expect(next).toEqual({
      stars: 2,
      streakDays: 1,
      bestStreak: 1,
      lastPracticeDay: '2026-11-10',
      totalSessions: 1,
    })
  })

  it('does not grow the streak twice in one day but keeps the stars', () => {
    const first = recordSession(EMPTY_PROGRESS, 2, new Date(2026, 10, 10, 8))
    const second = recordSession(first, 1, new Date(2026, 10, 10, 19))

    expect(second.streakDays).toBe(1)
    expect(second.stars).toBe(3)
    expect(second.totalSessions).toBe(2)
  })

  it('grows the streak on the next day and remembers the best', () => {
    const first = recordSession(EMPTY_PROGRESS, 2, new Date(2026, 10, 10))
    const second = recordSession(first, 2, new Date(2026, 10, 11))
    const third = recordSession(second, 2, new Date(2026, 10, 12))

    expect(second.streakDays).toBe(2)
    expect(third.streakDays).toBe(3)
    expect(third.bestStreak).toBe(3)
  })

  it('handles month and year boundaries', () => {
    const newYearsEve = recordSession(EMPTY_PROGRESS, 1, new Date(2025, 11, 31))
    const newYearsDay = recordSession(newYearsEve, 1, new Date(2026, 0, 1))

    expect(newYearsDay.streakDays).toBe(2)
    expect(newYearsDay.lastPracticeDay).toBe('2026-01-01')
  })

  it('restarts at one after a gap without taking anything away', () => {
    const first = recordSession(EMPTY_PROGRESS, 3, new Date(2026, 10, 6))
    const afterGap = recordSession(first, 3, new Date(2026, 10, 9))

    expect(afterGap.streakDays).toBe(1)
    expect(afterGap.bestStreak).toBe(1)
    expect(afterGap.stars).toBe(6)
    expect(afterGap.totalSessions).toBe(2)
  })

  it('never subtracts stars for a zero-star session', () => {
    const saved = recordSession(EMPTY_PROGRESS, 2, new Date(2026, 10, 10))
    const zero = recordSession(saved, 0, new Date(2026, 10, 11))

    expect(zero.stars).toBe(2)
  })
})

describe('wordOfTheDay', () => {
  it('returns null when there are no words', () => {
    expect(wordOfTheDay([], new Date(2026, 10, 12))).toBeNull()
    expect(wordOfTheDay([listOf('', '   ')], new Date(2026, 10, 12))).toBeNull()
  })

  it('is stable within a day and drawn from the saved words', () => {
    const lists = [listOf('cat', 'dog', 'sun'), listOf('hat')]
    const morning = wordOfTheDay(lists, new Date(2026, 10, 12, 7))
    const evening = wordOfTheDay(lists, new Date(2026, 10, 12, 21))

    expect(morning).not.toBeNull()
    expect(evening?.id).toBe(morning?.id)
    expect(['cat', 'dog', 'sun', 'hat']).toContain(morning?.text)
  })

  it('does not depend on the order of words inside the lists', () => {
    const forward = wordOfTheDay([listOf('cat', 'dog', 'sun')], new Date(2026, 10, 12))
    const reversed = wordOfTheDay([listOf('sun', 'dog', 'cat')], new Date(2026, 10, 12))

    expect(reversed?.text).toBe(forward?.text)
  })
})
