
import React, { useState } from 'react';
import { Question } from '../types';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc, increment } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

interface QuestionCardProps {
  question: Question;
  onAnswer?: (status: 'correct' | 'incorrect') => void;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question, onAnswer }) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAnswer = async (index: number) => {
    if (isAnswered || !auth.currentUser || loading) return;
    
    setLoading(true);
    setSelectedOption(index);
    setIsAnswered(true);

    const isCorrect = index === question.gabarito;
    const userId = auth.currentUser.uid;
    const today = new Date().toISOString().split('T')[0];

    if (onAnswer) {
      onAnswer(isCorrect ? 'correct' : 'incorrect');
    }

    try {
      const responseRef = doc(db, "responses", `${userId}_${question.id}`);
      const responseDoc = await getDoc(responseRef);
      
      if (!responseDoc.exists()) {
        await setDoc(responseRef, {
          userId,
          questionId: question.id,
          correct: isCorrect,
          theme: question.tema,
          modulo: question.modulo,
          timestamp: new Date()
        });

        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.data();

        let newStreak = userData?.streak || 0;
        const lastActiveDate = userData?.lastActiveDate;

        if (!lastActiveDate) {
          newStreak = 1;
        } else {
          const lastDate = new Date(lastActiveDate);
          const currentDate = new Date(today);
          const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays === 1) {
            newStreak += 1;
          } else if (diffDays > 1) {
            newStreak = 1;
          }
        }

        const lastDailyReset = userData?.lastDailyReset;
        const shouldResetDaily = lastDailyReset !== today;

        await updateDoc(userRef, {
          totalAnswered: increment(1),
          totalCorrect: isCorrect ? increment(1) : increment(0),
          totalErrors: !isCorrect ? increment(1) : increment(0),
          lastActiveDate: today,
          lastDailyReset: today,
          questionsToday: shouldResetDaily ? 1 : increment(1),
          streak: newStreak,
          points: increment(isCorrect ? 10 : 2)
        });
      }
    } catch (err) {
      console.error("Erro ao salvar resposta:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      id={`q-${question.id}`}
      className="bg-white dark:bg-nexus-card border border-neutral-200 dark:border-nexus-border rounded-2xl p-6 mb-6 hover:border-sky-500/30 dark:hover:border-nexus-blue/40 transition-all duration-300 scroll-mt-24 shadow-sm"
    >
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-nexus-blue bg-sky-400/10 dark:bg-nexus-blue/10 px-2 py-0.5 rounded border border-sky-400/20 dark:border-nexus-blue/20">
          {question.ciclo}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-nexus-purple bg-purple-400/10 dark:bg-nexus-purple/10 px-2 py-0.5 rounded border border-purple-400/20 dark:border-nexus-purple/20">
          {question.modalidade === 'PBL' ? 'Tutoria / PBL' : question.modalidade}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-nexus-green bg-emerald-400/10 dark:bg-nexus-green/10 px-2 py-0.5 rounded border border-emerald-400/20 dark:border-nexus-green/20">
          Prob. {question.problema}
        </span>
      </div>
      
      <div className="mb-2">
        <span className="text-xs text-neutral-500 dark:text-nexus-text-label font-medium uppercase tracking-widest">{question.modulo}</span>
        <h3 className="text-lg font-black text-neutral-900 dark:text-nexus-text-title mt-1 tracking-tight">{question.tema}</h3>
      </div>
      
      <div className="bg-neutral-50 dark:bg-nexus-surface p-5 rounded-xl mb-6 border-l-4 border-sky-600 dark:border-nexus-blue transition-colors">
        <p className="text-neutral-700 dark:text-nexus-text-main text-sm leading-relaxed whitespace-pre-wrap font-medium">
          {question.enunciado}
        </p>
      </div>

      <div className="space-y-2.5">
        {question.alternativas.map((option, idx) => {
          let buttonClass = "w-full text-left p-4 rounded-xl border transition-all text-sm flex items-start ";
          
          if (!isAnswered) {
            buttonClass += "border-neutral-100 dark:border-nexus-border bg-neutral-50/50 dark:bg-nexus-surface hover:bg-neutral-100 dark:hover:bg-nexus-hover hover:border-sky-500/30 dark:hover:border-nexus-blue/50 text-neutral-600 dark:text-nexus-text-main group";
          } else {
            if (idx === question.gabarito) {
              buttonClass += "border-emerald-500/50 dark:border-nexus-green/40 bg-emerald-500/10 dark:bg-nexus-green/10 text-emerald-600 dark:text-nexus-green shadow-sm";
            } else if (idx === selectedOption) {
              buttonClass += "border-red-500/50 dark:border-rose-400/40 bg-red-500/10 dark:bg-rose-400/10 text-red-600 dark:text-rose-400 shadow-sm";
            } else {
              buttonClass += "border-neutral-100 dark:border-nexus-border bg-neutral-50/50 dark:bg-nexus-surface text-neutral-400 dark:text-nexus-text-label opacity-50";
            }
          }

          return (
            <button 
              key={idx}
              disabled={isAnswered || loading}
              onClick={() => handleAnswer(idx)}
              className={buttonClass}
            >
              <span className={`mr-3 font-mono font-black ${!isAnswered ? 'text-neutral-400 dark:text-nexus-text-sec group-hover:text-sky-500 dark:group-hover:text-nexus-blue' : ''}`}>
                {String.fromCharCode(65 + idx)})
              </span>
              <span className="font-medium">{option}</span>
            </button>
          );
        })}
      </div>
      
      {isAnswered && (
        <div className="mt-4 p-4 rounded-xl bg-neutral-50 dark:bg-nexus-surface border border-neutral-100 dark:border-nexus-border text-[11px] font-bold text-neutral-500 dark:text-nexus-text-sec animate-in fade-in slide-in-from-top-2 tracking-wide transition-colors">
          {selectedOption === question.gabarito ? (
            <div className="flex items-center gap-2">
              <span className="text-emerald-600 dark:text-nexus-green text-lg">✓</span>
              <span className="uppercase text-emerald-600/80 dark:text-nexus-green/80">Excelente! Resposta correta e fundamentada.</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-red-600 dark:text-rose-400 text-lg">✗</span>
              <span className="uppercase text-red-600/80 dark:text-rose-400/80">A resposta correta era a alternativa <span className="text-emerald-600 dark:text-nexus-green font-black">{String.fromCharCode(65 + question.gabarito)}</span>.</span>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 flex justify-between items-center pt-4 border-t border-neutral-100 dark:border-nexus-border transition-colors">
        <span className="text-[9px] text-neutral-400 dark:text-nexus-text-label font-mono font-black uppercase tracking-widest">NexusID: {question.id}</span>
        <button className="text-[10px] font-black uppercase tracking-widest text-neutral-400 dark:text-nexus-text-sec hover:text-sky-600 dark:hover:text-nexus-blue flex items-center gap-2 transition-all">
          Explicação Detalhada
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
        </button>
      </div>
    </div>
  );
};

export default QuestionCard;
