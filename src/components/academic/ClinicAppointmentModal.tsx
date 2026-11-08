import React, { useState } from 'react';
import { X, Heart, ShieldCheck, CheckCircle2, UserCheck, Calendar } from 'lucide-react';
import { api } from '../../services/api';
import { sound } from '../../services/sound';

interface ClinicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ClinicAppointmentModal: React.FC<ClinicModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [nickname, setNickname] = useState('Discente_' + Math.floor(100 + Math.random() * 900));
  const [course, setCourse] = useState('Secretariado Executivo');
  const [shift, setShift] = useState('Noite');
  const [urgency, setUrgency] = useState('Normal');
  const [preferredDays, setPreferredDays] = useState('Terças ou Quintas à noite');
  const [reasonCategory, setReasonCategory] = useState('Ansiedade por prazos e conciliação de trabalho');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createClinicAppointment({
        studentNickname: nickname,
        course,
        shift,
        urgency,
        preferredDays,
        reasonCategory,
        notes
      });
      setSubmitted(true);
      sound.playSuccess();
      if (onSuccess) onSuccess();
    } catch {
      alert('Erro ao solicitar acolhimento');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-700 to-ufpe-burgundy text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
          >
            <X size={18} />
          </button>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1">
              <Heart size={12} className="fill-white" />
              <span>Acolhimento Gratuito</span>
            </span>
            <span className="text-xs text-rose-200">Supervisão CRP-02 / UFPE</span>
          </div>
          <h2 className="text-xl font-bold">Clínica-Escola de Psicologia</h2>
          <p className="text-xs text-rose-100 mt-1 leading-relaxed">
            Triagem para atendimento supervisionado com estudantes do 9º e 10º período de Psicologia. Um espaço acolhedor e seguro para você.
          </p>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={36} />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Solicitação Registrada!</h3>
            <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
              Sua solicitação anônima com identificador <span className="font-bold text-slate-900">{nickname}</span> foi encaminhada ao corpo docente supervisor da Clínica-Escola.
              Você receberá orientações de horário via portal com sigilo absoluto.
            </p>
            <div className="pt-2 flex justify-center">
              <button
                onClick={() => { setSubmitted(false); onClose(); }}
                className="px-6 py-2.5 rounded-xl bg-ufpe-burgundy text-white text-xs font-bold hover:bg-ufpe-dark transition shadow-md"
              >
                Entendido
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="p-3 bg-rose-50 rounded-2xl border border-rose-100 text-xs text-rose-900 flex items-start gap-2.5">
              <ShieldCheck size={20} className="shrink-0 text-rose-600 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                <strong>Sigilo Ético:</strong> Os atendimentos são realizados na clínica de psicologia e supervisionados por psicólogos com CRP ativo, garantindo acolhimento responsável e sem julgamentos.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Seu Pseudônimo de Atendimento
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Turno que frequenta a UFPE
                </label>
                <select
                  value={shift}
                  onChange={(e) => setShift(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                >
                  <option value="Manhã">Manhã</option>
                  <option value="Tarde">Tarde</option>
                  <option value="Noite">Noite</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Motivo Principal do Acolhimento
              </label>
              <select
                value={reasonCategory}
                onChange={(e) => setReasonCategory(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50"
              >
                <option value="Ansiedade e pânico por provas e prazos">Ansiedade e pânico por provas e prazos</option>
                <option value="Sobrecarga por conciliar trabalho integral e faculdade">Sobrecarga por conciliar trabalho integral e faculdade</option>
                <option value="Sentimento de solidão, isolamento ou depressão">Sentimento de solidão, isolamento ou depressão</option>
                <option value="Dúvidas sobre vocação e trancamento de curso">Dúvidas sobre vocação e trancamento de curso</option>
                <option value="Luto ou problemas pessoais familiares">Luto ou problemas pessoais familiares</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Dias e Horários de Preferência para o acolhimento
              </label>
              <input
                type="text"
                value={preferredDays}
                onChange={(e) => setPreferredDays(e.target.value)}
                placeholder="Ex: Segundas ou quartas após as 18h"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Observações ou necessidades especiais (Opcional)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Prefiro atendimento presencial no campus / online..."
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 resize-none"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Voltar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl bg-ufpe-burgundy hover:bg-ufpe-dark text-white text-xs font-bold shadow-md transition flex items-center gap-1.5"
              >
                <Heart size={14} className="fill-white" />
                <span>{submitting ? 'Enviando...' : 'Solicitar Atendimento'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
