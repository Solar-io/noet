import React from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

class RobustErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error, errorInfo) {
    const errorDetails = {
      error,
      errorInfo,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      retryCount: this.state.retryCount,
    };

    // Enhanced error logging
    console.group("🚨 RobustErrorBoundary caught an error");
    console.error("Error ID:", this.state.errorId);
    console.error("Error:", error);
    console.error("Error message:", error?.message);
    console.error("Error stack:", error?.stack);
    console.error(
      "Component stack:",
      errorInfo?.componentStack || "No component stack available"
    );
    console.error("Props:", errorInfo?.props || "No props available");
    console.error("Full error details:", errorDetails);
    console.groupEnd();

    this.setState({
      error: error,
      errorInfo: errorInfo,
    });

    // Optional: Send to error reporting service
    if (this.props.onError) {
      this.props.onError(errorDetails);
    }
  }

  handleRetry = () => {
    this.setState((prevState) => ({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: prevState.retryCount + 1,
    }));
  };

  handleReset = () => {
    // Clear all state and reload
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  handleGoHome = () => {
    // Navigate to safe state
    if (this.props.onGoHome) {
      this.props.onGoHome();
    } else {
      window.location.href = "/";
    }
  };

  render() {
    if (this.state.hasError) {
      // Fallback UI with recovery options
      return (
        <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-6 border border-red-200">
            <div className="flex items-center mb-4">
              <AlertTriangle className="text-red-600 mr-3" size={24} />
              <h1 className="text-2xl font-bold text-red-600">
                Something went wrong
              </h1>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                {this.props.fallbackMessage ||
                  "The application encountered an unexpected error. You can try to recover or reload the page."}
              </p>

              {this.state.errorId && (
                <p className="text-sm text-gray-500 mb-2">
                  Error ID:{" "}
                  <code className="bg-gray-100 px-1 rounded">
                    {this.state.errorId}
                  </code>
                </p>
              )}

              {this.state.retryCount > 0 && (
                <p className="text-sm text-orange-600 mb-2">
                  Retry attempts: {this.state.retryCount}
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-3 mb-6">
              <button
                onClick={this.handleRetry}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                <RefreshCw size={16} className="mr-2" />
                Try Again
              </button>

              <button
                onClick={this.handleReset}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                <RefreshCw size={16} className="mr-2" />
                Reload Page
              </button>

              <button
                onClick={this.handleGoHome}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                <Home size={16} className="mr-2" />
                Go Home
              </button>
            </div>

            {/* Error details (collapsible) */}
            <details className="mb-4">
              <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                Technical Details (for debugging)
              </summary>
              <div className="mt-3 p-4 bg-gray-50 rounded border">
                <div className="mb-3">
                  <strong>Error:</strong>
                  <pre className="mt-1 text-xs bg-white p-2 rounded border overflow-auto">
                    {this.state.error
                      ? this.state.error.toString()
                      : "No error details"}
                  </pre>
                </div>

                {this.state.error?.stack && (
                  <div className="mb-3">
                    <strong>Stack Trace:</strong>
                    <pre className="mt-1 text-xs bg-white p-2 rounded border overflow-auto max-h-32">
                      {this.state.error.stack}
                    </pre>
                  </div>
                )}

                {this.state.errorInfo?.componentStack && (
                  <div>
                    <strong>Component Stack:</strong>
                    <pre className="mt-1 text-xs bg-white p-2 rounded border overflow-auto max-h-32">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </div>
                )}
              </div>
            </details>

            {this.props.additionalInfo && (
              <div className="text-sm text-gray-600">
                {this.props.additionalInfo}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default RobustErrorBoundary;
