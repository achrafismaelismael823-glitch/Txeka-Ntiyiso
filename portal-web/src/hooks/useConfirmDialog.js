import { useState, useCallback } from 'react';

export const useConfirmDialog = () => {
  const [state, setState] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
    variant: 'danger',
    loading: false,
    resolve: null,
    children: null,
  });

  const confirm = useCallback((options = {}) => {
    return new Promise((resolve) => {
      setState({
        isOpen: true,
        title: options.title || 'Confirmar ação',
        message: options.message || 'Tem certeza que deseja prosseguir?',
        confirmText: options.confirmText || 'Confirmar',
        cancelText: options.cancelText || 'Cancelar',
        variant: options.variant || 'danger',
        loading: false,
        resolve,
        children: options.children || null,
      });
    });
  }, []);

  const handleConfirm = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }));
    await new Promise((r) => setTimeout(r, 200));
    state.resolve?.(true);
    setState((prev) => ({ ...prev, isOpen: false, loading: false }));
  }, [state.resolve]);

  const handleCancel = useCallback(() => {
    state.resolve?.(false);
    setState((prev) => ({ ...prev, isOpen: false }));
  }, [state.resolve]);

  const ConfirmDialogComponent = useCallback(() => {
    const { isOpen, title, message, confirmText, cancelText, variant, loading, children } = state;
    if (!isOpen) return null;

    const variants = {
      danger: {
        icon: '⚠️',
        confirmClass: 'bg-red-500 hover:bg-red-400 text-white',
        borderClass: 'border-red-500/20',
        bgClass: 'bg-red-500/5',
      },
      warning: {
        icon: '⚡',
        confirmClass: 'bg-amber-500 hover:bg-amber-400 text-slate-950',
        borderClass: 'border-amber-500/20',
        bgClass: 'bg-amber-500/5',
      },
      info: {
        icon: 'ℹ️',
        confirmClass: 'bg-cyan-500 hover:bg-cyan-400 text-slate-950',
        borderClass: 'border-cyan-500/20',
        bgClass: 'bg-cyan-500/5',
      },
      success: {
        icon: '✅',
        confirmClass: 'bg-emerald-500 hover:bg-emerald-400 text-slate-950',
        borderClass: 'border-emerald-500/20',
        bgClass: 'bg-emerald-500/5',
      },
    };

    const style = variants[variant] || variants.danger;

    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
        <div className="w-full max-w-md bg-slate-900/95 backdrop-blur-2xl border border-white/[0.08] rounded-2xl shadow-2xl animate-scale-in">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
            <h3 className="text-base font-bold text-slate-100">{title}</h3>
            <button
              onClick={handleCancel}
              className="p-1 rounded-lg hover:bg-white/[0.05] text-slate-400 hover:text-slate-200 transition-colors"
            >
              <span className="sr-only">Fechar</span>
              ✕
            </button>
          </div>
          <div className="p-6 space-y-5">
            <div className={`flex items-start gap-4 p-4 rounded-xl border ${style.borderClass} ${style.bgClass}`}>
              <span className="text-xl shrink-0">{style.icon}</span>
              <div>
                <p className="text-sm text-slate-300 leading-relaxed">{message}</p>
                {children && <div className="mt-3">{children}</div>}
              </div>
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={handleCancel}
                disabled={loading}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-white/[0.03] transition-all disabled:opacity-50"
              >
                {cancelText}
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2 ${style.confirmClass}`}
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    A processar...
                  </>
                ) : (
                  confirmText
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }, [state, handleConfirm, handleCancel]);

  return { confirm, ConfirmDialogComponent };
};

export default useConfirmDialog;

