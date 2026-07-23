import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0B192C] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
            <div className="inline-flex items-center justify-center p-3 bg-rose-50 rounded-2xl mb-4">
              <AlertTriangle className="h-10 w-10 text-rose-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Algo deu errado</h2>
            <p className="text-slate-500 text-sm mb-6">Ocorreu um erro inesperado na aplicacao. A equipe tecnica foi notificada.</p>
            <div className="flex gap-3">
              <button onClick={this.handleReload} className="flex-1 bg-[#0B192C] hover:bg-slate-800 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2">
                <RefreshCw className="h-4 w-4" /> Recarregar
              </button>
              <button onClick={this.handleReset} className="flex-1 bg-white border-2 border-slate-200 hover:border-[#00D2C4] text-slate-700 font-semibold py-3 rounded-xl transition">
                Tentar novamente
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

