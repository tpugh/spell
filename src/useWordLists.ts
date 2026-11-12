import { useState, useEffect, useCallback } from 'react'
import { storage } from './db'
import type { WordList } from './types'

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function createWord(id?: string, text = '', hint?: string): WordList['words'][number] {
  return { id: id ?? generateId(), text, hint }
}

export function createWordList(name = 'New List'): WordList {
  const now = Date.now()
  return {
    id: generateId(),
    name,
    words: [],
    createdAt: now,
    updatedAt: now,
  }
}

export function useWordLists() {
  const [lists, setLists] = useState<WordList[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    const data = await storage.getWordLists()
    setLists(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const save = useCallback(async (list: WordList) => {
    const updated = { ...list, updatedAt: Date.now() }
    await storage.saveWordList(updated)
    await refresh()
    return updated
  }, [refresh])

  const remove = useCallback(async (id: string) => {
    await storage.deleteWordList(id)
    await refresh()
  }, [refresh])

  return { lists, loading, refresh, save, remove }
}