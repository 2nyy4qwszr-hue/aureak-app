import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react-native'
import { StarToggle } from './StarToggle'

describe('StarToggle', () => {
  it('se rend sans erreur avec value={false}', () => {
    const { toJSON } = render(<StarToggle value={false} onChange={() => {}} />)
    expect(toJSON()).toBeTruthy()
  })

  it('se rend sans erreur avec value={true}', () => {
    const { toJSON } = render(<StarToggle value={true} onChange={() => {}} />)
    expect(toJSON()).toBeTruthy()
  })

  it('appelle onChange(true) au premier tap quand value=false', () => {
    const onChange = vi.fn()
    const { getByRole } = render(<StarToggle value={false} onChange={onChange} />)
    fireEvent.press(getByRole('button'))
    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('appelle onChange(false) quand value=true (désactivation)', () => {
    const onChange = vi.fn()
    const { getByRole } = render(<StarToggle value={true} onChange={onChange} />)
    fireEvent.press(getByRole('button'))
    expect(onChange).toHaveBeenCalledWith(false)
  })

  it('ne déclenche pas onChange quand disabled=true', () => {
    const onChange = vi.fn()
    const { getByRole } = render(<StarToggle value={false} onChange={onChange} disabled={true} />)
    fireEvent.press(getByRole('button'))
    expect(onChange).not.toHaveBeenCalled()
  })
})
