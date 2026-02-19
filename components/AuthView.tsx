
import React, { useState } from 'react';
import { auth, db } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  doc, 
  getDocs, 
  collection, 
  query, 
  where, 
  Timestamp, 
  runTransaction,
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const AuthView: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [isInviteValidated, setIsInviteValidated] = useState(false);
  const [validatedInviteId, setValidatedInviteId] = useState<string | null>(null);
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const getFriendlyErrorMessage = (code: string) => {
    switch (code) {
      case 'auth/wrong-password': return 'Credenciais incorretas. Verifique seu email e senha.';
      case 'auth/user-not-found': return 'Nenhum prontuário encontrado com este email.';
      case 'auth/invalid-email': return 'Formato de email inválido.';
      case 'auth/weak-password': return 'Sua senha deve ter no mínimo 6 caracteres.';
      case 'auth/email-already-in-use': return 'Este email já está vinculado a um prontuário ativo.';
      default: return 'Ocorreu um erro no sistema. Tente novamente.';
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Preencha email e senha para acessar.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err: any) {
      setError(getFriendlyErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleValidateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    
    setLoading(true);
    setError('');
    try {
      const q = query(
        collection(db, "invites"), 
        where("code", "==", inviteCode.trim().toUpperCase()),
        where("used", "==", false) // Filtro primário: Não pode estar usado
      );
      
      const snap = await getDocs(q);
      
      if (snap.empty) {
        setError('Convite inválido ou já utilizado.');
        return;
      }

      const inviteDoc = snap.docs[0];
      const data = inviteDoc.data();
      
      // Verificação secundária de expiração
      if (data.expiresAt && data.expiresAt.toDate() < new Date()) {
        setError('Este código de convite expirou.');
        return;
      }

      setValidatedInviteId(inviteDoc.id);
      setIsInviteValidated(true);
      setIsSignUpMode(true);
      setShowInviteModal(false);
    } catch (err) {
      console.error(err);
      setError('Erro técnico ao validar convite.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name || password !== confirmPassword || !validatedInviteId) {
      setError('Verifique os dados e tente novamente.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // 1. Validação Final e Consumo do Convite via Transação Atômica
      // Isso impede que o mesmo ID de convite seja usado por duas pessoas ao mesmo tempo
      await runTransaction(db, async (transaction) => {
        const inviteRef = doc(db, "invites", validatedInviteId);
        const inviteSnap = await transaction.get(inviteRef);
        
        if (!inviteSnap.exists()) throw new Error("Convite não encontrado.");
        if (inviteSnap.data().used === true) throw new Error("Este convite já foi utilizado por outra pessoa.");

        // 2. Criar usuário no Auth do Firebase (fora da transação mas bloqueando o sucesso do invite)
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const uid = userCredential.user.uid;

        // 3. Atualizar Convite para USADO
        transaction.update(inviteRef, {
          used: true,
          usedBy: uid,
          usedAt: serverTimestamp()
        });

        // 4. Criar Perfil do Usuário
        const userRef = doc(db, "users", uid);
        const expirationDate = new Date(2026, 5, 30, 23, 59, 59);
        
        transaction.set(userRef, {
          displayName: name.trim(),
          email: email.trim(),
          photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name.trim()}`,
          setupComplete: false,
          isPremium: true,
          plan: 'premium',
          totalAnswered: 0,
          totalCorrect: 0,
          totalErrors: 0,
          points: 0,
          streak: 0,
          themePreference: 'dark',
          institution: null,
          invitesAvailable: 1, // Novos usuários ganham 1 convite para expansão da rede
          premiumExpiresAt: Timestamp.fromDate(expirationDate),
          createdAt: serverTimestamp()
        });
      });

    } catch (err: any) {
      console.error(err);
      setError(err.message || getFriendlyErrorMessage(err.code || 'default'));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Digite seu email para recuperar o acesso.');
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
      setError('');
    } catch (err) {
      setError("Não foi possível enviar o email de recuperação.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-nexus-bg text-nexus-text-main font-sans selection:bg-sky-500/30">
      
      {/* LADO ESQUERDO: IDENTIDADE INSTITUCIONAL */}
      <div className="hidden lg:flex flex-1 relative bg-nexus-surface items-center justify-center p-12 overflow-hidden border-r border-nexus-border">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-sky-900/10 via-nexus-surface to-nexus-surface"></div>
        <svg className="absolute w-[600px] h-[600px] text-sky-500/5 -bottom-20 -left-20 transform -rotate-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>

        <div className="relative z-10 max-w-lg">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-14 h-14 bg-sky-600 rounded-2xl flex items-center justify-center font-black text-2xl text-white shadow-lg shadow-sky-600/20">N</div>
            <span className="text-3xl font-black tracking-tighter text-nexus-text-title italic">NexusBQ</span>
          </div>
          <h1 className="text-4xl font-black text-nexus-text-title tracking-tight leading-[1.15] mb-6">
            Acesso exclusivo à inteligência médica.
          </h1>
          <p className="text-lg text-nexus-text-sec font-light leading-relaxed">
            Plataforma fechada para convidados. Estude com o método PBL e recursos de IA de última geração.
          </p>
        </div>
      </div>

      {/* LADO DIREITO: FORMULÁRIO */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 relative w-full">
        <div className="w-full max-w-[420px] bg-nexus-card border border-nexus-border rounded-[2rem] p-8 md:p-10 shadow-xl relative z-10">
          
          <div className="mb-8 text-center sm:text-left">
            <h2 className="text-2xl font-black text-nexus-text-title tracking-tight mb-2">
              {isSignUpMode ? "Criar conta exclusiva" : "Acesso ao sistema"}
            </h2>
            <p className="text-sm text-nexus-text-sec font-medium">
              {isSignUpMode ? "Finalize seu cadastro de convidado." : "Insira suas credenciais Nexus."}
            </p>
          </div>

          {!isSignUpMode ? (
            <form className="space-y-5" onSubmit={handleLogin}>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-nexus-text-sec uppercase tracking-widest pl-1">Email</label>
                <input 
                  type="email" 
                  className="w-full bg-nexus-surface border border-nexus-border text-nexus-text-main text-sm rounded-xl py-3.5 px-4 focus:border-sky-500 outline-none transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center pl-1 pr-1">
                  <label className="text-[11px] font-bold text-nexus-text-sec uppercase tracking-widest">Senha</label>
                  <button type="button" onClick={handleForgotPassword} className="text-[10px] font-bold text-sky-500">Esqueceu?</button>
                </div>
                <input 
                  type="password" 
                  className="w-full bg-nexus-surface border border-nexus-border text-nexus-text-main text-sm rounded-xl py-3.5 px-4 focus:border-sky-500 outline-none transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {error && <p className="text-rose-400 text-[11px] font-bold bg-rose-500/10 p-3 rounded-xl">{error}</p>}
              {resetSent && <p className="text-emerald-500 text-[11px] font-bold bg-emerald-500/10 p-3 rounded-xl">Link de recuperação enviado.</p>}

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-sky-600 hover:bg-sky-500 text-white font-black py-4 rounded-xl text-xs uppercase tracking-widest transition-all shadow-lg shadow-sky-600/20"
              >
                {loading ? "Acessando..." : "Entrar"}
              </button>

              <div className="pt-4 text-center border-t border-nexus-border/50">
                 <p className="text-[10px] text-nexus-text-label uppercase font-black tracking-widest mb-4">Acesso Protegido</p>
                 <button 
                  type="button"
                  onClick={() => { setShowInviteModal(true); setError(''); }}
                  className="text-xs text-nexus-text-main font-bold hover:text-sky-500 transition-colors"
                 >
                   Possui um código de convite?
                 </button>
              </div>
            </form>
          ) : (
            <form className="space-y-4 animate-in fade-in duration-500" onSubmit={handleSignUp}>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-nexus-text-sec uppercase tracking-widest">Nome Completo</label>
                <input type="text" className="w-full bg-nexus-surface border border-nexus-border text-nexus-text-main text-sm rounded-xl py-3 px-4 focus:border-sky-500 outline-none" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-nexus-text-sec uppercase tracking-widest">Email</label>
                <input type="email" className="w-full bg-nexus-surface border border-nexus-border text-nexus-text-main text-sm rounded-xl py-3 px-4 focus:border-sky-500 outline-none" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-nexus-text-sec uppercase tracking-widest">Senha</label>
                  <input type="password" className="w-full bg-nexus-surface border border-nexus-border text-nexus-text-main text-sm rounded-xl py-3 px-4 focus:border-sky-500 outline-none" value={password} onChange={e => setPassword(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-nexus-text-sec uppercase tracking-widest">Confirmar</label>
                  <input type="password" className="w-full bg-nexus-surface border border-nexus-border text-nexus-text-main text-sm rounded-xl py-3 px-4 focus:border-sky-500 outline-none" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                </div>
              </div>

              {error && <p className="text-rose-400 text-[11px] font-bold bg-rose-500/10 p-3 rounded-xl">{error}</p>}

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-nexus-blue text-black font-black py-4 rounded-xl text-xs uppercase tracking-widest transition-all shadow-lg"
              >
                {loading ? "Processando..." : "Finalizar Cadastro"}
              </button>

              <button 
                type="button" 
                onClick={() => { setIsSignUpMode(false); setIsInviteValidated(false); }}
                className="w-full text-[10px] text-nexus-text-label font-bold uppercase tracking-widest hover:text-white transition-colors mt-2"
              >
                Voltar ao Início
              </button>
            </form>
          )}
        </div>
      </div>

      {/* MODAL DE CONVITE */}
      {showInviteModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="w-full max-w-sm bg-nexus-card border border-nexus-border rounded-[2rem] p-8 shadow-2xl">
              <h3 className="text-xl font-black text-white uppercase italic tracking-tight mb-2">Validar Convite</h3>
              <p className="text-nexus-text-sec text-xs font-medium mb-6">Insira o código enviado por um membro da rede NexusBQ.</p>
              
              <form onSubmit={handleValidateInvite} className="space-y-4">
                <input 
                  autoFocus
                  type="text" 
                  placeholder="EX: NEXUS-XXXXXX"
                  className="w-full bg-nexus-surface border border-nexus-border text-white text-center font-mono py-4 rounded-xl focus:border-sky-500 outline-none uppercase tracking-widest"
                  value={inviteCode}
                  onChange={e => setInviteCode(e.target.value)}
                />
                
                {error && <p className="text-rose-400 text-[10px] font-bold text-center uppercase tracking-widest">{error}</p>}

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="flex-1 bg-neutral-800 text-white font-bold py-3 rounded-xl text-[10px] uppercase tracking-widest"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-white text-black font-black py-3 rounded-xl text-[10px] uppercase tracking-widest hover:bg-neutral-200 transition-all disabled:opacity-50"
                  >
                    {loading ? "Validando..." : "Validar"}
                  </button>
                </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default AuthView;
