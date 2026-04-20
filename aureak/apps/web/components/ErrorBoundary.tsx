import React from 'react'
import { colors, shadows, radius } from '@aureak/theme'

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[ErrorBoundary] Caught error:', error, info)
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div
          style={{
            display       : 'flex',
            flexDirection : 'column',
            alignItems    : 'center',
            justifyContent: 'center',
            minHeight     : '100vh',
            backgroundColor: colors.light.primary,
            padding       : 32,
          }}
        >
          <div
            style={{
              backgroundColor: colors.light.surface,
              borderRadius   : radius.card,
              boxShadow      : shadows.md,
              padding        : 40,
              maxWidth       : 480,
              width          : '100%',
              textAlign      : 'center',
              borderTop      : `4px solid ${colors.accent.gold}`,
            }}
          >
            <div
              style={{
                width          : 56,
                height         : 56,
                borderRadius   : '50%',
                backgroundColor: colors.accent.gold + '18',
                display        : 'flex',
                alignItems     : 'center',
                justifyContent : 'center',
                margin         : '0 auto 20px',
                fontSize       : 28,
              }}
            >
              ⚠
            </div>

            <h2
              style={{
                fontFamily: 'Montserrat, sans-serif',
                fontSize  : 22,
                fontWeight: 700,
                color     : colors.text.dark,
                marginBottom: 8,
                marginTop : 0,
              }}
            >
              Une erreur est survenue
            </h2>

            <p
              style={{
                fontFamily: 'Poppins, sans-serif',
                fontSize  : 14,
                color     : colors.text.muted,
                marginBottom: 24,
                lineHeight: 1.6,
              }}
            >
              Un problème inattendu s'est produit. Vous pouvez essayer de recharger cette section.
            </p>

            {process.env.NODE_ENV !== 'production' && this.state.error && (
              <pre
                style={{
                  backgroundColor: colors.light.muted,
                  borderRadius   : radius.xs,
                  padding        : 12,
                  fontSize       : 11,
                  color          : colors.text.muted,
                  textAlign      : 'left',
                  overflow       : 'auto',
                  marginBottom   : 20,
                  maxHeight      : 120,
                }}
              >
                {this.state.error.message}
              </pre>
            )}

            <button
              onClick={this.handleReset}
              style={{
                backgroundColor: colors.accent.gold,
                color          : colors.text.dark,
                border         : 'none',
                borderRadius   : radius.button,
                padding        : '10px 24px',
                fontSize       : 14,
                fontWeight     : 600,
                cursor         : 'pointer',
                fontFamily     : 'Poppins, sans-serif',
              }}
            >
              Réessayer
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
