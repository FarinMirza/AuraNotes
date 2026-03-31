import { useState, useEffect } from 'react';
import { NoteComposer } from './components/NoteComposer';
import { PublicFeed } from './components/PublicFeed';
import { getOrCreateSession } from './services/sessionService';
import { Session } from './types';
import { MessageSquareText, Shield, Users, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster } from './components/ui/sonner';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const currentSession = getOrCreateSession();
    setSession(currentSession);
  }, []);

  const handleNotePosted = () => {
    // Refresh session and feed
    const updatedSession = getOrCreateSession();
    setSession(updatedSession);
    setRefreshTrigger(prev => prev + 1);
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <motion.div 
          animate={{ scale: [0.9, 1.1, 0.9], opacity: [0.5, 1, 0.5] }} 
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-indigo-600 flex flex-col items-center gap-4"
        >
          <Sparkles className="w-8 h-8" />
          <span className="font-medium tracking-wide">Preparing your space...</span>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden font-sans text-slate-900">
      {/* Animated Background Blobs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-300/30 blur-[120px] mix-blend-multiply animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute top-[20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-pink-300/20 blur-[130px] mix-blend-multiply animate-pulse" style={{ animationDuration: '10s' }} />
        <div className="absolute bottom-[-20%] left-[20%] w-[70%] h-[70%] rounded-full bg-indigo-300/20 blur-[140px] mix-blend-multiply animate-pulse" style={{ animationDuration: '12s' }} />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header - Glassmorphism */}
        <motion.header 
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 100 }}
          className="sticky top-0 z-50 bg-white/60 backdrop-blur-xl border-b border-white/20 shadow-sm"
        >
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                  <MessageSquareText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-700 to-purple-600 bg-clip-text text-transparent">
                    Aura Notes
                  </h1>
                  <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">Share Freely</p>
                </div>
              </div>
              <div className="text-right flex flex-col items-end">
                <div className="px-3 py-1 bg-white/80 rounded-full shadow-sm border border-slate-100 mb-1">
                  <p className="text-xs font-semibold text-indigo-900">{session.nickname}</p>
                </div>
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{session.postCount} post{session.postCount !== 1 ? 's' : ''}</p>
              </div>
            </div>
          </div>
        </motion.header>

        {/* Main Content */}
        <main className="flex-grow max-w-4xl w-full mx-auto px-4 py-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {/* Info Banner - Glass */}
            <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-sm border border-white/40 p-5 mb-8 flex items-start gap-4 transition-all hover:bg-white/80">
              <div className="p-2 bg-indigo-100/50 rounded-xl text-indigo-600 flex-shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-800 mb-1">Safe & Anonymous</h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Your identity is protected. We use automatic moderation and rate limiting to keep the community safe.
                </p>
              </div>
            </div>

            {/* Note Composer */}
            <NoteComposer session={session} onNotePosted={handleNotePosted} />

            {/* Public Feed */}
            <PublicFeed sessionId={session.id} refreshTrigger={refreshTrigger} />
          </motion.div>
        </main>

        {/* Footer - Glass */}
        <footer className="mt-auto border-t border-slate-200/50 bg-white/40 backdrop-blur-lg">
          <div className="max-w-4xl mx-auto px-4 py-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
              {[
                { icon: Users, title: "Community", desc: "A safe space for anonymous expression and support" },
                { icon: Shield, title: "Safety First", desc: "Advanced moderation keeps our platform safe" },
                { icon: MessageSquareText, title: "Express Freely", desc: "Share thoughts without fear of judgment" }
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center md:items-start group cursor-default">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-indigo-50/50 rounded-xl group-hover:bg-indigo-100 transition-colors">
                      <item.icon className="w-4 h-4 text-indigo-600" />
                    </div>
                    <h3 className="font-semibold text-slate-800">{item.title}</h3>
                  </div>
                  <p className="text-sm text-slate-500">{item.desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-10 pt-6 border-t border-slate-200/50 text-center flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-pink-400 opacity-70" />
              <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">© 2026 Aura Notes</p>
              <Sparkles className="w-4 h-4 text-indigo-400 opacity-70" />
            </div>
          </div>
        </footer>
      </div>
      <Toaster position="bottom-right" closeButton richColors />
    </div>
  );
}
