# 🧠 Facul Mind — Ecossistema Multi-Agentes & Plataforma Integrada

<div align="center">
  <img src="./public/mascot.jpeg" alt="FaculMind Mascote Agy" width="160" style="border-radius: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.15);" />
  <h3>Assistente Virtual & Gestão Secretarial Integrada</h3>
  <p><em>Iniciativa pioneira fundada por estudantes de Secretariado Executivo da <strong>Universidade Federal de Pernambuco (UFPE)</strong>.</em></p>
</div>

---

## 👥 Equipe Fundadora & Idealizadores
- **Mariano Ferreira**
- **Fernanda Costa**
- **Etyene Maria**
- **Sthefanny Araújo**
- **Thalis Guilherme**
- **Felipe Gonçalves**

> *"A FACUL MIND não é um custo para a faculdade, é um investimento que se paga sozinho ao evitar que 2 ou 3 alunos tranquem a matrícula por mês."*

---

## 🌟 Visão Geral do Sistema

O **Facul Mind** é uma plataforma SaaS B2B com arquitetura híbrida projetada para resolver dois desafios fundamentais:
1. **No Ambiente Universitário (UFPE):** Redução da evasão estudantil, centralização de avisos oficiais, apoio emocional através da Clínica-Escola de Psicologia, jogos de relaxamento (*Pausa Mind*) e conexões interdisciplinares na *Sala Virtual 3D*.
2. **No Ambiente Corporativo (PMEs & Secretariado):** Mapeamento de processos administrativos, organogramas dinâmicos, geração de atas e Procedimentos Operacionais Padrão (SOPs) por meio de um ecossistema multi-agentes de IA.

---

## 🏛️ Os Pilares Implementados

### 1. 🎓 Portal do Aluno & Hub UFPE
* **Assistente Virtual Agy:** Robôzinho mascote com capelo universitário da UFPE, headphones e visor expressivo em LED. Responde dúvidas em tempo real sobre Matrícula, SIGAA, Calendário Acadêmico, Restaurante Universitário (RU) e Auxílio Permanência.
* **Radar de Permanência:** Diagnóstico preventivo e termômetro de humor (`🎯 Focado`, `🤯 Ansioso`, `😴 Exausto`, `☕ Disposto`) com proteção e anonimização total de dados (conformidade LGPD).
* **Da Reclamação à Solução (Ouvidoria Anônima):** Permite registrar manifestações protegidas por pseudônimos, com emissão de protocolo rastreável (ex: `FM-2026-UFPE-0492`) e acompanhamento de respostas dos departamentos.
* **Acolhimento da Clínica-Escola de Psicologia:** Conexão direta e supervisionada entre alunos que necessitam de apoio emocional e estudantes dos últimos períodos de Psicologia da UFPE sob orientação docente (CRP-02).

### 2. 🧘 Pausa Mind (Relax & Jogos Terapêuticos)
* **Jardim Zen Interativo:** Canvas HTML5 onde o estudante desenha linhas de ancinho na areia, posiciona pedras lisas de rio e suculentas, acompanhado por sinos tibetanos de 528Hz sintetizados via Web Audio API.
* **Estoure as Bolhas:** Minijogo antiestresse com sons suaves de pop, física relaxante e guia de respiração (*Inspire, Segure, Expire*).
* **Cantinho de Colorir:** Pintura digital com ilustrações universitárias (mascote, capelo, xícara de café, livros) e paleta em tons pastéis.
* **Combine as Figuras:** Jogo de memória leve e acolhedor sem contagem regressiva ou punição.

### 3. 🏠 Sala Virtual 3D & Espaço Interdisciplinar
* **Mural de Parcerias:** Quadro de cortiça virtual para conexão entre cursos (ex: estudante de Ciência da Computação buscando colega de Secretariado Executivo para organizar o pitch e finanças do TCC).
* **A Mesa de Café:** Salas temáticas de bate-papo em tempo real (Inteligência Artificial, Eventos e Cerimonial, Estágios e Carreira).
* **Sofá dos Veteranos:** Espaço de mentoria prática onde veteranos compartilham dicas sobre disciplinas difíceis e aproveitamento de horas de extensão.
* **Central do Aluno Noturno:** Repositório de orientações e caronas para quem trabalha durante o dia.

### 4. 🧭 Radar de Oportunidades Estudantis
* Filtros dinâmicos por categoria: *Estágios*, *Grupos de Estudo*, *Eventos*, *Bolsas (PIBIC/PROAES)*.
* Vagas reais integradas (ex: Inova Consultoria, Grupo Noturno de Algoritmos & Tech, Palestra sobre IA no Secretariado).
* Modal de candidatura instantânea com feedback comemorativo.

### 5. 📊 Painel Gerencial da IES (Coordenação & Reitoria)
* **Taxa de Retenção Discente (84.2%)** com evolução temporal e engajamento.
* **Métricas de Comunicação Oficial:** 92% de avisos visualizados e 88% de taxa de resolução.
* **Alertas Preventivos:** Triagem de solicitações e identificação de turmas sobrecarregadas antes que ocorra o trancamento de matrícula.

### 6. 🏢 Facul Mind Empresarial (Multi-Agentes para PMEs)
* **FACUL ORGANIZA:** Agente analítico de organograma, hierarquia de cargos e detecção de sobreposição de funções.
* **FACUL FLUXO:** Agente de processos que converte relatos em diagramas de fluxo BPMN (Mermaid.js) e identifica gargalos de triagem.
* **FACUL ESTRATÉGIA:** Diagnóstico tático da empresa, Matriz SWOT cruzada e plano de ação estruturado no método 5W2H.
* **FACUL DOCS:** Gerador automatizado de atas de reunião, manuais de rotinas (SOPs) e checklists de tarefas secretariais.

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia | Função |
| :--- | :--- | :--- |
| **Frontend** | React 18, TypeScript, Tailwind CSS, Lucide Icons | Interface responsiva, moderna e fluida |
| **Tempo Real** | Firebase Firestore / REST Live Sync | Sincronização em tempo real de chats e mural colaborativo |
| **Inteligência Artificial** | Google Gemini API (`@google/generative-ai`) | Agente generativo contextualizado com dados reais discentes |
| **Extração de Dados** | Puppeteer & Cheerio Web Scraping | Extração e raspagem de turmas, faltas e notas do SIGAA UFPE |
| **Canvas & Áudio** | HTML5 Canvas, Web Audio API | Jardim Zen interativo e síntese de sons terapêuticos |
| **Efeitos Visuais** | Canvas Confetti, CSS Keyframe Animations | Feedback acolhedor e dinâmico |
| **Backend API** | Node.js, Express, REST API | Endpoints de dados, triagem e orquestração de IA |
| **Persistência** | File/JSON Store + Firestore Sync | Armazenamento de protocolos, vagas, agendamentos e fluxos |
| **Inteligência** | Multi-Agent Orchestrator | Roteador de agentes (Agy UFPE, Organiza, Fluxo, Estratégia, Docs) |

---

## ⚙️ Configuração de Variáveis de Ambiente (.env)

Copie o arquivo `.env.example` para `.env`:
```bash
cp .env.example .env
```

Preencha as chaves opcionais para habilitar os recursos em produção:
* `GEMINI_API_KEY` / `VITE_GEMINI_API_KEY`: Chave da API Google Gemini (gratuita no [Google AI Studio](https://aistudio.google.com/)).
* `VITE_FIREBASE_*`: Credenciais do projeto Firebase (Firestore em tempo real). *Caso não configurado, o sistema utiliza o mecanismo de sincronização em tempo real nativo do backend.*
* `SIGAA_BASE_URL`: URL base do portal acadêmico (padrão: `https://sigaa.ufpe.br`).

---

## 🚀 Como Executar o Sistema

### 1. Pré-requisitos
- Node.js (v18 ou superior)
- npm

### 2. Instalação
As dependências já estão instaladas no repositório. Para reinstalar se necessário:
```bash
npm install
```

### 3. Inicialização Completa (Frontend + Backend)
Para executar ambos os serviços simultaneamente:
```bash
npm start
```

Ou execute individualmente em terminais separados:
```bash
# Terminal 1: Iniciar API Backend (Porta 3001)
npm run server

# Terminal 2: Iniciar Servidor Frontend Vite (Porta 3000)
npm run dev
```

Abra seu navegador em: **`http://localhost:3000`**

---

## 🔒 Privacidade e Conformidade LGPD
- **Pseudônimos Obrigatórios:** Manifestações e acolhimentos não exigem nome civil nem CPF.
- **Isolamento de Dados:** Métricas exibidas à coordenação são sempre agregadas por turma ou centro acadêmico.
- **Rastreabilidade por Protocolo:** Códigos únicos (`FM-2026-UFPE-XXXX`) garantem que apenas o estudante consulte seu histórico.
