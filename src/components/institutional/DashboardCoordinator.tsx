import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Users, 
  Heart, 
  MessageSquare, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Download,
  Filter
} from 'lucide-react';
import { PermanenciaStats, Ticket, ClinicAppointment } from '../../types';
import { api } from '../../services/api';

export const DashboardCoordinator: React.FC = () => {
  const [stats, setStats] = useState<PermanenciaStats | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [appointments, setAppointments] = useState<ClinicAppointment[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'communication' | 'support' | 'retention'>('overview');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statData, ticketData, clinicData] = await Promise.all([
          api.getPermanencia(),
          api.getTickets(),
          api.getClinicAppointments()
        ]);
        setStats(statData);
        setTickets(ticketData);
        setAppointments(clinicData);
      } catch (err) {
        console.error('Failed to load coordinator data', err);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Header Bar - Matches Gemini_Generated_Image_p3h7vop3h7vop3h7.jpg */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 text-[10px] font-bold uppercase tracking-wider">
              Painel Gerencial IES
            </span>
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <ShieldCheck size={14} className="text-emerald-600" />
              <span>Conforme LGPD (Dados Agregados e Anonimizados)</span>
            </div>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 mt-1">
            Gestão da Permanência & Engajamento UFPE
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitoramento preditivo de evasão, comunicações institucionais e clínica-escola.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => alert('Exportando relatório gerencial consolidado (PDF)...')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
          >
            <Download size={14} />
            <span>Exportar Relatório</span>
          </button>
        </div>
      </div>

      {/* Coordinator Sub-tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'overview', label: 'Visão Geral (Overview)' },
          { id: 'communication', label: 'Comunicação Oficial' },
          { id: 'support', label: 'Apoio & Clínica-Escola' },
          { id: 'retention', label: 'Métricas de Retenção' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeSubTab === tab.id
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Grid - Matches Gemini_Generated_Image_p3h7vop3h7vop3h7.jpg layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Card 1: Retention & Engagement */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900">Retention & Engagement</h3>
                <span className="text-xs text-slate-400">Student Retention Rate</span>
              </div>
              <span className="px-3 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-bold border border-teal-200">
                Semestre 2026.1
              </span>
            </div>

            {/* Retention Stat Highlight */}
            <div className="flex items-center gap-6 my-4 bg-teal-50/50 p-4 rounded-2xl border border-teal-100">
              <div>
                <span className="text-3xl font-extrabold text-teal-800">84.2%</span>
                <span className="block text-xs font-semibold text-slate-600">Taxa de Retenção</span>
              </div>
              <div className="border-l border-teal-200 pl-6">
                <span className="text-xs text-slate-500 font-medium">Índice de Engajamento:</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="font-bold text-sm text-emerald-600">Alto (78%)</span>
                  <TrendingUp size={16} className="text-emerald-600" />
                </div>
                {/* Progress bar */}
                <div className="w-36 h-2 bg-slate-200 rounded-full mt-1.5 overflow-hidden">
                  <div className="w-[78%] h-full bg-emerald-500 rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Simulated Line Chart Curve (Jan-Jun) */}
            <div className="pt-2">
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>Jan</span>
                <span>Fev</span>
                <span>Mar</span>
                <span>Abr</span>
                <span>Mai</span>
                <span>Jun</span>
              </div>
              <svg viewBox="0 0 400 120" className="w-full h-24 overflow-visible">
                <defs>
                  <linearGradient id="retentionGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.3" />
                    <stop offset="1%" stopColor="#14b8a6" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d="M 10 100 Q 80 80 150 70 T 280 40 T 390 20"
                  fill="none"
                  stroke="#0f766e"
                  strokeWidth="3"
                />
                <path
                  d="M 10 100 Q 80 80 150 70 T 280 40 T 390 20 L 390 120 L 10 120 Z"
                  fill="url(#retentionGrad)"
                />
                {/* Points */}
                <circle cx="10" cy="100" r="4" fill="#0f766e" />
                <circle cx="150" cy="70" r="4" fill="#0f766e" />
                <circle cx="280" cy="40" r="4" fill="#0f766e" />
                <circle cx="390" cy="20" r="5" fill="#0f766e" stroke="#ffffff" strokeWidth="2" />
              </svg>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Previsão: Meta de 88% no fechamento do ano</span>
            <span className="font-semibold text-teal-800">2 IES monitoradas</span>
          </div>
        </div>

        {/* Card 2: Communication Activity */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900">Communication Activity</h3>
                <span className="text-xs text-slate-400">Alcance de Avisos & Engajamento</span>
              </div>
              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                Últimos 30 dias
              </span>
            </div>

            <div className="space-y-5 my-2">
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
                  <span>Comunicados Oficiais Visualizados</span>
                  <span className="text-emerald-700 font-extrabold">92%</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className="w-[92%] h-full bg-emerald-700 rounded-full transition-all"></div>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  3.420 estudantes confirmaram leitura de avisos críticos
                </span>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
                  <span>Taxa de Resposta aos Chamados</span>
                  <span className="text-teal-600 font-extrabold">88%</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className="w-[88%] h-full bg-teal-500 rounded-full transition-all"></div>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Tempo médio de resposta da Secretaria: 4h 12min
                </span>
              </div>

              <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
                <AlertTriangle size={18} className="shrink-0 text-amber-600 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  <strong>Alerta de Risco Preventivo:</strong> 42 alunos de cursos de Exatas reportaram dificuldade em conciliar estágio e horários da manhã. Coordenação notificada para oferta noturna.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-xs text-slate-500">
            Auditado pelo sistema oficial de protocolo Facul Mind
          </div>
        </div>

        {/* Card 3: Recent Activity & Inquiries */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900">Recent Activity & Inquiries</h3>
              <span className="text-xs text-slate-400">Solicitações Recentes de Estudantes</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">
              {tickets.length + appointments.length} demandas ativas
            </span>
          </div>

          {/* List of Recent Items - Matches Gemini_Generated_Image_p3h7vop3h7vop3h7.jpg */}
          <div className="space-y-2.5">
            {[
              {
                name: 'Marta Silva',
                type: 'Psych Support (Clínica-Escola)',
                status: 'Pending',
                statusColor: 'bg-amber-100 text-amber-800'
              },
              {
                name: 'João Pedro',
                type: 'Study Group - Algoritmos & Tech',
                status: 'In Progress',
                statusColor: 'bg-blue-100 text-blue-800'
              },
              {
                name: 'Mariano Ferreira',
                type: 'Apoio Secretarial / Horas Complementares',
                status: 'In Progress',
                statusColor: 'bg-blue-100 text-blue-800'
              },
              {
                name: 'Discente Noturno CAC',
                type: 'Ouvidoria: Acesso Biblioteca Central',
                status: 'Resolved',
                statusColor: 'bg-emerald-100 text-emerald-800'
              }
            ].map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100 transition flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-xs text-slate-700">
                    {item.name.charAt(0)}
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-slate-900">{item.name}</h5>
                    <p className="text-[10px] text-slate-500">{item.type}</p>
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${item.statusColor}`}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Card 4: Platform Engagement */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900">Platform Engagement</h3>
                <span className="text-xs text-slate-400">Usuários Ativos Semanais</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 items-center my-3">
              {/* Donut Chart Visual */}
              <div className="flex flex-col items-center">
                <div className="relative w-28 h-28">
                  <svg viewBox="0 0 36 36" className="w-28 h-28 transform -rotate-90">
                    {/* Background circle */}
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#e2e8f0"
                      strokeWidth="3.8"
                    />
                    {/* Students segment (75%) */}
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#0f766e"
                      strokeWidth="3.8"
                      strokeDasharray="75, 100"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-extrabold text-slate-900">2.8k</span>
                    <span className="text-[9px] text-slate-400">Ativos</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-2 text-[10px]">
                  <span className="flex items-center gap-1 font-semibold text-teal-800">
                    <span className="w-2 h-2 rounded-full bg-teal-800"></span>
                    Estudantes (75%)
                  </span>
                  <span className="flex items-center gap-1 text-slate-500">
                    <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                    Docentes (25%)
                  </span>
                </div>
              </div>

              {/* Activity by Module Bar Chart */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-700 block">Activity by Module</span>
                
                <div>
                  <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                    <span>Comunicação</span>
                    <span className="font-bold">40%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="w-[40%] h-full bg-teal-800 rounded-full"></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                    <span>Suporte Estudantil</span>
                    <span className="font-bold">32%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="w-[32%] h-full bg-teal-600 rounded-full"></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                    <span>Pausa Mind (Relax)</span>
                    <span className="font-bold">28%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="w-[28%] h-full bg-emerald-400 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 flex justify-between">
            <span>SaaS EdTech - Modelo B2B</span>
            <span className="font-semibold text-slate-700">Ponto de Equilíbrio: 1 IES</span>
          </div>
        </div>

      </div>
    </div>
  );
};
