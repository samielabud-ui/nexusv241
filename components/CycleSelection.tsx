
import React, { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

interface CycleSelectionProps {
  onComplete: () => void;
}

const CycleSelection: React.FC<CycleSelectionProps> = ({ onComplete }) => {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [photoURL, setPhotoURL] = useState('');

  useEffect(() => {
    const fetchInitialData = async () => {
      if (auth.currentUser) {
        const userRef = doc(db, "users", auth.currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          setName(data.displayName || '');
          setPhotoURL(data.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.displayName || 'Default'}&backgroundColor=b6e3f4`);
        }
      }
    };
    fetchInitialData();
  }, []);

  const handleSelect = async (ciclo: string) => {
    if (!auth.currentUser || !name.trim()) {
      alert("Por favor, informe seu nome para prosseguir.");
      return;
    }
    setLoading(true);
    try {
      await setDoc(doc(db, "users", auth.currentUser.uid), {
        displayName: name.trim(),
        photoURL: photoURL,
        ciclo: ciclo,
        setupComplete: true,
        isPremium: false,
        plan: 'basic',
        totalAnswered: 0,
        totalCorrect: 0,
        totalErrors: 0,
        points: 0,
        streak: 0,
        questionsToday: 0,
        lastActiveDate: null
      }, { merge: true });
      onComplete();
    } catch (err) {
      console.error("Erro ao salvar ciclo:", err);
    } finally {
      setLoading(false);
    }
  };

  const options = ['Ciclo Básico', 'Ciclo Clínico', 'Internato'];

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-10">
           <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center font-black text-4xl text-white mx-auto mb-6 shadow-lg shadow-blue-600/20">N</div>
          <h2 className="text-3xl font-black text-white mb-4 tracking-tighter uppercase italic">Bem-vindo ao NexusBQ</h2>
          <p className="text-neutral-500 font-medium leading-relaxed">
            Estamos preparando sua jornada. Como devemos te chamar?
          </p>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 p-8 md:p-10 rounded-[2.5rem] shadow-2xl">
           <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-3">Nome de Exibição</label>
           <input 
              type="text" 
              required
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-4 px-6 text-sm focus:border-blue-600 outline-none transition-all text-white mb-8"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Dr. Marcelo"
            />

          <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-4">Onde você está na graduação?</p>
          <div className="grid grid-cols-1 gap-3">
            {options.map((option) => (
              <button
                key={option}
                disabled={loading}
                onClick={() => handleSelect(option)}
                className="bg-neutral-950 border border-neutral-800 p-6 rounded-2xl hover:border-blue-600 hover:bg-neutral-900 transition-all text-left group flex items-center justify-between shadow-sm"
              >
                <div>
                  <span className="block text-lg font-black text-white group-hover:text-blue-500 transition-colors uppercase italic tracking-tighter">{option}</span>
                  <span className="text-[10px] text-neutral-600 font-bold uppercase tracking-widest">Selecionar Nível</span>
                </div>
                <div className="w-10 h-10 rounded-xl border border-neutral-800 flex items-center justify-center group-hover:border-blue-600 group-hover:bg-blue-600/10 transition-all">
                  <svg className="w-5 h-5 text-transparent group-hover:text-blue-500 transition-all" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CycleSelection;
