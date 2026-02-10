'use client'

import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('ErrorBoundary caught:', error, info.componentStack)
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="p-6 text-center">
          <p className="text-red-600 font-medium">Une erreur est survenue</p>
          <p className="text-sm text-gray-500 mt-1">{this.state.error?.message}</p>
          <button
            className="mt-3 text-sm text-indigo-600 hover:underline"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Reessayer
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
