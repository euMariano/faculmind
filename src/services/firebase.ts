/**
 * Firebase Real-Time Database & Firestore Service (Passo 2)
 * Manages real-time synchronization of networking chats and post-its.
 * Seamlessly falls back to Express REST API if Firebase keys are not yet configured in .env.
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  Firestore,
  serverTimestamp 
} from 'firebase/firestore';
import { api } from './api';

// Load Firebase configuration from Vite environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ""
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && 
  firebaseConfig.projectId && 
  !firebaseConfig.apiKey.includes('sua_chave')
);

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    db = getFirestore(app);
    console.log('🔥 Firebase Firestore conectado com sucesso para chats em tempo real.');
  } catch (err) {
    console.warn('⚠️ Falha ao inicializar Firebase. Operando via API Express:', err);
  }
} else {
  console.info('ℹ️ Firebase não configurado no .env. Operando com API Express sincronizada em tempo real.');
}

export { db };

// -------------------------------------------------------------
// Real-time Coffee Table Chats Listener & Sender
// -------------------------------------------------------------
export function subscribeToCoffeeChats(
  tableId: string, 
  onUpdate: (messages: Array<{ id?: string; user: string; text: string; time: string }>) => void
): () => void {
  // 1. If Firebase Firestore is active
  if (db && isFirebaseConfigured) {
    try {
      const q = query(
        collection(db, 'coffeeChats', tableId, 'messages'),
        orderBy('createdAt', 'asc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const msgs = snapshot.docs.map(doc => ({
          id: doc.id,
          user: doc.data().user,
          text: doc.data().text,
          time: doc.data().time || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        }));
        if (msgs.length > 0) {
          onUpdate(msgs);
        }
      }, (err) => {
        console.warn('Firestore onSnapshot error, falling back to REST API:', err);
      });

      return unsubscribe;
    } catch (err) {
      console.warn('Could not attach Firestore listener:', err);
    }
  }

  // 2. Fallback: REST API polling & synchronization
  let isSubscribed = true;
  const fetchMessages = async () => {
    try {
      const res = await api.getCoffeeChats(tableId);
      if (isSubscribed && Array.isArray(res)) {
        onUpdate(res);
      }
    } catch {
      // ignore network blips
    }
  };

  fetchMessages();
  const intervalId = setInterval(fetchMessages, 3000);

  return () => {
    isSubscribed = false;
    clearInterval(intervalId);
  };
}

export async function sendCoffeeChatMessage(
  tableId: string, 
  message: { user: string; text: string; time?: string }
) {
  // If Firebase Firestore is available
  if (db && isFirebaseConfigured) {
    try {
      await addDoc(collection(db, 'coffeeChats', tableId, 'messages'), {
        user: message.user,
        text: message.text,
        time: message.time || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        createdAt: serverTimestamp()
      });
      return;
    } catch (err) {
      console.warn('Erro ao salvar no Firestore, enviando para backend:', err);
    }
  }

  // Fallback to Express backend API
  return api.sendCoffeeMessage(tableId, message);
}

// -------------------------------------------------------------
// Real-time Post-Its Mural Listener & Sender
// -------------------------------------------------------------
export function subscribeToPostIts(
  onUpdate: (postIts: any[]) => void
): () => void {
  if (db && isFirebaseConfigured) {
    try {
      const q = query(collection(db, 'postIts'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        if (items.length > 0) {
          onUpdate(items);
        }
      }, (err) => {
        console.warn('Firestore postIts error:', err);
      });
      return unsubscribe;
    } catch (err) {
      console.warn('Firestore postIts listener error:', err);
    }
  }

  // Fallback to Express API polling
  let isSubscribed = true;
  const fetchPostIts = async () => {
    try {
      const res = await api.getPostIts();
      if (isSubscribed && Array.isArray(res)) {
        onUpdate(res);
      }
    } catch {
      // ignore
    }
  };

  fetchPostIts();
  const intervalId = setInterval(fetchPostIts, 3000);

  return () => {
    isSubscribed = false;
    clearInterval(intervalId);
  };
}

export async function createPostIt(postIt: {
  author: string;
  avatar?: string;
  text: string;
  tag?: string;
  color?: string;
}) {
  if (db && isFirebaseConfigured) {
    try {
      const docRef = await addDoc(collection(db, 'postIts'), {
        ...postIt,
        likes: 1,
        createdAt: serverTimestamp()
      });
      return { id: docRef.id, ...postIt, likes: 1 };
    } catch (err) {
      console.warn('Firestore addDoc postIts error, falling back to backend:', err);
    }
  }

  return api.addPostIt(postIt);
}

export async function likePostIt(id: string | number) {
  return api.likePostIt(id);
}
