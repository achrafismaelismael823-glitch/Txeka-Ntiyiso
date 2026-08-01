import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { endpoints } from '../services/api';
import { QRCodeSVG } from 'qrcode.react';
import {
  Search, ShieldCheck, AlertTriangle, CheckCircle2, XCircle,
  Loader2, FileText, Building2, Calendar, Hash, Copy, Check, Globe
} from 'lucide-react';

const VerifyPage = () => {
  const { hash: urlHash } = useParams();
  const navigate = useNavigate();
  const [hash, setHash] = useState(urlHash || '');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  // Guarda o hash que foi efetivamente verificado com sucesso pela API
  const [verifiedHash, setVerifiedHash] = useState(null);

  const handleCopy = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Sempre que o utilizador edita o hash, invalida o resultado anterior imediatamente
  const handleHashChange = (value) => {
    setHash(value);
    // Se o hash mudou em relação ao verificado, limpa tudo
    if (verifiedHash && value.trim() !== verifiedHash) {
      setResult(null);
      setError(null);
      setVerifiedHash(null);
    }
  };

  const handleVerify = async (e) => {
    e?.preventDefault();
    if (!hash.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setVerifiedHash(null);

    try {
      const cleanHash = hash.trim();
      const { data } = await endpoints.verify.public(cleanHash);

      // A API retorna { status: "VALID" | "INVALID", dados_publicos: object | null }
      if (data.status === 'INVALID') {
        setVerifiedHash(null);
        setError('Documento não encontrado ou inválido');
      } else if (data.status === 'VALID' && data.dados_publicos) {
        setResult(data);
        setVerifiedHash(cleanHash);
        if (!urlHash) navigate(`/verify/${cleanHash}`, { replace: true });
      } else {
        setVerifiedHash(null);
        setError('Resposta inesperada do servidor');
      }
    } catch (err) {
      setVerifiedHash(null);
      setError(err.normalizedMessage || 'Erro de comunicação com o servidor');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (urlHash) {
      const verifyOnLoad = async () => {
        setLoading(true);
        setError(null);
        setResult(null);
        setVerifiedHash(null);
        try {
          const cleanHash = urlHash.trim();
          const { data } = await endpoints.verify.public(cleanHash);

          if (data.status === 'INVALID') {
            setError('Documento não encontrado ou inválido');
          } else if (data.status === 'VALID' && data.dados_publicos) {
            setResult(data);
            setVerifiedHash(cleanHash);
          } else {
            setError('Resposta inesperada do servidor');
          }
        } catch (err) {
          setError(err.normalizedMessage || 'Erro de comunicação com o servidor');
        } finally {
          setLoading(false);
        }
      };
      verifyOnLoad();
    }
  }, [urlHash]);

  const d = result?.dados_publicos;
  const isStale = verifiedHash && hash.trim() !== verifiedHash;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-8 animate-fade-in">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 mx-auto">
            <ShieldCheck className="w-8 h-8 text-cyan-400" />
          </div>
          <h1 className="text-3xl font-bold text-slate-100">Verificação de Documento</h1>
          <p className="text-sm text-slate-500">
            Infraestrutura Tecnológica de Verificação da Integridade e Autenticidade Documental
          </p>
          <p className="text-[0.65rem] text-slate-600 max-w-md mx-auto leading-relaxed">
            Nenhum documento é armazenado. A validação é realizada exclusivamente através do hash criptográfico (SHA-256), preservando a confidencialidade das informações.
          </p>
        </div>

        <form onSubmit={handleVerify} className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            value={hash}
            onChange={(e) => handleHashChange(e.target.value)}
            placeholder="Insira o hash SHA-256 do documento..."
            className="w-full pl-12 pr-32 py-4 bg-white/[0.03] border border-white/[0.08] rounded-2xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/30 text-sm font-mono"
          />
          <button
            type="submit"
            disabled={loading || !hash.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl transition-all disabled:opacity-30 text-xs uppercase"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verificar'}
          </button>
        </form>

        {/* Aviso quando o hash foi alterado após verificação */}
        {isStale && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/5 border border-amber-500/15 text-amber-400 text-xs">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>O hash foi alterado. Clique em <strong>Verificar</strong> para validar o novo documento.</span>
          </div>
        )}

        {/* Estado de erro: INVALID da API ou erro de rede */}
        {error && (
          <div className="bg-slate-900/80 border border-red-500/20 rounded-2xl p-6 text-center space-y-3 animate-fade-in">
            <XCircle className="w-12 h-12 text-red-400 mx-auto" />
            <h3 className="text-lg font-bold text-red-400">Documento Inválido</h3>
            <p className="text-sm text-slate-500">{error}</p>
          </div>
        )}

        {/* Estado de sucesso: apenas quando status === "VALID" e hash não foi alterado */}
        {result && d && !isStale && (
          <div className="bg-slate-900/80 border border-emerald-500/20 rounded-2xl p-6 space-y-5 animate-fade-in">
            <div className="flex items-center gap-3 justify-center">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-emerald-400">Documento Autêntico</h3>
                <p className="text-xs text-slate-500">
                  Verificado em {new Date().toLocaleString('pt-MZ')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1">
                  <div className="flex items-center gap-2 text-[0.6rem] text-slate-500 uppercase tracking-wider">
                    <FileText className="w-3 h-3" /> Tipo
                  </div>
                  <p className="text-sm font-medium text-slate-100">
                    {d.document_type || '—'}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1">
                  <div className="flex items-center gap-2 text-[0.6rem] text-slate-500 uppercase tracking-wider">
                    <Building2 className="w-3 h-3" /> Instituição
                  </div>
                  <p className="text-sm font-medium text-slate-100">
                    {d.institution_name || d.institution_id || '—'}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1">
                  <div className="flex items-center gap-2 text-[0.6rem] text-slate-500 uppercase tracking-wider">
                    <Calendar className="w-3 h-3" /> Emitido em
                  </div>
                  <p className="text-sm font-medium text-slate-100">
                    {d.created_at ? new Date(d.created_at).toLocaleString('pt-MZ') : '—'}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1">
                  <div className="flex items-center gap-2 text-[0.6rem] text-slate-500 uppercase tracking-wider">
                    <Hash className="w-3 h-3" /> Hash
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-mono text-cyan-400 truncate">
                      {verifiedHash ? verifiedHash.substring(0, 24) + '...' : '—'}
                    </p>
                    <button
                      onClick={() => handleCopy(verifiedHash)}
                      className="text-slate-500 hover:text-slate-300 shrink-0"
                      title="Copiar hash"
                    >
                      {copied ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>
                {d.doc_id && (
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1 sm:col-span-2">
                    <div className="flex items-center gap-2 text-[0.6rem] text-slate-500 uppercase tracking-wider">
                      <Globe className="w-3 h-3" /> Doc ID
                    </div>
                    <p className="text-sm font-mono text-slate-100">{d.doc_id}</p>
                  </div>
                )}
              </div>

              <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white border border-white/[0.1]">
                <QRCodeSVG
                  value={typeof window !== 'undefined' ? window.location.href : ''}
                  size={120}
                  level="H"
                  bgColor="#ffffff"
                  fgColor="#0f172a"
                />
                <p className="mt-2 text-[0.6rem] text-slate-500 font-medium">
                  Escaneie para verificar
                </p>
              </div>
            </div>

            {d.revoked && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <div>
                  <p className="text-sm font-bold text-red-400">Documento Revogado</p>
                  <p className="text-xs text-red-400/70">
                    {d.revoked_reason || 'Revogado pela instituição emissora'}
                    {d.revoked_at && ` em ${new Date(d.revoked_at).toLocaleString('pt-MZ')}`}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyPage;
