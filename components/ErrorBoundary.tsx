import React, { Component, ReactNode } from 'react';
import { AppError, createErrorBoundaryHandler, getUserFriendlyMessage } from '@/utils/errorHandling';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: AppError) => void;
}

interface State {
  hasError: boolean;
  error: AppError | null;
}

class ErrorBoundary extends Component<Props, State> {
  private errorHandler: ReturnType<typeof createErrorBoundaryHandler>;

  constructor(props: Props) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null
    };

    this.errorHandler = createErrorBoundaryHandler(
      (error) => {
        this.setState({ hasError: true, error });
        if (this.props.onError) {
          this.props.onError(error);
        }
      },
      () => {
        this.setState({ hasError: false, error: null });
      }
    );
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error: {
        type: 'unknown',
        message: error.message,
        recoverable: true,
        timestamp: new Date()
      }
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.errorHandler.handleError(error, errorInfo);
  }

  handleRetry = () => {
    this.errorHandler.recover();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const error = this.state.error!;
      const userMessage = getUserFriendlyMessage(error);

      return (
        <div className="min-h-screen bg-history-dark flex items-center justify-center p-8">
          <div className="max-w-md w-full bg-black bg-opacity-50 backdrop-blur-sm rounded-lg p-6 border border-red-500 border-opacity-30">
            <div className="text-center">
              {/* Error Icon */}
              <div className="w-16 h-16 mx-auto mb-4 bg-red-500 bg-opacity-20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>

              {/* Error Message */}
              <h2 className="text-xl font-cinematic text-red-400 mb-2">
                Something Went Wrong
              </h2>
              
              <p className="text-white opacity-80 text-sm font-modern mb-6">
                {userMessage}
              </p>

              {/* Error Details (Development) */}
              {process.env.NODE_ENV === 'development' && (
                <details className="mb-6 text-left">
                  <summary className="text-history-gold text-sm cursor-pointer mb-2">
                    Technical Details
                  </summary>
                  <div className="bg-black bg-opacity-50 rounded p-3 text-xs text-white opacity-70 font-mono">
                    <p><strong>Type:</strong> {error.type}</p>
                    <p><strong>Message:</strong> {error.message}</p>
                    <p><strong>Time:</strong> {error.timestamp.toISOString()}</p>
                    {error.details && (
                      <p><strong>Details:</strong> {error.details}</p>
                    )}
                  </div>
                </details>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                {error.recoverable && (
                  <button
                    onClick={this.handleRetry}
                    className="w-full bg-history-gold text-black py-2 px-4 rounded-lg font-medium hover:bg-yellow-400 transition-colors"
                  >
                    Try Again
                  </button>
                )}
                
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-white bg-opacity-10 text-white py-2 px-4 rounded-lg font-medium hover:bg-opacity-20 transition-colors"
                >
                  Refresh Page
                </button>
              </div>

              {/* Support Info */}
              <p className="text-white opacity-50 text-xs font-modern mt-4">
                If this problem persists, please refresh the page or try again later.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;