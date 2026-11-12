import type { Word } from '../../types'
import {
  hintLevelFor,
  placeLetters,
  WORM_COLUMNS,
  WORM_ROWS,
  WORM_START_X,
  WORM_START_Y,
  type PlacedLetter,
  type Point,
} from './rules'

export type SoundKind = 'correct' | 'wrong' | 'complete'
export type GamePhase = 'playing' | 'summary'

export interface Speech {
  text: string
  /** Changes for every new prompt so the component only speaks new text. */
  nonce: number
}

export interface Sound {
  kind: SoundKind
  nonce: number
}

export interface WormState {
  words: Word[]
  wordIndex: number
  /** How many letters of the current word have been eaten. */
  letterIndex: number
  /** Head first. Purely visual - a motor slip can never end the round. */
  worm: Point[]
  letters: PlacedLetter[]
  wrongAtPosition: number
  hintLevel: 0 | 1 | 2
  cleanRun: boolean
  completedWords: number
  missedWords: string[]
  phase: GamePhase
  wordComplete: boolean
  /** Spoken and shown in the polite live region. Never contains the answer. */
  message: string
  speech: Speech | null
  sound: Sound | null
  eventNonce: number
}

export type WormAction =
  | { type: 'move'; dx: number; dy: number }
  | { type: 'step'; x: number; y: number }
  | { type: 'next-word' }
  | { type: 'replay-word' }
  | { type: 'restart'; words: Word[] }

function initialWorm(): Point[] {
  return [
    { x: WORM_START_X, y: WORM_START_Y },
    { x: WORM_START_X - 1, y: WORM_START_Y },
    { x: WORM_START_X - 2, y: WORM_START_Y },
  ]
}

function startWord(state: WormState, wordIndex: number): WormState {
  const word = state.words[wordIndex]
  if (!word) {
    return { ...state, phase: 'summary', message: 'Round finished.' }
  }

  const worm = initialWorm()
  const nonce = state.eventNonce + 1
  const letters = placeLetters(word.text, 0, `${word.id}:${wordIndex}:${state.completedWords}`, worm)

  return {
    ...state,
    wordIndex,
    letterIndex: 0,
    worm,
    letters,
    wrongAtPosition: 0,
    hintLevel: 0,
    wordComplete: false,
    message: `Word ${wordIndex + 1} of ${state.words.length}. Listen, then steer the worm to the next letter.`,
    speech: { text: word.text, nonce },
    sound: null,
    eventNonce: nonce,
  }
}

export function createWormState(words: Word[]): WormState {
  const base: WormState = {
    words,
    wordIndex: 0,
    letterIndex: 0,
    worm: initialWorm(),
    letters: [],
    wrongAtPosition: 0,
    hintLevel: 0,
    cleanRun: true,
    completedWords: 0,
    missedWords: [],
    phase: 'playing',
    wordComplete: false,
    message: '',
    speech: null,
    sound: null,
    eventNonce: 0,
  }

  if (words.length === 0) {
    return { ...base, phase: 'summary', message: 'There are no words to play.' }
  }

  return startWord(base, 0)
}

function eatCorrect(state: WormState, worm: Point[], word: Word): WormState {
  const letterIndex = state.letterIndex + 1
  const nonce = state.eventNonce + 1

  if (letterIndex >= word.text.length) {
    return {
      ...state,
      worm,
      letterIndex,
      letters: [],
      completedWords: state.completedWords + 1,
      wordComplete: true,
      wrongAtPosition: 0,
      hintLevel: 0,
      message: `Yes! ${word.text} is finished. Tap Next word.`,
      speech: { text: `Yes! ${word.text}. Well done!`, nonce },
      sound: { kind: 'complete', nonce },
      eventNonce: nonce,
    }
  }

  return {
    ...state,
    worm,
    letterIndex,
    letters: placeLetters(
      word.text,
      letterIndex,
      `${word.id}:${letterIndex}:${state.completedWords}`,
      worm,
    ),
    wrongAtPosition: 0,
    hintLevel: 0,
    message: `${word.text.length - letterIndex} letter${word.text.length - letterIndex === 1 ? '' : 's'} to go.`,
    speech: null,
    sound: { kind: 'correct', nonce },
    eventNonce: nonce,
  }
}

function eatWrong(state: WormState, worm: Point[], word: Word): WormState {
  const wrongAtPosition = state.wrongAtPosition + 1
  const nonce = state.eventNonce + 1
  const hintLevel = hintLevelFor(wrongAtPosition)
  const needed = word.text[state.letterIndex]?.toUpperCase() ?? ''
  const missedWords = state.missedWords.includes(word.text)
    ? state.missedWords
    : [...state.missedWords, word.text]

  // A wrong letter does not grow the worm and never ends the round.
  worm.pop()

  let speechText = word.text
  let message = 'Not that one. Listen again.'
  if (hintLevel === 1) {
    speechText = `Listen again. ${word.text}`
    message = 'Listen again. One letter is glowing.'
  }
  if (hintLevel === 2) {
    speechText = `The next letter is ${needed}. ${word.text}`
    message = 'Listen again. The letter is glowing.'
  }

  return {
    ...state,
    worm,
    wrongAtPosition,
    hintLevel,
    cleanRun: false,
    missedWords,
    message,
    speech: { text: speechText, nonce },
    sound: { kind: 'wrong', nonce },
    eventNonce: nonce,
  }
}

function stepWorm(state: WormState, dx: number, dy: number): WormState {
  if (state.phase !== 'playing' || state.wordComplete) return state

  const word = state.words[state.wordIndex]
  if (!word) return state

  const head = state.worm[0]
  const next = { x: head.x + dx, y: head.y + dy }
  if (next.x < 0 || next.x >= WORM_COLUMNS || next.y < 0 || next.y >= WORM_ROWS) return state

  const letter = state.letters.find((item) => item.x === next.x && item.y === next.y)
  const worm = [next, ...state.worm]

  if (!letter) {
    worm.pop()
    return { ...state, worm }
  }

  const needed = word.text[state.letterIndex]?.toLowerCase() ?? ''
  return letter.letter.toLowerCase() === needed
    ? eatCorrect(state, worm, word)
    : eatWrong(state, worm, word)
}

function advance(state: WormState): WormState {
  if (!state.wordComplete) return state

  const nextIndex = state.wordIndex + 1
  if (nextIndex >= state.words.length) {
    const nonce = state.eventNonce + 1
    return {
      ...state,
      phase: 'summary',
      message: 'Round finished. Great spelling!',
      speech: { text: 'Round finished. Great spelling!', nonce },
      sound: { kind: 'complete', nonce },
      eventNonce: nonce,
    }
  }

  return startWord(state, nextIndex)
}

export function wormReducer(state: WormState, action: WormAction): WormState {
  switch (action.type) {
    case 'move':
      return stepWorm(state, action.dx, action.dy)
    case 'step': {
      const head = state.worm[0]
      const dx = action.x - head.x
      const dy = action.y - head.y
      if (Math.abs(dx) + Math.abs(dy) !== 1) return state
      return stepWorm(state, dx, dy)
    }
    case 'next-word':
      return advance(state)
    case 'replay-word': {
      const word = state.words[state.wordIndex]
      if (!word || state.phase !== 'playing') return state
      const nonce = state.eventNonce + 1
      return {
        ...state,
        message: 'Listen again.',
        speech: { text: word.text, nonce },
        eventNonce: nonce,
      }
    }
    case 'restart':
      return createWormState(action.words)
  }
}
