import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Send, Loader2, AlertCircle, Clock } from 'lucide-react';
import { Session, Note } from '../types';
import { filterBadWords, validateContent, detectSpam } from '../services/moderationService';
import { checkRateLimit, recordPost, getCooldownRemaining } from '../services/rateLimitService';
import { saveNote, getRecentNoteContents } from '../services/storageService';
import { getCurrentSession, updateNickname } from '../services/sessionService';
import { toast } from 'sonner';

interface NoteComposerProps {
  session: Session;
  onNotePosted: () => void;
}

export function NoteComposer({ session, onNotePosted }: NoteComposerProps) {
  const [content, setContent] = useState('');
  const [nickname, setNickname] = useState(session.nickname);
  const [error, setError] = useState<string>('');
  const [isPosting, setIsPosting] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = getCooldownRemaining(getCurrentSession());
      setCooldown(remaining);
    }, 100);

    return () => clearInterval(interval);
  }, [session]);

  const handleNicknameChange = (value: string) => {
    setNickname(value);
    updateNickname(value);
  };

  const handlePost = async () => {
    setIsPosting(true);
    setError('');

    // Validate content
    const validation = validateContent(content);
    if (!validation.valid) {
      setError(validation.error || 'Invalid content');
      setIsPosting(false);
      return;
    }

    // Check rate limit
    const rateLimitCheck = checkRateLimit(session);
    if (!rateLimitCheck.allowed) {
      setError(rateLimitCheck.error || 'Rate limit exceeded');
      setIsPosting(false);
      return;
    }

    // Check for spam
    const recentNotes = await getRecentNoteContents();
    if (detectSpam(content, recentNotes)) {
      setError('Spam detected. Please post meaningful content.');
      setIsPosting(false);
      return;
    }

    try {
      // Filter bad words
      const filteredContent = filterBadWords(content);

      // Create note
      const newNote: Partial<Note> = {
        sessionId: session.id,
        nickname: nickname || session.nickname,
        content: filteredContent,
      };

      // Save note
      await saveNote(newNote);


      // Record post for rate limiting
      recordPost(session);

      // Clear form
      setContent('');
      setError('');

      // Notify parent
      onNotePosted();
      toast.success('Note posted successfully!', {
        description: 'Your anonymous thoughts are now live.',
      });
    } catch (err) {
      setError('Failed to post note. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  const characterCount = content.length;
  const maxCharacters = 500;
  const canPost = content.trim().length >= 3 && cooldown === 0 && !isPosting;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white/60 backdrop-blur-xl border border-white/50 rounded-3xl shadow-lg shadow-indigo-100/20 p-6 sm:p-8 mb-8"
    >
      <div className="mb-5">
        <Label htmlFor="nickname" className="text-sm font-semibold text-slate-700 ml-1">
          Anonymous Nickname <span className="text-slate-400 font-normal">(optional)</span>
        </Label>
        <Input
          id="nickname"
          value={nickname}
          onChange={(e) => handleNicknameChange(e.target.value)}
          placeholder="Your anonymous identity..."
          className="mt-2 bg-white/50 border-white/60 focus:bg-white focus:ring-indigo-500/30 transition-all shadow-inner rounded-xl h-11"
          maxLength={30}
        />
      </div>

      <div className="mb-5">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share your thoughts anonymously... Be kind and respectful."
          className="min-h-[140px] resize-none bg-white/50 border-white/60 focus:bg-white focus:ring-indigo-500/30 transition-all shadow-inner rounded-xl p-4 text-base leading-relaxed"
          maxLength={maxCharacters}
        />
        <div className="flex justify-between items-center mt-3 px-1">
          <span className={`text-xs font-medium tracking-wide ${characterCount > maxCharacters - 50 ? 'text-orange-500' : 'text-slate-400'}`}>
            {characterCount} / {maxCharacters} chars
          </span>
        </div>
      </div>

      {error && (
        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mb-5 p-3.5 bg-red-50/80 backdrop-blur-sm border border-red-200/50 rounded-xl flex items-start gap-2.5 shadow-sm">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-800 font-medium">{error}</p>
        </motion.div>
      )}

      {cooldown > 0 && (
        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mb-5 p-3.5 bg-indigo-50/80 backdrop-blur-sm border border-indigo-200/50 rounded-xl flex items-start gap-2.5 shadow-sm">
          <Clock className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-indigo-800 font-medium">
            Cooldown: {Math.ceil(cooldown / 1000)}s
          </p>
        </motion.div>
      )}

      <motion.div whileHover={{ scale: canPost ? 1.01 : 1 }} whileTap={{ scale: canPost ? 0.98 : 1 }}>
        <Button
          onClick={handlePost}
          disabled={!canPost}
          className="w-full h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold text-lg shadow-md hover:shadow-lg transition-all border-0"
        >
          {isPosting ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Posting...
            </>
          ) : (
            <>
              <Send className="w-5 h-5 mr-2" />
              Post Note
            </>
          )}
        </Button>
      </motion.div>

      <p className="text-xs text-slate-400 mt-4 text-center font-medium">
        Your note will be visible to everyone. Posts are moderated for safety.
      </p>
    </motion.div>
  );
}
