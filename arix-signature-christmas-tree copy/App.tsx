import React, { useState } from 'react';
import Experience from './components/Experience';
import { TreeState } from './types';

const App: React.FC = () => {
  const [treeState, setTreeState] = useState<TreeState>(TreeState.TREE_SHAPE);

  const toggleState = () => {
    setTreeState((prev) => 
      prev === TreeState.TREE_SHAPE ? TreeState.SCATTERED : TreeState.TREE_SHAPE
    );
  };

  const isScattered = treeState === TreeState.SCATTERED;

  return (
    <div className="relative w-full h-screen bg-slate-950 font-sans">
      
      {/* 3D Scene Layer */}
      <div className="absolute inset-0 z-0">
        <Experience treeState={treeState} />
      </div>

      {/* UI Overlay Layer */}
      <main className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-8 md:p-12">
        
        {/* Header */}
        <header className="flex flex-col items-start gap-2 animate-fade-in-down">
          <h1 className="font-serif text-4xl md:text-6xl text-gold-gradient font-bold tracking-tight">
            Twinkle Tuan
          </h1>
          <h2 className="text-emerald-100/80 text-sm md:text-lg tracking-[0.2em] uppercase font-light">
            here is your Christmas Tree
          </h2>
        </header>

        {/* Controls */}
        <div className="self-center md:self-end flex flex-col items-center md:items-end gap-6 pointer-events-auto">
          {/* Text block removed here */}

          <button
            onClick={toggleState}
            className={`
              relative group overflow-hidden px-8 py-4 rounded-full 
              transition-all duration-700 ease-out
              border border-emerald-500/30 backdrop-blur-md
              ${isScattered ? 'bg-emerald-900/40' : 'bg-amber-900/20'}
            `}
          >
            {/* Button Glow Effect */}
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-transparent via-amber-400/10 to-transparent`} />
            
            <span className={`
              relative z-10 font-serif italic text-xl md:text-2xl 
              transition-all duration-500
              ${isScattered ? 'text-emerald-300' : 'text-amber-200'}
            `}>
              {isScattered ? 'Tree?' : 'Try This'}
            </span>
          </button>
        </div>

        {/* Footer */}
        <footer className="text-emerald-900/40 text-[10px] uppercase tracking-widest flex justify-between items-end">
            <span>Interactive 3D Experience</span>
            <span>React • Three Fiber • WebGL</span>
        </footer>

      </main>

      {/* CSS Animation helper for UI */}
      <style>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-down {
          animation: fadeInDown 1.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default App;