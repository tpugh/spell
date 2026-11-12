import { useState } from 'react'

export default function App() {
  const [count, setCount] = useState(0)

  return (
    <main className="flex min-h-screen items-center justify-center bg-indigo-50">
      <div className="rounded-2xl bg-white p-8 shadow-lg text-center">
        <h1 className="text-3xl font-bold text-indigo-700">Spell</h1>
        <p className="mt-2 text-gray-600">Spelling practice for young learners</p>
        <button
          className="mt-4 rounded-xl bg-indigo-600 px-6 py-3 text-lg font-semibold text-white hover:bg-indigo-700 active:scale-95"
          onClick={() => setCount((c) => c + 1)}
        >
          Taps: {count}
        </button>
      </div>
    </main>
  )
}