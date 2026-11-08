/**
 * Facul Mind AI Agent Service (Passo 3)
 * Implements real Google Gemini API integration for student queries with contextData
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { api } from "./api";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
const hasClientKey = Boolean(apiKey && !apiKey.includes("sua_chave"));

let genAI: GoogleGenerativeAI | null = null;
let model: any = null;

if (hasClientKey) {
  try {
    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: `Você é o Assistente Virtual Oficial do Facul Mind (Agy UFPE).
Sua missão é auxiliar estudantes da Universidade Federal de Pernambuco (UFPE) a navegarem pelo SIGAA, evitarem faltas excessivas, aproveitarem bolsas (PROAES, PIBIC) e apoiarem sua saúde mental.
Quando contextData contiver informações acadêmicas do aluno, utilize os nomes de disciplinas, faltas e notas com total exatidão.`
    });
  } catch (err) {
    console.warn("Could not initialize client-side Gemini:", err);
  }
}

/**
 * Ask Facul Mind AI Assistant with rich student contextData
 */
export async function askFaculMind(userMessage: string, contextData: Record<string, unknown> = {}) {
  // If client-side Gemini is directly configured
  if (model && hasClientKey) {
    try {
      const prompt = `
        Você é o assistente virtual do Facul Mind.
        Contexto do Aluno: ${JSON.stringify(contextData, null, 2)}
        Pergunta do aluno: ${userMessage}
      `;
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (err) {
      console.warn("Client-side Gemini failed, falling back to server orchestrator:", err);
    }
  }

  // Delegated to backend orchestrator (which also has Gemini server-side + SIGAA context)
  const response = await api.sendChatMessage(userMessage, 'agy-ufpe', contextData);
  return response.response;
}
