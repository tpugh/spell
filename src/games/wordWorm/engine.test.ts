import { describe, expect, it } from 'vitest'
import type { Word } from '../../types'
import { createWormState, wormReducer, type WormAction, type WormState } from './engine'
import { WORM_COLUMNS, WORM_ROWS, type PlacedLetter, type Point } from './rules'

const WORDS: Word[] = [{ id: 'word-1', text: 'cat' }]
const DIRECTIONS: Point[] = [
  { x: 0, y: -1 },
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
]

/**
 * Breadth-first walk to a cell, stepping around every other letter so tests
 * only eat the letter they aim for.
 */
function walk(state: WormState, target: Point): WormState {
  const from = state.worm[0]
  const blocked = new Set(
    state.letters
      .filter((letter) => letter.x !== target.x || letter.y !== target.y)
      .map((letter) => `${letter.x},${letter.y}`),
  )
  const startKey = `${from.x},${from.y}`
  const cameFrom = new Map<string, string | null>([[startKey, null]])
  const queue: Point[] = [from]
  let path: Point[] = []

  while (queue.length > 0) {
    const point = queue.shift()
    if (!point) break

    if (point.x === target.x && point.y === target.y) {
      const reversed: Point[] = []
      let key: string | null = `${point.x},${point.y}`
      while (key) {
        const [x, y] = key.split(',').map(Number)
        reversed.push({ x, y })
        key = cameFrom.get(key) ?? null
      }
      path = reversed.reverse().slice(1)
      break
    }

    for (const direction of DIRECTIONS) {
      const next = { x: point.x + direction.x, y: point.y + direction.y }
      if (next.x < 0 || next.x >= WORM_COLUMNS || next.y < 0 || next.y >= WORM_ROWS) continue
      const key = `${next.x},${next.y}`
      if (cameFrom.has(key) || blocked.has(key)) continue
      cameFrom.set(key, `${point.x},${point.y}`)
      queue.push(next)
    }
  }

  let current = state
  for (const step of path) {
    const head = current.worm[0]
    current = wormReducer(current, {
      type: 'move',
      dx: step.x - head.x,
      dy: step.y - head.y,
    })
  }

  if (current.worm[0].x !== target.x || current.worm[0].y !== target.y) {
    throw new Error(`could not reach ${target.x},${target.y}`)
  }
  return current
}

function correctLetter(state: WormState): PlacedLetter {
  const letter = state.letters.find((item) => item.correct)
  if (!letter) throw new Error('no correct letter on the board')
  return letter
}

function wrongLetter(state: WormState): PlacedLetter {
  const letter = state.letters.find((item) => !item.correct)
  if (!letter) throw new Error('no distractor on the board')
  return letter
}

describe('createWormState', () => {
  it('starts on the first word with three letter choices', () => {
    const state = createWormState(WORDS)

    expect(state.phase).toBe('playing')
    expect(state.wordIndex).toBe(0)
    expect(state.letterIndex).toBe(0)
    expect(state.letters).toHaveLength(3)
    expect(state.cleanRun).toBe(true)
    expect(state.speech?.text).toBe('cat')
    expect(state.worm).toHaveLength(3)
  })

  it('shows the summary immediately when there are no words', () => {
    const state = createWormState([])
    expect(state.phase).toBe('summary')
  })
})

describe('wormReducer', () => {
  it('eats the correct letter in order and grows the worm', () => {
    const state = createWormState(WORDS)
    const next = walk(state, correctLetter(state))

    expect(next.letterIndex).toBe(1)
    expect(next.cleanRun).toBe(true)
    expect(next.worm).toHaveLength(4)
    expect(next.sound?.kind).toBe('correct')
    expect(next.letters).toHaveLength(3)
    expect(next.letters.filter((letter) => letter.correct)).toHaveLength(1)
  })

  it('treats a wrong letter gently: no progress, no lost star, word repeated', () => {
    const state = createWormState(WORDS)
    const next = walk(state, wrongLetter(state))

    expect(next.letterIndex).toBe(0)
    expect(next.cleanRun).toBe(false)
    expect(next.missedWords).toEqual(['cat'])
    expect(next.sound?.kind).toBe('wrong')
    expect(next.speech?.text).toBe('cat')
    expect(next.worm).toHaveLength(3)
  })

  it('finishes a word and moves on to the summary after the last one', () => {
    let state = createWormState(WORDS)

    for (let step = 0; step < 3; step += 1) {
      state = walk(state, correctLetter(state))
    }

    expect(state.wordComplete).toBe(true)
    expect(state.completedWords).toBe(1)
    expect(state.letters).toEqual([])

    const summary = wormReducer(state, { type: 'next-word' })
    expect(summary.phase).toBe('summary')
    expect(summary.speech?.text).toMatch(/round finished/i)
  })

  it('moves between words without losing the missed-word list', () => {
    let state = createWormState([
      { id: 'word-1', text: 'cat' },
      { id: 'word-2', text: 'dog' },
    ])

    state = walk(state, wrongLetter(state))
    for (let step = 0; step < 3; step += 1) {
      state = walk(state, correctLetter(state))
    }

    const second = wormReducer(state, { type: 'next-word' })
    expect(second.wordIndex).toBe(1)
    expect(second.letterIndex).toBe(0)
    expect(second.missedWords).toEqual(['cat'])
    expect(second.wordComplete).toBe(false)
    expect(second.speech?.text).toBe('dog')
  })

  it('only accepts taps on a cell next to the head', () => {
    const state = createWormState(WORDS)
    const head = state.worm[0]

    const far = wormReducer(state, { type: 'step', x: head.x + 3, y: head.y })
    expect(far).toBe(state)

    const adjacent = wormReducer(state, { type: 'step', x: head.x + 1, y: head.y })
    expect(adjacent.worm[0]).toEqual({ x: head.x + 1, y: head.y })
  })

  it('stays on the board at the edges', () => {
    const state = createWormState(WORDS)
    const head = state.worm[0]

    let atEdge = state
    for (let step = 0; step < 10; step += 1) {
      atEdge = wormReducer(atEdge, { type: 'move', dx: 0, dy: -1 })
    }

    expect(atEdge.worm[0].y).toBe(0)
    expect(atEdge.worm[0].x).toBe(head.x)
  })

  it('replays the prompt on demand without changing progress', () => {
    const state = createWormState(WORDS)
    const next = wormReducer(state, { type: 'replay-word' })

    expect(next.letterIndex).toBe(0)
    expect(next.speech?.text).toBe('cat')
    expect(next.speech?.nonce).toBeGreaterThan(state.eventNonce - 1)
  })

  it('restarts a fresh round', () => {
    let state = createWormState(WORDS)
    state = walk(state, wrongLetter(state))
    const restarted = wormReducer(state, {
      type: 'restart',
      words: [
        { id: 'word-1', text: 'cat' },
        { id: 'word-2', text: 'dog' },
      ],
    })

    expect(restarted.phase).toBe('playing')
    expect(restarted.completedWords).toBe(0)
    expect(restarted.missedWords).toEqual([])
    expect(restarted.cleanRun).toBe(true)
  })

  it('ignores actions after the summary', () => {
    let state = createWormState(WORDS)
    for (let step = 0; step < 3; step += 1) {
      state = walk(state, correctLetter(state))
    }
    state = wormReducer(state, { type: 'next-word' })

    const action: WormAction = { type: 'move', dx: 1, dy: 0 }
    expect(wormReducer(state, action)).toBe(state)
  })
})
