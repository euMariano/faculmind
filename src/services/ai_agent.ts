/**
 * Facul Mind AI Agent Service
 * Todas as chamadas de IA são realizadas pelo backend.
 */

import type { ApiService } from "./api";

export async function askFaculMind(userMessage: string, api: ApiService) {
	const response = await api.sendChatMessage(userMessage, "agy-ufpe");

	return response.response;
}
