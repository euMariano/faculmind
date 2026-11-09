import React, { useState, useEffect } from 'react';
import { ActiveTab, StudentAcademicRecord } from './types';
import { Navbar } from './components/common/Navbar';
import { AcademicPortal } from './components/academic/AcademicPortal';
import { OpportunitiesFeed } from './components/academic/OpportunitiesFeed';
import { PausaMindHub } from './components/relax/PausaMindHub';
import { VirtualRoom3D } from './components/academic/VirtualRoom3D';
import { DashboardCoordinator } from './components/institutional/DashboardCoordinator';
import { EnterprisePlatform } from './components/enterprise/EnterprisePlatform';
import { FaculMindChatModal } from './components/chat/FaculMindChatModal';
import { useAuth } from './context/AuthContext';
import { ApiProvider, useApi } from './context/ApiContext';

const AppContent: React.FC = () => {
  const { currentUser, uid, loading, login, signup, logout } = useAuth();
  const api = useApi();

  const [activeTab, setActiveTab] = useState<ActiveTab>('academic');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatAgentId, setChatAgentId] = useState<string>('agy-ufpe');
  const [chatInitialPrompt, setChatInitialPrompt] = useState<string | null>(null);
  const [syncedStudent, setSyncedStudent] = useState<StudentAcademicRecord | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && currentUser) {
      api.getCurrentUniversityData()
        .then(res => {
          if (res.success && res.student) {
            setSyncedStudent(res.student);
          } else {
            setSyncedStudent(null);
          }
        })
        .catch((err) => {
          console.error("Erro ao carregar dados acadêmicos:", err);
          setSyncedStudent(null);
        });
    } else if (!loading && !currentUser) {
      setSyncedStudent(null);
    }
  }, [loading, currentUser, uid, api]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    try {
      await login(email, password);
    } catch (error: any) {
      setAuthError(error.message || 'Erro ao fazer login.');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    try {
      await signup(email, password);
    } catch (error: any) {
      setAuthError(error.message || 'Erro ao cadastrar.');
    }
  };

  const handleLogout = async () => {
    setAuthError(null);
    try {
      await logout();
    } catch (error: any) {
      setAuthError(error.message || 'Erro ao fazer logout.');
    }
  };

  const handleOpenChat = (agentId = 'agy-ufpe', initialMessage?: string) => {
    setChatAgentId(agentId);
    if (initialMessage) {
      setChatInitialPrompt(initialMessage);
    } else {
      setChatInitialPrompt(null);
    }
    setIsChatOpen(true);
  };

  const handleNavigateFromChat = (target: string) => {
    if (target === 'bolsas' || target === 'opportunities') {
      setActiveTab('opportunities');
    } else if (target === 'pausa-mind') {
      setActiveTab('pausa-mind');
    } else if (target === 'virtual-room') {
      setActiveTab('virtual-room');
    } else if (target === 'coordinator') {
      setActiveTab('coordinator');
    } else if (target === 'enterprise') {
      setActiveTab('enterprise');
    }
    setIsChatOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ufpe-burgundy text-white text-lg font-bold">
        Carregando Facul Mind...
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-ufpe-burgundy to-red-800 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
          <h2 className="text-3xl font-extrabold text-ufpe-burgundy mb-6 text-center">
            Bem-vindo ao Facul Mind
          </h2>
          <p className="text-center text-slate-600 mb-8">
            Conecte-se para organizar sua vida acadêmica e profissional.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-ufpe-burgundy focus:outline-none text-sm"
              required
            />
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-ufpe-burgundy focus:outline-none text-sm"
              required
            />
            {authError && <p className="text-red-500 text-xs text-center">{authError}</p>}
            <button
              type="submit"
              className="w-full bg-ufpe-burgundy text-white py-3 rounded-xl font-bold hover:bg-red-800 transition text-sm"
            >
              Entrar
            </button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-slate-600 text-sm">
              Não tem uma conta?{' '}
              <button
                onClick={handleSignup}
                className="text-ufpe-burgundy font-bold hover:underline"
              >
                Cadastre-se
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#fbfbf9] text-slate-800">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openChat={(agent) => handleOpenChat(agent)}
        onLogout={handleLogout}
        currentUserEmail={currentUser.email || 'Usuário'}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'academic' && (
          <AcademicPortal
            openChat={handleOpenChat}
            navigateToTab={setActiveTab}
            syncedStudent={syncedStudent}
            onSyncStudent={(student) => setSyncedStudent(student)}
          />
        )}
        {activeTab === 'opportunities' && <OpportunitiesFeed />}
        {activeTab === 'pausa-mind' && <PausaMindHub />}
        {activeTab === 'virtual-room' && <VirtualRoom3D currentUser={currentUser} />}
        {activeTab === 'coordinator' && <DashboardCoordinator />}
        {activeTab === 'enterprise' && (
          <EnterprisePlatform openChat={(agent) => handleOpenChat(agent)} />
        )}
      </main>

      <FaculMindChatModal
        isOpen={isChatOpen}
        onClose={() => {
          setIsChatOpen(false);
          setChatInitialPrompt(null);
        }}
        defaultAgent={chatAgentId}
        onNavigateAction={handleNavigateFromChat}
        contextData={{ student: syncedStudent, uid: currentUser.uid }}
        initialPrompt={chatInitialPrompt}
      />

      <footer className="bg-white border-t border-slate-200 mt-12 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-ufpe-burgundy text-white flex items-center justify-center font-bold text-xs">
              FM
            </div>
            <div>
              <p className="font-bold text-slate-800">Facul Mind Tecnologia Ltda.</p>
              <p className="text-[11px]">Ecossistema Universitário Integrado & Gestão Secretarial</p>
            </div>
          </div>

          <div className="text-center md:text-right space-y-0.5 text-[11px]">
            <p>Desenvolvido com carinho por estudantes de Secretariado Executivo da UFPE</p>
            <p className="text-slate-400">
              Mariano Ferreira • Fernanda Costa • Etyene Maria • Sthefanny Araújo • Thalis Guilherme • Felipe Gonçalves
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ApiProvider>
      <AppContent />
    </ApiProvider>
  );
};

export default App;
