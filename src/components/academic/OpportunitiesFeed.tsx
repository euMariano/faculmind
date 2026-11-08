import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Briefcase, 
  Users, 
  Calendar, 
  Coins, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  Sparkles, 
  Send, 
  X,
  Filter
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Opportunity } from '../../types';
import { api } from '../../services/api';
import { sound } from '../../services/sound';

export const OpportunitiesFeed: React.FC = () => {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [category, setCategory] = useState<string>('Todos');
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Application Modal state
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
  const [applicantName, setApplicantName] = useState('Mariano Ferreira');
  const [applicantCourse, setApplicantCourse] = useState('Secretariado Executivo');
  const [applicantEmail, setApplicantEmail] = useState('mariano.ferreira@ufpe.br');
  const [appliedSuccess, setAppliedSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getOpportunities(category, search);
      setOpportunities(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [category]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOpp) return;
    setSubmitting(true);
    try {
      await api.applyOpportunity(selectedOpp.id, {
        studentName: applicantName,
        studentCourse: applicantCourse,
        studentEmail: applicantEmail
      });
      setAppliedSuccess(true);
      sound.playSuccess();
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.6 }
      });
      loadData();
    } catch {
      alert('Erro ao enviar candidatura');
    } finally {
      setSubmitting(false);
    }
  };

  const categories = ['Todos', 'Estágios', 'Grupos', 'Eventos', 'Bolsas'];

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Feed Header - Matches Gemini_Generated_Image_p3h7vop3h7vop3h7(1).jpg */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🌿</span>
              <h2 className="text-2xl font-extrabold text-slate-900">Olá, estudante!</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Oportunidades de estágio, grupos de estudo e eventos validados para sua formação.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
            <Sparkles size={14} />
            <span>Radar Inteligente Ativo</span>
          </div>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar oportunidades, grupos, eventos, bolsas..."
            className="w-full text-xs pl-10 pr-24 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-ufpe-burgundy focus:ring-1 focus:ring-ufpe-burgundy outline-hidden transition"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-ufpe-burgundy hover:bg-ufpe-dark text-white text-xs font-bold transition"
          >
            Buscar
          </button>
        </form>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => { setCategory(cat); sound.playPop(); }}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap ${
                category === cat
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Opportunities List */}
      <div className="space-y-3.5">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">
            Carregando oportunidades recomendadas...
          </div>
        ) : opportunities.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-xs text-slate-500">
            Nenhuma oportunidade encontrada para esses filtros.
          </div>
        ) : (
          opportunities.map((opp) => (
            <div
              key={opp.id}
              className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-emerald-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {opp.type}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    {opp.category}
                  </span>
                  {opp.urgent && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800">
                      Urgente
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-extrabold text-base text-slate-900 leading-snug">
                    {opp.title}
                  </h3>
                  <p className="text-xs font-semibold text-slate-600 mt-0.5">{opp.company}</p>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                  {opp.description}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pt-1">
                  <div className="flex items-center gap-1">
                    <MapPin size={13} className="text-slate-400" />
                    <span>{opp.location}</span>
                  </div>
                  <div className="flex items-center gap-1 font-bold text-slate-700">
                    <Coins size={13} className="text-emerald-600" />
                    <span>{opp.remuneration}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={13} className="text-slate-400" />
                    <span>{opp.hours}</span>
                  </div>
                </div>

                {/* Course match tags */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {opp.courseMatch.map((c, idx) => (
                    <span key={idx} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="shrink-0 flex md:flex-col items-center justify-end gap-2 border-t md:border-t-0 pt-3 md:pt-0">
                <span className="text-[10px] text-slate-400 block text-right">
                  {opp.applicants} inscritos
                </span>
                <button
                  onClick={() => { setSelectedOpp(opp); setAppliedSuccess(false); sound.playPop(); }}
                  className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs hover:shadow-md transition whitespace-nowrap"
                >
                  {opp.type === 'Grupo de Estudo' ? 'Participar' : opp.type === 'Evento' ? 'Inscrever-se' : 'Quero me candidatar'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Candidacy Modal */}
      {selectedOpp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-in zoom-in-95">
            <div className="bg-emerald-800 text-white p-5 relative">
              <button
                onClick={() => setSelectedOpp(null)}
                className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white"
              >
                <X size={16} />
              </button>
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-200">
                Inscrição Direta
              </span>
              <h3 className="text-lg font-bold mt-1 leading-snug">{selectedOpp.title}</h3>
              <p className="text-xs text-emerald-100 mt-0.5">{selectedOpp.company}</p>
            </div>

            {appliedSuccess ? (
              <div className="p-6 text-center space-y-3">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 size={32} />
                </div>
                <h4 className="font-bold text-base text-slate-900">Inscrição Confirmada!</h4>
                <p className="text-xs text-slate-600">
                  Seu perfil acadêmico foi direcionado para a coordenação responsável.
                </p>
                <button
                  onClick={() => setSelectedOpp(null)}
                  className="px-5 py-2 rounded-xl bg-emerald-800 text-white text-xs font-bold mt-2"
                >
                  Concluir
                </button>
              </div>
            ) : (
              <form onSubmit={handleApply} className="p-6 space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nome Completo</label>
                  <input
                    type="text"
                    required
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Curso na UFPE</label>
                  <input
                    type="text"
                    required
                    value={applicantCourse}
                    onChange={(e) => setApplicantCourse(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">E-mail Institucional</label>
                  <input
                    type="email"
                    required
                    value={applicantEmail}
                    onChange={(e) => setApplicantEmail(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>

                <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-600 border border-slate-200 space-y-1">
                  <div><strong>Requisitos:</strong> {selectedOpp.requirements}</div>
                  <div><strong>Remuneração:</strong> {selectedOpp.remuneration}</div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedOpp(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
                  >
                    <Send size={14} />
                    <span>{submitting ? 'Enviando...' : 'Confirmar Candidatura'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
