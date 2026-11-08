import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, Wind } from 'lucide-react';
import { sound } from '../../services/sound';

interface Bubble {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  popped: boolean;
}

export const BubblePopGame: React.FC = () => {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [breathePhase, setBreathePhase] = useState<'Inspire' | 'Segure' | 'Expire'>('Inspire');

  // Guided breathing cycle
  useEffect(() => {
    const cycle = () => {
      setBreathePhase('Inspire');
      setTimeout(() => {
        setBreathePhase('Segure');
        setTimeout(() => {
          setBreathePhase('Expire');
        }, 3500);
      }, 4000);
    };

    cycle();
    const timer = setInterval(cycle, 11500);
    return () => clearInterval(timer);
  }, []);

  const generateBubbles = () => {
    const colors = [
      'rgba(244, 114, 182, 0.4)', // rose
      'rgba(129, 140, 248, 0.4)', // indigo
      'rgba(52, 211, 153, 0.4)',  // emerald
      'rgba(251, 191, 36, 0.4)',  // amber
      'rgba(56, 189, 248, 0.4)'   // sky
    ];

    const newBubbles: Bubble[] = [];
    for (let i = 0; i < 30; i++) {
      newBubbles.push({
        id: i,
        x: 5 + (i % 6) * 15 + Math.random() * 5,
        y: 5 + Math.floor(i / 6) * 18 + Math.random() * 5,
        size: 44 + Math.floor(Math.random() * 20),
        color: colors[Math.floor(Math.random() * colors.length)],
        popped: false
      });
    }
    setBubbles(newBubbles);
  };

  useEffect(() => {
    generateBubbles();
  }, []);

  const popBubble = (id: number) => {
    sound.playPop();
    setBubbles(prev =>
      prev.map(b => (b.id === id ? { ...b, popped: true } : b))
    );
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm max-w-xl mx-auto flex flex-col items-center">
      {/* Header */}
      <div className="w-full flex items-center justify-between mb-4">
        <div>
          <h3 className="font-extrabold text-lg text-slate-800">Estoure as Bolhas</h3>
          <p className="text-xs text-slate-500">Toque nas bolhas para estourá-las. Sem pontos ou pressão.</p>
        </div>
        <button
          onClick={() => { generateBubbles(); sound.playZenChime(432); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
          title="Novas Bolhas"
        >
          <RefreshCw size={14} />
          <span>Renovar</span>
        </button>
      </div>

      {/* Guided Breathing Circle */}
      <div className="mb-4 flex items-center gap-3 bg-rose-50/80 border border-rose-100 px-4 py-2 rounded-2xl">
        <Wind size={16} className="text-rose-500" />
        <span className="text-xs font-semibold text-rose-900">
          Respiração Guiada: <span className="font-bold underline">{breathePhase}</span> lentamente...
        </span>
      </div>

      {/* Bubble Mat Area */}
      <div className="relative w-full h-[320px] bg-gradient-to-b from-sky-50/40 to-rose-50/40 rounded-2xl border border-slate-200/80 p-4 overflow-hidden shadow-inner select-none">
        {bubbles.map(b => (
          <button
            key={b.id}
            onClick={() => !b.popped && popBubble(b.id)}
            style={{
              left: `${b.x}%`,
              top: `${b.y}%`,
              width: `${b.size}px`,
              height: `${b.size}px`,
              backgroundColor: b.popped ? 'transparent' : b.color
            }}
            className={`absolute rounded-full transition-all duration-150 transform flex items-center justify-center cursor-pointer ${
              b.popped 
                ? 'scale-0 opacity-0 pointer-events-none' 
                : 'hover:scale-110 active:scale-90 shadow-md border-2 border-white/60 backdrop-blur-2xs'
            }`}
          >
            {/* Bubble shine reflection */}
            {!b.popped && (
              <span className="w-1/3 h-1/3 rounded-full bg-white/70 absolute top-1.5 left-2 filter blur-2xs" />
            )}
          </button>
        ))}

        {bubbles.every(b => b.popped) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 backdrop-blur-xs animate-in fade-in">
            <Sparkles className="text-amber-500 mb-2" size={32} />
            <h4 className="text-sm font-bold text-slate-800">Você limpou todas as bolhas!</h4>
            <p className="text-xs text-slate-500 mt-1 mb-3">Sinta seu corpo relaxar.</p>
            <button
              onClick={() => { generateBubbles(); sound.playSuccess(); }}
              className="px-4 py-2 rounded-xl bg-ufpe-burgundy text-white text-xs font-bold shadow-md hover:bg-ufpe-dark"
            >
              Estourar Novamente
            </button>
          </div>
        )}
      </div>

      <p className="text-[11px] text-slate-400 mt-3 text-center">
        Dica: Use fones de ouvido para sentir a sonoridade relaxante de cada estouro.
      </p>
    </div>
  );
};
