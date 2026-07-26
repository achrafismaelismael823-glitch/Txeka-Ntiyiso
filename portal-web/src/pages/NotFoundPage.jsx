import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowLeft } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="w-20 h-20 rounded-2xl bg-slate-900 border border-white/[0.06] flex items-center justify-center mx-auto">
          <AlertTriangle className="w-10 h-10 text-slate-500" />
        </div>
        <div>
          <h1 className="text-6xl font-bold text-slate-800">404</h1>
          <h2 className="text-xl font-bold text-slate-100 mt-2">Página não encontrada</h2>
          <p className="text-sm text-slate-500 mt-2">
            O recurso que procuras não existe ou foi movido.
          </p>
        </div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-6 py-3 rounded-xl transition-all text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao Dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
