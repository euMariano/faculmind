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
import { api } from './services/api';
import { sound } from './services/sound';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('academic');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatAgentId, setChatAgentId] = useState<string>('agy-ufpe');
  const [chatInitialPrompt, setChatInitialPrompt] = useState<string | null>(null);
  const [syncedStudent, setSyncedStudent] = useState<StudentAcademicRecord | null>(null);

  // Load active academic record on startup if available in backend
  useEffect(() => {
    api.getCurrentUniversityData()
      .then(res => {
        if (res.success && res.student) {
          setSyncedStudent(res.student);
        }
      })
      .catch(() => {});
  }, []);

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

  return (
    <div className="min-h-screen flex flex-col bg-[#fbfbf9] text-slate-800">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openChat={(agent) => handleOpenChat(agent)}
      />

      {/* Main Container */}
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
        {activeTab === 'virtual-room' && <VirtualRoom3D />}
        {activeTab === 'coordinator' && <DashboardCoordinator />}
        {activeTab === 'enterprise' && (
          <EnterprisePlatform openChat={(agent) => handleOpenChat(agent)} />
        )}
      </main>

      {/* Floating Multi-Agent Chat Assistant */}
      <FaculMindChatModal
        isOpen={isChatOpen}
        onClose={() => {
          setIsChatOpen(false);
          setChatInitialPrompt(null);
        }}
        defaultAgent={chatAgentId}
        onNavigateAction={handleNavigateFromChat}
        contextData={{ student: syncedStudent }}
        initialPrompt={chatInitialPrompt}
      />

      {/* Footer */}
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

export default App;
