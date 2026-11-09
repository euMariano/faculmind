import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { authInstance } from '../services/firebase';

interface AuthContextType {
  currentUser: User | null;
  uid: string | null;
  loading: boolean;
  idToken: string | null;
  login: (email: string, password: string) => Promise<User>;
  signup: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [idToken, setIdToken] = useState<string | null>(null);

  useEffect(() => {
    if (!authInstance) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(authInstance, async (user) => {
      setCurrentUser(user);
      if (user) {
        const token = await user.getIdToken();
        setIdToken(token);
      } else {
        setIdToken(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    if (!authInstance) throw new Error("Firebase Auth não inicializado.");
    const userCredential = await signInWithEmailAndPassword(authInstance, email, password);
    return userCredential.user;
  };

  const signup = async (email: string, password: string) => {
    if (!authInstance) throw new Error("Firebase Auth não inicializado.");
    const userCredential = await createUserWithEmailAndPassword(authInstance, email, password);
    return userCredential.user;
  };

  const logout = async () => {
    if (!authInstance) throw new Error("Firebase Auth não inicializado.");
    await signOut(authInstance);
  };

  const getToken = async () => {
    if (currentUser) {
      return currentUser.getIdToken();
    }
    return null;
  };

  const value = {
    currentUser,
    uid: currentUser ? currentUser.uid : null,
    loading,
    idToken,
    login,
    signup,
    logout,
    getToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
