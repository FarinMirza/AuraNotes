export interface Note {
  id: string;
  sessionId: string;
  nickname: string;
  content: string;
  timestamp: number;
  reactions: {
    like: number;
    support: number;
    hug: number;
  };
  reportCount: number;
  hidden: boolean;
}

export interface Session {
  id: string;
  nickname: string;
  createdAt: number;
  postCount: number;
  lastPostTime: number;
  postHistory: number[]; // timestamps of posts for rate limiting
}

export interface UserReaction {
  noteId: string;
  reactionType: 'like' | 'support' | 'hug';
}

export interface Report {
  noteId: string;
  reportedBy: string; // sessionId
  timestamp: number;
  reason: string;
}

export type ReactionType = 'like' | 'support' | 'hug';
