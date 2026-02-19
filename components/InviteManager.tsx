
import React, { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  updateDoc, 
  doc, 
  orderBy,
  getDoc,
  runTransaction,
  Timestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { UserStats } from '../types';

interface Invite {
  id: string;
  code: string;
  status: 'active' | 'used'; // Mapeado de used: boolean no banco para status visual
  used: boolean;
  usedBy: string | null;
  createdBy: string;
  createdAt: any;
  usedAt: any;
}

interface InviteManagerProps {
  userStats: UserStats;
}

const InviteManager: React.FC<InviteManagerProps> = ({ userStats }) => {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = userStats.role === 'admin' || userStats.adm === true;
  // O saldo de convites é respeitado apenas para usuários comuns
  const hasQuota = (userStats.invitesAvailable || 0) > 0;
  const canGenerate = isAdmin || hasQuota;

  useEffect(() => {
    if (!userStats.uid) return;

    // Busca apenas os convites criados por este usuário
    const q = query(
      collection(db, "invites"),
      where("createdBy", "==", userStats.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => {
        const data = d.data();
        return { 
          id: d.id, 
          ...data,
          // Normaliza o status para a interface
          status: data.used ? 'used' : 'active'
        } as Invite;
      });
      setInvites(docs);
    }, (err) => {
      console.error("Erro ao carregar convites:", err);
      setError("Erro de permissão ou conexão ao carregar histórico.");
    });

    return () => unsubscribe();
  }, [userStats.uid]);

  const generateUniqueCode = () => {
    return `NEXUS-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  };

  const handleGenerate = async () => {
    if (!userStats.uid || loading) return;

    setLoading(true);
    setError(null);

    try {
      // Uso de transação para garantir que o invitesAvailable não fique negativo
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, "users", userStats.uid!);
        const userSnap = await transaction.get(userRef);
        
        if (!userSnap.exists()) throw new Error("Usuário não encontrado.");
        
        const userData = userSnap.data();
        const currentQuota = userData.invitesAvailable || 0;

        // Se não for admin e não tiver cota, bloqueia a transação
        if (!isAdmin && currentQuota <= 0) {
          throw new Error("Você não possui mais convites disponíveis.");
        }

        const newCode = generateUniqueCode();
        const inviteRef = doc(collection(db, "invites"));

        // 1. Cria o convite
        transaction.set(inviteRef, {
          code: newCode,
          createdBy: userStats.uid,
          used: false,
          usedBy: null,
          createdAt: serverTimestamp(),
          usedAt: null,
          expiresAt: Timestamp.fromDate(new Date(2026, 5, 30)) // Validade padrão Nexus
        });

        // 2. Se for usuário comum, reduz a cota para 0
        if (!isAdmin) {
          transaction.update(userRef, {
            invitesAvailable: 0
          });
        }
      });

    } catch (err: any) {
      console.error("Erro na geração:", err);
      setError(err.message || "Falha ao gerar código. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    alert("Código copiado para a área de transferência!");
  };

  const formatDate = (ts: any) => {
    if (!ts) return '—';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 bg-nexus-card/50 p-1 rounded-2xl">
      <header className="pb-4 border-b border-nexus-border">
         <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">🎟️</span>
            <h3 className="text-sm font-black text-white uppercase italic tracking-tight">Sistema de Convites</h3>
         </div>
         <p className="text-[10px] text-nexus-text-label font-bold uppercase tracking-widest leading-relaxed">
           O cadastro na plataforma funciona exclusivamente por convite. Cada código gerado é único e pode ser utilizado apenas uma vez.
         </p>
      </header>

      {/* ÁREA DE GERAÇÃO */}
      <div className="p-6 bg-nexus-surface border border-nexus-border rounded-2xl shadow-inner space-y-5">
        <div className="flex justify-between items-center">
          <p className="text-[10px] font-black text-nexus-text-sec uppercase tracking-widest">Sua Disponibilidade</p>
          {isAdmin ? (
            <span className="text-[9px] font-black bg-blue-600/20 text-blue-500 px-3 py-1 rounded-full uppercase border border-blue-600/20">Modo Admin: Ilimitado</span>
          ) : (
            <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase border ${hasQuota ? 'bg-nexus-green/10 text-nexus-green border-nexus-green/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
              {userStats.invitesAvailable || 0} Convite Disponível
            </span>
          )}
        </div>

        {canGenerate ? (
          <button 
            onClick={handleGenerate}
            disabled={loading}
            className="w-full bg-nexus-blue text-black font-black py-4 rounded-xl text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-nexus-blue/10 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Processando no Banco..." : isAdmin ? "Gerar Novo Código Admin" : "Gerar Meu Único Convite"}
          </button>
        ) : (
          <div className="py-4 px-4 bg-nexus-bg/50 border border-nexus-border rounded-xl text-center">
             <p className="text-xs text-nexus-text-label font-bold italic uppercase tracking-tighter">Você já utilizou seu convite.</p>
          </div>
        )}

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl">
            <p className="text-rose-400 text-[9px] font-black text-center uppercase tracking-widest">{error}</p>
          </div>
        )}
      </div>

      {/* LISTAGEM DE CONVITES GERADOS */}
      {invites.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 px-1">
             <p className="text-[9px] font-black text-nexus-text-label uppercase tracking-widest">Histórico de Códigos</p>
             <div className="h-px flex-grow bg-nexus-border"></div>
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto no-scrollbar pr-1">
            {invites.map((invite) => (
              <div key={invite.id} className="p-4 bg-nexus-surface border border-nexus-border rounded-xl flex items-center justify-between group hover:border-nexus-blue/30 transition-all">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-black text-white tracking-widest select-all">{invite.code}</span>
                    <button 
                      onClick={() => copyToClipboard(invite.code)}
                      className="p-1.5 text-nexus-text-label hover:text-white transition-colors"
                      title="Copiar Código"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                    </button>
                  </div>
                  <p className="text-[8px] text-nexus-text-label font-bold uppercase mt-1">Criado em: {formatDate(invite.createdAt)}</p>
                </div>

                <div className="flex items-center gap-3">
                  {invite.used ? (
                    <div className="flex flex-col items-end">
                       <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                          <span className="text-[8px] font-black text-rose-500 uppercase">Utilizado</span>
                       </div>
                       <p className="text-[7px] text-nexus-text-label font-mono mt-0.5">EM {formatDate(invite.usedAt)}</p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                       <span className="w-1.5 h-1.5 rounded-full bg-nexus-green animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.5)]"></span>
                       <span className="text-[8px] font-black text-nexus-green uppercase">Disponível</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default InviteManager;
