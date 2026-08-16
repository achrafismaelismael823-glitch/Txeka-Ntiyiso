import React, { createContext, useState, useCallback, useRef, useContext } from 'react';
import { X, CheckCircle2, AlertTriangle, Info, XCircle, Loader2 } from 'lucide-react';

export const NotificationContext = createContext(null);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification deve ser usado dentro de NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children, maxToasts = 5, position = 'top-right' }) => {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);
  const timersRef = useRef(new Map());

  const clearTimer = useCallback((id) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const removeToast = useCallback((id) => {
    clearTimer(id);
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, [clearTimer]);

  const addToast = useCallback((message, type = 'info', options = {}) => {
    const { duration = type === 'loading' ? 0 : 5000, title, action, onClose, persistent = false } = options;
    const id = ++idRef.current;

    setToasts((prev) => {
      const trimmed = prev.length >= maxToasts ? prev.slice(prev.length - maxToasts + 1) : prev;
      return [...trimmed, { id, message, type, duration, title, action, persistent, createdAt: Date.now() }];
    });

    if (duration > 0 && !persistent) {
      const timer = setTimeout(() => {
        removeToast(id);
        onClose?.();
      }, duration);
      timersRef.current.set(id, timer);
    }
    return id;
  }, [maxToasts, removeToast]);

  const updateToast = useCallback((id, updates) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
    if (updates.type && updates.type !== 'loading') {
      const duration = updates.duration || 5000;
      clearTimer(id);
      const timer = setTimeout(() => removeToast(id), duration);
      timersRef.current.set(id, timer);
    }
  }, [clearTimer, removeToast]);

  const notify = useCallback((message, type = 'info', options) => addToast(message, type, options), [addToast]);
  const success = useCallback((message, options) => addToast(message, 'success', options), [addToast]);
  const error = useCallback((message, options) => addToast(message, 'error', options), [addToast]);
  const warning = useCallback((message, options) => addToast(message, 'warning', options), [addToast]);
  const info = useCallback((message, options) => addToast(message, 'info', options), [addToast]);
  const loading = useCallback((message, options) => addToast(message, 'loading', { ...options, duration: 0, persistent: true }), [addToast]);
  const clearAll = useCallback(() => {
    timersRef.current.forEach((timer) => clearTimeout(timer));
    timersRef.current.clear();
    setToasts([]);
  }, []);
  const dismiss = useCallback((id) => removeToast(id), [removeToast]);

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  };

  return (
    <NotificationContext.Provider value={{ notify, success, error, warning, info, loading, addToast, updateToast, removeToast, dismiss, clearAll }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} positionClass={positionClasses[position] || positionClasses['top-right']} />
    </NotificationContext.Provider>
  );
};

const ToastContainer = ({ toasts, onRemove, positionClass }) => {
  if (toasts.length === 0) return null;
  return (
    <div className={`fixed z-[100] w-full max-w-sm pointer-events-none ${positionClass}`}>
      <div className="space-y-3">
        {toasts.map((toast) => <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />)}
      </div>
    </div>
  );
};

const ToastItem = ({ toast, onRemove }) => {
  const { id, message, type, title, action } = toast;
  const config = {
    success: { icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />, border: 'border-emerald-500/20', bg: 'bg-emerald-500/10', progress: 'bg-emerald-400' },
    error: { icon: <XCircle className="w-5 h-5 text-red-400 shrink-0" />, border: 'border-red-500/20', bg: 'bg-red-500/10', progress: 'bg-red-400' },
    warning: { icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />, border: 'border-amber-500/20', bg: 'bg-amber-500/10', progress: 'bg-amber-400' },
    info: { icon: <Info className="w-5 h-5 text-cyan-400 shrink-0" />, border: 'border-cyan-500/20', bg: 'bg-cyan-500/10', progress: 'bg-cyan-400' },
    loading: { icon: <Loader2 className="w-5 h-5 text-cyan-400 shrink-0 animate-spin" />, border: 'border-cyan-500/20', bg: 'bg-cyan-500/10', progress: 'bg-cyan-400' },
  };
  const style = config[type] || config.info;

  return (
    <div className={`pointer-events-auto flex flex-col rounded-xl border backdrop-blur-xl shadow-2xl animate-slide-in ${style.bg} ${style.border} overflow-hidden`} role="alert">
      <div className="flex items-start gap-3 p-4">
        {style.icon}
        <div className="flex-1 min-w-0">
          {title && <p className="text-sm font-semibold text-slate-200 mb-0.5">{title}</p>}
          <p className="text-sm text-slate-100 leading-relaxed">{message}</p>
          {action && <div className="mt-2">{action}</div>}
        </div>
        <button onClick={() => onRemove(id)} className="text-slate-400 hover:text-white transition-colors shrink-0 mt-0.5" aria-label="Fechar notificação">
          <X className="w-4 h-4" />
        </button>
      </div>
      {toast.duration > 0 && type !== 'loading' && (
        <div className="h-0.5 bg-white/5">
          <div className={`h-full ${style.progress} animate-shrink`} style={{ animationDuration: `${toast.duration}ms` }} />
        </div>
      )}
    </div>
  );
};

export default NotificationProvider;
