import React, { useState } from 'react';
import { X, ShieldAlert, CheckCircle2, Copy, Search, Send, FileText } from 'lucide-react';
import { api } from '../../services/api';
import { sound } from '../../services/sound';
import { Ticket } from '../../types';

interface OmbudsmanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTicketCreated?: () => void;
}

export const OmbudsmanModal: React.FC<OmbudsmanModalProps> = ({ isOpen, onClose, onTicketCreated }) => {
  const [activeTab, setActiveTab] = useState<'create' | 'track'>('create');
  const [nickname, setNickname] = useState('Estudante_' + Math.floor(100 + Math.random() * 900));
  const [course, setCourse] = useState('Secretariado Executivo');
  const [category, setCategory] = useState('Infraestrutura & Salas');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'Baixa' | 'Média' | 'Alta'>('Média');
  
  const [createdTicket, setCreatedTicket] = useState<Ticket | null>(null);
  const [trackingId, setTrackingId] = useState('');
  const [trackedTicket, setTrackedTicket] = useState<Ticket | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !description) return;
    setSubmitting(true);
    try {
      const ticket = await api.createTicket({
        studentNickname: nickname,
        course,
        category,
        subject,
        description,
        priority
      });
      setCreatedTicket(ticket);
      sound.playSuccess();
      if (onTicketCreated) onTicketCreated();
    } catch {
      alert('Erro ao registrar manifestação');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTrack = async () => {
    if (!trackingId.trim()) return;
    try {
      const allTickets = await api.getTickets();
      const match = allTickets.find(t => t.id.toLowerCase() === trackingId.trim().toLowerCase());
      if (match) {
        setTrackedTicket(match);
        setNotFound(false);
      } else {
        setTrackedTicket(null);
        setNotFound(true);
      }
    } catch {
      alert('Erro ao consultar protocolo');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
          >
            <X size={18} />
          </button>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 rounded-full bg-rose-500/30 text-rose-300 text-xs font-bold uppercase tracking-wider">
              Canal Seguro • Anonimato Garantido
            </span>
          </div>
          <h2 className="text-xl font-bold">Da Reclamação à Solução</h2>
          <p className="text-xs text-slate-300 mt-1">
            Espaço confidencial para registrar sugestões, queixas de disciplinas e demandas sem exposição de identidade.
          </p>

          {/* Toggle Tabs */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setActiveTab('create')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'create' ? 'bg-ufpe-burgundy text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Nova Manifestação
            </button>
            <button
              onClick={() => setActiveTab('track')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'track' ? 'bg-ufpe-burgundy text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Consultar Protocolo
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'create' ? (
            createdTicket ? (
              <div className="text-center space-y-4 py-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 size={36} />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Manifestação Protocolada!</h3>
                <p className="text-xs text-slate-600 max-w-sm mx-auto">
                  Sua identidade está segura sob o pseudônimo <span className="font-bold text-slate-900">{createdTicket.studentNickname}</span>. Guarde o protocolo para acompanhar:
                </p>
                <div className="bg-slate-100 p-3 rounded-xl flex items-center justify-between max-w-xs mx-auto border border-slate-200">
                  <span className="font-mono font-bold text-sm text-ufpe-burgundy">{createdTicket.id}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(createdTicket.id);
                      sound.playPop();
                      alert('Protocolo copiado!');
                    }}
                    className="p-1 text-slate-500 hover:text-slate-800"
                    title="Copiar"
                  >
                    <Copy size={16} />
                  </button>
                </div>
                <button
                  onClick={() => { setCreatedTicket(null); onClose(); }}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition shadow-md"
                >
                  Concluir
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Pseudônimo / Nickname Seguro
                    </label>
                    <input
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono text-slate-700"
                    />
                    <span className="text-[10px] text-slate-400">Nunca revela seu nome real ou CPF</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Curso de Origem
                    </label>
                    <select
                      value={course}
                      onChange={(e) => setCourse(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                    >
                      <option value="Secretariado Executivo">Secretariado Executivo</option>
                      <option value="Ciência da Computação">Ciência da Computação</option>
                      <option value="Psicologia">Psicologia</option>
                      <option value="Administração">Administração</option>
                      <option value="Outro Curso">Outro Curso da UFPE</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Categoria da Demanda
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                    >
                      <option value="Infraestrutura & Salas">Infraestrutura & Salas</option>
                      <option value="Docência & Avaliações">Docência & Avaliações</option>
                      <option value="Matrícula e Grade">Matrícula e Grade</option>
                      <option value="Transporte e Segurança">Transporte e Segurança</option>
                      <option value="Elogio ou Sugestão">Elogio ou Sugestão</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Prioridade
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as any)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                    >
                      <option value="Baixa">Baixa (Sugestão contínua)</option>
                      <option value="Média">Média (Impacto no semestre)</option>
                      <option value="Alta">Alta (Urgência ou prejuízo grave)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Assunto Resumido
                  </label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Ex: Falta de tomadas para notebooks na sala 202 do CCSA"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-ufpe-burgundy"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Relato Detalhado
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descreva o problema com clareza. Evite citar nomes pessoais para manter o foco na melhoria do processo..."
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-ufpe-burgundy resize-none"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Fechar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md transition flex items-center gap-1.5"
                  >
                    <Send size={14} />
                    <span>{submitting ? 'Gerando Protocolo...' : 'Registrar com Segurança'}</span>
                  </button>
                </div>
              </form>
            )
          ) : (
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                  placeholder="Digite o código (ex: FM-2026-UFPE-0492)"
                  className="flex-1 text-xs p-2.5 rounded-xl border border-slate-200 font-mono"
                />
                <button
                  type="button"
                  onClick={handleTrack}
                  className="px-4 py-2.5 rounded-xl bg-ufpe-burgundy text-white text-xs font-bold hover:bg-ufpe-dark flex items-center gap-1.5"
                >
                  <Search size={14} />
                  <span>Buscar</span>
                </button>
              </div>

              {notFound && (
                <div className="p-4 bg-rose-50 text-rose-700 rounded-xl text-xs">
                  Nenhum registro encontrado com esse protocolo. Verifique o código digitado.
                </div>
              )}

              {trackedTicket && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-ufpe-burgundy">{trackedTicket.id}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      trackedTicket.status === 'Resolvido' 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {trackedTicket.status}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">{trackedTicket.subject}</h4>
                  <p className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
                    "{trackedTicket.description}"
                  </p>
                  <div className="text-[11px] text-slate-500 space-y-1">
                    <div><strong>Departamento:</strong> {trackedTicket.department}</div>
                    <div><strong>Última atualização:</strong> {new Date(trackedTicket.updatedAt).toLocaleDateString('pt-BR')}</div>
                  </div>
                  {trackedTicket.response && (
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900">
                      <strong>Parecer Oficial da Secretaria:</strong>
                      <p className="mt-1">{trackedTicket.response}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
