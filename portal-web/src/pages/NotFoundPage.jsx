// 404 Enterprise — animado, com navegação de escape, mantendo a identidade visual

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Home, ArrowLeft, Search } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      <div className="text-center max-w-md w-full">
        {/* Logo animado */}
        <div className="relative inline-block mb-8">
          <div className="w-24 h-24 bg-[#0B192C] rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-[#0B192C]/20 animate-bounce">
            <ShieldCheck className="w-12 h-12 text-[#00D2C4]" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-rose-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg">
            404
          </div>
        </div>

        <h1 className="text-6xl font-black text-[#0B192C] mb-2 tracking-tight">404</h1>
        <h2 className="text-xl font-bold text-[#0B192C] mb-3">Página não encontrada</h2>
        <p className="text-slate-500 text-sm mb-8 leading-relaxed">
          O documento ou recurso que procura não existe neste servidor.
          <br />
          Verifique o endereço ou volte ao início.
        </p>

        <div className="space-y-3">
          <Link
            to="/dashboard"
            className="w-full flex items-center justify-center gap-2 bg-[#0B192C] hover:bg-slate-800 text-white font-bold py-3 rounded-xl transition shadow-lg"
          >
            <Home className="w-5 h-5" /> Ir para o Dashboard
          </Link>
          <button
            onClick={() => navigate(-1)}
            className="w-full flex items-center justify-center gap-2 bg-white border-2 border-slate-200 hover:border-[#00D2C4] text-slate-700 hover:text-[#0B192C] font-bold py-3 rounded-xl transition"
          >
            <ArrowLeft className="w-5 h-5" /> Voltar atrás
          </button>
          <Link
            to="/verify"
            className="w-full flex items-center justify-center gap-2 bg-white border-2 border-slate-200 hover:border-[#00D2C4] text-slate-700 hover:text-[#0B192C] font-bold py-3 rounded-xl transition"
          >
            <Search className="w-5 h-5" /> Verificar Documento
          </Link>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-200">
          <p className="text-xs text-slate-400">
            Txeka Ntiyiso — Middleware de Integridade Criptográfica v2.0.0
          </p>
        </div>
      </div>
    </div>
  );
}

