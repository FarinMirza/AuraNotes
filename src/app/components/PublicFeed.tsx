import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Note } from '../types';
import { NoteCard } from './NoteCard';
import { getAllNotes } from '../services/storageService';
import { supabase } from '../services/supabaseClient';
import { Loader2, MessageSquare } from 'lucide-react';

interface PublicFeedProps {
  sessionId: string;
  refreshTrigger: number;
}

const NOTES_PER_PAGE = 10;

export function PublicFeed({ sessionId, refreshTrigger }: PublicFeedProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [displayedNotes, setDisplayedNotes] = useState<Note[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);

  const loadNotes = useCallback(async () => {
    setIsLoading(true);
    const allNotes = await getAllNotes();
    setNotes(allNotes);
    
    // Load first page
    const firstPage = allNotes.slice(0, NOTES_PER_PAGE);
    setDisplayedNotes(firstPage);
    setPage(1);
    setHasMore(allNotes.length > NOTES_PER_PAGE);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadNotes();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('public:notes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'notes' 
      }, () => {
        loadNotes();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadNotes, refreshTrigger]);

  const loadMore = useCallback(() => {
    if (isLoading || !hasMore) return;

    const nextPage = page + 1;
    const startIndex = page * NOTES_PER_PAGE;
    const endIndex = startIndex + NOTES_PER_PAGE;
    const newNotes = notes.slice(startIndex, endIndex);

    if (newNotes.length > 0) {
      setDisplayedNotes(prev => [...prev, ...newNotes]);
      setPage(nextPage);
      setHasMore(endIndex < notes.length);
    } else {
      setHasMore(false);
    }
  }, [page, notes, isLoading, hasMore]);


  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    const target = observerTarget.current;
    if (target) {
      observer.observe(target);
    }

    return () => {
      if (target) {
        observer.unobserve(target);
      }
    };
  }, [loadMore, hasMore, isLoading]);

  const handleUpdate = () => {
    loadNotes();
  };

  if (notes.length === 0) {
    return (
      <div className="text-center py-16">
        <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">No notes yet</h3>
        <p className="text-gray-500">Be the first to share your thoughts!</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-900">Public Feed</h2>
        <p className="text-sm text-gray-600">{notes.length} note{notes.length !== 1 ? 's' : ''} shared</p>
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {displayedNotes.map((note, index) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                duration: 0.4, 
                delay: Math.min(index * 0.05, 0.5),
                type: 'spring',
                damping: 20,
                stiffness: 100
              }}
            >
              <NoteCard
                note={note}
                sessionId={sessionId}
                onUpdate={handleUpdate}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {hasMore && (
        <div ref={observerTarget} className="py-8 flex justify-center">
          {isLoading && (
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Loading more notes...</span>
            </div>
          )}
        </div>
      )}

      {!hasMore && notes.length > NOTES_PER_PAGE && (
        <div className="text-center py-8 text-gray-500">
          <p>You've reached the end</p>
        </div>
      )}
    </div>
  );
}
