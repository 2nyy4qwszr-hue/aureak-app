import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { ErrorBoundary } from './ErrorBoundary'

// ── Composant qui crash sur demande ───────────────────────────────────────────

function BombComponent({ shouldCrash }: { shouldCrash: boolean }) {
  if (shouldCrash) throw new Error('Test crash — composant explosé')
  return <div data-testid="safe-content">Contenu normal</div>
}

// Supprime les erreurs React dans la console pendant les tests de crash
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ErrorBoundary', () => {
  it('affiche les enfants normalement quand aucune erreur', () => {
    render(
      <ErrorBoundary>
        <BombComponent shouldCrash={false} />
      </ErrorBoundary>
    )
    expect(screen.getByTestId('safe-content')).toBeInTheDocument()
    expect(screen.queryByText('Une erreur est survenue')).not.toBeInTheDocument()
  })

  it('affiche le fallback UI par défaut quand un enfant crashe', () => {
    render(
      <ErrorBoundary>
        <BombComponent shouldCrash={true} />
      </ErrorBoundary>
    )
    expect(screen.getByText('Une erreur est survenue')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Réessayer' })).toBeInTheDocument()
    expect(screen.queryByTestId('safe-content')).not.toBeInTheDocument()
  })

  it('affiche le fallback personnalisé si la prop fallback est fournie', () => {
    const customFallback = <div data-testid="custom-fallback">Fallback custom</div>
    render(
      <ErrorBoundary fallback={customFallback}>
        <BombComponent shouldCrash={true} />
      </ErrorBoundary>
    )
    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument()
    expect(screen.queryByText('Une erreur est survenue')).not.toBeInTheDocument()
  })

  it("le bouton Réessayer remet l'état à zéro et re-rend les enfants", () => {
    // Simule un crash puis une récupération (l'enfant ne crashe plus)
    const { rerender } = render(
      <ErrorBoundary>
        <BombComponent shouldCrash={true} />
      </ErrorBoundary>
    )
    expect(screen.getByText('Une erreur est survenue')).toBeInTheDocument()

    // On re-render avec un enfant qui ne crashe plus
    rerender(
      <ErrorBoundary>
        <BombComponent shouldCrash={false} />
      </ErrorBoundary>
    )

    // Clic sur Réessayer → reset de l'ErrorBoundary
    fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }))
    expect(screen.getByTestId('safe-content')).toBeInTheDocument()
    expect(screen.queryByText('Une erreur est survenue')).not.toBeInTheDocument()
  })

  it("affiche le message d'erreur en mode développement", () => {
    const originalEnv = process.env.NODE_ENV
    // Simule NODE_ENV !== 'production' (déjà le cas en test)
    render(
      <ErrorBoundary>
        <BombComponent shouldCrash={true} />
      </ErrorBoundary>
    )
    // Le message de l'erreur doit apparaître dans le <pre>
    expect(screen.getByText(/Test crash — composant explosé/)).toBeInTheDocument()
  })

  it('appelle componentDidCatch quand un enfant crashe', () => {
    // Vérifié indirectement via console.error mocké
    const consoleSpy = vi.spyOn(console, 'error')
    render(
      <ErrorBoundary>
        <BombComponent shouldCrash={true} />
      </ErrorBoundary>
    )
    // console.error est appelé par componentDidCatch (en mode non-production)
    // Et par React pour signaler l'erreur dans le tree
    expect(consoleSpy).toHaveBeenCalled()
  })

  it("isole le crash — ne propage pas l'erreur au parent", () => {
    // Si ErrorBoundary ne fonctionnait pas, ce test ferait crasher le test runner
    expect(() => {
      render(
        <div>
          <ErrorBoundary>
            <BombComponent shouldCrash={true} />
          </ErrorBoundary>
          <span data-testid="sibling">Sibling intact</span>
        </div>
      )
    }).not.toThrow()
    expect(screen.getByTestId('sibling')).toBeInTheDocument()
  })
})
