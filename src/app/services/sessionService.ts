import { Session } from '../types';

const SESSION_KEY = 'anonymous_notes_session';
const ADJECTIVES = [
  'Happy', 'Brave', 'Calm', 'Wise', 'Kind', 'Swift', 'Gentle', 'Bright',
  'Noble', 'Quiet', 'Bold', 'Cool', 'Clever', 'Warm', 'Silent', 'Peaceful'
];
const NOUNS = [
  'Panda', 'Phoenix', 'Dolphin', 'Tiger', 'Eagle', 'Wolf', 'Bear', 'Lion',
  'Owl', 'Fox', 'Hawk', 'Raven', 'Deer', 'Koala', 'Penguin', 'Whale'
];

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateNickname(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(Math.random() * 999);
  return `${adj}${noun}${num}`;
}

export function getOrCreateSession(): Session {
  const stored = localStorage.getItem(SESSION_KEY);
  
  if (stored) {
    try {
      return JSON.parse(stored) as Session;
    } catch (e) {
      // Invalid session, create new one
    }
  }

  const newSession: Session = {
    id: generateSessionId(),
    nickname: generateNickname(),
    createdAt: Date.now(),
    postCount: 0,
    lastPostTime: 0,
    postHistory: []
  };

  localStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
  return newSession;
}

export function updateSession(session: Session): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function getCurrentSession(): Session {
  return getOrCreateSession();
}

export function updateNickname(nickname: string): void {
  const session = getCurrentSession();
  session.nickname = nickname;
  updateSession(session);
}
