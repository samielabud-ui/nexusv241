
import React, { useState, useMemo, useRef } from 'react';
import { MOCK_QUESTIONS } from '../constants';
import QuestionCard from './QuestionCard';
import { UserStats, Question } from '../types';

type AnswerStatus = 'correct' | 'incorrect' | 'unanswered';

interface QuestionsViewProps {
  userStats?: UserStats;
  onNavigateToPremium?: () => void;
  onIncrementUsage?: (contentId: string) => void;
  onAddActivity: (item: any) => void;
}

const QuestionsView: React.FC<QuestionsViewProps> = ({ userStats, onNavigateToPremium, onIncrementUsage, onAddActivity }) => {
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
  const [isGenerated, setIsGenerated] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [sessionAnswers, setSessionAnswers] = useState<Record<string, AnswerStatus>>({});

  const [ciclo, setCiclo] = useState<'Ciclo Básico' | 'Ciclo Clínico' | null>(null);
  const [moduloTitle, setModuloTitle] = useState('');
  const [modalidade, setModalidade] = useState('Todos');
  const [problema, setProblema] = useState('Todos');
  const [tema, setTema] = useState('');
  const [quantidade, setQuantidade] = useState<string>('10');

  const contentIdForModule = selectedModuleId ? `questoes_mod_${selectedModuleId}` : '';
  const isAlreadyOpened = userStats?.openedContentIds?.includes(contentIdForModule);
  const isOverLimit = userStats?.plan === 'basic' && (userStats?.openedContentIds?.length || 0) >= 10 && !isAlreadyOpened;

  // Histórico específico de questões
  const questionsHistory = useMemo(() => 
    (userStats?.recentActivity || []).filter(a => a.type === 'questoes').slice(0, 3),
  [userStats?.recentActivity]);

  const handleResumeActivity = (act: any) => {
    if (act.metadata) {
      setSelectedModuleId(act.metadata.moduleId);
      setModuloTitle(act.metadata.moduloTitle);
      setCiclo(act.metadata.ciclo);
      setIsGenerated(false);
    }
  };

  const modulesBasico = [
    { id: 1, title: 'ASE 1 — Introdução ao Estudo da Medicina', color: 'border-blue-500' },
    { id: 2, title: 'ASE 2 — Proliferação, Alteração do Crescimento e Diferenciação Celular', color: 'border-blue-400' },
    { id: 3, title: 'ASE 3 — Funções Biológicas 1', color: 'border-blue-300' },
    { id: 4, title: 'ASE 4 — Funções Biológicas 2', color: 'border-cyan-500' },
    { id: 5, title: 'ASE 5 — Metabolismo e Nutrição', color: 'border-emerald-500' },
    { id: 6, title: 'ASE 6 — Mecanismo de Agressão e Defesa', color: 'border-orange-500' },
    { id: 7, title: 'ASE 7 — Concepção, Formação do Ser Humano e Gestação', color: 'border-rose-500' },
    { id: 8, title: 'ASE 8 — Nascimento, Crescimento e Desenvolvimento da Criança e do Adolescente', color: 'border-yellow-500' },
    { id: 9, title: 'ASE 9 — Vida Adulta e Processo de Envelhecimento', color: 'border-amber-600' },
    { id: 10, title: 'ASE 10 — Percepção, Consciência e Emoções', color: 'border-purple-500' },
    { id: 11, title: 'ASE 11 — Febre, Inflamação e Infecção', color: 'border-red-600' },
    { id: 12, title: 'ASE 12 — Fadiga, Perda de Peso e Anemias', color: 'border-neutral-500' },
  ];

  const modulesClinico = [
    { id: 13, title: 'ASE 13 — Disúria, Edema e Proteinúria', color: 'border-indigo-500' },
    { id: 14, title: 'ASE 14 — Perda de Sangue', color: 'border-red-700' },
    { id: 15, title: 'ASE 15 — Mente e Comportamento', color: 'border-violet-600' },
  ];

  const filteredQuestions = useMemo(() => {
    if (!moduloTitle) return [];
    let results = MOCK_QUESTIONS.filter(q => {
      const matchesModulo = q.modulo.includes(moduloTitle) || moduloTitle.includes(q.modulo);
      const matchesModalidade = modalidade === 'Todos' || q.modalidade === modalidade;
      const matchesProblema = problema === 'Todos' || q.problema.toString() === problema;
      const matchesTema = tema === '' || q.tema.toLowerCase().includes(tema.toLowerCase());
      return matchesModulo && matchesModalidade && matchesProblema && matchesTema;
    });
    if (quantidade === 'Todas') return results;
    return results.slice(0, parseInt(quantidade));
  }, [moduloTitle, modalidade, problema, tema, quantidade]);

  const handleModuleSelect = (m: {id: number, title: string}, c: 'Ciclo Básico' | 'Ciclo Clínico') => {
    setCiclo(c);
    setSelectedModuleId(m.id);
    setModuloTitle(m.title);
    setIsGenerated(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Rastrear seleção do módulo como atividade
    onAddActivity({
      id: `questoes_setup_${m.id}`,
      type: 'questoes',
      title: 'Lista: ' + m.title.split('—')[0].trim(),
      subtitle: m.title.split('—')[1]?.trim() || m.title,
      metadata: { moduleId: m.id, moduloTitle: m.title, ciclo: c }
    });
  };

  const handleDownloadM7Apostila = async () => {
    if (isOverLimit) return;
    setExporting(true);
    try {
      const { jsPDF } = (window as any).jspdf;
      const doc = new jsPDF();
      const margin = 20;
      let y = 30;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(30, 30, 30);
      doc.text("NexusBQ | Apostila Módulo 7", margin, y);
      
      y += 10;
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text("ASE 7 — Concepção, Formação do Ser Humano e Gestação", margin, y);
      
      y += 15;
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, y, 190, y);
      y += 15;

      const m7Questions = MOCK_QUESTIONS.filter(q => q.modulo.includes("ASE 7"));

      m7Questions.forEach((q, index) => {
        if (y > 260) {
          doc.addPage();
          y = 30;
        }

        doc.saveGraphicsState();
        doc.setGState(new doc.GState({ opacity: 0.05 }));
        doc.setFontSize(60);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(150, 150, 150);
        doc.text("NEXUSBQ", 40, 150, { angle: 45 });
        doc.restoreGraphicsState();

        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(50, 50, 50);
        const headerText = `QUESTÃO ${index + 1} | PROBLEMA ${q.problema} | ${q.tema}`;
        doc.text(headerText, margin, y);
        y += 7;

        doc.setFont("helvetica", "normal");
        doc.setTextColor(80, 80, 80);
        const lines = doc.splitTextToSize(q.enunciado, 170);
        doc.text(lines, margin, y);
        y += (lines.length * 5) + 5;

        q.alternativas.forEach((alt, i) => {
          const char = String.fromCharCode(65 + i);
          doc.text(`${char}) ${alt}`, margin + 5, y);
          y += 6;
        });

        y += 10;
      });

      doc.save("NexusBQ_Apostila_Modulo7.pdf");
      onIncrementUsage?.(`apostila_m7`);
    } catch (err) {
      console.error(err);
      alert("Erro ao gerar apostila.");
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadExtraM7 = async () => {
    if (!userStats?.isPremium) {
       alert("Conteúdo Exclusivo Premium: Questões Extras são liberadas apenas para assinantes Premium.");
       onNavigateToPremium?.();
       return;
    }
    // No premium don't have limit
    setExporting(true);
    try {
      const url = "https://drive.google.com/uc?export=download&id=1npyzGRQXfXTzLXArdl45sZW7tCZofwR2";
      try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        
        const { PDFDocument, rgb, degrees, StandardFonts } = (window as any).PDFLib;
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const pages = pdfDoc.getPages();
        const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        pages.forEach(page => {
          page.drawText("NEXUSBQ", {
            x: 150,
            y: 350,
            size: 80,
            font: font,
            color: rgb(0.5, 0.5, 0.5),
            opacity: 0.08,
            rotate: degrees(45),
          });
        });

        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = "NexusBQ_Questoes_Extras_Modulo7.pdf";
        link.click();
      } catch (fetchErr) {
        window.open("https://drive.google.com/file/d/1npyzGRQXfXTzLXArdl45sZW7tCZofwR2/view", "_blank");
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao processar PDF extra.");
    } finally {
      setExporting(false);
    }
  };

  const handleGenerate = () => {
    if (isOverLimit) return;
    setSessionAnswers({});
    setIsGenerated(true);
    
    onAddActivity({
      id: `questoes_${selectedModuleId}`,
      type: 'questoes',
      title: 'Sessão: ' + moduloTitle.split('—')[0].trim(),
      subtitle: `${quantidade} itens de ${moduloTitle.split('—')[1]?.trim() || moduloTitle}`,
      metadata: { moduleId: selectedModuleId, moduloTitle: moduloTitle, ciclo: ciclo }
    });

    onIncrementUsage?.(contentIdForModule);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetModule = () => {
    setSelectedModuleId(null);
    setModuloTitle('');
    setIsGenerated(false);
    setSessionAnswers({});
  };

  if (isGenerated) {
    return (
      <div className="max-w-[1600px] mx-auto animate-in fade-in duration-500">
        <header className="mb-8 md:mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-neutral-200 dark:border-nexus-border pb-8">
          <div>
            <div className="flex items-center flex-wrap gap-2 md:gap-4 mb-2">
              <span className="text-[9px] md:text-[10px] font-black text-sky-600 dark:text-nexus-blue uppercase tracking-[0.2em]">{ciclo}</span>
              <span className="hidden md:inline text-neutral-400 dark:text-nexus-text-label">/</span>
              <span className="text-[9px] md:text-[10px] font-black text-neutral-500 dark:text-nexus-text-sec uppercase tracking-[0.2em] truncate max-w-[200px] md:max-w-[400px]">{moduloTitle}</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-neutral-900 dark:text-nexus-text-title tracking-tight">Prática de Questões</h2>
          </div>
          <div className="flex gap-3">
             <button onClick={() => setIsGenerated(false)} className="w-full md:w-auto text-[10px] font-bold text-neutral-500 dark:text-nexus-text-sec hover:text-neutral-900 dark:hover:text-white flex items-center justify-center gap-2 transition-colors bg-white dark:bg-nexus-surface px-5 py-3 rounded-xl border border-neutral-200 dark:border-nexus-border uppercase tracking-widest">
              Configurar Sessão
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-9 space-y-6">
            {filteredQuestions.length > 0 ? (
              <>
                {filteredQuestions.map(q => (
                  <QuestionCard key={q.id} question={q} onAnswer={(status) => setSessionAnswers(prev => ({ ...prev, [q.id]: status }))} />
                ))}
                <div className="py-12 md:py-20 text-center">
                  <button onClick={resetModule} className="w-full md:w-auto bg-sky-600 hover:bg-sky-500 text-white px-10 py-4 rounded-2xl text-md font-black transition-all uppercase tracking-widest">
                    Finalizar e Voltar
                  </button>
                </div>
              </>
            ) : (
              <div className="py-20 md:py-40 text-center border border-dashed border-neutral-200 dark:border-nexus-border rounded-[2rem] md:rounded-[3rem]">
                <h3 className="text-neutral-900 dark:text-nexus-text-title text-xl md:text-2xl font-bold mb-4 px-4">Sem questões para os filtros aplicados</h3>
                <button onClick={() => setIsGenerated(false)} className="text-sky-600 dark:text-nexus-blue font-black uppercase tracking-widest text-xs">Ajustar Filtros</button>
              </div>
            )}
          </div>

          <aside className="lg:col-span-3">
            <div className="lg:sticky lg:top-24 space-y-4">
              <div className="bg-white/80 dark:bg-nexus-card/80 backdrop-blur-md border border-neutral-200 dark:border-nexus-border rounded-2xl p-6 shadow-sm">
                <h3 className="text-[10px] font-black text-neutral-500 dark:text-nexus-text-sec uppercase tracking-[0.2em] mb-4 text-center">Progresso Local</h3>
                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <p className="text-[10px] text-emerald-600 dark:text-nexus-green font-bold uppercase">Acertos</p>
                    <p className="text-xl md:text-2xl font-black text-emerald-600 dark:text-nexus-green">{Object.values(sessionAnswers).filter(s => s === 'correct').length}</p>
                  </div>
                  <div className="h-10 w-px bg-neutral-200 dark:bg-nexus-border"></div>
                  <div className="text-center">
                    <p className="text-[10px] text-red-500 dark:text-rose-400 font-bold uppercase">Erros</p>
                    <p className="text-xl md:text-2xl font-black text-red-500 dark:text-rose-400">{Object.values(sessionAnswers).filter(s => s === 'incorrect').length}</p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  if (selectedModuleId) {
    return (
      <div className="max-w-[1000px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
        {isOverLimit && (
          <div className="absolute inset-0 z-40 bg-neutral-900/90 dark:bg-nexus-bg/90 backdrop-blur-md flex items-center justify-center p-6 text-center rounded-[2rem]">
            <div className="max-w-md">
              <div className="w-16 h-16 bg-sky-600/20 rounded-full flex items-center justify-center text-sky-600 dark:text-nexus-blue mx-auto mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              </div>
              <h3 className="text-2xl font-black text-neutral-900 dark:text-nexus-text-title mb-4">Limite Atingido</h3>
              <p className="text-neutral-500 dark:text-nexus-text-main mb-8 text-sm leading-relaxed">
                Você atingiu o limite de <span className="font-bold">10 conteúdos</span> do plano básico. Este limite não renova.
              </p>
              <button onClick={onNavigateToPremium} className="w-full bg-sky-600 hover:bg-sky-500 text-white font-black py-4 rounded-xl transition-all shadow-xl shadow-sky-600/20 uppercase tracking-widest text-xs">Conhecer Plano Premium</button>
            </div>
          </div>
        )}

        <button onClick={resetModule} className="mb-8 flex items-center gap-2 text-neutral-500 dark:text-nexus-text-sec hover:text-neutral-900 dark:hover:text-white transition-colors group">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-1 transition-transform"><path d="m15 18-6-6 6-6"/></svg>
          <span className="text-xs font-medium uppercase tracking-widest">Voltar para Grade</span>
        </button>

        <div className="bg-white dark:bg-nexus-card border border-neutral-200 dark:border-nexus-border p-6 md:p-16 rounded-[2rem] md:rounded-[3rem] shadow-sm relative overflow-hidden">
          <header className="mb-10 md:mb-12 text-center">
            <span className="text-[9px] md:text-[10px] font-black text-sky-600 dark:text-nexus-blue uppercase tracking-[0.3em] block mb-2">{ciclo}</span>
            <h2 className="text-2xl md:text-3xl font-black text-neutral-900 dark:text-nexus-text-title tracking-tighter px-2">{moduloTitle}</h2>
            
            {selectedModuleId === 7 && (
              <div className="mt-8 space-y-3 px-2">
                <div className="flex flex-col sm:flex-row justify-center gap-3">
                  <button 
                    onClick={handleDownloadM7Apostila}
                    disabled={exporting}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-neutral-900 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-black px-6 py-3 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all shadow-md disabled:opacity-50"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    {exporting ? 'Gerando...' : 'Apostila PDF (50 Q)'}
                  </button>

                  <button 
                    onClick={handleDownloadExtraM7}
                    disabled={exporting}
                    className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all shadow-md disabled:opacity-50 ${userStats?.isPremium ? 'bg-sky-600 hover:bg-sky-500 text-white' : 'bg-neutral-100 dark:bg-nexus-surface text-neutral-500 border border-neutral-200 dark:border-nexus-border'}`}
                  >
                    {!userStats?.isPremium ? (
                       <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    ) : (
                       <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    )}
                    {exporting ? 'Gerando...' : 'Questões Extras'}
                  </button>
                </div>
              </div>
            )}
          </header>

          <div className="space-y-8 md:space-y-10">
            <section>
              <label className="block text-[10px] font-black text-neutral-500 dark:text-nexus-text-label uppercase tracking-[0.2em] mb-4">Quantidade de Questões</label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 md:gap-3">
                {['5', '10', '20', '30', 'Todas'].map((q) => (
                  <button key={q} onClick={() => setQuantidade(q)} className={`py-3 md:py-4 rounded-xl border text-[10px] md:text-xs font-black transition-all uppercase tracking-widest ${quantidade === q ? 'bg-sky-600 border-sky-600 text-white shadow-md' : 'bg-neutral-50 dark:bg-nexus-surface border-neutral-200 dark:border-nexus-border text-neutral-500 hover:border-neutral-300 dark:hover:border-nexus-hover'}`}>
                    {q}
                  </button>
                ))}
              </div>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black text-neutral-500 dark:text-nexus-text-label uppercase tracking-widest mb-3">Modalidade</label>
                <select value={modalidade} onChange={(e) => setModalidade(e.target.value)} className="w-full bg-neutral-50 dark:bg-nexus-surface border border-neutral-200 dark:border-nexus-border rounded-xl py-3 md:py-4 px-4 md:px-6 text-xs md:text-sm text-neutral-900 dark:text-nexus-text-main focus:border-sky-600 dark:focus:border-nexus-blue outline-none cursor-pointer">
                  <option value="Todos">Todas as modalidades</option>
                  <option value="PBL">Tutoria / PBL</option>
                  <option value="Morfofuncional">Morfofuncional</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-neutral-500 dark:text-nexus-text-label uppercase tracking-widest mb-3">Problema</label>
                <select value={problema} onChange={(e) => setProblema(e.target.value)} className="w-full bg-neutral-50 dark:bg-nexus-surface border border-neutral-200 dark:border-nexus-border rounded-xl py-3 md:py-4 px-4 md:px-6 text-xs md:text-sm text-neutral-900 dark:text-nexus-text-main focus:border-sky-600 dark:focus:border-nexus-blue outline-none cursor-pointer">
                  <option value="Todos">Todos os problemas</option>
                  {[1,2,3,4,5,6].map(n => <option key={n} value={n.toString()}>Problema {n}</option>)}
                </select>
              </div>
            </section>

            <section>
              <label className="block text-[10px] font-black text-neutral-500 dark:text-nexus-text-label uppercase tracking-widest mb-3">Palavra-chave do Tema</label>
              <input type="text" placeholder="Ex: Anatomia, Fisiologia..." className="w-full bg-neutral-50 dark:bg-nexus-surface border border-neutral-200 dark:border-nexus-border rounded-xl py-3 md:py-4 px-6 md:px-8 text-xs md:text-sm text-neutral-900 dark:text-nexus-text-main focus:border-sky-600 dark:focus:border-nexus-blue outline-none placeholder:text-neutral-400 dark:placeholder:text-nexus-text-label" value={tema} onChange={(e) => setTema(e.target.value)} />
            </section>

            <div className="pt-6 border-t border-neutral-200 dark:border-nexus-border">
              <button onClick={handleGenerate} disabled={isOverLimit} className="w-full bg-sky-600 hover:bg-sky-500 text-white font-black py-4 md:py-6 rounded-2xl transition-all shadow-xl shadow-sky-600/20 text-sm md:text-lg uppercase tracking-widest flex flex-col md:flex-row items-center justify-center gap-2 md:gap-3 disabled:opacity-50">
                <span>Iniciar Prática</span>
                <span className="bg-white/10 text-[9px] md:text-[10px] px-3 py-1 rounded-full border border-white/10 font-bold opacity-80">
                  {filteredQuestions.length} questões
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1800px] mx-auto px-0 md:px-4 pb-32 animate-in fade-in duration-500">
      {/* Bloco Continuar Estudando - Questões */}
      {questionsHistory.length > 0 && (
        <section className="max-w-[1800px] mx-auto px-4 md:px-8 mb-12 animate-in slide-in-from-top-4 duration-500">
          <h3 className="text-[10px] font-black text-neutral-500 dark:text-nexus-text-sec uppercase tracking-[0.4em] mb-4 flex items-center gap-4">
            Continuar Estudando – Questões <div className="h-px flex-grow bg-neutral-200 dark:bg-nexus-border"></div>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {questionsHistory.map((act) => (
              <div 
                key={act.id} 
                onClick={() => handleResumeActivity(act)}
                className="bg-white dark:bg-nexus-card border border-neutral-200 dark:border-nexus-border p-4 rounded-2xl cursor-pointer hover:border-sky-500 dark:hover:border-nexus-blue transition-all flex items-center gap-4 group shadow-sm"
              >
                <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-nexus-surface flex items-center justify-center text-sm group-hover:bg-sky-600/10 group-hover:text-sky-500 dark:group-hover:text-nexus-blue transition-all shrink-0 text-sky-600 dark:text-nexus-blue border border-neutral-200 dark:border-nexus-border">
                  ❓
                </div>
                <div className="min-w-0">
                  <h5 className="text-xs font-bold text-neutral-900 dark:text-nexus-text-main truncate">{act.title}</h5>
                  <span className="text-[9px] text-neutral-500 dark:text-nexus-text-sec uppercase tracking-widest font-black">{act.subtitle}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <header className="mb-10 md:mb-16 px-4">
        <h2 className="text-4xl md:text-6xl font-black text-neutral-900 dark:text-nexus-text-title mb-4 md:mb-6 tracking-tighter italic">Questões</h2>
        <p className="text-neutral-500 dark:text-nexus-text-main text-lg md:text-2xl font-light max-w-4xl leading-relaxed">Selecione um módulo para praticar questões baseadas no método PBL e morfofuncional.</p>
      </header>

      <div className="space-y-12 md:space-y-16 px-4">
        <section>
          <h3 className="text-[10px] font-black text-sky-600 dark:text-nexus-blue uppercase tracking-[0.4em] mb-6 flex items-center gap-4">
             Ciclo Básico <div className="h-px flex-grow bg-sky-600/20 dark:bg-nexus-blue/20"></div>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6">
            {modulesBasico.map((m) => (
              <div key={m.id} onClick={() => handleModuleSelect(m, 'Ciclo Básico')} className={`bg-white dark:bg-nexus-card border border-neutral-200 dark:border-nexus-border border-l-4 ${m.color.replace('border-blue-500', 'border-l-sky-500 dark:border-l-nexus-blue')} p-6 md:p-8 rounded-2xl md:rounded-3xl cursor-pointer hover:bg-neutral-50 dark:hover:bg-nexus-hover hover:-translate-y-1 transition-all flex flex-col justify-between h-44 md:h-52 group shadow-sm`}>
                <span className="text-[9px] md:text-[10px] font-black text-sky-600 dark:text-nexus-blue uppercase tracking-widest">ASE {m.id}</span>
                <h4 className="text-base md:text-lg font-bold text-neutral-900 dark:text-nexus-text-main leading-tight group-hover:text-sky-600 dark:group-hover:text-nexus-text-title transition-colors">{m.title}</h4>
                <span className="text-[9px] md:text-[10px] font-bold uppercase text-neutral-400 dark:text-nexus-text-sec group-hover:text-sky-600 dark:group-hover:text-nexus-blue transition-colors">Praticar Questões →</span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] mb-6 flex items-center gap-4">
             Ciclo Clínico <div className="h-px flex-grow bg-indigo-500/20"></div>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6">
            {modulesClinico.map((m) => (
              <div key={m.id} onClick={() => handleModuleSelect(m, 'Ciclo Clínico')} className={`bg-white dark:bg-nexus-card border border-neutral-200 dark:border-nexus-border border-l-4 border-l-indigo-500 p-6 md:p-8 rounded-2xl md:rounded-3xl cursor-pointer hover:bg-neutral-50 dark:hover:bg-nexus-hover hover:-translate-y-1 transition-all flex flex-col justify-between h-44 md:h-52 group shadow-sm`}>
                <span className="text-[9px] md:text-[10px] font-black text-indigo-500 uppercase tracking-widest">ASE {m.id}</span>
                <h4 className="text-base md:text-lg font-bold text-neutral-900 dark:text-nexus-text-main leading-tight group-hover:text-indigo-600 dark:group-hover:text-nexus-text-title transition-colors">{m.title}</h4>
                <span className="text-[9px] md:text-[10px] font-bold uppercase text-neutral-400 dark:text-nexus-text-sec group-hover:text-indigo-500 transition-colors">Praticar Questões →</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default QuestionsView;
