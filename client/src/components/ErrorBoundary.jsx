import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Realtime Component Error Caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-dark-bg text-center text-white border border-red-500/20 rounded-2xl m-4 backdrop-blur-lg">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center text-red-400 mb-4 animate-pulse">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold mb-2">Something went wrong in this section</h2>
          <p className="text-gray-400 text-sm max-w-md mb-6 leading-relaxed font-light">
            An unexpected error occurred while rendering the real-time interface. Your active session and data remain perfectly intact.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-primary text-white font-semibold text-sm hover:scale-105 transition-all flex items-center gap-2 shadow-lg"
          >
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Reload Interface</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
