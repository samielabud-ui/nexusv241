
import React, { useState, useRef, useEffect } from 'react';
import { UserStats } from '../types';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: any) => void;
  userStats: UserStats;
  onOpenProfile: () => void;
  onToggleChat: () => void;
  activeStudyTime: number;
  isFocusActive: boolean;
}

const Header: React.FC<HeaderProps> = ({ currentView, onNavigate, userStats, onOpenProfile, onToggleChat, activeStudyTime, isFocusActive }) => {
  const [showNotif, setShowNotif] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  
  const invitesCount = userStats.invitesAvailable || 0;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotif(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
  };

  return (
    <header className="border-b border-neutral-200 dark:border-nexus-border bg-white/90 dark:bg-nexus-bg/90 backdrop-blur-lg sticky top-0 z-50 transition-colors">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-4">
        
        <div className="flex items-center gap-4 shrink-0">
          <div onClick={() => onNavigate('inicio')} className="flex items-center gap-3 cursor-pointer group">
            <div className="w-8 h-8 bg-sky-500 dark:bg-nexus-blue rounded-lg flex items-center justify-center font-bold text-lg text-white shadow-sm transition-transform group-hover:scale-105">N</div>
            <span className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-nexus-text-title hidden sm:inline">NexusBQ</span>
          </div>

          <button 
            onClick={() => onNavigate('inicio')}
            className={`p-2 rounded-lg transition-all ${currentView === 'inicio' ? 'text-sky-600 dark:text-nexus-blue bg-sky-50 dark:bg-nexus-blue/10' : 'text-neutral-400 dark:text-nexus-text-sec hover:text-neutral-900 dark:hover:text-nexus-text-title hover:bg-neutral-100 dark:hover:bg-nexus-surface'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          </button>
        </div>

        <div className="flex-grow flex justify-center">
          {isFocusActive && (
            <div onClick={() => onNavigate('foco')} className="flex items-center gap-2 px-3 py-1 bg-nexus-orange/10 border border-nexus-orange/20 rounded-md cursor-pointer group">
              <div className="w-1.5 h-1.5 rounded-full bg-nexus-orange animate-pulse"></div>
              <span className="text-[11px] font-semibold font-mono text-nexus-orange tracking-wide">{formatTime(activeStudyTime)}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 md:gap-4 ml-auto">
          <button 
            onClick={onToggleChat}
            className="p-2 bg-neutral-50 dark:bg-nexus-surface border border-neutral-200 dark:border-nexus-border rounded-lg text-neutral-500 dark:text-nexus-text-sec hover:text-sky-500 dark:hover:text-nexus-blue transition-all active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
          </button>

          <div className="relative" ref={notifRef}>
            <button onClick={() => setShowNotif(!showNotif)} className="p-2 bg-neutral-50 dark:bg-nexus-surface border border-neutral-200 dark:border-nexus-border rounded-lg text-neutral-500 dark:text-nexus-text-sec hover:text-sky-500 dark:hover:text-nexus-blue transition-all relative">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
              {invitesCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-nexus-bg">{invitesCount}</span>}
            </button>

            {showNotif && (
              <div className="absolute right-0 mt-3 w-72 bg-white dark:bg-nexus-card border border-neutral-200 dark:border-nexus-border rounded-2xl shadow-2xl p-5 animate-in slide-in-from-top-2 duration-200 z-[60]">
                <div className="space-y-3">
                   <p className="text-[11px] text-neutral-600 dark:text-nexus-text-sec leading-relaxed">
                     🎟️ <b>Novo Sistema:</b> O cadastro funciona por código de convite. Gere o seu no <b>Perfil</b>.
                   </p>
                </div>
              </div>
            )}
          </div>

          <button onClick={() => onNavigate('premium')} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${currentView === 'premium' ? 'bg-sky-500 dark:bg-nexus-blue text-white' : 'text-neutral-500 dark:text-nexus-text-sec hover:bg-neutral-50 dark:hover:bg-nexus-surface'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
            <span className="hidden sm:inline">Premium</span>
          </button>

          <div className="h-5 w-px bg-neutral-200 dark:bg-nexus-border mx-1"></div>

          <button onClick={onOpenProfile} className="flex items-center gap-2 group p-1 rounded-lg hover:bg-neutral-50 dark:hover:bg-nexus-surface transition-colors">
            <div className="w-7 h-7 rounded-md overflow-hidden border border-neutral-200 dark:border-nexus-border group-hover:border-sky-500 bg-white">
               <img src={userStats.photoURL} alt="P" className="w-full h-full object-cover" />
            </div>
            <span className="hidden md:block text-[11px] font-semibold tracking-wide text-neutral-600 dark:text-nexus-text-main group-hover:text-neutral-900 transition-colors">
              {userStats.displayName.split(' ')[0]}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
