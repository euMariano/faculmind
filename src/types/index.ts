export type ActiveTab =
	| "academic"
	| "opportunities"
	| "pausa-mind"
	| "virtual-room";

export interface StudentTurma {
	id: string;
	periodo?: string | null;
	codigo?: string | null;
	disciplina: string;
	turma?: string | null;
	cargaHoraria?: number | null;
	docente?: string | null;
	horario?: string | null;
	local?: string | null;
	faltas?: number | null;
	maxFaltasPermitidas?: number | null;
	totalAulas?: number | null;
	presencaPercentual?: number | null;
	notas?: {
		unidade1?: number | null;
		unidade2?: number | null;
		unidade3?: number | null;
		mediaParcial?: number | null;

		avaliacoes?: Array<{
			codigo: string;
			denominacao: string | null;
			nota: number | null;
			peso: number | null;
		}>;

		mediaAvaliacoes?: number | null;
		provaFinal?: number | null;
		resultado?: string | null;
		situacao?: string | null;
	} | null;
	notasDisponiveis?: boolean;
	status?: string | null;
}

export interface StudentAcademicRecord {
	matricula: string | null;
	name: string | null;
	course: string | null;
	center?: string | null;
	institution: string;
	currentSemester: string | null;
	cr: string | null;
	status: string | null;
	turmas: StudentTurma[];
	horasComplementares?: {
		concluidas: number | null;
		obrigatorias: number | null;
		pendentes: number | null;
	} | null;
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
	authorUid?: string;
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

// Extensão para adicionar o UID do Firebase Admin à interface Request do Express
declare global {
	namespace Express {
		interface Request {
			uid?: string;
		}
	}
}

export interface Opportunity {
	id: string;
	title: string;
	company: string;
	type: string;
	category: "Todos" | "Estágios" | "Grupos" | "Eventos" | "Bolsas";
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
	status: "Pendente" | "Em Andamento" | "Resolvido";
	priority: "Baixa" | "Média" | "Alta";
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
	status: "Pendente" | "Em Andamento" | "Concluído";
	supervisor: string;
	traineeAssigned: string;
	notes: string;
	createdAt: string;
}

export interface ChatMessage {
	id: string;
	sender: "user" | "agent";
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
