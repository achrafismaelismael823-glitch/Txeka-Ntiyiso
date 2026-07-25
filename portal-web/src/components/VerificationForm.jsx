import React, { useState } from 'react';
import { Search, Hash } from 'lucide-react';
import { isValidSHA256 } from '../utils/validation';

export const VerificationForm = ({ onVerify, loading }) => {
  const [hash, setHash] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!hash.trim()) {
      setError('Digite o hash do documento');
      return;
    }
    if (!isValidSHA256(hash.trim())) {
      setError('Hash SHA-256 inválido (deve ter 64 caracteres hexadecimais)');
      return;
    }
    onVerify(hash.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-silver mb-2">Hash SHA-256 do Documento</label>
        <div className="relative">
          <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-silver-dark" />
          <input
            type="text"
            value={hash}
            onChange={(e) => setHash(e.target.value)}
            placeholder="a1b2c3d4... (64 caracteres)"
            className="input-field pl-10 font-mono text-sm"
            maxLength={64}
          />
        </div>
        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
        <Search className="w-4 h-4" />
        {loading ? 'Verificando...' : 'Verificar Documento'}
      </button>
    </form>
  );
};
