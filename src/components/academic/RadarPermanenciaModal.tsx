import React, { useState } from 'react';
import { X, Sparkles, HeartHandshake, ShieldCheck, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../../services/api';
import { sound } from '../../services/sound';

interface RadarPermanenciaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const RadarPermanenciaModal: React.FC<RadarPermanenciaModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [mood, setMood] = useState<'focado' | 'ansioso' | 'exausto' | 'disposto'>('focado');
  const [academicChallenge, setAcademicChallenge] = useState('');
  const [financialChallenge, setFinancialChallenge] = useState('');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.submitPermanencia({ mood, notes, academicChallenge, financialChallenge });
      setSubmitted(true);
      sound.playSuccess();
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 }
      });
      if (onSuccess) onSuccess();
    } catch {
      alert('Erro ao enviar diagnóstico');
    } finally {
      setSubmitting(false);
    }
  };

  const moods = [
    { id: 'focado', label: '🎯 Focado', desc: 'Acompanhando as aulas com bom ritmo' },
    { id: 'ansioso', label: '🤯 Ansioso', desc: 'Preocupado com prazos, provas ou notas' },
    { id: 'exausto', label: '😴 Exausto', desc: 'Cansaço físico por conciliar trabalho e estudo' },
    { id: 'disposto', label: '☕ Disposto', desc: 'Animado e buscando novos projetos' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-ufpe-burgundy to-rose-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
          >
            <X size={18} />
          </button>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 rounded-full bg-rose-400/30 text-rose-100 text-xs font-bold uppercase tracking-wider">
              Diagnóstico Anônimo
            </span>
            <div className="flex items-center gap-1 text-xs text-rose-200">
              <ShieldCheck size={14} />
              <span>Protegido pela LGPD</span>
            </div>
          </div>
          <h2 className="text-xl font-bold">Radar de Permanência Estudantil</h2>
          <p className="text-xs text-rose-100 mt-1">
            Suas respostas ajudam a UFPE a direcionar apoios, bolsas e medidas para prevenir a evasão.
          </p>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={36} />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Obrigado pela sua contribuição!</h3>
            <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
              Seus dados foram agregados de forma totalmente anônima. Identificamos seus desafios e a equipe de apoio da UFPE já foi sinalizada preventivamente.
            </p>
            <div className="pt-4 flex gap-3 justify-center">
              <button
                onClick={() => { setSubmitted(false); onClose(); }}
                className="px-5 py-2.5 rounded-xl bg-ufpe-burgundy text-white text-xs font-bold hover:bg-ufpe-dark transition shadow-md"
              >
                Concluir
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Mood selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Como você está se sentindo nesta semana?
              </label>
              <div className="grid grid-cols-2 gap-2">
                {moods.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => { setMood(m.id as any); sound.playPop(); }}
                    className={`p-3 rounded-xl border text-left transition ${
                      mood === m.id
                        ? 'border-ufpe-burgundy bg-rose-50/70 text-ufpe-burgundy ring-2 ring-ufpe-burgundy/20 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    <span className="font-bold text-sm block">{m.label}</span>
                    <span className="text-[10px] text-slate-500 leading-tight block mt-0.5">{m.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Academic challenge */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Qual sua maior dificuldade acadêmica recente?
              </label>
              <select
                value={academicChallenge}
                onChange={(e) => setAcademicChallenge(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-ufpe-burgundy outline-hidden"
              >
                <option value="">Selecione uma opção...</option>
                <option value="conciliar-trabalho">Conciliar horário de trabalho com aulas/provas</option>
                <option value="conteudo-dificil">Dificuldade em disciplinas específicas (cálculo, estatística etc.)</option>
                <option value="deslocamento-transporte">Transporte e deslocamento até o Campus Recife</option>
                <option value="horas-complementares">Falta de horas complementares ou atividades de extensão</option>
                <option value="isolamento">Sentimento de não pertencimento ou dificuldade de fazer amigos</option>
                <option value="nenhuma">Nenhuma dificuldade significativa</option>
              </select>
            </div>

            {/* Financial challenge */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Necessita de apoio socioeconômico neste semestre?
              </label>
              <select
                value={financialChallenge}
                onChange={(e) => setFinancialChallenge(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-ufpe-burgundy outline-hidden"
              >
                <option value="">Selecione...</option>
                <option value="auxilio-permanencia">Sim, gostaria de me candidatar ao Auxílio Permanência (R$ 550,00)</option>
                <option value="restaurante-universitario">Preciso de isenção no Restaurante Universitário (RU)</option>
                <option value="bolsa-pesquisa">Procuro bolsa remunerada de Iniciação Científica ou Extensão</option>
                <option value="estagio-remunerado">Busco estágio com bolsa a partir de R$ 1.200,00</option>
                <option value="nao">No momento não necessito</option>
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Algum desabafo ou sugestão para a Coordenação? (Opcional & Anônimo)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Ex: Gostaria de mais turmas de matérias teóricas no turno da noite..."
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-ufpe-burgundy outline-hidden resize-none"
              />
            </div>

            {/* Footer Buttons */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl bg-ufpe-burgundy hover:bg-ufpe-dark text-white text-xs font-bold shadow-md shadow-rose-950/20 transition flex items-center gap-1.5"
              >
                <Sparkles size={14} />
                <span>{submitting ? 'Enviando...' : 'Enviar Diagnóstico'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
