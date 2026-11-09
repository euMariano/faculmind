/**
 * Firebase Real-Time Database & Firestore Service (Passo 2)
 * Manages real-time synchronization of networking chats and post-its.
 * Seamlessly falls back to Express REST API if Firebase keys are not yet configured in .env.
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
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
import { ApiService } from './api';

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
  !firebaseConfig.apiKey.includes('sua_chave') &&
  !firebaseConfig.apiKey.includes('YOUR_API_KEY')
);

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let authInstance: Auth | null = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    db = getFirestore(app);
    authInstance = getAuth(app);
    console.log('🔥 Firebase conectado com sucesso. Firestore e Auth disponíveis.');
  } catch (err) {
    console.warn('⚠️ Falha ao inicializar Firebase SDKs. Algumas funcionalidades podem não funcionar:', err);
  }
} else {
  console.info('ℹ️ Firebase não configurado no .env ou chave placeholder. Operando com API Express e funcionalidades limitadas.');
}

export { db, authInstance };

// -------------------------------------------------------------
// Real-time Coffee Table Chats Listener & Sender
// -------------------------------------------------------------
export function subscribeToCoffeeChats(
  tableId: string, 
  onUpdate: (messages: Array<{ id?: string; user: string; text: string; time: string }>) => void,
  apiInstance?: ApiService
): () => void {
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

  let isSubscribed = true;
  const fetchMessages = async () => {
    if (!apiInstance) return;
    try {
      const res = await apiInstance.getCoffeeChats(tableId);
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
  message: { user: string; text: string; time?: string },
  apiInstance?: ApiService
) {
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

  if (apiInstance) {
    return apiInstance.sendCoffeeMessage(tableId, message);
  }
}

// -------------------------------------------------------------
// Real-time Post-Its Mural Listener & Sender
// -------------------------------------------------------------
export function subscribeToPostIts(
  onUpdate: (postIts: any[]) => void,
  apiInstance?: ApiService
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

  let isSubscribed = true;
  const fetchPostIts = async () => {
    if (!apiInstance) return;
    try {
      const res = await apiInstance.getPostIts();
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

export async function createPostIt(
  postIt: {
    author: string;
    avatar?: string;
    text: string;
    tag?: string;
    color?: string;
  },
  apiInstance?: ApiService
) {
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

  if (apiInstance) {
    return apiInstance.addPostIt(postIt);
  }
}

export async function likePostIt(id: string | number, apiInstance?: ApiService) {
  if (apiInstance) {
    return apiInstance.likePostIt(id);
  }
}
