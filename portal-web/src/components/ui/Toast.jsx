import React, { useEffect } from 'react';
import { X, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

const icons = {
  success: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
  error: <AlertTriangle className="w-5 h-5 text-red-400" />,
  info: <Info className="w-5 h-5 text-cyan-400" />,
};

const styles = {
  success: 'bg-emerald-500/10 border-emerald-500/20',
  error: 'bg-red-500/10 border-red-500/20',
  info: 'bg-cyan-500/10 border-cyan-500/20',
};

export const Toast = ({ id, message, type = 'info', duration = 5000, onRemove }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => onRemove(id), duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, onRemove]);

  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border backdrop-blur-xl shadow-2xl animate-slide-in ${styles[type]}`}>
      {icons[type]}
      <p className="text-sm text-slate-100 flex-1">{message}</p>
      <button onClick={() => onRemove(id)} className="text-slate-400 hover:text-white transition-colors">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
