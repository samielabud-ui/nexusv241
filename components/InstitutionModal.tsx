
import React, { useState } from 'react';
import { db } from '../lib/firebase';
import { doc, updateDoc, Timestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

interface InstitutionModalProps {
  userId: string;
  onComplete: () => void;
}

const InstitutionModal: React.FC<InstitutionModalProps> = ({ userId, onComplete }) => {
  const [loading, setLoading] = useState(false);

  const handleChoice = async (choice: string) => {
    setLoading(true);
    try {
      const userRef = doc(db, "users", userId);
      
      // Data de expiração fixa: 30/06/2026
      const expirationDate = new Date(2026, 5, 30, 23, 59, 59);
      
      await updateDoc(userRef, {
        institution: choice,
        invitesAvailable: 1,
        premiumExpiresAt: Timestamp.fromDate(expirationDate),
        isPremium: true, // Garante que todos sejam premium conforme regra de validade
        plan: 'premium'
      });
      
      onComplete();
    } catch (err) {
      console.error("Erro ao atualizar instituição:", err);
      alert("Ocorreu um erro ao salvar sua escolha. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[400] bg-nexus-bg/95 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-nexus-card border border-nexus-border rounded-[2.5rem] p-8 md:p-12 shadow-2xl animate-in zoom-in duration-300">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-nexus-blue rounded-2xl flex items-center justify-center font-black text-3xl text-white mx-auto mb-6 shadow-lg shadow-nexus-blue/20">
            N
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-nexus-text-title tracking-tighter uppercase italic">Identificação Acadêmica</h2>
          <p className="text-nexus-text-sec text-sm mt-3 leading-relaxed">
            Para personalizar sua experiência e liberar seu acesso premium estendido, informe sua instituição de ensino.
          </p>
        </div>

        <div className="space-y-3">
          <button 
            disabled={loading}
            onClick={() => handleChoice('UEPA')}
            className="w-full bg-nexus-surface border border-nexus-border hover:border-nexus-blue hover:bg-nexus-hover text-nexus-text-main p-6 rounded-2xl transition-all text-left group flex items-center justify-between disabled:opacity-50"
          >
            <div>
              <span className="block text-lg font-black uppercase italic tracking-tighter group-hover:text-nexus-blue">UEPA</span>
              <span className="text-[10px] text-nexus-text-label font-bold uppercase tracking-widest">Universidade do Estado do Pará</span>
            </div>
            <div className="w-10 h-10 rounded-xl border border-nexus-border flex items-center justify-center group-hover:border-nexus-blue group-hover:bg-nexus-blue/10">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-transparent group-hover:text-nexus-blue transition-all"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
          </button>

          <button 
            disabled={loading}
            onClick={() => handleChoice('Outra instituição')}
            className="w-full bg-nexus-surface border border-nexus-border hover:border-nexus-blue hover:bg-nexus-hover text-nexus-text-main p-6 rounded-2xl transition-all text-left group flex items-center justify-between disabled:opacity-50"
          >
            <div>
              <span className="block text-lg font-black uppercase italic tracking-tighter group-hover:text-nexus-blue">Outra Instituição</span>
              <span className="text-[10px] text-nexus-text-label font-bold uppercase tracking-widest">Ensino Superior de Medicina</span>
            </div>
            <div className="w-10 h-10 rounded-xl border border-nexus-border flex items-center justify-center group-hover:border-nexus-blue group-hover:bg-nexus-blue/10">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-transparent group-hover:text-nexus-blue transition-all"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
          </button>

          <button 
            disabled={loading}
            onClick={() => handleChoice('Não sou estudante')}
            className="w-full bg-nexus-surface border border-nexus-border hover:border-nexus-blue hover:bg-nexus-hover text-nexus-text-main p-6 rounded-2xl transition-all text-left group flex items-center justify-between disabled:opacity-50"
          >
            <div>
              <span className="block text-lg font-black uppercase italic tracking-tighter group-hover:text-nexus-blue">Não sou estudante</span>
              <span className="text-[10px] text-nexus-text-label font-bold uppercase tracking-widest">Outros perfis profissionais</span>
            </div>
            <div className="w-10 h-10 rounded-xl border border-nexus-border flex items-center justify-center group-hover:border-nexus-blue group-hover:bg-nexus-blue/10">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-transparent group-hover:text-nexus-blue transition-all"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
          </button>
        </div>

        <p className="mt-8 text-[9px] text-nexus-text-label text-center uppercase font-bold tracking-[0.2em]">
          Todos os usuários NexusBQ possuem acesso premium até 30/06/2026.
        </p>
      </div>
    </div>
  );
};

export default InstitutionModal;
