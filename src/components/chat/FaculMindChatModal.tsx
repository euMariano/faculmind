import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Minus, 
  Send, 
  Mic, 
  Sparkles, 
  Bot, 
  RotateCcw,
  CornerDownLeft,
  Volume2
} from 'lucide-react';
import { ChatMessage } from '../../types';
import { api } from '../../services/api';
import { sound } from '../../services/sound';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultAgent?: string;
  onNavigateAction?: (target: string) => void;
  contextData?: Record<string, unknown>;
  initialPrompt?: string | null;
}

export const FaculMindChatModal: React.FC<ChatModalProps> = ({
  isOpen,
  onClose,
  defaultAgent = 'agy-ufpe',
  onNavigateAction,
  contextData = {},
  initialPrompt
}) => {
  const [selectedAgent, setSelectedAgent] = useState<string>(defaultAgent);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Synchronize defaultAgent
  useEffect(() => {
    if (defaultAgent) {
      setSelectedAgent(defaultAgent);
    }
  }, [defaultAgent]);

  // Handle initialPrompt if passed
  useEffect(() => {
    if (initialPrompt && isOpen) {
      handleSend(initialPrompt);
    }
  }, [initialPrompt, isOpen]);

  // Initial welcome message based on agent
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome-1',
          sender: 'agent',
          agentName: 'FaculMind (Agy)',
          avatar: '/mascot.jpeg',
          text: `Olá! 👋 Eu sou a **FaculMind**, sua assistente virtual da UFPE.\n\nComo posso apoiar a sua jornada acadêmica hoje?`,
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          suggestions: [
            '📊 Como estão minhas notas e faltas no SIGAA?',
            '📅 Calendário e prazos',
            '🎓 Matrícula e SIGAA',
            '🪙 Bolsas e auxílios',
            '👥 Apoio acadêmico e bem-estar'
          ]
        }
      ]);
    }
  }, [messages.length]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!isMinimized && isOpen) {
      scrollToBottom();
    }
  }, [messages, isMinimized, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    sound.playPop();

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await api.sendChatMessage(text, selectedAgent, contextData);
      sound.playPop();

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'agent',
        agentName: response.agent || 'FaculMind',
        avatar: response.avatar || (selectedAgent === 'agy-ufpe' ? '/mascot.jpeg' : undefined),
        text: response.response,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        suggestions: response.suggestions,
        quickAction: response.quickAction
      };

      setMessages(prev => [...prev, botMsg]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          sender: 'agent',
          agentName: 'Agy',
          avatar: '/mascot.jpeg',
          text: 'Tive uma instabilidade momentânea na conexão, mas estou pronta para te ajudar. Pode repetir?',
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Simulated Voice Input
  const handleVoiceSimulation = () => {
    setIsRecording(true);
    sound.playZenChime(600);
    setTimeout(() => {
      setIsRecording(false);
      const voiceSamples = [
        "Quero saber como me inscrever no auxílio permanência 2026.1 da UFPE.",
        "Estou muito cansado e com ansiedade por causa das provas. Onde encontro apoio psicológico?",
        "Como funciona a inscrição de projetos de extensão para validar horas complementares?",
        "Ajuda a mapear o fluxo de atendimento da secretaria e identificar gargalos.",
        "Crie uma ata de reunião ordinária para o alinhamento de projetos."
      ];
      const randomPrompt = voiceSamples[Math.floor(Math.random() * voiceSamples.length)];
      setInput(randomPrompt);
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
      {/* Minimized Bubble Pill */}
      {isMinimized ? (
        <button
          onClick={() => { setIsMinimized(false); sound.playPop(); }}
          className="flex items-center gap-3 bg-ufpe-burgundy text-white px-4 py-3 rounded-full shadow-2xl hover:scale-105 transition transform border border-rose-300/30"
        >
          <img src="/mascot.jpeg" alt="Agy" className="w-8 h-8 rounded-full object-cover ring-2 ring-white" />
          <div className="text-left">
            <span className="block text-xs font-bold leading-none">FaculMind Assistente</span>
            <span className="text-[10px] text-rose-200">Clique para expandir</span>
          </div>
          <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping"></span>
        </button>
      ) : (
        /* Expanded Chat Window - Matches visual mockup in WhatsApp Image 2026-11-06 at 20.26.53.jpeg */
        <div className="w-[375px] sm:w-[420px] h-[580px] max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          
          {/* Header */}
          <div className="bg-ufpe-burgundy text-white px-4 py-3 flex items-center justify-between shrink-0 shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <img 
                  src="/mascot.jpeg" 
                  alt="Mascote FaculMind" 
                  className="w-9 h-9 rounded-full object-cover ring-2 ring-white/90 shadow-xs" 
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-ufpe-burgundy"></span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm tracking-tight">FaculMind</h3>
                  <span className="text-[10px] bg-rose-900/60 text-rose-200 px-1.5 py-0.2 rounded-full font-semibold">
                    UFPE
                  </span>
                </div>
                <p className="text-[11px] text-rose-200">Assistente Virtual Inteligente</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized(true)}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-rose-100 hover:text-white transition"
                title="Minimizar"
              >
                <Minus size={16} />
              </button>
              <button
                onClick={onClose}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-rose-100 hover:text-white transition"
                title="Fechar"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Agent Selector Bar */}
          <div className="bg-slate-50 border-b border-slate-200/80 px-2 py-1.5 flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0">
            {[
              { id: 'agy-ufpe', label: '🎓 Agy UFPE', title: 'Assistente Geral do Estudante' },
              { id: 'facul-organiza', label: '🏢 ORGANIZA', title: 'Estrutura & Cargos' },
              { id: 'facul-fluxo', label: '🔄 FLUXO', title: 'Mapeamento & BPMN' },
              { id: 'facul-estrategia', label: '📈 ESTRATÉGIA', title: 'SWOT & 5W2H' },
              { id: 'facul-docs', label: '📄 DOCS', title: 'Atas & Procedimentos' }
            ].map(agent => (
              <button
                key={agent.id}
                onClick={() => { setSelectedAgent(agent.id); sound.playPop(); }}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-md transition whitespace-nowrap ${
                  selectedAgent === agent.id
                    ? 'bg-white text-ufpe-burgundy shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
                title={agent.title}
              >
                {agent.label}
              </button>
            ))}
          </div>

          {/* Synced Context Indicator */}
          {Boolean(contextData?.student) && (
            <div className="bg-emerald-50 border-b border-emerald-100 px-3 py-1 flex items-center justify-between text-[10px] text-emerald-800">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>SIGAA Conectado: <strong>{(contextData.student as any).name?.split(' ')[0]}</strong></span>
              </span>
              <span className="font-semibold text-emerald-700">{(contextData.student as any).turmas?.length || 5} turmas monitoradas</span>
            </div>
          )}

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/50">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <img
                      src={msg.avatar || '/mascot.jpeg'}
                      alt="Avatar"
                      className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5 border border-slate-200 shadow-2xs"
                    />
                  )}

                  <div className={`max-w-[82%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[10px] font-semibold text-slate-500">
                        {isUser ? 'Você' : (msg.agentName || 'FaculMind')}
                      </span>
                      <span className="text-[9px] text-slate-400">{msg.timestamp}</span>
                    </div>

                    <div
                      className={`p-3 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                        isUser
                          ? 'bg-ufpe-burgundy text-white rounded-br-xs'
                          : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs'
                      }`}
                    >
                      <div className="whitespace-pre-line prose-xs">
                        {msg.text}
                      </div>

                      {/* Optional Action Button */}
                      {msg.quickAction && onNavigateAction && (
                        <div className="mt-2.5 pt-2 border-t border-slate-100">
                          <button
                            onClick={() => {
                              onNavigateAction(msg.quickAction!.target);
                              sound.playSuccess();
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-xs transition"
                          >
                            <Sparkles size={12} />
                            <span>{msg.quickAction.label}</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Suggestions Chips */}
                    {msg.suggestions && msg.suggestions.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {msg.suggestions.map((sug, sIdx) => (
                          <button
                            key={sIdx}
                            onClick={() => handleSend(sug)}
                            className="text-[11px] font-medium bg-white hover:bg-rose-50 text-slate-700 hover:text-ufpe-burgundy border border-slate-200 hover:border-rose-200 px-2.5 py-1 rounded-full transition shadow-2xs text-left"
                          >
                            {sug}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex gap-2.5 items-center">
                <img
                  src="/mascot.jpeg"
                  alt="Agy"
                  className="w-7 h-7 rounded-full object-cover shrink-0 border border-slate-200 animate-pulse"
                />
                <div className="bg-white border border-slate-200 px-3.5 py-2 rounded-2xl text-xs text-slate-500 flex items-center gap-2 shadow-2xs">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-ufpe-burgundy rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-ufpe-burgundy rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 bg-ufpe-burgundy rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                  <span>FaculMind analisando fontes oficiais...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div className="p-3 bg-white border-t border-slate-200 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <button
                type="button"
                onClick={handleVoiceSimulation}
                className={`p-2 rounded-xl transition ${
                  isRecording 
                    ? 'bg-rose-500 text-white animate-pulse' 
                    : 'text-slate-400 hover:text-ufpe-burgundy hover:bg-rose-50'
                }`}
                title="Simular comando de voz (Speech-to-Text)"
              >
                <Mic size={18} />
              </button>

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isRecording ? "Ouvindo você..." : "Digite sua pergunta ou solicitação..."}
                className="flex-1 bg-slate-100 focus:bg-white text-xs px-3.5 py-2.5 rounded-xl border border-transparent focus:border-ufpe-burgundy focus:ring-1 focus:ring-ufpe-burgundy outline-hidden transition"
              />

              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="p-2.5 rounded-xl bg-ufpe-burgundy hover:bg-ufpe-dark disabled:opacity-40 text-white transition shadow-xs"
                title="Enviar mensagem"
              >
                <Send size={16} />
              </button>
            </form>

            <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400 px-1">
              <span>RAG Inteligente • Dados protegidos (LGPD)</span>
              <span>Pressione Enter ↵</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
