
import React, { useState, useRef } from 'react';
import { UserStats } from '../types';
import { GoogleGenAI } from "@google/genai";

interface AdminAcademiaGenProps {
  user: UserStats;
}

type MenuType = 'ebook' | 'slides' | 'manual';
type InputMode = 'theme' | 'source';

interface GeneratedBlock {
  label: string;
  content: string;
}

const AdminAcademiaGen: React.FC<AdminAcademiaGenProps> = ({ user }) => {
  // Verificação de permissão obrigatória
  if (!user || user.adm !== true) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-nexus-bg rounded-[2.5rem] border border-nexus-border p-10">
        <div className="text-center">
          <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Acesso Restrito</h2>
          <p className="text-neutral-500 text-sm mt-2">Área exclusiva para administradores Nexus.</p>
        </div>
      </div>
    );
  }

  const [activeMenu, setActiveMenu] = useState<MenuType>('ebook');
  const [inputMode, setInputMode] = useState<InputMode>('theme');
  const [isGenerating, setIsGenerating] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("");
  const [generatedBlocks, setGeneratedBlocks] = useState<GeneratedBlock[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Estados dos formulários
  const [formEbook, setFormEbook] = useState({ title: '', theme: '', pages: 5, style: 'Didático' });
  const [formSlides, setFormSlides] = useState({ theme: '', slides: 10, style: 'Científico' });
  const [formManual, setFormManual] = useState({ theme: '', pages: 3 });
  
  // Estados para Fonte Externa
  const [sourceText, setSourceText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Lógica de Fragmentação (Chunking) ---
  const splitTextIntoChunks = (text: string, maxLength: number = 8000): string[] => {
    const chunks: string[] = [];
    let currentPos = 0;

    while (currentPos < text.length) {
      let endPos = currentPos + maxLength;
      if (endPos >= text.length) {
        chunks.push(text.substring(currentPos));
        break;
      }

      // Tenta quebrar em parágrafos ou pontos finais para não cortar frases
      const lastParagraph = text.lastIndexOf('\n\n', endPos);
      const lastSentence = text.lastIndexOf('. ', endPos);
      
      const bestBreak = lastParagraph > currentPos + (maxLength * 0.5) ? lastParagraph : 
                        lastSentence > currentPos + (maxLength * 0.5) ? lastSentence : endPos;

      chunks.push(text.substring(currentPos, bestBreak).trim());
      currentPos = bestBreak;
    }
    return chunks;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.endsWith('.pdf') || file.name.endsWith('.docx')) {
      alert("Suporte direto a PDF/DOCX em desenvolvimento. Por favor, cole o texto manualmente ou use arquivos .txt");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setSourceText(content);
    };
    reader.readAsText(file);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsGenerating(true);
    setGeneratedBlocks([]);
    setProcessingStatus("Iniciando motor Nexus...");

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      let contextContent = "";

      // Se for modo de Fonte Externa, processar o texto antes
      if (inputMode === 'source') {
        if (!sourceText.trim()) throw new Error("A fonte de texto está vazia.");
        
        const chunks = splitTextIntoChunks(sourceText);
        
        if (chunks.length > 1) {
          let summaries: string[] = [];
          for (let i = 0; i < chunks.length; i++) {
            setProcessingStatus(`Analisando fragmento ${i + 1} de ${chunks.length}...`);
            const summaryResp = await ai.models.generateContent({
              model: 'gemini-3-flash-preview',
              contents: [{ role: 'user', parts: [{ text: `Resuma tecnicamente este fragmento de aula/material médico preservando todos os termos técnicos, dosagens e diretrizes clínicas: \n\n ${chunks[i]}` }] }],
            });
            summaries.push(summaryResp.text || "");
          }
          setProcessingStatus("Consolidando inteligência...");
          contextContent = summaries.join("\n\n");
        } else {
          contextContent = sourceText;
        }
      }

      // Montar prompt final
      setProcessingStatus("Gerando material didático final...");
      let finalPrompt = "";
      const baseInstructions = inputMode === 'source' 
        ? `Reestruture e transforme o seguinte conteúdo médico em um formato didático organizado. Mantenha o rigor técnico da fonte.` 
        : `Aja como um especialista em educação médica e PBL. Gere um conteúdo original e profundo.`;

      if (activeMenu === 'ebook') {
        finalPrompt = `${baseInstructions} 
        TIPO: Ebook intitulado "${formEbook.title}" sobre "${formEbook.theme || 'Conteúdo em anexo'}". 
        Estilo: ${formEbook.style}. Páginas: ${formEbook.pages}.
        REGRAS: Inicie cada página com: --- PÁGINA X ---.
        CONTEÚDO BASE: ${contextContent}`;
      } else if (activeMenu === 'slides') {
        finalPrompt = `${baseInstructions} 
        TIPO: Apresentação de slides sobre "${formSlides.theme || 'Conteúdo em anexo'}". 
        Tom: ${formSlides.style}. Slides: ${formSlides.slides}.
        REGRAS: Inicie cada slide com: --- SLIDE X ---. Inclua Título, Bullets e Notas de Orador.
        CONTEÚDO BASE: ${contextContent}`;
      } else {
        finalPrompt = `${baseInstructions} 
        TIPO: Apostila Técnica PBL sobre "${formManual.theme || 'Conteúdo em anexo'}". 
        Páginas: ${formManual.pages}.
        REGRAS: Inicie com --- PÁGINA X ---. Inclua Explicação, Resumo Nexus e 3 Questões com gabarito.
        CONTEÚDO BASE: ${contextContent}`;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ role: 'user', parts: [{ text: finalPrompt }] }],
      });

      const text = response.text || "";
      const delimiterRegex = /--- (?:PÁGINA|SLIDE) \d+ ---/g;
      const markers = text.match(delimiterRegex) || [];
      const contents = text.split(delimiterRegex).filter(c => c.trim().length > 0);

      const parsedBlocks = markers.map((marker, index) => ({
        label: marker.replace(/---/g, '').trim(),
        content: contents[index] || ""
      }));

      setGeneratedBlocks(parsedBlocks);
    } catch (err: any) {
      console.error("Erro Nexus GenIA:", err);
      setError(err.message || "Falha na comunicação com o Nexus GenIA.");
    } finally {
      setIsGenerating(false);
      setProcessingStatus("");
    }
  };

  const menuItems = [
    { id: 'ebook', label: 'Criar Ebook', icon: '📖' },
    { id: 'slides', label: 'Criar Apresentação', icon: '🖼️' },
    { id: 'manual', label: 'Criar Apostila', icon: '📝' },
  ] as const;

  return (
    <div className="flex flex-col lg:flex-row min-h-[800px] bg-nexus-bg rounded-[2.5rem] border border-nexus-border overflow-hidden shadow-2xl animate-in fade-in duration-500">
      
      {/* COLUNA 1: MENU INTERNO */}
      <aside className="w-full lg:w-64 bg-nexus-surface border-r border-nexus-border p-6 shrink-0 flex flex-col">
        <div className="mb-10">
          <h3 className="text-[10px] font-black text-nexus-blue uppercase tracking-[0.2em] mb-4">Academia GenIA</h3>
          <p className="text-xs text-neutral-500 font-medium">Motor híbrido de inteligência e processamento.</p>
        </div>
        
        <nav className="space-y-2 flex-grow">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveMenu(item.id); setGeneratedBlocks([]); setError(null); }}
              className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                activeMenu === item.id 
                  ? 'bg-nexus-blue text-black shadow-lg shadow-nexus-blue/20' 
                  : 'text-neutral-500 hover:text-white hover:bg-nexus-hover'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-nexus-border/50">
           <div className="p-4 bg-nexus-bg/50 rounded-2xl border border-nexus-border">
              <p className="text-[9px] font-black text-neutral-600 uppercase tracking-widest leading-relaxed">
                Suporte a textos de até 50.000 caracteres via pipeline.
              </p>
           </div>
        </div>
      </aside>

      {/* COLUNA 2: FORMULÁRIO DINÂMICO */}
      <main className="flex-grow p-8 md:p-12 bg-nexus-bg border-r border-nexus-border/30 overflow-y-auto no-scrollbar">
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Pipeline de Produção</span>
            <span className="w-1 h-1 bg-neutral-700 rounded-full"></span>
            <span className="text-[10px] font-black text-nexus-blue uppercase tracking-widest">Nexus Pro v4.2</span>
          </div>
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">
            {activeMenu === 'ebook' && 'Estruturador de Ebooks'}
            {activeMenu === 'slides' && 'Gerador de Apresentações'}
            {activeMenu === 'manual' && 'Compilador de Apostilas'}
          </h2>
        </header>

        {/* MODO DE ENTRADA */}
        <div className="mb-10 p-1.5 bg-nexus-surface rounded-2xl border border-nexus-border w-fit flex gap-1">
          <button 
            onClick={() => setInputMode('theme')}
            className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${inputMode === 'theme' ? 'bg-nexus-bg text-nexus-blue border border-nexus-border shadow-sm' : 'text-neutral-500 hover:text-white'}`}
          >
            IA Criativa (Tema)
          </button>
          <button 
            onClick={() => setInputMode('source')}
            className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${inputMode === 'source' ? 'bg-nexus-bg text-nexus-blue border border-nexus-border shadow-sm' : 'text-neutral-500 hover:text-white'}`}
          >
            IA Refinadora (Texto/Arquivo)
          </button>
        </div>

        <form onSubmit={handleGenerate} className="space-y-8 animate-in slide-in-from-bottom-2 duration-300">
          
          {inputMode === 'theme' ? (
             <div className="space-y-6">
                {activeMenu === 'ebook' && (
                  <div className="space-y-4">
                    <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1">Título da Obra</label>
                    <input type="text" value={formEbook.title} onChange={e => setFormEbook({...formEbook, title: e.target.value})} placeholder="Ex: Farmacologia das Estatinas" className="w-full bg-nexus-surface border border-nexus-border rounded-2xl py-4 px-6 text-white text-sm focus:border-nexus-blue outline-none transition-all placeholder:text-neutral-700" />
                    <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1 mt-6">Tema Detalhado</label>
                    <input type="text" value={formEbook.theme} onChange={e => setFormEbook({...formEbook, theme: e.target.value})} placeholder="Ex: Indicações e efeitos colaterais no idoso" className="w-full bg-nexus-surface border border-nexus-border rounded-2xl py-4 px-6 text-white text-sm focus:border-nexus-blue outline-none transition-all placeholder:text-neutral-700" />
                  </div>
                )}
                {activeMenu === 'slides' && (
                  <div className="space-y-4">
                    <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1">Tema da Aula</label>
                    <input type="text" value={formSlides.theme} onChange={e => setFormSlides({...formSlides, theme: e.target.value})} placeholder="Ex: Semiologia do Pulmão" className="w-full bg-nexus-surface border border-nexus-border rounded-2xl py-4 px-6 text-white text-sm focus:border-nexus-blue outline-none transition-all placeholder:text-neutral-700" />
                  </div>
                )}
                {activeMenu === 'manual' && (
                  <div className="space-y-4">
                    <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1">Título da Apostila PBL</label>
                    <input type="text" value={formManual.theme} onChange={e => setFormManual({...formManual, theme: e.target.value})} placeholder="Ex: Roteiro de Anatomia: Med 1" className="w-full bg-nexus-surface border border-nexus-border rounded-2xl py-4 px-6 text-white text-sm focus:border-nexus-blue outline-none transition-all placeholder:text-neutral-700" />
                  </div>
                )}
             </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1">Fonte Bruta de Conteúdo</label>
                <textarea 
                  rows={8}
                  value={sourceText}
                  onChange={e => setSourceText(e.target.value)}
                  placeholder="Cole aqui transcrições de aulas, anotações de livros ou textos de artigos para que a IA os reestruture..."
                  className="w-full bg-nexus-surface border border-nexus-border rounded-2xl py-5 px-6 text-white text-xs leading-relaxed focus:border-nexus-blue outline-none transition-all placeholder:text-neutral-700 resize-none"
                />
              </div>
              <div className="flex items-center gap-4">
                 <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-5 py-3 bg-neutral-900 border border-nexus-border rounded-xl text-[10px] font-black uppercase text-neutral-400 hover:text-white transition-all"
                 >
                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                   Anexar .txt
                 </button>
                 <input ref={fileInputRef} type="file" accept=".txt" className="hidden" onChange={handleFileUpload} />
                 <p className="text-[9px] text-neutral-600 font-bold uppercase italic">Formatos PDF/DOCX devem ser colados manualmente por enquanto.</p>
              </div>
            </div>
          )}

          {/* CONFIGURAÇÕES DE DIMENSÃO */}
          <div className="grid grid-cols-2 gap-6 border-t border-nexus-border/30 pt-8">
            <div className="space-y-4">
              <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1">Extensão do Material</label>
              <input 
                type="number" 
                min="1" max="20"
                value={activeMenu === 'ebook' ? formEbook.pages : activeMenu === 'slides' ? formSlides.slides : formManual.pages}
                onChange={e => {
                  const val = parseInt(e.target.value) || 1;
                  if (activeMenu === 'ebook') setFormEbook({...formEbook, pages: Math.min(20, val)});
                  if (activeMenu === 'slides') setFormSlides({...formSlides, slides: Math.min(20, val)});
                  if (activeMenu === 'manual') setFormManual({...formManual, pages: Math.min(20, val)});
                }}
                className="w-full bg-nexus-surface border border-nexus-border rounded-2xl py-4 px-6 text-white text-sm focus:border-nexus-blue outline-none transition-all"
              />
              <p className="text-[9px] text-neutral-600 font-medium italic">Qtd de {activeMenu === 'slides' ? 'slides' : 'páginas'} sugerida.</p>
            </div>
            <div className="space-y-4">
              <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1">Estilo de Redação</label>
              <select 
                className="w-full bg-nexus-surface border border-nexus-border rounded-2xl py-4 px-6 text-white text-sm focus:border-nexus-blue outline-none transition-all"
                onChange={e => {
                  if (activeMenu === 'ebook') setFormEbook({...formEbook, style: e.target.value});
                  if (activeMenu === 'slides') setFormSlides({...formSlides, style: e.target.value});
                }}
              >
                <option>Didático / Graduação</option>
                <option>Científico / Pós-Graduação</option>
                <option>Resumido / Flashcard Style</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3">
              <span className="text-lg">⚠️</span>
              <p className="text-xs text-rose-500 font-bold">{error}</p>
            </div>
          )}

          <button 
            type="submit"
            disabled={isGenerating}
            className="w-full bg-white text-black hover:bg-neutral-200 font-black py-5 rounded-2xl text-[10px] uppercase tracking-[0.3em] transition-all shadow-xl active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin h-4 w-4 text-black" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {processingStatus || 'Processando via Gemini...'}
              </>
            ) : (
              `Executar Geração ${inputMode === 'source' ? 'por Refinamento' : 'por Tema'}`
            )}
          </button>
        </form>
      </main>

      {/* COLUNA 3: PREVIEW */}
      <aside className="w-full lg:w-[500px] bg-nexus-surface p-8 shrink-0 flex flex-col">
        <h3 className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-6">Console de Visualização</h3>
        
        <div className="flex-grow border-2 border-dashed border-nexus-border rounded-[2rem] bg-nexus-bg/30 p-6 overflow-y-auto no-scrollbar relative">
          {isGenerating ? (
            <div className="h-full flex flex-col items-center justify-center text-center animate-pulse">
               <div className="w-12 h-12 bg-blue-600/20 text-blue-600 rounded-full flex items-center justify-center mb-4 text-xl">🧬</div>
               <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{processingStatus}</p>
               <p className="text-[9px] text-neutral-600 mt-2 max-w-[200px]">A IA está processando os fragmentos de texto fornecidos para garantir fidelidade técnica.</p>
            </div>
          ) : generatedBlocks.length > 0 ? (
            <div className="animate-in fade-in zoom-in duration-500 space-y-6">
               <div className="pb-4 border-b border-nexus-border flex items-center justify-between">
                 <div>
                   <span className="text-[9px] font-black text-nexus-blue uppercase tracking-widest bg-nexus-blue/10 px-2 py-0.5 rounded">Processamento Concluído</span>
                   <h4 className="text-lg font-black text-white mt-1 leading-tight">Material Reestruturado</h4>
                 </div>
                 <button className="p-2 bg-nexus-surface hover:bg-neutral-800 rounded-lg text-neutral-400 border border-nexus-border transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                 </button>
               </div>
               
               <div className="space-y-4">
                 {generatedBlocks.map((block, i) => (
                   <div key={i} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black text-neutral-600 uppercase bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">{block.label}</span>
                        <div className="h-px flex-grow bg-neutral-900"></div>
                      </div>
                      <div className="p-5 bg-nexus-surface border border-nexus-border rounded-2xl group relative overflow-hidden">
                         <div className="text-[11px] text-neutral-300 font-medium leading-[1.8] whitespace-pre-wrap selection:bg-blue-500/30">
                           {block.content.trim()}
                         </div>
                         <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[8px] font-black text-blue-500 uppercase bg-blue-500/10 px-1.5 py-0.5 rounded">Copiar</span>
                         </div>
                      </div>
                   </div>
                 ))}
               </div>

               <button className="w-full mt-6 bg-blue-600 text-white py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20">
                 Publicar na Grade Nexus
               </button>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 bg-neutral-900 border border-nexus-border rounded-2xl flex items-center justify-center text-neutral-700 mb-4">
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
              </div>
              <p className="text-xs font-bold text-neutral-600 uppercase tracking-widest leading-relaxed px-4">
                Aguardando entrada de dados para iniciar o pipeline de geração.
              </p>
            </div>
          )}
        </div>
      </aside>

    </div>
  );
};

export default AdminAcademiaGen;
