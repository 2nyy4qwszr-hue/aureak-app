import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import React from 'react'
import { ToastProvider, useToast } from './ToastContext'

// ── Test consumer ─────────────────────────────────────────────────────────────

function ToastConsumer({ action }: { action: (toast: ReturnType<typeof useToast>) => void }) {
  const toast = useToast()
  return (
    <button
      onClick={() => action(toast)}
      data-testid="trigger"
    >
      trigger
    </button>
  )
}

function Wrapper({ action }: { action: (toast: ReturnType<typeof useToast>) => void }) {
  return (
    <ToastProvider>
      <ToastConsumer action={action} />
    </ToastProvider>
  )
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.runOnlyPendingTimers()
  vi.useRealTimers()
})

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ToastContext — useToast()', () => {
  it('affiche un toast success après appel à success()', () => {
    render(<Wrapper action={t => t.success('Joueur créé')} />)
    fireEvent.click(screen.getByTestId('trigger'))
    expect(screen.getByText('Joueur créé')).toBeInTheDocument()
  })

  it('affiche un toast error après appel à error()', () => {
    render(<Wrapper action={t => t.error('Erreur réseau')} />)
    fireEvent.click(screen.getByTestId('trigger'))
    expect(screen.getByText('Erreur réseau')).toBeInTheDocument()
  })

  it('affiche un toast info après appel à info()', () => {
    render(<Wrapper action={t => t.info('Chargement…')} />)
    fireEvent.click(screen.getByTestId('trigger'))
    expect(screen.getByText('Chargement…')).toBeInTheDocument()
  })

  it('affiche un toast warning après appel à warning()', () => {
    render(<Wrapper action={t => t.warning('Attention : données incomplètes')} />)
    fireEvent.click(screen.getByTestId('trigger'))
    expect(screen.getByText('Attention : données incomplètes')).toBeInTheDocument()
  })

  it('le toast disparaît automatiquement après sa durée', () => {
    render(<Wrapper action={t => t.showToast('Auto-remove', 'success', 1000)} />)
    fireEvent.click(screen.getByTestId('trigger'))
    expect(screen.getByText('Auto-remove')).toBeInTheDocument()

    act(() => { vi.advanceTimersByTime(1100) })
    expect(screen.queryByText('Auto-remove')).not.toBeInTheDocument()
  })

  it("le toast reste visible si la durée n'est pas encore écoulée", () => {
    render(<Wrapper action={t => t.showToast('Reste affiché', 'success', 5000)} />)
    fireEvent.click(screen.getByTestId('trigger'))

    act(() => { vi.advanceTimersByTime(3000) })
    expect(screen.getByText('Reste affiché')).toBeInTheDocument()
  })

  it('le bouton × supprime le toast immédiatement', () => {
    render(<Wrapper action={t => t.info('Fermer moi')} />)
    fireEvent.click(screen.getByTestId('trigger'))
    expect(screen.getByText('Fermer moi')).toBeInTheDocument()

    // Clic sur le bouton × (dernier bouton dans le toast)
    const closeButtons = screen.getAllByRole('button', { name: /×/ })
    fireEvent.click(closeButtons[closeButtons.length - 1])
    expect(screen.queryByText('Fermer moi')).not.toBeInTheDocument()
  })

  it("n'affiche pas plus de 5 toasts simultanément", () => {
    render(
      <Wrapper
        action={t => {
          for (let i = 1; i <= 7; i++) t.info(`Toast ${i}`)
        }}
      />
    )
    fireEvent.click(screen.getByTestId('trigger'))
    // Max 5 : les premiers (Toast 1, Toast 2) doivent être évincés
    expect(screen.queryByText('Toast 1')).not.toBeInTheDocument()
    expect(screen.queryByText('Toast 2')).not.toBeInTheDocument()
    expect(screen.getByText('Toast 3')).toBeInTheDocument()
    expect(screen.getByText('Toast 7')).toBeInTheDocument()
  })

  it('useToast() lance une erreur si utilisé hors ToastProvider', () => {
    // Suppress the React error boundary console.error in test output
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => {
      render(
        <ToastConsumer action={t => t.info('test')} />
      )
    }).toThrow('useToast must be used inside ToastProvider')
    spy.mockRestore()
  })
})
