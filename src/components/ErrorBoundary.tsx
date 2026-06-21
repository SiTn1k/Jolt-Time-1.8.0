/**
 * Global Error Boundary for the application
 * Catches React rendering errors and shows a fallback UI
 */

import { Component, ReactNode } from 'react';
import { RefreshCw, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: '',
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorInfo: error.stack || '',
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      errorInfo: errorInfo.componentStack || '',
    });
  }

  handleClearAndReload = () => {
    try {
      localStorage.clear();
    } catch {
      // localStorage might not be available
    }
    window.location.reload();
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#0D1117] text-white p-6 z-[9999]">
          <div className="text-center max-w-md">
            {/* Error Icon */}
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-900/50 flex items-center justify-center">
              <span className="text-4xl">⚠️</span>
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-yellow-400 mb-4">
              🕰️ Струс Часу
            </h1>

            {/* Error Message */}
            <p className="text-gray-400 mb-2">
              Сталася неочікувана помилка.
            </p>
            <p className="text-sm text-gray-600 mb-6">
              {this.state.error?.message || 'Невідома помилка'}
            </p>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={this.handleClearAndReload}
                className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
                Очистити кеш та перезапустити
              </button>

              <button
                onClick={this.handleReload}
                className="w-full py-3 px-4 bg-[#21262D] hover:bg-[#30363D] rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors border border-[#30363D]"
              >
                <RefreshCw className="w-5 h-5" />
                Просто перезапустити
              </button>
            </div>

            {/* Dev info - hide in production */}
            {import.meta.env.DEV && this.state.errorInfo && (
              <details className="mt-6 text-left">
                <summary className="text-xs text-gray-500 cursor-pointer">
                  Деталі помилки (DEV only)
                </summary>
                <pre className="mt-2 p-3 bg-black/50 rounded-lg text-xs text-red-400 overflow-auto max-h-40">
                  {this.state.error?.toString()}
                  {'\n\n'}
                  {this.state.errorInfo}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
