
import React, { useState } from 'react';
import { UserStats } from '../types';

interface Manual {
  id: string;
  title: string;
  med: number;
  active: boolean;
  url?: string;
}

const MANUALS: Manual[] = [
  { 
    id: 'med1', 
    title: 'Manual do MED 1', 
    med: 1, 
    active: true, 
    url: 'https://drive.google.com/file/d/1WaTxgfyYg4wRmrYk4VsHYTEGJAdNE-Sm/preview' 
  },
  { 
    id: 'med2', 
    title: 'Manual do MED 2', 
    med: 2, 
    active: false 
  },
  { 
    id: 'med3', 
    title: 'Manual do MED 3', 
    med: 3, 
    active: false 
  }
];

interface ManualsViewProps {
  userStats: UserStats;
  onAddActivity: (item: any) => void;
}

const ManualsView: React.FC<ManualsViewProps> = ({ userStats, onAddActivity }) => {
  const [activeManual, setActiveManual] = useState<Manual | null>(null);

  const handleOpenManual = (manual: Manual) => {
    if (!manual.active || !manual.url) return;
    
    setActiveManual(manual);
    onAddActivity({
      id: `manual_${manual.id}`,
      type: 'apostila',
      title: manual.title,
      subtitle: 'Manual oficial acessado',
    });
  };

  if (activeManual) {
    return (
      <div className="max-w-[1400px] mx-auto animate-in fade-in duration-500 py-6 px-4">
        <button 
          onClick={() => setActiveManual(null)} 
          className="mb-8 flex items-center gap-2 text-neutral-500 hover:text-white transition-colors group"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-1 transition-transform">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          <span className="text-xs font-medium uppercase tracking-widest">Voltar para Manuais</span>
        </button>

        <header className="mb-8 flex justify-between items-end border-b border-neutral-200 dark:border-neutral-800 pb-6">
          <div>
            <h2 className="text-3xl font-black text-neutral-900 dark:text-white tracking-tight">{activeManual.title}</h2>
            <p className="text-neutral-500 text-[10px] uppercase tracking-widest mt-1">Leitura Oficial do Curso — Período {activeManual.med}</p>
          </div>
          <div className="hidden md:flex items-center gap-2 bg-blue-600/10 px-4 py-2 rounded-xl border border-blue-600/20">
             <span className="text-blue-600 text-[10px] font-black uppercase tracking-widest">Visualizador Nexus</span>
          </div>
        </header>

        <div className="bg-white dark:bg-neutral-900 rounded-[2rem] overflow-hidden shadow-2xl relative h-[80vh] border border-neutral-200 dark:border-neutral-800">
           <iframe 
             src={activeManual.url} 
             className="w-full h-full border-none" 
             title={activeManual.title}
             allow="autoplay"
           ></iframe>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto animate-in fade-in duration-700 py-10 px-4">
      <header className="mb-16">
        <h2 className="text-4xl md:text-6xl font-black text-neutral-900 dark:text-white tracking-tighter italic mb-4">Manuais</h2>
        <p className="text-neutral-500 text-lg md:text-xl font-light max-w-2xl leading-relaxed">
          Centralizamos aqui todos os guias e manuais oficiais para que você tenha a base acadêmica sempre à mão.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {MANUALS.map((manual) => (
          <div 
            key={manual.id}
            onClick={() => handleOpenManual(manual)}
            className={`relative group rounded-[2.5rem] border-2 transition-all p-8 flex flex-col justify-between h-72 cursor-pointer shadow-xl ${
              manual.active 
                ? 'bg-white dark:bg-neutral-900 border-neutral-100 dark:border-neutral-800 hover:border-blue-600 hover:scale-[1.02]' 
                : 'bg-neutral-50 dark:bg-neutral-950 border-neutral-100 dark:border-neutral-900 opacity-60 grayscale'
            }`}
          >
            <div className="flex justify-between items-start">
               <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all ${
                 manual.active ? 'bg-blue-600/10 text-blue-600 group-hover:bg-blue-600 group-hover:text-white' : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400'
               }`}>
                 📘
               </div>
               {!manual.active && (
                 <span className="bg-neutral-200 dark:bg-neutral-800 text-neutral-500 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Em breve</span>
               )}
            </div>

            <div>
               <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">MED {manual.med}</p>
               <h3 className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight mb-2">{manual.title}</h3>
               <p className="text-neutral-500 text-xs font-medium italic">
                 {manual.active ? 'Leitura oficial do curso' : 'Disponível em breve'}
               </p>
            </div>

            {manual.active && (
              <div className="absolute top-8 right-8 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M7 7h10v10"/><path d="M7 17 17 7"/></svg>
              </div>
            )}
          </div>
        ))}
      </div>

      <footer className="mt-20 pt-10 border-t border-neutral-100 dark:border-neutral-800 flex flex-col items-center text-center">
         <div className="w-12 h-1 bg-neutral-200 dark:bg-neutral-800 rounded-full mb-6"></div>
         <p className="text-neutral-400 text-sm max-w-lg leading-relaxed font-medium">
            Os manuais são atualizados periodicamente conforme a coordenação acadêmica. Se sentir falta de algo, entre em contato com o suporte Nexus.
         </p>
      </footer>
    </div>
  );
};

export default ManualsView;
