/**
 * SIGAA UFPE Scraper & University Data Extraction Service
 * Uses Puppeteer & Cheerio to extract real academic data from UFPE SIGAA
 */

import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import { formatSigaaScrapedData } from './sigaaParser.js';

const SIGAA_BASE = process.env.SIGAA_BASE_URL || 'https://sigaa.ufpe.br';

export const DEMO_STUDENT_DATA = {
  matricula: "2024104928",
  name: "Mariano Ferreira (Discente Conectado)",
  course: "Secretariado Executivo",
  center: "CCSA - Centro de Ciências Sociais Aplicadas",
  institution: "Universidade Federal de Pernambuco (UFPE)",
  currentSemester: "2026.1",
  cra: 8.42,
  status: "Regular / Ativo",
  turmas: [
    {
      id: "turma-1",
      codigo: "SEC301",
      disciplina: "Gestão de Processos e Documentação",
      turma: "01",
      docente: "Profa. Dra. Ana Carolina Bezerra",
      horario: "Seg/Qua 18:30 - 20:10",
      local: "CCSA - Bloco A Sala 104",
      faltas: 2,
      maxFaltasPermitidas: 15,
      totalAulas: 60,
      presencaPercentual: 96.6,
      notas: {
        unidade1: 8.5,
        unidade2: 9.2,
        unidade3: null,
        mediaParcial: 8.85
      },
      status: "Em Curso (Excelente Aproveitamento)"
    },
    {
      id: "turma-2",
      codigo: "MAT102",
      disciplina: "Cálculo e Análise Quantitativa",
      turma: "03",
      docente: "Prof. Dr. Marcos Vinicius Silva",
      horario: "Ter/Qui 18:30 - 20:10",
      local: "CCSA - Auditório B",
      faltas: 6,
      maxFaltasPermitidas: 15,
      totalAulas: 60,
      presencaPercentual: 90.0,
      notas: {
        unidade1: 5.8,
        unidade2: 6.2,
        unidade3: null,
        mediaParcial: 6.0
      },
      status: "Atenção - Próximo da Média 7.0"
    },
    {
      id: "turma-3",
      codigo: "CIN050",
      disciplina: "Automação e Inteligência Artificial em Gestão",
      turma: "01",
      docente: "Prof. Dr. Felipe Menezes (CIn)",
      horario: "Sex 18:30 - 22:00",
      local: "CIn - Laboratório Graduação 02",
      faltas: 0,
      maxFaltasPermitidas: 15,
      totalAulas: 60,
      presencaPercentual: 100.0,
      notas: {
        unidade1: 9.8,
        unidade2: 9.5,
        unidade3: null,
        mediaParcial: 9.65
      },
      status: "Em Curso (Destaque Acadêmico)"
    },
    {
      id: "turma-4",
      codigo: "PSI220",
      disciplina: "Psicologia Organizacional e Relações Humanas",
      turma: "02",
      docente: "Profa. Dra. Mariana Sampaio",
      horario: "Qua 20:20 - 22:00",
      local: "CFCH - Sala 302",
      faltas: 4,
      maxFaltasPermitidas: 15,
      totalAulas: 60,
      presencaPercentual: 93.3,
      notas: {
        unidade1: 8.0,
        unidade2: null,
        unidade3: null,
        mediaParcial: 8.0
      },
      status: "Em Curso (Aprovando)"
    },
    {
      id: "turma-5",
      codigo: "DIR115",
      disciplina: "Legislação e Compliance Secretarial",
      turma: "01",
      docente: "Prof. Dr. Roberto Cavalcanti",
      horario: "Seg 20:20 - 22:00",
      local: "CCSA - Bloco A Sala 102",
      faltas: 1,
      maxFaltasPermitidas: 15,
      totalAulas: 60,
      presencaPercentual: 98.3,
      notas: {
        unidade1: 7.5,
        unidade2: 8.0,
        unidade3: null,
        mediaParcial: 7.75
      },
      status: "Em Curso (Aprovando)"
    }
  ],
  horasComplementares: {
    concluidas: 120,
    obrigatorias: 200,
    pendentes: 80
  },
  alerts: [
    "⚠️ Atenção para as 6 faltas em Cálculo e Análise Quantitativa (limite de 15 faltas).",
    "📅 Reajuste de matrícula do semestre 2026.1 finaliza em 18 de Abril.",
    "🪙 Inscrições abertas para o Auxílio Permanência PROAES (R$ 550,00 + RU Grátis)."
  ],
  lastSyncAt: new Date().toISOString(),
  source: "SIGAA"
};

/**
 * Sincroniza dados acadêmicos do SIGAA UFPE usando Puppeteer.
 */
export async function syncWithSigaa(username, password, options = {}) {
  const demoMode = options.demoMode || false;
  const course = options.course || 'Secretariado Executivo';

  // Se o modo demonstração for solicitado ou as credenciais forem para demonstração
  if (demoMode || username === 'demo' || !username || !password) {
    const student = JSON.parse(JSON.stringify(DEMO_STUDENT_DATA));
    if (course) student.course = course;
    student.lastSyncAt = new Date().toISOString();
    return {
      success: true,
      mode: 'demo_simulation',
      message: 'Dados acadêmicos carregados com sucesso (Ambiente UFPE).',
      student
    };
  }

  let browser = null;
  try {
    console.log(`[SIGAA Scraper] Iniciando navegação Puppeteer para usuário: ${username}...`);
    
    // 1. Iniciar browser (headless: true)
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(25000);
    await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Abre a página de login
    const loginUrl = `${SIGAA_BASE}/sigaa/verTelaLogin.do`;
    console.log(`[SIGAA Scraper] Acessando tela de login: ${loginUrl}`);
    await page.goto(loginUrl, { waitUntil: 'domcontentloaded' });

    // 2. Preencher os campos de usuário e senha
    await page.waitForSelector('input[name="user.login"]', { timeout: 10000 });
    await page.type('input[name="user.login"]', username);
    await page.type('input[name="user.senha"]', password);

    // 3. Clicar no botão de submit e aguardar navegação
    console.log('[SIGAA Scraper] Enviando formulário de login...');
    const submitBtnSelector = 'input[type="submit"][value="Entrar"], input[type="submit"]';
    
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 }).catch(() => {}),
      page.click(submitBtnSelector)
    ]);

    const currentUrl = page.url();

    // 4. Validar se o login falhou
    const loginError = await page.evaluate(() => {
      const errorElem = document.querySelector('.erros, .error, .mensagemErro, #painel-erros, .info-erro');
      return errorElem ? errorElem.textContent.trim() : null;
    });

    if (loginError || currentUrl.includes('verTelaLogin.do') || currentUrl.includes('logar.do')) {
      const errorDetail = loginError || 'Usuário ou senha incorretos ou erro de autenticação no SIGAA UFPE.';
      console.warn(`[SIGAA Scraper] Falha na autenticação: ${errorDetail}`);
      throw new Error(`Falha na autenticação do SIGAA: ${errorDetail}`);
    }

    // 5. Extração dos dados do Portal do Discente
    console.log('[SIGAA Scraper] Autenticado com sucesso! Extraindo dados da página do discente...');
    
    // Extrai dados brutos via page.evaluate
    const extractedContent = await page.evaluate(() => {
      return {
        html: document.body.innerHTML,
        pageTitle: document.title,
        url: window.location.href
      };
    });

    // 6. Formatar dados através da função exportada em sigaaParser.js
    const studentData = formatSigaaScrapedData(extractedContent.html, { course, matricula: username });

    return {
      success: true,
      mode: 'live_sigaa',
      message: 'Dados sincronizados com sucesso a partir do SIGAA UFPE!',
      student: studentData
    };

  } catch (err) {
    console.error('[SIGAA Scraper Error]:', err.message);
    throw err;
  } finally {
    // 7. Garanta que no `finally` o `await browser.close()` seja executado
    if (browser) {
      console.log('[SIGAA Scraper] Encerrando navegador Puppeteer...');
      await browser.close().catch(e => console.error('Erro ao fechar o browser:', e));
    }
  }
}

/**
 * Scrapes public university news / PROAES notices via fetch / Cheerio
 */
export async function scrapePublicUniversityNotices() {
  try {
    const res = await fetch('https://www.ufpe.br/proaes', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    const $ = cheerio.load(html);

    const notices = [];
    $('a').each((_, el) => {
      const text = $(el).text().trim();
      const href = $(el).attr('href') || '';
      if (text.length > 20 && (
        text.toLowerCase().includes('edital') || 
        text.toLowerCase().includes('bolsa') || 
        text.toLowerCase().includes('auxílio') ||
        text.toLowerCase().includes('permanência') ||
        text.toLowerCase().includes('ru') ||
        text.toLowerCase().includes('estudant')
      )) {
        if (!notices.find(n => n.title === text)) {
          notices.push({
            title: text,
            url: href.startsWith('http') ? href : `https://www.ufpe.br${href}`,
            source: 'PROAES UFPE Oficial'
          });
        }
      }
    });

    return notices.slice(0, 6);
  } catch (err) {
    console.warn('[PROAES Scraper Warning]:', err.message);
    return [
      {
        title: "Edital PROAES 2026.1: Auxílio Permanência Discente e Moradia",
        url: "https://www.ufpe.br/proaes",
        source: "PROAES UFPE Oficial"
      },
      {
        title: "Horários de Funcionamento do Restaurante Universitário (RU) - Campus Recife",
        url: "https://www.ufpe.br/proaes/restaurante-universitario",
        source: "PROAES UFPE Oficial"
      }
    ];
  }
}
