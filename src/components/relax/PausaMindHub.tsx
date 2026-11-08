import React, { useState } from 'react';
import { Sparkles, Flower2, CircleDot, Palette, Grid, HeartHandshake, Volume2 } from 'lucide-react';
import { ZenGardenCanvas } from './ZenGardenCanvas';
import { BubblePopGame } from './BubblePopGame';
import { ColoringBook } from './ColoringBook';
import { MemoryGame } from './MemoryGame';
import { sound } from '../../services/sound';

export const PausaMindHub: React.FC = () => {
  const [activeActivity, setActiveActivity] = useState<'zen' | 'bubbles' | 'coloring' | 'memory'>('zen');

  const activities = [
    {
      id: 'zen' as const,
      title: 'Jardim Zen',
      desc: 'Arraste para desenhar na areia',
      icon: Flower2,
      badge: 'Modo Zen',
      color: 'bg-amber-100 text-amber-800 border-amber-200'
    },
    {
      id: 'bubbles' as const,
      title: 'Estoure as Bolhas',
      desc: 'Animações suaves e respiração',
      icon: CircleDot,
      badge: 'Alívio Imediato',
      color: 'bg-rose-100 text-rose-800 border-rose-200'
    },
    {
      id: 'coloring' as const,
      title: 'Cantinho de Colorir',
      desc: 'Pintura livre sem pressão',
      icon: Palette,
      badge: 'Criatividade',
      color: 'bg-purple-100 text-purple-800 border-purple-200'
    },
    {
      id: 'memory' as const,
      title: 'Combine as Figuras',
      desc: 'Jogo curto de memória',
      icon: Grid,
      badge: 'Descontração',
      color: 'bg-emerald-100 text-emerald-800 border-emerald-200'
    }
  ];

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Header Banner - Matches Gemini_Generated_Image_p3h7vop3h7vop3h7(2).jpg */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 text-white p-6 sm:p-8 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-emerald-100 text-xs font-semibold backdrop-blur-xs">
            <Sparkles size={14} className="text-amber-300" />
            <span>Módulo de Bem-Estar Estudantil UFPE</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">PAUSA MIND</h2>
          <p className="text-sm text-emerald-100 max-w-lg leading-relaxed">
            Uma pausa para respirar. Sem ranking, sem punições, sem julgamentos. Reserve de 2 a 5 minutos do seu dia para desacelerar a mente.
          </p>
        </div>

        {/* Ambient Leaves Decoration */}
        <div className="absolute right-4 -bottom-8 opacity-20 text-8xl pointer-events-none select-none">
          🌿
        </div>
      </div>

      {/* Activity Selector Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {activities.map((act) => {
          const Icon = act.icon;
          const isActive = activeActivity === act.id;
          return (
            <button
              key={act.id}
              onClick={() => { setActiveActivity(act.id); sound.playPop(); }}
              className={`p-4 rounded-2xl border text-left transition transform hover:-translate-y-0.5 ${
                isActive 
                  ? 'bg-white border-emerald-600 ring-2 ring-emerald-500/20 shadow-md' 
                  : 'bg-white/80 hover:bg-white border-slate-200 text-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${act.color}`}>
                  <Icon size={18} />
                </div>
                {isActive && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                )}
              </div>
              <h4 className="font-bold text-xs text-slate-900">{act.title}</h4>
              <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{act.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Render Active Activity */}
      <div className="transition-all duration-200">
        {activeActivity === 'zen' && <ZenGardenCanvas />}
        {activeActivity === 'bubbles' && <BubblePopGame />}
        {activeActivity === 'coloring' && <ColoringBook />}
        {activeActivity === 'memory' && <MemoryGame />}
      </div>
    </div>
  );
};
