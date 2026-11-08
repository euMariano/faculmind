/**
 * SIGAA UFPE Scraper & University Data Extraction Service
 * Extrai dados estritamente reais das páginas autenticadas do SIGAA UFPE usando Puppeteer.
 */

import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import { formatSigaaScrapedData } from './sigaaParser.js';

const SIGAA_BASE = process.env.SIGAA_BASE_URL || 'https://sigaa.ufpe.br';

/**
 * Sincroniza dados acadêmicos do SIGAA UFPE efetuando o fluxo real de autenticação e navegação.
 * @param {string} username - Usuário/Matrícula do discente
 * @param {string} password - Senha do SIGAA
 */
export async function syncWithSigaa(username, password) {
  if (!username || !password) {
    throw new Error('Usuário e senha do SIGAA são obrigatórios.');
  }

  let browser = null;
  try {
    console.log(`[SIGAA Scraper] Iniciando autenticação para discente: ${username}...`);
    
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
    page.setDefaultNavigationTimeout(35000);
    await page.setUserAgent(
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    // 1. Abrir a página de login
    const loginUrl = `${SIGAA_BASE}/sigaa/verTelaLogin.do`;
    console.log(`[SIGAA Scraper] Acessando URL de login: ${loginUrl}`);
    await page.goto(loginUrl, { waitUntil: 'domcontentloaded' });

    // 2. Aguardar o formulário de login e extrair action e campos dinâmicos
    await page.waitForSelector('input[name="user.login"]', { timeout: 10000 });

    // Preencher usuário e senha
    await page.type('input[name="user.login"]', username);
    await page.type('input[name="user.senha"]', password);

    // 3. Submeter formulário de login
    console.log('[SIGAA Scraper] Submetendo credenciais no formulário...');
    const submitBtnSelector = 'input[type="submit"][value="Entrar"], button[type="submit"]';

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {}),
      page.click(submitBtnSelector)
    ]);

    const currentUrl = page.url();

    // 4. Validar se o login falhou
    const loginError = await page.evaluate(() => {
      const errorElem = document.querySelector('.erros, .error, .mensagemErro, #painel-erros, .info-erro');
      return errorElem ? errorElem.textContent.trim() : null;
    });

    if (loginError || currentUrl.includes('verTelaLogin.do') || currentUrl.includes('logar.do')) {
      const errorDetail = loginError || 'Usuário ou senha incorretos, ou a sessão não pôde ser iniciada no SIGAA UFPE.';
      console.warn(`[SIGAA Scraper] Falha na autenticação: ${errorDetail}`);
      throw new Error(`Falha na autenticação do SIGAA: ${errorDetail}`);
    }

    // 5. Extração do HTML da página inicial autenticada (discente.jsf)
    console.log('[SIGAA Scraper] Autenticado! Extraindo Portal do Discente...');
    const portalHtml = await page.evaluate(() => document.body.innerHTML);

    // 6. Navegar para a página de Turmas Anteriores (turmas.jsf) para obter códigos/carga horária
    let turmasHtml = '';
    try {
      const turmasUrl = `${SIGAA_BASE}/sigaa/portais/discente/turmas.jsf`;
      console.log(`[SIGAA Scraper] Acessando histórico de turmas: ${turmasUrl}`);
      await page.goto(turmasUrl, { waitUntil: 'domcontentloaded' });
      turmasHtml = await page.evaluate(() => document.body.innerHTML);
    } catch (turmasErr) {
      console.warn('[SIGAA Scraper] Não foi possível carregar turmas.jsf, prosseguindo apenas com Portal do Discente:', turmasErr.message);
    }

    // 7. Formatar dados extraídos estritamente
    const studentData = formatSigaaScrapedData(portalHtml, turmasHtml, { matricula: username });

    if (!studentData.turmas || studentData.turmas.length === 0) {
      console.warn('[SIGAA Scraper] Nenhuma turma foi encontrada no Portal do Discente.');
    }

    return {
      success: true,
      mode: 'live_sigaa',
      message: 'Sincronização com o SIGAA UFPE realizada com sucesso!',
      student: studentData
    };

  } catch (err) {
    console.error('[SIGAA Scraper Error]:', err.message);
    throw err;
  } finally {
    if (browser) {
      console.log('[SIGAA Scraper] Encerrando instância do browser...');
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
    return [];
  }
}
