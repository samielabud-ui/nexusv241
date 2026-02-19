
import React, { useEffect } from 'react';

interface FocusToastProps {
  title: string;
  onActivate: () => void;
  onClose: () => void;
}

const FocusToast: React.FC<FocusToastProps> = ({ title, onActivate, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 6000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-20 right-4 z-[200] w-full max-w-[320px] animate-in slide-in-from-right duration-500">
      <div className="bg-nexus-card border border-nexus-border rounded-2xl p-4 shadow-2xl shadow-black/50 backdrop-blur-xl">
        <div className="flex gap-3 mb-3">
          <div className="w-10 h-10 bg-nexus-orange/20 rounded-xl flex items-center justify-center text-nexus-orange shrink-0">
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black text-nexus-text-label uppercase tracking-widest">Atividade Detectada</p>
            <p className="text-xs font-bold text-white truncate">{title}</p>
          </div>
        </div>
        <p className="text-[11px] text-nexus-text-sec mb-4">Deseja ativar o <b>Modo Foco</b> para esta sessão?</p>
        <div className="flex gap-2">
          <button 
            onClick={onActivate}
            className="flex-1 bg-nexus-orange text-black font-black py-2 rounded-lg text-[10px] uppercase tracking-widest hover:opacity-90 transition-all"
          >
            ✅ Ativar
          </button>
          <button 
            onClick={onClose}
            className="flex-1 bg-nexus-surface text-nexus-text-main font-bold py-2 rounded-lg text-[10px] uppercase tracking-widest border border-nexus-border hover:bg-nexus-hover transition-all"
          >
            ❌ Depois
          </button>
        </div>
      </div>
    </div>
  );
};

export default FocusToast;
