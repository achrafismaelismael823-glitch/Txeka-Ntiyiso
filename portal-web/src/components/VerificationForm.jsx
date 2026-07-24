import React, { useState } from 'react';
import { verifyDocumentByHash } from '../services/api';
import { validateSHA256Hash, calculateSHA256, formatFileSize } from '../utils/validation';
import { Upload, Search, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

export default function VerificationForm({ onVerificationResult }) {
  const [method, setMethod] = useState('hash');
  const [hash, setHash] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleHashChange = (e) => {
    setHash(e.target.value.toLowerCase());
    setError(null);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 50 * 1024 * 1024) {
        setError({ message: 'Ficheiro muito grande. Máximo 50MB.', type: 'warning' });
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let hashToVerify;
      if (method === 'file') {
        if (!file) throw Object.assign(new Error('Seleccione um ficheiro'), { translated: { code: 'VALIDATION', message: 'Seleccione um ficheiro.', type: 'warning' } });
        hashToVerify = await calculateSHA256(file);
      } else {
        if (!hash) throw Object.assign(new Error('Digite um hash'), { translated: { code: 'VALIDATION', message: 'Digite um hash SHA-256.', type: 'warning' } });
        if (!validateSHA256Hash(hash)) throw Object.assign(new Error('Hash inválido'), { translated: { code: 'VALIDATION', message: 'Hash inválido. Deve ter 64 caracteres hexadecimais.', type: 'warning' } });
        hashToVerify = hash;
      }

      const result = await verifyDocumentByHash(hashToVerify);
      const history = JSON.parse(localStorage.getItem('verificationHistory') || '[]');
      history.unshift({ timestamp: new Date().toISOString(), hash: hashToVerify, result, status: result.status });
      localStorage.setItem('verificationHistory', JSON.stringify(history.slice(0, 50)));
      onVerificationResult(result, hashToVerify);
    } catch (err) {
      const translated = err.translated || { message: err.message || 'Erro ao verificar.', type: 'error' };
      setError(translated);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
        <Search className="h-5 w-5 text-[#00D2C4]" /> Verificar Documento
      </h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Metodo</label>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => { setMethod('hash'); setError(null); }} className={`p-3 border-2 rounded-xl text-sm font-semibold transition ${method === 'hash' ? 'border-[#00D2C4] bg-[#00D2C4]/5 text-[#0B192C]' : 'border-slate-200 text-slate-600'}`}>Hash SHA-256</button>
            <button type="button" onClick={() => { setMethod('file'); setError(null); }} className={`p-3 border-2 rounded-xl text-sm font-semibold transition ${method === 'file' ? 'border-[#00D2C4] bg-[#00D2C4]/5 text-[#0B192C]' : 'border-slate-200 text-slate-600'}`}>Ficheiro</button>
          </div>
        </div>
        {method === 'hash' && (
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Hash SHA-256</label>
            <input type="text" value={hash} onChange={handleHashChange} className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-[#00D2C4] font-mono" placeholder="Cole o hash (64 caracteres)" disabled={loading} />
            <p className="text-slate-400 text-xs mt-1">{hash.length}/64</p>
          </div>
        )}
        {method === 'file' && (
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2 flex items-center gap-2"><Upload className="h-4 w-4" /> Ficheiro</label>
            <input type="file" onChange={handleFileChange} className="w-full bg-slate-50 border border-slate-200 text-sm rounded-xl px-4 py-3" disabled={loading} accept="*/*" />
            {file && <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2"><CheckCircle className="h-5 w-5 text-emerald-600" /><div><p className="font-semibold text-sm truncate">{file.name}</p><p className="text-xs text-slate-600">{formatFileSize(file.size)}</p></div></div>}
          </div>
        )}
        {error && <div className={`border rounded-xl p-3 flex gap-3 ${error.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-rose-50 border-rose-200 text-rose-700'}`}><AlertCircle className="flex-shrink-0 h-5 w-5" /><p className="text-sm font-medium">{error.message}</p></div>}
        <button type="submit" className="w-full bg-[#0B192C] hover:bg-slate-800 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50" disabled={loading}>
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Verificando...</> : <><Search className="h-4 w-4" /> Verificar</>}
        </button>
      </form>
    </div>
  );
}
