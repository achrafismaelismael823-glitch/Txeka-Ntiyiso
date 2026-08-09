import { useState, useContext } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { NotificationContext } from '../contexts/NotificationContext';
import {
  Settings, Lock, Eye, EyeOff, Save, AlertTriangle, CreditCard, FileText, Calendar, Ban,
  ShieldCheck, RefreshCw, User, Building2, Mail,
  CheckCircle2, XCircle
} from 'lucide-react';

const SettingsPage = () => {
  const { user, isAdmin, isInstitution } = useAuth();
  const { notify } = useContext(NotificationContext);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      notify('As passwords não coincidem', 'error');
      return;
    }
    if (newPassword.length < 8) {
      notify('A password deve ter pelo menos 8 caracteres', 'error');
      return;
    }
    try {
      setLoading(true);
      await api.post('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      notify('Password alterada com sucesso', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      notify(err.normalizedMessage || 'Erro ao alterar password', 'error');
    } finally {
      setLoading(false);
    }
  };

  const SectionCard = ({ icon: Icon, title, children, className = '' }) => (
    <div className={`p-5 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/[0.06] space-y-4 ${className}`}>
      <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider">
        <Icon className="w-3.5 h-3.5" /> {title}
      </div>
      {children}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Configurações</h1>
        <p className="text-xs text-slate-500 mt-1">Gerir conta e segurança</p>
      </div>

      {/* Profile Info */}
      <SectionCard icon={User} title="Perfil">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1">
            <span className="text-[0.6rem] text-slate-500 uppercase tracking-wider">Email</span>
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-slate-500" />
              <p className="text-sm text-slate-100">{user?.email || user?.contact_email || '—'}</p>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1">
            <span className="text-[0.6rem] text-slate-500 uppercase tracking-wider">Tipo de Conta</span>
            <div className="flex items-center gap-2">
              {isAdmin ? <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> : <Building2 className="w-3.5 h-3.5 text-cyan-400" />}
              <p className="text-sm text-slate-100">{isAdmin ? 'Super Admin' : 'Instituição'}</p>
            </div>
          </div>
{isInstitution && (
            <>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1">
                <span className="text-[0.6rem] text-slate-500 uppercase tracking-wider">Instituição</span>
                <p className="text-sm font-mono text-cyan-400">{user?.institution || user?.id || '—'}</p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1">
                <span className="text-[0.6rem] text-slate-500 uppercase tracking-wider">Plano</span>
                <div className="flex items-center gap-2">
                  <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                  <p className="text-sm text-slate-100">{user?.subscription_plan || '—'}</p>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1">
                <span className="text-[0.6rem] text-slate-500 uppercase tracking-wider">Créditos</span>
                <div className="flex items-center gap-2">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                  <p className="text-sm text-slate-100">{user?.credits ?? '—'}</p>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1">
                <span className="text-[0.6rem] text-slate-500 uppercase tracking-wider">Docs/Mês</span>
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  <p className="text-sm text-slate-100">{user?.docs_emitted_month ?? '—'}</p>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1">
                <span className="text-[0.6rem] text-slate-500 uppercase tracking-wider">Estado</span>
                <div className="flex items-center gap-2">
                  {user?.status === 'active' ? (
                    <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /><p className="text-sm text-emerald-400">Activa</p></>
                  ) : (
                    <><Ban className="w-3.5 h-3.5 text-red-400" /><p className="text-sm text-red-400">Inactiva</p></>
                  )}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1">
                <span className="text-[0.6rem] text-slate-500 uppercase tracking-wider">Aprovação</span>
                <div className="flex items-center gap-2">
                  {user?.approved ? (
                    <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /><p className="text-sm text-emerald-400">Aprovada</p></>
                  ) : (
                    <><AlertTriangle className="w-3.5 h-3.5 text-amber-400" /><p className="text-sm text-amber-400">Pendente</p></>
                  )}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1 sm:col-span-2">
                <span className="text-[0.6rem] text-slate-500 uppercase tracking-wider">Criada em</span>
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <p className="text-sm text-slate-100">{user?.created_at ? new Date(user.created_at).toLocaleString('pt-MZ') : '—'}</p>
                </div>
              </div>
            </>
          )}
          )}
        </div>
      </SectionCard>

{/* Change Password — APENAS ADMIN pode alterar a própria password */}
      {isAdmin && (
        <SectionCard icon={Lock} title="Alterar Password">
          <form onSubmit={handleChangePassword} className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs text-slate-500">Password Actual</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500/30 text-sm pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-500">Nova Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500/30 text-sm"
                minLength={8}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-500">Confirmar Nova Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500/30 text-sm"
                required
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-red-400 flex items-center gap-1">
                  <XCircle className="w-3 h-3" /> As passwords não coincidem
                </p>
              )}
              {confirmPassword && newPassword === confirmPassword && newPassword.length >= 8 && (
                <p className="text-xs text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Passwords coincidem
                </p>
              )}
            </div>

            <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-400/90">
                A password deve ter pelo menos 8 caracteres. Recomenda-se combinar letras maiúsculas, minúsculas, números e símbolos.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !currentPassword || !newPassword || newPassword !== confirmPassword}
              className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-30 text-slate-950 font-bold rounded-xl transition-all text-sm uppercase tracking-wider flex items-center justify-center gap-2"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Alterar Password</>}
            </button>
          </form>
        </SectionCard>
      )}

      {/* Dados da Instituição — INSTITUIÇÃO apenas visualiza */}
      {isInstitution && (
        <SectionCard icon={Building2} title="Dados da Instituição">
          <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/15 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-400/90">
              Estes dados são geridos pelo administrador do sistema. Para alterações, contacte o suporte.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1">
              <span className="text-[0.6rem] text-slate-500 uppercase tracking-wider">Nome</span>
              <p className="text-sm text-slate-100">{user?.name || '—'}</p>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1">
              <span className="text-[0.6rem] text-slate-500 uppercase tracking-wider">Email de Contacto</span>
              <p className="text-sm text-slate-100">{user?.contact_email || user?.email || '—'}</p>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1">
              <span className="text-[0.6rem] text-slate-500 uppercase tracking-wider">ID da Instituição</span>
              <p className="text-sm font-mono text-cyan-400">{user?.institution || user?.id || '—'}</p>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1">
              <span className="text-[0.6rem] text-slate-500 uppercase tracking-wider">Plano de Subscrição</span>
              <p className="text-sm text-slate-100">{user?.subscription_plan || '—'}</p>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1">
              <span className="text-[0.6rem] text-slate-500 uppercase tracking-wider">Créditos Disponíveis</span>
              <p className="text-sm text-emerald-400 font-medium">{user?.credits ?? '—'}</p>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1">
              <span className="text-[0.6rem] text-slate-500 uppercase tracking-wider">Docs Emitidos (Mês)</span>
              <p className="text-sm text-cyan-400 font-medium">{user?.docs_emitted_month ?? '—'}</p>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1">
              <span className="text-[0.6rem] text-slate-500 uppercase tracking-wider">Estado da Conta</span>
              <div className="flex items-center gap-2">
                {user?.status === 'active' ? (
                  <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /><p className="text-sm text-emerald-400">Activa</p></>
                ) : (
                  <><Ban className="w-3.5 h-3.5 text-red-400" /><p className="text-sm text-red-400">Inactiva</p></>
                )}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1">
              <span className="text-[0.6rem] text-slate-500 uppercase tracking-wider">Aprovação</span>
              <div className="flex items-center gap-2">
                {user?.approved ? (
                  <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /><p className="text-sm text-emerald-400">Aprovada</p></>
                ) : (
                  <><AlertTriangle className="w-3.5 h-3.5 text-amber-400" /><p className="text-sm text-amber-400">Pendente</p></>
                )}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1 sm:col-span-2">
              <span className="text-[0.6rem] text-slate-500 uppercase tracking-wider">Data de Criação</span>
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <p className="text-sm text-slate-100">{user?.created_at ? new Date(user.created_at).toLocaleString('pt-MZ') : '—'}</p>
              </div>
            </div>
          </div>
        </SectionCard>
      )}
      <SectionCard icon={ShieldCheck} title="Segurança da Conta">
        <div className="space-y-2 text-xs text-slate-500">
          <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02]">
            <span>Autenticação</span>
            <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> JWT Bearer</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02]">
            <span>Sessão</span>
            <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Activa</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02]">
            <span>Hash dos Documentos</span>
            <span className="text-cyan-400 flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> SHA-256</span>
          </div>
        </div>
      </SectionCard>
    </div>
  );
};

export default SettingsPage;
