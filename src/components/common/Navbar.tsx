import React from 'react';
import { 
  GraduationCap, 
  Briefcase, 
  Sparkles, 
  Compass, 
  BarChart3, 
  Building2, 
  Volume2, 
  VolumeX, 
  MessageSquare
} from 'lucide-react';
import { ActiveTab } from '../../types';
import { sound } from '../../services/sound';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  openChat: (agentId?: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, openChat }) => {
  const [soundOn, setSoundOn] = React.useState(sound.isEnabled());

  const toggleSound = () => {
    const newState = !soundOn;
    sound.setSoundEnabled(newState);
    setSoundOn(newState);
    if (newState) sound.playPop();
  };

  const navItems = [
    {
      id: 'academic' as ActiveTab,
      label: 'Portal UFPE',
      icon: GraduationCap,
      badge: 'Aluno',
      color: 'hover:text-ufpe-burgundy'
    },
    {
      id: 'opportunities' as ActiveTab,
      label: 'Radar Oportunidades',
      icon: Compass,
      badge: '5 Novas',
      color: 'hover:text-emerald-700'
    },
    {
      id: 'pausa-mind' as ActiveTab,
      label: 'Pausa Mind',
      icon: Sparkles,
      badge: 'Relax',
      color: 'hover:text-amber-600'
    },
    {
      id: 'virtual-room' as ActiveTab,
      label: 'Sala Virtual 3D',
      icon: Briefcase,
      badge: 'Interdisciplinar',
      color: 'hover:text-indigo-600'
    },
    {
      id: 'coordinator' as ActiveTab,
      label: 'Painel Gestão IES',
      icon: BarChart3,
      badge: 'Reitoria',
      color: 'hover:text-teal-700'
    },
    {
      id: 'enterprise' as ActiveTab,
      label: 'Facul Mind Empresarial',
      icon: Building2,
      badge: 'Secretariado',
      color: 'hover:text-mind-green'
    }
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      {/* Top Banner Notice */}
      <div className="bg-ufpe-burgundy text-white px-4 py-1 text-xs font-medium flex items-center justify-between">
        <div className="flex items-center gap-2 mx-auto sm:mx-0">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span>Ecossistema Facul Mind 2026 • Integração UFPE & Gestão Secretarial Multi-Agentes</span>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-rose-100">
          <span>Iniciativa Secretariado Executivo</span>
          <span>•</span>
          <button 
            onClick={toggleSound} 
            className="flex items-center gap-1 hover:text-white transition"
            title="Ativar/Desativar Sons Relaxantes"
          >
            {soundOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
            <span>{soundOn ? 'Áudio Zen Ligado' : 'Áudio Mudo'}</span>
          </button>
        </div>
      </div>

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div 
            onClick={() => { setActiveTab('academic'); sound.playPop(); }}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-ufpe-burgundy to-mind-green flex items-center justify-center text-white shadow-md shadow-rose-900/10 group-hover:scale-105 transition transform">
              <GraduationCap size={22} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-slate-900 font-sans">
                  Facul<span className="text-ufpe-burgundy">Mind</span>
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-ufpe-burgundy rounded-full">
                  AI Hub
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Universidade & Gestão Secretarial</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    sound.playPop();
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all relative ${
                    isActive 
                      ? 'bg-slate-100 text-slate-900 shadow-xs' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon size={16} className={isActive ? 'text-ufpe-burgundy' : 'text-slate-400'} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive ? 'bg-ufpe-burgundy text-white' : 'bg-slate-200/70 text-slate-600'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                  {isActive && (
                    <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-ufpe-burgundy rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action: Launch Agy Assistant */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => { openChat(); sound.playPop(); }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-ufpe-burgundy hover:bg-ufpe-dark text-white text-xs font-bold shadow-md shadow-ufpe-burgundy/20 hover:shadow-lg transition transform active:scale-95"
            >
              <div className="relative">
                <img 
                  src="/mascot.jpeg" 
                  alt="Agy" 
                  className="w-5 h-5 rounded-full object-cover ring-1 ring-white" 
                />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full ring-1 ring-white"></span>
              </div>
              <span>Assistente Agy</span>
              <MessageSquare size={14} className="opacity-80" />
            </button>
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="flex lg:hidden overflow-x-auto py-2 gap-2 border-t border-slate-100 no-scrollbar">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  sound.playPop();
                }}
                className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 ${
                  isActive 
                    ? 'bg-ufpe-burgundy text-white' 
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Icon size={14} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
