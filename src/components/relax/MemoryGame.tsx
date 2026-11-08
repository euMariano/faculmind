import React, { useState, useEffect } from 'react';
import { RotateCcw, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { sound } from '../../services/sound';

interface Card {
  id: number;
  symbol: string;
  label: string;
  flipped: boolean;
  matched: boolean;
}

export const MemoryGame: React.FC = () => {
  const symbols = [
    { symbol: '🎓', label: 'Capelo' },
    { symbol: '📚', label: 'Livros' },
    { symbol: '☕', label: 'Café' },
    { symbol: '🪴', label: 'Suculenta' },
    { symbol: '⭐', label: 'Estrela' },
    { symbol: '💡', label: 'Ideia' }
  ];

  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [matchedCount, setMatchedCount] = useState(0);

  const initGame = () => {
    const deck: Card[] = [];
    symbols.forEach((item, index) => {
      // Add two of each
      deck.push({ id: index * 2, symbol: item.symbol, label: item.label, flipped: false, matched: false });
      deck.push({ id: index * 2 + 1, symbol: item.symbol, label: item.label, flipped: false, matched: false });
    });
    // Shuffle
    deck.sort(() => Math.random() - 0.5);
    setCards(deck);
    setSelectedCards([]);
    setMatchedCount(0);
  };

  useEffect(() => {
    initGame();
  }, []);

  const handleCardClick = (index: number) => {
    if (cards[index].flipped || cards[index].matched || selectedCards.length === 2) return;

    sound.playPop();

    const newCards = [...cards];
    newCards[index].flipped = true;
    setCards(newCards);

    const newSelected = [...selectedCards, index];
    setSelectedCards(newSelected);

    if (newSelected.length === 2) {
      const firstIdx = newSelected[0];
      const secondIdx = newSelected[1];

      if (cards[firstIdx].symbol === cards[secondIdx].symbol) {
        // Matched
        setTimeout(() => {
          sound.playSuccess();
          setCards(prev =>
            prev.map((c, i) =>
              i === firstIdx || i === secondIdx ? { ...c, matched: true } : c
            )
          );
          setSelectedCards([]);
          setMatchedCount(prev => {
            const next = prev + 1;
            if (next === symbols.length) {
              confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
            }
            return next;
          });
        }, 400);
      } else {
        // Unmatched
        setTimeout(() => {
          setCards(prev =>
            prev.map((c, i) =>
              i === firstIdx || i === secondIdx ? { ...c, flipped: false } : c
            )
          );
          setSelectedCards([]);
        }, 900);
      }
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm max-w-xl mx-auto flex flex-col items-center">
      {/* Header */}
      <div className="w-full flex items-center justify-between mb-4">
        <div>
          <h3 className="font-extrabold text-lg text-slate-800">Combine as Figuras</h3>
          <p className="text-xs text-slate-500">Jogo de memória tranquilo com símbolos universitários.</p>
        </div>
        <button
          onClick={() => { initGame(); sound.playPop(); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
        >
          <RotateCcw size={14} />
          <span>Reiniciar</span>
        </button>
      </div>

      {/* Grid of 12 cards */}
      <div className="grid grid-cols-4 gap-3 w-full max-w-sm mb-2">
        {cards.map((card, index) => {
          const isRevealed = card.flipped || card.matched;
          return (
            <button
              key={card.id}
              onClick={() => handleCardClick(index)}
              className={`h-20 rounded-2xl text-2xl font-bold flex items-center justify-center transition-all duration-300 transform ${
                isRevealed
                  ? 'bg-gradient-to-tr from-rose-50 to-amber-50 text-slate-800 border-2 border-ufpe-burgundy/40 shadow-xs rotate-y-180'
                  : 'bg-slate-100 hover:bg-slate-200 text-transparent border border-slate-200 shadow-2xs hover:scale-105'
              }`}
            >
              {isRevealed ? card.symbol : '✦'}
            </button>
          );
        })}
      </div>

      {matchedCount === symbols.length && (
        <div className="mt-3 p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-center animate-in fade-in">
          <p className="text-xs font-bold text-emerald-900">Parabéns! Memória e mente alinhadas. 🌿</p>
        </div>
      )}

      <p className="text-[11px] text-slate-400 mt-3 text-center">
        Exercitar a memória de trabalho alivia a tensão acumulada do dia de estudo.
      </p>
    </div>
  );
};
