import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { VerificationForm } from '../components/VerificationForm';
import { VerifyResult } from '../components/ResultsDisplay';
import { endpoints } from '../services/api';

const VerifyPage = () => {
  const { addToast } = useOutletContext();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleVerify = async (hash) => {
    setLoading(true);
    setResult(null);
    try {
      const { data } = await endpoints.verify.post({ hash });
      setResult(data);
      addToast('Verificação concluída', 'success');
    } catch (err) {
      const msg = err.response?.data?.detail?.[0]?.msg || 'Documento não encontrado ou inválido';
      addToast(msg, 'error');
      setResult({ status: 'invalid', dados_publicos: null });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-silver-light">Verificar Documento</h1>
        <p className="text-sm text-silver-dark mt-1">Valide a autenticidade de um documento via hash SHA-256</p>
      </div>

      <div className="glass-panel p-6">
        <VerificationForm onVerify={handleVerify} loading={loading} />
      </div>

      {result && <VerifyResult data={result} />}
    </div>
  );
};

export default VerifyPage;

