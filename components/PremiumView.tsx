
import React, { useState, useMemo, useRef } from 'react';
import { UserStats, VideoLesson, LastWatched, ActivityItem } from '../types';
import { db, auth } from '../lib/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

interface PremiumViewProps {
  userStats: UserStats;
  onAddActivity: (item: any) => void;
  onAwardPoints?: (id: string, value?: number) => void;
  onIncrementUsage?: (contentId: string) => void;
}

const BRAND_COLOR = "#00BFA6"; 
const VEST_COLOR = "#F43F5E";  
const MEDCOF_COLOR = "#ef4444"; 
const MEDCURSO_COLOR = "#38BDF8";

const SPECIALTY_THEMES: Record<string, { img: string; icon: string; accent: string; desc: string; gradient: string }> = {
  "Pediatria 1": { 
    img: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=800",
    icon: "👶", accent: "#00A3FF", desc: "Neonatologia e desenvolvimento infantil.", gradient: "from-blue-600 to-cyan-400"
  },
  "Clínica Médica": { 
    img: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=800",
    icon: "🩺", accent: "#3B82F6", desc: "Grandes temas da medicina interna.", gradient: "from-blue-700 to-indigo-500"
  },
  "Ginecologia e Obstetrícia": { 
    img: "https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&q=80&w=800",
    icon: "🤰", accent: "#FF2E5F", desc: "Saúde da mulher e ciclo gravídico.", gradient: "from-rose-600 to-red-400"
  },
  "Cirurgia": { 
    img: "https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&q=80&w=800",
    icon: "🔪", accent: "#10B981", desc: "Técnica operatória e trauma.", gradient: "from-emerald-600 to-teal-400"
  },
  "Preventiva": { 
    img: "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&q=80&w=800",
    icon: "📊", accent: "#8B5CF6", desc: "Epidemiologia, ética e SUS.", gradient: "from-purple-600 to-violet-400"
  },
  "Hematologia": { 
    img: "https://images.unsplash.com/photo-1631815587646-b85a1bb027e1?auto=format&fit=crop&q=80&w=800",
    icon: "🩸", accent: "#ef4444", desc: "Anemias, leucemias, linfomas, mieloma e hemostasia.", gradient: "from-red-700 to-rose-500"
  },
  "Extensivo": { 
    img: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=800",
    icon: "📚", accent: "#EF4444", desc: "Preparação completa de alto desempenho.", gradient: "from-red-600 to-orange-500"
  },
  "Reprodução Humana": { 
    img: "https://images.unsplash.com/photo-1579152276508-498c8c22252a?auto=format&fit=crop&q=80&w=800",
    icon: "🧬", accent: "#F43F5E", desc: "Gametogênese e fertilização.", gradient: "from-rose-500 to-pink-400"
  }
};

const HEMATOLOGIA_LESSONS: (VideoLesson & { duration: string; block: string })[] = [
  { id: 'ihsoMziMuQk', title: 'Abordagem Inicial da Anemia', duration: '18:40', block: '🔴 HEMATOLOGIA I — ANEMIAS' },
  { id: 'NMymZUam5bU', title: 'Anemia de Doença Crônica', duration: '15:20', block: '🔴 HEMATOLOGIA I — ANEMIAS' },
  { id: 'p6smbJ03oA8', title: 'Anemia Ferropriva', duration: '22:15', block: '🔴 HEMATOLOGIA I — ANEMIAS' },
  { id: 'RlR8wl0DyGE', title: 'Anemia Megaloblástica', duration: '19:30', block: '🔴 HEMATOLOGIA I — ANEMIAS' },
  { id: 'TBktA-sm5Is', title: 'Anemias Hemolíticas — Parte 1', duration: '25:10', block: '🔴 HEMATOLOGIA I — ANEMIAS' },
  { id: 'qbOF7LzuzUU', title: 'Anemias Hemolíticas — Parte 2', duration: '24:45', block: '🔴 HEMATOLOGIA I — ANEMIAS' },
  { id: 'gxT4eQAZZNs', title: 'Introdução às Leucemias', duration: '12:50', block: '🟣 HEMATOLOGIA II — DOENÇAS NEOPLÁSICAS' },
  { id: 'KsIXu3iTPS0', title: 'Leucemia Linfoide Aguda', duration: '20:05', block: '🟣 HEMATOLOGIA II — DOENÇAS NEOPLÁSICAS' },
  { id: 'meAIZneoEmo', title: 'Leucemia Linfoide Crônica', duration: '18:30', block: '🟣 HEMATOLOGIA II — DOENÇAS NEOPLÁSICAS' },
  { id: 'pf7Pu2PZUlU', title: 'Leucemia Mieloide Aguda', duration: '21:15', block: '🟣 HEMATOLOGIA II — DOENÇAS NEOPLÁSICAS' },
  { id: 'MacxmFyY4sw', title: 'Leucemia Mieloide Crônica', duration: '19:40', block: '🟣 HEMATOLOGIA II — DOENÇAS NEOPLÁSICAS' },
  { id: 'E9P8JjVruMM', title: 'Leucemias Agudas', duration: '26:20', block: '🟣 HEMATOLOGIA II — DOENÇAS NEOPLÁSICAS' },
  { id: 'RUTDF07ITq4', title: 'Leucemias Crônicas', duration: '24:10', block: '🟣 HEMATOLOGIA II — DOENÇAS NEOPLÁSICAS' },
  { id: 'jqHQYZCCfww', title: 'Linfomas', duration: '30:00', block: '🟣 HEMATOLOGIA II — DOENÇAS NEOPLÁSICAS' },
  { id: 'zIMygSaGF8w', title: 'Mieloma', duration: '22:35', block: '🟣 HEMATOLOGIA II — DOENÇAS NEOPLÁSICAS' },
  { id: 'TW2sdKHi6dI', title: 'Hemostasia — Bloco 2', duration: '28:50', block: '🟣 HEMATOLOGIA II — DOENÇAS NEOPLÁSICAS' },
];

const EMBRIOLOGIA_LESSONS: (VideoLesson & { duration: string })[] = [
  { id: 'O9YsUhCQv64', title: 'Fecundação', duration: '12:45' },
  { id: 'tMXgjHq61wQ', title: 'Gametogênese', duration: '15:20' },
  { id: '-iuWA5CQCMI', title: 'Zigoto e Blastocisto', duration: '10:15' },
  { id: 'i29YGecX9UQ', title: 'Âmnio e Celoma', duration: '14:30' },
  { id: 'HbQ8Zpex0AA', title: 'Córion', duration: '08:50' },
  { id: 'HVVclowB9qI', title: 'Gastrulação', duration: '18:10' },
  { id: 'XUD3IUNK7Vk', title: 'Notocorda e Tubo Neural', duration: '11:25' },
  { id: '7rYQMJzQoYg', title: 'Somitos, Celoma Intra e Sistema Cardiovascular', duration: '22:05' },
  { id: 'iu5VjWLLoKU', title: 'Organogênese e Dobramento do Embrião', duration: '16:40' },
  { id: 'tSqOhvdTDnc', title: 'Embriologia da 4ª à 8ª Semana', duration: '13:15' },
  { id: 'aFEVmlbJ708', title: 'Embriologia da 9ª Semana ao Nascimento', duration: '09:55' },
  { id: 'L2IZEut6Yok', title: 'Cavidades do Corpo Embrionário', duration: '11:45' },
  { id: 'CeDWt2Qg3UE', title: 'Desenvolvimento do Diafragma', duration: '07:30' },
  { id: 'WEzfPk3OJ9o', title: 'Aparelho Faríngeo (Arcos e Derivados)', duration: '19:20' },
  { id: 'Wxo8xMksxiU', title: 'Aparelho Faríngeo (Bolsas, Sulcos e Membranas)', duration: '15:50' },
  { id: 'axyh2MK-XDU', title: 'Embriologia do Pescoço', duration: '12:10' },
  { id: 'fnJnYip6qWA', title: 'Primórdio Respiratório e Faringe', duration: '14:05' },
  { id: 'iExD4xImT24', title: 'Embriologia da Face', duration: '17:35' },
  { id: 'xQO9_OJmuCI', title: 'Embriologia do Palato', duration: '10:40' },
  { id: '7ydEZDWXWmg', title: 'Maturação Pulmonar', duration: '08:25' },
  { id: 'a3zj8iowhJ8', title: 'Membranas Fetais', duration: '13:50' },
  { id: 'f2k4ng4kLzQ', title: 'Traqueia, Brônquios e Pulmões', duration: '11:15' },
  { id: 'IqL5Icry-ZQ', title: 'Intestino Anterior (Bolsa Omental e Duodeno)', duration: '14:25' },
  { id: 'V3gyiEpoEXA', title: 'Intestino Anterior (Fígado e Sistema Biliar)', duration: '16:05' },
  { id: 'D4GpR1-IJ5M', title: 'Intestino Anterior (Pâncreas e Baço)', duration: '12:50' },
  { id: 'BbYOX4kR3vc', title: 'Placenta', duration: '15:15' },
  { id: 'kDNHoeo5Yio', title: 'Intestino Anterior (Esôfago e Estômago)', duration: '13:30' },
  { id: 'MvR0FbqGD_Y', title: 'Intestino Médio (Herniação e Rotação)', duration: '18:45' },
  { id: 'XU-voGzqC_c', title: 'Intestino Médio (Ceco e Apêndice)', duration: '10:10' },
  { id: 'kCVHiNzogbI', title: 'Intestino Posterior e Cloaca', duration: '12:20' },
  { id: 'Tow8vrGpf6A', title: 'Sistema Urinário (Bexiga e Defeitos)', duration: '16:55' },
  { id: 'Sb62GtZf0LY', title: 'Sistema Genital (Gônadas Indiferenciadas)', duration: '20:10' },
  { id: '8ivU4plbcUw', title: 'Desenvolvimento do Coração e Vasos', duration: '25:30' },
];

const REPRODUCAO_HUMANA_LESSONS: (VideoLesson & { duration: string })[] = [
  { id: 'x3PuKN0TK7Q', title: 'Gametogênese – Espermatogênese', duration: '15:40' },
  { id: '02qzFxym5wg', title: 'Gametogênese – Ovogênese', duration: '14:20' },
  { id: 'TmUPeZcs_Fo', title: 'Gametogênese – Diferenças entre Espermatogênese e Ovogênese', duration: '08:15' },
  { id: 'e_vuOHUhpYU', title: 'Gametogênese – Partenogênese', duration: '10:50' },
  { id: 'gRWG7Whisvo', title: 'Gametogênese – Tipos de Partenogênese', duration: '12:10' },
  { id: 'eidGIV69EbA', title: 'Gametogênese – Pedogênese e Neotenia', duration: '11:05' },
];

const PEDIATRIA_1_LESSONS: (VideoLesson & { duration: string; block: string; isBonus?: boolean })[] = [
  { id: '9Gvq0WceuPk', title: 'Introdução Neonatal', duration: '25:00', block: '1️⃣ NEONATOLOGIA – BASE' },
  { id: 'A4_sGTxXLjw', title: 'Reanimação Neonatal', duration: '30:00', block: '1️⃣ NEONATOLOGIA – BASE' },
  { id: 'sTxiSLpDjkU', title: 'Icterícia Neonatal', duration: '28:00', block: '1️⃣ NEONATOLOGIA – BASE' },
  { id: 'e3xEPYIujN0', title: 'Infecções Congênitas – Exposição', duration: '22:00', block: '2️⃣ INFECÇÕES CONGÊNITAS' },
  { id: 'CMXnFxqEcx8', title: 'Infecções Congênitas – Sífilis', duration: '24:00', block: '2️⃣ INFECÇÕES CONGÊNITAS' },
  { id: 'PRB9jAbbikQ', title: 'Infecções Congênitas – Outras', duration: '20:00', block: '2️⃣ INFECÇÕES CONGÊNITAS' },
  { id: '0wQ0uK3bDF4', title: 'Infecções Congênitas – Outras 2', duration: '18:00', block: '2️⃣ INFECÇÕES CONGÊNITAS' },
  { id: 'Z6IZ3pX43wE', title: 'Distúrbio Respiratório – Parte 1', duration: '15:00', block: '3️⃣ DISTÚRBIOS RESPIRATÓRIOS NEONATAIS' },
  { id: 'XGXe2_qYwP8', title: 'Distúrbio Respiratório – Parte 2', duration: '16:00', block: '3️⃣ DISTÚRBIOS RESPIRATÓRIOS NEONATAIS' },
  { id: 'HMB2JHyyH4s', title: 'Distúrbio Respiratório – Parte 3', duration: '14:00', block: '3️⃣ DISTÚRBIOS RESPIRATÓRIOS NEONATAIS' },
  { id: 'xXjKSU36Um4', title: 'Doenças Exantemáticas – Introdução', duration: '12:00', block: '4️⃣ DOENÇAS EXANTEMÁTICAS' },
  { id: '8pRZJsazvCs', title: 'Caso Clínico 01', duration: '10:00', block: '4️⃣ DOENÇAS EXANTEMÁTICAS' },
  { id: 'kPI3lzbKkoo', title: 'Caso Clínico 02', duration: '11:00', block: '4️⃣ DOENÇAS EXANTEMÁTICAS' },
  { id: '6du-1JJd8rQ', title: 'Caso Clínico 03', duration: '09:00', block: '4️⃣ DOENÇAS EXANTEMÁTICAS' },
  { id: 'yWSWkqAAG1M', title: 'Caso Clínico 04', duration: '12:00', block: '4️⃣ DOENÇAS EXANTEMÁTICAS' },
  { id: 'i7SEn1c5pxE', title: 'Triagem Neonatal', duration: '42:00', block: '5️⃣ BÔNUS PED1', isBonus: true },
  { id: 'IDy-T2pE2Zg', title: 'O Exame Físico Neonatal', duration: '47:00', block: '5️⃣ BÔNUS PED1', isBonus: true },
  { id: 'jFq-l20Truw', title: 'Doenças do Trato Gastrointestinal', duration: '26:00', block: '5️⃣ BÔNUS PED1', isBonus: true },
  { id: 'Mv7SJ0_IoZQ', title: 'Miscelânea', duration: '52:00', block: '5️⃣ BÔNUS PED1', isBonus: true },
];

const SANARFLIX_COURSES = [
  "Anatomia do Sistema Locomotor", "Anatomia dos Órgãos e Sistemas", "Antibioticoterapia",
  "Atendimento Pré-Hospitalar", "Biofísica", "Biologia Molecular e Celular",
  "Bioquímica", "Eletrocardiograma (ECG)", "Embriologia", "Exames Laboratoriais",
  "Farmacologia", "Fisiologia", "Genética", "Histologia", "Microbiologia",
  "Neuroanatomia", "Parasitologia", "Patologia", "Primeiros Socorros",
  "Radiologia", "Semiologia", "Sistema Circulatório", "Sistema Digestório",
  "Sistema Endócrino", "Sistema Hematopoiético", "Sistema Imune", "Sistema Nervoso",
  "Sistema Reprodutor", "Sistema Respiratório", "Sistema Urinário e Renal", "Trauma"
];

const VEST_COURSES = [ "Reprodução Humana", "Embriologia Animal" ];
const MEDCOF_COURSES = [ "Extensivo", "Curso de Ultrassom – POCUS", "Desafios de Imagem", "Estações Multimídia", "Hands On – OSCE", "Medical Life Hacks", "RX" ];
const MEDCURSO_COURSES = [ "Pediatria 1", "Ginecologia e Obstetrícia", "Cirurgia", "Clínica Médica", "Hematologia", "Preventiva" ];

const PREMIUM_PLATFORMS = [
  { id: 'sanarflix', title: 'Sanarflix', category: 'official', description: 'Plataforma oficial Sanarflix.', image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=600' },
  { id: 'medcurso', title: 'Medcurso', category: 'official', description: 'Preparatório para Residência Médica.', image: 'https://medgrupo.com.br/wp-content/uploads/2024/03/medgrupo.png' },
  { id: 'medcof', title: 'MedCof', category: 'official', description: 'Elite em aprovação na residência médica.', image: 'https://www.grupomedcof.com.br/blog/wp-content/uploads/2024/10/Modelo-instituicoes-16.png' },
  { id: 'devoltavest', title: 'De Volta ao Vest', category: 'foundation', description: 'Fundamentos do vestibular.', image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=600' },
];

const PremiumView: React.FC<PremiumViewProps> = ({ userStats, onAddActivity, onAwardPoints, onIncrementUsage }) => {
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [activeVideo, setActiveVideo] = useState<VideoLesson | null>(null);
  
  const videoRef = useRef<HTMLIFrameElement>(null);
  const watchedVideos = userStats.watchedLessons || [];
  
  const accentColor = useMemo(() => {
    if (selectedPlatform === 'devoltavest') return VEST_COLOR;
    if (selectedPlatform === 'medcof') return MEDCOF_COLOR;
    if (selectedPlatform === 'medcurso') return MEDCURSO_COLOR;
    return BRAND_COLOR;
  }, [selectedPlatform]);

  const premiumHistory = useMemo(() => 
    (userStats.recentActivity || [])
      .filter(a => a.type === 'aula' && a.metadata && a.metadata.platformId)
      .slice(0, 8),
  [userStats.recentActivity]);

  const handleResumeActivity = (act: any) => {
    if (act.metadata) {
      setSelectedPlatform(act.metadata.platformId);
      setSelectedCourse(act.metadata.courseName);
      setActiveVideo({ id: act.metadata.lessonId, title: act.title });
    }
  };

  const markAsWatched = async (id: string, forceState?: boolean) => {
    if (!userStats.isPremium || !auth.currentUser) return;
    const userRef = doc(db, "users", auth.currentUser.uid);
    const isCurrentlyWatched = watchedVideos.includes(id);
    const targetState = forceState !== undefined ? forceState : !isCurrentlyWatched;
    if (targetState === isCurrentlyWatched) return;
    try {
      await updateDoc(userRef, { watchedLessons: targetState ? arrayUnion(id) : arrayRemove(id) });
    } catch (err) { console.error(err); }
  };

  const isOverLimit = (id: string) => {
    if (userStats.plan === 'premium') return false;
    if (userStats.openedContentIds?.includes(id)) return false;
    return (userStats.openedContentIds?.length || 0) >= 10;
  };

  const handleLessonSelect = async (lesson: VideoLesson, courseName?: string) => {
    const contentId = `aula_${lesson.id}`;
    const course = courseName || selectedCourse;
    if (isOverLimit(contentId)) { setActiveVideo(lesson); return; }
    setActiveVideo(lesson);
    if (!userStats.isPremium || !auth.currentUser) { onIncrementUsage?.(contentId); return; }
    onAddActivity({
      id: contentId, type: 'aula', title: lesson.title, subtitle: `${course}`,
      metadata: { platformId: selectedPlatform, courseName: course, lessonId: lesson.id }
    });
    onAwardPoints?.(contentId, 5);
    const userRef = doc(db, "users", auth.currentUser.uid);
    try {
      await updateDoc(userRef, { lastWatched: { lessonId: lesson.id, lessonTitle: lesson.title, courseName: course || '', platformId: selectedPlatform || '' } });
    } catch (err) { console.error(err); }
  };

  const getLessonsForCourse = (course: string) => {
    if (course === 'Embriologia' || course === 'Embriologia Animal') return EMBRIOLOGIA_LESSONS;
    if (course === 'Reprodução Humana') return REPRODUCAO_HUMANA_LESSONS;
    if (course === 'Pediatria 1') return PEDIATRIA_1_LESSONS;
    if (course === 'Hematologia') return HEMATOLOGIA_LESSONS;
    return [{ id: 'dQw4w9WgXcQ', title: `Aula 01: Introdução a ${course}`, duration: '15:00' }];
  };

  const currentCourses = useMemo(() => {
    if (selectedPlatform === 'sanarflix') return SANARFLIX_COURSES;
    if (selectedPlatform === 'devoltavest') return VEST_COURSES;
    if (selectedPlatform === 'medcof') return MEDCOF_COURSES;
    if (selectedPlatform === 'medcurso') return MEDCURSO_COURSES;
    return [];
  }, [selectedPlatform]);

  const filteredLessons = useMemo(() => {
    return getLessonsForCourse(selectedCourse || '');
  }, [selectedCourse]);

  if (!userStats.isPremium) {
    return (
      <div className="max-w-[1200px] mx-auto pt-10 pb-32 px-4 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div className="text-center mb-16 bg-white dark:bg-nexus-card border border-neutral-200 dark:border-nexus-border rounded-3xl p-12 md:p-20 shadow-sm">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-sky-50 dark:bg-nexus-blue/10 rounded-full mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sky-600 dark:text-nexus-blue"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
          </div>
          <h1 className="text-3xl md:text-5xl font-semibold text-neutral-900 dark:text-nexus-text-title mb-4 tracking-tight">Acervo Médico Exclusivo</h1>
          <p className="text-neutral-500 dark:text-nexus-text-sec text-base md:text-lg font-medium leading-relaxed max-w-2xl mx-auto mb-8">Para acessar bibliotecas e videoaulas, assine o plano Premium.</p>
          <button className="bg-sky-600 hover:bg-sky-500 text-white font-semibold px-10 py-4 rounded-xl text-sm transition-all shadow-sm active:scale-[0.98]">Ver Planos Premium</button>
        </div>
      </div>
    );
  }

  // VIEW DO PLAYER
  if (activeVideo) {
    const isCompleted = watchedVideos.includes(activeVideo.id);
    const groupedLessons = filteredLessons.reduce((acc: any, lesson: any) => {
      const block = (lesson as any).block || 'Grade de Aulas';
      if (!acc[block]) acc[block] = [];
      acc[block].push(lesson);
      return acc;
    }, {});

    return (
      <div className="fixed inset-0 z-[60] bg-nexus-bg flex flex-col md:flex-row animate-in fade-in duration-300">
        <div className="flex-grow flex flex-col overflow-y-auto no-scrollbar">
          <header className="h-16 shrink-0 bg-nexus-surface border-b border-nexus-border flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <button onClick={() => { setActiveVideo(null); setSelectedCourse(null); }} className="w-10 h-10 rounded-full hover:bg-nexus-hover flex items-center justify-center text-nexus-text-sec transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg></button>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest leading-none mb-1" style={{ color: accentColor }}>{selectedCourse}</p>
                <h2 className="text-sm md:text-base font-bold text-nexus-text-title truncate">{activeVideo.title}</h2>
              </div>
            </div>
          </header>
          <div className="bg-black relative aspect-video w-full flex items-center justify-center group">
            <iframe src={`https://www.youtube.com/embed/${activeVideo.id}?autoplay=1&modestbranding=1&rel=0`} className="w-full h-full border-none z-10" allow="autoplay; encrypted-media; fullscreen" allowFullScreen title={activeVideo.title}></iframe>
          </div>
          <div className="p-6 md:p-10 max-w-5xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-nexus-text-title tracking-tight mb-2">{activeVideo.title}</h1>
                <p className="text-nexus-text-sec text-sm">{(activeVideo as any).duration || '12 min'} • {selectedPlatform} Academy</p>
              </div>
              <button onClick={() => markAsWatched(activeVideo.id)} className={`flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${isCompleted ? 'bg-nexus-green/10 text-nexus-green border border-nexus-green/20' : 'bg-white text-black hover:bg-neutral-200'}`}>
                {isCompleted ? 'Aula Concluída' : 'Marcar como concluída'}
              </button>
            </div>
          </div>
        </div>
        <aside className="w-full md:w-[380px] bg-nexus-surface border-l border-nexus-border flex flex-col">
          <div className="p-6 border-b border-nexus-border sticky top-0 bg-nexus-surface z-10">
            <h3 className="text-xs font-black text-nexus-text-title uppercase tracking-widest mb-1">Módulos do Curso</h3>
            <div className="h-1 w-full bg-nexus-bg rounded-full mt-3"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(watchedVideos.length / filteredLessons.length) * 100}%` }}></div></div>
          </div>
          <div className="flex-grow overflow-y-auto no-scrollbar p-2 space-y-1">
            {Object.keys(groupedLessons).map(block => (
              <div key={block} className="mb-4">
                <p className="px-4 py-2 text-[9px] font-black text-neutral-500 uppercase tracking-widest leading-relaxed">{block}</p>
                {groupedLessons[block].map((lesson: any) => (
                  <button key={lesson.id} onClick={() => handleLessonSelect(lesson)} className={`w-full text-left p-4 rounded-xl flex items-start gap-3 transition-all ${activeVideo.id === lesson.id ? 'bg-nexus-hover border border-nexus-border' : 'hover:bg-nexus-hover/50'}`}>
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${watchedVideos.includes(lesson.id) ? 'bg-emerald-500' : 'bg-neutral-700'}`}></div>
                    <div className="min-w-0">
                      <p className={`text-xs font-bold leading-tight ${activeVideo.id === lesson.id ? 'text-nexus-blue' : 'text-nexus-text-main'}`}>{lesson.title}</p>
                      <p className="text-[9px] text-neutral-500 font-bold mt-1 uppercase tracking-widest">{lesson.duration || '12:00'}</p>
                    </div>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </aside>
      </div>
    );
  }

  // --- ÁREA DE ESPECIALIDADES ---
  if (selectedPlatform) {
    const platformGlow = selectedPlatform === 'medcurso' ? 'hover:border-[#38bdf8]/50 hover:shadow-[0_15px_30px_rgba(56,189,248,0.15)]' : 
                         selectedPlatform === 'medcof' ? 'hover:border-[#ef4444]/50 hover:shadow-[0_15px_30px_rgba(239,68,68,0.15)]' :
                         'hover:border-[#00BFA6]/50 hover:shadow-[0_15px_30px_rgba(0,191,166,0.15)]';

    return (
      <div className="max-w-[1400px] mx-auto animate-in fade-in duration-500 px-4">
        <button onClick={() => setSelectedPlatform(null)} className="mb-8 flex items-center gap-2 text-neutral-500 hover:text-white transition-colors text-sm font-medium group">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-1 transition-transform"><path d="m15 18-6-6 6-6"/></svg> Catálogo Premium
        </button>

        <header className="mb-10">
          <h2 className="text-3xl md:text-5xl font-black text-nexus-text-title tracking-tighter uppercase italic">{selectedPlatform}</h2>
          <p className="text-neutral-500 mt-2 text-sm font-medium">Clique para retomar seus estudos de onde parou.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {currentCourses.map((course) => {
            const theme = SPECIALTY_THEMES[course] || SPECIALTY_THEMES["Clínica Médica"];
            
            const handleCourseClick = () => {
              setSelectedCourse(course);
              const lessons = getLessonsForCourse(course);
              if (lessons.length > 0) {
                const nextPendingLesson = lessons.find(l => !watchedVideos.includes(l.id));
                const targetLesson = nextPendingLesson || lessons[lessons.length - 1];
                handleLessonSelect(targetLesson, course);
              }
            };

            return (
              <div 
                key={course}
                onClick={handleCourseClick}
                className={`group relative h-[240px] md:h-[280px] rounded-[22px] bg-[#1a1d23] border border-white/5 overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] ${platformGlow}`}
              >
                <div className="absolute inset-0 w-full h-full overflow-hidden">
                  <img src={theme.img} alt={course} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-1000" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0f1115] via-[#0f1115]/40 to-transparent"></div>
                </div>

                <div className="absolute inset-0 p-5 md:p-6 flex flex-col justify-between">
                  <div className="flex justify-start">
                    <span 
                      className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1.5 backdrop-blur-md border border-white/10"
                      style={{ backgroundColor: `${theme.accent}B3`, color: '#fff' }}
                    >
                      {theme.icon} {course.split(' ')[0]}
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="text-xl md:text-2xl font-black text-white tracking-tighter leading-tight drop-shadow-md">
                      {course}
                    </h3>
                    
                    <div className="w-full h-[3px] bg-white/10 rounded-full overflow-hidden">
                      <div className={`h-full w-[12%] transition-all duration-1000 bg-gradient-to-r ${theme.gradient} rounded-full`}></div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Retomar Estudo</span>
                      <button className="bg-white text-[#0f1115] px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-neutral-200 transition-all shadow-lg">
                        Assistir
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto animate-in fade-in duration-700 pb-20">
      <header className="px-4 mb-10 md:mb-14">
        <h2 className="text-3xl md:text-5xl font-semibold text-neutral-900 dark:text-nexus-text-title tracking-tighter mb-4 italic">Acervo Premium</h2>
        <p className="text-neutral-500 dark:text-nexus-text-sec text-sm md:text-base font-medium max-w-2xl leading-relaxed">Sua biblioteca médica digital integrada.</p>
      </header>
      <div className="space-y-12 md:space-y-16">
        {premiumHistory.length > 0 && (
          <section className="px-4">
            <h3 className="text-base md:text-lg font-semibold text-nexus-text-title mb-5">Continuar assistindo</h3>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-6">
              {premiumHistory.map((act) => (
                <div key={act.id} onClick={() => handleResumeActivity(act)} className="flex-none w-[220px] md:w-[280px] bg-nexus-card border border-nexus-border rounded-xl p-4 cursor-pointer hover:border-nexus-blue/50 transition-all shadow-sm">
                  <div className="aspect-video w-full rounded-lg bg-nexus-surface mb-3 flex items-center justify-center text-nexus-blue/20">
                     <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  </div>
                  <h5 className="text-xs md:text-sm font-semibold text-nexus-text-title truncate">{act.title}</h5>
                  <span className="text-[10px] text-nexus-text-sec truncate block mt-0.5">{act.subtitle}</span>
                </div>
              ))}
            </div>
          </section>
        )}
        <section className="px-4">
          <h3 className="text-base md:text-lg font-semibold text-nexus-text-title mb-5">Plataformas Disponíveis</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {PREMIUM_PLATFORMS.map((platform) => (
              <div key={platform.id} onClick={() => setSelectedPlatform(platform.id)} className="group relative aspect-video rounded-2xl bg-nexus-card border border-nexus-border overflow-hidden cursor-pointer transition-all hover:scale-[1.02]">
                <div className={`w-full h-full ${platform.id === 'medcurso' ? 'bg-[#0a0a0a] p-8 flex items-center justify-center' : ''}`}>
                  <img 
                    src={platform.image} 
                    alt={platform.title} 
                    className={`w-full h-full transition-opacity ${platform.id === 'medcurso' ? 'object-contain opacity-90 group-hover:opacity-100' : 'object-cover opacity-60 group-hover:opacity-80'}`} 
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent p-6 flex flex-col justify-end pointer-events-none">
                  <h4 className="text-xl font-bold text-white tracking-tight">{platform.title}</h4>
                  <p className="text-xs text-neutral-400 mt-1 line-clamp-1">{platform.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default PremiumView;
