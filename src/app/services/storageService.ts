import { Note, UserReaction, Report } from '../types';
import { supabase } from './supabaseClient';

const REACTIONS_KEY = 'anonymous_notes_reactions';
const AUTO_HIDE_THRESHOLD = 3; // Hide notes after 3 reports

export async function getAllNotes(): Promise<Note[]> {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('hidden', false)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('CRITICAL: Supabase fetch error:', error.message, error.details, error.hint);
    return [];
  }

  return (data || []).map(transformNote);
}

export async function saveNote(note: Partial<Note>): Promise<void> {
  const { error } = await supabase
    .from('notes')
    .insert([{
      content: note.content,
      author_id: note.sessionId,
      author_name: note.nickname,
      color: (note as any).color, // Assuming color is added
      font_style: (note as any).fontStyle,
      likes: 0,
      supports: 0,
      hugs: 0,
      report_count: 0,
      hidden: false
    }]);

  if (error) {
    console.error('CRITICAL: Supabase insert error:', error.message, error.details, error.hint);
    throw error;
  }
}

export async function updateNote(noteId: string, updates: any): Promise<void> {
  const { error } = await supabase
    .from('notes')
    .update(updates)
    .eq('id', noteId);

  if (error) {
    console.error('Error updating note:', error);
  }
}

// Reactions
export function getUserReactions(sessionId: string): UserReaction[] {
  // We'll keep track of which notes the current user reacted to in localStorage 
  // for quick UI updates, but the counts are in Supabase.
  const stored = localStorage.getItem(REACTIONS_KEY);
  if (!stored) return [];
  
  try {
    const allReactions = JSON.parse(stored) as Record<string, UserReaction[]>;
    return allReactions[sessionId] || [];
  } catch (e) {
    return [];
  }
}

export async function addReaction(
  sessionId: string,
  noteId: string,
  reactionType: 'like' | 'support' | 'hug'
): Promise<void> {
  // 1. Update local storage record
  const stored = localStorage.getItem(REACTIONS_KEY);
  const allReactions: Record<string, UserReaction[]> = stored ? JSON.parse(stored) : {};
  
  if (!allReactions[sessionId]) {
    allReactions[sessionId] = [];
  }

  const existing = allReactions[sessionId].find(r => r.noteId === noteId);
  if (existing) {
    if (existing.reactionType === reactionType) return; // Already reacted
    // Remove old reaction count first
    await updateNoteReaction(noteId, existing.reactionType, -1);
  }

  allReactions[sessionId] = allReactions[sessionId].filter(r => r.noteId !== noteId);
  allReactions[sessionId].push({ noteId, reactionType });
  localStorage.setItem(REACTIONS_KEY, JSON.stringify(allReactions));
  
  // 2. Update Supabase count
  await updateNoteReaction(noteId, reactionType, 1);
}

export async function removeReaction(sessionId: string, noteId: string): Promise<void> {
  const stored = localStorage.getItem(REACTIONS_KEY);
  if (!stored) return;
  
  const allReactions: Record<string, UserReaction[]> = JSON.parse(stored);
  if (!allReactions[sessionId]) return;

  const existingReaction = allReactions[sessionId].find(r => r.noteId === noteId);
  if (existingReaction) {
    await updateNoteReaction(noteId, existingReaction.reactionType, -1);
  }

  allReactions[sessionId] = allReactions[sessionId].filter(r => r.noteId !== noteId);
  localStorage.setItem(REACTIONS_KEY, JSON.stringify(allReactions));
}

async function updateNoteReaction(
  noteId: string,
  reactionType: 'like' | 'support' | 'hug',
  delta: number
): Promise<void> {
  const column = reactionType === 'like' ? 'likes' : reactionType === 'support' ? 'supports' : 'hugs';
  
  // Use a Supabase RPC or a simple increment
  // For simplicity here, we'll fetch then update, but RPC is better for concurrency
  const { data: note } = await supabase
    .from('notes')
    .select(column)
    .eq('id', noteId)
    .single();

  if (note) {
    const newVal = Math.max(0, ((note as any)[column] || 0) + delta);
    await supabase
      .from('notes')
      .update({ [column]: newVal })
      .eq('id', noteId);
  }

}

// Reports
export async function addReport(
  noteId: string,
  reportedBy: string,
  reason: string
): Promise<boolean> {
  // Check if already reported (local check for speed, could be DB check)
  const { data: existing } = await supabase
    .from('reports')
    .select('id')
    .eq('note_id', noteId)
    .eq('reported_by', reportedBy)
    .single();

  if (existing) return false;

  const { error } = await supabase
    .from('reports')
    .insert([{
      note_id: noteId,
      reported_by: reportedBy,
      reason
    }]);

  if (error) return false;

  // Increment report count on note
  const { data: note } = await supabase
    .from('notes')
    .select('report_count')
    .eq('id', noteId)
    .single();

  if (note) {
    const newCount = (note.report_count || 0) + 1;
    const updates: any = { report_count: newCount };
    if (newCount >= AUTO_HIDE_THRESHOLD) {
      updates.hidden = true;
    }
    await updateNote(noteId, updates);
  }

  return true;
}

// Get recent notes for spam detection
export async function getRecentNoteContents(limit: number = 20): Promise<string[]> {
  const notes = await getAllNotes();
  return notes.slice(0, limit).map(n => n.content);
}

export async function hasUserReportedNote(sessionId: string, noteId: string): Promise<boolean> {
  const { data } = await supabase
    .from('reports')
    .select('id')
    .eq('note_id', noteId)
    .eq('reported_by', sessionId)
    .maybeSingle();

  return !!data;
}

// Helper to transform Supabase note to App Note type
function transformNote(dbNote: any): Note {
  return {
    id: dbNote.id,
    sessionId: dbNote.author_id,
    nickname: dbNote.author_name,
    content: dbNote.content,
    timestamp: new Date(dbNote.created_at).getTime(),
    reactions: {
      like: dbNote.likes || 0,
      support: dbNote.supports || 0,
      hug: dbNote.hugs || 0
    },
    reportCount: dbNote.report_count || 0,
    hidden: dbNote.hidden || false
  };
}

