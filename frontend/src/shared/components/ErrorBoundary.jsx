import { Component } from "react"
import styled from "styled-components"

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 40px;
  text-align: center;
  background: var(--color-bg);
`

const ErrorTitle = styled.h1`
  color: var(--color-error);
  margin-bottom: 16px;
  font-size: var(--heading-xl);
`

const ErrorMessage = styled.p`
  color: var(--color-text-secondary);
  margin-bottom: 24px;
  max-width: 500px;
`

const ReloadButton = styled.button`
  padding: 12px 24px;
  background: var(--color-primary);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-weight: var(--weight-bold);
  font-size: var(--body-lg);
  color: var(--color-text-on-primary);

  &:hover { background: var(--color-primary-hover); }
`

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorContainer role="alert">
          <ErrorTitle>Something went wrong</ErrorTitle>
          <ErrorMessage>
            An unexpected error occurred. Please try reloading the page.
          </ErrorMessage>
          <ReloadButton onClick={() => window.location.reload()}>
            Reload Page
          </ReloadButton>
        </ErrorContainer>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
