import React from 'react';
import { X, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

const Toast = ({ message, type = 'info', onClose, duration = 5000 }) => {
  React.useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const config = {
    success: {
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
      border: 'border-emerald-500/20',
      bg: 'bg-emerald-500/10',
    },
    error: {
      icon: <AlertTriangle className="w-5 h-5 text-red-400" />,
      border: 'border-red-500/20',
      bg: 'bg-red-500/10',
    },
    info: {
      icon: <Info className="w-5 h-5 text-cyan-400" />,
      border: 'border-cyan-500/20',
      bg: 'bg-cyan-500/10',
    },
  };

  const { icon, border, bg } = config[type] || config.info;

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border backdrop-blur-xl shadow-2xl animate-slide-in ${bg} ${border}`}
    >
      {icon}
      <p className="text-sm text-slate-100 flex-1">{message}</p>
      <button
        onClick={onClose}
        className="text-slate-400 hover:text-white transition-colors shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Toast;
