/**
 * Facul Mind AI Multi-Agent Orchestrator
 * Coordinates agents:
 * - Agy (UFPE Academic Assistant with real SIGAA context & Gemini 1.5 Flash)
 * - FACUL ORGANIZA (Structure & Roles Agent)
 * - FACUL FLUXO (Processes & Workflows Agent)
 * - FACUL ESTRATÉGIA (Analytical & SWOT Agent)
 * - FACUL DOCS (Executive Documentation Agent)
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { dataStore } from '../data/store.js';

/**
 * Call Gemini API with system instructions and student context
 */
async function callGemini({ message, systemInstruction, contextData = {} }) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey.includes('sua_chave')) {
    return null;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction
    });

    const fullPrompt = `
Contexto Oficial do Estudante e Universidade:
${JSON.stringify(contextData, null, 2)}

Mensagem do Aluno / Usuário:
"${message}"
`;

    const result = await model.generateContent(fullPrompt);
    return result.response.text();
  } catch (err) {
    console.warn('[Gemini Orchestrator Warning]:', err.message);
    return null;
  }
}

export async function processAgentMessage({ message, agentId = 'agy-ufpe', context = {} }) {
  const normalizedMsg = message.toLowerCase().trim();

  // Combine provided context with server-side synced academic data
  const studentRecord = context.student || dataStore.getStudentAcademicRecord();
  const fullContext = {
    ...context,
    student: studentRecord,
    opportunities: dataStore.getOpportunities().slice(0, 3)
  };

  // Route based on agentId or intent
  if (agentId === 'facul-organiza' || normalizedMsg.includes('organograma') || normalizedMsg.includes('cargos') || normalizedMsg.includes('hierarquia')) {
    return handleFaculOrganiza(message, fullContext);
  }

  if (agentId === 'facul-fluxo' || normalizedMsg.includes('fluxo') || normalizedMsg.includes('processo') || normalizedMsg.includes('gargalo') || normalizedMsg.includes('bpmn')) {
    return handleFaculFluxo(message, fullContext);
  }

  if (agentId === 'facul-estrategia' || normalizedMsg.includes('swot') || normalizedMsg.includes('5w2h') || normalizedMsg.includes('estratégia') || normalizedMsg.includes('diagnóstico')) {
    return handleFaculEstrategia(message, fullContext);
  }

  if (agentId === 'facul-docs' || normalizedMsg.includes('ata') || normalizedMsg.includes('documento') || normalizedMsg.includes('checklist') || normalizedMsg.includes('procedimento')) {
    return handleFaculDocs(message, fullContext);
  }

  // Default to Agy UFPE Academic Assistant
  return handleAgyUfpe(message, fullContext);
}

// -------------------------------------------------------------
// AGY UFPE - Academic Assistant
// -------------------------------------------------------------
async function handleAgyUfpe(message, context) {
  const text = message.toLowerCase();
  const student = context.student;

  // 1. Try Gemini API if key is present
  const geminiResponse = await callGemini({
    message,
    systemInstruction: `Você é a "Agy", a assistente virtual inteligente e acolhedora da Universidade Federal de Pernambuco (UFPE) no projeto "Facul Mind".
Sua missão é combater a evasão universitária, orientar sobre SIGAA, matrícula, trancamento, auxílio permanência (PROAES), Restaurante Universitário (RU) e acolhimento psicológico.
Quando o contexto do aluno tiver turmas, notas e faltas sincronizadas do SIGAA, utilize esses dados EXATOS para responder com precisão cirúrgica perguntas como "Como estou em Cálculo 2?" ou "Quantas faltas tenho?".
Seja empática, objetiva, utilize formatação em tópicos com emojis acolhedores, e incentive o bem-estar mental do estudante.`,
    contextData: {
      instituicao: "Universidade Federal de Pernambuco (UFPE)",
      semestre: "2026.1",
      perfilAluno: student || "Aluno sem sincronização ativa do SIGAA"
    }
  });

  if (geminiResponse) {
    return {
      agent: "Agy (Assistente UFPE)",
      avatar: "/mascot.jpeg",
      response: geminiResponse,
      suggestions: [
        "Como estão minhas notas gerais?",
        "Ver limite de faltas por disciplina",
        "Prazos do calendário acadêmico",
        "Como funciona a clínica-escola de psicologia?"
      ]
    };
  }

  // 2. Local Contextual Logic when Gemini key is not configured:
  // Check if student is asking about real grades/absences and we have synced data
  if (student && student.turmas && (
    text.includes('nota') || 
    text.includes('falta') || 
    text.includes('calculo') || 
    text.includes('cálculo') || 
    text.includes('disciplina') || 
    text.includes('desempenho') || 
    text.includes('cra') ||
    text.includes('como estou')
  )) {
    // Specific search for Cálculo
    if (text.includes('calculo') || text.includes('cálculo')) {
      const calculo = student.turmas.find(t => t.disciplina.toLowerCase().includes('cálculo') || t.disciplina.toLowerCase().includes('calculo'));
      if (calculo) {
        return {
          agent: "Agy (Assistente UFPE)",
          avatar: "/mascot.jpeg",
          response: `Aqui está o seu status real em **${calculo.disciplina}** (${calculo.codigo}):

• **Faltas acumuladas:** ${calculo.faltas} faltas (Limite máximo: ${calculo.maxFaltasPermitidas} faltas)
• **Percentual de Presença:** ${calculo.presencaPercentual}%
• **Notas registradas:**
  - Unidade 1: ${calculo.notas.unidade1 ?? 'Pendente'}
  - Unidade 2: ${calculo.notas.unidade2 ?? 'Pendente'}
  - Média Parcial Atual: **${calculo.notas.mediaParcial ?? 'Calculando'}**
• **Docente:** ${calculo.docente}
• **Situação:** ${calculo.status}

⚠️ **Aviso de Retenção:** Você já usou ${calculo.faltas} das 15 faltas permitidas. Que tal participar do nosso *Grupo de Estudos de Algoritmos & Tech* ou dar uma revisada com os monitores?`,
          suggestions: [
            "Ver todas as minhas disciplinas",
            "Entrar no Grupo de Estudos",
            "Solicitar monitoria no SIGAA",
            "Falar com a coordenação"
          ],
          quickAction: {
            type: "NAVIGATE",
            target: "opportunities",
            label: "Ver Grupo de Estudos no Radar"
          }
        };
      }
    }

    // General academic summary
    const summaryList = student.turmas.map(t => 
      `• **${t.disciplina}** (${t.codigo}): Média ${t.notas.mediaParcial || 'N/A'} | ${t.faltas} faltas (${t.presencaPercentual}% presença)`
    ).join('\n');

    return {
      agent: "Agy (Assistente UFPE)",
      avatar: "/mascot.jpeg",
      response: `📚 **Relatório de Desempenho Real (SIGAA UFPE):**
Discente: **${student.name}** | Curso: **${student.course}** | CRA: **${student.cra}**

${summaryList}

💡 *Dica:* Você pode me perguntar detalhes de qualquer disciplina específica (ex: *"Como estou em Cálculo?"* ou *"Quantas faltas tenho em Processos?"*).`,
      suggestions: [
        "Como estou em Cálculo?",
        "Qual o prazo de trancamento de matrícula?",
        "Consultar auxílio permanência",
        "Agendar acolhimento psicológico"
      ]
    };
  }

  // Permânencia e Auxílios
  if (text.includes('permanência') || text.includes('permanencia') || text.includes('auxílio') || text.includes('bolsa') || text.includes('ru') || text.includes('alimentação')) {
    return {
      agent: "Agy (Assistente UFPE)",
      avatar: "/mascot.jpeg",
      response: `Claro! O **Auxílio Permanência da UFPE** apoia estudantes em situação de vulnerabilidade socioeconômica prioritária (renda per capita de até 1,5 salário mínimo).

Ele concede repasse financeiro mensal (R$ 550,00) e isenção total no Restaurante Universitário (RU). O edital 2026.1 está aberto pela PROAES!

Você gostaria de:
• **Ver os requisitos e documentos** necessários?
• **Saber o passo a passo** para se cadastrar no SIGAA?
• **Acessar o edital** completo?`,
      suggestions: [
        "Ver requisitos do auxílio",
        "Como se inscrever no SIGAA",
        "Consultar edital vigente",
        "Acessar Restaurante Universitário"
      ],
      quickAction: {
        type: "NAVIGATE",
        target: "bolsas",
        label: "Ver Bolsas e Auxílios no Radar"
      }
    };
  }

  // Matrícula & SIGAA
  if (text.includes('matrícula') || text.includes('matricula') || text.includes('sigaa') || text.includes('trancamento') || text.includes('reajuste')) {
    return {
      agent: "Agy (Assistente UFPE)",
      avatar: "/mascot.jpeg",
      response: `Sobre **Matrícula e SIGAA** na UFPE:

1. **Período de Matrícula Regular:** É realizado 100% online através do portal do discente no SIGAA na aba *Ensino > Matrícula On-line*.
2. **Reajuste de Matrícula:** Permite incluir turmas com vagas remanescentes ou resolver sobreposição de horários (como entre cursos no CAC/CIn/CCSA).
3. **Trancamento Parcial ou Total:** Pode ser solicitado até o limite fixado no calendário oficial do semestre letivo (18 de Abril de 2026).

Você já sincronizou suas disciplinas do SIGAA comigo? Se quiser, basta clicar em "Sincronizar SIGAA" no topo da tela!`,
      suggestions: [
        "Passo a passo do reajuste",
        "Como resolver conflito de horários",
        "Prazo limite de trancamento",
        "Falar com a Secretaria"
      ],
      quickAction: {
        type: "LINK",
        target: "https://sigaa.ufpe.br",
        label: "Abrir Portal SIGAA"
      }
    };
  }

  // Apoio Psicológico
  if (text.includes('psicol') || text.includes('apoio') || text.includes('emocional') || text.includes('ansiedade') || text.includes('estresse') || text.includes('cansad') || text.includes('exausto')) {
    return {
      agent: "Agy (Assistente UFPE)",
      avatar: "/mascot.jpeg",
      response: `Eu te entendo! A rotina universitária com provas, prazos e trabalho pode ser muito desafiadora. Você não precisa passar por isso sozinho(a). 💚

A UFPE conta com o serviço de **Acolhimento da Clínica-Escola de Psicologia**, onde estudantes dos últimos períodos realizam atendimentos gratuitos sob supervisão direta do corpo docente (CRP-02).

Além disso, que tal dar uma pausa de 3 minutos no nosso módulo **Pausa Mind** para relaxar com o Jardim Zen ou estourar bolhas?`,
      suggestions: [
        "Solicitar acolhimento psicológico",
        "Ir para a Pausa Mind (Relax)",
        "Como funciona a clínica-escola?",
        "Horários de atendimento"
      ],
      quickAction: {
        type: "MODAL",
        target: "clinic-modal",
        label: "Agendar Acolhimento na Clínica"
      }
    };
  }

  // Calendário
  if (text.includes('calendário') || text.includes('calendario') || text.includes('prazo') || text.includes('prova') || text.includes('férias') || text.includes('ferias')) {
    return {
      agent: "Agy (Assistente UFPE)",
      avatar: "/mascot.jpeg",
      response: `📅 **Calendário Acadêmico UFPE 2026:**

• **Início das Aulas (2026.1):** 10 de Março
• **Fim do prazo para trancamento:** 18 de Abril
• **Semana de Avaliações e Seminários:** 15 a 20 de Junho
• **Exames Finais:** 01 a 07 de Julho
• **Recesso Estudantil:** 10 a 31 de Julho

Deseja sincronizar esses lembretes com a sua agenda ou consultar feriados acadêmicos?`,
      suggestions: [
        "Ver prazos de trancamento",
        "Dias letivos do semestre",
        "Datas das finais",
        "Outros avisos oficiais"
      ]
    };
  }

  // Generic welcoming response
  return {
    agent: "Agy (Assistente UFPE)",
    avatar: "/mascot.jpeg",
    response: `Olá! Eu sou a **FaculMind (Agy)**, sua assistente virtual integrada da UFPE. 🎓

Estou conectada ao SIGAA e às fontes oficiais da universidade para tirar dúvidas, acompanhar suas disciplinas, te conectar com oportunidades de estágio e bolsas, e apoiar seu bem-estar mental.

Como posso te ajudar agora?`,
    suggestions: [
      "Como estou em Cálculo?",
      "Quero saber sobre auxílio permanência",
      "Como funciona a clínica de psicologia?",
      "Ver oportunidades de estágio e grupos",
      "Fazer uma manifestação anônima"
    ]
  };
}

// -------------------------------------------------------------
// FACUL ORGANIZA - Enterprise Structure Agent
// -------------------------------------------------------------
async function handleFaculOrganiza(message, context) {
  const geminiResponse = await callGemini({
    message,
    systemInstruction: "Você é o FACUL ORGANIZA, agente especialista em governança corporativa, análise de organogramas, papéis secretariais e matriz RACI para PMEs.",
    contextData: context.enterprise || {}
  });

  if (geminiResponse) {
    return {
      agent: "FACUL ORGANIZA",
      badge: "Estrutura & Cargos",
      response: geminiResponse,
      suggestions: ["Gerar Matriz RACI", "Identificar sobreposições de funções", "Exportar Organograma"]
    };
  }

  return {
    agent: "FACUL ORGANIZA",
    badge: "Estrutura & Cargos",
    response: `Analisei a estrutura organizacional da sua empresa com foco em **eficiência secretarial e governança**.

**Diagnóstico Rápido:**
1. **Pontos de Atenção:** Identifiquei que a gestão da agenda da diretoria e a triagem de fornecedores estão centralizadas sem um suplente formal, o que pode gerar gargalos se o secretário estiver ausente.
2. **Recomendação de Organograma:**
   - **Diretoria Executiva** (Nível 1 - Decisão estratégica)
   - **Secretariado Executivo & Governança** (Nível 2 - Ponte entre diretoria e áreas)
   - **Gerência Administrativo-Financeira** e **Operações** (Nível 2)
   - **Analistas & Assistentes** (Nível 3 - Execução tática)

Deseja que eu insira automaticamente um novo cargo ou gere a Matriz de Responsabilidades (RACI)?`,
    suggestions: [
      "Gerar Matriz RACI",
      "Adicionar Assistente Secretarial",
      "Exportar Organograma em PDF",
      "Identificar sobreposições de funções"
    ],
    action: {
      type: "ORGANOGRAM_UPDATE",
      message: "Estrutura hierárquica verificada com conformidade."
    }
  };
}

// -------------------------------------------------------------
// FACUL FLUXO - Workflow & Processes Agent
// -------------------------------------------------------------
async function handleFaculFluxo(message, context) {
  const geminiResponse = await callGemini({
    message,
    systemInstruction: "Você é o FACUL FLUXO, agente especialista em modelagem BPMN, diagramas Mermaid, mapeamento de processos administrativos e detecção de gargalos para empresas e IES.",
    contextData: context.enterprise || {}
  });

  if (geminiResponse) {
    return {
      agent: "FACUL FLUXO",
      badge: "Mapeamento & BPMN",
      response: geminiResponse,
      suggestions: ["Gerar Procedimento Padrão (SOP)", "Criar checklist de triagem", "Mapear gargalos"]
    };
  }

  return {
    agent: "FACUL FLUXO",
    badge: "Mapeamento & BPMN",
    response: `Excelente! Mapeei o fluxo operacional de **Atendimento e Triagem de Solicitações**:

\`\`\`mermaid
flowchart TD
  A[1. Recebimento da Solicitação] --> B{2. Triagem e Classificação}
  B -->|Crítica / Urgente| C[3A. Despacho Direto ao Gestor]
  B -->|Operacional / Rotina| D[3B. Encaminhamento para Operações]
  B -->|Financeira| E[3C. Faturamento & Contas]
  C --> F[4. Revisão & Redação pelo Secretariado]
  D --> F
  E --> F
  F --> G[5. Finalização e Envio ao Solicitante]
\`\`\`

**Gargalo detectado:** A etapa de triagem manual pode consumir até 30% a mais do tempo sem um formulário padronizado de entrada. 

Recomendo padronizar o checklist de recebimento para acelerar a tratativa.`,
    suggestions: [
      "Gerar Procedimento Padrão (SOP)",
      "Adicionar etapa de validação",
      "Criar checklist de triagem",
      "Exportar fluxo para a equipe"
    ],
    action: {
      type: "WORKFLOW_GENERATE",
      workflowName: "Triagem Padronizada"
    }
  };
}

// -------------------------------------------------------------
// FACUL ESTRATÉGIA - SWOT & Diagnostic Agent
// -------------------------------------------------------------
async function handleFaculEstrategia(message, context) {
  const geminiResponse = await callGemini({
    message,
    systemInstruction: "Você é o FACUL ESTRATÉGIA, especialista em matriz SWOT cruzada, plano 5W2H, análise de custos e estratégias de crescimento para PMEs e startups universitárias.",
    contextData: context.enterprise || {}
  });

  if (geminiResponse) {
    return {
      agent: "FACUL ESTRATÉGIA",
      badge: "Diagnóstico 5W2H & SWOT",
      response: geminiResponse,
      suggestions: ["Ver Ponto de Equilíbrio", "Atualizar Matriz SWOT", "Cadastrar Ação 5W2H"]
    };
  }

  return {
    agent: "FACUL ESTRATÉGIA",
    badge: "Diagnóstico 5W2H & SWOT",
    response: `Com base nas informações do seu negócio (modelo SaaS B2B com foco em Secretariado e IES), estruturei a **Matriz SWOT Cruzada**:

• **Forças + Oportunidades (Alavancagem):** Unir a vivência prática dos alunos de Secretariado e Tecnologia para criar soluções que ERPs legados não entregam (humanização e usabilidade simples).
• **Fraquezas + Ameaças (Defesa):** O investimento inicial enxuto (R$ 5.000,00) exige foco cirúrgico no piloto de 2 IES para alcançar o Ponto de Equilíbrio (R$ 1.220,00) rapidamente.

**Plano 5W2H Gerado:**
- **O que (What):** Piloto de validação da plataforma com 2 faculdades parceiras.
- **Por que (Why):** Comprovar a redução de evasão e diminuição do retrabalho na secretaria.
- **Quem (Who):** Equipe fundadora (Mariano, Fernanda, Etyene, Sthefanny, Thalis, Felipe).
- **Como (How):** Demonstração do dashboard e implantação assistida do assistente virtual.`,
    suggestions: [
      "Ver detalhes do Ponto de Equilíbrio",
      "Atualizar matriz SWOT",
      "Cadastrar nova ação no 5W2H",
      "Simular projeção financeira"
    ]
  };
}

// -------------------------------------------------------------
// FACUL DOCS - Executive Documentation Agent
// -------------------------------------------------------------
async function handleFaculDocs(message, context) {
  const geminiResponse = await callGemini({
    message,
    systemInstruction: "Você é o FACUL DOCS, redator executivo de atas de reuniões, normas ABNT, Procedimentos Operacionais Padrão (SOPs) e manuais administrativos.",
    contextData: context.enterprise || {}
  });

  if (geminiResponse) {
    return {
      agent: "FACUL DOCS",
      badge: "Gerador de Documentos & Atas",
      response: geminiResponse,
      suggestions: ["Exportar Ata em formato limpo", "Criar Checklist", "Elaborar POP"]
    };
  }

  return {
    agent: "FACUL DOCS",
    badge: "Gerador de Documentos & Atas",
    response: `Gerei o modelo oficial da **Ata de Reunião Secretarial**:

📄 **ATA DE REUNIÃO DE ALINHAMENTO ESTRATÉGICO**
**Data:** ${new Date().toLocaleDateString('pt-BR')} | **Pauta:** Implantação do Ecossistema Facul Mind
**Redatora:** Secretaria Executiva

**Principais Deliberações:**
1. Adoção dos agentes de IA para triagem de solicitações e monitoramento de retenção estudantil.
2. Homologação do módulo *Pausa Mind* como ferramenta de bem-estar e acolhimento preventivo.
3. Definição do cronograma de treinamentos para coordenadores e secretários.

O documento foi formatado nas normas da ABNT e está pronto para exportação!`,
    suggestions: [
      "Exportar Ata em formato limpo",
      "Criar Checklist Operacional",
      "Elaborar Manual de Rotinas (POP)",
      "Transcrever áudio de reunião"
    ],
    action: {
      type: "DOCUMENT_READY",
      title: "Ata de Alinhamento Estratégico"
    }
  };
}
