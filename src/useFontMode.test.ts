import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useFontMode } from './useFontMode'

describe('useFontMode', () => {
  beforeEach(() => {
    localStorage.clear()
    delete document.documentElement.dataset.font
  })

  it('defaults to the default font mode', () => {
    const { result } = renderHook(() => useFontMode())
    expect(result.current.easyRead).toBe(false)
    expect(document.documentElement.dataset.font).toBe('default')
  })

  it('toggles to easy-read and persists the choice', () => {
    const { result } = renderHook(() => useFontMode())

    act(() => {
      result.current.toggle()
    })

    expect(result.current.easyRead).toBe(true)
    expect(document.documentElement.dataset.font).toBe('easy-read')
    expect(localStorage.getItem('spell:fontMode')).toBe('easy-read')
  })

  it('restores a stored easy-read choice', () => {
    localStorage.setItem('spell:fontMode', 'easy-read')

    const { result } = renderHook(() => useFontMode())
    expect(result.current.easyRead).toBe(true)
  })
})
