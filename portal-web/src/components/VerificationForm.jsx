// src/components/VerificationForm.jsx
import React, { useState } from 'react';
import { verifyDocumentByHash } from '../services/api';
import { validateSHA256Hash, calculateSHA256, formatFileSize } from '../utils/validation';
import { Upload, Search, AlertCircle, CheckCircle } from 'lucide-react';

export default function VerificationForm({ onVerificationResult }) {
  const [method, setMethod] = useState('hash');
  const [hash, setHash] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleHashChange = (e) => {
    setHash(e.target.value.toLowerCase());
    setError('');
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 50 * 1024 * 1024) {
        setError('Ficheiro muito grande. Máximo 50MB.');
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let hashToVerify;

      if (method === 'file') {
        if (!file) {
          throw new Error('Seleccione um ficheiro');
        }
        hashToVerify = await calculateSHA256(file);
      } else {
        if (!hash) {
          throw new Error('Digite um hash SHA-256');
        }
        if (!validateSHA256Hash(hash)) {
          throw new Error('Hash inválido. Deve ter 64 caracteres hexadecimais');
        }
        hashToVerify = hash;
      }

      const result = await verifyDocumentByHash(hashToVerify);

      // Armazenar no histórico
      const history = JSON.parse(localStorage.getItem('verificationHistory') || '[]');
      history.unshift({
        timestamp: new Date().toISOString(),
        hash: hashToVerify,
        result: result,
      });
      localStorage.setItem('verificationHistory', JSON.stringify(history.slice(0, 50)));

      onVerificationResult(result, hashToVerify);
    } catch (err) {
      setError(err.message || 'Erro ao verificar documento');
      console.error('Verification error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2 className="text-2xl font-bold text-primary mb-6 flex items-center gap-2">
        <Search size={24} />
        Verificar Documento
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Seleção de Método */}
        <div>
          <label className="label-field">Método de Verificação</label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center p-3 border-2 rounded-lg cursor-pointer transition"
              style={{
                borderColor: method === 'hash' ? '#0d47a1' : '#e0e7ff',
                backgroundColor: method === 'hash' ? '#f0f4ff' : 'white',
              }}>
              <input
                type="radio"
                value="hash"
                checked={method === 'hash'}
                onChange={(e) => setMethod(e.target.value)}
                disabled={loading}
                className="mr-2"
              />
              <span className="font-semibold text-sm">Hash SHA-256</span>
            </label>
            <label className="flex items-center p-3 border-2 rounded-lg cursor-pointer transition"
              style={{
                borderColor: method === 'file' ? '#0d47a1' : '#e0e7ff',
                backgroundColor: method === 'file' ? '#f0f4ff' : 'white',
              }}>
              <input
                type="radio"
                value="file"
                checked={method === 'file'}
                onChange={(e) => setMethod(e.target.value)}
                disabled={loading}
                className="mr-2"
              />
              <span className="font-semibold text-sm">Ficheiro</span>
            </label>
          </div>
        </div>

        {/* Campo Hash */}
        {method === 'hash' && (
          <div>
            <label className="label-field">Hash SHA-256</label>
            <input
              type="text"
              value={hash}
              onChange={handleHashChange}
              className="input-field font-mono text-sm"
              placeholder="Cole o hash SHA-256 (64 caracteres)"
              disabled={loading}
            />
            <p className="text-gray-500 text-xs mt-2">
              {hash.length}/64 caracteres
            </p>
          </div>
        )}

        {/* Campo Ficheiro */}
        {method === 'file' && (
          <div>
            <label className="label-field flex items-center gap-2">
              <Upload size={18} />
              Seleccionar Ficheiro
            </label>
            <input
              type="file"
              onChange={handleFileChange}
              className="input-field cursor-pointer"
              disabled={loading}
              accept="*/*"
            />
            {file && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                <CheckCircle size={18} className="text-success" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-800 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-600">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mensagem de Erro */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-3">
            <AlertCircle className="text-danger flex-shrink-0" size={20} />
            <p className="text-danger text-sm">{error}</p>
          </div>
        )}

        {/* Botão Verificar */}
        <button
          type="submit"
          className="btn-primary w-full"
          disabled={loading}
        >
          {loading ? 'Verificando...' : 'Verificar Documento'}
        </button>
      </form>
    </div>
  );
  }
