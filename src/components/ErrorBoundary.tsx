/**
 * Global Error Boundary for the application
 * Catches React rendering errors and shows a fallback UI with full stack traces
 */

import { Component, ReactNode } from 'react';
import { RefreshCw, Trash2, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log full error to console for debugging
    console.error('========================================');
    console.error('ERROR BOUNDARY CAUGHT AN ERROR:');
    console.error('========================================');
    console.error('Message:', error.message);
    console.error('Name:', error.name);
    console.error('Stack:', error.stack);
    console.error('---------------------------------------');
    console.error('Component Stack:', errorInfo.componentStack);
    console.error('---------------------------------------');
    console.error('Error Info:', errorInfo);
    console.error('========================================');
    
    this.setState({
      errorInfo,
    });
  }

  toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

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
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#0D1117] text-white p-4 z-[9999] overflow-auto">
          <div className="text-center max-w-2xl w-full">
            {/* Error Icon */}
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-red-900/50 flex items-center justify-center">
              <span className="text-5xl">⚠️</span>
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-yellow-400 mb-4">
              🕰️ Струс Часу
            </h1>

            {/* Error Message */}
            <p className="text-lg text-gray-400 mb-2">
              Сталася неочікувана помилка.
            </p>
            <p className="text-sm text-gray-500 mb-6 font-mono">
              {this.state.error?.message || 'Невідома помилка'}
            </p>

            {/* Actions */}
            <div className="space-y-3 mb-6">
              <button
                onClick={this.handleClearAndReload}
                className="w-full py-4 px-4 bg-red-600 hover:bg-red-700 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors text-lg"
              >
                <Trash2 className="w-6 h-6" />
                Очистити кеш та перезапустити
              </button>

              <button
                onClick={this.handleReload}
                className="w-full py-4 px-4 bg-[#21262D] hover:bg-[#30363D] rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors border border-[#30363D]"
              >
                <RefreshCw className="w-5 h-5" />
                Просто перезапустити
              </button>
            </div>

            {/* Error Details Toggle */}
            <button
              onClick={this.toggleDetails}
              className="w-full py-3 px-4 bg-[#161B22] hover:bg-[#1C2128] rounded-xl font-medium flex items-center justify-center gap-2 transition-colors border border-[#30363D] text-sm"
            >
              <AlertTriangle className="w-4 h-4" />
              {this.state.showDetails ? 'Приховати' : 'Показати'} технічні деталі
              {this.state.showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {/* Full Error Details */}
            {this.state.showDetails && (
              <div className="mt-4 text-left">
                {/* Error Name and Message */}
                <div className="bg-[#161B22] rounded-xl p-4 mb-4 border border-[#30363D]">
                  <h3 className="text-sm font-semibold text-gray-400 mb-2">Тип помилки:</h3>
                  <p className="text-red-400 font-mono">
                    {this.state.error?.name}: {this.state.error?.message}
                  </p>
                </div>

                {/* Stack Trace */}
                <div className="bg-[#161B22] rounded-xl p-4 mb-4 border border-[#30363D]">
                  <h3 className="text-sm font-semibold text-gray-400 mb-2">Stack Trace:</h3>
                  <pre className="p-3 bg-black/50 rounded-lg text-xs text-red-300 overflow-auto max-h-60 font-mono whitespace-pre-wrap">
                    {this.state.error?.stack || 'No stack trace available'}
                  </pre>
                </div>

                {/* Component Stack */}
                <div className="bg-[#161B22] rounded-xl p-4 mb-4 border border-[#30363D]">
                  <h3 className="text-sm font-semibold text-gray-400 mb-2">Component Stack:</h3>
                  <pre className="p-3 bg-black/50 rounded-lg text-xs text-green-300 overflow-auto max-h-60 font-mono whitespace-pre-wrap">
                    {this.state.errorInfo?.componentStack || 'No component stack available'}
                  </pre>
                </div>

                {/* Copy button hint */}
                <p className="text-xs text-gray-600 text-center">
                  Відкрийте DevTools (F12) → Console для повного логу помилки
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
