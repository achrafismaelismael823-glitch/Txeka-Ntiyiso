import React, { useState } from 'react';
import { Search, Loader2, ShieldCheck } from 'lucide-react';
import { isValidHash } from '../utils/validation';

export const VerificationForm = ({ onVerify, loading = false }) => {
  const [hash, setHash] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!hash.trim()) {
      setError('Por favor, insira o hash do documento');
      return;
    }

    if (!isValidHash(hash.trim())) {
      setError('O hash inserido não é válido. Deve conter 64 caracteres hexadecimais.');
      return;
    }

    onVerify(hash.trim());
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="w-8 h-8 text-cyan-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-100 mb-2">Verificar Documento</h2>
        <p className="text-sm text-slate-500">Insira o hash SHA-256 do documento para verificar a sua autenticidade</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <input
            type="text"
            value={hash}
            onChange={(e) => setHash(e.target.value)}
            placeholder="ex: a1b2c3d4e5f6... (64 caracteres)"
            className={`w-full px-4 py-4 pl-12 bg-slate-900/50 border rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none transition-all ${error ? 'border-red-500/30 focus:border-red-500/50' : 'border-white/[0.08] focus:border-cyan-500/30'}`}
            maxLength={64}
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
        </div>

        {error && (
          <p className="text-xs text-red-400 flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-red-400" />
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              A verificar...
            </>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4" />
              Verificar Documento
            </>
          )}
        </button>
      </form>

      <div className="mt-6 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
        <p className="text-xs text-slate-500 leading-relaxed">
          <strong className="text-slate-300">Nota:</strong> O hash de verificação é único para cada documento e serve como prova de autenticidade. 
          Pode encontrá-lo no certificado ou no email de confirmação da emissão.
        </p>
      </div>
    </div>
  );
};

export default VerificationForm;
