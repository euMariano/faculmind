import React, { useRef, useState, useEffect } from 'react';
import { RotateCcw, Sparkles, Volume2 } from 'lucide-react';
import { sound } from '../../services/sound';

export const ZenGardenCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [rakeMode, setRakeMode] = useState<'rake' | 'stone' | 'plant'>('rake');
  const [stones, setStones] = useState<Array<{ x: number; y: number; r: number; color: string }>>([
    { x: 90, y: 80, r: 24, color: '#64748b' },
    { x: 380, y: 120, r: 32, color: '#475569' },
    { x: 140, y: 260, r: 28, color: '#78716c' }
  ]);
  const [plants, setPlants] = useState<Array<{ x: number; y: number }>>([
    { x: 70, y: 65 },
    { x: 420, y: 250 }
  ]);

  const initSand = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Sand background with warm beige tone
    ctx.fillStyle = '#eadecd';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle grain texture
    for (let i = 0; i < 4000; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      ctx.fillStyle = Math.random() > 0.5 ? '#ded1be' : '#f5ebe0';
      ctx.fillRect(x, y, 1.5, 1.5);
    }

    // Default gentle ripple lines around stones
    drawRipples(ctx);
  };

  const drawRipples = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = '#c9bba8';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    // Zen ripples around stones
    stones.forEach(stone => {
      for (let r = stone.r + 12; r <= stone.r + 48; r += 12) {
        ctx.beginPath();
        ctx.arc(stone.x, stone.y, r, 0, Math.PI * 2);
        ctx.stroke();
      }
    });

    // Horizontal raked lines in the middle
    for (let y = 140; y <= 220; y += 14) {
      ctx.beginPath();
      ctx.moveTo(30, y);
      ctx.bezierCurveTo(150, y - 10, 300, y + 10, 470, y);
      ctx.stroke();
    }
  };

  useEffect(() => {
    initSand();
  }, []);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (rakeMode === 'stone') {
      const colors = ['#475569', '#64748b', '#78716c', '#57534e'];
      const newStone = {
        x,
        y,
        r: 20 + Math.random() * 15,
        color: colors[Math.floor(Math.random() * colors.length)]
      };
      setStones(prev => [...prev, newStone]);
      sound.playPop();
      return;
    }

    if (rakeMode === 'plant') {
      setPlants(prev => [...prev, { x, y }]);
      sound.playPop();
      return;
    }

    setIsDrawing(true);
    drawRake(x, y);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || rakeMode !== 'rake') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    drawRake(x, y);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const drawRake = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Rake lines (3 parallel groves)
    const offsets = [-8, 0, 8];
    offsets.forEach(offset => {
      ctx.fillStyle = '#bfae98';
      ctx.beginPath();
      ctx.arc(x + offset, y + offset, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // Highlight groove edge
      ctx.fillStyle = '#f8f1e7';
      ctx.beginPath();
      ctx.arc(x + offset + 1, y + offset - 1, 1.5, 0, Math.PI * 2);
      ctx.fill();
    });

    if (Math.random() < 0.2) {
      sound.playSandBrush();
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm max-w-xl mx-auto flex flex-col items-center">
      {/* Title Header */}
      <div className="w-full flex items-center justify-between mb-4">
        <div>
          <h3 className="font-extrabold text-lg text-slate-800">Jardim Zen Interativo</h3>
          <p className="text-xs text-slate-500">Arraste o cursor suavemente para desenhar linhas na areia</p>
        </div>
        <button
          onClick={() => { sound.playZenChime(528); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold transition"
          title="Tocar Sino Tibetano 528Hz"
        >
          <Sparkles size={14} />
          <span>Sino Zen</span>
        </button>
      </div>

      {/* Tool Selector Bar */}
      <div className="flex items-center gap-2 mb-3 bg-slate-100 p-1.5 rounded-2xl w-full justify-center">
        <button
          onClick={() => { setRakeMode('rake'); sound.playPop(); }}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
            rakeMode === 'rake' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          🌾 Ancinho de Areia
        </button>
        <button
          onClick={() => { setRakeMode('stone'); sound.playPop(); }}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
            rakeMode === 'stone' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          🪨 Colocar Pedra
        </button>
        <button
          onClick={() => { setRakeMode('plant'); sound.playPop(); }}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
            rakeMode === 'plant' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          🪴 Suculenta
        </button>
        <button
          onClick={() => { initSand(); sound.playZenChime(432); }}
          className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition ml-auto"
          title="Alisar a Areia"
        >
          <RotateCcw size={16} />
        </button>
      </div>

      {/* Canvas container with overlay elements */}
      <div className="relative rounded-2xl overflow-hidden shadow-inner border-4 border-[#d5c3ab] select-none cursor-crosshair">
        <canvas
          ref={canvasRef}
          width={500}
          height={320}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="touch-none"
        />

        {/* Render River Stones */}
        {stones.map((s, idx) => (
          <div
            key={`stone-${idx}`}
            style={{
              left: `${s.x - s.r}px`,
              top: `${s.y - s.r}px`,
              width: `${s.r * 2}px`,
              height: `${s.r * 2}px`,
              backgroundColor: s.color,
            }}
            className="absolute rounded-full pointer-events-none shadow-md shadow-black/30 border-t border-white/20 transform -translate-x-0 -translate-y-0"
          >
            <div className="w-1/3 h-1/4 rounded-full bg-white/20 mt-1 ml-2 filter blur-2xs" />
          </div>
        ))}

        {/* Render Plants */}
        {plants.map((p, idx) => (
          <div
            key={`plant-${idx}`}
            style={{ left: `${p.x - 14}px`, top: `${p.y - 14}px` }}
            className="absolute pointer-events-none text-2xl select-none transform hover:scale-110 transition"
          >
            🪴
          </div>
        ))}
      </div>

      <p className="text-[11px] text-slate-400 mt-3 italic text-center">
        "Sem metas, sem pontos, sem pressa. Apenas respire e sinta a textura da areia."
      </p>
    </div>
  );
};
