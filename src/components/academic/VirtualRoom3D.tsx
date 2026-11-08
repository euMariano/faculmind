import React, { useState, useEffect } from 'react';
import { 
  Coffee, 
  Users, 
  MessageSquare, 
  Pin, 
  Laptop, 
  BookOpen, 
  GraduationCap, 
  Send,
  Sparkles,
  Heart,
  Radio,
  Flame
} from 'lucide-react';
import { sound } from '../../services/sound';
import { 
  subscribeToCoffeeChats, 
  sendCoffeeChatMessage, 
  subscribeToPostIts, 
  createPostIt, 
  likePostIt,
  isFirebaseConfigured 
} from '../../services/firebase';
import { PostIt, CoffeeChatMessage } from '../../types';

export const VirtualRoom3D: React.FC = () => {
  const [selectedHotspot, setSelectedHotspot] = useState<'cafe' | 'sofa' | 'mural' | 'noturno'>('mural');
  const [activeCoffeeTable, setActiveCoffeeTable] = useState('ia');
  const [postIts, setPostIts] = useState<PostIt[]>([]);
  const [newPostItText, setNewPostItText] = useState('');
  const [newPostItAuthor, setNewPostItAuthor] = useState('Estudante Conectado');
  const [coffeeChats, setCoffeeChats] = useState<Record<string, CoffeeChatMessage[]>>({
    ia: [],
    eventos: [],
    estagios: []
  });
  const [chatInputs, setChatInputs] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Subscribe to real-time Post-Its (Firebase / Express Backend)
  useEffect(() => {
    const unsubscribe = subscribeToPostIts((updatedPostIts) => {
      setPostIts(updatedPostIts);
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Subscribe to real-time Coffee Chats for active table
  useEffect(() => {
    const unsubscribe = subscribeToCoffeeChats(activeCoffeeTable, (messages) => {
      setCoffeeChats(prev => ({
        ...prev,
        [activeCoffeeTable]: messages
      }));
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [activeCoffeeTable]);

  const handleSendChat = async (tableId: string) => {
    const text = (chatInputs[tableId] || '').trim();
    if (!text || isSubmitting) return;

    sound.playPop();
    setIsSubmitting(true);
    setChatInputs(prev => ({ ...prev, [tableId]: '' }));

    try {
      await sendCoffeeChatMessage(tableId, {
        user: 'Você (Discente UFPE)',
        text,
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      });
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddPostIt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostItText.trim()) return;

    sound.playSuccess();
    const text = newPostItText.trim();
    setNewPostItText('');

    try {
      await createPostIt({
        author: newPostItAuthor || 'Discente UFPE',
        avatar: '🎓',
        text,
        tag: 'Comunidade UFPE',
        color: 'bg-sky-100 border-sky-300 text-sky-900'
      });
    } catch (err) {
      console.error('Erro ao colar bilhete:', err);
    }
  };

  const handleLike = async (postItId: string | number) => {
    sound.playPop();
    try {
      await likePostIt(postItId);
      setPostIts(prev => prev.map(p => {
        if (String(p.id) === String(postItId)) {
          return { ...p, likes: (p.likes || 0) + 1 };
        }
        return p;
      }));
    } catch (err) {
      console.error('Erro ao curtir post-it:', err);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Visual Isometric Room Banner */}
      <div className="relative rounded-3xl overflow-hidden shadow-xl border border-slate-200">
        <div className="relative h-64 sm:h-80 w-full bg-slate-900">
          <img 
            src="/room_3d.jpg" 
            alt="Sala Virtual 3D - Espaço do Estudante" 
            className="w-full h-full object-cover object-center opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent"></div>

          {/* Room Overlay Badges */}
          <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-black/60 text-white text-xs font-bold backdrop-blur-md border border-white/20 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>Sala Virtual Interdisciplinar</span>
            </span>

            <span className="px-2.5 py-1 rounded-full bg-emerald-950/80 text-emerald-300 text-[11px] font-bold backdrop-blur-md border border-emerald-500/30 flex items-center gap-1">
              <Radio size={12} className="animate-pulse" />
              <span>{isFirebaseConfigured ? '🔥 Firestore Real-time' : '🟢 Live Backend Sync'}</span>
            </span>
          </div>

          <div className="absolute bottom-6 left-6 right-6 z-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-md">
                Espaço de Conexões e Pertencimento
              </h2>
              <p className="text-xs sm:text-sm text-slate-200 max-w-xl mt-1 drop-shadow-sm">
                Aproximando alunos de Secretariado, Computação, Psicologia e Administração em um ambiente colaborativo e em tempo real.
              </p>
            </div>

            {/* Quick interactive room spots */}
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'mural' as const, label: '📌 Mural de Parcerias', count: postIts.length },
                { id: 'cafe' as const, label: '☕ Mesas de Café (Chats)', count: '3 salas' },
                { id: 'sofa' as const, label: '🛋️ Sofá dos Veteranos', count: 'Dicas' },
                { id: 'noturno' as const, label: '🌙 Aluno Trabalhador', count: 'Avisos' }
              ].map(spot => (
                <button
                  key={spot.id}
                  onClick={() => { setSelectedHotspot(spot.id); sound.playPop(); }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition backdrop-blur-md ${
                    selectedHotspot === spot.id
                      ? 'bg-white text-slate-900 shadow-md ring-2 ring-white/60'
                      : 'bg-black/50 text-white hover:bg-black/70 border border-white/10'
                  }`}
                >
                  {spot.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Spot 1: Mural de Parcerias (Corkboard with Post-Its) */}
      {selectedHotspot === 'mural' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-lg text-slate-800">Quadro de Avisos e Parcerias</h3>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  Tempo Real
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Cole bilhetes virtuais para encontrar colegas com habilidades complementares para TCCs e projetos.
              </p>
            </div>

            {/* Add Post-It Form Trigger */}
            <form onSubmit={handleAddPostIt} className="flex gap-2 w-full sm:w-auto">
              <input
                type="text"
                value={newPostItText}
                onChange={(e) => setNewPostItText(e.target.value)}
                placeholder="Ex: Procuro colega de Secretariado para TCC..."
                className="text-xs px-3.5 py-2 rounded-xl border border-slate-200 bg-white focus:border-ufpe-burgundy flex-1 sm:w-72 shadow-2xs"
              />
              <button
                type="submit"
                disabled={!newPostItText.trim()}
                className="px-4 py-2 bg-ufpe-burgundy hover:bg-ufpe-dark disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 shrink-0 transition"
              >
                <Pin size={14} />
                <span>Colar Bilhete</span>
              </button>
            </form>
          </div>

          {/* Corkboard Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#f2e8dc] p-6 rounded-3xl border-4 border-[#d5c3ab] shadow-inner">
            {postIts.length === 0 ? (
              <div className="col-span-3 text-center py-8 text-slate-500 text-xs">
                Nenhum bilhete colado ainda. Seja o primeiro a postar!
              </div>
            ) : (
              postIts.map((p) => (
                <div
                  key={p.id}
                  className={`p-4 rounded-2xl border shadow-md relative transform hover:-rotate-1 transition ${p.color || 'bg-amber-100 border-amber-300 text-amber-900'}`}
                >
                  {/* Pin pinhead */}
                  <div className="w-3 h-3 rounded-full bg-rose-500 absolute -top-1.5 left-1/2 -translate-x-1/2 shadow-xs border border-white" />

                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">{p.avatar || '🎓'}</span>
                      <span className="font-bold text-xs">{p.author}</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/60">
                      {p.tag}
                    </span>
                  </div>

                  <p className="text-xs font-medium leading-relaxed my-2">
                    "{p.text}"
                  </p>

                  <div className="pt-2 border-t border-black/10 flex items-center justify-between text-[11px]">
                    <span className="text-slate-600">Disponível para contato</span>
                    <button
                      onClick={() => handleLike(p.id)}
                      className="flex items-center gap-1 text-rose-700 hover:text-rose-900 font-bold transition transform active:scale-125"
                      title="Curtir e apoiar"
                    >
                      <Heart size={12} className="fill-current text-rose-600" />
                      <span>{p.likes || 1}</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Spot 2: A Mesa de Café (Thematic Tables) */}
      {selectedHotspot === 'cafe' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 animate-in fade-in duration-150">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-lg text-slate-800">A Mesa de Café (Grupos de Interesse)</h3>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                  Chat em Tempo Real
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Puxe uma cadeira virtual e converse sobre temas que conectam seu curso a outras áreas.
              </p>
            </div>

            {/* Table selector */}
            <div className="flex gap-2">
              {[
                { id: 'ia', label: '🤖 Inteligência Artificial & Automação' },
                { id: 'eventos', label: '📅 Eventos & Cerimonial' },
                { id: 'estagios', label: '💼 Estágios & Oportunidades' }
              ].map(table => (
                <button
                  key={table.id}
                  onClick={() => { setActiveCoffeeTable(table.id); sound.playPop(); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    activeCoffeeTable === table.id
                      ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {table.label}
                </button>
              ))}
            </div>
          </div>

          {/* Active Table Chat Box */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/90 h-64 overflow-y-auto space-y-3">
            {(coffeeChats[activeCoffeeTable] || []).length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                Mesa vazia no momento. Puxe uma cadeira e envie a primeira mensagem! ☕
              </div>
            ) : (
              (coffeeChats[activeCoffeeTable] || []).map((msg, idx) => (
                <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-slate-900">{msg.user}</span>
                    <span className="text-[10px] text-slate-400">{msg.time}</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">{msg.text}</p>
                </div>
              ))
            )}
          </div>

          {/* Send Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={chatInputs[activeCoffeeTable] || ''}
              onChange={(e) => setChatInputs({ ...chatInputs, [activeCoffeeTable]: e.target.value })}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSendChat(activeCoffeeTable); }}
              placeholder={`Enviar mensagem na mesa ${activeCoffeeTable.toUpperCase()}...`}
              className="flex-1 text-xs p-3 rounded-xl border border-slate-200 focus:border-ufpe-burgundy focus:ring-1 focus:ring-ufpe-burgundy"
            />
            <button
              onClick={() => handleSendChat(activeCoffeeTable)}
              disabled={!chatInputs[activeCoffeeTable]?.trim() || isSubmitting}
              className="px-4 py-3 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
            >
              <Send size={14} />
              <span>Enviar</span>
            </button>
          </div>
        </div>
      )}

      {/* Spot 3: Sofá dos Veteranos */}
      {selectedHotspot === 'sofa' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-150">
          {[
            {
              name: 'Fernanda Albuquerque',
              badge: 'Veterana 7º Período • Secretariado',
              tip: 'Dica de ouro para calouros: não deixe as 200h de extensão para o último ano. Participe dos grupos interdisciplinares no 1º semestre!',
              available: 'Segundas às 18h no CAC'
            },
            {
              name: 'Felipe Santos',
              badge: 'Alumni 2025 • Ciência da Computação',
              tip: 'Quem trabalha durante o dia precisa organizar as disciplinas no SIGAA em blocos concentrados no turno da noite. O assistente FaculMind ajuda muito nisso.',
              available: 'Online via Discord / Agy'
            }
          ].map((vet, idx) => (
            <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-lg">
                  🛋️
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{vet.name}</h4>
                  <span className="text-[11px] font-semibold text-indigo-700">{vet.badge}</span>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed italic bg-slate-50 p-3 rounded-xl border border-slate-100">
                "{vet.tip}"
              </p>
              <div className="text-[11px] text-slate-500 font-medium">
                📍 {vet.available}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Spot 4: Aluno Trabalhador */}
      {selectedHotspot === 'noturno' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
              🌙
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                Central do Estudante Noturno & Trabalhador
              </h3>
              <p className="text-xs text-slate-500">
                Chegou atrasado ou perdeu a aula por causa do expediente? Encontre resumos e orientações aqui.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
              <span className="text-[10px] font-bold uppercase text-ufpe-burgundy">Aula de Ontem</span>
              <h5 className="font-bold text-xs text-slate-900 mt-1">Gestão de Documentos (CAC)</h5>
              <p className="text-[11px] text-slate-600 mt-1">
                Material de apoio disponibilizado pelo professor no Drive da turma. Atividade vale para 18/Nov.
              </p>
            </div>
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
              <span className="text-[10px] font-bold uppercase text-emerald-700">Grupo de Apoio</span>
              <h5 className="font-bold text-xs text-slate-900 mt-1">Carona Solidária Campus Recife</h5>
              <p className="text-[11px] text-slate-600 mt-1">
                Rotas noturnas compartilhadas saindo às 22h do CCSA em direção a Olinda e Boa Viagem.
              </p>
            </div>
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
              <span className="text-[10px] font-bold uppercase text-indigo-700">Horas Flexíveis</span>
              <h5 className="font-bold text-xs text-slate-900 mt-1">Projetos Assíncronos</h5>
              <p className="text-[11px] text-slate-600 mt-1">
                Atividades de pesquisa e redação documental que podem ser feitas aos finais de semana.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
