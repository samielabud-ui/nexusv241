
export interface Question {
  id: string;
  ciclo: string;
  modalidade: string;
  modulo: string;
  tema: string;
  problema: number;
  enunciado: string;
  alternativas: string[];
  gabarito: number;
}

export interface FocusSession {
  startTime: any;
  endTime: any;
  duration: number; // segundos
  contentTitle: string;
  contentType: "pdf" | "aula";
}

export interface DayFocus {
  totalTime: number; // total segundos no dia
  sessions: FocusSession[];
}

export interface ActivityItem {
  id: string;
  type: 'aula' | 'questoes' | 'apostila' | 'estudo';
  title: string;
  subtitle: string;
  timestamp: Date;
  metadata?: any;
}

export type UserRole = 'user' | 'admin' | 'superadmin';

// Adicionado: Interface para aulas assistidas
export interface VideoLesson {
  id: string;
  title: string;
}

// Adicionado: Interface para registro de última aula assistida
export interface LastWatched {
  lessonId: string;
  lessonTitle: string;
  courseName: string;
  platformId: string;
}

// Adicionado: Interface para logs administrativos
export interface AdminLog {
  id: string;
  timestamp: any;
  adminId: string;
  adminName: string;
  action: string;
  targetId: string;
  details: string;
}

export interface UserStats {
  uid?: string;
  displayName: string;
  photoURL?: string;
  bio?: string;
  totalAnswered: number;
  totalCorrect: number;
  totalErrors: number;
  streak: number;
  points: number;
  ciclo: string;
  isPremium: boolean;
  plan: 'basic' | 'premium';
  dailyUsage: number;
  openedContentIds?: string[];
  recentActivity?: ActivityItem[];
  studyActive: boolean;
  studyStartTime?: number | null;
  dailyStudyTime: number; 
  totalStudyTime: number; 
  themePreference?: 'dark' | 'light';
  medCourse?: string;
  semester?: string;
  birthday?: string;
  adm?: boolean;
  role?: UserRole;
  isBanned?: boolean;
  groupId?: string | null;
  setupComplete: boolean;
  institution?: string | null;
  invitesAvailable?: number;
  premiumExpiresAt?: any;
  // Novos campos Foco Nexus
  focusData?: Record<string, DayFocus>;
  showFocusPublic?: boolean;
  // Adicionado: Campos ausentes utilizados no app
  watchedLessons?: string[];
  lastWatched?: LastWatched | null;
  premiumEmoji?: string;
}

export interface Group {
  id: string;
  name: string;
  password?: string;
  creatorId: string;
  members: string[];
  status: 'active' | 'closed';
  createdAt: any;
}

export interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  senderPhoto?: string;
  imageUrl?: string;
  timestamp: any;
}
