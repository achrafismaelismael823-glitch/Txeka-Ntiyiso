import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-6">
          <FileQuestion className="w-10 h-10 text-slate-500" />
        </div>
        <h1 className="text-6xl font-bold text-slate-800 mb-2">404</h1>
        <h2 className="text-xl font-semibold text-slate-200 mb-3">Página não encontrada</h2>
        <p className="text-sm text-slate-500 mb-8 leading-relaxed">
          A página que procura não existe ou foi movida. 
          Verifique o endereço ou volte para a página inicial.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/" className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-xl hover:bg-cyan-500/20 transition-all text-sm font-medium">
            <Home className="w-4 h-4" />
            Página Inicial
          </Link>
          <button onClick={() => window.history.back()} className="inline-flex items-center gap-2 px-6 py-3 bg-white/[0.03] border border-white/[0.08] text-slate-300 rounded-xl hover:bg-white/[0.06] transition-all text-sm font-medium">
            <ArrowLeft className="w-4 h-4" />
            Voltar atrás
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
