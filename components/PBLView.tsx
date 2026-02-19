
import React, { useState } from 'react';
import { UserStats } from '../types';

interface PBLDoc {
  title: string;
  url: string;
  type?: 'problema' | 'resumo' | 'simulado' | 'conteudo';
}

const MODULE_CONTENT: Record<number, { 
  main: PBLDoc[]; 
  resumos: PBLDoc[]; 
  simulados: PBLDoc[] 
}> = {
  1: {
    main: [
      { title: "Problema 1", url: "https://drive.google.com/file/d/1-4pLMq5xMrYzPV2SlyCkH-7NfXOhbuyL/preview", type: 'problema' },
      { title: "Problema 2", url: "https://drive.google.com/file/d/1bwaEAol3mZNvBUvS-sR7c4-1dqYRj1iV/preview", type: 'problema' },
      { title: "Problema 3", url: "https://drive.google.com/file/d/1JGSxDLH2ztu_tKh79-ssuspRc2PztL7V/preview", type: 'problema' },
    ],
    resumos: [],
    simulados: []
  },
  4: {
    main: [
      { title: "Proliferação Celular e Bases da Regulação do Crescimento", url: "https://drive.google.com/file/d/1944ESwyOanEl0lInq9ulluasGploqCI8/preview", type: 'conteudo' }
    ],
    resumos: [],
    simulados: []
  },
  7: {
    main: [
      { title: "Fisiologia Reprodutiva, Planejamento Familiar e Manejo de ISTs", url: "https://drive.google.com/file/d/13gWSzX01L-E4lxGewvFKci9f-GwJz_S2/preview", type: 'conteudo' },
      { title: "Tratado de Gametogênese e Fecundação Humana", url: "https://drive.google.com/file/d/1N1UKZe7oLi9OdjRK_Vee_UNHmVNzfviO/preview", type: 'conteudo' },
      { title: "Assistência Pré-Natal no Brasil: Diretrizes e Políticas", url: "https://drive.google.com/file/d/1jCN5GJX7NUd2Tp8RA1J36142K568yXav/preview", type: 'conteudo' },
      { title: "Obstetrícia Clínica: Estática Fetal e Pontos de Referência", url: "https://drive.google.com/file/d/1n35uzpb_bWcAsOR73299bhVKHCY-ABZf/preview", type: 'conteudo' },
      { title: "Fisiologia da Lactação e Dinâmicas do Puerpério", url: "https://drive.google.com/file/d/1q4JsEo6C5FoaO3wQ48jau_gwC2gJyUSu/preview", type: 'conteudo' },
    ],
    resumos: [
      { title: "Resumo do Módulo 7 — Concepção, Formação e Gestação", url: "https://drive.google.com/file/d/18Wp79G450E0Q0c5xa6Wz8Bw87f9yyNKY/preview", type: 'resumo' }
    ],
    simulados: [
      { title: "Simulado do Módulo 7 — Avaliação Clínica Integrada", url: "https://drive.google.com/file/d/1npyzGRQXfXTzLXArdl45sZW7tCZofwR2/preview", type: 'simulado' }
    ]
  },
  8: {
    main: [
      { title: "Assistência ao Nascimento e Reanimação Neonatal", url: "https://drive.google.com/file/d/1Vay17dhyeGHfcVXu1TPog6N-pgiTxsHf/preview", type: 'conteudo' },
      { title: "Metabolismo da Bilirrubina e Icterícia Neonatal", url: "https://drive.google.com/file/d/1KK6qtpEI2Nr_tW65-fPArGMHO2-8DDwN/preview", type: 'conteudo' },
      { title: "Aleitamento Materno e Assistência Humanizada", url: "https://drive.google.com/file/d/1ZUthP5xGDxR_iz5TCofRQNrVuSPFPGtn/preview", type: 'conteudo' },
      { title: "Crescimento e Desenvolvimento Infantil", url: "https://drive.google.com/file/d/1o7jNXrJ7TjtbXs6Wm7qOA1z2TgEfo2I4/preview", type: 'conteudo' },
      { title: "Vigilância Antropométrica e Crescimento Infantil", url: "https://drive.google.com/file/d/1pNq1rlW1edeV7MdV6eM6ZULHH137VMOD/preview", type: 'conteudo' },
      { title: "Fisiologia da Puberdade e Eixo Hipotálamo-Hipófise-Gonadal", url: "https://drive.google.com/file/d/1DOOIdDNygPshPIRjrLmKLuVPbPzfLZ1D/preview", type: 'conteudo' },
    ],
    resumos: [
      { title: "Resumo do Módulo 8 — Desenvolvimento da Criança", url: "https://drive.google.com/file/d/1TLri-mokJ4RECshSPC3V-tW56DivSA_X/preview", type: 'resumo' }
    ],
    simulados: [
      { title: "Simulado do Módulo 8 — Avaliação Neonatal e Crescimento Infantil", url: "https://drive.google.com/file/d/1zpIGBVe864zvrXKdeibkjXcLBgnv_7tx/preview", type: 'simulado' }
    ]
  }
};

interface PBLViewProps {
  userStats: UserStats;
  onEnterContent: (title: string, type: 'pdf' | 'aula') => void;
  onAddActivity: (item: any) => void;
}

const PBLView: React.FC<PBLViewProps> = ({ userStats, onEnterContent, onAddActivity }) => {
  const [selectedModule, setSelectedModule] = useState<number | null>(null);
  const [activeInternalTab, setActiveInternalTab] = useState<'main' | 'resumos' | 'simulados'>('main');
  const [viewingDoc, setViewingDoc] = useState<PBLDoc | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const modulesBasico = [
    { id: 1, title: 'MÓDULO 1 — Introdução ao Estudo da Medicina', color: 'border-nexus-blue' },
    { id: 2, title: 'ASE 2 — Proliferação e Crescimento Celular', color: 'border-sky-400' },
    { id: 3, title: 'ASE 3 — Funções Biológicas 1', color: 'border-blue-500' },
    { id: 4, title: 'MÓDULO 4 — Proliferação e Crescimento Celular', color: 'border-indigo-400' },
    { id: 5, title: 'ASE 5 — Metabolismo e Nutrição', color: 'border-emerald-500' },
    { id: 6, title: 'ASE 6 — Mecanismo de Agressão e Defesa', color: 'border-orange-500' },
    { id: 7, title: 'ASE 7 — Concepção, Formação e Gestação', color: 'border-nexus-purple' },
    { id: 8, title: 'ASE 8 — Desenvolvimento da Criança', color: 'border-rose-400' },
    { id: 9, title: 'ASE 9 — Vida Adulta e Envelhecimento', color: 'border-amber-600' },
    { id: 10, title: 'ASE 10 — Percepção, Consciência e Emoções', color: 'border-violet-500' },
    { id: 11, title: 'ASE 11 — Febre, Inflamação e Infecção', color: 'border-red-600' },
    { id: 12, title: 'ASE 12 — Fadiga, Perda de Peso e Anemias', color: 'border-neutral-500' },
  ];

  const modulesClinico = [
    { id: 13, title: 'ASE 13 — Disúria, Edema e Proteinúria', color: 'border-blue-700' },
    { id: 14, title: 'ASE 14 — Perda de Sangue', color: 'border-rose-700' },
    { id: 15, title: 'ASE 15 — Mente e Comportamento', color: 'border-purple-800' },
  ];

  const handleOpenDoc = (doc: PBLDoc) => {
    setViewingDoc(doc);
    // Fluxo: Abre o leitor e dispara o popup de foco imediatamente
    onEnterContent(doc.title, 'pdf');
    onAddActivity({
      id: `pbl_${selectedModule}_${doc.title}`,
      type: 'apostila',
      title: doc.title,
      subtitle: `Módulo ${selectedModule}`
    });
  };

  const handleBackToModules = () => {
    setSelectedModule(null);
    setViewingDoc(null);
    setActiveInternalTab('main');
  };

  const PDFViewer = () => {
    if (!viewingDoc) return null;

    const viewerClasses = isFullscreen 
      ? "fixed inset-0 z-[500] bg-black p-0 overflow-hidden" 
      : "relative w-full h-[80vh] rounded-[2rem] border border-nexus-border bg-nexus-card overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300";

    return (
      <div className={viewerClasses}>
        <div className="flex flex-col h-full">
          <div className="p-4 md:px-6 md:py-4 border-b border-nexus-border bg-nexus-surface/50 flex justify-between items-center shrink-0">
             <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-nexus-purple/20 flex items-center justify-center text-nexus-purple shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <h2 className="text-xs md:text-sm font-black text-white uppercase italic tracking-tighter truncate">
                  {viewingDoc.title}
                </h2>
             </div>
             
             <div className="flex items-center gap-2 shrink-0">
                <button 
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="px-3 py-1.5 bg-nexus-hover border border-nexus-border rounded-lg text-[9px] font-black text-nexus-text-sec uppercase tracking-widest hover:text-white transition-all flex items-center gap-2"
                >
                  {isFullscreen ? (
                    <><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v5H3M21 8h-5V3M3 16h5v5M16 21v-5h5"/></svg> Sair</>
                  ) : (
                    <><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg> Tela Cheia</>
                  )}
                </button>
                <button 
                  onClick={() => { setViewingDoc(null); setIsFullscreen(false); }}
                  className="w-8 h-8 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-lg flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
             </div>
          </div>

          <div className="flex-grow bg-nexus-bg relative">
             <iframe 
               src={viewingDoc.url} 
               className="w-full h-full border-none" 
               title={viewingDoc.title}
             />
             {isFullscreen && (
               <button 
                onClick={() => setIsFullscreen(false)}
                className="absolute bottom-8 right-8 bg-black/80 backdrop-blur-md border border-white/20 text-white px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all shadow-2xl"
               >
                 Sair da Tela Cheia
               </button>
             )}
          </div>
        </div>
      </div>
    );
  };

  if (selectedModule) {
    const data = MODULE_CONTENT[selectedModule] || { main: [], resumos: [], simulados: [] };
    const docsToShow = activeInternalTab === 'main' ? data.main : 
                      activeInternalTab === 'resumos' ? data.resumos : 
                      data.simulados;

    return (
      <div className="max-w-[1400px] mx-auto animate-in fade-in duration-500 px-4">
        <button onClick={handleBackToModules} className="mb-8 flex items-center gap-2 text-neutral-500 hover:text-white transition-colors group">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-1 transition-transform"><path d="m15 18-6-6 6-6"/></svg>
          <span className="text-xs font-medium uppercase tracking-widest">Voltar para Grade</span>
        </button>

        <header className="mb-10">
          <span className="text-[10px] font-black text-nexus-purple uppercase tracking-[0.4em] mb-2 block">PBL / Tutoria</span>
          <h2 className="text-xl md:text-2xl font-black text-neutral-900 dark:text-nexus-text-title tracking-tight italic uppercase">
            {modulesBasico.concat(modulesClinico).find(m => m.id === selectedModule)?.title}
          </h2>
        </header>

        {(selectedModule === 7 || selectedModule === 8) && (
          <div className="flex flex-wrap gap-2 mb-8">
            <button 
              onClick={() => { setActiveInternalTab('main'); setViewingDoc(null); }}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${activeInternalTab === 'main' ? 'bg-nexus-purple text-white border-nexus-purple' : 'bg-nexus-surface text-nexus-text-sec border-nexus-border hover:text-white'}`}
            >
              📂 Conteúdos Principais
            </button>
            <button 
              onClick={() => { setActiveInternalTab('resumos'); setViewingDoc(null); }}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${activeInternalTab === 'resumos' ? 'bg-sky-600 text-white border-sky-600' : 'bg-nexus-surface text-nexus-text-sec border-nexus-border hover:text-white'}`}
            >
              📖 Resumo do Módulo
            </button>
            <button 
              onClick={() => { setActiveInternalTab('simulados'); setViewingDoc(null); }}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${activeInternalTab === 'simulados' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-nexus-surface text-nexus-text-sec border-nexus-border hover:text-white'}`}
            >
              📝 Simulado do Módulo
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
           <div className="space-y-3">
              {docsToShow.length > 0 ? docsToShow.map((doc, i) => (
                <button 
                  key={i} 
                  onClick={() => handleOpenDoc(doc)}
                  className={`w-full text-left p-5 rounded-2xl border transition-all flex flex-col gap-2 ${
                    viewingDoc?.title === doc.title 
                    ? 'border-nexus-purple bg-nexus-purple/10 shadow-sm shadow-nexus-purple/10' 
                    : 'bg-white dark:bg-nexus-card border-neutral-200 dark:border-nexus-border hover:border-nexus-purple/50'
                  }`}
                >
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded w-fit ${
                    doc.type === 'problema' ? 'bg-nexus-purple/10 text-nexus-purple' : 
                    doc.type === 'resumo' ? 'bg-sky-500/10 text-sky-500' :
                    doc.type === 'simulado' ? 'bg-emerald-500/10 text-emerald-500' :
                    'bg-nexus-blue/10 text-nexus-blue'
                  }`}>
                    {doc.type === 'problema' ? 'Problema' : doc.type === 'resumo' ? 'E-book' : doc.type === 'simulado' ? 'Simulado' : 'Documento'}
                  </span>
                  <h3 className="text-xs font-bold text-neutral-900 dark:text-white leading-tight">
                    {doc.title}
                  </h3>
                </button>
              )) : (
                <div className="py-10 text-center bg-neutral-100 dark:bg-nexus-surface/50 rounded-2xl border border-dashed border-neutral-300 dark:border-nexus-border">
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Em processamento</p>
                </div>
              )}
           </div>

           <div className="lg:col-span-3">
              {viewingDoc ? (
                <PDFViewer />
              ) : (
                <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-12 bg-neutral-50 dark:bg-nexus-surface/30 border border-dashed border-neutral-300 dark:border-nexus-border rounded-[3rem]">
                   <div className="w-16 h-16 bg-nexus-purple/10 text-nexus-purple rounded-full flex items-center justify-center mb-6">
                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                   </div>
                   <h3 className="text-lg font-black text-neutral-900 dark:text-nexus-text-title uppercase italic tracking-tight">Selecione um documento</h3>
                   <p className="text-neutral-500 text-xs mt-2 max-w-xs leading-relaxed">Escolha um item da lista lateral para visualizar o conteúdo técnico e ativar o modo foco.</p>
                </div>
              )}
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto animate-in fade-in duration-500 px-4">
      <header className="mb-12">
        <h2 className="text-4xl md:text-6xl font-black text-neutral-900 dark:text-nexus-text-title mb-6 tracking-tighter italic">PBL</h2>
        <p className="text-neutral-500 dark:text-nexus-text-main text-lg md:text-xl font-light max-w-3xl leading-relaxed">
          Problem-Based Learning: Organização modular para tutoria e práticas de raciocínio clínico.
        </p>
      </header>

      <section className="mb-16">
        <h3 className="text-[10px] font-black text-nexus-blue uppercase tracking-[0.4em] mb-8 flex items-center gap-4">
          Ciclo Básico <div className="h-px flex-grow bg-nexus-blue/20"></div>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {modulesBasico.map((m) => (
            <div 
              key={m.id} 
              onClick={() => setSelectedModule(m.id)}
              className={`bg-white dark:bg-nexus-card border border-neutral-200 dark:border-nexus-border border-l-4 ${m.color} p-8 rounded-[2rem] cursor-pointer hover:bg-neutral-50 dark:hover:bg-nexus-hover hover:-translate-y-1 transition-all group flex flex-col justify-between h-56 shadow-sm`}
            >
              <div>
                <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-2">ASE {m.id}</span>
                <h4 className="text-lg font-black text-neutral-900 dark:text-nexus-text-title italic tracking-tight group-hover:text-nexus-purple transition-colors leading-tight">
                  {m.title.includes('—') ? m.title.split('—')[1].trim() : m.title}
                </h4>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Ver Materiais →</span>
                <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-nexus-surface flex items-center justify-center text-nexus-purple group-hover:bg-nexus-purple group-hover:text-white transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.4em] mb-8 flex items-center gap-4">
          Ciclo Clínico <div className="h-px flex-grow bg-neutral-200 dark:border-nexus-border"></div>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {modulesClinico.map((m) => (
            <div 
              key={m.id} 
              onClick={() => setSelectedModule(m.id)}
              className={`bg-white dark:bg-nexus-card border border-neutral-200 dark:border-nexus-border border-l-4 ${m.color} p-8 rounded-[2rem] cursor-pointer hover:bg-neutral-50 dark:hover:bg-nexus-hover hover:-translate-y-1 transition-all group flex flex-col justify-between h-56 shadow-sm`}
            >
              <div>
                <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-2">ASE {m.id}</span>
                <h4 className="text-lg font-black text-neutral-900 dark:text-nexus-text-title italic tracking-tight group-hover:text-nexus-purple transition-colors leading-tight">
                  {m.title.includes('—') ? m.title.split('—')[1].trim() : m.title}
                </h4>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Ver Materiais →</span>
                <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-nexus-surface flex items-center justify-center text-nexus-purple group-hover:bg-nexus-purple group-hover:text-white transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default PBLView;
