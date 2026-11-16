import {
	ArrowRight,
	BookOpen,
	Calendar,
	ChevronRight,
	Coins,
	ExternalLink,
	FileText,
	GraduationCap,
	HelpCircle,
	MessageSquare,
	ShieldAlert,
	Sparkles,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { sound } from "../../services/sound";
import type { StudentAcademicRecord } from "../../types";
import { OmbudsmanModal } from "./OmbudsmanModal";
import { SigaaSyncModal } from "./SigaaSyncModal";

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
	onSyncStudent,
}) => {
	const [showOmbudsmanModal, setShowOmbudsmanModal] = useState(false);
	const [showSigaaModal, setShowSigaaModal] = useState(false);

	const quickCards = [
		{
			id: "calendario",
			title: "Calendário Acadêmico",
			icon: Calendar,
			desc: "Prazos de matrícula, provas, trancamento e feriados.",
			action: () => openChat("agy-ufpe"),
		},
		{
			id: "sigaa",
			title: "Matrícula e SIGAA",
			icon: GraduationCap,
			desc: "Sincronizar turmas, faltas e notas em tempo real.",
			action: () => setShowSigaaModal(true),
		},
		{
			id: "bolsas",
			title: "Bolsas e Auxílios",
			icon: Coins,
			desc: "Auxílio permanência, bolsas PROAES, RU e moradia.",
			action: () => navigateToTab("opportunities"),
		},
		{
			id: "disciplinas",
			title: "Disciplinas e Notas",
			icon: BookOpen,
			desc: "Horas complementares, faltas e cálculo de médias.",
			action: () => setShowSigaaModal(true),
		},
		{
			id: "editais",
			title: "Editais e Seleções",
			icon: FileText,
			desc: "Estágios, bolsas de pesquisa (PIBIC) e monitorias.",
			action: () => navigateToTab("opportunities"),
		},
		{
			id: "faq",
			title: "Dúvidas Frequentes",
			icon: HelpCircle,
			desc: "Respostas rápidas validadas pelo regimento da UFPE.",
			action: () => openChat("agy-ufpe"),
		},
	];

	return (
		<div className="space-y-6 pb-12">
			{/* UFPE Subheader Branding (Matches WhatsApp Image 2026-11-06 at 20.26.53.jpeg) */}
			<div className="bg-ufpe-burgundy text-white px-4 sm:px-6 py-2.5 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-3">
				<div className="flex items-center gap-3">
					<div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-bold text-xs ring-1 ring-white/20">
						UFPE
					</div>
					<div>
						<h1 className="text-sm font-bold leading-tight">
							Universidade Federal de Pernambuco
						</h1>
						<p className="text-[11px] text-rose-200">
							Portal de Assistência e Permanência Discente
						</p>
					</div>
				</div>

				<div className="hidden md:flex items-center gap-4 text-xs font-medium text-rose-100">
					<span className="hover:text-white cursor-pointer transition">
						Estudante
					</span>
					<span className="hover:text-white cursor-pointer transition">
						Cursos
					</span>
					<span className="hover:text-white cursor-pointer transition">
						Serviços
					</span>
					<button
						onClick={() => {
							setShowSigaaModal(true);
							sound.playPop();
						}}
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
									<h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
										FaculMind
									</h2>
									<p className="text-xs font-bold uppercase tracking-wider text-rose-200">
										Sua assistente virtual na UFPE
									</p>
								</div>
							</div>

							<p className="text-sm sm:text-base text-rose-100 font-normal leading-relaxed pt-1">
								Tire dúvidas sobre disciplinas e SIGAA, encontre estágios e
								bolsas, receba orientações e conte com apoio acolhedor para uma
								jornada acadêmica mais leve e sem interrupções.
							</p>
						</div>

						{/* CTA Buttons */}
						<div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
							<button
								onClick={() => {
									openChat("agy-ufpe");
									sound.playPop();
								}}
								className="px-6 py-3 rounded-2xl bg-white text-ufpe-burgundy hover:bg-rose-50 font-bold text-sm shadow-lg shadow-black/20 hover:shadow-xl transition transform active:scale-95 flex items-center gap-2"
							>
								<MessageSquare size={18} className="text-ufpe-burgundy" />
								<span>Conversar com a FaculMind</span>
								<ChevronRight size={16} />
							</button>

							<button
								onClick={() => {
									navigateToTab("pausa-mind");
									sound.playPop();
								}}
								className="px-5 py-3 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-semibold text-sm backdrop-blur-xs transition flex items-center gap-2"
							>
								<Sparkles size={16} className="text-amber-300" />
								<span>Pausa Mind (Relax)</span>
							</button>
						</div>
					</div>

					{/* Right Column: Visual Mascot Preview / Interactive Prompt */}
					<div className="relative shrink-0 flex flex-col items-center">
						<div
							className="relative group cursor-pointer"
							onClick={() => openChat("agy-ufpe")}
						>
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
								<h4 className="font-extrabold text-sm text-slate-900">
									{syncedStudent.name}
								</h4>
								<span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
									SIGAA Conectado
								</span>
							</div>
							<p className="text-xs text-slate-500 mt-0.5">
								Curso: <strong>{syncedStudent.course}</strong> • CR:{" "}
								<strong className="text-emerald-700">
									{syncedStudent.cr ?? "Indisponível"}
								</strong>{" "}
								• {syncedStudent.turmas.length} turmas monitoradas
							</p>
						</div>
					</div>

					<div className="flex flex-wrap items-center gap-2">
						<button
							onClick={() => {
								openChat("agy-ufpe", "Como estou em Cálculo?");
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
					<h3 className="text-base font-bold text-slate-800">
						Acesso Rápido aos Serviços UFPE
					</h3>
					<span className="text-xs text-slate-500">
						Clique para abrir detalhes com a IA
					</span>
				</div>

				<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
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

			{/* Ouvidoria Anônima Section */}
			<div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition">
				<div className="space-y-3 max-w-2xl">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
							<ShieldAlert size={20} />
						</div>
						<div>
							<div className="flex items-center gap-2">
								<h4 className="font-bold text-base text-slate-800">
									Da Reclamação à Solução
								</h4>
								<span className="text-[10px] bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full font-bold">
									100% Anônimo
								</span>
							</div>
							<p className="text-xs text-slate-500">
								Ouvidoria Discente e Canal de Manifestações UFPE
							</p>
						</div>
					</div>

					<p className="text-xs text-slate-600 leading-relaxed">
						Encontrou problemas com ar-condicionado, conflito de horários de
						disciplinas ou atendimento departamental? Registre com pseudônimo
						e receba protocolo oficial rastreável.
					</p>

					<div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 space-y-1 text-xs">
						<div className="flex items-center justify-between font-bold text-slate-700">
							<span>Protocolos em Resolução</span>
							<span className="text-ufpe-burgundy">2 ativos</span>
						</div>
						<p className="text-[11px] text-slate-500">
							SIB/UFPE: Extensão de horário da Biblioteca Noturna em
							deliberação.
						</p>
					</div>
				</div>

				<div className="shrink-0">
					<button
						onClick={() => {
							setShowOmbudsmanModal(true);
							sound.playPop();
						}}
						className="w-full md:w-auto py-3 px-6 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-xs"
					>
						<span>Registrar Manifestação Segura</span>
						<ArrowRight size={14} />
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
						"A FACUL MIND não é um custo para a faculdade, é um investimento que
						se paga sozinho ao evitar que 2 ou 3 alunos tranquem a matrícula por
						mês."
					</p>
				</div>
				<div className="grid grid-cols-2 md:grid-cols-3 gap-3 shrink-0">
					<div className="p-2 flex flex-col items-center">
						<span className="text-lg">🎯</span>
						<span className="text-xs font-bold text-slate-800 mt-1">
							-42% Evasão
						</span>
						<span className="text-[10px] text-slate-500">
							Média em pilotos IES
						</span>
					</div>
					<div className="p-2 flex flex-col items-center">
						<span className="text-lg">⚡</span>
						<span className="text-xs font-bold text-slate-800 mt-1">
							Mais Autonomia
						</span>
						<span className="text-[10px] text-slate-500">
							Menos dúvidas e retrabalho
						</span>
					</div>
					<div className="p-2 flex flex-col items-center col-span-2 md:col-span-1">
						<span className="text-lg">🤍</span>
						<span className="text-xs font-bold text-slate-800 mt-1">
							UFPE Acolhedora
						</span>
						<span className="text-[10px] text-slate-500">
							Jornada universitária integrada
						</span>
					</div>
				</div>
			</div>

			{/* Modals */}
			<OmbudsmanModal
				isOpen={showOmbudsmanModal}
				onClose={() => setShowOmbudsmanModal(false)}
			/>

			<SigaaSyncModal
				isOpen={showSigaaModal}
				onClose={() => setShowSigaaModal(false)}
				onSyncComplete={(data) => {
					if (onSyncStudent) onSyncStudent(data);
				}}
				onOpenChatWithSubject={(question) => {
					openChat("agy-ufpe", question);
				}}
			/>
		</div>
	);
};
