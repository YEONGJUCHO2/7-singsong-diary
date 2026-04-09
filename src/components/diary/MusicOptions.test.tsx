import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MusicOptions } from './MusicOptions'

describe('MusicOptions', () => {
  it('renders all 5 option groups', () => {
    render(<MusicOptions selected={{}} onSelect={() => {}} />)
    expect(screen.getByText('장르')).toBeInTheDocument()
    expect(screen.getByText('주요 악기')).toBeInTheDocument()
    expect(screen.getByText('템포')).toBeInTheDocument()
    expect(screen.getByText('분위기')).toBeInTheDocument()
    expect(screen.getByText('질감/특징')).toBeInTheDocument()
  })

  it('selects one option per group (single select)', async () => {
    const user = userEvent.setup()
    let selected = {}
    const onSelect = (next: Record<string, string>) => { selected = next }

    const { rerender } = render(<MusicOptions selected={selected} onSelect={onSelect} />)

    await user.click(screen.getByRole('button', { name: '재즈' }))
    expect(selected).toEqual({ genre: '재즈' })

    rerender(<MusicOptions selected={selected} onSelect={onSelect} />)
    await user.click(screen.getByRole('button', { name: '팝' }))
    expect(selected).toEqual({ genre: '팝' })
  })

  it('deselects when clicking the same option again', async () => {
    const user = userEvent.setup()
    let selected: Record<string, string> = { genre: '재즈' }
    const onSelect = (next: Record<string, string>) => { selected = next }

    render(<MusicOptions selected={selected} onSelect={onSelect} />)
    await user.click(screen.getByRole('button', { name: '재즈' }))
    expect(selected).toEqual({})
  })
})
