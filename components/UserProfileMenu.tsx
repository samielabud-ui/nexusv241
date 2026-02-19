
import React, { useState, useRef, useEffect } from 'react';
import { UserStats, DayFocus } from '../types';
import { auth, db } from '../lib/firebase';
import { signOut, updatePassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import InviteManager from './InviteManager';

interface UserProfileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  userStats: UserStats;
  onNavigateAdmin?: () => void;
}

const AVATARS = Array.from({ length: 20 }, (_, i) => `https://api.dicebear.com/7.x/avataaars/svg?seed=Nexus${i}&backgroundColor=b6e3f4`);

const UserProfileMenu: React.FC<UserProfileMenuProps> = ({ isOpen, onClose, userStats, onNavigateAdmin }) => {
  const [activeTab, setActiveTab] = useState<'menu' | 'stats' | 'invite' | 'edit'>('menu');
  const [loading, setLoading] = useState(false);
  
  const [editName, setEditName] = useState(userStats.displayName);
  const [editBio, setEditBio] = useState(userStats.bio || '');
  const [editAvatar, setEditAvatar] = useState(userStats.photoURL);
  const [newPass, setNewPass] = useState('');

  const menuRef = useRef<HTMLDivElement>(null);
  const isAdmin = userStats.role === 'admin' || userStats.adm === true;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLogout = () => signOut(auth);

  const handleSaveProfile = async () => {
    if (!userStats.uid) return;
    setLoading(true);
    try {
      const userRef = doc(db, "users", userStats.uid);
      await updateDoc(userRef, {
        displayName: editName,
        bio: editBio,
        photoURL: editAvatar
      });
      if (newPass && auth.currentUser) {
        await updatePassword(auth.currentUser, newPass);
      }
      alert("Perfil atualizado com sucesso!");
      setActiveTab('menu');
    } catch (err) {
      console.error(err);
      alert("Erro ao atualizar.");
    } finally {
      setLoading(false);
    }
  };

  const focusData = (userStats.focusData || {}) as Record<string, DayFocus>;
  const totalSeconds = Object.values(focusData).reduce((acc, day) => acc + (day as DayFocus).totalTime, 0);
  const formatTime = (s: number) => `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;

  const renderCalendar = () => {
    const today = new Date();
    const days = Array.from({ length: 90 }, (_, i) => {
      const d = new Date();
      d.setDate(today.getDate() - (89 - i));
      return d.toISOString().split('T')[0];
    });

    return (
      <div className="grid grid-cols-10 gap-1.5">
        {days.map(date => {
          const time = focusData[date]?.totalTime || 0;
          let color = "bg-neutral-800";
          if (time > 0) color = "bg-nexus-green/20";
          if (time > 1800) color = "bg-nexus-green/40";
          if (time > 3600) color = "bg-nexus-green/70";
          if (time > 10800) color = "bg-nexus-green";
          
          return <div key={date} className={`w-full aspect-square rounded-sm ${color}`} title={`${date}: ${formatTime(time as number)}`} />;
        })}
      </div>
    );
  };

  return (
    <div className="absolute right-4 md:right-8 top-16 z-[100] animate-in slide-in-from-top-2 duration-200">
      <div ref={menuRef} className="w-80 bg-nexus-card border border-nexus-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[600px]">
        
        <div className="p-4 border-b border-nexus-border bg-nexus-surface/50 flex items-center gap-3">
          <img src={userStats.photoURL} alt="" className="w-10 h-10 rounded-xl object-cover border border-nexus-border" />
          <div className="min-w-0">
            <p className="text-xs font-black text-white truncate uppercase italic">{userStats.displayName}</p>
            <p className="text-[9px] text-nexus-text-label font-bold uppercase tracking-widest truncate">{userStats.medCourse} • {userStats.semester}º Sem</p>
          </div>
        </div>

        <div className="p-3 space-y-1 overflow-y-auto no-scrollbar">
          {activeTab === 'menu' && (
            <>
              <button onClick={() => setActiveTab('stats')} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-nexus-hover text-nexus-text-main text-[10px] font-black uppercase tracking-widest transition-all">
                <span className="text-sm">📊</span> Estatísticas Foco
              </button>
              <button onClick={() => setActiveTab('invite')} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-nexus-hover text-nexus-text-main text-[10px] font-black uppercase tracking-widest transition-all">
                <span className="flex items-center gap-3"><span className="text-sm">🎟️</span> Convites</span>
                {(userStats.invitesAvailable! > 0 || isAdmin) && <span className="w-4 h-4 bg-nexus-blue rounded-full text-[8px] flex items-center justify-center text-black font-black">{isAdmin ? '∞' : '1'}</span>}
              </button>
              <button onClick={() => setActiveTab('edit')} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-nexus-hover text-nexus-text-main text-[10px] font-black uppercase tracking-widest transition-all">
                <span className="text-sm">👤</span> Editar Perfil
              </button>
              {isAdmin && (
                <button onClick={() => { onNavigateAdmin?.(); onClose(); }} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-blue-600/10 text-nexus-blue text-[10px] font-black uppercase tracking-widest transition-all">
                  <span className="text-sm">⚙️</span> Admin
                </button>
              )}
              <div className="h-px bg-nexus-border my-1 mx-2"></div>
              <button onClick={handleLogout} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-rose-500/10 text-rose-500 text-[10px] font-black uppercase tracking-widest transition-all">
                <span className="text-sm">⎋</span> Sair
              </button>
            </>
          )}

          {activeTab === 'stats' && (
            <div className="p-2 space-y-4 animate-in fade-in duration-300">
               <button onClick={() => setActiveTab('menu')} className="text-[9px] font-black text-nexus-text-label uppercase hover:text-white">← Voltar</button>
               <div>
                  <p className="text-[10px] font-black text-nexus-text-label uppercase tracking-widest">Tempo Total Acumulado</p>
                  <p className="text-2xl font-black text-nexus-green italic tracking-tighter">{formatTime(totalSeconds)}</p>
               </div>
               <div className="pt-2">
                  <p className="text-[10px] font-black text-nexus-text-label uppercase tracking-widest mb-3">Intensidade (Últimos 90 dias)</p>
                  {renderCalendar()}
               </div>
            </div>
          )}

          {activeTab === 'edit' && (
            <div className="p-2 space-y-4 animate-in fade-in duration-300 overflow-y-auto no-scrollbar">
               <button onClick={() => setActiveTab('menu')} className="text-[9px] font-black text-nexus-text-label uppercase hover:text-white">← Voltar</button>
               <div className="space-y-3">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {AVATARS.map((url, i) => (
                      <button key={i} onClick={() => setEditAvatar(url)} className={`w-8 h-8 rounded-lg border-2 transition-all ${editAvatar === url ? 'border-nexus-blue scale-110' : 'border-nexus-border opacity-50'}`}>
                        <img src={url} alt="" className="w-full h-full" />
                      </button>
                    ))}
                  </div>
                  <input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Nome" className="w-full bg-nexus-surface border border-nexus-border rounded-xl p-3 text-xs text-white outline-none focus:border-nexus-blue" />
                  <textarea value={editBio} onChange={e => setEditBio(e.target.value)} placeholder="Bio (Ex: Futura Neurologista 🧠✨)" className="w-full bg-nexus-surface border border-nexus-border rounded-xl p-3 text-xs text-white h-20 outline-none focus:border-nexus-blue resize-none" />
                  <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Nova Senha (Opcional)" className="w-full bg-nexus-surface border border-nexus-border rounded-xl p-3 text-xs text-white outline-none focus:border-nexus-blue" />
                  <button onClick={handleSaveProfile} disabled={loading} className="w-full bg-nexus-blue text-black font-black py-3 rounded-xl text-[10px] uppercase tracking-widest">Salvar Alterações</button>
               </div>
            </div>
          )}

          {activeTab === 'invite' && (
            <div className="p-2 animate-in fade-in duration-300">
               <button onClick={() => setActiveTab('menu')} className="text-[9px] font-black text-nexus-text-label uppercase hover:text-white mb-4 block">← Voltar</button>
               <InviteManager userStats={userStats} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfileMenu;
