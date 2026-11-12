import { useEffect, useReducer, useRef, useState } from 'react'
import { playBlip } from './arcade/blip'
import { useSound } from './arcade/useSound'
import { createWormState, wormReducer } from './games/wordWorm/engine'
import {
  WORM_COLUMNS,
  WORM_ROWS,
  wordsForRound,
  type PlacedLetter,
} from './games/wordWorm/rules'
import { useTTS } from './hooks/useTTS'
import { starsForGame } from './progress'
import { storage } from './db'
import type { GameSession, WordList } from './types'

interface WordWormViewProps {
  wordList: WordList
  onExit: () => void
  onEarnStars: (stars: number) => Promise<{ awarded: number }>
}

const MOVE_KEYS: Record<string, { dx: number; dy: number }> = {
  arrowup: { dx: 0, dy: -1 },
  arrowdown: { dx: 0, dy: 1 },
  arrowleft: { dx: -1, dy: 0 },
  arrowright: { dx: 1, dy: 0 },
  w: { dx: 0, dy: -1 },
  s: { dx: 0, dy: 1 },
  a: { dx: -1, dy: 0 },
  d: { dx: 1, dy: 0 },
}

function newId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export default function WordWormView({ wordList, onExit, onEarnStars }: WordWormViewProps) {
  const { speak, cancel, isSupported } = useTTS()
  const { soundOn, toggle: toggleSound } = useSound()
  const [state, dispatch] = useReducer(wormReducer, wordList, (list) =>
    createWormState(wordsForRound(list)),
  )
  const [paused, setPaused] = useState(false)
  const [confirmQuit, setConfirmQuit] = useState(false)
  const [awarded, setAwarded] = useState<number | null>(null)
  const finished = useRef(false)
  const keepPlaying = useRef<HTMLButtonElement | null>(null)

  const word = state.words[state.wordIndex]
  const head = state.worm[0]

  // Speak only when the reducer produces a new prompt.
  const speech = state.speech
  useEffect(() => {
    if (speech) speak(speech.text)
  }, [speech, speak])

  // Sound effects are also driven by the reducer's event nonce.
  const sound = state.sound
  useEffect(() => {
    if (sound) playBlip(sound.kind)
  }, [sound])

  useEffect(() => () => cancel(), [cancel])

  useEffect(() => {
    if (paused || confirmQuit) cancel()
  }, [paused, confirmQuit, cancel])

  // Land on the safe choice when the quit prompt opens.
  useEffect(() => {
    if (confirmQuit) keepPlaying.current?.focus()
  }, [confirmQuit])

  // Keyboard play: arrows or WASD, Escape for pause. Works with no pointer.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.altKey || event.ctrlKey || event.metaKey) return

      if (event.key === 'Escape') {
        event.preventDefault()
        if (confirmQuit) {
          // Escape backs out of the quit prompt, never quits by accident.
          setConfirmQuit(false)
          return
        }
        setPaused((current) => !current)
        return
      }

      if (paused || confirmQuit || state.phase !== 'playing' || state.wordComplete) return

      const move = MOVE_KEYS[event.key.toLowerCase()]
      if (!move) return
      event.preventDefault()
      dispatch({ type: 'move', dx: move.dx, dy: move.dy })
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [paused, confirmQuit, state.phase, state.wordComplete])

  // Save the round once: stars (with the daily cap) and the review list.
  useEffect(() => {
    if (state.phase !== 'summary' || finished.current || state.words.length === 0) return
    finished.current = true

    const session: GameSession = {
      id: newId(),
      gameId: 'word-worm',
      wordListId: wordList.id,
      wordListName: wordList.name,
      date: Date.now(),
      wordsCompleted: state.completedWords,
      wordsAttempted: state.words.length,
      missedWords: state.missedWords,
    }

    void (async () => {
      try {
        const result = await onEarnStars(starsForGame(state.cleanRun))
        setAwarded(result.awarded)
      } catch (error) {
        console.warn('Could not save stars for this game', error)
        setAwarded(0)
      }

      try {
        await storage.saveGameSession(session)
      } catch (error) {
        console.warn('Could not save the game session', error)
      }
    })()
  }, [
    state.phase,
    state.cleanRun,
    state.completedWords,
    state.words.length,
    state.missedWords,
    wordList.id,
    wordList.name,
    onEarnStars,
  ])

  function playAgain() {
    finished.current = false
    setAwarded(null)
    setPaused(false)
    setConfirmQuit(false)
    dispatch({ type: 'restart', words: wordsForRound(wordList, state.missedWords) })
  }

  function quit() {
    cancel()
    onExit()
  }

  /**
   * Quitting always asks first. The confirmation lives at the top of the
   * screen, far from the movement controls, so a stray tap near the d-pad
   * can never end a round.
   */
  function askQuit() {
    setPaused(false)
    setConfirmQuit(true)
  }

  if (state.phase === 'summary') {
    return (
      <main
        id="main-content"
        tabIndex={-1}
        className="relative flex min-h-screen flex-col items-center bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-900 p-6 text-white"
      >
        <div className="my-auto w-full max-w-md rounded-2xl border-2 border-cyan-400/60 bg-slate-900/80 p-6 text-center shadow-xl">
          <h1 className="mb-2 font-mono text-3xl font-black uppercase tracking-widest text-cyan-300">
            Round complete
          </h1>

          <p className="mb-3 text-lg text-indigo-100">
            {state.completedWords} of {state.words.length} words spelled
          </p>

          <p id="worm-stars" className="mb-1 text-2xl font-bold text-amber-300">
            {awarded ? (
              <span aria-hidden="true">{'⭐'.repeat(awarded)} </span>
            ) : null}
            {awarded === null
              ? 'Saving stars...'
              : awarded === 0
                ? 'Star limit reached for today - great playing!'
                : `+${awarded} ${awarded === 1 ? 'star' : 'stars'} earned`}
          </p>
          <p className="mb-4 text-sm text-indigo-200">
            {state.cleanRun
              ? 'Every letter first time - amazing!'
              : 'Every try helps you remember the word.'}
          </p>

          {state.missedWords.length > 0 && (
            <section className="mb-4 rounded-xl bg-slate-800 p-4 text-left">
              <h2 className="mb-1 text-base font-bold text-amber-200">Words to practise</h2>
              <p className="text-lg font-semibold text-white">{state.missedWords.join(', ')}</p>
            </section>
          )}

          <div className="flex flex-col gap-3">
            <button
              type="button"
              className="min-h-14 rounded-xl bg-lime-400 px-6 py-4 text-xl font-black text-slate-900 shadow-lg hover:bg-lime-300 active:scale-95"
              onClick={playAgain}
            >
              Play again
            </button>
            <button
              type="button"
              className="min-h-12 rounded-xl border-2 border-cyan-300 px-6 py-3 text-lg font-semibold text-cyan-100 hover:bg-cyan-950"
              onClick={quit}
            >
              Back to games
            </button>
          </div>
        </div>
      </main>
    )
  }

  const letters = new Map<string, PlacedLetter>(
    state.letters.map((letter) => [`${letter.x},${letter.y}`, letter]),
  )

  const cells = Array.from({ length: WORM_ROWS * WORM_COLUMNS }, (_, index) => {
    const x = index % WORM_COLUMNS
    const y = Math.floor(index / WORM_COLUMNS)
    const key = `${x},${y}`
    const letter = letters.get(key)
    const isHead = head.x === x && head.y === y
    const isBody = !isHead && state.worm.some((point) => point.x === x && point.y === y)

    const tone = isHead
      ? 'worm-head z-10 bg-lime-300 text-slate-900'
      : isBody
        ? 'z-10 bg-green-600 text-white'
        : letter
          ? 'bg-amber-300 text-slate-900'
          : 'bg-slate-800 text-white'

    return (
      <button
        key={key}
        type="button"
        tabIndex={-1}
        data-cell={key}
        data-letter={letter?.letter}
        data-correct={letter ? (letter.correct ? 'true' : 'false') : undefined}
        aria-hidden="true"
        onClick={() => dispatch({ type: 'step', x, y })}
        className={`relative flex aspect-square items-center justify-center border border-indigo-950/70 text-[0.7rem] font-black leading-none sm:text-sm ${tone} ${
          letter?.correct && state.hintLevel > 0 ? 'worm-hint' : ''
        }`}
      >
        {letter ? letter.letter.toUpperCase() : ''}
      </button>
    )
  })

  const moveDisabled = paused || confirmQuit || state.wordComplete

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="relative flex min-h-screen flex-col items-center bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-900 p-4 text-white"
    >
      <div
        className="mx-auto flex w-full max-w-md flex-1 flex-col"
        aria-hidden={confirmQuit ? true : undefined}
      >
        <header className="mt-2 flex items-center justify-between gap-3">
          <div>
            <h1 className="font-mono text-2xl font-black uppercase tracking-widest text-cyan-300">
              Word Worm
            </h1>
            <p className="text-sm font-semibold text-indigo-100">
              Word {state.wordIndex + 1} of {state.words.length}
            </p>
          </div>
          <button
            type="button"
            className="min-h-12 min-w-12 shrink-0 rounded-lg border-2 border-indigo-400 px-4 py-3 text-base font-semibold text-indigo-100 hover:bg-indigo-900"
            onClick={askQuit}
          >
            Quit
          </button>
        </header>

        <p className="sr-only">
          Steer the worm to the next letter of the word. Listen to the word first, then use the
          arrow keys or the movement buttons.
        </p>

        <div className="mt-3 flex flex-col items-center">
          <div
            id="worm-word"
            role="group"
            aria-label={word ? `Word with ${word.text.length} letters` : 'Word'}
            className="flex flex-wrap justify-center gap-1"
          >
            {word &&
              [...word.text].map((character, index) => {
                const filled = index < state.letterIndex
                return (
                  <span
                    // Blanks keep their position, so index is the stable key here.
                    key={index}
                    aria-hidden="true"
                    data-filled={filled ? 'true' : 'false'}
                    className={`flex h-10 w-8 items-center justify-center rounded border-2 text-xl font-black ${
                      filled
                        ? 'border-amber-300 bg-amber-300 text-slate-900'
                        : 'border-indigo-400 bg-slate-800 text-amber-200'
                    }`}
                  >
                    {filled ? character.toUpperCase() : ''}
                  </span>
                )
              })}
          </div>

          <div className="mt-3 flex w-full flex-wrap justify-center gap-2">
            <button
              type="button"
              className="min-h-12 rounded-lg bg-indigo-700 px-4 py-3 text-base font-bold text-white hover:bg-indigo-600"
              onClick={() => dispatch({ type: 'replay-word' })}
            >
              <span aria-hidden="true">🔊 </span>Hear it again
            </button>
            <button
              type="button"
              aria-pressed={soundOn}
              className="min-h-12 rounded-lg border-2 border-indigo-400 px-4 py-3 text-base font-bold text-white hover:bg-indigo-900"
              onClick={toggleSound}
            >
              <span aria-hidden="true">{soundOn ? '🔔' : '🔕'} </span>
              {soundOn ? 'Sound on' : 'Sound off'}
            </button>
            <button
              type="button"
              className="min-h-12 rounded-lg border-2 border-indigo-400 px-4 py-3 text-base font-bold text-white hover:bg-indigo-900"
              onClick={() => setPaused((current) => !current)}
            >
              {paused ? 'Resume' : 'Pause'}
            </button>
          </div>
        </div>

        <div className="relative mt-3 w-full">
          <div
            id="worm-stage"
            data-head-x={head.x}
            data-head-y={head.y}
            aria-hidden="true"
            style={{ gridTemplateColumns: `repeat(${WORM_COLUMNS}, minmax(0, 1fr))` }}
            className="arcade-stage grid w-full overflow-hidden rounded-lg border-2 border-cyan-400/70 bg-slate-950 shadow-xl"
          >
            {cells}
          </div>

          {paused && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-lg bg-slate-950/90 p-4 text-center">
              <p className="text-2xl font-black text-cyan-200">Paused</p>
              <button
                type="button"
                className="min-h-14 w-full max-w-56 rounded-xl bg-lime-400 px-6 py-4 text-xl font-black text-slate-900 hover:bg-lime-300"
                onClick={() => setPaused(false)}
              >
                Resume
              </button>
              <button
                type="button"
                className="min-h-12 w-full max-w-56 rounded-xl border-2 border-cyan-300 px-6 py-3 text-lg font-semibold text-white hover:bg-cyan-950"
                onClick={askQuit}
              >
                Quit to games
              </button>
            </div>
          )}
        </div>

        <p id="worm-status" role="status" aria-live="polite" className="sr-only">
          {state.message}
        </p>

        {state.wordComplete ? (
          <button
            type="button"
            className="mt-3 min-h-14 w-full rounded-xl bg-cyan-400 px-6 py-4 text-xl font-black uppercase tracking-wide text-slate-900 shadow-lg hover:bg-cyan-300 active:scale-95"
            onClick={() => dispatch({ type: 'next-word' })}
          >
            Next word
          </button>
        ) : (
          <div
            role="group"
            aria-label="Move the worm"
            className="mx-auto mt-3 grid w-full max-w-56 grid-cols-3 gap-2"
          >
            <span aria-hidden="true" />
            <button
              type="button"
              aria-label="Move up"
              className="flex min-h-12 items-center justify-center rounded-lg border-2 border-cyan-300 bg-slate-800 py-3 text-2xl text-white hover:bg-slate-700 disabled:opacity-40"
              disabled={moveDisabled}
              onClick={() => dispatch({ type: 'move', dx: 0, dy: -1 })}
            >
              <span aria-hidden="true">▲</span>
            </button>
            <span aria-hidden="true" />
            <button
              type="button"
              aria-label="Move left"
              className="flex min-h-12 items-center justify-center rounded-lg border-2 border-cyan-300 bg-slate-800 py-3 text-2xl text-white hover:bg-slate-700 disabled:opacity-40"
              disabled={moveDisabled}
              onClick={() => dispatch({ type: 'move', dx: -1, dy: 0 })}
            >
              <span aria-hidden="true">◀</span>
            </button>
            <button
              type="button"
              aria-label="Move down"
              className="flex min-h-12 items-center justify-center rounded-lg border-2 border-cyan-300 bg-slate-800 py-3 text-2xl text-white hover:bg-slate-700 disabled:opacity-40"
              disabled={moveDisabled}
              onClick={() => dispatch({ type: 'move', dx: 0, dy: 1 })}
            >
              <span aria-hidden="true">▼</span>
            </button>
            <button
              type="button"
              aria-label="Move right"
              className="flex min-h-12 items-center justify-center rounded-lg border-2 border-cyan-300 bg-slate-800 py-3 text-2xl text-white hover:bg-slate-700 disabled:opacity-40"
              disabled={moveDisabled}
              onClick={() => dispatch({ type: 'move', dx: 1, dy: 0 })}
            >
              <span aria-hidden="true">▶</span>
            </button>
          </div>
        )}

        {!isSupported && (
          <p className="mt-3 text-center text-sm font-semibold text-amber-200">
            Audio isn&apos;t available on this device. Ask a grown-up to read the word aloud.
          </p>
        )}
      </div>

      {confirmQuit && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="quit-heading"
          className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-slate-950/95 p-6 text-center"
        >
          <h2 id="quit-heading" className="text-2xl font-black text-white">
            Quit this game?
          </h2>
          <p className="max-w-xs text-sm text-indigo-200">
            Stars are saved when you finish a round. You can play again any time.
          </p>
          <button
            ref={keepPlaying}
            type="button"
            className="min-h-14 w-full max-w-56 rounded-xl bg-lime-400 px-6 py-4 text-xl font-black text-slate-900 hover:bg-lime-300 active:scale-95"
            onClick={() => setConfirmQuit(false)}
          >
            Keep playing
          </button>
          <button
            type="button"
            className="min-h-12 w-full max-w-56 rounded-xl border-2 border-cyan-300 px-6 py-3 text-lg font-semibold text-white hover:bg-cyan-950"
            onClick={quit}
          >
            Quit game
          </button>
        </div>
      )}
    </main>
  )
}
