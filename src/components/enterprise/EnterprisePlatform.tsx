import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  GitBranch, 
  CheckSquare, 
  FileText, 
  TrendingUp, 
  Plus, 
  Send, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Briefcase
} from 'lucide-react';
import { EnterpriseState, OrgNode, Workflow, ChecklistItem, Plan5W2H, EnterpriseDocument } from '../../types';
import { api } from '../../services/api';
import { sound } from '../../services/sound';

interface EnterpriseProps {
  openChat: (agentId?: string) => void;
}

export const EnterprisePlatform: React.FC<EnterpriseProps> = ({ openChat }) => {
  const [enterprise, setEnterprise] = useState<EnterpriseState | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'organograma' | 'fluxos' | 'checklists' | 'swot' | 'documentos'>('overview');
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showAddWorkflowModal, setShowAddWorkflowModal] = useState(false);
  const [showAddChecklistModal, setShowAddChecklistModal] = useState(false);
  const [showAddDocModal, setShowAddDocModal] = useState(false);

  // New item form states
  const [newMember, setNewMember] = useState({ name: '', role: '', department: 'Administrativo', responsibilities: '' });
  const [newChecklistText, setNewChecklistText] = useState('');
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocContent, setNewDocContent] = useState('');

  const loadData = async () => {
    try {
      const data = await api.getEnterpriseData();
      setEnterprise(data);
    } catch (err) {
      console.error('Failed to load enterprise data', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleChecklist = async (id: string) => {
    sound.playPop();
    try {
      await api.toggleChecklist(id);
      loadData();
    } catch {
      alert('Erro ao atualizar tarefa');
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enterprise || !newMember.name || !newMember.role) return;
    const updatedOrg: OrgNode[] = [
      ...enterprise.organization,
      {
        id: `org-${Date.now()}`,
        title: newMember.role,
        name: newMember.name,
        role: newMember.role,
        department: newMember.department,
        level: newMember.department === 'Diretoria' ? 1 : 2,
        reportsTo: 'org-1',
        responsibilities: newMember.responsibilities.split(',').map(s => s.trim()).filter(Boolean)
      }
    ];

    try {
      await api.updateOrgChart(updatedOrg);
      setShowAddMemberModal(false);
      setNewMember({ name: '', role: '', department: 'Administrativo', responsibilities: '' });
      sound.playSuccess();
      loadData();
    } catch {
      alert('Erro ao cadastrar membro');
    }
  };

  const handleAddChecklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistText.trim()) return;
    try {
      await api.addChecklist({
        text: newChecklistText.trim(),
        status: 'A Fazer',
        assignedTo: 'Secretariado Executivo',
        dueDate: '2026-11-25'
      });
      setNewChecklistText('');
      setShowAddChecklistModal(false);
      sound.playSuccess();
      loadData();
    } catch {
      alert('Erro ao criar tarefa');
    }
  };

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitle.trim() || !newDocContent.trim()) return;
    try {
      await api.addDocument({
        title: newDocTitle.trim(),
        content: newDocContent.trim(),
        type: 'Ata de Reunião',
        agent: 'FACUL DOCS'
      });
      setNewDocTitle('');
      setNewDocContent('');
      setShowAddDocModal(false);
      sound.playSuccess();
      loadData();
    } catch {
      alert('Erro ao salvar documento');
    }
  };

  if (!enterprise) {
    return <div className="p-12 text-center text-xs text-slate-500">Carregando módulo empresarial...</div>;
  }

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Enterprise Top Banner - Matches Gemini_Generated_Image_p3h7vop3h7vop3h7(4).jpg */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-emerald-900/10">
            <Building2 size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-slate-900">{enterprise.companyName}</h2>
              <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                PME • Secretariado
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Gestão de processos administrativos, organograma e automação de rotinas secretarias.
            </p>
          </div>
        </div>

        {/* Multi-Agent Launch Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => { openChat('facul-organiza'); sound.playPop(); }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-sm transition"
          >
            <Sparkles size={14} />
            <span>Chamar Facul Assistente</span>
          </button>
        </div>
      </div>

      {/* Tabs Header - Matches Gemini_Generated_Image_p3h7vop3h7vop3h7(4).jpg */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'overview', label: 'Visão Geral' },
          { id: 'organograma', label: 'Organograma & Equipe [FACUL ORGANIZA]' },
          { id: 'fluxos', label: 'Fluxos de Trabalho [FACUL FLUXO]' },
          { id: 'checklists', label: 'Checklists & Tarefas' },
          { id: 'swot', label: 'Matriz SWOT & 5W2H [FACUL ESTRATÉGIA]' },
          { id: 'documentos', label: 'Atas & Procedimentos [FACUL DOCS]' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id as any); sound.playPop(); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview 3-Column Layout - Matches Gemini_Generated_Image_p3h7vop3h7vop3h7(4).jpg */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Card 1: Organograma & Equipe (FACUL ORGANIZA) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-base text-slate-900">Organograma & Equipe</h3>
                  <span className="text-xs text-slate-400">Estrutura Hierárquica</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  FACUL ORGANIZA
                </span>
              </div>

              {/* Visual Tree Preview */}
              <div className="space-y-3 my-2">
                {/* Diretoria */}
                <div className="p-3 bg-emerald-100/70 border border-emerald-300 rounded-2xl text-center">
                  <span className="text-[10px] uppercase font-bold text-emerald-800 block">Nível Estratégico</span>
                  <span className="font-extrabold text-xs text-slate-900">Diretoria Executiva (CEO)</span>
                </div>

                <div className="w-0.5 h-3 bg-slate-300 mx-auto"></div>

                {/* Sub-areas */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Gestão</span>
                    <span className="font-bold text-[11px] text-slate-800">Secretariado Executivo</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Tático</span>
                    <span className="font-bold text-[11px] text-slate-800">Operações & Atendimento</span>
                  </div>
                </div>

                {/* Overlap alert */}
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
                  <AlertCircle size={15} className="shrink-0 text-amber-600 mt-0.5" />
                  <p>
                    <strong>FACUL ORGANIZA:</strong> 1 sobreposição detectada na triagem de fornecedores. Sugerida Matriz RACI.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => { setActiveTab('organograma'); sound.playPop(); }}
              className="w-full mt-4 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition"
            >
              <span>Gerenciar Organograma Completo</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {/* Card 2: Fluxos de Trabalho (FACUL FLUXO) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-base text-slate-900">Fluxos de Trabalho</h3>
                  <span className="text-xs text-slate-400">Workflows & Processos</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  FACUL FLUXO
                </span>
              </div>

              {/* Step-by-Step Flow Preview */}
              <div className="space-y-2 my-2">
                {enterprise.workflows[0]?.steps.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200/80 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-700 text-white font-bold text-[10px] flex items-center justify-center">
                        {step.order}
                      </span>
                      <span className="text-xs font-bold text-slate-800">{step.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium">{step.time}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => { setActiveTab('fluxos'); sound.playPop(); }}
              className="w-full mt-4 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition"
            >
              <span>Ver Diagrama BPMN & Gargalos</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {/* Card 3: Checklists & Tarefas */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-base text-slate-900">Checklists & Tarefas</h3>
                  <span className="text-xs text-slate-400">Rotinas do Secretariado</span>
                </div>
                <button
                  onClick={() => setShowAddChecklistModal(true)}
                  className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 flex items-center justify-center"
                  title="Nova Tarefa"
                >
                  <Plus size={16} />
                </button>
              </div>

              {/* Tasks List */}
              <div className="space-y-2.5 my-2">
                {enterprise.checklists.slice(0, 4).map((task) => (
                  <div
                    key={task.id}
                    onClick={() => handleToggleChecklist(task.id)}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-emerald-500 bg-slate-50/50 cursor-pointer transition flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                        task.status === 'Concluído' ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300'
                      }`}>
                        {task.status === 'Concluído' && <CheckSquare size={12} />}
                      </div>
                      <span className={`text-xs ${task.status === 'Concluído' ? 'line-through text-slate-400' : 'text-slate-800 font-medium'}`}>
                        {task.text}
                      </span>
                    </div>

                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${
                      task.status === 'Concluído' ? 'bg-emerald-100 text-emerald-800' :
                      task.status === 'Em Andamento' ? 'bg-amber-100 text-amber-800' :
                      'bg-slate-200 text-slate-700'
                    }`}>
                      {task.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => { setActiveTab('checklists'); sound.playPop(); }}
              className="w-full mt-4 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition"
            >
              <span>Ver Todas as Tarefas ({enterprise.checklists.length})</span>
              <ArrowRight size={14} />
            </button>
          </div>

        </div>
      )}

      {/* Tab: Organograma Detalhado [FACUL ORGANIZA] */}
      {activeTab === 'organograma' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  FACUL ORGANIZA
                </span>
                <h3 className="font-extrabold text-lg text-slate-900">Organograma Corporativo & Cargos</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Mapeamento das funções, subordinações e prevenção de acúmulo de papéis.
              </p>
            </div>

            <button
              onClick={() => setShowAddMemberModal(true)}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <Plus size={14} />
              <span>Adicionar Cargo / Colaborador</span>
            </button>
          </div>

          {/* Org Tree View */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {enterprise.organization.map(node => (
              <div
                key={node.id}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-emerald-400 hover:shadow-xs transition space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    {node.department}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">Nível {node.level}</span>
                </div>

                <div>
                  <h4 className="font-bold text-sm text-slate-900">{node.name}</h4>
                  <p className="text-xs text-slate-600 font-medium">{node.role}</p>
                </div>

                <div className="pt-2 border-t border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-500 block mb-1">Responsabilidades:</span>
                  <ul className="text-[11px] text-slate-600 space-y-1 list-disc list-inside">
                    {node.responsibilities.map((r, rIdx) => (
                      <li key={rIdx} className="line-clamp-1">{r}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Fluxos de Trabalho Detalhados [FACUL FLUXO] */}
      {activeTab === 'fluxos' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  FACUL FLUXO
                </span>
                <h3 className="font-extrabold text-lg text-slate-900">Mapeamento de Processos (BPMN)</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Diagramas de fluxo operacional, tempos de ciclo e identificação de gargalos.
              </p>
            </div>

            <button
              onClick={() => openChat('facul-fluxo')}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <Sparkles size={14} />
              <span>Gerar Novo Fluxo com IA</span>
            </button>
          </div>

          {enterprise.workflows.map(wf => (
            <div key={wf.id} className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-sm text-slate-900">{wf.name}</h4>
                  <span className="text-xs text-slate-500">Gatilho: {wf.trigger}</span>
                </div>

                {/* Steps Visual Chain */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-2 my-4">
                  {wf.steps.map((st) => (
                    <div key={st.order} className="p-3 bg-white rounded-xl border border-slate-200 text-center space-y-1">
                      <span className="w-5 h-5 rounded-full bg-emerald-700 text-white font-bold text-[10px] inline-flex items-center justify-center">
                        {st.order}
                      </span>
                      <h5 className="font-bold text-xs text-slate-900">{st.name}</h5>
                      <p className="text-[10px] text-slate-500 font-medium">{st.actor}</p>
                      <span className="inline-block text-[9px] bg-slate-100 px-1.5 py-0.5 rounded-md text-slate-600 font-semibold">
                        {st.time}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Bottlenecks section */}
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
                  <strong>Gargalos Operacionais Identificados:</strong>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                    {wf.bottlenecks.map((b, bIdx) => (
                      <li key={bIdx}>{b}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Checklists & Tarefas */}
      {activeTab === 'checklists' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-extrabold text-lg text-slate-900">Checklists de Rotina Secretarial</h3>
              <p className="text-xs text-slate-500">Organização e cumprimento de tarefas administrativas.</p>
            </div>
            <button
              onClick={() => setShowAddChecklistModal(true)}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <Plus size={14} />
              <span>Nova Tarefa</span>
            </button>
          </div>

          <div className="space-y-2">
            {enterprise.checklists.map(chk => (
              <div
                key={chk.id}
                onClick={() => handleToggleChecklist(chk.id)}
                className="p-3.5 rounded-2xl border border-slate-200 hover:border-emerald-500 bg-slate-50/50 cursor-pointer transition flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                    chk.status === 'Concluído' ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300'
                  }`}>
                    {chk.status === 'Concluído' && <CheckSquare size={14} />}
                  </div>
                  <div>
                    <span className={`text-xs font-semibold ${chk.status === 'Concluído' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                      {chk.text}
                    </span>
                    <span className="block text-[10px] text-slate-400">
                      Responsável: {chk.assignedTo} • Prazo: {chk.dueDate}
                    </span>
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                  chk.status === 'Concluído' ? 'bg-emerald-100 text-emerald-800' :
                  chk.status === 'Em Andamento' ? 'bg-amber-100 text-amber-800' :
                  'bg-slate-200 text-slate-700'
                }`}>
                  {chk.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Matriz SWOT & 5W2H [FACUL ESTRATÉGIA] */}
      {activeTab === 'swot' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  FACUL ESTRATÉGIA
                </span>
                <h3 className="font-extrabold text-lg text-slate-900">Matriz SWOT & Plano 5W2H</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Diagnóstico tático do negócio e plano de ação estruturado.</p>
            </div>
          </div>

          {/* SWOT Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Strengths */}
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-800">Forças (Strengths)</h4>
              <ul className="text-xs text-emerald-950 space-y-1 list-disc list-inside">
                {enterprise.swot.strengths.map((s, idx) => <li key={idx}>{s}</li>)}
              </ul>
            </div>

            {/* Weaknesses */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-amber-800">Fraquezas (Weaknesses)</h4>
              <ul className="text-xs text-amber-950 space-y-1 list-disc list-inside">
                {enterprise.swot.weaknesses.map((w, idx) => <li key={idx}>{w}</li>)}
              </ul>
            </div>

            {/* Opportunities */}
            <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200 space-y-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-sky-800">Oportunidades (Opportunities)</h4>
              <ul className="text-xs text-sky-950 space-y-1 list-disc list-inside">
                {enterprise.swot.opportunities.map((o, idx) => <li key={idx}>{o}</li>)}
              </ul>
            </div>

            {/* Threats */}
            <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-rose-800">Ameaças (Threats)</h4>
              <ul className="text-xs text-rose-950 space-y-1 list-disc list-inside">
                {enterprise.swot.threats.map((t, idx) => <li key={idx}>{t}</li>)}
              </ul>
            </div>
          </div>

          {/* 5W2H Table */}
          <div className="pt-2 space-y-3">
            <h4 className="font-bold text-sm text-slate-900">Plano de Ação 5W2H</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200 rounded-2xl overflow-hidden">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">O que (What)</th>
                    <th className="p-3">Por que (Why)</th>
                    <th className="p-3">Quem (Who)</th>
                    <th className="p-3">Quando (When)</th>
                    <th className="p-3">Onde (Where)</th>
                    <th className="p-3">Quanto (How Much)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {enterprise.swot.plan5W2H.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-3 font-semibold text-slate-900">{p.what}</td>
                      <td className="p-3 text-slate-600">{p.why}</td>
                      <td className="p-3 text-slate-800 font-medium">{p.who}</td>
                      <td className="p-3 text-slate-600">{p.when}</td>
                      <td className="p-3 text-slate-600">{p.where}</td>
                      <td className="p-3 text-emerald-700 font-bold">{p.howMuch}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Atas & Procedimentos [FACUL DOCS] */}
      {activeTab === 'documentos' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  FACUL DOCS
                </span>
                <h3 className="font-extrabold text-lg text-slate-900">Atas, SOPs e Documentos</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Histórico de atas geradas e procedimentos padronizados.</p>
            </div>

            <button
              onClick={() => setShowAddDocModal(true)}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <Plus size={14} />
              <span>Gerar Novo Documento</span>
            </button>
          </div>

          <div className="space-y-4">
            {enterprise.documents.map(doc => (
              <div key={doc.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900">{doc.title}</span>
                  <span className="text-[10px] text-slate-400">Criado em {doc.createdAt}</span>
                </div>
                <div className="text-xs text-slate-700 whitespace-pre-line leading-relaxed bg-white p-4 rounded-xl border border-slate-200 font-mono">
                  {doc.content}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
            <h3 className="font-bold text-base text-slate-900">Novo Colaborador / Cargo</h3>
            <form onSubmit={handleAddMember} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nome</label>
                <input
                  type="text"
                  required
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  placeholder="Ex: Ana Clara"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Cargo</label>
                <input
                  type="text"
                  required
                  value={newMember.role}
                  onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                  placeholder="Ex: Assistente de Secretariado Executivo"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Departamento</label>
                <select
                  value={newMember.department}
                  onChange={(e) => setNewMember({ ...newMember, department: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
                >
                  <option value="Diretoria">Diretoria</option>
                  <option value="Administrativo">Administrativo</option>
                  <option value="Operações">Operações</option>
                  <option value="Atendimento">Atendimento</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Responsabilidades (separadas por vírgula)</label>
                <input
                  type="text"
                  value={newMember.responsibilities}
                  onChange={(e) => setNewMember({ ...newMember, responsibilities: e.target.value })}
                  placeholder="Ex: Gestão de agenda, redação de atas"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddMemberModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Checklist Modal */}
      {showAddChecklistModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
            <h3 className="font-bold text-base text-slate-900">Nova Tarefa Secretarial</h3>
            <form onSubmit={handleAddChecklist} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Descrição da Tarefa</label>
                <input
                  type="text"
                  required
                  value={newChecklistText}
                  onChange={(e) => setNewChecklistText(e.target.value)}
                  placeholder="Ex: Arquivar atas da reunião ordinária no Drive"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddChecklistModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold"
                >
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Document Modal */}
      {showAddDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 space-y-4">
            <h3 className="font-bold text-base text-slate-900">Gerar Documento Administrativo</h3>
            <form onSubmit={handleAddDocument} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Título do Documento</label>
                <input
                  type="text"
                  required
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  placeholder="Ex: Ata de Reunião Extraordinária"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Conteúdo</label>
                <textarea
                  required
                  rows={6}
                  value={newDocContent}
                  onChange={(e) => setNewDocContent(e.target.value)}
                  placeholder="Escreva ou cole a transcrição da reunião..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 font-mono resize-none"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddDocModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold"
                >
                  Salvar Documento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
