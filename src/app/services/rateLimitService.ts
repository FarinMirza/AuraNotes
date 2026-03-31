import { Session } from '../types';
import { updateSession } from './sessionService';

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_POSTS_PER_WINDOW = 5;
const COOLDOWN_PERIOD = 30 * 1000; // 30 seconds between posts

export function checkRateLimit(session: Session): {
  allowed: boolean;
  error?: string;
  remainingTime?: number;
} {
  const now = Date.now();

  // Check cooldown period
  if (session.lastPostTime && now - session.lastPostTime < COOLDOWN_PERIOD) {
    const remainingTime = COOLDOWN_PERIOD - (now - session.lastPostTime);
    return {
      allowed: false,
      error: `Please wait ${Math.ceil(remainingTime / 1000)} seconds before posting again`,
      remainingTime
    };
  }

  // Clean up old posts from history
  const recentPosts = session.postHistory.filter(
    timestamp => now - timestamp < RATE_LIMIT_WINDOW
  );

  // Check rate limit
  if (recentPosts.length >= MAX_POSTS_PER_WINDOW) {
    return {
      allowed: false,
      error: `Rate limit exceeded. Maximum ${MAX_POSTS_PER_WINDOW} posts per minute.`,
      remainingTime: RATE_LIMIT_WINDOW - (now - recentPosts[0])
    };
  }

  return { allowed: true };
}

export function recordPost(session: Session): Session {
  const now = Date.now();
  
  // Update session
  const updatedSession = {
    ...session,
    postCount: session.postCount + 1,
    lastPostTime: now,
    postHistory: [
      ...session.postHistory.filter(t => now - t < RATE_LIMIT_WINDOW),
      now
    ]
  };

  updateSession(updatedSession);
  return updatedSession;
}

export function getCooldownRemaining(session: Session): number {
  if (!session.lastPostTime) return 0;
  const elapsed = Date.now() - session.lastPostTime;
  return Math.max(0, COOLDOWN_PERIOD - elapsed);
}
