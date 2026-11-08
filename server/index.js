import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dataStore } from './data/store.js';
import { processAgentMessage } from './agents/orchestrator.js';
import { scrapeSigaaStudent, scrapePublicUniversityNotices } from './services/sigaaScraper.js';
import { parseSigaaContent } from './services/sigaaParser.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Public static files
app.use('/assets', express.static(path.join(__dirname, '../public')));

// -------------------------------------------------------------
// Status endpoint
// -------------------------------------------------------------
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    system: 'Facul Mind Multi-Agent AI & Platform',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    geminiConfigured: !!(process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes('sua_chave')),
    sigaaIntegration: 'active',
    agents: [
      { id: 'agy-ufpe', name: 'Agy (Assistente UFPE)', role: 'Jornada Acadêmica & RAG' },
      { id: 'facul-organiza', name: 'FACUL ORGANIZA', role: 'Estrutura & Organograma' },
      { id: 'facul-fluxo', name: 'FACUL FLUXO', role: 'Mapeamento de Processos & BPMN' },
      { id: 'facul-estrategia', name: 'FACUL ESTRATÉGIA', role: 'SWOT & 5W2H' },
      { id: 'facul-docs', name: 'FACUL DOCS', role: 'Atas, SOPs e Manuais' }
    ]
  });
});

// -------------------------------------------------------------
// AI Chat Endpoint (Passo 3: Gemini & Student Context)
// -------------------------------------------------------------
app.post('/api/chat', async (req, res) => {
  try {
    const { message, agentId, context } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Mensagem obrigatória' });
    }

    const reply = await processAgentMessage({ message, agentId, context });
    res.json(reply);
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Erro ao processar mensagem do agente', details: err.message });
  }
});

// -------------------------------------------------------------
// University Integration & Web Scraping (Passo 4 - SIGAA UFPE)
// -------------------------------------------------------------
app.post('/api/sync-university', async (req, res) => {
  try {
    const { username, password, demoMode, course } = req.body;
    const result = await scrapeSigaaStudent({ username, password, demoMode, course });
    if (result.success && result.student) {
      dataStore.saveStudentAcademicRecord(result.student);
    }
    res.json(result);
  } catch (err) {
    console.error('Error syncing university data:', err);
    res.status(500).json({ success: false, error: 'Falha ao sincronizar com SIGAA UFPE', details: err.message });
  }
});

app.get('/api/sync-university/current', (req, res) => {
  const current = dataStore.getStudentAcademicRecord();
  res.json({ success: true, student: current });
});

// Import real session data from SIGAA 2nd Tab (Bookmarklet or Source Paste)
app.post('/api/sync-university/import', (req, res) => {
  try {
    const { html, rawText, studentName, matricula, course, turmas } = req.body;
    let parsedStudent = null;

    if (turmas && Array.isArray(turmas) && turmas.length > 0) {
      parsedStudent = {
        name: studentName || 'Discente UFPE (Sessão SIGAA)',
        matricula: matricula || `${Date.now()}`.slice(-10),
        course: course || 'Graduação UFPE',
        institution: 'Universidade Federal de Pernambuco (UFPE)',
        currentSemester: '2026.1',
        cra: 8.2,
        status: 'Regular / Ativo',
        turmas,
        alerts: turmas.filter(t => t.faltas >= 6).map(t => `⚠️ ${t.faltas} faltas registradas em ${t.disciplina}`),
        lastSyncAt: new Date().toISOString(),
        source: 'Sessão Autenticada no SIGAA (Aba Oficial)'
      };
    } else if (html || rawText) {
      parsedStudent = parseSigaaContent(html || rawText, { studentName, matricula, course });
    } else {
      return res.status(400).json({ error: 'Nenhum dado, tabela ou código HTML do SIGAA foi enviado.' });
    }

    dataStore.saveStudentAcademicRecord(parsedStudent);
    console.log(`[SIGAA 2-Tab Import] Sincronização concluída para: ${parsedStudent.name} (${parsedStudent.turmas.length} turmas)`);
    res.json({
      success: true,
      message: 'Dados acadêmicos sincronizados com sucesso diretamente da sua sessão do SIGAA!',
      student: parsedStudent
    });
  } catch (err) {
    console.error('Error importing SIGAA data:', err);
    res.status(500).json({ success: false, error: 'Falha ao processar dados do SIGAA: ' + err.message });
  }
});

// Configure and persist Gemini API Key dynamically
app.post('/api/config/gemini-key', async (req, res) => {
  try {
    const { apiKey } = req.body;
    if (!apiKey || apiKey.trim().length < 15) {
      return res.status(400).json({ error: 'Chave de API inválida' });
    }

    const key = apiKey.trim();
    // Validate with Gemini API
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const pingResult = await model.generateContent("Diga 'ok' em uma palavra.");
    const pingText = pingResult.response.text();

    if (!pingText) {
      return res.status(400).json({ error: 'A chave não retornou resposta do Google Gemini' });
    }

    // Set in environment variables
    process.env.GEMINI_API_KEY = key;
    process.env.VITE_GEMINI_API_KEY = key;

    // Update .env file
    const envPath = path.join(__dirname, '../.env');
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, 'utf-8');
      if (envContent.includes('GEMINI_API_KEY=')) {
        envContent = envContent.replace(/GEMINI_API_KEY=.*/g, `GEMINI_API_KEY=${key}`);
      } else {
        envContent += `\nGEMINI_API_KEY=${key}`;
      }
      if (envContent.includes('VITE_GEMINI_API_KEY=')) {
        envContent = envContent.replace(/VITE_GEMINI_API_KEY=.*/g, `VITE_GEMINI_API_KEY=${key}`);
      } else {
        envContent += `\nVITE_GEMINI_API_KEY=${key}`;
      }
      fs.writeFileSync(envPath, envContent, 'utf-8');
    }

    console.log('[Gemini Config] Chave de API Google Gemini conectada e validada!');
    res.json({
      success: true,
      message: 'Google Gemini conectado e validado com sucesso!'
    });
  } catch (err) {
    console.error('Gemini Key validation error:', err);
    res.status(400).json({
      success: false,
      error: 'Não foi possível validar a chave do Google Gemini: ' + (err.message || 'Verifique se a chave é válida no Google AI Studio.')
    });
  }
});

app.get('/api/university/notices', async (req, res) => {
  try {
    const notices = await scrapePublicUniversityNotices();
    res.json(notices);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao obter notícias da universidade' });
  }
});

// -------------------------------------------------------------
// Real-time Virtual Room & Networking (Passo 2)
// -------------------------------------------------------------
app.get('/api/room/postits', (req, res) => {
  res.json(dataStore.getPostIts());
});

app.post('/api/room/postits', (req, res) => {
  const { author, avatar, text, tag, color } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Texto do bilhete é obrigatório' });
  }
  const item = dataStore.addPostIt({ author, avatar, text, tag, color });
  res.status(201).json(item);
});

app.post('/api/room/postits/:id/like', (req, res) => {
  const { id } = req.params;
  const updated = dataStore.likePostIt(id);
  if (!updated) {
    return res.status(404).json({ error: 'Post-it não encontrado' });
  }
  res.json(updated);
});

app.get('/api/room/coffee-chats/:tableId', (req, res) => {
  const { tableId } = req.params;
  res.json(dataStore.getCoffeeChats(tableId));
});

app.post('/api/room/coffee-chats/:tableId', (req, res) => {
  const { tableId } = req.params;
  const { user, text } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Texto da mensagem é obrigatório' });
  }
  const msg = dataStore.addCoffeeMessage(tableId, { user, text });
  res.status(201).json(msg);
});

// -------------------------------------------------------------
// Academic Radar & Opportunities
// -------------------------------------------------------------
app.get('/api/radar/opportunities', (req, res) => {
  const { category, search } = req.query;
  let items = dataStore.getOpportunities();

  if (category && category !== 'Todos') {
    items = items.filter(i => i.category.toLowerCase() === category.toLowerCase());
  }

  if (search) {
    const term = search.toLowerCase();
    items = items.filter(i =>
      i.title.toLowerCase().includes(term) ||
      i.company.toLowerCase().includes(term) ||
      i.description.toLowerCase().includes(term)
    );
  }

  res.json(items);
});

app.post('/api/radar/opportunities/:id/apply', (req, res) => {
  const { id } = req.params;
  const { studentName, studentCourse, studentEmail } = req.body;
  const opp = dataStore.applyOpportunity(id, { studentName, studentCourse, studentEmail });
  if (!opp) {
    return res.status(404).json({ error: 'Oportunidade não encontrada' });
  }
  res.json({ success: true, message: 'Candidatura registrada com sucesso!', opportunity: opp });
});

// -------------------------------------------------------------
// Student Support Tickets ("Da Reclamação à Solução")
// -------------------------------------------------------------
app.get('/api/tickets', (req, res) => {
  res.json(dataStore.getTickets());
});

app.post('/api/tickets', (req, res) => {
  const { studentNickname, course, subject, category, description, priority, department } = req.body;
  if (!description || !subject) {
    return res.status(400).json({ error: 'Título e descrição são obrigatórios' });
  }
  const ticket = dataStore.createTicket({
    studentNickname,
    course,
    subject,
    category,
    description,
    priority,
    department
  });
  res.status(201).json(ticket);
});

// -------------------------------------------------------------
// Clinical Psychology Appointments
// -------------------------------------------------------------
app.get('/api/clinic', (req, res) => {
  res.json(dataStore.getClinicAppointments());
});

app.post('/api/clinic', (req, res) => {
  const { studentNickname, course, shift, urgency, preferredDays, reasonCategory, notes } = req.body;
  const appt = dataStore.createClinicAppointment({
    studentNickname,
    course,
    shift,
    urgency,
    preferredDays,
    reasonCategory,
    notes
  });
  res.status(201).json(appt);
});

// -------------------------------------------------------------
// Radar de Permanência & Retention Stats
// -------------------------------------------------------------
app.get('/api/permanencia', (req, res) => {
  res.json(dataStore.getPermanenciaStats());
});

app.post('/api/permanencia', (req, res) => {
  const { mood, notes, academicChallenge, financialChallenge } = req.body;
  const updated = dataStore.submitPermanenciaSurvey({ mood, notes, academicChallenge, financialChallenge });
  res.json({ success: true, stats: updated });
});

// -------------------------------------------------------------
// Enterprise & Secretarial System
// -------------------------------------------------------------
app.get('/api/enterprise', (req, res) => {
  res.json(dataStore.getEnterpriseData());
});

app.post('/api/enterprise/organization', (req, res) => {
  const { organization } = req.body;
  if (!organization || !Array.isArray(organization)) {
    return res.status(400).json({ error: 'Estrutura inválida de organograma' });
  }
  const updated = dataStore.updateOrgChart(organization);
  res.json(updated);
});

app.post('/api/enterprise/workflows', (req, res) => {
  const { name, trigger, steps, mermaid, bottlenecks } = req.body;
  const newWf = dataStore.addWorkflow({ name, trigger, steps, mermaid, bottlenecks });
  res.status(201).json(newWf);
});

app.post('/api/enterprise/checklists', (req, res) => {
  const { text, status, assignedTo, dueDate } = req.body;
  const item = dataStore.addChecklist({ text, status, assignedTo, dueDate });
  res.status(201).json(item);
});

app.put('/api/enterprise/checklists/:id/toggle', (req, res) => {
  const { id } = req.params;
  const updated = dataStore.toggleChecklist(id);
  if (!updated) {
    return res.status(404).json({ error: 'Item não encontrado' });
  }
  res.json(updated);
});

app.post('/api/enterprise/swot', (req, res) => {
  const updated = dataStore.updateSwot(req.body);
  res.json(updated);
});

app.post('/api/enterprise/documents', (req, res) => {
  const { title, type, agent, content } = req.body;
  const newDoc = dataStore.addDocument({ title, type, agent, content });
  res.status(201).json(newDoc);
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`🚀 Facul Mind Server rodando na porta ${PORT}`);
});
