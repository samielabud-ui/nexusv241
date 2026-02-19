
import React, { useState, useMemo } from 'react';
import { UserStats } from '../types';

interface Lesson {
  title: string;
  url: string;
}

interface MorfoViewProps {
  userStats: UserStats;
  onNavigateToPremium?: () => void;
  onIncrementUsage?: (contentId: string) => void;
  onAddActivity: (item: any) => void;
  onEnterContent: (title: string, type: 'pdf' | 'aula') => void;
  onAwardPoints?: (id: string, value?: number) => void;
}

const HISTOLOGIA_MED1_M1: Lesson[] = [
  { title: "Microscopia", url: "https://drive.google.com/file/d/1nVXbyb0o-QHPTmvxMiqekYyqN0sNkisL/preview" },
  { title: "Tecido Epitelial – Parte 1", url: "https://drive.google.com/file/d/1E28iREzZdPdHbTMIbb94B0_SzNIJFiYe/preview" },
  { title: "Tecido Epitelial – Parte 2", url: "https://drive.google.com/file/d/1Q0CrOd2vzngCgyUq1DsWkCG8IlxvvdcE/preview" },
  { title: "Tecido Conjuntivo", url: "https://drive.google.com/file/d/1ohwE0qb0HEjYDGHR3lsa7cJ1PLmXW7qc/preview" }
];

const ANATOMIA_MED1_M1: Lesson[] = [
  { title: "Planos e Terminologias Anatômicas", url: "https://drive.google.com/file/d/1tpciAGHGcvYE6M0i8IupSp7SKMVT7J-j/preview" },
  { title: "Pele e Tecido Adiposo", url: "https://drive.google.com/file/d/1LKrpLvO4mOhu7ocEtk6PcXxqSj4tEBD3/preview" },
  { title: "Parede Abdominal", url: "https://drive.google.com/file/d/1Wz5mMbURVOqBkvYyCpNl9Yc3bN4RKFF5/preview" }
];

const ANATOMIA_MED1_M2: Lesson[] = [
  { title: "Genética Molecular", url: "https://drive.google.com/file/d/1GBpy53N1epSYjdJlzbtXYBuoVbLQ_y5p/preview" },
  { title: "Genética Mendeliana", url: "https://drive.google.com/file/d/1xNC5q6QDwNzr6OpyMLd_93WKAZMU9FgM/preview" }
];

const HISTOLOGIA_MED3_M7: Lesson[] = [
  { title: "Aparelho Reprodutor Feminino", url: "https://drive.google.com/file/d/1dmGXSz1fc8F8JsHIFOibXU4mNXxuIDJE/preview" },
  { title: "Aparelho Reprodutor Masculino", url: "https://drive.google.com/file/d/1YewexKH_be-FHPIirnN9D115VTUE37aV/preview" }
];

const ANATOMIA_MED3_GERAL: Lesson[] = [
  { title: "Fisiologia do Parto", url: "https://drive.google.com/file/d/1YiH8qYyHjdMTCCMtlKjnb6YOSFyijLFU/preview" },
  { title: "Puerpério", url: "https://drive.google.com/file/d/1Z1xXJXcN3iD7KiO_z8UpfD-mEZK2ctR9/preview" }
];

const MorfoView: React.FC<MorfoViewProps> = ({ userStats, onNavigateToPremium, onIncrementUsage, onAddActivity, onEnterContent, onAwardPoints }) => {
  const [selectedMed, setSelectedMed] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'Anatomia' | 'Histologia' | null>(null);
  const [selectedModule, setSelectedModule] = useState<number | null>(null);
  const [activePdf, setActivePdf] = useState<Lesson | null>(null);

  const meds = Array.from({ length: 8 }, (_, i) => i + 1);

  const isOverLimit = (id: string) => {
    if (userStats?.plan === 'premium') return false;
    if (userStats?.openedContentIds?.includes(id)) return false;
    return (userStats?.openedContentIds?.length || 0) >= 10;
  };

  const handleOpenPdf = (lesson: Lesson) => {
    const contentId = `morfo_${selectedMed}_${selectedCategory}_${selectedModule}_${lesson.title}`;
    if (isOverLimit(contentId)) {
        setActivePdf(lesson); 
        return;
    }
    setActivePdf(lesson);
    onIncrementUsage?.(contentId);
    onEnterContent(lesson.title, 'pdf');

    onAddActivity({
      id: contentId,
      type: 'aula',
      title: lesson.title,
      subtitle: `Med ${selectedMed} • ${selectedCategory} ${selectedModule === 0 ? '' : '• Módulo ' + selectedModule}`,
      metadata: { med: selectedMed, category: selectedCategory, moduleId: selectedModule, lessonTitle: lesson.title, url: lesson.url }
    });

    onAwardPoints?.(contentId, 5);
  };

  const getModulesForMed = (med: number) => {
    const start = (med - 1) * 3 + 1;
    return [start, start + 1, start + 2];
  };

  const getLessons = () => {
    if (selectedMed === 1) {
      if (selectedModule === 1) return selectedCategory === 'Histologia' ? HISTOLOGIA_MED1_M1 : ANATOMIA_MED1_M1;
      if (selectedModule === 2 && selectedCategory === 'Anatomia') return ANATOMIA_MED1_M2;
    }
    if (selectedMed === 3) {
      if (selectedCategory === 'Histologia' && selectedModule === 7) return HISTOLOGIA_MED3_M7;
      if (selectedCategory === 'Anatomia') return ANATOMIA_MED3_GERAL;
    }
    return null;
  };

  const lessons = getLessons();

  if (activePdf) {
    const activeLessonId = `morfo_${selectedMed}_${selectedCategory}_${selectedModule}_${activePdf.title}`;
    const showOverLimitBanner = isOverLimit(activeLessonId);

    return (
      <div className="max-w-[1400px] mx-auto animate-in fade-in duration-500 px-4 relative">
        {showOverLimitBanner && (
          <div className="absolute inset-0 z-40 bg-neutral-900/90 dark:bg-nexus-bg/90 backdrop-blur-md flex items-center justify-center p-6 text-center rounded-[2rem]">
            <div className="max-w-md">
              <h3 className="text-2xl font-black text-white mb-4">Limite do Plano Básico</h3>
              <p className="text-neutral-400 mb-8 text-sm leading-relaxed">Assine o Premium para acesso ilimitado.</p>
              <button onClick={onNavigateToPremium} className="w-full bg-nexus-blue text-black font-black py-4 rounded-xl text-xs uppercase tracking-widest">Conhecer Premium</button>
            </div>
          </div>
        )}
        <button onClick={() => setActivePdf(null)} className="mb-6 flex items-center gap-2 text-neutral-500 hover:text-white transition-colors group">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-1 transition-transform"><path d="m15 18-6-6 6-6"/></svg>
          <span className="text-xs font-medium uppercase tracking-widest">Voltar</span>
        </button>
        <div className="bg-white rounded-[2rem] overflow-hidden shadow-sm relative h-[80vh] border border-neutral-200 dark:border-nexus-border">
          <iframe src={activePdf.url} className="w-full h-full border-none" title={activePdf.title} />
        </div>
      </div>
    );
  }

  if (selectedMed === null) {
    return (
      <div className="max-w-[1600px] mx-auto animate-in fade-in duration-500 px-4">
        <header className="mb-10 md:mb-12">
          <h2 className="text-4xl md:text-5xl font-black text-neutral-900 dark:text-nexus-text-title mb-4 tracking-tighter italic">Morfo</h2>
          <p className="text-neutral-500 text-lg font-light max-w-2xl leading-relaxed">Seleção modular de Anatomia e Histologia.</p>
        </header>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {meds.map((m) => (
            <div key={m} onClick={() => setSelectedMed(m)} className="bg-white dark:bg-nexus-card border border-neutral-200 dark:border-nexus-border border-l-4 border-l-teal-400 p-8 rounded-[2rem] cursor-pointer hover:bg-neutral-50 dark:hover:bg-nexus-hover hover:-translate-y-1 transition-all flex flex-col justify-between h-52 shadow-sm">
              <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Período</span>
              <h4 className="text-3xl font-black text-neutral-900 dark:text-nexus-text-title italic">Med {m}</h4>
              <span className="text-[10px] font-bold text-teal-600 uppercase tracking-widest italic">Acessar →</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (selectedCategory === null) {
    return (
      <div className="max-w-[1200px] mx-auto animate-in slide-in-from-right-4 duration-500 px-4">
        <button onClick={() => setSelectedMed(null)} className="mb-8 text-xs font-bold text-neutral-500 uppercase tracking-widest">← Escolher Outro Med</button>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div onClick={() => { setSelectedCategory('Anatomia'); if (selectedMed === 3) setSelectedModule(0); }} className="bg-white dark:bg-nexus-card border border-neutral-200 dark:border-nexus-border p-12 rounded-[3rem] cursor-pointer hover:border-indigo-500 transition-all text-center">
            <h3 className="text-3xl font-black text-neutral-900 dark:text-nexus-text-title mb-4 italic">Anatomia</h3>
            <p className="text-neutral-500 text-sm">Atlas e resumos integrados.</p>
          </div>
          <div onClick={() => setSelectedCategory('Histologia')} className="bg-white dark:bg-nexus-card border border-neutral-200 dark:border-nexus-border p-12 rounded-[3rem] cursor-pointer hover:border-teal-500 transition-all text-center">
            <h3 className="text-3xl font-black text-neutral-900 dark:text-nexus-text-title mb-4 italic">Histologia</h3>
            <p className="text-neutral-500 text-sm">Lâminas digitais e tecidos.</p>
          </div>
        </div>
      </div>
    );
  }

  if (selectedModule === null) {
    const modules = getModulesForMed(selectedMed);
    return (
      <div className="max-w-[1200px] mx-auto animate-in slide-in-from-right-4 duration-500 px-4">
        <button onClick={() => setSelectedCategory(null)} className="mb-8 text-xs font-bold text-neutral-500 uppercase tracking-widest">← Voltar</button>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {modules.map((mod) => (
            <div key={mod} onClick={() => setSelectedModule(mod)} className="bg-white dark:bg-nexus-card border border-neutral-200 dark:border-nexus-border border-l-4 border-l-teal-400 p-8 rounded-[2rem] cursor-pointer hover:bg-neutral-50 dark:hover:bg-nexus-hover transition-all h-40 flex flex-col justify-center">
              <h4 className="text-2xl font-black text-neutral-900 dark:text-nexus-text-title italic">Módulo {mod}</h4>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto animate-in fade-in duration-500 px-4">
      <button onClick={() => setSelectedModule(null)} className="mb-8 text-xs font-bold text-neutral-500 uppercase tracking-widest">← Voltar para Módulos</button>
      <div className="space-y-4">
        {lessons ? lessons.map((lesson, index) => (
          <div key={index} className="bg-white dark:bg-nexus-card border border-neutral-200 dark:border-nexus-border p-6 rounded-2xl flex justify-between items-center group hover:border-teal-400 transition-all shadow-sm">
            <h3 className="text-neutral-900 dark:text-nexus-text-title font-bold text-lg">{lesson.title}</h3>
            <button onClick={() => handleOpenPdf(lesson)} className="bg-neutral-100 dark:bg-nexus-surface text-neutral-900 dark:text-nexus-text-main px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-teal-500 hover:text-white transition-all">Abrir Material</button>
          </div>
        )) : (
          <div className="p-20 text-center bg-neutral-50 dark:bg-nexus-surface border border-dashed border-neutral-300 dark:border-nexus-border rounded-[3rem]">
            <p className="text-neutral-500 font-bold uppercase text-xs">Módulo em Processamento</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MorfoView;
