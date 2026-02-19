
import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import StatsDashboard from './components/StatsDashboard';
import QuestionsView from './components/QuestionsView';
import PBLView from './components/PBLView';
import MorfoView from './components/MorfoView';
import HPView from './components/HPView';
import StudyView from './components/StudyView';
import ManualsView from './components/ManualsView';
import PremiumView from './components/PremiumView';
import AuthView from './components/AuthView';
import AdminView from './components/AdminView';
import ChatSidebar from './components/ChatSidebar';
import MandatoryUpdate from './components/MandatoryUpdate';
import CycleSelection from './components/CycleSelection';
import UserProfileMenu from './components/UserProfileMenu';
import InstitutionModal from './components/InstitutionModal';
import FocusToast from './components/FocusToast';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  doc, 
  getDoc, 
  updateDoc, 
  onSnapshot, 
  collection, 
  query, 
  increment, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { UserStats, ActivityItem, DayFocus, FocusSession } from './types';

const App: React.FC = () => {
  const [view, setView] = useState<'inicio' | 'questoes' | 'pbl' | 'premium' | 'morfo' | 'hp' | 'foco' | 'manuais' | 'admin'>('inicio');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [needsProfileUpdate, setNeedsProfileUpdate] = useState(false);
  const [needsInstitution, setNeedsInstitution] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  
  // Estados de Foco Nexus
  const [focusActive, setFocusActive] = useState(false);
  const [focusStartTime, setFocusStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [activeSessionInfo, setActiveSessionInfo] = useState<{ title: string, type: 'pdf' | 'aula' } | null>(null);
  const [focusToast, setFocusToast] = useState<{ title: string, type: 'pdf' | 'aula' } | null>(null);

  const [userStats, setUserStats] = useState<UserStats>({
    displayName: '',
    totalAnswered: 0,
    totalCorrect: 0,
    totalErrors: 0,
    streak: 0,
    points: 0,
    ciclo: '',
    isPremium: false,
    plan: 'basic',
    dailyUsage: 0,
    studyActive: false,
    dailyStudyTime: 0,
    totalStudyTime: 0,
    themePreference: 'dark',
    setupComplete: false,
    institution: null,
    invitesAvailable: 0
  });

  const [allUsersRanking, setAllUsersRanking] = useState<any[]>([]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // Motor do Cronômetro
  useEffect(() => {
    let interval: any;
    if (focusActive) {
      interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => clearInterval(interval);
  }, [focusActive]);

  useEffect(() => {
    let unsubStats: (() => void) | undefined;
    let unsubRanking: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (currentUser) {
          const userDocRef = doc(db, "users", currentUser.uid);
          const userSnap = await getDoc(userDocRef);
          
          if (userSnap.exists()) {
            const data = userSnap.data();
            if (data.isBanned) {
               alert("Conta banida.");
               auth.signOut();
               return;
            }
            
            if (!data.setupComplete) setNeedsSetup(true);
            else if (!data.medCourse) setNeedsProfileUpdate(true);
            else if (data.institution === undefined || data.institution === null) setNeedsInstitution(true);

            unsubStats = onSnapshot(userDocRef, (docSnap) => {
              if (docSnap.exists()) {
                const statsData = docSnap.data();
                setUserStats({ uid: currentUser.uid, ...statsData } as any);
                if (statsData.themePreference) setTheme(statsData.themePreference);
                if (statsData.institution) setNeedsInstitution(false);
              }
            });

            unsubRanking = onSnapshot(query(collection(db, "users")), (snapshot) => {
              setAllUsersRanking(snapshot.docs.map(doc => ({ id: doc.id, uid: doc.id, ...doc.data() })));
            });
          } else {
            setNeedsSetup(true);
          }
          setUser(currentUser);
        } else {
          setUser(null);
          setFocusActive(false);
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    });

    return () => { unsubscribeAuth(); if (unsubStats) unsubStats(); if (unsubRanking) unsubRanking(); };
  }, []);

  const handleEnterContent = (title: string, type: 'pdf' | 'aula') => {
    if (!focusActive) {
      setFocusToast({ title, type });
    }
  };

  const startFocus = (info?: { title: string, type: 'pdf' | 'aula' }) => {
    setFocusActive(true);
    setFocusStartTime(Date.now());
    setActiveSessionInfo(info || { title: "Sessão Livre", type: 'aula' });
    setFocusToast(null);
  };

  const stopFocus = async () => {
    if (!user || !focusStartTime) return;
    
    const now = Date.now();
    const duration = Math.floor((now - focusStartTime) / 1000);
    const today = new Date().toISOString().split('T')[0];
    const userRef = doc(db, "users", user.uid);
    
    const newSession: FocusSession = {
      startTime: focusStartTime,
      endTime: now,
      duration: duration,
      contentTitle: activeSessionInfo?.title || "Estudo Geral",
      contentType: activeSessionInfo?.type || "aula"
    };

    const currentFocusData = userStats.focusData || {};
    const dayData: DayFocus = currentFocusData[today] || { totalTime: 0, sessions: [] };
    
    const updatedFocusData = {
      ...currentFocusData,
      [today]: {
        totalTime: (dayData.totalTime || 0) + duration,
        sessions: [...(dayData.sessions || []), newSession]
      }
    };

    const earnedPoints = Math.floor(Math.pow(duration / 600, 1.5) * 5);

    try {
      await updateDoc(userRef, {
        focusData: updatedFocusData,
        points: increment(earnedPoints),
        totalStudyTime: increment(duration)
      });
    } catch (err) {
      console.error("Erro ao salvar foco:", err);
    }

    setFocusActive(false);
    setFocusStartTime(null);
    setActiveSessionInfo(null);
    setElapsedSeconds(0);
  };

  if (loading) return null;
  if (!user) return <AuthView />;
  if (needsSetup) return <CycleSelection onComplete={() => setNeedsSetup(false)} />;
  if (needsProfileUpdate) return <MandatoryUpdate userId={user.uid} onComplete={() => setNeedsProfileUpdate(false)} />;
  if (needsInstitution) return <InstitutionModal userId={user.uid} onComplete={() => setNeedsInstitution(false)} />;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-nexus-bg text-neutral-900 dark:text-nexus-text-main flex flex-col relative transition-colors duration-300">
      <Header 
        currentView={view} 
        onNavigate={setView} 
        userStats={userStats} 
        onOpenProfile={() => setProfileMenuOpen(!profileMenuOpen)}
        onToggleChat={() => setChatOpen(!chatOpen)}
        activeStudyTime={elapsedSeconds}
        isFocusActive={focusActive}
      />
      
      {focusToast && (
        <FocusToast 
          title={focusToast.title} 
          onActivate={() => startFocus(focusToast)} 
          onClose={() => setFocusToast(null)} 
        />
      )}

      {profileMenuOpen && (
        <UserProfileMenu 
          isOpen={profileMenuOpen} 
          onClose={() => setProfileMenuOpen(false)} 
          userStats={userStats} 
          onNavigateAdmin={() => setView('admin')}
        />
      )}

      <ChatSidebar isOpen={chatOpen} onClose={() => setChatOpen(false)} userStats={userStats} />
      
      <main className="max-w-[1400px] mx-auto pb-20 px-4 md:px-8 w-full flex-grow">
        {view === 'inicio' ? <StatsDashboard stats={userStats} allUsers={allUsersRanking} onNavigate={setView} /> : (
          <div className="pt-8">
            {view === 'questoes' && <QuestionsView userStats={userStats} onAddActivity={() => {}} />}
            {view === 'pbl' && <PBLView userStats={userStats} onAddActivity={() => {}} onEnterContent={handleEnterContent} />}
            {view === 'morfo' && <MorfoView userStats={userStats} onAddActivity={() => {}} onEnterContent={handleEnterContent} />}
            {view === 'hp' && <HPView userStats={userStats} onAddActivity={() => {}} onEnterContent={handleEnterContent} isPremium={userStats.isPremium} onNavigateToPremium={() => setView('premium')} onAwardPoints={() => {}} onIncrementUsage={() => {}} />}
            {view === 'premium' && <PremiumView userStats={userStats} onAddActivity={() => {}} onEnterContent={handleEnterContent} />}
            {view === 'manuais' && <ManualsView userStats={userStats} onAddActivity={() => {}} />}
            {view === 'admin' && <AdminView userStats={userStats} />}
            {view === 'foco' && (
              <StudyView 
                userStats={userStats} 
                onStart={() => startFocus()} 
                onStop={stopFocus} 
                allUsers={allUsersRanking}
                currentElapsed={elapsedSeconds}
                isFocusActive={focusActive}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
