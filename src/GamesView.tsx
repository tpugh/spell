import WordListSelect from './components/WordListSelect'
import { hasPlayableWords, usableWords } from './games/wordWorm/rules'
import type { GameId, WordList, View } from './types'

interface GamesViewProps {
  lists: WordList[]
  selectedList: WordList | null
  onSelectList: (list: WordList) => void
  onPlay: (gameId: GameId) => void
  onNavigate: (view: View) => void
}

export default function GamesView({
  lists,
  selectedList,
  onSelectList,
  onPlay,
  onNavigate,
}: GamesViewProps) {
  const playable = hasPlayableWords(selectedList)
  const gameWords = selectedList ? usableWords(selectedList).length : 0

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="relative flex min-h-screen flex-col items-center bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-900 p-6 text-white"
    >
      <div className="my-auto w-full max-w-md">
        <h1 className="mb-1 mt-8 text-center font-mono text-4xl font-black uppercase tracking-widest text-cyan-300 md:mt-0">
          Games
        </h1>
        <p className="mb-6 text-center text-lg text-indigo-100">Pick a word list, then pick a game.</p>

        <WordListSelect
          id="game-word-list"
          label="Word list for this game"
          lists={lists}
          selectedList={selectedList}
          onSelectList={onSelectList}
          emptyMessage="No word lists yet. Ask a grown-up to add one."
          hint={
            selectedList
              ? `${gameWords} ${gameWords === 1 ? 'word' : 'words'} can be played from this list.`
              : undefined
          }
        />

        <section
          aria-labelledby="word-worm-heading"
          className="rounded-2xl border-2 border-cyan-400/60 bg-slate-900/80 p-5 shadow-xl"
        >
          <div className="flex items-start gap-4">
            <span
              aria-hidden="true"
              className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-lime-400 text-2xl"
            >
              🐛
            </span>
            <div>
              <h2 id="word-worm-heading" className="text-2xl font-black text-white">
                Word Worm
              </h2>
              <p className="text-sm text-indigo-100">
                Steer the worm to the next letter of your word, in order.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="mt-4 min-h-14 w-full rounded-xl bg-lime-400 px-6 py-4 text-xl font-black uppercase tracking-wide text-slate-900 shadow-lg transition hover:bg-lime-300 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-300"
            disabled={!playable}
            onClick={() => onPlay('word-worm')}
          >
            Play
          </button>

          {!playable && (
            <p className="mt-2 text-sm text-amber-200">
              {lists.length === 0
                ? 'Add a word list first.'
                : 'Choose a list with at least one word of two or more letters.'}
            </p>
          )}
        </section>

        <p className="mt-4 text-center text-sm text-indigo-200">More games coming soon.</p>

        {lists.length === 0 && (
          <button
            type="button"
            className="mt-4 min-h-12 w-full rounded-xl border-2 border-indigo-300 px-4 py-3 text-lg font-semibold text-white hover:bg-indigo-900"
            onClick={() => onNavigate('lists')}
          >
            Manage Word Lists
          </button>
        )}

        <button
          type="button"
          className="mt-6 min-h-12 w-full rounded-lg px-3 py-2 text-base font-semibold text-indigo-100 underline-offset-4 hover:bg-indigo-900 hover:underline"
          onClick={() => onNavigate('home')}
        >
          Back to home
        </button>
      </div>
    </main>
  )
}
