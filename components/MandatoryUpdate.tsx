
import React, { useState } from 'react';
import { db } from '../lib/firebase';
import { doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

interface MandatoryUpdateProps {
  userId: string;
  onComplete: () => void;
}

const MandatoryUpdate: React.FC<MandatoryUpdateProps> = ({ userId, onComplete }) => {
  const [medCourse, setMedCourse] = useState('');
  const [semester, setSemester] = useState('');
  const [birthday, setBirthday] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medCourse || !semester || !birthday) return;
    setLoading(true);
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        medCourse,
        semester,
        birthday,
        adm: false, // Default
        isBanned: false
      });
      onComplete();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-[2.5rem] p-8 md:p-10 shadow-2xl animate-in zoom-in duration-300">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center font-black text-3xl text-white mx-auto mb-6 shadow-lg shadow-blue-600/20">N</div>
          <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic">Atualização de Perfil</h2>
          <p className="text-neutral-500 text-sm mt-2">Precisamos de alguns detalhes adicionais para as novas funções sociais do NexusBQ.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest px-1">Qual MED você está cursando?</label>
            <input 
              type="text" 
              placeholder="Ex: MED 3"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-4 px-6 text-sm text-white focus:border-blue-600 outline-none transition-all"
              value={medCourse}
              onChange={e => setMedCourse(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest px-1">Semestre Atual</label>
            <input 
              type="number" 
              placeholder="Ex: 5"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-4 px-6 text-sm text-white focus:border-blue-600 outline-none transition-all"
              value={semester}
              onChange={e => setSemester(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest px-1">Data de Aniversário</label>
            <input 
              type="date" 
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-4 px-6 text-sm text-white focus:border-blue-600 outline-none transition-all"
              value={birthday}
              onChange={e => setBirthday(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-2xl text-xs uppercase tracking-widest transition-all shadow-xl shadow-blue-600/20 mt-4"
          >
            {loading ? "Salvando..." : "Concluir e Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default MandatoryUpdate;
