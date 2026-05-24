// src/components/ResultsDisplay.jsx
import React from 'react';
import { formatDate } from '../utils/validation';
import { CheckCircle, AlertCircle, Copy, Check } from 'lucide-react';

export default function ResultsDisplay({ result, hash }) {
  const [copied, setCopied] = React.useState(false);

  if (!result) {
    return null;
  }

  const isVerified = result.status === 'success' && result.dados_publicos;

  const handleCopyHash = () => {
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`card border-2 mt-6 ${
      isVerified 
        ? 'border-success bg-green-50' 
        : 'border-danger bg-red-50'
    }`}>
      {/* Cabeçalho do Resultado */}
      <div className="flex items-start gap-4 mb-6">
        <div className="text-4xl flex-shrink-0">
          {isVerified ? '✅' : '❌'}
        </div>
        <div className="flex-1">
          <h3 className={`text-2xl font-bold ${
            isVerified ? 'text-success' : 'text-danger'
          }`}>
            {isVerified ? 'Documento Autenticado' : 'Documento Não Encontrado'}
          </h3>
          <p className="text-gray-600 text-sm mt-1">
            {isVerified 
              ? 'O documento foi verificado com sucesso na base de dados de DocVerify MZ'
              : 'O documento com este hash não foi encontrado no sistema'
            }
          </p>
        </div>
      </div>

      {/* Dados do Documento (se encontrado) */}
      {isVerified && result.dados_publicos && (
        <div className="space-y-3 mb-6">
          <div className="bg-white rounded-lg p-3">
            <p className="text-gray-600 text-xs font-semibold">ID do Documento</p>
            <p className="text-lg font-bold text-primary">
              {result.dados_publicos.doc_id}
            </p>
          </div>

          <div className="bg-white rounded-lg p-3">
            <p className="text-gray-600 text-xs font-semibold">Instituição Verificadora</p>
            <p className="text-gray-800 font-semibold">
              {result.dados_publicos.instituicao}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-lg p-3">
              <p className="text-gray-600 text-xs font-semibold">Estado</p>
              <p className="text-gray-800 font-semibold">
                {result.dados_publicos.estado}
              </p>
            </div>
            <div className="bg-white rounded-lg p-3">
              <p className="text-gray-600 text-xs font-semibold">Status</p>
              <p className={`font-semibold ${
                result.dados_publicos.revogado ? 'text-danger' : 'text-success'
              }`}>
                {result.dados_publicos.revogado ? '⚠️ Revogado' : '✓ Válido'}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-3">
            <p className="text-gray-600 text-xs font-semibold">Data de Verificação</p>
            <p className="text-gray-800 font-semibold">
              {formatDate(result.dados_publicos.data_verificacao)}
            </p>
          </div>
        </div>
      )}

      {/* Hash do Documento */}
      <div className="bg-white rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-gray-600 text-xs font-semibold">Hash SHA-256</p>
          <button
            onClick={handleCopyHash}
            className="flex items-center gap-1 text-xs text-primary hover:text-blue-900 transition"
          >
            {copied ? (
              <>
                <Check size={14} />
                Copiado
              </>
            ) : (
              <>
                <Copy size={14} />
                Copiar
              </>
            )}
          </button>
        </div>
        <p className="font-mono text-xs text-gray-700 break-all">
          {hash}
        </p>
      </div>

      {/* Aviso de Revogação */}
      {isVerified && result.dados_publicos?.revogado && (
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="text-warning flex-shrink-0" size={20} />
          <div>
            <p className="font-semibold text-warning mb-1">Documento Revogado</p>
            <p className="text-sm text-gray-700">
              Este documento foi revogado e não é mais válido. Entre em contacto com a instituição emissora para mais informações.
            </p>
          </div>
        </div>
      )}
    </div>
  );
      }
