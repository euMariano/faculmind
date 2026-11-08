import {
	AlertCircle,
	BookOpen,
	CheckCircle2,
	Code,
	GraduationCap,
	RefreshCw,
	ShieldCheck,
	Sparkles,
	X,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
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
	const [activeMode, setActiveMode] = useState<"form" | "paste">("form");
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [pastedCode, setPastedCode] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [syncedData, setSyncedData] = useState<StudentAcademicRecord | null>(
		null,
	);

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
									Autenticação Real
								</span>
							</div>
							<p className="text-xs text-rose-200">
								Sincronização estrita sem simulação de dados
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
								setActiveMode("form");
								sound.playPop();
							}}
							className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
								activeMode === "form"
									? "bg-white text-ufpe-burgundy shadow-xs"
									: "text-slate-600 hover:bg-white/50"
							}`}
						>
							<ShieldCheck size={14} />
							<span>Login com SIGAA</span>
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
					</div>
				)}

				{/* Modal Content */}
				<div className="p-6 overflow-y-auto space-y-5">
					<div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-start gap-3">
						<AlertCircle
							size={20}
							className="text-amber-700 shrink-0 mt-0.5"
						/>
						<div className="text-xs text-amber-900 leading-relaxed">
							<strong>Privacidade e Segurança:</strong> O Facul Mind apenas lê os dados necessários do SIGAA para exibição no painel e contexto da assistente Agy. Suas credenciais não são armazenadas.
						</div>
					</div>

					{!syncedData ? (
						<>
							{/* MODE 1: FORM LOGIN */}
							{activeMode === "form" && (
								<div className="space-y-4 animate-in fade-in duration-150">
									<div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
										<h5 className="text-xs font-bold text-slate-800">
											Login no SIGAA
										</h5>
										<p className="text-[11px] text-slate-500 mb-2">
											Insira seu usuário e senha do SIGAA para consultar suas turmas do período.
										</p>

										<div>
											<label
												htmlFor="sigaa-username"
												className="block text-xs font-bold text-slate-800 mb-1"
											>
												Usuário (Matrícula ou CPF)
											</label>
											<input
												type="text"
												id="sigaa-username"
												value={username}
												onChange={(e) => setUsername(e.target.value)}
												placeholder="Sua matrícula ou CPF"
												className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-ufpe-burgundy"
											/>
										</div>

										<div>
											<label
												htmlFor="sigaa-password"
												className="block text-xs font-bold text-slate-800 mb-1"
											>
												Senha
											</label>
											<input
												type="password"
												id="sigaa-password"
												value={password}
												onChange={(e) => setPassword(e.target.value)}
												placeholder="Sua senha do SIGAA"
												className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-ufpe-burgundy"
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
											onClick={handleLoginSync}
											disabled={!username.trim() || !password.trim() || loading}
											className="w-full py-3 px-4 rounded-xl bg-ufpe-burgundy hover:bg-ufpe-dark disabled:opacity-40 text-white text-xs font-bold shadow-md transition flex items-center justify-center gap-2"
										>
											{loading ? (
												<RefreshCw size={15} className="animate-spin" />
											) : (
												<ShieldCheck size={15} />
											)}
											<span>Sincronizar com SIGAA</span>
										</button>
									</div>
								</div>
							)}

							{/* MODE 2: PASTE HTML */}
							{activeMode === "paste" && (
								<div className="space-y-3 animate-in fade-in duration-150">
									<div>
										<label className="block text-xs font-bold text-slate-800 mb-1">
											Cole aqui o HTML da página do SIGAA:
										</label>
										<textarea
											rows={7}
											value={pastedCode}
											onChange={(e) => setPastedCode(e.target.value)}
											placeholder="Ex: Cole o código HTML do Portal do Discente..."
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
										<span>Extrair Disciplinas</span>
									</button>
								</div>
							)}
						</>
					) : (
						/* DISPLAY DOS DADOS REAIS */
						<div className="space-y-4 animate-in fade-in duration-200">
							<div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 flex flex-wrap items-center justify-between gap-3">
								<div>
									<div className="flex items-center gap-2">
										<CheckCircle2 size={18} className="text-emerald-600" />
										<h4 className="font-extrabold text-sm text-slate-900">
											{syncedData.name || "Discente UFPE"}
										</h4>
									</div>
									<p className="text-xs text-slate-600 mt-0.5">
										Matrícula: <strong>{syncedData.matricula || "Não extraída"}</strong> • Curso:{" "}
										<strong>{syncedData.course || "Não extraído"}</strong>
									</p>
								</div>

								<div className="flex items-center gap-3">
									<div className="text-right">
										<span className="text-[10px] uppercase font-bold text-slate-500 block">
											CRA
										</span>
										<span className="text-xs font-bold text-slate-600">
											{syncedData.cra !== null && syncedData.cra !== undefined ? syncedData.cra : "Indisponível"}
										</span>
									</div>
									<div className="text-right border-l border-emerald-200 pl-3">
										<span className="text-[10px] uppercase font-bold text-slate-500 block">
											Semestre
										</span>
										<span className="text-xs font-bold text-slate-800">
											{syncedData.currentSemester || "—"}
										</span>
									</div>
								</div>
							</div>

							{/* Turmas Extraídas */}
							<div>
								<h5 className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
									<BookOpen size={15} className="text-ufpe-burgundy" />
									<span>
										Disciplinas Matriculadas ({syncedData.turmas.length}{" "}
										turmas)
									</span>
								</h5>

								{syncedData.turmas.length === 0 ? (
									<p className="text-xs text-slate-500 italic p-4 border rounded-xl text-center">
										Nenhuma disciplina encontrada para o período atual.
									</p>
								) : (
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
														{t.turma && (
															<span className="text-[10px] bg-amber-50 text-amber-700 font-semibold px-1.5 py-0.2 rounded-md border border-amber-200">
																Turma {t.turma}
															</span>
														)}
													</div>
													<p className="text-[11px] text-slate-500 mt-0.5">
														{t.horario || "Horário indisponível"} •{" "}
														{t.local || "Local indisponível"}
													</p>
												</div>

												<div className="flex items-center gap-3">
													{t.cargaHoraria && (
														<span className="text-[11px] text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-lg">
															{t.cargaHoraria}h
														</span>
													)}
													<button
														onClick={() => {
															if (onOpenChatWithSubject) {
																onOpenChatWithSubject(
																	`Tenho dúvidas sobre a disciplina ${t.disciplina}`,
																);
																onClose();
															}
														}}
														className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-ufpe-burgundy text-[11px] font-bold rounded-lg transition"
													>
														Perguntar à Agy
													</button>
												</div>
											</div>
										))}
									</div>
								)}
							</div>

							<div className="pt-2 flex items-center justify-between border-t border-slate-100">
								<span className="text-[11px] text-slate-400">
									{syncedData.source} •{" "}
									{new Date(syncedData.lastSyncAt).toLocaleTimeString("pt-BR")}
								</span>

								<button
									onClick={onClose}
									className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
								>
									Concluir
								</button>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};
