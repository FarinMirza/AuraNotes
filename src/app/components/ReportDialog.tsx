import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { addReport, hasUserReportedNote } from '../services/storageService';
import { AlertCircle, CheckCircle, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ReportDialogProps {
  noteId: string;
  sessionId: string;
  isOpen: boolean;
  onClose: () => void;
  onReported: () => void;
}

const REPORT_REASONS = [
  { value: 'spam', label: 'Spam or misleading' },
  { value: 'harassment', label: 'Harassment or bullying' },
  { value: 'hateful', label: 'Hateful or abusive content' },
  { value: 'violence', label: 'Violence or threats' },
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'other', label: 'Other concern' }
];

export function ReportDialog({ noteId, sessionId, isOpen, onClose, onReported }: ReportDialogProps) {
  const [selectedReason, setSelectedReason] = useState('spam');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [alreadyReported, setAlreadyReported] = useState(false);

  useEffect(() => {
    async function checkReportStatus() {
      if (isOpen) {
        const reported = await hasUserReportedNote(sessionId, noteId);
        setAlreadyReported(reported);
      }
    }
    checkReportStatus();
  }, [isOpen, sessionId, noteId]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      const reported = await addReport(noteId, sessionId, selectedReason);

      if (reported) {
        setSuccess(true);
        setTimeout(() => {
          onReported();
          onClose();
          setSuccess(false);
        }, 1500);
      } else {
        setError('You have already reported this note.');
      }
    } catch (err) {
      setError('Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedReason('spam');
      setError('');
      setSuccess(false);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] bg-white/80 backdrop-blur-2xl border-white/40 shadow-2xl rounded-3xl overflow-hidden">
        <DialogHeader className="pt-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-100 rounded-xl text-red-600">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <DialogTitle className="text-xl font-bold text-slate-800">Report Content</DialogTitle>
          </div>
          <DialogDescription className="text-slate-500 font-medium">
            Help us keep Aura Notes safe. Why are you reporting this?
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {success ? (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-10 flex flex-col items-center justify-center text-center"
            >
              <div className="relative">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1.2 }}
                  className="absolute inset-0 bg-green-100 rounded-full blur-xl"
                />
                <CheckCircle className="w-20 h-20 text-green-500 relative z-10" />
              </div>
              <p className="text-xl font-bold text-slate-800 mt-6 tracking-tight">Report Received</p>
              <p className="text-sm text-slate-500 mt-2 font-medium">
                Thank you for contributing to our community's safety.
              </p>
            </motion.div>
          ) : alreadyReported ? (
            <motion.div 
              key="already"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-10 flex flex-col items-center justify-center text-center"
            >
              <AlertCircle className="w-20 h-20 text-amber-500 mb-6" />
              <p className="text-xl font-bold text-slate-800 tracking-tight">Action Already Taken</p>
              <p className="text-sm text-slate-500 mt-2 font-medium">
                Our records show you've already flagged this note.
              </p>
            </motion.div>
          ) : (
            <motion.div 
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="py-6">
                <RadioGroup value={selectedReason} onValueChange={setSelectedReason} className="space-y-3">
                  {REPORT_REASONS.map((reason) => (
                    <div key={reason.value} className="flex items-center space-x-3 p-3 rounded-2xl hover:bg-slate-50/50 transition-colors border border-transparent hover:border-slate-100 cursor-pointer">
                      <RadioGroupItem value={reason.value} id={reason.value} className="text-indigo-600 border-slate-300" />
                      <Label htmlFor={reason.value} className="font-semibold text-slate-700 cursor-pointer flex-grow text-sm">
                        {reason.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {error && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-red-50/80 backdrop-blur-sm border border-red-100 rounded-2xl flex items-start gap-3 mb-6">
                  <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-800 font-semibold">{error}</p>
                </motion.div>
              )}

              <DialogFooter className="gap-3 sm:gap-0">
                <Button variant="ghost" onClick={handleClose} disabled={isSubmitting} className="rounded-xl border-slate-200 hover:bg-slate-100 text-slate-600 font-bold">
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={isSubmitting} className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold px-6">
                  {isSubmitting ? 'Processing...' : 'Submit Report'}
                </Button>
              </DialogFooter>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
