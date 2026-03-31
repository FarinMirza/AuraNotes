import { useState } from 'react';
import { motion } from 'motion/react';
import { Note, ReactionType } from '../types';
import { Button } from './ui/button';
import { Heart, Handshake, Smile, Flag, EyeOff } from 'lucide-react';
import { addReaction, removeReaction, getUserReactions } from '../services/storageService';
import { ReportDialog } from './ReportDialog';

interface NoteCardProps {
  note: Note;
  sessionId: string;
  onUpdate: () => void;
}

export function NoteCard({ note, sessionId, onUpdate }: NoteCardProps) {
  const [showReportDialog, setShowReportDialog] = useState(false);
  const userReactions = getUserReactions(sessionId);
  const userReaction = userReactions.find(r => r.noteId === note.id);

  const handleReaction = async (type: ReactionType) => {
    if (userReaction?.reactionType === type) {
      // Remove reaction
      await removeReaction(sessionId, note.id);
    } else {
      // Add or change reaction
      await addReaction(sessionId, note.id, type);
    }
    onUpdate();
  };

  const formatTimeAgo = (timestamp: number): string => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (note.hidden) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-4">
        <div className="flex items-center gap-2 text-gray-500">
          <EyeOff className="w-5 h-5" />
          <p className="text-sm">This note has been hidden due to multiple reports.</p>
        </div>
      </div>
    );
  }

  const isOwnNote = note.sessionId === sessionId;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      layout
      className="bg-white/60 backdrop-blur-md rounded-2xl shadow-sm hover:shadow-md border border-white/50 p-6 mb-5 transition-all group hover:bg-white/70"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm">
            {note.nickname.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-slate-800">{note.nickname}</p>
            <p className="text-xs text-slate-400 font-medium tracking-wide uppercase">{formatTimeAgo(note.timestamp)}</p>
          </div>
        </div>
        {!isOwnNote && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowReportDialog(true)}
            className="text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Flag className="w-4 h-4" />
          </Button>
        )}
      </div>

      <p className="text-slate-700 mb-5 whitespace-pre-wrap break-words leading-relaxed text-base">
        {note.content}
      </p>

      <div className="flex items-center gap-2 pt-4 border-t border-slate-100/50">
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant={userReaction?.reactionType === 'like' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleReaction('like')}
            className={`flex items-center gap-1.5 rounded-full ${userReaction?.reactionType === 'like' ? 'bg-pink-500 hover:bg-pink-600 text-white border-0 shadow-md shadow-pink-500/20' : 'bg-white/50 text-slate-600 border-slate-200 hover:bg-pink-50 hover:text-pink-600 hover:border-pink-200'}`}
          >
            <Heart className="w-4 h-4 ml-0.5" fill={userReaction?.reactionType === 'like' ? 'currentColor' : 'none'} />
            <span className="font-semibold pr-0.5">{note.reactions.like || 0}</span>
          </Button>
        </motion.div>

        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant={userReaction?.reactionType === 'support' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleReaction('support')}
            className={`flex items-center gap-1.5 rounded-full ${userReaction?.reactionType === 'support' ? 'bg-indigo-500 hover:bg-indigo-600 text-white border-0 shadow-md shadow-indigo-500/20' : 'bg-white/50 text-slate-600 border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200'}`}
          >
            <Handshake className="w-4 h-4 ml-0.5" fill={userReaction?.reactionType === 'support' ? 'currentColor' : 'none'} />
            <span className="font-semibold pr-0.5">{note.reactions.support || 0}</span>
          </Button>
        </motion.div>

        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant={userReaction?.reactionType === 'hug' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleReaction('hug')}
            className={`flex items-center gap-1.5 rounded-full ${userReaction?.reactionType === 'hug' ? 'bg-amber-500 hover:bg-amber-600 text-white border-0 shadow-md shadow-amber-500/20' : 'bg-white/50 text-slate-600 border-slate-200 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200'}`}
          >
            <Smile className="w-4 h-4 ml-0.5" fill={userReaction?.reactionType === 'hug' ? 'currentColor' : 'none'} />
            <span className="font-semibold pr-0.5">{note.reactions.hug || 0}</span>
          </Button>
        </motion.div>

        {note.reportCount > 0 && (
          <span className="ml-auto text-[10px] uppercase tracking-wider font-semibold text-orange-400 bg-orange-50 px-2 py-1 rounded-full border border-orange-100">
            {note.reportCount} report{note.reportCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <ReportDialog
        noteId={note.id}
        sessionId={sessionId}
        isOpen={showReportDialog}
        onClose={() => setShowReportDialog(false)}
        onReported={onUpdate}
      />
    </motion.div>
  );
}
