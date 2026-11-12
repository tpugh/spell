import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders the Spell heading after loading', async () => {
    render(<App />)
    expect(await screen.findByRole('heading', { name: 'Spell' })).toBeInTheDocument()
  })
})
