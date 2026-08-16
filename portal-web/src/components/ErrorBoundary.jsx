import React from 'react';
import { AlertTriangle, RotateCcw, Copy, ChevronDown, ChevronUp, Bug, Home } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, showDetails: false, copied: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error('ErrorBoundary capturou erro:', error, errorInfo);
    }
    this.setState({ errorInfo });
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', { description: `${error.name}: ${error.message}`, fatal: true });
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, showDetails: false });
    if (this.props.onRetry) this.props.onRetry();
  };

  handleReload = () => { window.location.reload(); };
  handleGoHome = () => { window.location.href = '/'; };

  handleCopyError = () => {
    const { error, errorInfo } = this.state;
    const text = `[Txeka Ntiyiso Error Report]\nDate: ${new Date().toISOString()}\nURL: ${window.location.href}\nUser Agent: ${navigator.userAgent}\n\nError: ${error?.name}: ${error?.message}\nStack: ${error?.stack || 'N/A'}\n\nComponent Stack: ${errorInfo?.componentStack || 'N/A'}\n\nURL: ${window.location.href}\nTime: ${new Date().toLocaleString('pt-MZ')}\nBrowser: ${navigator.userAgent}`;
    navigator.clipboard.writeText(text).then(() => {
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    });
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, showDetails, copied } = this.state;
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
          <div className="w-full max-w-lg">
            <div className="rounded-2xl border border-red-500/10 bg-slate-900/80 backdrop-blur-xl overflow-hidden">
              <div className="px-6 py-5 border-b border-red-500/10 flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-slate-100">Algo correu mal</h2>
                  <p className="text-sm text-slate-500 mt-1 leading-relaxed">Ocorreu um erro inesperado na aplicação. A nossa equipa foi notificada.</p>
                </div>
              </div>
              <div className="px-6 py-4 bg-red-500/[0.03]">
                <p className="text-sm text-red-300 font-mono break-all">{error?.message || 'Erro desconhecido'}</p>
              </div>
              <div className="px-6 py-4 flex flex-wrap gap-3">
                <button onClick={this.handleRetry} className="inline-flex items-center gap-2 px-4 py-2.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-xl hover:bg-cyan-500/20 transition-all text-sm font-medium">
                  <RotateCcw className="w-4 h-4" />Tentar novamente
                </button>
                <button onClick={this.handleReload} className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] text-slate-300 rounded-xl hover:bg-white/[0.06] transition-all text-sm font-medium">
                  <RotateCcw className="w-4 h-4" />Recarregar página
                </button>
                <button onClick={this.handleGoHome} className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] text-slate-300 rounded-xl hover:bg-white/[0.06] transition-all text-sm font-medium">
                  <Home className="w-4 h-4" />Página inicial
                </button>
              </div>
              <div className="border-t border-white/[0.06]">
                <button onClick={() => this.setState({ showDetails: !showDetails })} className="w-full flex items-center justify-between px-6 py-3 text-sm text-slate-500 hover:text-slate-300 transition-colors">
                  <span className="flex items-center gap-2"><Bug className="w-4 h-4" />Detalhes técnicos</span>
                  {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {showDetails && (
                  <div className="px-6 pb-4 space-y-3">
                    <div className="rounded-xl bg-slate-950 border border-white/[0.06] p-4 overflow-auto max-h-64">
                      <pre className="text-xs text-slate-400 font-mono whitespace-pre-wrap">
{`Error: ${error?.name}: ${error?.message}\n\nStack Trace:\n${error?.stack || 'N/A'}\n\nComponent Stack:\n${errorInfo?.componentStack || 'N/A'}\n\nURL: ${window.location.href}\nTime: ${new Date().toLocaleString('pt-MZ')}\nBrowser: ${navigator.userAgent}`}
                      </pre>
                    </div>
                    <button onClick={this.handleCopyError} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-xs text-slate-400 hover:text-slate-200 transition-all">
                      <Copy className="w-3.5 h-3.5" />{copied ? 'Copiado!' : 'Copiar relatório de erro'}
                    </button>
                  </div>
                )}
              </div>
            </div>
            <p className="text-center text-xs text-slate-600 mt-4">Txeka Ntiyiso — Infraestrutura de Verificação Documental</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
