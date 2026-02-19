
import React, { useState, useEffect, useRef } from 'react';
import { db, storage } from '../lib/firebase';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  doc,
  deleteDoc,
  getDocs,
  where,
  Timestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";
import { ChatMessage, UserStats, Group } from '../types';

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  userStats: UserStats;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ isOpen, onClose, userStats }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [groupData, setGroupData] = useState<Group | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-limpeza de imagens expiradas (Executa sempre que o chat abre)
  useEffect(() => {
    if (!isOpen) return;

    const cleanupExpiredImages = async () => {
      try {
        const q = query(
          collection(db, "chatImages"),
          where("expiresAt", "<", Timestamp.now())
        );
        const snapshot = await getDocs(q);
        
        for (const d of snapshot.docs) {
          const data = d.data();
          try {
            // Deleta do Storage
            const storageRef = ref(storage, data.storagePath);
            await deleteObject(storageRef);
          } catch (storageErr) {
            console.warn("Arquivo já removido do storage ou erro:", storageErr);
          }
          // Deleta documento do Firestore
          await deleteDoc(doc(db, "chatImages", d.id));
        }
      } catch (err) {
        console.error("Erro na rotina de limpeza:", err);
      }
    };

    cleanupExpiredImages();
  }, [isOpen]);

  // Carregar dados do Grupo
  useEffect(() => {
    if (!userStats.groupId || !isOpen) return;
    const unsubGroup = onSnapshot(doc(db, "groups", userStats.groupId), (doc) => {
      if (doc.exists()) setGroupData({ id: doc.id, ...doc.data() } as Group);
    });
    return () => unsubGroup();
  }, [userStats.groupId, isOpen]);

  // Carregar mensagens
  useEffect(() => {
    if (!userStats.groupId || !isOpen) return;

    const q = query(
      collection(db, "groups", userStats.groupId, "messages"),
      orderBy("timestamp", "asc"),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage));
      setMessages(msgs);
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 100);
    });

    return () => unsubscribe();
  }, [userStats.groupId, isOpen]);

  const handleSendMessage = async (e?: React.FormEvent, uploadedImageUrl?: string) => {
    if (e) e.preventDefault();
    if ((!newMessage.trim() && !uploadedImageUrl) || !userStats.groupId || loading) return;
    
    setLoading(true);
    try {
      await addDoc(collection(db, "groups", userStats.groupId, "messages"), {
        text: newMessage,
        senderId: userStats.uid,
        senderName: userStats.displayName,
        senderPhoto: userStats.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userStats.displayName}`,
        imageUrl: uploadedImageUrl || null,
        timestamp: serverTimestamp()
      });

      setNewMessage('');
    } catch (err) {
      console.error("Erro ao enviar mensagem:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userStats.groupId) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("A imagem é muito grande. O limite máximo é de 5MB.");
      return;
    }

    setIsUploading(true);
    
    try {
      // 1. Gerar ID único para a imagem
      const imageId = crypto.randomUUID();
      const storagePath = `chat-images/${userStats.groupId}/${imageId}`;
      const imageRef = ref(storage, storagePath);

      // 2. Upload para Firebase Storage
      await uploadBytes(imageRef, file);
      const publicUrl = await getDownloadURL(imageRef);

      // 3. Salvar metadados para controle de expiração
      await addDoc(collection(db, "chatImages"), {
        imageUrl: publicUrl,
        storagePath: storagePath,
        chatId: userStats.groupId,
        createdAt: serverTimestamp(),
        expiresAt: Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000)) // 24 horas
      });

      // 4. Enviar mensagem com a URL
      await handleSendMessage(undefined, publicUrl);
      
    } catch (err) {
      console.error("Erro no upload para Firebase Storage:", err);
      alert("Erro ao processar upload da imagem.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (!userStats.adm || !userStats.groupId) return;
    if (confirm("Deseja apagar esta mensagem?")) {
      await deleteDoc(doc(db, "groups", userStats.groupId, "messages", msgId));
    }
  };

  const handleImageError = (msgId: string) => {
    setImageErrors(prev => ({ ...prev, [msgId]: true }));
  };

  const formatTime = (ts: any) => {
    if (!ts) return '';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-[200] w-full sm:w-[450px] bg-[#0f0f0f] border-l border-neutral-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
      {/* HEADER */}
      <div className="p-5 border-b border-neutral-800 flex justify-between items-center bg-neutral-950/80 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black shadow-lg shadow-blue-600/20">
            {groupData?.name?.charAt(0).toUpperCase() || 'G'}
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider truncate max-w-[200px]">
              {groupData?.name || 'Carregando Grupo...'}
            </h3>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              <p className="text-[9px] text-neutral-500 font-black uppercase tracking-widest">Chat Ativo</p>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg text-neutral-500 hover:text-white transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m18 6-12 12"/><path d="m6 6 12 12"/></svg>
        </button>
      </div>

      {/* ÁREA DE MENSAGENS */}
      {!userStats.groupId ? (
        <div className="flex-grow flex flex-col items-center justify-center p-12 text-center text-neutral-500">
          <div className="w-20 h-20 bg-neutral-900 rounded-3xl flex items-center justify-center text-3xl mb-6 opacity-20 border border-neutral-800">💬</div>
          <p className="text-xs font-black uppercase tracking-widest text-neutral-400">Sem Grupo Ativo</p>
          <p className="text-[10px] mt-2 leading-relaxed max-w-[200px]">Crie ou entre em um grupo na aba Nexus Foco para liberar a comunicação.</p>
        </div>
      ) : (
        <>
          <div ref={scrollRef} className="flex-grow overflow-y-auto p-4 md:p-6 space-y-8 no-scrollbar bg-[#0f0f0f]">
            {messages.map((msg, i) => {
              const isMine = msg.senderId === userStats.uid;
              const showAvatar = i === 0 || messages[i-1].senderId !== msg.senderId;
              const isExpired = imageErrors[msg.id];

              return (
                <div key={msg.id} className={`flex gap-3 group ${isMine ? 'flex-row-reverse' : 'flex-row'} items-end animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                  {/* AVATAR */}
                  <div className={`shrink-0 mb-1 ${!showAvatar ? 'opacity-0' : ''}`}>
                    <img 
                      src={msg.senderPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.senderName}`} 
                      className="w-8 h-8 rounded-full border border-neutral-800 bg-neutral-900 object-cover" 
                      alt="" 
                    />
                  </div>

                  {/* BALÃO E CONTEÚDO */}
                  <div className={`max-w-[75%] space-y-1 ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
                    {showAvatar && (
                      <div className={`flex items-center gap-2 px-1 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                        <span className="text-[10px] font-black text-neutral-400 uppercase tracking-tight">{isMine ? 'Você' : msg.senderName}</span>
                        <span className="text-[8px] font-mono text-neutral-600">{formatTime(msg.timestamp)}</span>
                      </div>
                    )}
                    
                    <div className={`relative p-4 rounded-2xl text-sm leading-relaxed shadow-xl ${
                      isMine 
                        ? 'bg-blue-600 text-white rounded-tr-none' 
                        : 'bg-neutral-900 text-neutral-200 border border-neutral-800 rounded-tl-none'
                    }`}>
                      {msg.imageUrl && (
                        <div className="mb-3 rounded-xl overflow-hidden border border-black/20 bg-black/20 min-h-[100px] flex items-center justify-center">
                          {isExpired ? (
                            <div className="p-6 text-center space-y-2 opacity-50">
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                              <p className="text-[9px] font-black uppercase tracking-widest">Imagem Expirada</p>
                            </div>
                          ) : (
                            <img 
                              src={msg.imageUrl} 
                              alt="Anexo" 
                              className="w-full h-auto max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity" 
                              onError={() => handleImageError(msg.id)}
                              onClick={() => window.open(msg.imageUrl, '_blank')}
                            />
                          )}
                        </div>
                      )}
                      {msg.text && <p className="font-medium whitespace-pre-wrap">{msg.text}</p>}
                      
                      {userStats.adm && (
                        <button 
                          onClick={() => handleDeleteMessage(msg.id)} 
                          className="absolute -top-2 -right-2 w-6 h-6 bg-rose-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                          title="Excluir"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* INPUT FORM */}
          <form onSubmit={(e) => handleSendMessage(e)} className="p-4 md:p-6 border-t border-neutral-800 bg-neutral-950/50 backdrop-blur-md">
            <div className="relative flex items-center gap-2">
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/jpeg,image/png,image/webp"
                className="hidden" 
                onChange={handleFileChange}
              />
              <button 
                type="button"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
                className={`p-3 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-500 hover:text-blue-500 transition-all ${isUploading ? 'animate-pulse cursor-wait' : ''}`}
              >
                {isUploading ? (
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                )}
              </button>
              
              <div className="flex-grow relative">
                <input 
                  type="text" 
                  placeholder={isUploading ? "Enviando imagem..." : "Escreva algo para o grupo..."}
                  disabled={isUploading}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-4 px-5 pr-14 text-sm text-white focus:border-blue-600 outline-none transition-all placeholder:text-neutral-700 disabled:opacity-50"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                />
                <button 
                  type="submit"
                  disabled={(!newMessage.trim()) || loading || isUploading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-all disabled:opacity-20 shadow-lg shadow-blue-600/20"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
                </button>
              </div>
            </div>
          </form>
        </>
      )}
    </div>
  );
};

export default ChatSidebar;
