import dotenv from "dotenv";
import admin from "firebase-admin";

dotenv.config();

// Credenciais do Firebase Admin SDK obtidas das variáveis de ambiente
const serviceAccount = {
	projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
	clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
	privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"), // Substituir \\n por quebra de linha real
};

// Verifica se as credenciais estão presentes antes de inicializar
if (
	serviceAccount.projectId &&
	serviceAccount.clientEmail &&
	serviceAccount.privateKey
) {
	try {
		if (!admin.apps.length) {
			admin.initializeApp({
				credential: admin.credential.cert(serviceAccount),
			});
			console.log("🔥 Firebase Admin SDK inicializado com sucesso.");
		}
	} catch (error) {
		console.error("⚠️ Erro ao inicializar Firebase Admin SDK:", error.message);
	}
} else {
	console.warn(
		"ℹ️ Credenciais Firebase Admin SDK ausentes ou incompletas. Autenticação JWT não funcionará e requisições ao Firestore falharão.",
	);
}

export const auth = admin.auth();
export const db = admin.firestore(); // Exportando a instância do banco de dados (Firestore)
