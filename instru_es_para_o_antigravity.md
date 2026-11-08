# 🚀 Missão: Transformar o Mockup "Facul Mind" em um Produto Real Funcional

**Contexto para o Agente:** 
Você está atuando em um projeto Node.js/React (`Facul Mind`) que possui a interface gráfica (UI) pronta, mas atualmente utiliza dados mockados, chats simulados e um agente de IA de mentira. Sua missão é plugar APIs e bancos de dados reais **sem reescrever a interface inteira**, apenas substituindo o estado local e os mocks por integrações reais. 

## 🛠️ Stack Tecnológica e APIs (Tier Gratuito)
Você utilizará a seguinte stack para dar vida ao projeto:
1. **Real-time Database & Auth:** `Firebase` (Firestore para chats em tempo real e Firebase Auth para autenticação de alunos).
2. **Inteligência Artificial:** `Google Gemini API` (`@google/generative-ai`). Gratuito, rápido e excelente para manter o contexto das conversas do aluno.
3. **Extração de Dados (Integração Universitária):** `Puppeteer` (Web Scraping do portal acadêmico - ex: SIGAA). Como as universidades geralmente não possuem APIs abertas, usaremos o Puppeteer em uma rota Node.js/Firebase Functions para raspar as turmas e notas do usuário, baseando-nos na lógica da biblioteca `sigaa-api`.
4. **Deploy de Backend (se necessário):** `Railway` (Integração contínua com GitHub) para hospedar a API de Web Scraping via Docker, caso as Functions do Firebase fiquem pesadas para o Puppeteer.

---

## 📋 Instruções de Execução Passo a Passo (Mete Marcha)

### Passo 1: Preparação do Ambiente e Dependências
Execute a instalação dos pacotes necessários no diretório do projeto:
```bash
npm install firebase @google/generative-ai puppeteer express cors dotenv
```
*Crie um arquivo `.env` na raiz e exija que o desenvolvedor insira as chaves reais (GEMINI_API_KEY e FIREBASE_CONFIG).*

### Passo 2: Substituir o Chat Mockado por Tempo Real (Firebase)
1. Crie um arquivo `src/services/firebase.js` inicializando o app.
2. Identifique os componentes de UI que renderizam o feed/chat de Networking.
3. Substitua o estado (ex: `useState(fakeChats)`) pelo listener do Firestore (`onSnapshot`).
4. **Lógica de Envio:** O botão de "Enviar Mensagem" deve fazer um `addDoc()` na coleção `chats` do Firestore.

### Passo 3: Implementar o Agente IA Real (Gemini)
1. Localize o componente ou função do bot de IA (`documenta_o_do_agente_ia_facul_mind.md` te dará o contexto de como a persona deve agir).
2. Crie o arquivo `src/services/ai_agent.js`.
3. Utilize o seguinte snippet base para a integração:
```javascript
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function askFaculMind(userMessage, contextData) {
  const prompt = `
    Você é o assistente virtual do Facul Mind.
    Contexto do Aluno: ${JSON.stringify(contextData)}
    Pergunta do aluno: ${userMessage}
  `;
  const result = await model.generateContent(prompt);
  return result.response.text();
}
```
4. Conecte o input do usuário na UI a esta função. O `contextData` virá do próximo passo.

### Passo 4: Extração de Dados Reais da Universidade (Web Scraping)
Como não há API oficial, o produto só será "real" se trouxer os dados do SIGAA/Portal do Aluno do usuário.
1. Crie uma rota backend (ou Firebase Function) chamada `/api/sync-university`.
2. Use o **Puppeteer** para simular o login do aluno com as credenciais (que não devem ser salvas no BD de forma legível por questões de segurança, devem trafegar apenas na sessão).
3. **Fluxo do Scraping:**
   - Acessar a URL de login do SIGAA.
   - Preencher os inputs de usuário e senha e submeter.
   - Navegar até "Minhas Turmas" ou "Portal do Discente".
   - Fazer um parse no HTML da tabela para extrair: *Nome da Disciplina*, *Faltas* e *Notas*.
   - Retornar um JSON limpo para o frontend.
4. Alimente esse JSON de volta para o Agente IA (passo 3), para que o Gemini possa responder coisas como: *"Como estou em Cálculo 2?"* de forma 100% verídica.

### Passo 5: Teste e Ajustes Finais
- Execute a aplicação. Verifique o terminal para erros de compilação.
- Não altere as rotas do React Router nem o layout do CSS/Tailwind, restrinja-se a modificar a camada de dados e lógica nos componentes.