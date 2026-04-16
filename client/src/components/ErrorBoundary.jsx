import { Component } from "react"

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    if (process.env.NODE_ENV !== 'production') {
      console.error("ErrorBoundary caught:", error, errorInfo)
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f0f1a",
          padding: "20px"
        }} role="alert" aria-live="assertive">
          <div style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,77,109,0.3)",
            borderRadius: "20px",
            padding: "40px",
            maxWidth: "480px",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "64px", marginBottom: "16px" }} aria-hidden="true">😕</div>
            <h1 style={{
              fontSize: "24px",
              fontWeight: 800,
              color: "#fff",
              marginBottom: "12px"
            }}>
              Something went wrong
            </h1>
            <p style={{
              color: "rgba(255,255,255,0.6)",
              fontSize: "14px",
              marginBottom: "24px",
              lineHeight: 1.6
            }}>
              We encountered an unexpected error. Your data is safe. Try refreshing the page.
            </p>
            <button
              onClick={this.handleRetry}
              style={{
                padding: "12px 32px",
                background: "linear-gradient(135deg,#6c63ff,#ff6584)",
                border: "none",
                borderRadius: "10px",
                color: "#fff",
                fontSize: "15px",
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              Refresh Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
