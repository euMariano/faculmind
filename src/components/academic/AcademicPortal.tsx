import React, { useState } from 'react';
import { 
  Calendar, 
  GraduationCap, 
  Coins, 
  BookOpen, 
  Users, 
  FileText, 
  HelpCircle, 
  Search, 
  ChevronRight, 
  Sparkles, 
  Heart, 
  MessageSquare, 
  ArrowRight,
  ShieldAlert,
  Compass,
  Smile,
  Frown,
  Coffee,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { sound } from '../../services/sound';
import { RadarPermanenciaModal } from './RadarPermanenciaModal';
import { OmbudsmanModal } from './OmbudsmanModal';
import { ClinicAppointmentModal } from './ClinicAppointmentModal';
import { SigaaSyncModal } from './SigaaSyncModal';
import { StudentAcademicRecord } from '../../types';

interface AcademicPortalProps {
  openChat: (agentId?: string, initialMessage?: string) => void;
  navigateToTab: (tab: any) => void;
  syncedStudent?: StudentAcademicRecord | null;
  onSyncStudent?: (student: StudentAcademicRecord) => void;
}

export const AcademicPortal: React.FC<AcademicPortalProps> = ({ 
  openChat, 
  navigateToTab,
  syncedStudent,
  onSyncStudent
}) => {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [showPermanenciaModal, setShowPermanenciaModal] = useState(false);
  const [showOmbudsmanModal, setShowOmbudsmanModal] = useState(false);
  const [showClinicModal, setShowClinicModal] = useState(false);
  const [showSigaaModal, setShowSigaaModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const quickCards = [
    {
      id: 'calendario',
      title: 'Calendário Acadêmico',
      icon: Calendar,
      desc: 'Prazos de matrícula, provas, trancamento e feriados.',
      action: () => openChat('agy-ufpe')
    },
    {
      id: 'sigaa',
      title: 'Matrícula e SIGAA',
      icon: GraduationCap,
      desc: 'Sincronizar turmas, faltas e notas em tempo real.',
      action: () => setShowSigaaModal(true)
    },
    {
      id: 'bolsas',
      title: 'Bolsas e Auxílios',
      icon: Coins,
      desc: 'Auxílio permanência, bolsas PROAES, RU e moradia.',
      action: () => navigateToTab('opportunities')
    },
    {
      id: 'disciplinas',
      title: 'Disciplinas e Notas',
      icon: BookOpen,
      desc: 'Horas complementares, faltas e cálculo de médias.',
      action: () => setShowSigaaModal(true)
    },
    {
      id: 'apoio',
      title: 'Apoio Estudantil',
      icon: Users,
      desc: 'Acolhimento da clínica de psicologia e assistência social.',
      action: () => setShowClinicModal(true)
    },
    {
      id: 'editais',
      title: 'Editais e Seleções',
      icon: FileText,
      desc: 'Estágios, bolsas de pesquisa (PIBIC) e monitorias.',
      action: () => navigateToTab('opportunities')
    },
    {
      id: 'faq',
      title: 'Dúvidas Frequentes',
      icon: HelpCircle,
      desc: 'Respostas rápidas validadas pelo regimento da UFPE.',
      action: () => openChat('agy-ufpe')
    }
  ];

  const handleMoodSelect = (mood: string) => {
    setSelectedMood(mood);
    sound.playPop();
    setShowPermanenciaModal(true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* UFPE Subheader Branding (Matches WhatsApp Image 2026-11-06 at 20.26.53.jpeg) */}
      <div className="bg-ufpe-burgundy text-white px-4 sm:px-6 py-2.5 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-bold text-xs ring-1 ring-white/20">
            UFPE
          </div>
          <div>
            <h1 className="text-sm font-bold leading-tight">Universidade Federal de Pernambuco</h1>
            <p className="text-[11px] text-rose-200">Portal de Assistência e Permanência Discente</p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-4 text-xs font-medium text-rose-100">
          <span className="hover:text-white cursor-pointer transition">Estudante</span>
          <span className="hover:text-white cursor-pointer transition">Cursos</span>
          <span className="hover:text-white cursor-pointer transition">Serviços</span>
          <span 
            onClick={() => setShowPermanenciaModal(true)} 
            className="hover:text-white cursor-pointer font-bold underline decoration-rose-300 underline-offset-4"
          >
            Permanência Estudantil
          </span>
          <button
            onClick={() => { setShowSigaaModal(true); sound.playPop(); }}
            className="flex items-center gap-1.5 px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg font-bold text-xs transition shadow-xs"
            title="Sincronizar turmas e notas reais do SIGAA UFPE"
          >
            <Sparkles size={12} />
            <span>Sincronizar SIGAA</span>
          </button>
          <a
            href="https://sigaa.ufpe.br"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1 bg-white text-ufpe-burgundy rounded-lg font-bold text-xs hover:bg-rose-50 transition shadow-xs"
          >
            <span>Acesso SIGAA</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </div>

      {/* Hero Section (Matches WhatsApp Image 2026-11-06 at 20.26.53.jpeg) */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-rose-950 via-ufpe-burgundy to-rose-900 text-white shadow-xl">
        <div className="absolute inset-0 opacity-15 mix-blend-overlay bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        <div className="relative px-6 py-8 sm:px-10 sm:py-12 flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Left Column: Mascot & Copy */}
          <div className="flex-1 space-y-4 max-w-xl text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-rose-100 text-xs font-semibold backdrop-blur-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>Inteligência Artificial Oficial para Estudantes</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-center md:justify-start gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white text-ufpe-burgundy flex items-center justify-center shadow-lg">
                  <GraduationCap size={28} />
                </div>
                <div>
                  <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">FaculMind</h2>
                  <p className="text-xs font-bold uppercase tracking-wider text-rose-200">
                    Sua assistente virtual na UFPE
                  </p>
                </div>
              </div>

              <p className="text-sm sm:text-base text-rose-100 font-normal leading-relaxed pt-1">
                Tire dúvidas sobre disciplinas e SIGAA, encontre estágios e bolsas, receba orientações e conte com apoio acolhedor para uma jornada acadêmica mais leve e sem interrupções.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
              <button
                onClick={() => { openChat('agy-ufpe'); sound.playPop(); }}
                className="px-6 py-3 rounded-2xl bg-white text-ufpe-burgundy hover:bg-rose-50 font-bold text-sm shadow-lg shadow-black/20 hover:shadow-xl transition transform active:scale-95 flex items-center gap-2"
              >
                <MessageSquare size={18} className="text-ufpe-burgundy" />
                <span>Conversar com a FaculMind</span>
                <ChevronRight size={16} />
              </button>

              <button
                onClick={() => { navigateToTab('pausa-mind'); sound.playPop(); }}
                className="px-5 py-3 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-semibold text-sm backdrop-blur-xs transition flex items-center gap-2"
              >
                <Sparkles size={16} className="text-amber-300" />
                <span>Pausa Mind (Relax)</span>
              </button>
            </div>
          </div>

          {/* Right Column: Visual Mascot Preview / Interactive Prompt */}
          <div className="relative shrink-0 flex flex-col items-center">
            <div className="relative group cursor-pointer" onClick={() => openChat('agy-ufpe')}>
              <div className="w-48 sm:w-56 h-48 sm:h-56 rounded-3xl overflow-hidden ring-4 ring-white/30 shadow-2xl bg-white/10 backdrop-blur-xs transition transform group-hover:scale-102">
                <img 
                  src="/mascot.jpeg" 
                  alt="Mascote Agy" 
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-white text-slate-900 text-xs font-bold px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 whitespace-nowrap">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Agy está Online</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Synced Student Banner (Passo 4 - Dados Reais UFPE) */}
      {syncedStudent && (
        <div className="bg-white rounded-3xl p-5 border border-emerald-300 shadow-sm flex flex-wrap items-center justify-between gap-4 animate-in fade-in duration-200">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xl shadow-xs">
              🎓
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-sm text-slate-900">{syncedStudent.name}</h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  SIGAA Conectado
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Curso: <strong>{syncedStudent.course}</strong> • CRA: <strong className="text-emerald-700">{syncedStudent.cra}</strong> • {syncedStudent.turmas.length} turmas monitoradas pelo Radar
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                openChat('agy-ufpe', 'Como estou em Cálculo?');
                sound.playPop();
              }}
              className="px-3.5 py-2 rounded-xl bg-ufpe-burgundy hover:bg-ufpe-dark text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5"
            >
              <Sparkles size={14} className="text-amber-300" />
              <span>Analisar Cálculo na IA</span>
            </button>
            <button
              onClick={() => {
                setShowSigaaModal(true);
                sound.playPop();
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
            >
              Ver Grade e Faltas
            </button>
          </div>
        </div>
      )}

      {/* Quick Access Cards Grid (Matches WhatsApp Image 2026-11-06 at 20.26.53.jpeg) */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-base font-bold text-slate-800">Acesso Rápido aos Serviços UFPE</h3>
          <span className="text-xs text-slate-500">Clique para abrir detalhes com a IA</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          {quickCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                onClick={() => {
                  card.action();
                  sound.playPop();
                }}
                className="bg-white rounded-2xl p-4 border border-slate-200/90 hover:border-ufpe-burgundy/50 hover:shadow-md transition-all cursor-pointer group flex flex-col items-center text-center justify-between min-h-[140px]"
              >
                <div className="w-11 h-11 rounded-2xl bg-rose-50 text-ufpe-burgundy group-hover:bg-ufpe-burgundy group-hover:text-white transition flex items-center justify-center mb-2 shadow-2xs">
                  <Icon size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 group-hover:text-ufpe-burgundy transition line-clamp-2">
                    {card.title}
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-1 line-clamp-2 leading-tight">
                    {card.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Three Pillars Section (Radar de Permanência, Destaques, Apoio) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Card 1: Radar de Permanência */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between hover:shadow-md transition">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-ufpe-burgundy flex items-center justify-center">
                  <Compass size={18} />
                </div>
                <h4 className="font-bold text-sm text-slate-800">Radar de Permanência</h4>
              </div>
              <span className="text-[10px] bg-rose-50 text-ufpe-burgundy px-2 py-0.5 rounded-full font-bold">
                UFPE Viva
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Como você está se sentindo com a rotina acadêmica nesta semana? Sua resposta é anônima e ajuda a coordenação a apoiar sua turma.
            </p>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {[
                { id: 'focado', label: '🎯 Focado(a)', bg: 'hover:bg-emerald-50 hover:border-emerald-200' },
                { id: 'ansioso', label: '🤯 Ansioso(a)', bg: 'hover:bg-amber-50 hover:border-amber-200' },
                { id: 'exausto', label: '😴 Exausto(a)', bg: 'hover:bg-rose-50 hover:border-rose-200' },
                { id: 'disposto', label: '☕ Disposto(a)', bg: 'hover:bg-sky-50 hover:border-sky-200' },
              ].map(mood => (
                <button
                  key={mood.id}
                  onClick={() => handleMoodSelect(mood.id)}
                  className={`text-xs font-semibold py-2 px-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-700 transition text-left ${mood.bg}`}
                >
                  {mood.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => { setShowPermanenciaModal(true); sound.playPop(); }}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition"
          >
            <span>Ver Termômetro Discente</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Card 2: Da Reclamação à Solução (Ouvidoria Anônima) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between hover:shadow-md transition">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <ShieldAlert size={18} />
                </div>
                <h4 className="font-bold text-sm text-slate-800">Da Reclamação à Solução</h4>
              </div>
              <span className="text-[10px] bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                100% Anônimo
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Encontrou problemas com ar-condicionado, conflito de horários de disciplinas ou atendimento departamental? Registre com pseudônimo e receba protocolo oficial rastreável.
            </p>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 space-y-1 mb-4 text-xs">
              <div className="flex items-center justify-between font-bold text-slate-700">
                <span>Protocolos em Resolução</span>
                <span className="text-ufpe-burgundy">2 ativos</span>
              </div>
              <p className="text-[11px] text-slate-500">
                SIB/UFPE: Extensão de horário da Biblioteca Noturna em deliberação.
              </p>
            </div>
          </div>

          <button
            onClick={() => { setShowOmbudsmanModal(true); sound.playPop(); }}
            className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-xs"
          >
            <span>Registrar Manifestação Segura</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Card 3: Apoio Psicológico & Acolhimento */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between hover:shadow-md transition">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Heart size={18} />
                </div>
                <h4 className="font-bold text-sm text-slate-800">Clínica-Escola de Psicologia</h4>
              </div>
              <span className="text-[10px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                Atendimento Gratuito
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Estudantes dos últimos períodos de Psicologia da UFPE oferecem escuta acolhedora sob supervisão docente (CRP-02). Sem julgamentos, com total sigilo.
            </p>

            <div className="bg-emerald-50/60 p-3 rounded-2xl border border-emerald-100 space-y-1.5 mb-2 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-900 font-bold">
                <CheckCircle2 size={14} className="text-emerald-700" />
                <span>Supervisão Docente Ativa</span>
              </div>
              <p className="text-[11px] text-emerald-800">
                Atendimentos presenciais no CFCH ou online via canal protegido.
              </p>
            </div>
          </div>

          <button
            onClick={() => { setShowClinicModal(true); sound.playPop(); }}
            className="w-full mt-4 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-xs"
          >
            <Heart size={14} className="fill-white" />
            <span>Agendar com a Clínica-Escola</span>
          </button>
        </div>
      </div>

      {/* Banner de Valor Institucional */}
      <div className="bg-slate-100 rounded-2xl p-5 border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div>
          <h5 className="font-bold text-xs text-slate-900">
            Compromisso Facul Mind com a Permanência Estudantil
          </h5>
          <p className="text-[11px] text-slate-500 mt-0.5">
            "A FACUL MIND não é um custo para a faculdade, é um investimento que se paga sozinho ao evitar que 2 ou 3 alunos tranquem a matrícula por mês."
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 shrink-0">
          <div className="p-2 flex flex-col items-center">
            <span className="text-lg">🎯</span>
            <span className="text-xs font-bold text-slate-800 mt-1">-42% Evasão</span>
            <span className="text-[10px] text-slate-500">Média em pilotos IES</span>
          </div>
          <div className="p-2 flex flex-col items-center">
            <span className="text-lg">⚡</span>
            <span className="text-xs font-bold text-slate-800 mt-1">Mais Autonomia</span>
            <span className="text-[10px] text-slate-500">Menos dúvidas e retrabalho</span>
          </div>
          <div className="p-2 flex flex-col items-center col-span-2 md:col-span-1">
            <span className="text-lg">🤍</span>
            <span className="text-xs font-bold text-slate-800 mt-1">UFPE Acolhedora</span>
            <span className="text-[10px] text-slate-500">Jornada universitária integrada</span>
          </div>
        </div>
      </div>

      {/* Modals */}
      <RadarPermanenciaModal 
        isOpen={showPermanenciaModal} 
        onClose={() => setShowPermanenciaModal(false)} 
      />

      <OmbudsmanModal 
        isOpen={showOmbudsmanModal} 
        onClose={() => setShowOmbudsmanModal(false)} 
      />

      <ClinicAppointmentModal 
        isOpen={showClinicModal} 
        onClose={() => setShowClinicModal(false)} 
      />

      <SigaaSyncModal
        isOpen={showSigaaModal}
        onClose={() => setShowSigaaModal(false)}
        onSyncComplete={(data) => {
          if (onSyncStudent) onSyncStudent(data);
        }}
        onOpenChatWithSubject={(question) => {
          openChat('agy-ufpe', question);
        }}
      />
    </div>
  );
};
