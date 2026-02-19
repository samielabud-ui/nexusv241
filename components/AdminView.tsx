
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { db, auth } from '../lib/firebase';
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  deleteDoc, 
  updateDoc, 
  addDoc, 
  serverTimestamp, 
  orderBy, 
  limit,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { Group, UserStats, AdminLog, ChatMessage } from '../types';
import AdminAcademiaGen from './AdminAcademiaGen';

interface AdminViewProps {
  userStats: UserStats;
}

const AdminView: React.FC<AdminViewProps> = ({ userStats }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'chats' | 'usuarios' | 'logs' | 'moderador' | 'academia'>('dashboard');
  const [groups, setGroups] = useState<Group[]>([]);
  const [users, setUsers] = useState<UserStats[]>([]);
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [selectedChat, setSelectedChat] = useState<Group | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const currentUserStats = useRef<UserStats | null>(null);

  // Carregamento de dados globais
  useEffect(() => {
    // Escuta Usuários
    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      setUsers(snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserStats)));
      const current = snap.docs.find(d => d.id === auth.currentUser?.uid);
      if (current) currentUserStats.current = current.data() as UserStats;
    });

    // Escuta Grupos
    const unsubGroups = onSnapshot(collection(db, "groups"), (snap) => {
      setGroups(snap.docs.map(d => ({ id: d.id, ...d.data() } as Group)));
    });

    // Escuta Logs
    const qLogs = query(collection(db, "adminLogs"), orderBy("timestamp", "desc"), limit(100));
    const unsubLogs = onSnapshot(qLogs, (snap) => {
      setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as AdminLog)));
    });

    return () => { unsubUsers(); unsubGroups(); unsubLogs(); };
  }, []);

  // Escuta Mensagens do Chat Selecionado (Modo Moderador)
  useEffect(() => {
    if (activeTab !== 'moderador' || !selectedChat) return;
    const q = query(collection(db, "groups", selectedChat.id, "messages"), orderBy("timestamp", "desc"), limit(50));
    const unsub = onSnapshot(q, (snap) => {
      setChatMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage)));
    });
    return () => unsub();
  }, [activeTab, selectedChat]);

  // --- Ações Administrativas ---
  const createLog = async (action: string, targetId: string, details: string) => {
    try {
      await addDoc(collection(db, "adminLogs"), {
        timestamp: serverTimestamp(),
        adminId: auth.currentUser?.uid || 'unknown',
        adminName: currentUserStats.current?.displayName || 'Admin',
        action,
        targetId,
        details
      });
    } catch (err) { console.error("Erro ao logar ação:", err); }
  };

  const handleBanUser = async (user: UserStats) => {
    if (!user.uid) return;
    const newStatus = !user.isBanned;
    if (confirm(`Deseja ${newStatus ? 'BANIR' : 'DESBANIR'} o usuário ${user.displayName}?`)) {
      await updateDoc(doc(db, "users", user.uid), { isBanned: newStatus });
      createLog(newStatus ? 'BAN_USER' : 'UNBAN_USER', user.uid, `Usuário: ${user.displayName}`);
    }
  };

  const handleChangeRole = async (uid: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (confirm(`Mudar permissão para ${newRole.toUpperCase()}?`)) {
      await updateDoc(doc(db, "users", uid), { role: newRole, adm: newRole === 'admin' });
      createLog('CHANGE_ROLE', uid, `Nova role: ${newRole}`);
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (!selectedChat) return;
    if (confirm("Apagar esta mensagem permanentemente?")) {
      await deleteDoc(doc(db, "groups", selectedChat.id, "messages", msgId));
      createLog('DELETE_MSG', selectedChat.id, `Mensagem ID: ${msgId}`);
    }
  };

  const handleCloseChat = async (chat: Group) => {
    if (confirm("Deseja encerrar este chat? Os usuários não poderão mais enviar mensagens.")) {
      await updateDoc(doc(db, "groups", chat.id), { status: 'closed' });
      createLog('CLOSE_CHAT', chat.id, `Chat: ${chat.name}`);
    }
  };

  const handleDeleteChat = async (id: string, name: string) => {
    if (confirm(`APAGAR PERMANENTEMENTE o grupo "${name}"? Esta ação é irreversível.`)) {
      await deleteDoc(doc(db, "groups", id));
      createLog('DELETE_CHAT', id, `Grupo: ${name}`);
    }
  };

  // --- Filtros ---
  const filteredUsers = users.filter(u => 
    u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredGroups = groups.filter(g => 
    g.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- Componentes de Renderização ---

  const SidebarItem = ({ id, label, icon }: { id: typeof activeTab, label: string, icon: string }) => (
    <button 
      onClick={() => { setActiveTab(id); setSearchTerm(''); }}
      className={`w-full flex items-center gap-3 px-6 py-4 text-sm font-bold uppercase tracking-widest transition-all border-r-4 ${activeTab === id ? 'bg-blue-600/10 text-blue-500 border-blue-600' : 'text-neutral-500 hover:text-white hover:bg-neutral-900 border-transparent'}`}
    >
      <span className="text-lg">{icon}</span>
      {label}
    </button>
  );

  const formatTime = (ts: any) => {
    if (!ts) return '—';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-[85vh] bg-[#0a0a0a] rounded-[2.5rem] overflow-hidden border border-neutral-800 shadow-2xl animate-in fade-in duration-500 mt-4 mb-20">
      
      {/* SIDEBAR */}
      <aside className="w-full lg:w-72 border-r border-neutral-800 bg-[#0f0f0f] shrink-0">
        <div className="p-8 border-b border-neutral-800">
           <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center font-black text-2xl text-white shadow-lg shadow-blue-600/20 mb-4">N</div>
           <h2 className="text-xl font-black text-white italic tracking-tighter uppercase">Painel Nexus</h2>
           <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-[0.2em] mt-1">Admin Central</p>
        </div>
        <nav className="py-4">
          <SidebarItem id="dashboard" label="Dashboard" icon="📊" />
          <SidebarItem id="academia" label="Academia GenIA" icon="🧬" />
          <SidebarItem id="chats" label="Gerenciar Chats" icon="💬" />
          <SidebarItem id="usuarios" label="Usuários" icon="👤" />
          <SidebarItem id="logs" label="Logs de Atividade" icon="📜" />
        </nav>
      </aside>

      {/* ÁREA DE CONTEÚDO */}
      <main className="flex-grow flex flex-col min-w-0 bg-[#0a0a0a]">
        
        {/* HEADER DA PÁGINA */}
        <header className="p-8 border-b border-neutral-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tight">
              {activeTab === 'dashboard' && 'Visão Geral'}
              {activeTab === 'academia' && 'Geração de Conteúdo IA'}
              {activeTab === 'chats' && 'Central de Conversas'}
              {activeTab === 'usuarios' && 'Base de Estudantes'}
              {activeTab === 'logs' && 'Histórico de Segurança'}
              {activeTab === 'moderador' && `Moderando: ${selectedChat?.name}`}
            </h1>
            <p className="text-xs text-neutral-500 mt-1">Bem-vindo ao centro de operações NexusBQ.</p>
          </div>
          {(activeTab === 'chats' || activeTab === 'usuarios') && (
            <div className="relative">
              <input 
                type="text" 
                placeholder="Buscar..." 
                className="bg-neutral-900 border border-neutral-800 text-white text-xs rounded-xl py-3 pl-10 pr-4 w-full md:w-64 focus:outline-none focus:border-blue-600 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </div>
          )}
        </header>

        <div className="p-8 flex-grow overflow-y-auto no-scrollbar">
          
          {/* TAB: ACADEMIA GENIA */}
          {activeTab === 'academia' && (
            <div className="animate-in fade-in duration-500">
               <AdminAcademiaGen user={userStats} />
            </div>
          )}

          {/* TAB: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'Usuários', val: users.length, icon: '👥', color: 'text-blue-500' },
                  { label: 'Chats Ativos', val: groups.filter(g => g.status !== 'closed').length, icon: '🔥', color: 'text-orange-500' },
                  { label: 'Eventos Log', val: logs.length, icon: '📜', color: 'text-emerald-500' },
                  { label: 'Aulas Assistidas', val: users.reduce((acc, u) => acc + (u.watchedLessons?.length || 0), 0), icon: '📺', color: 'text-purple-500' },
                ].map((stat, i) => (
                  <div key={i} className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl shadow-sm hover:border-neutral-700 transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-2xl">{stat.icon}</span>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${stat.color}`}>{stat.label}</span>
                    </div>
                    <p className="text-4xl font-black text-white tracking-tighter">{stat.val}</p>
                  </div>
                ))}
              </div>
              
              <div className="bg-neutral-900 border border-neutral-800 rounded-[2rem] p-8">
                 <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6">Status da Plataforma</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                       <p className="text-xs text-neutral-400 font-bold uppercase">Distribuição de Planos</p>
                       <div className="h-4 w-full bg-neutral-800 rounded-full overflow-hidden flex">
                          <div className="h-full bg-blue-600" style={{ width: `${(users.filter(u => u.isPremium).length / users.length) * 100}%` }}></div>
                          <div className="h-full bg-neutral-700" style={{ width: `${(users.filter(u => !u.isPremium).length / users.length) * 100}%` }}></div>
                       </div>
                       <div className="flex gap-6 text-[10px] font-bold uppercase tracking-widest">
                          <span className="flex items-center gap-2 text-blue-500"><div className="w-2 h-2 bg-blue-600 rounded-full"></div> Premium</span>
                          <span className="flex items-center gap-2 text-neutral-400"><div className="w-2 h-2 bg-neutral-700 rounded-full"></div> Básico</span>
                       </div>
                    </div>
                    <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 flex items-center justify-between">
                       <div>
                          <p className="text-[10px] font-black text-emerald-500 uppercase">Integridade Firebase</p>
                          <p className="text-xs text-neutral-400 mt-1">Conexão estável (v10.8.0)</p>
                       </div>
                       <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]"></div>
                    </div>
                 </div>
              </div>
            </div>
          )}

          {/* TAB: CHATS */}
          {activeTab === 'chats' && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-[2rem] overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-neutral-800 text-[10px] font-black text-neutral-500 uppercase tracking-widest">
                    <th className="p-6">Nome do Grupo</th>
                    <th className="p-6">Membros</th>
                    <th className="p-6">Status</th>
                    <th className="p-6 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGroups.map(g => (
                    <tr key={g.id} className="border-b border-neutral-800/50 hover:bg-white/5 transition-colors">
                      <td className="p-6">
                        <p className="text-sm font-bold text-white">{g.name}</p>
                        <p className="text-[10px] text-neutral-500 mt-1">ID: {g.id}</p>
                      </td>
                      <td className="p-6 text-xs text-neutral-400">{g.members.length} Estudantes</td>
                      <td className="p-6">
                        {g.status === 'closed' ? (
                          <span className="text-[9px] font-black bg-rose-600/20 text-rose-500 px-2 py-1 rounded uppercase">Encerrado</span>
                        ) : (
                          <span className="text-[9px] font-black bg-emerald-600/20 text-emerald-500 px-2 py-1 rounded uppercase">Ativo</span>
                        )}
                      </td>
                      <td className="p-6 text-right space-x-2">
                        <button 
                          onClick={() => { setSelectedChat(g); setActiveTab('moderador'); }}
                          className="px-3 py-1.5 bg-blue-600/10 text-blue-500 text-[9px] font-black uppercase rounded-lg border border-blue-600/20 hover:bg-blue-600 hover:text-white transition-all"
                        >
                          👁️ Entrar
                        </button>
                        <button 
                          onClick={() => handleCloseChat(g)}
                          disabled={g.status === 'closed'}
                          className="px-3 py-1.5 bg-orange-600/10 text-orange-500 text-[9px] font-black uppercase rounded-lg border border-orange-600/20 hover:bg-orange-600 hover:text-white transition-all disabled:opacity-30"
                        >
                          🛑 Fechar
                        </button>
                        <button 
                          onClick={() => handleDeleteChat(g.id, g.name)}
                          className="px-3 py-1.5 bg-rose-600/10 text-rose-500 text-[9px] font-black uppercase rounded-lg border border-rose-600/20 hover:bg-rose-600 hover:text-white transition-all"
                        >
                          🗑️ Apagar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB: USUARIOS */}
          {activeTab === 'usuarios' && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-[2rem] overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-neutral-800 text-[10px] font-black text-neutral-500 uppercase tracking-widest">
                    <th className="p-6">Estudante</th>
                    <th className="p-6">Ciclo/Semestre</th>
                    <th className="p-6">Role</th>
                    <th className="p-6">Status</th>
                    <th className="p-6 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u.uid} className="border-b border-neutral-800/50 hover:bg-white/5 transition-colors">
                      <td className="p-6 flex items-center gap-3">
                        <img src={u.photoURL} className="w-8 h-8 rounded-lg" alt="" />
                        <div>
                          <p className="text-sm font-bold text-white">{u.displayName}</p>
                          <p className="text-[10px] text-neutral-500">{u.email || 'sem-email@nexus.com'}</p>
                        </div>
                      </td>
                      <td className="p-6">
                        <p className="text-[10px] text-neutral-300 font-bold uppercase">{u.ciclo}</p>
                        <p className="text-[10px] text-neutral-500 mt-1">{u.semester}º Semestre</p>
                      </td>
                      <td className="p-6">
                         <span className={`text-[9px] font-black px-2 py-1 rounded uppercase ${u.role === 'admin' ? 'bg-blue-600 text-white' : 'bg-neutral-800 text-neutral-400'}`}>
                           {u.role || 'user'}
                         </span>
                      </td>
                      <td className="p-6">
                        {u.isBanned ? (
                          <span className="text-[9px] font-black bg-rose-600/20 text-rose-500 px-2 py-1 rounded uppercase">Banido</span>
                        ) : (
                          <span className="text-[9px] font-black bg-emerald-600/20 text-emerald-500 px-2 py-1 rounded uppercase">Ativo</span>
                        )}
                      </td>
                      <td className="p-6 text-right space-x-2">
                        <button 
                          onClick={() => u.uid && handleChangeRole(u.uid, u.role || 'user')}
                          className="px-3 py-1.5 bg-neutral-800 text-neutral-300 text-[9px] font-black uppercase rounded-lg hover:bg-white hover:text-black transition-all"
                        >
                          🔑 Role
                        </button>
                        <button 
                          onClick={() => handleBanUser(u)}
                          className={`px-3 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all ${u.isBanned ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}
                        >
                          {u.isBanned ? '✅ Reativar' : '🚫 Banir'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB: LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              {logs.map(log => (
                <div key={log.id} className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl flex items-center justify-between gap-6 hover:border-neutral-700 transition-all">
                   <div className="flex items-center gap-6">
                      <div className="w-10 h-10 bg-neutral-800 rounded-xl flex items-center justify-center text-xs">📜</div>
                      <div>
                         <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{log.action}</span>
                            <span className="text-[10px] text-neutral-600 font-mono">{formatTime(log.timestamp)}</span>
                         </div>
                         <p className="text-sm text-neutral-300 mt-1 font-medium">{log.details}</p>
                         <p className="text-[9px] text-neutral-600 uppercase mt-1">Admin: {log.adminName} ({log.adminId})</p>
                      </div>
                   </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB: MODERADOR (Dentro de um Chat) */}
          {activeTab === 'moderador' && selectedChat && (
            <div className="animate-in slide-in-from-right duration-300 space-y-6">
              <div className="flex justify-between items-center bg-blue-600/5 p-6 rounded-3xl border border-blue-600/20">
                 <div className="flex items-center gap-4">
                    <button onClick={() => { setActiveTab('chats'); setSelectedChat(null); }} className="p-2 hover:bg-white/5 rounded-xl text-neutral-400 hover:text-white transition-all">
                       <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                    </button>
                    <h3 className="font-black text-white uppercase italic tracking-tight">Moderação de Canal: {selectedChat.name}</h3>
                 </div>
                 <div className="flex gap-2">
                    <span className="text-[9px] font-black bg-blue-600 text-white px-3 py-1 rounded-full uppercase">Modo Visualização</span>
                 </div>
              </div>

              <div className="bg-neutral-900 border border-neutral-800 rounded-[2.5rem] p-8 space-y-8 h-[600px] overflow-y-auto no-scrollbar">
                 {chatMessages.length > 0 ? chatMessages.map(msg => (
                   <div key={msg.id} className="flex gap-4 group">
                      <img src={msg.senderPhoto} className="w-10 h-10 rounded-xl border border-neutral-800 object-cover" alt="" />
                      <div className="flex-grow">
                         <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                               <span className="text-[10px] font-black text-white uppercase">{msg.senderName}</span>
                               <span className="text-[9px] text-neutral-600 font-mono">{formatTime(msg.timestamp)}</span>
                            </div>
                            <button 
                              onClick={() => handleDeleteMessage(msg.id)}
                              className="opacity-0 group-hover:opacity-100 p-2 bg-rose-600/10 text-rose-500 rounded-lg hover:bg-rose-600 hover:text-white transition-all"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                            </button>
                         </div>
                         {msg.imageUrl && (
                           <img src={msg.imageUrl} className="mt-2 rounded-xl max-h-48 border border-neutral-800" alt="" />
                         )}
                         <p className="text-sm text-neutral-400 mt-1 leading-relaxed">{msg.text}</p>
                      </div>
                   </div>
                 )) : (
                   <div className="h-full flex items-center justify-center text-neutral-600 font-black uppercase text-xs">Nenhuma mensagem encontrada neste histórico.</div>
                 )}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default AdminView;
