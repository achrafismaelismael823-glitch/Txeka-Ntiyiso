import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
          <div className="text-center space-y-6 max-w-md">
            <div className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-10 h-10 text-red-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100">Algo correu mal</h1>
              <p className="text-sm text-slate-500 mt-2">
                Ocorreu um erro inesperado na aplicação. Tente recarregar a página.
              </p>
              {this.state.error?.message && (
                <p className="mt-3 px-4 py-2 bg-black/20 rounded-lg text-xs font-mono text-red-400/70 break-all">
                  {this.state.error.message}
                </p>
              )}
            </div>
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-6 py-3 rounded-xl transition-all text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Recarregar Aplicação
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
