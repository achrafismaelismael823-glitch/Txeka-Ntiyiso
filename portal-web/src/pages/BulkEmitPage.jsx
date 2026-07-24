// Emissão em lote B2B/B2G: Drop múltiplos PDFs → Chunking 10 em 10 → Base64 transiente → Progresso visual
// Pilar Pipeline Técnico: memória do browser, nunca estoura, respeita o contrato /api/v1/certify/bulk

import React, { useState, useRef, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { emitBulk } from '../services/api';
import { calculateSHA256, fileToBase64, chunkArray } from '../utils/crypto';
import {
  Upload,
  FileText,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  Layers,
  Zap,
  Trash2,
  Play,
  RotateCcw
} from 'lucide-react';

const CHUNK_SIZE = 10;

export default function BulkEmitPage() {
  const { institutionId } = useAuth();
  const [files, setFiles] = useState([]);
  const [docType, setDocType] = useState('DUAT');
  const [processing, setProcessing] = useState(false);
  const [currentChunk, setCurrentChunk] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);
  const [results, setResults] = useState([]);
  const [errors, setErrors] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  const docTypes = ['DUAT', 'CERTIDÃO', 'DIPLOMA', 'LICENÇA', 'CONTRATO', 'OUTRO'];

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const dropped = Array.from(e.dataTransfer.files).filter((f) => f.type === 'application/pdf');
    addFiles(dropped);
  };

  const handleFileSelect = (e) => {
    const selected = Array.from(e.target.files).filter((f) => f.type === 'application/pdf');
    addFiles(selected);
  };

  const addFiles = (newFiles) => {
    const enriched = newFiles.map((f, idx) => ({
      id: `${f.name}-${Date.now()}-${idx}`,
      file: f,
      name: f.name,
      size: f.size,
      status: 'pending', // pending | hashing | ready | uploading | success | error
      hash: null,
      error: null,
    }));
    setFiles((prev) => [...prev, ...enriched]);
    // Hash em background
    enriched.forEach((item) => hashFile(item));
  };

  const hashFile = async (item) => {
    setFiles((prev) => prev.map((f) => (f.id === item.id ? { ...f, status: 'hashing' } : f)));
    try {
      const hash = await calculateSHA256(item.file);
      setFiles((prev) => prev.map((f) => (f.id === item.id ? { ...f, status: 'ready', hash } : f)));
    } catch {
      setFiles((prev) => prev.map((f) => (f.id === item.id ? { ...f, status: 'error', error: 'Falha no hash' } : f)));
    }
  };

  const removeFile = (id) => setFiles((prev) => prev.filter((f) => f.id !== id));

  const clearAll = () => {
    if (!processing && window.confirm('Limpar todos os ficheiros?')) {
      setFiles([]);
      setResults([]);
      setErrors([]);
    }
  };

  const processChunks = async () => {
    const readyFiles = files.filter((f) => f.status === 'ready');
    if (readyFiles.length === 0) return;

    setProcessing(true);
    setResults([]);
    setErrors([]);

    const chunks = chunkArray(readyFiles, CHUNK_SIZE);
    setTotalChunks(chunks.length);
    const allResults = [];
    const allErrors = [];

    for (let i = 0; i < chunks.length; i++) {
      setCurrentChunk(i + 1);
      const chunk = chunks[i];

      // Converter para Base64 transiente (memória volátil)
      const documents = await Promise.all(
        chunk.map(async (item) => ({
          document_type: docType,
          file_name: item.name,
          content: await fileToBase64(item.file),
        }))
      );

      try {
        const response = await emitBulk({
          institution_id: institutionId,
          documents,
        });
        allResults.push(...(response.data?.results || []));
        setFiles((prev) =>
          prev.map((f) => (chunk.find((c) => c.id === f.id) ? { ...f, status: 'success' } : f))
        );
      } catch (err) {
        const msg = err.userMessage || 'Erro no lote';
        allErrors.push({ chunk: i + 1, error: msg });
        setFiles((prev) =>
          prev.map((f) => (chunk.find((c) => c.id === f.id) ? { ...f, status: 'error', error: msg } : f))
        );
      }

      // Limpar Base64 da memória após envio
      documents.forEach((d) => (d.content = null));
    }

    setResults(allResults);
    setErrors(allErrors);
    setProcessing(false);
  };

  const progressPercent = totalChunks > 0 ? Math.round((currentChunk / totalChunks) * 100) : 0;
  const readyCount = files.filter((f) => f.status === 'ready').length;
  const successCount = files.filter((f) => f.status === 'success').length;
  const errorCount = files.filter((f) => f.status === 'error').length;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#0B192C] flex items-center gap-2">
          <Layers className="w-6 h-6 text-[#00D2C4]" /> Emissão em Lote
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          Chunking controlado de {CHUNK_SIZE} em {CHUNK_SIZE} • Base64 transiente • Zero retenção
        </p>
      </div>

      {/* Stats Bar */}
      {files.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total', value: files.length, color: 'text-[#0B192C]' },
            { label: 'Prontos', value: readyCount, color: 'text-emerald-600' },
            { label: 'Emitidos', value: successCount, color: 'text-blue-600' },
            { label: 'Erros', value: errorCount, color: 'text-rose-600' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-3 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-500 font-semibold">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !processing && inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all ${
          dragActive ? 'border-[#00D2C4] bg-[#00D2C4]/5' : 'border-slate-300 bg-white'
        } ${processing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-slate-400'}`}
      >
        <input ref={inputRef} type="file" accept=".pdf" multiple onChange={handleFileSelect} className="hidden" disabled={processing} />
        <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <Upload className="w-7 h-7 text-slate-400" />
        </div>
        <p className="text-sm font-semibold text-[#0B192C]">Arraste múltiplos PDFs ou clique para seleccionar</p>
        <p className="text-xs text-slate-400 mt-1">Máx. 50MB cada • Chunking automático de {CHUNK_SIZE}</p>
      </div>

      {/* Tipo de Documento */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {docTypes.map((type) => (
            <button
              key={type}
              onClick={() => setDocType(type)}
              disabled={processing}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition border-2 ${
                docType === type
                  ? 'border-[#00D2C4] bg-[#00D2C4]/10 text-[#0B192C]'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-slate-100">
            <p className="text-sm font-bold text-[#0B192C]">Fila de Processamento</p>
            <button onClick={clearAll} disabled={processing} className="text-xs text-rose-500 hover:text-rose-700 font-semibold flex items-center gap-1 transition">
              <Trash2 className="w-3.5 h-3.5" /> Limpar
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {files.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition">
                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#0B192C] truncate">{item.name}</p>
                  <p className="text-xs text-slate-400">{(item.size / 1024).toFixed(1)} KB</p>
                </div>
                <div className="flex items-center gap-2">
                  {item.status === 'hashing' && <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />}
                  {item.status === 'ready' && <div className="w-2 h-2 bg-emerald-500 rounded-full" />}
                  {item.status === 'uploading' && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
                  {item.status === 'success' && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                  {item.status === 'error' && <AlertCircle className="w-4 h-4 text-rose-500" title={item.error} />}
                  {!processing && (
                    <button onClick={() => removeFile(item.id)} className="p-1 hover:bg-rose-50 text-slate-300 hover:text-rose-500 rounded transition">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progresso */}
      {processing && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#00D2C4] animate-pulse" />
              <span className="text-sm font-bold text-[#0B192C]">A processar lote {currentChunk} de {totalChunks}</span>
            </div>
            <span className="text-sm font-bold text-[#00D2C4]">{progressPercent}%</span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#00D2C4] rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-2">Base64 transiente • Memória volátil • Sem retenção no servidor</p>
        </div>
      )}

      {/* Ações */}
      {files.length > 0 && !processing && (
        <button
          onClick={processChunks}
          disabled={readyCount === 0}
          className="w-full bg-[#0B192C] hover:bg-slate-800 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition flex items-center justify-center gap-2 shadow-lg"
        >
          <Play className="w-5 h-5" /> Processar {readyCount} Documento{readyCount !== 1 ? 's' : ''}
        </button>
      )}

      {/* Resultados Finais */}
      {!processing && (results.length > 0 || errors.length > 0) && (
        <div className="space-y-3">
          {results.length > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <p className="text-sm text-emerald-800 font-semibold">{results.length} documento(s) emitido(s) com sucesso.</p>
            </div>
          )}
          {errors.length > 0 && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-rose-600" />
                <p className="text-sm font-bold text-rose-800">{errors.length} erro(s) no processamento</p>
              </div>
              {errors.map((e, i) => (
                <p key={i} className="text-xs text-rose-600 ml-7">Lote {e.chunk}: {e.error}</p>
              ))}
            </div>
          )}
          <button
            onClick={() => { setFiles([]); setResults([]); setErrors([]); setCurrentChunk(0); setTotalChunks(0); }}
            className="w-full py-3 border-2 border-slate-200 hover:border-[#00D2C4] text-slate-600 hover:text-[#0B192C] font-semibold rounded-xl transition flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" /> Novo Lote
          </button>
        </div>
      )}
    </div>
  );
}

