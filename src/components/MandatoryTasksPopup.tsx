import React, { useState, useEffect } from 'react';
import { Task, UserProfile, AppDatabase } from '../types';
import { completeUserTask, completeUserOnboarding } from '../lib/db';
import { CheckCircle2, Lock, ArrowRight, ExternalLink, Loader2, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MandatoryTasksPopupProps {
  user: UserProfile;
  db: AppDatabase;
  onUpdateState: (user: UserProfile, db: AppDatabase) => void;
  onClose: () => void;
  showToast: (message: string, type: 'success' | 'error' | 'info' | 'pending') => void;
}

export const MandatoryTasksPopup: React.FC<MandatoryTasksPopupProps> = ({
  user,
  db,
  onUpdateState,
  onClose,
  showToast
}) => {
  const [verifyingTaskId, setVerifyingTaskId] = useState<string | null>(null);
  const [clickedTasks, setClickedTasks] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filter currently enabled mandatory tasks
  const enabledTasks = db.tasks.filter(t => t.isEnabled);
  const mandatoryTasks = enabledTasks.filter(t => t.isMandatory);
  
  // User's completed tasks
  const completedTaskIds = db.completedTasks[user.id] || [];
  
  // Progress calculations
  const completedMandatoryCount = mandatoryTasks.filter(t => completedTaskIds.includes(t.id)).length;
  const requiredCount = db.settings.mandatoryTaskCount ?? mandatoryTasks.length;
  
  // Fully completed all required mandatory tasks?
  const isUnlocked = completedMandatoryCount >= Math.min(requiredCount, mandatoryTasks.length);

  const handleJoinClick = (task: Task) => {
    if (!clickedTasks.includes(task.id)) {
      setClickedTasks([...clickedTasks, task.id]);
    }
    if (task.link && task.link !== '#') {
      window.open(task.link, '_blank', 'noopener,noreferrer');
    }
  };

  const handleVerifyClick = (task: Task) => {
    if (!clickedTasks.includes(task.id) && task.requiresVerification) {
      setErrorMsg(`Please tap "[ Join ]" or "[ Start ]" to open ${task.title} before attempting verification.`);
      showToast('Join the channel/bot first!', 'error');
      return;
    }

    setErrorMsg(null);
    setVerifyingTaskId(task.id);
    showToast(`Verifying subscription for ${task.title}...`, 'pending');

    // Simulate standard anti-cheat verification delay
    setTimeout(() => {
      const result = completeUserTask(user.id, task.id);
      setVerifyingTaskId(null);

      if (result.success) {
        onUpdateState(result.user, result.db);
        showToast(`Successfully verified: ${task.title}! +${task.rewardTM} TM`, 'success');
      } else {
        setErrorMsg(result.message);
        showToast(result.message, 'error');
      }
    }, 1500);
  };

  const handleContinue = () => {
    if (!isUnlocked) return;
    
    const result = completeUserOnboarding(user.id);
    if (result.success) {
      onUpdateState(result.user, result.db);
      showToast('Welcome to TM Digital! All features unlocked.', 'success');
    }
    onClose();
  };

  // If there are no mandatory tasks configured, auto-close
  useEffect(() => {
    if (mandatoryTasks.length === 0) {
      onClose();
    }
  }, [mandatoryTasks.length, onClose]);

  // Percentage for progress indicator
  const totalTasksToCount = Math.min(requiredCount, mandatoryTasks.length);
  const progressPercent = totalTasksToCount > 0 
    ? Math.min(100, (completedMandatoryCount / totalTasksToCount) * 100) 
    : 0;

  return (
    <div className="fixed inset-0 z-50 bg-[#060913]/95 backdrop-blur-md flex flex-col justify-between overflow-y-auto p-4 sm:p-6 select-none font-sans">
      
      {/* Decorative ambient neon glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-72 bg-tg-blue/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header section */}
      <div className="w-full max-w-md mx-auto pt-6 pb-2 space-y-4 text-center relative z-10">
        <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-tg-blue/25 to-indigo-500/25 border border-tg-blue/30 shadow-lg shadow-tg-blue/20 animate-pulse">
          <Sparkles className="w-8 h-8 text-amber-400" />
        </div>
        
        <div className="space-y-1.5">
          <h2 className="text-xl sm:text-2xl font-black font-display text-white tracking-tight leading-none">
            Complete Mandatory Tasks
          </h2>
          <p className="text-xs text-tg-text-muted max-w-xs mx-auto">
            Unlock your high-yield TM Digital holding dashboard and claim exclusive tokens.
          </p>
        </div>

        {/* Progress indicator card */}
        <div className="glass-panel p-4 rounded-2xl border border-white/5 space-y-2.5 bg-tg-surface/40">
          <div className="flex justify-between items-center text-xs font-bold font-display">
            <span className="text-tg-text-muted">Verification Status</span>
            <span className="text-amber-400 font-mono text-sm">
              Progress: {completedMandatoryCount}/{totalTasksToCount}
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-2 w-full bg-tg-dark rounded-full overflow-hidden border border-white/5 relative">
            <motion.div 
              className="h-full bg-gradient-to-r from-tg-blue via-indigo-500 to-amber-400 rounded-full glow-blue"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>

          <p className="text-[10px] text-tg-text-muted/85 leading-none">
            {isUnlocked 
              ? "✨ Complete! Tap Continue below to access the dashboard." 
              : `Complete at least ${totalTasksToCount} task(s) to unlock full access.`}
          </p>
        </div>
      </div>

      {/* Task list container */}
      <div className="flex-1 w-full max-w-md mx-auto py-4 space-y-3 overflow-y-auto max-h-[50vh] pr-1.5 scrollbar relative z-10">
        {errorMsg && (
          <div className="bg-red-950/20 border border-red-500/20 text-red-300 p-2.5 rounded-xl text-[11px] font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <AnimatePresence initial={false}>
          {mandatoryTasks.map((task) => {
            const isCompleted = completedTaskIds.includes(task.id);
            const isVerifying = verifyingTaskId === task.id;
            const hasClicked = clickedTasks.includes(task.id);
            
            let typeLabel = 'Join';
            if (task.type === 'TelegramBot') typeLabel = 'Start';
            if (task.type === 'ExternalLink') typeLabel = 'Open';

            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`p-3.5 rounded-xl border transition-all duration-200 flex items-center justify-between gap-3 ${
                  isCompleted 
                    ? 'bg-emerald-950/15 border-emerald-500/25' 
                    : 'bg-tg-surface-light/40 border-white/5 hover:border-white/10'
                }`}
              >
                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-tg-text-muted/30 shrink-0" />
                    )}
                    <span className={`text-xs font-bold truncate block ${isCompleted ? 'text-emerald-300 line-through opacity-70' : 'text-white'}`}>
                      {task.title}
                    </span>
                  </div>
                  <p className="text-[10px] text-tg-text-muted/80 leading-relaxed truncate">
                    {task.description}
                  </p>
                  <div className="text-[9px] font-mono font-bold text-amber-400/90 leading-none">
                    +{task.rewardTM} TM Reward
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {isCompleted ? (
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg uppercase tracking-wider">
                      Verified
                    </span>
                  ) : (
                    <>
                      {/* Action Button */}
                      <button
                        onClick={() => handleJoinClick(task)}
                        disabled={isVerifying}
                        className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border flex items-center gap-1 transition cursor-pointer ${
                          hasClicked 
                            ? 'bg-white/5 border-white/5 text-tg-text-muted' 
                            : 'bg-tg-blue/15 border-tg-blue/30 text-tg-blue-light hover:bg-tg-blue/25'
                        }`}
                      >
                        <span>{typeLabel}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </button>

                      {/* Verify Button */}
                      <button
                        onClick={() => handleVerifyClick(task)}
                        disabled={isVerifying}
                        className="text-[10px] font-bold px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-tg-dark rounded-lg transition flex items-center justify-center gap-1 min-w-[55px] cursor-pointer"
                      >
                        {isVerifying ? (
                          <Loader2 className="w-3 h-3 animate-spin text-tg-dark" />
                        ) : (
                          <span>Verify</span>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Continue Action Button Footer */}
      <div className="w-full max-w-md mx-auto pt-4 pb-6 relative z-10 space-y-2">
        <button
          onClick={handleContinue}
          disabled={!isUnlocked}
          className={`w-full py-3.5 rounded-xl font-bold font-display text-xs tracking-wide uppercase transition-all duration-300 flex items-center justify-center gap-2 border cursor-pointer ${
            isUnlocked
              ? 'bg-gradient-to-r from-tg-blue to-indigo-600 hover:from-tg-blue-light hover:to-indigo-500 text-white border-tg-blue-light shadow-lg shadow-tg-blue/30 glow-blue animate-pulse'
              : 'bg-tg-surface-light/20 border-white/5 text-tg-text-muted opacity-40 cursor-not-allowed'
          }`}
        >
          <span>Continue to Dashboard</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <p className="text-[9px] text-center text-tg-text-muted/65 leading-none">
          Locked Security Layer • Complete tasks above to release encryption.
        </p>
      </div>
    </div>
  );
};
