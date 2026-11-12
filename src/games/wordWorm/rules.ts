import type { Word, WordList } from '../../types'

/** Grid and round constants for Word Worm (issue #11). */
export const WORM_COLUMNS = 15
export const WORM_ROWS = 11
export const WORM_START_X = 7
export const WORM_START_Y = 5
export const WORM_WORDS_PER_ROUND = 5
/** Wrong letters before the correct cell starts pulsing. */
export const WORM_HINT_AFTER = 2
/** Wrong letters before the letter name is spoken as well. */
export const WORM_REVEAL_AFTER = 4

export interface Point {
  x: number
  y: number
}

export interface PlacedLetter extends Point {
  letter: string
  correct: boolean
}

/**
 * Letters a six-year-old commonly mixes up. Picking distractors from here
 * turns "eat any letter" into real spelling discrimination.
 */
const CONFUSABLES: Record<string, string[]> = {
  a: ['e', 'o'],
  b: ['d', 'p'],
  c: ['k', 's'],
  d: ['b', 'g'],
  e: ['a', 'i'],
  f: ['t', 'v'],
  g: ['q', 'j'],
  h: ['n', 'b'],
  i: ['l', 'j'],
  j: ['i', 'g'],
  k: ['c', 'g'],
  l: ['i', 't'],
  m: ['n', 'w'],
  n: ['m', 'h'],
  o: ['a', 'u'],
  p: ['q', 'b'],
  q: ['p', 'g'],
  r: ['n', 't'],
  s: ['c', 'z'],
  t: ['l', 'f'],
  u: ['v', 'n'],
  v: ['u', 'w'],
  w: ['m', 'v'],
  x: ['z', 's'],
  y: ['v', 'i'],
  z: ['s', 'x'],
}

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'

/**
 * Two letters that look or sound like `letter`. Falls back to letters from
 * the word, then the alphabet, so the result is always exactly two letters.
 */
export function distractorsFor(letter: string, word: string): string[] {
  const target = letter.toLowerCase()
  const picked: string[] = []

  function add(candidate: string) {
    if (picked.length >= 2) return
    if (candidate === target || picked.includes(candidate)) return
    picked.push(candidate)
  }

  for (const candidate of CONFUSABLES[target] ?? []) add(candidate)
  for (const candidate of word.toLowerCase()) add(candidate)
  for (const candidate of ALPHABET) add(candidate)

  return picked
}

/** Only plain words of two or more letters work on the grid. */
export function isWormWord(word: Word): boolean {
  return /^[a-z]{2,}$/i.test(word.text.trim())
}

/** How much help the child gets after a number of wrong letters. */
export function hintLevelFor(wrongCount: number): 0 | 1 | 2 {
  if (wrongCount >= WORM_REVEAL_AFTER) return 2
  if (wrongCount >= WORM_HINT_AFTER) return 1
  return 0
}

export function usableWords(list: WordList): Word[] {
  return list.words.filter(isWormWord)
}

export function hasPlayableWords(list: WordList | null): boolean {
  return list !== null && usableWords(list).length > 0
}

/**
 * Up to five words for a round. Words missed in the previous round go first,
 * then a shuffled selection from the rest of the list.
 */
export function wordsForRound(
  list: WordList,
  priority: string[] = [],
  limit = WORM_WORDS_PER_ROUND,
): Word[] {
  const usable = usableWords(list)
  const picked: Word[] = []
  const seen = new Set<string>()

  for (const text of priority) {
    if (picked.length >= limit) break
    const match = usable.find((word) => word.text === text && !seen.has(word.id))
    if (match) {
      picked.push(match)
      seen.add(match.id)
    }
  }

  const rest = usable.filter((word) => !seen.has(word.id))
  for (let index = rest.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1))
    const current = rest[index]
    rest[index] = rest[swap]
    rest[swap] = current
  }

  for (const word of rest) {
    if (picked.length >= limit) break
    picked.push(word)
  }

  return picked
}

/** Small deterministic hash so letter placement is stable for a word. */
export function seedFrom(text: string): number {
  let hash = 2166136261
  for (const character of text) {
    hash ^= character.charCodeAt(0)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function seededRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Place the next needed letter plus two distractors on free cells. The middle
 * of the board is kept clear so the worm always starts with a choice.
 */
export function placeLetters(
  word: string,
  letterIndex: number,
  seedText: string,
  blocked: Point[] = [],
): PlacedLetter[] {
  const needed = word.toLowerCase()[letterIndex] ?? ''
  const distractors = distractorsFor(needed, word)
  const taken = new Set(blocked.map((point) => `${point.x},${point.y}`))

  for (let offsetY = -2; offsetY <= 2; offsetY += 1) {
    for (let offsetX = -2; offsetX <= 2; offsetX += 1) {
      taken.add(`${WORM_START_X + offsetX},${WORM_START_Y + offsetY}`)
    }
  }

  const free: Point[] = []
  for (let y = 0; y < WORM_ROWS; y += 1) {
    for (let x = 0; x < WORM_COLUMNS; x += 1) {
      if (!taken.has(`${x},${y}`)) free.push({ x, y })
    }
  }

  const random = seededRandom(seedFrom(`${seedText}:${letterIndex}`))
  const count = Math.min(3, free.length)
  const correctIndex = Math.floor(random() * count)
  const chosen: Point[] = []

  for (let index = 0; index < count; index += 1) {
    const pick = Math.floor(random() * free.length)
    const [point] = free.splice(pick, 1)
    chosen.push(point)
  }

  return chosen.map((point, index) => {
    const distractorIndex = index < correctIndex ? index : index - 1
    return {
      ...point,
      letter: index === correctIndex ? needed : (distractors[distractorIndex] ?? 'x'),
      correct: index === correctIndex,
    }
  })
}
