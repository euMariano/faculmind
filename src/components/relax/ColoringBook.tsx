import React, { useState } from 'react';
import { Palette, Download, RotateCcw, Check } from 'lucide-react';
import { sound } from '../../services/sound';

export const ColoringBook: React.FC = () => {
  const palette = [
    { name: 'Vinho UFPE', color: '#7A1C30' },
    { name: 'Rosa Suave', color: '#f472b6' },
    { name: 'Menta / Sage', color: '#52796f' },
    { name: 'Esmeralda', color: '#10b981' },
    { name: 'Lavanda', color: '#a78bfa' },
    { name: 'Céu Azul', color: '#38bdf8' },
    { name: 'Âmbar Dourado', color: '#f59e0b' },
    { name: 'Creme Quente', color: '#fef3c7' },
    { name: 'Branco Neve', color: '#ffffff' },
    { name: 'Carvão Suave', color: '#334155' }
  ];

  const [selectedColor, setSelectedColor] = useState(palette[0].color);
  const [regionColors, setRegionColors] = useState<{ [key: string]: string }>({
    capeloTop: '#ffffff',
    capeloBase: '#ffffff',
    tassel: '#ffffff',
    robotBody: '#ffffff',
    robotEarL: '#ffffff',
    robotEarR: '#ffffff',
    bookCover: '#ffffff',
    bookPages: '#ffffff',
    coffeeCup: '#ffffff',
    background: '#ffffff'
  });

  const handleRegionClick = (regionKey: string) => {
    sound.playPop();
    setRegionColors(prev => ({
      ...prev,
      [regionKey]: selectedColor
    }));
  };

  const handleReset = () => {
    sound.playZenChime(440);
    const resetObj: { [key: string]: string } = {};
    Object.keys(regionColors).forEach(k => { resetObj[k] = '#ffffff'; });
    setRegionColors(resetObj);
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm max-w-xl mx-auto flex flex-col items-center">
      {/* Header */}
      <div className="w-full flex items-center justify-between mb-4">
        <div>
          <h3 className="font-extrabold text-lg text-slate-800">Cantinho de Colorir</h3>
          <p className="text-xs text-slate-500">Escolha uma cor e toque nas partes do desenho para pintar.</p>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
        >
          <RotateCcw size={14} />
          <span>Limpar</span>
        </button>
      </div>

      {/* Color Palette */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-4 bg-slate-50 p-2.5 rounded-2xl border border-slate-200/80 w-full">
        {palette.map((p) => (
          <button
            key={p.name}
            onClick={() => { setSelectedColor(p.color); sound.playPop(); }}
            style={{ backgroundColor: p.color }}
            className={`w-7 h-7 rounded-full shadow-2xs border-2 transition transform hover:scale-115 flex items-center justify-center ${
              selectedColor === p.color ? 'border-slate-900 ring-2 ring-slate-400 scale-110' : 'border-slate-300'
            }`}
            title={p.name}
          >
            {selectedColor === p.color && (
              <Check size={14} className={p.color === '#ffffff' || p.color === '#fef3c7' ? 'text-slate-900' : 'text-white'} />
            )}
          </button>
        ))}
      </div>

      {/* Interactive SVG Canvas */}
      <div className="w-full h-[320px] bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center p-2 select-none">
        <svg
          viewBox="0 0 400 300"
          className="w-full h-full max-h-[300px] cursor-pointer drop-shadow-sm"
        >
          {/* Background area */}
          <rect
            x="5"
            y="5"
            width="390"
            height="290"
            rx="16"
            fill={regionColors.background}
            stroke="#cbd5e1"
            strokeWidth="2"
            onClick={() => handleRegionClick('background')}
          />

          {/* Desk surface */}
          <rect
            x="20"
            y="230"
            width="360"
            height="40"
            rx="6"
            fill="#e2e8f0"
            stroke="#64748b"
            strokeWidth="3"
          />

          {/* Books stack on desk */}
          <path
            d="M 60 230 L 140 230 L 140 205 L 60 205 Z"
            fill={regionColors.bookCover}
            stroke="#334155"
            strokeWidth="3"
            onClick={() => handleRegionClick('bookCover')}
          />
          <path
            d="M 65 205 L 135 205 L 135 185 L 65 185 Z"
            fill={regionColors.bookPages}
            stroke="#334155"
            strokeWidth="3"
            onClick={() => handleRegionClick('bookPages')}
          />

          {/* Coffee Mug */}
          <path
            d="M 310 230 L 340 230 L 340 195 L 310 195 Z"
            fill={regionColors.coffeeCup}
            stroke="#334155"
            strokeWidth="3"
            onClick={() => handleRegionClick('coffeeCup')}
          />
          <path
            d="M 340 200 C 355 200 355 220 340 220"
            fill="none"
            stroke="#334155"
            strokeWidth="3"
          />

          {/* Robot Mascot Body (Center) */}
          <ellipse
            cx="210"
            cy="195"
            rx="45"
            ry="40"
            fill={regionColors.robotBody}
            stroke="#334155"
            strokeWidth="3"
            onClick={() => handleRegionClick('robotBody')}
          />
          {/* Robot screen / face */}
          <rect
            x="180"
            y="170"
            width="60"
            height="40"
            rx="12"
            fill="#1e293b"
            stroke="#334155"
            strokeWidth="2"
          />
          {/* Robot smile and LED eyes */}
          <circle cx="195" cy="185" r="4" fill="#34d399" />
          <circle cx="225" cy="185" r="4" fill="#34d399" />
          <path d="M 202 196 Q 210 202 218 196" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" />

          {/* Robot Headphones */}
          <circle
            cx="160"
            cy="190"
            r="12"
            fill={regionColors.robotEarL}
            stroke="#334155"
            strokeWidth="3"
            onClick={() => handleRegionClick('robotEarL')}
          />
          <circle
            cx="260"
            cy="190"
            r="12"
            fill={regionColors.robotEarR}
            stroke="#334155"
            strokeWidth="3"
            onClick={() => handleRegionClick('robotEarR')}
          />

          {/* Graduation Cap (Capelo) */}
          <polygon
            points="210,95 270,125 210,155 150,125"
            fill={regionColors.capeloTop}
            stroke="#334155"
            strokeWidth="3"
            onClick={() => handleRegionClick('capeloTop')}
          />
          <path
            d="M 175 140 C 175 155 245 155 245 140"
            fill={regionColors.capeloBase}
            stroke="#334155"
            strokeWidth="3"
            onClick={() => handleRegionClick('capeloBase')}
          />
          {/* Tassel */}
          <line x1="210" y1="125" x2="275" y2="150" stroke="#334155" strokeWidth="3" />
          <circle
            cx="275"
            cy="154"
            r="8"
            fill={regionColors.tassel}
            stroke="#334155"
            strokeWidth="2"
            onClick={() => handleRegionClick('tassel')}
          />
        </svg>
      </div>

      <p className="text-[11px] text-slate-400 mt-3 text-center">
        Pintar estimula o foco atencioso e acalma a mente em momentos de estresse.
      </p>
    </div>
  );
};
