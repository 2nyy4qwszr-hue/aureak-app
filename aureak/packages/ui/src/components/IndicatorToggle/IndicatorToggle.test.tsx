import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react-native'
import { IndicatorToggle } from './IndicatorToggle'

describe('IndicatorToggle', () => {
  it('se rend sans erreur avec value="none"', () => {
    const { toJSON } = render(<IndicatorToggle value="none" onChange={() => {}} />)
    expect(toJSON()).toBeTruthy()
  })

  it('cycle : none → positive au premier tap', () => {
    const onChange = vi.fn()
    const { getByRole } = render(<IndicatorToggle value="none" onChange={onChange} />)
    fireEvent.press(getByRole('button'))
    expect(onChange).toHaveBeenCalledWith('positive')
  })

  it('cycle : positive → attention au deuxième tap', () => {
    const onChange = vi.fn()
    const { getByRole } = render(<IndicatorToggle value="positive" onChange={onChange} />)
    fireEvent.press(getByRole('button'))
    expect(onChange).toHaveBeenCalledWith('attention')
  })

  it('cycle : attention → none (retour au début, pas "absent")', () => {
    const onChange = vi.fn()
    const { getByRole } = render(<IndicatorToggle value="attention" onChange={onChange} />)
    fireEvent.press(getByRole('button'))
    expect(onChange).not.toHaveBeenCalledWith('absent')
    expect(onChange).toHaveBeenCalledWith('none')
  })

  it('ne déclenche pas onChange quand disabled=true', () => {
    const onChange = vi.fn()
    const { getByRole } = render(
      <IndicatorToggle value="none" onChange={onChange} disabled={true} />
    )
    fireEvent.press(getByRole('button'))
    expect(onChange).not.toHaveBeenCalled()
  })
})
