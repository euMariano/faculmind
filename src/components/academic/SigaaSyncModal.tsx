import {
	AlertCircle,
	BookOpen,
	Check,
	CheckCircle2,
	Code,
	Copy,
	ExternalLink,
	FileText,
	GraduationCap,
	Radio,
	RefreshCw,
	ShieldCheck,
	Sparkles,
	X,
} from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { api } from "../../services/api";
import { sound } from "../../services/sound";
import type { StudentAcademicRecord } from "../../types";

interface SigaaSyncModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSyncComplete: (studentData: StudentAcademicRecord) => void;
	onOpenChatWithSubject?: (subjectQuestion: string) => void;
}

export const SigaaSyncModal: React.FC<SigaaSyncModalProps> = ({
	isOpen,
	onClose,
	onSyncComplete,
	onOpenChatWithSubject,
}) => {
	const [activeMode, setActiveMode] = useState<"form" | "paste" | "demo">(
		"form",
	);
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [pastedCode, setPastedCode] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [syncedData, setSyncedData] = useState<StudentAcademicRecord | null>(
		null,
	);

	// O polling de background e o bookmarklet não são mais necessários para o método de formulário.
	// O método de "2 abas seguras" foi substituído pelo login direto via formulário.

	if (!isOpen) return null;

	const handleLoginSync = async () => {
		if (!username.trim() || !password.trim()) {
			setError("Por favor, preencha seu usuário e senha do SIGAA.");
			return;
		}

		setLoading(true);
		setError(null);
		sound.playPop();

		try {
			const res = await api.syncUniversity({ username, password });
			if (res.success && res.student) {
				sound.playSuccess();
				setSyncedData(res.student);
				onSyncComplete(res.student);
			} else if (res.error) {
				setError(res.error);
			}
		} catch (err: any) {
			setError(err.message || "Falha ao sincronizar com o SIGAA. Verifique suas credenciais.");
		} finally {
			setLoading(false);
		}
	};

	const handleImportPastedCode = async () => {
		if (!pastedCode.trim()) return;
		setLoading(true);
		setError(null);
		sound.playPop();

		try {
			const res = await api.importUniversityData({ html: pastedCode });
			sound.playSuccess();
			setSyncedData(res.student);
			onSyncComplete(res.student);
		} catch (err: any) {
			setError(
				err.message || "Não foi possível extrair dados do conteúdo colado.",
			);
		} finally {
			setLoading(false);
		}
	};

	const handleDemoSync = async () => {
		setLoading(true);
		setError(null);
		sound.playPop();

		try {
			const res = await api.syncUniversity({ demoMode: true });
			if (res.success && res.student) {
				sound.playSuccess();
				setSyncedData(res.student);
				onSyncComplete(res.student);
			}
		} catch (err: any) {
			setError(err.message || "Falha ao carregar demonstração.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
			<div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
				{/* Header */}
				<div className="bg-ufpe-burgundy text-white px-6 py-4 flex items-center justify-between shrink-0 shadow-xs">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-2xl bg-white/10 ring-1 ring-white/20 flex items-center justify-center shadow-xs">
							<GraduationCap size={22} className="text-white" />
						</div>
						<div>
							<div className="flex items-center gap-2">
								<h3 className="font-extrabold text-base tracking-tight">
									Sincronização SIGAA UFPE
								</h3>
								<span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-900/80 text-rose-200 border border-rose-300/20">
									Login Direto
								</span>
							</div>
							<p className="text-xs text-rose-200">
								Use seu usuário e senha do SIGAA para transferir seus dados
							</p>
						</div>
					</div>

					<button
						onClick={onClose}
						className="w-8 h-8 rounded-xl hover:bg-white/10 text-rose-100 hover:text-white flex items-center justify-center transition"
					>
						<X size={18} />
					</button>
				</div>

				{/* Tab Selector */}
				{!syncedData && (
					<div className="bg-slate-100/80 border-b border-slate-200 p-2 flex gap-1.5 shrink-0">
						<button
							onClick={() => {
								setActiveMode("2tabs");
								sound.playPop();
							}}
							className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
								activeMode === "2tabs"
									? "bg-white text-ufpe-burgundy shadow-xs"
									: "text-slate-600 hover:bg-white/50"
							}`}
						>
							<ExternalLink size={14} />
							<span>Sincronização em 2 Abas (Recomendada)</span>
						</button>

						<button
							onClick={() => {
								setActiveMode("paste");
								sound.playPop();
							}}
							className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
								activeMode === "paste"
									? "bg-white text-ufpe-burgundy shadow-xs"
									: "text-slate-600 hover:bg-white/50"
							}`}
						>
							<Code size={14} />
							<span>Colar Código da Página</span>
						</button>

						<button
							onClick={() => {
								setActiveMode("demo");
								sound.playPop();
							}}
							className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
								activeMode === "demo"
									? "bg-white text-ufpe-burgundy shadow-xs"
									: "text-slate-600 hover:bg-white/50"
							}`}
						>
							<Sparkles size={14} />
							<span>Exemplo UFPE</span>
						</button>
					</div>
				)}

				{/* Modal Content */}
				<div className="p-6 overflow-y-auto space-y-5">
					{/* Security & Privacy Banner */}
					<div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-start gap-3">
						<ShieldCheck
							size={20}
							className="text-emerald-700 shrink-0 mt-0.5"
						/>
						<div className="text-xs text-emerald-900 leading-relaxed">
							<strong>100% Seguro (Conformidade LGPD):</strong> Você faz login{" "}
							<strong>diretamente no site oficial da UFPE</strong>. Nenhuma
							senha trafega pelo Facul Mind.
						</div>
					</div>

					{!syncedData ? (
						<>
							{/* MODE 1: 2 TABS WORKFLOW */}
							{activeMode === "2tabs" && (
								<div className="space-y-4 animate-in fade-in duration-150">
									{/* Step 1 */}
									<div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2">
										<div className="flex items-center justify-between">
											<span className="text-[11px] font-extrabold uppercase tracking-wide text-ufpe-burgundy">
												Passo 1 de 2: Abrir o SIGAA
											</span>
											<span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full">
												Aba Oficial
											</span>
										</div>

										<p className="text-xs text-slate-600">
											Clique no botão abaixo para abrir o SIGAA em uma segunda
											aba e faça seu login discente normalmente.
										</p>

										<button
											onClick={handleOpenSigaaTab}
											className="w-full py-3 px-4 rounded-xl bg-ufpe-burgundy hover:bg-ufpe-dark text-white text-xs font-bold shadow-md transition flex items-center justify-center gap-2"
										>
											<ExternalLink size={16} />
											<span>Abrir SIGAA UFPE em Nova Aba</span>
										</button>
									</div>

									{/* Step 2 */}
									<div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
										<div className="flex items-center justify-between">
											<span className="text-[11px] font-extrabold uppercase tracking-wide text-emerald-800">
												Passo 2 de 2: Conectar com o Facul Mind
											</span>
											<span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
												Instantâneo
											</span>
										</div>

										<p className="text-xs text-slate-600 leading-relaxed">
											Após logar no SIGAA e entrar no{" "}
											<strong>Portal do Discente</strong> (onde aparecem suas
											turmas), transfira os dados para o Facul Mind usando uma
											das opções:
										</p>

										<div className="space-y-2 pt-1">
											{/* Option A: Draggable Bookmarklet */}
											<div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
												<div>
													<strong className="text-xs text-amber-950 block">
														Opção A (Mais fácil): Botão Favorito
													</strong>
													<span className="text-[11px] text-amber-800">
														Arraste este botão para sua barra de favoritos. Na
														aba do SIGAA, clique nele!
													</span>
												</div>

												<a
													href={bookmarkletCode}
													onClick={(e) => {
														e.preventDefault();
														alert(
															'Arraste este botão "⚡ Sincronizar Facul Mind" para a barra de favoritos do seu navegador, ou use a Opção B para copiar o código!',
														);
													}}
													className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl font-extrabold text-xs shadow-xs cursor-grab active:cursor-grabbing text-center whitespace-nowrap"
												>
													⚡ Sincronizar Facul Mind
												</a>
											</div>

											{/* Option B: Copy 1-Line Script */}
											<div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
												<div>
													<strong className="text-xs text-slate-900 block">
														Opção B: Copiar Comando
													</strong>
													<span className="text-[11px] text-slate-500">
														Cole no console da aba do SIGAA (F12 &gt Console) e
														dê Enter.
													</span>
												</div>

												<button
													onClick={handleCopyScript}
													className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 rounded-xl font-bold text-xs flex items-center gap-1.5 transition"
												>
													{copiedScript ? (
														<Check size={14} className="text-emerald-600" />
													) : (
														<Copy size={14} />
													)}
													<span>{copiedScript ? "Copiado!" : "Copiar"}</span>
												</button>
											</div>
										</div>

										{/* Waiting Indicator */}
										{isWaitingForSync && (
											<div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center gap-3 animate-pulse">
												<Radio
													size={18}
													className="text-emerald-600 animate-ping shrink-0"
												/>
												<div>
													<span className="text-xs font-bold text-emerald-950 block">
														Aguardando dados da aba do SIGAA...
													</span>
													<span className="text-[11px] text-emerald-800">
														Assim que você clicar no botão na aba do SIGAA, esta
														tela atualizará automaticamente!
													</span>
												</div>
											</div>
										)}
									</div>
								</div>
							)}

							{/* MODE 2: PASTE HTML / TEXT */}
							{activeMode === "paste" && (
								<div className="space-y-3 animate-in fade-in duration-150">
									<div>
										<label className="block text-xs font-bold text-slate-800 mb-1">
											Cole aqui o código ou o texto da tela de turmas do SIGAA:
										</label>
										<p className="text-[11px] text-slate-500 mb-2">
											Na aba do SIGAA, pressione <strong>Ctrl+A</strong> e{" "}
											<strong>Ctrl+C</strong> (ou clique com botão direito &gt
											Exibir código-fonte) e cole abaixo:
										</p>
										<textarea
											rows={7}
											value={pastedCode}
											onChange={(e) => setPastedCode(e.target.value)}
											placeholder="Ex: Cole aqui o HTML ou a tabela de turmas copiada do SIGAA..."
											className="w-full text-xs p-3 rounded-2xl border border-slate-200 font-mono bg-slate-50 focus:bg-white focus:border-ufpe-burgundy"
										/>
									</div>

									{error && (
										<div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
											<AlertCircle
												size={16}
												className="text-rose-600 shrink-0"
											/>
											<span>{error}</span>
										</div>
									)}

									<button
										onClick={handleImportPastedCode}
										disabled={!pastedCode.trim() || loading}
										className="w-full py-3 px-4 rounded-xl bg-ufpe-burgundy hover:bg-ufpe-dark disabled:opacity-40 text-white text-xs font-bold shadow-md transition flex items-center justify-center gap-2"
									>
										{loading ? (
											<RefreshCw size={15} className="animate-spin" />
										) : (
											<Sparkles size={15} />
										)}
										<span>Importar e Extrair Disciplinas</span>
									</button>
								</div>
							)}

							{/* MODE 3: DEMO ENVIRONMENT */}
							{activeMode === "demo" && (
								<div className="space-y-4 animate-in fade-in duration-150">
									<div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/60 space-y-2">
										<h5 className="text-xs font-bold text-amber-950">
											Ambiente de Demonstração / Validação
										</h5>
										<p className="text-xs text-amber-900 leading-relaxed">
											Caso esteja fora do campus ou sem acesso imediato às
											credenciais da UFPE agora, você pode carregar o perfil
											demonstrativo estruturado conforme a matriz do curso para
											validar todo o fluxo e as respostas do Agente IA.
										</p>
									</div>

									<button
										onClick={handleDemoSync}
										disabled={loading}
										className="w-full py-3 px-4 rounded-xl bg-ufpe-burgundy hover:bg-ufpe-dark text-white text-xs font-bold shadow-md transition flex items-center justify-center gap-2"
									>
										{loading ? (
											<RefreshCw size={15} className="animate-spin" />
										) : (
											<Sparkles size={15} />
										)}
										<span>Carregar Grade Real Demonstrativa UFPE</span>
									</button>
								</div>
							)}
						</>
					) : (
						/* SUCCESS DISPLAY */
						<div className="space-y-4 animate-in fade-in duration-200">
							<div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 flex flex-wrap items-center justify-between gap-3">
								<div>
									<div className="flex items-center gap-2">
										<CheckCircle2 size={18} className="text-emerald-600" />
										<h4 className="font-extrabold text-sm text-slate-900">
											{syncedData.name}
										</h4>
									</div>
									<p className="text-xs text-slate-600 mt-0.5">
										Matrícula: <strong>{syncedData.matricula}</strong> • Curso:{" "}
										<strong>{syncedData.course}</strong>
									</p>
								</div>

								<div className="flex items-center gap-3">
									<div className="text-right">
										<span className="text-[10px] uppercase font-bold text-slate-500 block">
											CRA
										</span>
										<span className="text-base font-extrabold text-emerald-800">
											{syncedData.cra}
										</span>
									</div>
									<div className="text-right border-l border-emerald-200 pl-3">
										<span className="text-[10px] uppercase font-bold text-slate-500 block">
											Semestre
										</span>
										<span className="text-xs font-bold text-slate-800">
											{syncedData.currentSemester}
										</span>
									</div>
								</div>
							</div>

							{/* Turmas List */}
							<div>
								<h5 className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
									<BookOpen size={15} className="text-ufpe-burgundy" />
									<span>
										Disciplinas Cursadas no Semestre ({syncedData.turmas.length}{" "}
										turmas)
									</span>
								</h5>

								<div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 text-xs">
									{syncedData.turmas.map((t) => (
										<div
											key={t.id}
											className="p-3 bg-white hover:bg-slate-50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-2"
										>
											<div>
												<div className="flex items-center gap-2">
													<span className="font-bold text-slate-900">
														{t.disciplina}
													</span>
													{t.codigo && (
														<span className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-1.5 py-0.2 rounded-md">
															{t.codigo}
														</span>
													)}
												</div>
												<p className="text-[11px] text-slate-500 mt-0.5">
													{t.horario || "Turno Regular"} •{" "}
													{t.local || "Campus Recife"}
												</p>
											</div>

											<div className="flex items-center gap-4 text-right">
												<div>
													<span className="text-[10px] text-slate-400 block">
														Faltas / Limite
													</span>
													<span
														className={`font-bold ${t.faltas >= 6 ? "text-amber-600" : "text-slate-700"}`}
													>
														{t.faltas} / {t.maxFaltasPermitidas}
													</span>
												</div>

												<div>
													<span className="text-[10px] text-slate-400 block">
														Média
													</span>
													<span className="font-extrabold text-slate-900">
														{t.notas?.mediaParcial !== null &&
														t.notas?.mediaParcial !== undefined
															? t.notas.mediaParcial.toFixed(1)
															: "—"}
													</span>
												</div>

												<button
													onClick={() => {
														if (onOpenChatWithSubject) {
															onOpenChatWithSubject(
																`Como estou em ${t.disciplina}?`,
															);
															onClose();
														}
													}}
													className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-ufpe-burgundy text-[11px] font-bold rounded-lg transition"
													title="Perguntar à IA sobre esta disciplina"
												>
													Perguntar à Agy
												</button>
											</div>
										</div>
									))}
								</div>
							</div>

							{/* Footer Actions */}
							<div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
								<span className="text-[11px] text-slate-400">
									{syncedData.source} •{" "}
									{new Date(syncedData.lastSyncAt).toLocaleTimeString("pt-BR")}
								</span>

								<div className="flex gap-2">
									<button
										onClick={() => {
											if (onOpenChatWithSubject) {
												onOpenChatWithSubject("Como estou em Cálculo?");
												onClose();
											}
										}}
										className="px-4 py-2 bg-ufpe-burgundy text-white text-xs font-bold rounded-xl shadow-xs hover:bg-ufpe-dark transition flex items-center gap-1.5"
									>
										<Sparkles size={14} className="text-amber-300" />
										<span>Perguntar para a IA</span>
									</button>
									<button
										onClick={onClose}
										className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
									>
										Concluir
									</button>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};
