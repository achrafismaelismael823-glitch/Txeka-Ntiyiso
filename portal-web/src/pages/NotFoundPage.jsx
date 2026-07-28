import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileX, ArrowLeft, Home } from 'lucide-react';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md animate-fade-in">
        <div className="w-20 h-20 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto">
          <FileX className="w-10 h-10 text-slate-600" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-slate-100">404</h1>
          <p className="text-lg text-slate-400">Página não encontrada</p>
          <p className="text-sm text-slate-600">
            O recurso que procura não existe ou foi movido para outra localização.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-slate-300 hover:bg-white/[0.06] transition-all text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 transition-all text-sm font-medium"
          >
            <Home className="w-4 h-4" />
            Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
