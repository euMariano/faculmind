import { db } from "../config/firebaseAdmin.js";

const INITIAL_DATA = {
	opportunities: [
		{
			id: "vaga-1",
			title: "Estágio em Administração e Suporte Secretarial",
			company: "Inova Consultoria & Gestão",
			type: "Estágio",
			category: "Estágios",
			location: "Presencial • Recife Antigo",
			remuneration: "R$ 1.200,00 + VT",
			hours: "6h diárias (13h às 19h)",
			courseMatch: [
				"Secretariado Executivo",
				"Administração",
				"Gestão da Informação",
			],
			description:
				"Apoio no mapeamento de processos administrativos, organização de reuniões executivas, elaboração de atas e contato com clientes.",
			requirements:
				"Estar cursando a partir do 3º período. Conhecimento em pacote Office/Google Workspace. Proatividade e boa comunicação.",
			deadline: "2026-11-20",
			urgent: true,
			postedBy: "Coordenação de Secretariado Executivo",
			applicants: 12,
			editalUrl: "https://fade.org.br/wp-content/uploads/2026/11/Edital-110_2026-assinado.pdf",
		},
		{
			id: "vaga-3",
			title: "Palestra: O Futuro do Trabalho, Secretariado e IA",
			company: "Auditório Denis Bernardes (CCSA/UFPE)",
			type: "Evento",
			category: "Eventos",
			location: "Auditório B • 12/Nov às 14:00",
			remuneration: "Certificado 4h complementares",
			hours: "14:00 às 17:30",
			courseMatch: [
				"Secretariado Executivo",
				"Administração",
				"Ciência da Computação",
				"Psicologia",
			],
			description:
				"Palestra Magna sobre o impacto de Agentes de Inteligência Artificial na rotina corporativa e secretarial. Demonstração de ferramentas de orquestração e fluxogramas inteligentes.",
			requirements: "Inscrições gratuitas com emissão de certificado oficial.",
			deadline: "2026-11-12",
			urgent: false,
			postedBy: "Parceria DACE / DTI UFPE",
			applicants: 84,
			editalUrl: "https://docs.google.com/forms/d/e/1FAIpQLSc47V4gGdXz5NbK4LLY9ktrJwYgRvvfGeHPq4TrrGy6_dAyWA/viewform",
		},
		{
			id: "vaga-4",
			title: "Bolsa de Iniciação Científica (PIBIC): Retenção Estudantil e IA",
			company: "Laboratório de Tecnologia e Bem-Estar Acadêmico",
			type: "Bolsa",
			category: "Bolsas",
			location: "UFPE - Campus Recife",
			remuneration: "R$ 700,00 / mês",
			hours: "20h semanais",
			courseMatch: [
				"Psicologia",
				"Ciência da Computação",
				"Secretariado Executivo",
				"Pedagogia",
			],
			description:
				"Pesquisa aplicada sobre métodos preditivos anônimos para redução de evasão universitária, monitoramento de sentimentos e promoção de saúde mental em universidades públicas.",
			requirements:
				"Disponibilidade de 20h, CRA superior a 6.5, não ter reprovação ativa em disciplinas obrigatórias.",
			deadline: "2026-11-28",
			urgent: false,
			postedBy: "PROPESQ / Pró-Reitoria de Pesquisa",
			applicants: 29,
			editalUrl: "https://www2.facepe.br/wp-content/uploads/2026/08/Edital_FACEPE___28_2026___APQ_Universal_Final__2_.pdf",
		},
		{
			id: "vaga-5",
			title: "Auxílio Permanência e Moradia 2026.1",
			company: "PROAES - Pró-Reitoria de Assuntos Estudantis",
			type: "Auxílio",
			category: "Bolsas",
			location: "UFPE - Reitoria",
			remuneration: "R$ 550,00 / mês + RU gratuito",
			hours: "Semestre 2026.1 e 2026.2",
			courseMatch: ["Todos os Cursos de Graduação"],
			description:
				"Programa de apoio socioeconômico prioritário para discentes com renda per capita familiar de até 1,5 salário mínimo. Inclui isenção total no Restaurante Universitário.",
			requirements:
				"Comprovação de vulnerabilidade pelo Cadastro PROAES e estar devidamente matriculado.",
			deadline: "2026-11-30",
			urgent: true,
			postedBy: "PROAES UFPE",
			applicants: 156,
			editalUrl: "https://www2.facepe.br/wp-content/uploads/2026/11/36_2026_EDITAL_FACEPE_CTI-nosMuseus-de-PE-2027.pdf",
		},
		{
			id: "vaga-fade-110",
			title: "Analista de Processos de Negócio I | Cadastro Reserva (Edital 110/2026)",
			company: "Fade-UFPE",
			type: "Estágio / Processo Seletivo",
			category: "Estágios",
			location: "Fade-UFPE • Recife / PE",
			remuneration: "Compatível com o Mercado (Edital Fade)",
			hours: "Horário comercial / Conforme Edital",
			courseMatch: [
				"Administração",
				"Gestão Financeira",
				"Ciências Econômicas",
				"Ciências Contábeis",
				"Secretariado Executivo",
			],
			description:
				"Edital 110/2026 da Fade-UFPE para cadastro de reserva de Analista de Processos de Negócio I. Atuação com análise de cláusulas contratuais, gestão de riscos jurídicos/financeiros, compliance e softwares CLM (SAP Ariba, DocuSign, TOTVS).",
			requirements:
				"Graduação concluída em Gestão Financeira, Administração, Ciências Econômicas ou Ciências Contábeis. Interpretação contratual, gestão de KPIs e visão de processos.",
			deadline: "2026-11-30",
			urgent: true,
			postedBy: "Fade-UFPE",
			applicants: 34,
			editalUrl: "https://fade.org.br/wp-content/uploads/2026/11/Edital-110_2026-assinado.pdf",
		},
		{
			id: "vaga-fade-assistente-projetos",
			title: "Assistente Administrativo | Projetos & Documentação Institucional",
			company: "Fade-UFPE",
			type: "Estágio / CLT",
			category: "Estágios",
			location: "Presencial • Fade-UFPE (Recife)",
			remuneration: "Salário compatível + VA + VT + Plano de Saúde",
			hours: "8h diárias (08h às 17h, seg a sex)",
			courseMatch: [
				"Administração",
				"Secretariado Executivo",
				"Gestão da Informação",
				"Áreas Afins",
			],
			description:
				"Formatação e padronização de projetos institucionais, revisão documental, estruturação de relatórios e apoio técnico à equipe executiva. Vaga ampliada também para PCD.",
			requirements:
				"Ensino Superior Completo em Administração ou áreas afins. Pacote Office intermediário (Word/Excel), boa redação e organização.",
			deadline: "2026-10-23",
			urgent: false,
			postedBy: "Fade-UFPE",
			applicants: 42,
			editalUrl: "https://docs.google.com/forms/d/e/1FAIpQLSc47V4gGdXz5NbK4LLY9ktrJwYgRvvfGeHPq4TrrGy6_dAyWA/viewform",
		},
		{
			id: "vaga-fade-assistente-patrimonio",
			title: "Assistente Administrativo | Gestão de Patrimônio & Inventários",
			company: "Fade-UFPE",
			type: "Estágio / CLT",
			category: "Estágios",
			location: "Presencial • Fade-UFPE (Recife)",
			remuneration: "Salário compatível + VA + VT + Saúde e Odontológico",
			hours: "8h diárias (08h às 17h, seg a sex)",
			courseMatch: [
				"Administração",
				"Ciências Contábeis",
				"Secretariado Executivo",
				"Gestão Pública",
			],
			description:
				"Atuação em registros patrimoniais, tombamento de bens, auditoria documental, inventários periódicos e fluxos de transferência institucional. Vaga ampliada para PCD.",
			requirements:
				"Ensino Superior Completo em Administração ou áreas afins. Senso analítico, rigor técnico, planejamento e comunicação assertiva.",
			deadline: "2026-07-20",
			urgent: false,
			postedBy: "Fade-UFPE",
			applicants: 28,
			editalUrl: "https://docs.google.com/forms/d/e/1FAIpQLSc47V4gGdXz5NbK4LLY9ktrJwYgRvvfGeHPq4TrrGy6_dAyWA/viewform",
		},
		{
			id: "vaga-facepe-museus",
			title: "Edital FACEPE 36/2026 | CT&I nos Museus de Pernambuco 2027",
			company: "FACEPE / SECTI-PE",
			type: "Bolsa de Pesquisa",
			category: "Bolsas",
			location: "Museus e Espaços Científico-Culturais de PE",
			remuneration: "R$ 700,00 / mês (Bolsas BCT) + Custeio",
			hours: "20h semanais",
			courseMatch: [
				"História",
				"Arqueologia",
				"Museologia",
				"Ciência da Computação",
				"Design",
				"Todas as Graduações",
			],
			description:
				"Apoio a projetos de pesquisa e divulgação científica integrando Ciência, Tecnologia e Inovação (CT&I) aos acervos, planetários e ações educativas de museus e espaços culturais de PE.",
			requirements:
				"Vínculo a instituições de pesquisa ou espaços culturais do estado de Pernambuco. Concessão de cotas de bolsas para estudantes.",
			deadline: "2026-12-20",
			urgent: true,
			postedBy: "FACEPE / SECTI-PE",
			applicants: 51,
			editalUrl: "https://www2.facepe.br/wp-content/uploads/2026/11/36_2026_EDITAL_FACEPE_CTI-nosMuseus-de-PE-2027.pdf",
		},
		{
			id: "vaga-facepe-prostartups",
			title: "Edital FACEPE 33/2026 | Programa Pró-Startups: Operação",
			company: "FACEPE / Inova PE",
			type: "Bolsa & Fomento",
			category: "Bolsas",
			location: "Startups & Incubadoras de Pernambuco",
			remuneration: "R$ 15.000 a R$ 105.000 por fase + Bolsas",
			hours: "Dedicação conforme plano de trabalho",
			courseMatch: [
				"Ciência da Computação",
				"Engenharias",
				"Administração",
				"Design",
				"Sistemas de Informação",
			],
			description:
				"Apoio a empreendedores e startups de base tecnológica nas fases de Protótipo, MVP e Produto comercial, com aporte financeiro e bolsas para conexão com o mercado.",
			requirements:
				"Startups de PE com anuência de ICT ou Incubadora/Aceleradora credenciada. Submissão pela plataforma AgilFAP.",
			deadline: "2026-11-30",
			urgent: true,
			postedBy: "FACEPE - Inova PE",
			applicants: 76,
			editalUrl: "https://www2.facepe.br/wp-content/uploads/2026/10/2026.10.22-Pro-Startups-OperacaoAtualizado.pdf",
		},
		{
			id: "vaga-facepe-cientista-arretado",
			title: "Edital FACEPE 31/2026 | Programa Cientista Arretado (Inovação Pública)",
			company: "FACEPE / Governo de Pernambuco",
			type: "Bolsa de Pesquisa Aplicada",
			category: "Bolsas",
			location: "Órgãos do Governo de PE / ICTs Parceiras",
			remuneration: "Bolsas de Pesquisa & Desenvolvimento",
			hours: "20h a 40h semanais",
			courseMatch: [
				"Ciência da Computação",
				"Gestão Pública",
				"Estatística",
				"Engenharias",
				"Administração",
			],
			description:
				"Cooperação técnico-científica entre pesquisadores e a administração pública estadual para resolver desafios complexos de gestão, defesa civil, sustentabilidade e inovação.",
			requirements:
				"Pesquisadores e estudantes vinculados a ICTs-PE. Submissões por rodadas temáticas na plataforma AgilFAP.",
			deadline: "2026-12-15",
			urgent: false,
			postedBy: "FACEPE / SECTI-PE",
			applicants: 44,
			editalUrl: "https://www2.facepe.br/wp-content/uploads/2026/10/2026.10.22-Cientista-ArretadoAtualizado.pdf",
		},
		{
			id: "vaga-facepe-apq-universal",
			title: "Edital FACEPE 28/2026 | APQ Universal (Auxílio a Projetos de Pesquisa)",
			company: "FACEPE - Amparo à Ciência e Tecnologia",
			type: "Bolsa & Auxílio à Pesquisa",
			category: "Bolsas",
			location: "Universidades e Centros de Pesquisa de PE",
			remuneration: "Auxílio financeiro global + Bolsas de IC",
			hours: "20h semanais",
			courseMatch: [
				"Todas as Graduações",
				"Ciência da Computação",
				"Secretariado Executivo",
				"Engenharias",
			],
			description:
				"Apoio financeiro universal a projetos de pesquisa científica, tecnológica e de inovação em todas as áreas do conhecimento desenvolvidos em instituições de Pernambuco.",
			requirements:
				"Pesquisadores de ICTs de PE com equipes compostas por alunos de graduação e pós-graduação.",
			deadline: "2026-11-19",
			urgent: false,
			postedBy: "FACEPE",
			applicants: 189,
			editalUrl: "https://www2.facepe.br/wp-content/uploads/2026/08/Edital_FACEPE___28_2026___APQ_Universal_Final__2_.pdf",
		},
	],

	tickets: [
		{
			id: "FM-2026-UFPE-0492",
			studentNickname: "EstudanteNoturno_CAC",
			course: "Secretariado Executivo",
			subject: "Acesso à Biblioteca Central após às 20h para quem trabalha",
			category: "Infraestrutura & Horários",
			description:
				"Muitos alunos que trabalham chegam na universidade às 18h40 e encontram a sala de estudos em grupo fechada a partir das 20h. Sugiro estender o horário até 21h45.",
			status: "Em Andamento",
			priority: "Média",
			createdAt: "2026-11-04T10:15:00Z",
			updatedAt: "2026-11-05T14:20:00Z",
			response:
				"A solicitação foi acolhida pela Diretoria do SIB/UFPE. Uma portaria de extensão de horário para o bloco B da Biblioteca está em fase de deliberação para o turno da noite.",
			department: "Diretoria do Sistema de Bibliotecas",
		},
		{
			id: "FM-2026-UFPE-0477",
			studentNickname: "CalouroAnonimo_2026",
			course: "Ciência da Computação",
			subject: "Conflito de horários entre disciplinas interdisciplinares",
			category: "Matrícula e Grade",
			description:
				"Gostaria de cursar Gestão de Processos em Secretariado como complementar, mas o SIGAA acusa sobreposição de 15 minutos de deslocamento entre o CIn e o CCSA.",
			status: "Resolvido",
			priority: "Baixa",
			createdAt: "2026-11-01T08:30:00Z",
			updatedAt: "2026-11-03T11:00:00Z",
			response:
				"Ajuste manual concedido pela Coordenação Geral de Cursos conforme dispõe a Resolução de Mobilidade Interdepartamental. O estudante pode solicitar dispensa no DTI.",
			department: "Coordenação de Ensino de Graduação",
		},
	],

	clinicAppointments: [
		{
			id: "CLI-901",
			studentNickname: "Discente_CFCH",
			course: "Psicologia",
			shift: "Tarde",
			urgency: "Média",
			preferredDays: "Terças e Quintas",
			reasonCategory: "Ansiedade com fim de semestre e TCC",
			status: "Pendente",
			supervisor: "Profa. Dra. Mariana Sampaio (CRP-02)",
			traineeAssigned: "João Pedro (9º Período - Psicologia Clínica)",
			notes:
				"Encaminhado para acolhimento inicial na Clínica-Escola de Psicologia da UFPE.",
			createdAt: "2026-11-06T15:20:00Z",
		},
		{
			id: "CLI-898",
			studentNickname: "Estudante_CCSA",
			course: "Secretariado Executivo",
			shift: "Noite",
			urgency: "Alta",
			preferredDays: "Quartas",
			reasonCategory: "Sobrecarga trabalho + universidade",
			status: "Em Andamento",
			supervisor: "Profa. Dra. Mariana Sampaio (CRP-02)",
			traineeAssigned:
				"Marta Silva (10º Período - Psicologia Organizacional e Clínica)",
			notes:
				"Primeira sessão de acolhimento realizada. Plano de regulação de estresse estabelecido.",
			createdAt: "2026-11-03T17:45:00Z",
		},
	],

	permanenciaSurvey: {
		totalResponses: 342,
		retentionRate: 84.2,
		engagementScore: 78,
		moodStats: {
			focado: 38,
			ansioso: 27,
			exausto: 23,
			disposto: 12,
		},
		riskAlerts: [
			{
				course: "Engenharias & Exatas",
				riskLevel: "Alto",
				mainCause:
					"Sobrecarga de cálculo e horários diurnos conflitantes com estágio",
				affectedCount: 42,
			},
			{
				course: "Secretariado Executivo & Gestão",
				riskLevel: "Baixo",
				mainCause:
					"Alunos trabalhadores buscando flexibilidade em matérias noturnas",
				affectedCount: 14,
			},
		],
	},

	enterprise: {
		companyName: "Soluções Digitais & Consultoria Ltda",
		organization: [
			{
				id: "org-1",
				title: "Diretoria Geral",
				name: "Carlos Eduardo Menezes",
				role: "Diretor Executivo (CEO)",
				department: "Diretoria",
				level: 1,
				reportsTo: null,
				responsibilities: [
					"Estratégia corporativa",
					"Relações com investidores",
					"Aprovação orçamentária final",
				],
			},
			{
				id: "org-2",
				title: "Secretariado Executivo & Governança",
				name: "Fernanda Albuquerque",
				role: "Secretária Executiva Plena",
				department: "Diretoria / Gestão",
				level: 2,
				reportsTo: "org-1",
				responsibilities: [
					"Gestão da agenda da diretoria",
					"Redação de atas e deliberações",
					"Mapeamento de fluxos de atendimento",
					"Comunicação interdepartamental",
				],
			},
			{
				id: "org-3",
				title: "Gerência Administrativo-Financeira",
				name: "Mariano Silva",
				role: "Gerente Administrativo",
				department: "Administrativo",
				level: 2,
				reportsTo: "org-1",
				responsibilities: [
					"Fluxo de caixa e faturamento",
					"Gestão de suprimentos e compras",
					"Supervisão contábil e tributária (Simples Nacional)",
				],
			},
			{
				id: "org-4",
				title: "Gerência de Operações & Atendimento",
				name: "Sthefanny Santos",
				role: "Líder Operacional",
				department: "Operações",
				level: 2,
				reportsTo: "org-1",
				responsibilities: [
					"Triagem e atendimento de clientes",
					"Acompanhamento de prazos de entrega",
					"Controle de qualidade de serviços",
				],
			},
			{
				id: "org-5",
				title: "Analista de Suporte e Processos",
				name: "Felipe Gonçalves",
				role: "Analista Operacional",
				department: "Operações",
				level: 3,
				reportsTo: "org-4",
				responsibilities: [
					"Execução das ordens de serviço",
					"Elaboração de relatórios diários de atendimento",
					"Identificação de gargalos operacionais",
				],
			},
		],

		workflows: [
			{
				id: "wf-1",
				name: "Atendimento ao Cliente e Triagem de Solicitações",
				agent: "FACUL FLUXO",
				trigger:
					"Recebimento de e-mail, WhatsApp institucional ou ligação de cliente",
				steps: [
					{
						order: 1,
						name: "Recebimento",
						actor: "Secretariado / Recepção",
						action:
							"Registrar dados do solicitante, natureza do pedido e canal de origem.",
						time: "10 min",
					},
					{
						order: 2,
						name: "Triagem & Classificação",
						actor: "FACUL FLUXO / Secretário",
						action:
							"Classificar prioridade (Urgente, Normal, Baixa) e encaminhar ao departamento.",
						time: "15 min",
					},
					{
						order: 3,
						name: "Execução & Tratativa",
						actor: "Operações ou Financeiro",
						action:
							"Desenvolvimento da solução, confecção de documentos ou resolução técnica.",
						time: "24h - 48h",
					},
					{
						order: 4,
						name: "Revisão e Validação",
						actor: "Secretariado Executivo",
						action:
							"Revisar resposta contra o padrão de qualidade e compliance da empresa.",
						time: "30 min",
					},
					{
						order: 5,
						name: "Finalização & Feedback",
						actor: "Atendimento",
						action:
							"Envio formal da resposta ao cliente e arquivamento do protocolo.",
						time: "10 min",
					},
				],
				mermaid: `flowchart TD
  A[Recebimento do Pedido] --> B{Triagem & Classificação}
  B -->|Financeiro| C[Tratativa Contábil/Financeira]
  B -->|Operacional| D[Execução de Serviço]
  B -->|Diretoria| E[Despacho Executivo]
  C --> F[Revisão pelo Secretariado]
  D --> F
  E --> F
  F --> G[Finalização & Envio ao Cliente]`,
				bottlenecks: [
					"Falta de padronização nas informações coletadas no primeiro contato",
					"Tempo excessivo de espera na triagem quando múltiplos canais não são centralizados",
				],
			},
		],

		checklists: [
			{
				id: "chk-1",
				text: "Rever organograma institucional e sobreposição de cargos",
				status: "Em Andamento",
				assignedTo: "Secretariado Executivo",
				dueDate: "2026-11-10",
			},
			{
				id: "chk-2",
				text: "Padronizar roteiro de atendimento a novos clientes (SOP)",
				status: "A Fazer",
				assignedTo: "Líder de Operações",
				dueDate: "2026-11-14",
			},
			{
				id: "chk-3",
				text: "Definir responsabilidades e matriz RACI por colaborador",
				status: "Concluído",
				assignedTo: "Diretoria & Secretariado",
				dueDate: "2026-11-02",
			},
			{
				id: "chk-4",
				text: "Mapear rotinas diárias e gargalos de comunicação interna",
				status: "A Fazer",
				assignedTo: "Fernanda Costa",
				dueDate: "2026-11-18",
			},
			{
				id: "chk-5",
				text: "Organizar pasta de atas de reunião e deliberações em nuvem",
				status: "Concluído",
				assignedTo: "Secretariado Executivo",
				dueDate: "2026-11-05",
			},
		],

		swot: {
			strengths: [
				"Equipe fundadora qualificada em Secretariado Executivo e Gestão",
				"Alta capacidade de personalização de fluxos para pequenas e médias empresas",
				"Integração nativa de Inteligência Artificial especializada (Multi-Agentes)",
			],
			weaknesses: [
				"Orçamento inicial enxuto (Bootstrapping de R$ 5.000,00)",
				"Dependência de poucos canais de tração comercial na largada",
				"Necessidade de conscientizar PMEs sobre o valor da organização documental",
			],
			opportunities: [
				"Mercado crescente de EdTechs e consultorias digitais no Nordeste e Brasil",
				"Alta dor de desorganização administrativa e retrabalho em PMEs",
				"Possibilidade de fornecer para Instituições de Ensino Superior públicas e privadas",
			],
			threats: [
				"Sistemas ERPs tradicionais consolidados (embora caros e rígidos)",
				"Resistência de equipes conservadoras à adoção de IA na rotina diária",
				"Oscilações no ambiente macroeconômico das pequenas empresas",
			],
			plan5W2H: [
				{
					what: "Implementar piloto de consultoria secretarial com IA (FACUL FLUXO)",
					why: "Validar economia de tempo na geração de SOPs e organogramas",
					where: "Ambiente digital / 3 PMEs parceiras",
					when: "Até Dezembro de 2026",
					who: "Mariano Ferreira e Equipe Facul Mind",
					how: "Apresentação de PoC com diagnósticos ao vivo e entrega de manuais",
					howMuch: "R$ 450,00 (custos de infraestrutura e materiais)",
				},
			],
		},

		documents: [
			{
				id: "doc-1",
				title: "Ata de Reunião Ordinária - Alinhamento Operacional 2026.2",
				type: "Ata de Reunião",
				agent: "FACUL DOCS",
				createdAt: "2026-11-05",
				content: `**ATA DA REUNIÃO ORDINÁRIA DA DIRETORIA E SECRETARIADO**

**Data:** 05 de novembro de 2026 | **Horário:** 10:00 às 11:30
**Presentes:** Carlos Menezes (Diretor), Fernanda Albuquerque (Secretária Executiva), Mariano Silva (Gerente Adm), Sthefanny Santos (Operações).

**1. Pauta do Dia:**
- Revisão do fluxo de triagem de atendimento ao cliente;
- Integração da ferramenta FACUL FLUXO para geração de SOPs;
- Adequação aos padrões de compliance LGPD e guarda de dados.

**2. Deliberações:**
- Fica aprovada a adoção do Procedimento Operacional Padrão de 5 etapas para triagem de solicitações.
- O Secretariado Executivo fica responsável por auditar semanalmente as pendências e atas geradas pelos agentes virtuais.
- Definido prazo até 14/Nov para entrega da matriz de competências de cada setor.

**Encaminhamentos:**
- Fernanda Albuquerque: consolidar relatório de fluxos até sexta-feira.
- Mariano Silva: validar custos de hospedagem e ferramentas em nuvem.`,
			},
		],
	},

	// Post-Its agora são persistidos exclusivamente no Firestore.
	postIts: [],

	coffeeChats: {
		ia: [
			{
				id: "msg-1",
				user: "Mariano (Secretariado)",
				text: "Como vocês estão aplicando os agentes de IA na automação de relatórios?",
				time: "18:42",
			},
			{
				id: "msg-2",
				user: "Clara (Computação)",
				text: "Estamos usando o Grok e LangChain para ler PDFs de regimento!",
				time: "18:45",
			},
			{
				id: "msg-3",
				user: "Prof. Marcos",
				text: "Excelente conexão entre Secretariado e Tech. O mercado exige exatamente isso!",
				time: "18:50",
			},
		],
		eventos: [
			{
				id: "msg-4",
				user: "Fernanda (Secretariado)",
				text: "Estamos planejando o Simpósio Acadêmico 2026. Alguém do DTI para cuidar do credenciamento digital?",
				time: "17:15",
			},
			{
				id: "msg-5",
				user: "Arthur (Engenharia)",
				text: "Posso ajudar a configurar os leitores de QR code!",
				time: "17:30",
			},
		],
		estagios: [
			{
				id: "msg-6",
				user: "Etyene (Secretariado)",
				text: "A Inova Consultoria abriu vaga de estágio presencial no Recife Antigo! R$ 1.200.",
				time: "14:20",
			},
			{
				id: "msg-7",
				user: "Thiago (ADM)",
				text: "Acabei de me candidatar pelo Radar da FaculMind!",
				time: "15:05",
			},
		],
	},
};

// Converte o Timestamp do Firestore para ISO string.
// Também aceita strings, para manter compatibilidade com registros existentes.
function serializePostIt(doc) {
	const data = doc.data();
	const createdAt = data.createdAt?.toDate
		? data.createdAt.toDate().toISOString()
		: (data.createdAt ?? null);

	return {
		...data,
		id: doc.id,
		createdAt,
	};
}

class DataStore {
	constructor() {
		// Os dados de demonstração dos outros módulos permanecem em memória.
		this.data = JSON.parse(JSON.stringify(INITIAL_DATA));
	}

	// --- MÉTODOS DE DEMONSTRAÇÃO (MEMÓRIA RAM) ---

	getOpportunities() {
		return this.data.opportunities;
	}

	applyOpportunity(id, studentInfo) {
		const opp = this.data.opportunities.find((o) => o.id === id);

		if (opp) {
			opp.applicants = (opp.applicants || 0) + 1;
			return opp;
		}

		return null;
	}

	getTickets() {
		return this.data.tickets;
	}

	createTicket(ticket) {
		const newId = `FM-2026-UFPE-${Math.floor(1000 + Math.random() * 9000)}`;

		const newTicket = {
			id: newId,
			studentNickname: ticket.studentNickname || "Estudante_Anonimo",
			course: ticket.course || "Graduação Geral",
			subject: ticket.subject || "Manifestação sem título",
			category: ticket.category || "Geral",
			description: ticket.description,
			status: "Em Andamento",
			priority: ticket.priority || "Normal",
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			response:
				"Sua solicitação foi protocolada no sistema integrado Facul Mind e direcionada para a Secretaria e Coordenação competente para análise.",
			department: ticket.department || "Ouvidoria / Secretaria Acadêmica",
		};

		this.data.tickets.unshift(newTicket);
		return newTicket;
	}

	getClinicAppointments() {
		return this.data.clinicAppointments;
	}

	createClinicAppointment(appt) {
		const newId = `CLI-${Math.floor(100 + Math.random() * 900)}`;

		const newAppt = {
			id: newId,
			studentNickname: appt.studentNickname || "Estudante_Acolhido",
			course: appt.course || "Não informado",
			shift: appt.shift || "Tarde",
			urgency: appt.urgency || "Normal",
			preferredDays: appt.preferredDays || "A combinar",
			reasonCategory:
				appt.reasonCategory || "Acolhimento geral e regulação emocional",
			status: "Pendente",
			supervisor: "Corpo Docente de Estágio Supervisionado (CRP-02/UFPE)",
			traineeAssigned: "Aguardando alocação de estagiário do 9º/10º período",
			notes:
				appt.notes ||
				"Solicitação registrada através da aba Acolhimento Psicológico do Facul Mind.",
			createdAt: new Date().toISOString(),
		};

		this.data.clinicAppointments.unshift(newAppt);
		return newAppt;
	}

	getPermanenciaStats() {
		return this.data.permanenciaSurvey;
	}

	submitPermanenciaSurvey(answers) {
		this.data.permanenciaSurvey.totalResponses += 1;

		if (
			answers.mood &&
			this.data.permanenciaSurvey.moodStats[answers.mood] !== undefined
		) {
			this.data.permanenciaSurvey.moodStats[answers.mood] += 1;
		}

		return this.data.permanenciaSurvey;
	}

	getEnterpriseData() {
		return this.data.enterprise;
	}

	updateOrgChart(newOrg) {
		this.data.enterprise.organization = newOrg;
		return this.data.enterprise.organization;
	}

	addWorkflow(wf) {
		const newWf = { id: `wf-${Date.now()}`, ...wf };
		this.data.enterprise.workflows.push(newWf);
		return newWf;
	}

	toggleChecklist(id) {
		const item = this.data.enterprise.checklists.find((c) => c.id === id);

		if (item) {
			if (item.status === "Concluído") item.status = "A Fazer";
			else if (item.status === "A Fazer") item.status = "Em Andamento";
			else item.status = "Concluído";

			return item;
		}

		return null;
	}

	addChecklist(item) {
		const newItem = {
			id: `chk-${Date.now()}`,
			text: item.text,
			status: item.status || "A Fazer",
			assignedTo: item.assignedTo || "Secretariado Executivo",
			dueDate: item.dueDate || "2026-11-20",
		};

		this.data.enterprise.checklists.push(newItem);
		return newItem;
	}

	updateSwot(swotData) {
		this.data.enterprise.swot = {
			...this.data.enterprise.swot,
			...swotData,
		};

		return this.data.enterprise.swot;
	}

	addDocument(doc) {
		const newDoc = {
			id: `doc-${Date.now()}`,
			title: doc.title,
			type: doc.type || "Documento Administrativo",
			agent: doc.agent || "FACUL DOCS",
			createdAt: new Date().toISOString().split("T")[0],
			content: doc.content,
		};

		this.data.enterprise.documents.unshift(newDoc);
		return newDoc;
	}

	// --- POST-ITS (FIRESTORE) ---

	async getPostIts() {
		const snapshot = await db
			.collection("postIts")
			.orderBy("createdAt", "desc")
			.get();

		return snapshot.docs.map(serializePostIt);
	}

	async addPostIt(postIt) {
		if (!postIt.authorUid) {
			throw new Error("UID do autor é obrigatório para criar um Post-it.");
		}

		if (!postIt.text?.trim()) {
			throw new Error("O texto do Post-it é obrigatório.");
		}

		const newPostIt = {
			authorUid: postIt.authorUid,
			author: postIt.author || "Estudante Conectado",
			avatar: postIt.avatar || "🎓",
			text: postIt.text.trim(),
			tag: postIt.tag || "Comunidade UFPE",
			color: postIt.color || "bg-sky-100 border-sky-300 text-sky-900",
			likes: 1,
			createdAt: new Date(),
		};

		const docRef = await db.collection("postIts").add(newPostIt);

		return {
			...newPostIt,
			id: docRef.id,
			createdAt: newPostIt.createdAt.toISOString(),
		};
	}

	async likePostIt(id) {
		const docRef = db.collection("postIts").doc(String(id));

		return db.runTransaction(async (transaction) => {
			const doc = await transaction.get(docRef);

			if (!doc.exists) {
				return null;
			}

			const data = doc.data();
			const currentLikes = Number(data.likes) || 0;
			const updatedLikes = currentLikes + 1;

			transaction.update(docRef, {
				likes: updatedLikes,
			});

			const createdAt = data.createdAt?.toDate
				? data.createdAt.toDate().toISOString()
				: (data.createdAt ?? null);

			return {
				...data,
				id: doc.id,
				likes: updatedLikes,
				createdAt,
			};
		});
	}

	// --- COFFEE CHATS (MEMÓRIA RAM) ---

	getCoffeeChats(tableId = "ia") {
		if (!this.data.coffeeChats) {
			this.data.coffeeChats = {};
		}

		return this.data.coffeeChats[tableId] || [];
	}

	addCoffeeMessage(tableId = "ia", message) {
		if (!this.data.coffeeChats) {
			this.data.coffeeChats = {};
		}

		if (!this.data.coffeeChats[tableId]) {
			this.data.coffeeChats[tableId] = [];
		}

		const newMsg = {
			id: `cmsg-${Date.now()}`,
			user: message.user || "Você (UFPE)",
			text: message.text,
			time:
				message.time ||
				new Date().toLocaleTimeString("pt-BR", {
					hour: "2-digit",
					minute: "2-digit",
				}),
			timestamp: new Date().toISOString(),
		};

		this.data.coffeeChats[tableId].push(newMsg);
		return newMsg;
	}

	// --- DADOS REAIS DO SIGAA (FIRESTORE) ---

	async getStudentAcademicRecord(uid) {
		if (!uid) {
			console.warn("[Store] Tentativa de buscar histórico sem UID.");
			return null;
		}

		try {
			const doc = await db.collection("students").doc(uid).get();

			if (!doc.exists) {
				return null;
			}

			return doc.data();
		} catch (error) {
			console.error(`[Store] Erro Firestore GET UID ${uid}:`, error);
			throw error;
		}
	}

	async saveStudentAcademicRecord(uid, record) {
		if (!uid) {
			console.error("[Store] Tentativa de salvar histórico sem UID.");
			return null;
		}

		try {
			// Sobrescreve o histórico para refletir os dados atuais do SIGAA.
			await db.collection("students").doc(uid).set(record, {
				merge: false,
			});

			return record;
		} catch (error) {
			console.error(`[Store] Erro Firestore SET UID ${uid}:`, error);
			throw error;
		}
	}

	async mergeAndSaveStudentAcademicRecord(uid, incomingRecord, syncReport = {}) {
		if (!uid) {
			console.error("[Store] Tentativa de mesclar histórico sem UID.");
			return null;
		}

		try {
			const mergedRecord = await db.runTransaction(async (transaction) => {
				const docRef = db.collection("students").doc(uid);
				const docSnap = await transaction.get(docRef);
				const existingRecord = docSnap.exists ? docSnap.data() : null;

				const merged = mergeAcademicRecords(
					existingRecord,
					incomingRecord,
					syncReport,
				);

				transaction.set(docRef, merged, { merge: false });
				return merged;
			});

			return mergedRecord;
		} catch (error) {
			console.error(`[Store] Erro Firestore TRANSACTION UID ${uid}:`, error);
			throw error;
		}
	}
}

export function getTurmaCompositeKey(turma) {
	if (!turma) return "";
	if (turma.id) return turma.id;
	const periodo = turma.periodo
		? String(turma.periodo).replace(/\s+/g, "-")
		: "sem-periodo";
	const codigo = turma.codigo || "sem-codigo";
	const turmaId = turma.turmaId || "sem-turma";
	return `${periodo}-${codigo}-${turmaId}`;
}

export function mergeAcademicRecords(
	existingRecord,
	incomingRecord,
	syncReport = {},
) {
	if (!incomingRecord) {
		return existingRecord || null;
	}
	if (!existingRecord) {
		return incomingRecord;
	}

	const isManualImport = Boolean(syncReport.isManualImport);
	const turmasReport = syncReport.turmas || {};

	// 1. DADOS GERAIS DO ESTUDANTE
	const mergedName =
		typeof incomingRecord.name === "string" && incomingRecord.name.trim()
			? incomingRecord.name.trim()
			: existingRecord.name || null;

	const mergedMatricula =
		typeof incomingRecord.matricula === "string" &&
		incomingRecord.matricula.trim()
			? incomingRecord.matricula.trim()
			: existingRecord.matricula || null;

	const mergedCourse =
		typeof incomingRecord.course === "string" && incomingRecord.course.trim()
			? incomingRecord.course.trim()
			: existingRecord.course || null;

	const mergedCr =
		incomingRecord.cr !== null &&
		incomingRecord.cr !== undefined &&
		incomingRecord.cr !== ""
			? incomingRecord.cr
			: (existingRecord.cr ?? null);

	const mergedSemester =
		typeof incomingRecord.currentSemester === "string" &&
		incomingRecord.currentSemester.trim()
			? incomingRecord.currentSemester.trim()
			: existingRecord.currentSemester || null;

	// 2. TURMAS ATUAIS
	const existingTurmasMap = new Map();
	if (Array.isArray(existingRecord.turmas)) {
		for (const t of existingRecord.turmas) {
			const key = getTurmaCompositeKey(t);
			if (key) {
				existingTurmasMap.set(key, t);
			}
		}
	}

	const incomingTurmas = Array.isArray(incomingRecord.turmas)
		? incomingRecord.turmas
		: [];

	let mergedTurmas;
	if (incomingTurmas.length === 0 && existingRecord.turmas?.length > 0) {
		// Preserva turmas anteriores se incoming falhou estruturalmente ou veio sem turmas
		mergedTurmas = existingRecord.turmas;
	} else {
		mergedTurmas = incomingTurmas.map((incTurma) => {
			const key = getTurmaCompositeKey(incTurma);
			const extTurma = existingTurmasMap.get(key) || null;

			if (!extTurma) {
				return incTurma;
			}

			const turmaState = turmasReport[key] || turmasReport[incTurma.id] || {};
			const notasStatus = turmaState.notas;
			const frequenciaStatus = turmaState.frequencia;

			const mergedTurma = { ...incTurma };

			// Atributos gerais da turma
			if (!mergedTurma.local && extTurma.local)
				mergedTurma.local = extTurma.local;
			if (!mergedTurma.horario && extTurma.horario)
				mergedTurma.horario = extTurma.horario;
			if (!mergedTurma.cargaHoraria && extTurma.cargaHoraria)
				mergedTurma.cargaHoraria = extTurma.cargaHoraria;
			if (!mergedTurma.docente && extTurma.docente)
				mergedTurma.docente = extTurma.docente;
			if (!mergedTurma.status && extTurma.status)
				mergedTurma.status = extTurma.status;

			// NOTAS
			if (notasStatus === "available") {
				mergedTurma.notasDisponiveis = true;
				// mergedTurma.notas já contém incoming notas
			} else if (notasStatus === "not_launched") {
				mergedTurma.notasDisponiveis = false;
				mergedTurma.notas = incTurma.notas || {
					unidade1: null,
					unidade2: null,
					mediaParcial: null,
				};
			} else if (notasStatus === "failed") {
				mergedTurma.notasDisponiveis = extTurma.notasDisponiveis ?? null;
				mergedTurma.notas = extTurma.notas ?? null;
			} else {
				// Categoria não informada (ex: importação manual)
				if (isManualImport || notasStatus === undefined) {
					if (
						extTurma.notasDisponiveis !== undefined &&
						extTurma.notasDisponiveis !== null
					) {
						mergedTurma.notasDisponiveis = extTurma.notasDisponiveis;
						mergedTurma.notas = extTurma.notas;
					}
				}
			}

			// FREQUÊNCIA
			if (frequenciaStatus === "available") {
				mergedTurma.frequenciaDisponivel = true;
				if (incTurma.frequencia?.contagem?.totalFaltas !== undefined) {
					mergedTurma.faltas = incTurma.frequencia.contagem.totalFaltas;
				}
				if (
					incTurma.presencaPercentual !== null &&
					incTurma.presencaPercentual !== undefined
				) {
					mergedTurma.presencaPercentual = incTurma.presencaPercentual;
				} else if (
					extTurma.presencaPercentual !== null &&
					extTurma.presencaPercentual !== undefined
				) {
					mergedTurma.presencaPercentual = extTurma.presencaPercentual;
				}
			} else if (frequenciaStatus === "not_launched") {
				mergedTurma.frequenciaDisponivel = false;
				mergedTurma.frequencia = null;
				mergedTurma.faltas = null;
			} else if (frequenciaStatus === "failed") {
				mergedTurma.frequenciaDisponivel =
					extTurma.frequenciaDisponivel ?? null;
				mergedTurma.frequencia = extTurma.frequencia ?? null;
				mergedTurma.presencaPercentual = extTurma.presencaPercentual ?? null;
				mergedTurma.faltas = extTurma.faltas ?? null;
			} else {
				// Categoria não informada (ex: importação manual)
				if (isManualImport || frequenciaStatus === undefined) {
					if (
						extTurma.frequenciaDisponivel !== undefined &&
						extTurma.frequenciaDisponivel !== null
					) {
						mergedTurma.frequenciaDisponivel = extTurma.frequenciaDisponivel;
						mergedTurma.frequencia = extTurma.frequencia;
						mergedTurma.presencaPercentual = extTurma.presencaPercentual;
						mergedTurma.faltas = extTurma.faltas;
					}
				}
			}

			return mergedTurma;
		});
	}

	// 3. INTEGRALIZAÇÃO
	let mergedIntegralizacao;
	const historyStatus = syncReport.history;

	if (isManualImport) {
		mergedIntegralizacao =
			existingRecord.integralizacao ||
			incomingRecord.integralizacao ||
			null;
	} else if (historyStatus === "failed") {
		mergedIntegralizacao = existingRecord.integralizacao || null;
	} else if (incomingRecord.integralizacao) {
		mergedIntegralizacao = incomingRecord.integralizacao;
	} else {
		mergedIntegralizacao = existingRecord.integralizacao || null;
	}

	// 4. METADADOS DE SINCRONIZAÇÃO (syncMetadata)
	const mergedSyncMetadata = {
		...(existingRecord.syncMetadata || {}),
		...(incomingRecord.syncMetadata || {}),
	};
	if (
		existingRecord.syncMetadata?.history &&
		(!incomingRecord.syncMetadata || !incomingRecord.syncMetadata.history)
	) {
		mergedSyncMetadata.history = existingRecord.syncMetadata.history;
	}

	return {
		...existingRecord,
		...incomingRecord,
		name: mergedName,
		matricula: mergedMatricula,
		course: mergedCourse,
		cr: mergedCr,
		currentSemester: mergedSemester,
		turmas: mergedTurmas,
		integralizacao: mergedIntegralizacao,
		syncMetadata: mergedSyncMetadata,
		lastSyncAt: new Date().toISOString(),
	};
}

export const dataStore = new DataStore();
