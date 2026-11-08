/**
 * SIGAA UFPE Data Parser Service
 * Extrai estritamente apenas dados confirmados do HTML/texto do SIGAA UFPE.
 * Sem dados inventados ou fallbacks simulados.
 */

import * as cheerio from 'cheerio';

/**
 * Normaliza strings para auxiliar em comparações sem acento e caixa baixa.
 */
function normalizeString(str) {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Extrai turmas do Portal do Discente (`discente.jsf`)
 * Tabela identificada especificamente pelo cabeçalho contendo "Componente Curricular".
 */
export function parsePortalDiscenteHtml(html) {
  const $ = cheerio.load(html || '');
  const turmas = [];
  let currentSemester = null;

  // Localizar a tabela do portal pelo cabeçalho "Componente Curricular"
  $('table').each((_, table) => {
    const headers = $(table).find('th').map((__, th) => $(th).text().trim()).get();
    const hasComponenteHeader = headers.some(h => normalizeString(h).includes('componente curricular'));

    if (hasComponenteHeader) {
      $(table).find('tr').each((__, row) => {
        // Verificar se é linha de semestre/período (ex: td com colspan ou texto de período 202X.X)
        const semesterTd = $(row).find('td[colspan], td.periodo, th.periodo');
        if (semesterTd.length > 0) {
          const semText = semesterTd.text().trim();
          const match = semText.match(/(\d{4}\.\d)/);
          if (match) {
            currentSemester = match[1];
          }
          return;
        }

        // Ignorar linhas de cabeçalho puro
        if ($(row).find('th').length > 0) return;

        const descTd = $(row).find('td.descricao');
        const infoTds = $(row).find('td.info');

        if (descTd.length > 0) {
          const disciplinaName = descTd.text().trim();

          // Se for linha de separador visual (colspan sem conteúdo útil ou texto curto)
          if (!disciplinaName || disciplinaName.length < 3) return;

          let local = null;
          let horario = null;

          if (infoTds.length >= 2) {
            local = $(infoTds[0]).text().trim() || null;
            horario = $(infoTds[1]).text().trim() || null;
          } else if (infoTds.length === 1) {
            local = $(infoTds[0]).text().trim() || null;
          }

          turmas.push({
            id: `turma-portal-${turmas.length + 1}`,
            periodo: currentSemester,
            codigo: null,
            disciplina: disciplinaName,
            turma: null,
            cargaHoraria: null,
            docente: null,
            horario,
            local,
            faltas: null,
            maxFaltasPermitidas: null,
            totalAulas: null,
            presencaPercentual: null,
            notas: null,
            status: null
          });
        }
      });
    }
  });

  return { currentSemester, turmas };
}

/**
 * Extrai turmas da página "Todas as Turmas" (`turmas.jsf`)
 * Tabela identificada pelos cabeçalhos contendo "Disciplina", "Turma", "CH Total" e "Horário".
 */
export function parseTodasAsTurmasHtml(html) {
  const $ = cheerio.load(html || '');
  const turmasPorPeriodo = [];
  let activePeriod = null;

  $('table').each((_, table) => {
    const headers = $(table).find('th').map((__, th) => $(th).text().trim()).get();
    const isTurmasTable = headers.some(h => normalizeString(h).includes('disciplina')) &&
                          headers.some(h => normalizeString(h).includes('turma')) &&
                          headers.some(h => normalizeString(h).includes('ch total'));

    if (isTurmasTable) {
      $(table).find('tr').each((__, row) => {
        // Checar se a linha define um novo período (td.periodo ou td[colspan])
        const periodoTd = $(row).find('td.periodo, td[class*="periodo"]');
        if (periodoTd.length > 0) {
          const match = periodoTd.text().trim().match(/(\d{4}\.\d)/);
          if (match) {
            activePeriod = match[1];
          }
          return;
        }

        if ($(row).find('th').length > 0) return;

        const cells = $(row).find('td');
        if (cells.length >= 4) {
          const firstColText = $(cells[0]).text().trim();
          const turmaText = $(cells[1]).text().trim() || null;
          const chText = $(cells[2]).text().trim();
          const horarioText = $(cells[3]).text().trim() || null;

          let codigo = null;
          let disciplina = firstColText;

          // Extrai código se formato for "CODIGO - NOME DA DISCIPLINA"
          const codeMatch = firstColText.match(/^([A-Z0-9]{4,8})\s*[-–]\s*(.+)/);
          if (codeMatch) {
            codigo = codeMatch[1].trim();
            disciplina = codeMatch[2].trim();
          }

          let cargaHoraria = null;
          const chMatch = chText.match(/(\d+)\s*h?/i);
          if (chMatch) {
            cargaHoraria = parseInt(chMatch[1], 10);
          }

          if (disciplina && disciplina.length > 2) {
            turmasPorPeriodo.push({
              id: `turma-listagem-${turmasPorPeriodo.length + 1}`,
              periodo: activePeriod,
              codigo,
              disciplina,
              turma: turmaText,
              cargaHoraria,
              docente: null,
              horario: horarioText,
              local: null,
              faltas: null,
              maxFaltasPermitidas: null,
              totalAulas: null,
              presencaPercentual: null,
              notas: null,
              status: null
            });
          }
        }
      });
    }
  });

  return turmasPorPeriodo;
}

/**
 * Combina os dados extraídos de `discente.jsf` e `turmas.jsf` de forma confiável e unívoca.
 */
export function mergeSigaaData(portalData, turmasHistorico) {
  const portalTurmas = portalData.turmas || [];
  const currentSemester = portalData.currentSemester;

  const turmasAtuais = portalTurmas.map(pt => {
    // Busca correspondências exatas no mesmo período e nome normalizado
    const matches = turmasHistorico.filter(th => 
      th.periodo && currentSemester && th.periodo === currentSemester &&
      normalizeString(th.disciplina) === normalizeString(pt.disciplina)
    );

    // Só mescla se houver exatamente uma correspondência inequívoca
    if (matches.length === 1) {
      const match = matches[0];
      return {
        ...pt,
        codigo: match.codigo || pt.codigo,
        turma: match.turma || pt.turma,
        cargaHoraria: match.cargaHoraria || pt.cargaHoraria,
        horario: pt.horario || match.horario
      };
    }

    return pt;
  });

  return {
    currentSemester,
    turmasAtuais
  };
}

/**
 * Formata os dados extraídos das páginas do SIGAA em um StudentAcademicRecord estrito.
 */
export function formatSigaaScrapedData(portalHtml, turmasHtml = '', options = {}) {
  const portalData = parsePortalDiscenteHtml(portalHtml);
  const historicoTurmas = parseTodasAsTurmasHtml(turmasHtml);
  const merged = mergeSigaaData(portalData, historicoTurmas);

  const $ = cheerio.load(portalHtml || '');

  // Nome do discente
  let name = options.studentName || null;
  if (!name) {
    name = $('#agenda-docente .nome, .info-discente .nome, #perfil-docente h3, span.nome-discente')
      .first()
      .text()
      .trim() || null;
  }

  // Matrícula
  let matricula = options.matricula || null;
  if (!matricula && portalHtml) {
    const matMatch = portalHtml.match(/Matr[íi]cula:?\s*<\/strong>\s*(\d{7,12})/i);
    if (matMatch) matricula = matMatch[1].trim();
  }

  // Curso
  let course = options.course || null;
  if (!course && portalHtml) {
    const courseMatch = portalHtml.match(/Curso:?\s*<\/strong>\s*([^<]+)/i);
    if (courseMatch) course = courseMatch[1].trim();
  }

  return {
    matricula,
    name,
    course,
    center: null,
    institution: 'Universidade Federal de Pernambuco (UFPE)',
    currentSemester: merged.currentSemester,
    cra: null, // Sem suposições de CRA
    status: null,
    turmas: merged.turmasAtuais,
    horasComplementares: null,
    alerts: [],
    lastSyncAt: new Date().toISOString(),
    source: options.source || 'SIGAA UFPE (Autenticado)'
  };
}

export function parseSigaaContent(rawContent, options = {}) {
  if (!rawContent || typeof rawContent !== 'string') {
    throw new Error('Conteúdo do SIGAA não fornecido.');
  }

  const parsed = formatSigaaScrapedData(rawContent, '', {
    ...options,
    source: 'SIGAA UFPE (Importação Manual)'
  });

  if (!parsed.turmas || parsed.turmas.length === 0) {
    throw new Error('Não foi possível identificar a tabela de disciplinas do Portal do Discente no HTML fornecido.');
  }

  return parsed;
}
