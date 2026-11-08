import { 
  Opportunity, 
  Ticket, 
  ClinicAppointment, 
  PermanenciaStats, 
  EnterpriseState, 
  OrgNode, 
  Workflow, 
  ChecklistItem, 
  SwotData, 
  EnterpriseDocument,
  StudentAcademicRecord,
  UniversityNotice,
  PostIt,
  CoffeeChatMessage 
} from '../types';

const API_BASE = '/api';

export const api = {
  // Chat (Passo 3)
  async sendChatMessage(message: string, agentId?: string, context?: Record<string, unknown>) {
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, agentId, context })
    });
    if (!res.ok) throw new Error('Falha na resposta do assistente');
    return res.json();
  },

  // University Sync & Web Scraping (Passo 4 - SIGAA UFPE)
  async syncUniversity(options: { username?: string; password?: string; demoMode?: boolean; course?: string }): Promise<{
    success: boolean;
    mode: string;
    message: string;
    student?: StudentAcademicRecord;
    error?: string;
  }> {
    const res = await fetch(`${API_BASE}/sync-university`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options)
    });
    if (!res.ok) throw new Error('Falha ao sincronizar com SIGAA');
    return res.json();
  },

  async getCurrentUniversityData(): Promise<{ success: boolean; student: StudentAcademicRecord | null }> {
    const res = await fetch(`${API_BASE}/sync-university/current`);
    if (!res.ok) throw new Error('Falha ao obter histórico acadêmico');
    return res.json();
  },

  // 2-Tab SIGAA Real Sync Import
  async importUniversityData(payload: {
    html?: string;
    rawText?: string;
    studentName?: string;
    matricula?: string;
    course?: string;
    turmas?: any[];
  }): Promise<{ success: boolean; message: string; student: StudentAcademicRecord }> {
    const res = await fetch(`${API_BASE}/sync-university/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao importar dados do SIGAA');
    }
    return res.json();
  },

  // Dynamic Gemini API Key Config
  async saveGeminiKey(apiKey: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/config/gemini-key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao validar chave do Google Gemini');
    }
    return res.json();
  },

  async getApiStatus() {
    const res = await fetch(`${API_BASE}/status`);
    if (!res.ok) throw new Error('Falha ao verificar status da API');
    return res.json();
  },

  async getUniversityNotices(): Promise<UniversityNotice[]> {
    const res = await fetch(`${API_BASE}/university/notices`);
    if (!res.ok) throw new Error('Falha ao obter notícias da universidade');
    return res.json();
  },

  // Real-time Virtual Room & Networking (Passo 2)
  async getPostIts(): Promise<PostIt[]> {
    const res = await fetch(`${API_BASE}/room/postits`);
    if (!res.ok) throw new Error('Falha ao obter post-its');
    return res.json();
  },

  async addPostIt(postIt: Partial<PostIt>): Promise<PostIt> {
    const res = await fetch(`${API_BASE}/room/postits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postIt)
    });
    if (!res.ok) throw new Error('Falha ao publicar bilhete');
    return res.json();
  },

  async likePostIt(id: string | number): Promise<PostIt> {
    const res = await fetch(`${API_BASE}/room/postits/${id}/like`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Falha ao curtir bilhete');
    return res.json();
  },

  async getCoffeeChats(tableId: string): Promise<CoffeeChatMessage[]> {
    const res = await fetch(`${API_BASE}/room/coffee-chats/${tableId}`);
    if (!res.ok) throw new Error('Falha ao obter mensagens da mesa');
    return res.json();
  },

  async sendCoffeeMessage(tableId: string, message: { user: string; text: string; time?: string }): Promise<CoffeeChatMessage> {
    const res = await fetch(`${API_BASE}/room/coffee-chats/${tableId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    });
    if (!res.ok) throw new Error('Falha ao enviar mensagem na mesa');
    return res.json();
  },

  // Opportunities
  async getOpportunities(category?: string, search?: string): Promise<Opportunity[]> {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (search) params.set('search', search);

    const res = await fetch(`${API_BASE}/radar/opportunities?${params.toString()}`);
    if (!res.ok) throw new Error('Falha ao obter oportunidades');
    return res.json();
  },

  async applyOpportunity(id: string, candidate: { studentName: string; studentCourse: string; studentEmail: string }) {
    const res = await fetch(`${API_BASE}/radar/opportunities/${id}/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(candidate)
    });
    if (!res.ok) throw new Error('Falha ao enviar candidatura');
    return res.json();
  },

  // Tickets
  async getTickets(): Promise<Ticket[]> {
    const res = await fetch(`${API_BASE}/tickets`);
    if (!res.ok) throw new Error('Falha ao obter manifestações');
    return res.json();
  },

  async createTicket(ticket: Partial<Ticket>): Promise<Ticket> {
    const res = await fetch(`${API_BASE}/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ticket)
    });
    if (!res.ok) throw new Error('Falha ao registrar manifestação');
    return res.json();
  },

  // Clinic
  async getClinicAppointments(): Promise<ClinicAppointment[]> {
    const res = await fetch(`${API_BASE}/clinic`);
    if (!res.ok) throw new Error('Falha ao obter agendamentos clínicos');
    return res.json();
  },

  async createClinicAppointment(appt: Partial<ClinicAppointment>): Promise<ClinicAppointment> {
    const res = await fetch(`${API_BASE}/clinic`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(appt)
    });
    if (!res.ok) throw new Error('Falha ao solicitar acolhimento');
    return res.json();
  },

  // Permanência Stats
  async getPermanencia(): Promise<PermanenciaStats> {
    const res = await fetch(`${API_BASE}/permanencia`);
    if (!res.ok) throw new Error('Falha ao obter estatísticas de permanência');
    return res.json();
  },

  async submitPermanencia(survey: { mood: string; notes?: string; academicChallenge?: string; financialChallenge?: string }) {
    const res = await fetch(`${API_BASE}/permanencia`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(survey)
    });
    if (!res.ok) throw new Error('Falha ao registrar diagnóstico');
    return res.json();
  },

  // Enterprise
  async getEnterpriseData(): Promise<EnterpriseState> {
    const res = await fetch(`${API_BASE}/enterprise`);
    if (!res.ok) throw new Error('Falha ao obter dados empresariais');
    return res.json();
  },

  async updateOrgChart(organization: OrgNode[]): Promise<OrgNode[]> {
    const res = await fetch(`${API_BASE}/enterprise/organization`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ organization })
    });
    if (!res.ok) throw new Error('Falha ao atualizar organograma');
    return res.json();
  },

  async addWorkflow(workflow: Partial<Workflow>): Promise<Workflow> {
    const res = await fetch(`${API_BASE}/enterprise/workflows`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(workflow)
    });
    if (!res.ok) throw new Error('Falha ao salvar fluxo');
    return res.json();
  },

  async toggleChecklist(id: string): Promise<ChecklistItem> {
    const res = await fetch(`${API_BASE}/enterprise/checklists/${id}/toggle`, {
      method: 'PUT'
    });
    if (!res.ok) throw new Error('Falha ao alternar checklist');
    return res.json();
  },

  async addChecklist(item: Partial<ChecklistItem>): Promise<ChecklistItem> {
    const res = await fetch(`${API_BASE}/enterprise/checklists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    if (!res.ok) throw new Error('Falha ao adicionar tarefa');
    return res.json();
  },

  async updateSwot(swot: Partial<SwotData>): Promise<SwotData> {
    const res = await fetch(`${API_BASE}/enterprise/swot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(swot)
    });
    if (!res.ok) throw new Error('Falha ao salvar SWOT');
    return res.json();
  },

  async addDocument(doc: Partial<EnterpriseDocument>): Promise<EnterpriseDocument> {
    const res = await fetch(`${API_BASE}/enterprise/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(doc)
    });
    if (!res.ok) throw new Error('Falha ao salvar documento');
    return res.json();
  }
};
