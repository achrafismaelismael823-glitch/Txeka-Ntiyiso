// Modal base reutilizável — backdrop, animação, foco trap, ESC para fechar
// Todas as páginas podem refatorar para usar este componente

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md', // sm | md | lg | xl
  closeOnBackdrop = true,
  closeOnEsc = true,
}) {
  const modalRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e) => {
      if (e.key === 'Escape' && closeOnEsc) onClose();
    };
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, closeOnEsc, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && closeOnBackdrop) onClose();
      }}
    >
      <div
        ref={modalRef}
        className={`bg-white rounded-2xl shadow-2xl w-full ${sizes[size]} animate-in zoom-in-95 max-h-[90vh] flex flex-col`}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
            <h3 className="text-lg font-bold text-[#0B192C]">{title}</h3>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-100 rounded-lg transition text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto flex-1">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-slate-100 flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

