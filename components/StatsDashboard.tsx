
import React, { useMemo } from 'react';
import { UserStats } from '../types';

interface StatsDashboardProps {
  stats: UserStats;
  allUsers: any[];
  onNavigate: (view: any) => void;
}

const StatsDashboard: React.FC<StatsDashboardProps> = ({ stats, allUsers, onNavigate }) => {
  const rankingCycle = stats.ciclo;

  const filteredRanking = useMemo(() => {
    return allUsers
      .filter(u => u.ciclo === rankingCycle)
      .sort((a, b) => (b.points || 0) - (a.points || 0))
      .slice(0, 10)
      .map((u, i) => ({ ...u, rank: i + 1 }));
  }, [allUsers, rankingCycle]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}min`;
  };

  const quickActions = [
    { id: 'questoes', label: 'Questões', icon: '❓', bgClass: 'bg-nexus-blue/10', textClass: 'text-nexus-blue' },
    { id: 'pbl', label: 'PBL', icon: '📄', bgClass: 'bg-nexus-purple/10', textClass: 'text-nexus-purple' },
    { id: 'morfo', label: 'Morfo', icon: '🧠', bgClass: 'bg-teal-400/10', textClass: 'text-teal-400' },
    { id: 'hp', label: 'HP', icon: '🩺', bgClass: 'bg-rose-400/10', textClass: 'text-rose-400' },
    { id: 'foco', label: 'Foco', icon: '⏱️', bgClass: 'bg-nexus-orange/10', textClass: 'text-nexus-orange' },
    { id: 'manuais', label: 'Manuais', icon: '📚', bgClass: 'bg-indigo-400/10', textClass: 'text-indigo-400' },
  ];

  return (
    <div className="animate-in fade-in duration-700 py-6 space-y-10">
      {/* 1. Header Minimalista */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-neutral-900 dark:text-nexus-text-title tracking-tight">
            Olá, <span className="text-nexus-blue font-medium">{stats.displayName.split(' ')[0]}</span>
          </h1>
          <p className="text-xs text-neutral-500 dark:text-nexus-text-sec mt-1 font-medium tracking-wide">
            Acompanhe seu progresso e acesse seus materiais clínicos.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="px-4 py-2 bg-white dark:bg-nexus-surface border border-neutral-200 dark:border-nexus-border rounded-lg text-[10px] font-semibold uppercase tracking-widest text-neutral-500 dark:text-nexus-text-sec shadow-sm">
            {stats.ciclo}
          </div>
          {stats.isPremium && (
            <div className="px-4 py-2 bg-sky-50 dark:bg-nexus-blue/10 border border-sky-200 dark:border-nexus-blue/20 text-sky-600 dark:text-nexus-blue rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-sm flex items-center gap-1.5">
              Premium <span>{stats.premiumEmoji}</span>
            </div>
          )}
        </div>
      </section>

      {/* 2. Seção de Acesso Rápido */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {quickActions.map(action => (
          <button 
            key={action.id}
            onClick={() => onNavigate(action.id as any)}
            className="flex items-center gap-4 p-4 bg-white dark:bg-nexus-card border border-neutral-200 dark:border-nexus-border rounded-xl hover:bg-neutral-50 dark:hover:bg-nexus-surface hover:border-sky-500/30 dark:hover:border-nexus-hover hover:shadow-md dark:hover:shadow-none transition-all duration-200 group"
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${action.bgClass} ${action.textClass}`}>
              <span className="text-lg">{action.icon}</span>
            </div>
            <div className="text-left flex-grow">
              <span className="block text-[9px] font-semibold text-neutral-400 dark:text-nexus-text-label uppercase tracking-widest mb-0.5">Ir para</span>
              <span className="block text-sm font-semibold text-neutral-900 dark:text-nexus-text-main group-hover:text-nexus-blue transition-colors">{action.label}</span>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-300 dark:text-nexus-text-label opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1 shrink-0"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        ))}
      </section>

      {/* 3. Progresso Resumido */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Card: Questões */}
        <div className="bg-white dark:bg-nexus-card border border-neutral-200 dark:border-nexus-border p-6 rounded-[1.25rem] flex flex-col justify-between shadow-sm hover:shadow-md dark:hover:shadow-none dark:hover:border-nexus-hover transition-all duration-300 relative overflow-hidden group">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[10px] font-bold text-neutral-500 dark:text-nexus-text-sec uppercase tracking-[0.15em]">Questões Resolvidas</span>
            <div className="w-6 h-6 rounded-full bg-nexus-blue/10 text-nexus-blue flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
          </div>
          <div>
            <p className="text-4xl font-light text-neutral-900 dark:text-nexus-text-title tracking-tight">{stats.totalAnswered}</p>
            <div className="mt-3 flex gap-3 text-xs font-medium">
              <span className="text-emerald-500 flex items-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> {stats.totalCorrect} corretas</span>
              <span className="text-rose-400 flex items-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg> {stats.totalErrors} erradas</span>
            </div>
          </div>
        </div>

        {/* Card: Foco */}
        <div className="bg-white dark:bg-nexus-card border border-neutral-200 dark:border-nexus-border p-6 rounded-[1.25rem] flex flex-col justify-between shadow-sm hover:shadow-md dark:hover:shadow-none dark:hover:border-nexus-hover transition-all duration-300 relative overflow-hidden group">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[10px] font-bold text-neutral-500 dark:text-nexus-text-sec uppercase tracking-[0.15em]">Tempo de Foco Hoje</span>
            <div className="w-6 h-6 rounded-full bg-nexus-orange/10 text-nexus-orange flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
          </div>
          <div>
            <p className="text-4xl font-light text-neutral-900 dark:text-nexus-text-title tracking-tight">{formatTime(stats.dailyStudyTime)}</p>
            <div className="mt-3 flex items-center gap-2 text-xs font-medium text-nexus-orange">
              {stats.studyActive ? (
                 <>
                   <span className="w-1.5 h-1.5 bg-nexus-orange rounded-full animate-pulse"></span>
                   Sessão em andamento
                 </>
              ) : (
                 <span className="text-neutral-400 dark:text-nexus-text-label">Cronômetro pausado</span>
              )}
            </div>
          </div>
        </div>

        {/* Card: Streak */}
        <div className="bg-white dark:bg-nexus-card border border-neutral-200 dark:border-nexus-border p-6 rounded-[1.25rem] flex flex-col justify-between shadow-sm hover:shadow-md dark:hover:shadow-none dark:hover:border-nexus-hover transition-all duration-300 relative overflow-hidden group">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[10px] font-bold text-neutral-500 dark:text-nexus-text-sec uppercase tracking-[0.15em]">Sequência (Streak)</span>
            <div className="w-6 h-6 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center text-[10px]">
              🔥
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <p className="text-4xl font-light text-neutral-900 dark:text-nexus-text-title tracking-tight">{stats.streak}</p>
              <span className="text-sm font-medium text-neutral-400 dark:text-nexus-text-sec">dias</span>
            </div>
            <p className="mt-3 text-xs font-medium text-neutral-400 dark:text-nexus-text-label">Estude hoje para manter.</p>
          </div>
        </div>

        {/* Card: Points */}
        <div className="bg-white dark:bg-nexus-card border border-neutral-200 dark:border-nexus-border p-6 rounded-[1.25rem] flex flex-col justify-between shadow-sm hover:shadow-md dark:hover:shadow-none dark:hover:border-nexus-hover transition-all duration-300 relative overflow-hidden group">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[10px] font-bold text-neutral-500 dark:text-nexus-text-sec uppercase tracking-[0.15em]">Pontos Nexus</span>
            <div className="w-6 h-6 rounded-full bg-nexus-purple/10 text-nexus-purple flex items-center justify-center text-[10px]">
               💎
            </div>
          </div>
          <div>
            <p className="text-4xl font-light text-neutral-900 dark:text-nexus-text-title tracking-tight">{stats.points.toLocaleString()}</p>
            <div className="mt-3 flex items-center gap-1.5">
               <span className="text-[10px] font-bold uppercase tracking-widest text-nexus-purple">Nível {Math.floor(stats.points / 500) + 1}</span>
            </div>
          </div>
        </div>

      </section>

      {/* 4. Ranking Fixo por Ciclo */}
      <section className="bg-white dark:bg-nexus-surface border border-neutral-200 dark:border-nexus-border rounded-[1.25rem] overflow-hidden shadow-sm mt-8">
        <div className="p-5 border-b border-neutral-100 dark:border-nexus-border flex flex-col sm:flex-row justify-between items-center gap-4 dark:bg-nexus-bg/50">
          <h3 className="font-semibold text-neutral-900 dark:text-nexus-text-title text-sm tracking-wide">
            Ranking de Performance <span className="text-neutral-400 dark:text-nexus-text-sec font-normal">— {rankingCycle}</span>
          </h3>
          <span className="text-[9px] font-semibold text-neutral-400 dark:text-nexus-text-label uppercase tracking-widest">Somente estudantes do seu ciclo</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-neutral-400 dark:text-nexus-text-sec border-b border-neutral-100 dark:border-nexus-border/50">
                <th className="px-6 py-4 font-semibold uppercase text-[9px] tracking-widest w-24">Posição</th>
                <th className="px-6 py-4 font-semibold uppercase text-[9px] tracking-widest">Estudante</th>
                <th className="px-6 py-4 font-semibold uppercase text-[9px] tracking-widest text-right">Pontos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50 dark:divide-nexus-border/50">
              {filteredRanking.length > 0 ? filteredRanking.map((user) => (
                <tr 
                  key={user.id} 
                  className={`transition-colors ${user.isCurrentUser ? 'bg-sky-50 dark:bg-nexus-card border-l-2 border-l-nexus-blue' : 'hover:bg-neutral-50 dark:hover:bg-nexus-hover/50 border-l-2 border-l-transparent'}`}
                >
                  <td className="px-6 py-4 font-mono text-neutral-400 dark:text-nexus-text-sec text-xs">
                    #{user.rank.toString().padStart(2, '0')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                       <img src={user.photoURL} className="w-7 h-7 rounded-lg object-cover" alt="" />
                       <span className={`text-sm font-medium flex items-center gap-2 ${user.isCurrentUser ? 'text-sky-600 dark:text-nexus-blue font-semibold' : 'text-neutral-700 dark:text-nexus-text-main'}`}>
                         {user.isCurrentUser ? 'Você' : user.displayName || 'Estudante'}
                         {user.isPremium && (
                           <span className="text-[12px]" title="Premium Member">{user.premiumEmoji || '✨'}</span>
                         )}
                       </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-xs font-semibold text-neutral-500 dark:text-nexus-text-sec">
                    {user.points?.toLocaleString() || 0}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-neutral-400 dark:text-nexus-text-label text-xs font-medium tracking-wide">
                    Nenhum estudante no ranking do seu ciclo ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default StatsDashboard;
