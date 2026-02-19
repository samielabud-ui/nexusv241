
import React, { useState, useMemo } from 'react';
import { UserStats } from '../types';

interface Lesson {
  title: string;
  url: string;
}

interface HPViewProps {
  isPremium: boolean;
  onNavigateToPremium: () => void;
  onAddActivity: (item: any) => void;
  onAwardPoints: (id: string, value?: number) => void;
  onIncrementUsage: (contentId: string) => void;
  userStats: UserStats;
}

const HP_MED3_LESSONS: Lesson[] = [
  { 
    title: "Anamnese da Mulher no Período Gestacional (Pré-Natal)", 
    url: "https://drive.google.com/file/d/17_9hgs69iSnv51CVMpRAJBJX-EOcjNyg/preview" 
  },
  { 
    title: "Imunização da Gestante", 
    url: "https://drive.google.com/file/d/1x-x1bUKIFcL4m86MIGfsJP4XzjlT7pJG/preview" 
  },
  { 
    title: "Estática Fetal", 
    url: "https://drive.google.com/file/d/165RWkDXwTBJlQDywcT0vDtpACHRSxPju/preview" 
  },
  { 
    title: "Exame Ginecológico", 
    url: "https://drive.google.com/file/d/1DOj8QzsJzeVf0cGPAJSjIZHUqklINFQY/preview" 
  },
  { 
    title: "Menopausa e Climatério", 
    url: "https://drive.google.com/file/d/1Mq-7W788fpubKsPuJJ9XpWLAkVUyrNIJ/preview" 
  },
  { 
    title: "Semiologia Pediátrica – Anamnese e Exame Físico do RN e da Criança", 
    url: "https://drive.google.com/file/d/1igIkCHPjuOH4wj0VRzkisKYSPcOBP5Zw/preview" 
  },
  { 
    title: "Imunizações na Infância – HP 3", 
    url: "https://drive.google.com/file/d/1DJd4qaPYDPavRxx4Sd9ITstqBQlRhqqB/preview" 
  }
];

const HPView: React.FC<HPViewProps> = ({ isPremium, onNavigateToPremium, onAddActivity, onAwardPoints, onIncrementUsage, userStats }) => {
  const [selectedMed, setSelectedMed] = useState<number | null>(null);
  const [activePdf, setActivePdf] = useState<Lesson | null>(null);

  const meds = Array.from({ length: 8 }, (_, i) => i + 1);
  const osceMeds = [2, 4, 8];
  
  const isOverLimit = (id: string) => {
    if (userStats.plan === 'premium') return false;
    if (userStats.openedContentIds?.includes(id)) return false;
    return (userStats.openedContentIds?.length || 0) >= 10;
  };

  const handleOpenLesson = (lesson: Lesson) => {
    const contentId = `hp_med3_${lesson.title}`;
    if (isOverLimit(contentId)) {
        setActivePdf(lesson); 
        return;
    }
    setActivePdf(lesson);
    onIncrementUsage(contentId);
    
    onAddActivity({
      id: contentId,
      type: 'apostila',
      title: lesson.title,
      subtitle: `HP • Med 3`,
      metadata: { med: 3, lessonTitle: lesson.title, url: lesson.url }
    });

    onAwardPoints(contentId, 5);
  };

  const closePdf = () => setActivePdf(null);

  if (!isPremium) {
    return (
      <div className="max-w-[1200px] mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700 px-4 pt-10">
        <div className="bg-white dark:bg-nexus-surface border border-rose-500/20 p-12 md:p-24 rounded-[3rem] text-center border-dashed shadow-sm">
          <div className="w-16 h-16 md:w-24 md:h-24 bg-rose-500/10 rounded-full flex items-center justify-center text-rose-500 mx-auto mb-8">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-neutral-900 dark:text-nexus-text-title mb-6 tracking-tighter">Habilidades Profissionais Premium</h2>
          <p className="text-neutral-500 dark:text-nexus-text-main text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-12">
            Acesse checklists oficiais, casos de HP e simulações de OSCE. 
            Este recurso é exclusivo para membros <span className="text-rose-500 font-bold italic">Nexus Premium</span>.
          </p>
          <button 
            onClick={onNavigateToPremium}
            className="bg-rose-500 hover:bg-rose-400 text-white font-black px-12 py-5 rounded-2xl text-xs md:text-sm uppercase tracking-[0.3em] shadow-md transition-all active:scale-95"
          >
            Fazer Upgrade Agora
          </button>
        </div>
      </div>
    );
  }

  const activeLessonId = activePdf ? `hp_med3_${activePdf.title}` : '';
  const showOverLimitBanner = isOverLimit(activeLessonId) && activePdf;

  if (activePdf) {
    return (
      <div className="max-w-[1400px] mx-auto animate-in fade-in duration-500 px-4 relative">
        {showOverLimitBanner && (
          <div className="absolute inset-0 z-50 bg-neutral-900/90 dark:bg-nexus-bg/90 backdrop-blur-md flex items-center justify-center p-6 text-center rounded-[2rem]">
            <div className="max-w-md">
              <div className="w-16 h-16 bg-sky-600/20 rounded-full flex items-center justify-center text-sky-600 dark:text-nexus-blue mx-auto mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              </div>
              <h3 className="text-2xl font-black text-white mb-4">Limite Atingido</h3>
              <p className="text-neutral-400 mb-8 text-sm leading-relaxed">
                Você atingiu o limite de <span className="font-bold">10 conteúdos</span> do plano básico. Este limite não renova.
              </p>
              <button onClick={onNavigateToPremium} className="w-full bg-sky-600 hover:bg-sky-500 text-white font-black py-4 rounded-xl transition-all shadow-xl shadow-sky-600/20 uppercase tracking-widest text-xs">Conhecer Plano Premium</button>
            </div>
          </div>
        )}

        <button onClick={closePdf} className="mb-6 flex items-center gap-2 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors group">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-1 transition-transform"><path d="m15 18-6-6 6-6"/></svg>
          <span className="text-xs font-medium uppercase tracking-widest">Voltar para Lista</span>
        </button>
        <header className="mb-6">
           <h2 className="text-2xl font-black text-neutral-900 dark:text-nexus-text-title tracking-tight">{activePdf.title}</h2>
           <p className="text-neutral-500 dark:text-nexus-text-sec text-[10px] uppercase tracking-widest mt-1">Leitor Interno NexusBQ</p>
        </header>
        <div className="bg-white rounded-[2rem] overflow-hidden shadow-sm relative h-[70vh] md:h-[85vh] border border-neutral-200 dark:border-nexus-border">
          <iframe src={activePdf.url} className="w-full h-full border-none" title={activePdf.title} allow="autoplay"></iframe>
        </div>
      </div>
    );
  }

  if (selectedMed) {
    return (
      <div className="max-w-[1200px] mx-auto animate-in fade-in duration-500 px-4">
        <button 
          onClick={() => setSelectedMed(null)} 
          className="mb-8 flex items-center gap-2 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors group"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-1 transition-transform"><path d="m15 18-6-6 6-6"/></svg>
          <span className="text-xs font-medium uppercase tracking-widest">Mudar Período</span>
        </button>

        <header className="mb-10">
          <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.4em] mb-2 block">Med {selectedMed}</span>
          <h2 className="text-3xl font-black text-neutral-900 dark:text-nexus-text-title tracking-tight">Conteúdos de HP</h2>
        </header>

        {selectedMed === 3 ? (
          <div className="space-y-4">
            {HP_MED3_LESSONS.map((lesson, idx) => (
              <div 
                key={idx} 
                className="bg-white dark:bg-nexus-card border border-neutral-200 dark:border-nexus-border p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4 hover:border-rose-400/50 transition-all group shadow-sm"
              >
                <div className="flex items-center gap-4 w-full">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500 shrink-0 group-hover:bg-rose-500 group-hover:text-white transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  </div>
                  <h3 className="text-neutral-900 dark:text-nexus-text-title font-bold text-lg">{lesson.title}</h3>
                </div>
                <button 
                  onClick={() => handleOpenLesson(lesson)}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-neutral-100 dark:bg-nexus-surface text-neutral-900 dark:text-nexus-text-main border border-neutral-200 dark:border-nexus-border text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white hover:border-transparent transition-all text-center"
                >
                  Abrir Resumo
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-nexus-surface border border-neutral-200 dark:border-nexus-border p-12 md:p-20 rounded-[2.5rem] text-center border-dashed shadow-sm">
            <h3 className="text-xl md:text-2xl font-black text-neutral-900 dark:text-nexus-text-title mb-4 tracking-tight">Conteúdo em Processamento</h3>
            <p className="text-neutral-500 dark:text-nexus-text-main text-sm max-w-md mx-auto leading-relaxed">
              Estamos organizando os checklists e resumos de habilidades profissionais para o <span className="font-bold">Med {selectedMed}</span>.
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto animate-in fade-in duration-500 px-4">
      <header className="mb-12">
        <h2 className="text-4xl md:text-6xl font-black text-neutral-900 dark:text-nexus-text-title mb-6 tracking-tighter italic">HP</h2>
        <p className="text-neutral-500 dark:text-nexus-text-main text-lg md:text-xl font-light max-w-3xl leading-relaxed">
          Domine as Habilidades Profissionais com resumos, checklists e preparatórios práticos para OSCE.
        </p>
      </header>

      <section className="mb-16">
        <h3 className="text-[10px] font-black text-neutral-500 dark:text-nexus-text-label uppercase tracking-[0.4em] mb-8 flex items-center gap-4">
          Módulos HP <div className="h-px flex-grow bg-neutral-200 dark:bg-nexus-border"></div>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {meds.map((m) => (
            <div 
              key={m} 
              onClick={() => setSelectedMed(m)}
              className="bg-white dark:bg-nexus-card border border-neutral-200 dark:border-nexus-border border-l-4 border-l-rose-400 p-6 rounded-[2rem] cursor-pointer hover:bg-neutral-50 dark:hover:bg-nexus-hover hover:-translate-y-1 transition-all group flex flex-col items-center justify-center gap-3 shadow-sm"
            >
              <div className="w-10 h-10 bg-rose-500/10 rounded-xl flex items-center justify-center text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
              </div>
              <h4 className="text-xl font-black text-neutral-900 dark:text-nexus-text-title">Med {m}</h4>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.4em] mb-8 flex items-center gap-4">
          OSCE <div className="h-px flex-grow bg-rose-500/20"></div>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {osceMeds.map((m) => (
            <div 
              key={m}
              onClick={() => setSelectedMed(m)}
              className="bg-white dark:bg-nexus-card border border-neutral-200 dark:border-nexus-border p-8 rounded-[2.5rem] cursor-pointer hover:border-rose-400/50 hover:-translate-y-1 transition-all group flex flex-col justify-between h-[200px] shadow-sm relative overflow-hidden"
            >
              <div className="relative z-10">
                <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-2 block">Simulação Prática</span>
                <h3 className="text-4xl font-black text-neutral-900 dark:text-nexus-text-title tracking-tighter italic">Med {m}</h3>
              </div>
              <div className="relative z-10 flex items-center justify-between">
                <span className="text-[10px] font-bold text-neutral-400 dark:text-nexus-text-sec uppercase tracking-widest group-hover:text-neutral-900 dark:group-hover:text-nexus-text-title transition-colors">Estações de Exame →</span>
                <div className="w-10 h-10 bg-rose-500/10 rounded-xl flex items-center justify-center text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default HPView;
