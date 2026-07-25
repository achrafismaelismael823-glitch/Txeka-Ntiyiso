import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Home } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-panel p-8 max-w-md w-full text-center">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-cyan/10 flex items-center justify-center border border-cyan/30">
          <ShieldAlert className="w-10 h-10 text-cyan" />
        </div>
        <h1 className="text-4xl font-bold text-silver-light mb-2">404</h1>
        <h2 className="text-xl font-semibold text-silver mb-2">Página não encontrada</h2>
        <p className="text-sm text-silver-dark mb-6">
          O recurso que procura não existe ou foi movido.
        </p>
        <Link to="/" className="btn-primary inline-flex items-center gap-2">
          <Home className="w-4 h-4" /> Voltar ao Painel
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
