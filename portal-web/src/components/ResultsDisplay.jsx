// src/components/ResultsDisplay.jsx
import React from 'react';
import { formatDate } from '../utils/validation';
import { CheckCircle, AlertCircle, Copy, Check, Download, Printer, Share2 } from 'lucide-react';

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

  const handleDownloadQR = () => {
    if (!result.qr_code) return;
    
    const link = document.createElement('a');
    link.href = result.qr_code;
    link.download = `qr-code-${hash.substring(0, 8)}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintQR = () => {
    if (!result.qr_code) return;
    
    const printWindow = window.open('', '', 'width=600,height=700');
    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code - Txeka Ntiyiso</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
              background: white;
            }
            .container {
              text-align: center;
              max-width: 500px;
            }
            h1 {
              color: #0B192C;
              margin-bottom: 10px;
            }
            .doc-info {
              background: #f8f9fa;
              padding: 15px;
              border-radius: 8px;
              margin-bottom: 20px;
              text-align: left;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              padding: 5px 0;
              border-bottom: 1px solid #e0e0e0;
            }
            .info-row:last-child {
              border-bottom: none;
            }
            .qr-container {
              margin: 20px 0;
              padding: 20px;
              background: white;
              border: 2px solid #00D2C4;
              border-radius: 8px;
            }
            .qr-container img {
              max-width: 300px;
              height: auto;
            }
            .footer {
              color: #666;
              font-size: 12px;
              margin-top: 20px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
            }
            @media print {
              body {
                background: white;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🔐 Txeka Ntiyiso</h1>
            <h2>Comprovante de Verificação</h2>
            
            <div class="doc-info">
              <div class="info-row">
                <strong>Documento:</strong>
                <span>${result.dados_publicos?.doc_id || 'N/A'}</span>
              </div>
              <div class="info-row">
                <strong>Instituição:</strong>
                <span>${result.dados_publicos?.instituicao || 'N/A'}</span>
              </div>
              <div class="info-row">
                <strong>Status:</strong>
                <span>${result.dados_publicos?.revogado ? '⚠️ Revogado' : '✓ Válido'}</span>
              </div>
              <div class="info-row">
                <strong>Data:</strong>
                <span>${formatDate(result.dados_publicos?.data_verificacao)}</span>
              </div>
            </div>

            <div class="qr-container">
              <p><strong>Código QR de Verificação</strong></p>
              <img src="${result.qr_code}" alt="QR Code" />
            </div>

            <div class="footer">
              <p>Escaneie este código QR para verificar a autenticidade do documento.</p>
              <p>Hash: ${hash.substring(0, 16)}...</p>
              <p>© Txeka Ntiyiso - Verificação Digital de Documentos</p>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleShareWhatsApp = () => {
    if (!result.qr_code) return;
    
    const text = encodeURIComponent(
      `✓ Documento Verificado no Txeka Ntiyiso\n\n` +
      `Documento: ${result.dados_publicos?.doc_id}\n` +
      `Instituição: ${result.dados_publicos?.instituicao}\n` +
      `Status: ${result.dados_publicos?.revogado ? 'Revogado' : 'Válido'}\n\n` +
      `Verifique em: https://txeka-ntiyiso-portal.onrender.com`
    );
    
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleShareLink = () => {
    const shareUrl = `${window.location.origin}?verify=${hash}`;
    navigator.clipboard.writeText(shareUrl);
    alert('Link de partilha copiado para clipboard!');
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
              ? 'O documento foi verificado com sucesso na base de dados de Txeka Ntiyiso'
              : 'O documento com este hash não foi encontrado no sistema'
            }
          </p>
        </div>
      </div>

      {/* QR Code Display (SE ENCONTRADO) */}
      {isVerified && result.qr_code && (
        <div className="mb-6 bg-white rounded-lg p-6 border-2 border-cyan-200 text-center">
          <p className="text-gray-600 text-sm font-semibold mb-4">
            🔐 Código QR de Verificação
          </p>
          <img 
            src={result.qr_code} 
            alt="QR Code do Documento" 
            className="mx-auto mb-4 w-48 h-48 border-2 border-gray-300 rounded-lg p-2 bg-white"
          />
          <p className="text-gray-600 text-xs mb-4">
            Escaneie o código QR para compartilhar esta verificação
          </p>
          
          {/* Botões de Ação do QR Code */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleDownloadQR}
              className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg transition text-sm font-semibold"
            >
              <Download size={16} />
              Download
            </button>
            <button
              onClick={handlePrintQR}
              className="flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded-lg transition text-sm font-semibold"
            >
              <Printer size={16} />
              Imprimir
            </button>
            <button
              onClick={handleShareWhatsApp}
              className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg transition text-sm font-semibold col-span-2"
            >
              <Share2 size={16} />
              Compartilhar WhatsApp
            </button>
          </div>
        </div>
      )}

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

      {/* Botão de Compartilhamento de Link */}
      {isVerified && (
        <button
          onClick={handleShareLink}
          className="mt-4 w-full bg-cyan-500 hover:bg-cyan-600 text-white py-2 rounded-lg transition font-semibold text-sm flex items-center justify-center gap-2"
        >
          <Share2 size={16} />
          Copiar Link de Partilha
        </button>
      )}

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
