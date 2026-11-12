import { describe, expect, it } from 'vitest'
import type { WordList } from '../../types'
import {
  distractorsFor,
  hasPlayableWords,
  hintLevelFor,
  isWormWord,
  placeLetters,
  usableWords,
  WORM_COLUMNS,
  WORM_ROWS,
  WORM_START_X,
  WORM_START_Y,
  WORM_WORDS_PER_ROUND,
  wordsForRound,
} from './rules'

function listOf(...texts: string[]): WordList {
  return {
    id: 'list-1',
    name: 'Week 1',
    words: texts.map((text, index) => ({ id: `word-${index}`, text })),
    createdAt: 1,
    updatedAt: 1,
  }
}

describe('distractorsFor', () => {
  it('offers two confusable letters and never the answer', () => {
    const choices = distractorsFor('b', 'bat')

    expect(choices).toHaveLength(2)
    expect(choices).not.toContain('b')
    expect(choices).toEqual(expect.arrayContaining(['d', 'p']))
  })

  it('always returns two letters for any alphabet letter', () => {
    for (const letter of 'abcdefghijklmnopqrstuvwxyz') {
      const choices = distractorsFor(letter, 'spell')
      expect(choices).toHaveLength(2)
      expect(choices).not.toContain(letter)
    }
  })
})

describe('usable words', () => {
  it('accepts plain words of two or more letters only', () => {
    expect(isWormWord({ id: 'a', text: 'cat' })).toBe(true)
    expect(isWormWord({ id: 'b', text: 'I' })).toBe(false)
    expect(isWormWord({ id: 'c', text: 'ice cream' })).toBe(false)
    expect(isWormWord({ id: 'd', text: 'well-done' })).toBe(false)
    expect(usableWords(listOf('cat', 'a', 'sun')).map((word) => word.text)).toEqual(['cat', 'sun'])
  })

  it('reports whether a list can be played', () => {
    expect(hasPlayableWords(null)).toBe(false)
    expect(hasPlayableWords(listOf('a'))).toBe(false)
    expect(hasPlayableWords(listOf('cat'))).toBe(true)
  })
})

describe('wordsForRound', () => {
  it('caps the round and puts the words to revisit first', () => {
    const round = wordsForRound(listOf('cat', 'dog', 'sun', 'hat', 'pen', 'cup'), ['pen', 'cup'])

    expect(round).toHaveLength(WORM_WORDS_PER_ROUND)
    expect(round.slice(0, 2).map((word) => word.text)).toEqual(['pen', 'cup'])
  })

  it('uses the whole list when it is shorter than a round', () => {
    const round = wordsForRound(listOf('cat', 'dog'))
    expect(round.map((word) => word.text).sort()).toEqual(['cat', 'dog'])
  })

  it('ignores priority words that are not playable', () => {
    const round = wordsForRound(listOf('cat'), ['ice cream'])
    expect(round.map((word) => word.text)).toEqual(['cat'])
  })
})

describe('hintLevelFor', () => {
  it('escalates gently and only after repeated misses', () => {
    expect(hintLevelFor(0)).toBe(0)
    expect(hintLevelFor(1)).toBe(0)
    expect(hintLevelFor(2)).toBe(1)
    expect(hintLevelFor(3)).toBe(1)
    expect(hintLevelFor(4)).toBe(2)
    expect(hintLevelFor(9)).toBe(2)
  })
})

describe('placeLetters', () => {
  it('places exactly one correct letter plus two distractors on unique cells', () => {
    const letters = placeLetters('cat', 0, 'cat:0')

    expect(letters).toHaveLength(3)
    expect(letters.filter((letter) => letter.correct)).toHaveLength(1)
    expect(letters.find((letter) => letter.correct)?.letter).toBe('c')

    const cells = new Set(letters.map((letter) => `${letter.x},${letter.y}`))
    expect(cells.size).toBe(3)

    for (const letter of letters) {
      expect(letter.x).toBeGreaterThanOrEqual(0)
      expect(letter.x).toBeLessThan(WORM_COLUMNS)
      expect(letter.y).toBeGreaterThanOrEqual(0)
      expect(letter.y).toBeLessThan(WORM_ROWS)
      // The 5x5 centre stays clear so the worm always starts with a choice.
      const insideCentre =
        Math.abs(letter.x - WORM_START_X) <= 2 && Math.abs(letter.y - WORM_START_Y) <= 2
      expect(insideCentre).toBe(false)
    }
  })

  it('is deterministic for the same word and position', () => {
    const first = placeLetters('sun', 1, 'sun:1')
    const second = placeLetters('sun', 1, 'sun:1')

    expect(second).toEqual(first)
  })

  it('keeps letters off the worm', () => {
    const blocked = [{ x: 1, y: 1 }]
    const letters = placeLetters('cat', 0, 'cat:0', blocked)

    expect(letters.some((letter) => letter.x === 1 && letter.y === 1)).toBe(false)
  })

  it('uses the letter for the requested position', () => {
    const letters = placeLetters('cat', 2, 'cat:2')
    expect(letters.find((letter) => letter.correct)?.letter).toBe('t')
  })
})
