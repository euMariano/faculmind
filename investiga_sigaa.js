import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

async function investigarSigaa() {
    console.log('Iniciando investigação do SIGAA...');
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    try {
        const url = 'https://sigaa.ufpe.br/sigaa/verTelaLogin.do';
        console.log(`Navegando para: ${url}`);
        await page.goto(url, { waitUntil: 'networkidle2' });
        console.log('Página carregada. Tirando screenshot...');

        // 5. Tirar uma screenshot
        const screenshotPath = 'debug_sigaa.png';
        await page.screenshot({ path: screenshotPath });
        console.log(`Screenshot salva em: ${screenshotPath}`);

        // 3. Extrair os 'name' e 'id' de todos os elementos <input>
        const inputs = await page.evaluate(() => {
            const inputElements = Array.from(document.querySelectorAll('input'));
            return inputElements.map(input => ({
                name: input.getAttribute('name'),
                id: input.getAttribute('id'),
                type: input.getAttribute('type'),
                value: input.getAttribute('value')
            }));
        });
        console.log(`Elementos <input> encontrados: ${inputs.length}`);

        // 4. Salvar essa lista de inputs em um arquivo inputs_sigaa.json
        const jsonPath = 'inputs_sigaa.json';
        fs.writeFileSync(jsonPath, JSON.stringify(inputs, null, 2), 'utf-8');
        console.log(`Dados dos inputs salvos em: ${jsonPath}`);

    } catch (error) {
        console.error('Ocorreu um erro durante a investigação:', error);
    } finally {
        // 6. Fechar o browser
        await browser.close();
        console.log('Navegador fechado. Investigação concluída.');
    }
}

investigarSigaa();
