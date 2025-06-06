import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { trackError } from '../lib/analytics';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  boundary?: string;
  errorCallback?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { 
      hasError: true, 
      error,
      errorInfo: null
    };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ hasError: true, error, errorInfo });
    
    console.error(
      `Error in ${this.props.boundary || 'component'}:`,
      error,
      errorInfo
    );

    trackError(error, errorInfo.componentStack, this.props.boundary);

    this.props.errorCallback?.(error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null,
      errorInfo: null
    });
  };

  private handleRefresh = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[200px] flex items-center justify-center bg-gray-50 p-4 rounded-lg">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <AlertCircle className="h-6 w-6" />
              <h2 className="text-xl font-semibold">Something went wrong</h2>
            </div>
            
            <p className="text-gray-600 mb-4">
              {this.props.boundary 
                ? `An error occurred in the ${this.props.boundary}. Please try again.`
                : 'An unexpected error occurred. Please try again or contact support if the problem persists.'}
            </p>

            {this.state.error && (
              <div className="mb-4 p-3 bg-red-50 rounded-md">
                <p className="text-sm text-red-700 font-mono">
                  {this.state.error.message}
                </p>
              </div>
            )}
            
            <div className="flex gap-4">
              <button
                onClick={this.handleRetry}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </button>
              <button
                onClick={this.handleRefresh}
                className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;