
import React, { useMemo, useState } from 'react';
import { UserStats } from '../types';

interface StudyViewProps {
  userStats: UserStats;
  onStart: () => void;
  onStop: () => void;
  allUsers: any[];
  currentElapsed: number;
  isFocusActive: boolean;
}

const StudyView: React.FC<StudyViewProps> = ({ userStats, onStart, onStop, allUsers, currentElapsed, isFocusActive }) => {
  const [selectedProfile, setSelectedProfile] = useState<any>(null);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
  };

  const getEvolutiveEmote = (totalSecs: number) => {
    if (totalSecs < 1800) return '🌱'; // < 30m
    if (totalSecs < 3600) return '🌿'; // < 1h
    if (totalSecs < 7200) return '🌳'; // < 2h
    return '🔥'; // > 2h
  };

  const today = new Date().toISOString().split('T')[0];
  const myTodayTime = (userStats.focusData?.[today]?.totalTime || 0) + (isFocusActive ? currentElapsed : 0);

  const currentlyStudying = useMemo(() => {
    return allUsers
      .filter(u => u.studyActive || (u.uid === userStats.uid && isFocusActive))
      .map(u => {
        const dTime = u.focusData?.[today]?.totalTime || 0;
        return { ...u, totalToday: dTime };
      })
      .sort((a, b) => b.totalToday - a.totalToday);
  }, [allUsers, isFocusActive, today, userStats.uid]);

  return (
    <div className="max-w-[1200px] mx-auto animate-in fade-in duration-700 py-6 space-y-12 relative">
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* CRONÔMETRO */}
        <div className="lg:col-span-7 space-y-6">
          <div className={`bg-nexus-card border border-nexus-border border-l-4 border-l-nexus-orange p-12 rounded-[3.5rem] shadow-sm flex flex-col items-center justify-center text-center`}>
             <div className="text-4xl mb-6">{getEvolutiveEmote(myTodayTime)}</div>
             <p className={`text-7xl md:text-9xl font-black font-mono tracking-tighter ${isFocusActive ? 'text-nexus-orange' : 'text-white'}`}>
               {formatTime(isFocusActive ? currentElapsed : myTodayTime)}
             </p>
             <p className="text-[10px] text-nexus-text-label uppercase tracking-[0.2em] mt-4 font-black">
               {isFocusActive ? "Sessão Ativa" : "Tempo Total Hoje"}
             </p>
             <div className="mt-10 flex gap-4 w-full max-w-md">
               {!isFocusActive ? (
                 <button onClick={onStart} className="flex-grow bg-nexus-orange text-black font-black py-5 rounded-[2rem] shadow-xl uppercase tracking-widest hover:opacity-90">Iniciar Foco</button>
               ) : (
                 <button onClick={onStop} className="flex-grow bg-rose-500 text-white font-black py-5 rounded-[2rem] shadow-xl uppercase tracking-widest hover:opacity-90">Parar e Salvar</button>
               )}
             </div>
          </div>

          <div className="bg-nexus-surface border border-nexus-border p-8 rounded-[2.5rem]">
             <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 italic">Sessões de Hoje</h3>
             <div className="space-y-3">
               {userStats.focusData?.[today]?.sessions?.map((s: any, i: number) => (
                 <div key={i} className="flex items-center justify-between p-4 bg-nexus-card rounded-2xl border border-nexus-border">
                    <div className="flex items-center gap-3">
                       <span className="text-lg">{s.contentType === 'pdf' ? '📄' : '📺'}</span>
                       <div>
                         <p className="text-xs font-bold text-white truncate max-w-[200px]">{s.contentTitle}</p>
                         <p className="text-[9px] text-nexus-text-label uppercase">{new Date(s.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                       </div>
                    </div>
                    <span className="text-[10px] font-mono font-black text-nexus-green">{Math.floor(s.duration / 60)} min</span>
                 </div>
               )) || <p className="text-center text-nexus-text-label text-xs font-bold py-6">Nenhuma sessão registrada ainda.</p>}
             </div>
          </div>
        </div>

        {/* AO VIVO / RANKING */}
        <div className="lg:col-span-5 space-y-8">
           <div className="bg-nexus-card border border-nexus-border rounded-[2.5rem] overflow-hidden shadow-sm">
              <div className="p-6 border-b border-nexus-border flex justify-between items-center bg-nexus-surface/50">
                 <h3 className="font-black text-white text-xs uppercase tracking-widest italic">Nexus Ao Vivo</h3>
                 <span className="text-[10px] font-black text-nexus-orange bg-nexus-orange/10 px-3 py-1 rounded-full uppercase">{currentlyStudying.length}</span>
              </div>
              <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto no-scrollbar">
                 {currentlyStudying.map(u => (
                    <div key={u.uid} onClick={() => setSelectedProfile(u)} className="flex items-center justify-between p-4 rounded-2xl bg-nexus-surface border border-nexus-border cursor-pointer hover:border-nexus-blue transition-all">
                       <div className="flex items-center gap-3">
                          <img src={u.photoURL} className="w-10 h-10 rounded-xl border border-nexus-border" alt="" />
                          <div>
                            <p className="text-xs font-bold text-white">{u.displayName}</p>
                            <p className="text-[10px] text-nexus-text-label">{u.bio || "Nexus Student"}</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <div className="text-lg">{getEvolutiveEmote(u.totalToday || 0)}</div>
                          <p className="text-[9px] font-mono font-black text-nexus-text-label">{formatTime(u.totalToday || 0)}</p>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      </div>

      {/* MODAL PERFIL PÚBLICO */}
      {selectedProfile && (
        <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
           <div className="w-full max-w-md bg-nexus-card border border-nexus-border rounded-[3rem] p-10 relative animate-in zoom-in duration-300">
              <button onClick={() => setSelectedProfile(null)} className="absolute top-6 right-6 text-nexus-text-label hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
              
              <div className="text-center mb-8">
                 <img src={selectedProfile.photoURL} className="w-24 h-24 rounded-3xl mx-auto mb-4 border-2 border-nexus-blue p-1 shadow-2xl" alt="" />
                 <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">{selectedProfile.displayName}</h2>
                 <p className="text-xs text-nexus-text-sec mt-2 leading-relaxed px-4">{selectedProfile.bio || "Sem biografia disponível."}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                 <div className="bg-nexus-surface p-4 rounded-2xl border border-nexus-border text-center">
                    <p className="text-[9px] font-black text-nexus-text-label uppercase tracking-widest">Tempo Total</p>
                    <p className="text-xl font-black text-white italic">{formatTime(selectedProfile.totalStudyTime || 0)}</p>
                 </div>
                 <div className="bg-nexus-surface p-4 rounded-2xl border border-nexus-border text-center">
                    <p className="text-[9px] font-black text-nexus-text-label uppercase tracking-widest">Nível Evolução</p>
                    <div className="text-xl">{getEvolutiveEmote(selectedProfile.focusData?.[today]?.totalTime || 0)}</div>
                 </div>
              </div>

              <div className="space-y-2">
                 <p className="text-[10px] font-black text-nexus-text-label uppercase tracking-widest px-2">Conteúdos de Hoje</p>
                 <div className="max-h-[150px] overflow-y-auto space-y-2 pr-2 no-scrollbar">
                    {selectedProfile.focusData?.[today]?.sessions?.map((s: any, i: number) => (
                      <div key={i} className="text-[11px] text-nexus-text-main flex gap-2">
                        <span className="text-nexus-blue">•</span> {s.contentTitle}
                      </div>
                    )) || <p className="text-[11px] text-nexus-text-label italic px-2">Nenhuma atividade hoje.</p>}
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default StudyView;
