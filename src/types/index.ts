export type ActiveTab = 
  | 'academic' 
  | 'opportunities' 
  | 'pausa-mind' 
  | 'virtual-room' 
  | 'coordinator' 
  | 'enterprise';

export interface StudentTurma {
  id: string;
  codigo?: string;
  disciplina: string;
  turma?: string;
  docente?: string;
  horario?: string;
  local?: string;
  faltas: number;
  maxFaltasPermitidas: number;
  totalAulas?: number;
  presencaPercentual: number;
  notas: {
    unidade1?: number | null;
    unidade2?: number | null;
    unidade3?: number | null;
    mediaParcial?: number | null;
  };
  status: string;
}

export interface StudentAcademicRecord {
  matricula: string;
  name: string;
  course: string;
  center?: string;
  institution: string;
  currentSemester: string;
  cra: number;
  status: string;
  turmas: StudentTurma[];
  horasComplementares?: {
    concluidas: number;
    obrigatorias: number;
    pendentes: number;
  };
  alerts?: string[];
  lastSyncAt: string;
  source: string;
}

export interface UniversityNotice {
  title: string;
  url: string;
  source: string;
}

export interface PostIt {
  id: string | number;
  author: string;
  avatar?: string;
  text: string;
  tag: string;
  color: string;
  likes: number;
  createdAt?: string;
}

export interface CoffeeChatMessage {
  id?: string;
  user: string;
  text: string;
  time: string;
  timestamp?: string;
}

export interface Opportunity {
  id: string;
  title: string;
  company: string;
  type: string;
  category: 'Todos' | 'Estágios' | 'Grupos' | 'Eventos' | 'Bolsas';
  location: string;
  remuneration: string;
  hours: string;
  courseMatch: string[];
  description: string;
  requirements: string;
  deadline: string;
  urgent: boolean;
  postedBy: string;
  applicants: number;
}

export interface Ticket {
  id: string;
  studentNickname: string;
  course: string;
  subject: string;
  category: string;
  description: string;
  status: 'Pendente' | 'Em Andamento' | 'Resolvido';
  priority: 'Baixa' | 'Média' | 'Alta';
  createdAt: string;
  updatedAt: string;
  response: string;
  department: string;
}

export interface ClinicAppointment {
  id: string;
  studentNickname: string;
  course: string;
  shift: string;
  urgency: string;
  preferredDays: string;
  reasonCategory: string;
  status: 'Pendente' | 'Em Andamento' | 'Concluído';
  supervisor: string;
  traineeAssigned: string;
  notes: string;
  createdAt: string;
}

export interface PermanenciaStats {
  totalResponses: number;
  retentionRate: number;
  engagementScore: number;
  moodStats: {
    focado: number;
    ansioso: number;
    exausto: number;
    disposto: number;
  };
  riskAlerts: Array<{
    course: string;
    riskLevel: 'Baixo' | 'Médio' | 'Alto';
    mainCause: string;
    affectedCount: number;
  }>;
}

export interface OrgNode {
  id: string;
  title: string;
  name: string;
  role: string;
  department: string;
  level: number;
  reportsTo: string | null;
  responsibilities: string[];
}

export interface WorkflowStep {
  order: number;
  name: string;
  actor: string;
  action: string;
  time: string;
}

export interface Workflow {
  id: string;
  name: string;
  agent: string;
  trigger: string;
  steps: WorkflowStep[];
  mermaid: string;
  bottlenecks: string[];
}

export interface ChecklistItem {
  id: string;
  text: string;
  status: 'A Fazer' | 'Em Andamento' | 'Concluído';
  assignedTo: string;
  dueDate: string;
}

export interface Plan5W2H {
  what: string;
  why: string;
  where: string;
  when: string;
  who: string;
  how: string;
  howMuch: string;
}

export interface SwotData {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  plan5W2H: Plan5W2H[];
}

export interface EnterpriseDocument {
  id: string;
  title: string;
  type: string;
  agent: string;
  createdAt: string;
  content: string;
}

export interface EnterpriseState {
  companyName: string;
  organization: OrgNode[];
  workflows: Workflow[];
  checklists: ChecklistItem[];
  swot: SwotData;
  documents: EnterpriseDocument[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  agentName?: string;
  avatar?: string;
  text: string;
  timestamp: string;
  suggestions?: string[];
  quickAction?: {
    type: string;
    target: string;
    label: string;
  };
}
