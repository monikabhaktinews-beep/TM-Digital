import React, { useState, useEffect } from 'react';
import { Task, UserProfile, AppDatabase } from '../types';
import { verifyTaskOnServer, completeOnboardingOnServer } from '../lib/db';
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

  // Define the exact 3 mandatory tasks we are looking for
  const requiredTaskIds = ["mandatory_channel_1", "mandatory_channel_2", "mandatory_channel_3"];
  
  const enabledTasks = db.tasks.filter(t => t.isEnabled);
  const mandatoryTasks = enabledTasks.filter(t => requiredTaskIds.includes(t.id));
  
  // User's completed tasks
  const completedTaskIds = db.completedTasks[user.id] || [];
  
  // Calculate verified count among the 3 specific channels
  const completedCount = mandatoryTasks.filter(t => completedTaskIds.includes(t.id)).length;
  const totalCount = 3; // Exactly 3 channels

  // Verification status
  const isUnlocked = completedCount === totalCount;

  const handleJoinClick = (task: Task) => {
    if (!clickedTasks.includes(task.id)) {
      setClickedTasks([...clickedTasks, task.id]);
    }
    if (task.link && task.link !== '#') {
      window.open(task.link, '_blank', 'noopener,noreferrer');
    }
  };

  const handleVerifyClick = async (task: Task) => {
    setErrorMsg(null);
    setVerifyingTaskId(task.id);
    showToast(`Checking channel membership for ${task.title}...`, 'pending');

    const result = await verifyTaskOnServer(user.id, task.id, clickedTasks.includes(task.id));
    setVerifyingTaskId(null);

    if (result.success) {
      onUpdateState(result.user, result.db);
      showToast(`Successfully verified: ${task.title}! +${task.rewardTM} TM`, 'success');
    } else {
      setErrorMsg(result.message);
      showToast(result.message, 'error');
    }
  };

  const handleContinue = async () => {
    if (!isUnlocked) return;
    
    const result = await completeOnboardingOnServer(user.id);
    if (result.success) {
      onUpdateState(result.user, result.db);
      showToast('Welcome to TM Digital! All features unlocked.', 'success');
    }
    onClose();
  };

  // Automatically close and go to home page after completing all mandatory verifications
  useEffect(() => {
    if (isUnlocked && !user.mandatoryCompleted) {
      const timer = setTimeout(async () => {
        const result = await completeOnboardingOnServer(user.id);
        if (result.success) {
          onUpdateState(result.user, result.db);
          showToast('Welcome to TM Digital! All features unlocked.', 'success');
        }
        onClose();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isUnlocked, user.mandatoryCompleted, user.id, onUpdateState, onClose]);

  const progressPercent = Math.min(100, (completedCount / totalCount) * 100);

  return (
    <div className="fixed inset-0 z-50 bg-[#060913] backdrop-blur-lg flex flex-col justify-between overflow-y-auto p-4 sm:p-6 select-none font-sans">
      
      {/* Decorative ambient neon glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-tg-blue/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header section */}
      <div className="w-full max-w-md mx-auto pt-6 pb-2 space-y-4 text-center relative z-10">
        <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-tg-blue/20 to-indigo-500/20 border border-tg-blue/30 shadow-lg shadow-tg-blue/10">
          <Sparkles className="w-8 h-8 text-amber-400" />
        </div>
        
        <div className="space-y-1.5">
          <h2 className="text-xl sm:text-2xl font-black font-display text-white tracking-tight leading-none uppercase">
            Channel Verification
          </h2>
          <p className="text-xs text-tg-text-muted max-w-xs mx-auto leading-relaxed">
            Welcome to <strong className="text-white">TM Digital</strong>! You must join and verify our official Telegram channels to release encryption and gain full dashboard access.
          </p>
        </div>

        {/* Progress indicator card */}
        <div className="glass-panel p-4 rounded-2xl border border-white/5 space-y-3 bg-tg-surface/40 shadow-xl shadow-black/40">
          <div className="flex justify-between items-center text-xs font-bold font-display">
            <span className="text-tg-text-muted uppercase tracking-wider text-[10px]">Verification Stage</span>
            <span className="text-amber-400 font-mono text-sm bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
              Progress: {completedCount}/{totalCount}
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-2 w-full bg-tg-dark rounded-full overflow-hidden border border-white/5 relative">
            <motion.div 
              className="h-full bg-gradient-to-r from-tg-blue via-indigo-500 to-amber-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>

          <div className="text-[10px] text-tg-text-muted/85 flex justify-between items-center leading-none">
            <span>Claim 500 TM total rewards</span>
            {isUnlocked ? (
              <span className="text-emerald-400 font-extrabold">✨ Complete! Entering dashboard...</span>
            ) : (
              <span>Join required channels below</span>
            )}
          </div>
        </div>
      </div>

      {/* Task list container */}
      <div className="flex-1 w-full max-w-md mx-auto py-4 space-y-3 overflow-y-auto max-h-[45vh] pr-1.5 scrollbar relative z-10">
        {errorMsg && (
          <div className="bg-red-950/20 border border-red-500/20 text-red-300 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <AnimatePresence initial={false}>
          {mandatoryTasks.map((task) => {
            const isCompleted = completedTaskIds.includes(task.id);
            const isVerifying = verifyingTaskId === task.id;
            const hasClicked = clickedTasks.includes(task.id);
            
            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`p-4 rounded-xl border transition-all duration-300 flex items-center justify-between gap-3 relative overflow-hidden ${
                  isCompleted 
                    ? 'bg-emerald-950/10 border-emerald-500/30' 
                    : 'bg-tg-surface-light/30 border-white/5 hover:border-white/10'
                }`}
              >
                {/* Background glow on active verification */}
                {isVerifying && (
                  <div className="absolute inset-0 bg-tg-blue/5 animate-pulse pointer-events-none" />
                )}

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    {isCompleted ? (
                      <div className="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      </div>
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-white/20 shrink-0" />
                    )}
                    <span className={`text-xs font-bold truncate block ${isCompleted ? 'text-emerald-300 line-through opacity-70' : 'text-white'}`}>
                      {task.title}
                    </span>
                  </div>
                  <p className="text-[10px] text-tg-text-muted/85 leading-relaxed pl-6">
                    {task.description}
                  </p>
                  <div className="text-[10px] font-mono font-bold text-amber-400/90 leading-none pl-6 flex items-center gap-1">
                    <span>Reward:</span>
                    <span className="text-amber-300">{task.rewardTM} TM Tokens</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 relative z-10">
                  {isCompleted ? (
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg uppercase tracking-wider">
                      Verified
                    </span>
                  ) : (
                    <>
                      {/* Join Button */}
                      <button
                        onClick={() => handleJoinClick(task)}
                        disabled={isVerifying}
                        className={`text-[10px] font-bold px-3 py-2 rounded-lg border flex items-center gap-1.5 transition cursor-pointer ${
                          hasClicked 
                            ? 'bg-white/5 border-white/5 text-tg-text-muted' 
                            : 'bg-tg-blue/10 border-tg-blue/30 text-tg-blue-light hover:bg-tg-blue/20'
                        }`}
                      >
                        <span>Join</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>

                      {/* Verify Button */}
                      <button
                        onClick={() => handleVerifyClick(task)}
                        disabled={isVerifying}
                        className="text-[10px] font-bold px-3 py-2 bg-amber-500 hover:bg-amber-400 text-tg-dark rounded-lg transition flex items-center justify-center gap-1.5 min-w-[65px] cursor-pointer"
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
          className={`w-full py-3.5 rounded-xl font-bold font-display text-xs tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-2 border cursor-pointer ${
            isUnlocked
              ? 'bg-gradient-to-r from-tg-blue to-indigo-600 hover:from-tg-blue-light hover:to-indigo-500 text-white border-tg-blue-light shadow-lg shadow-tg-blue/20 glow-blue'
              : 'bg-tg-surface-light/10 border-white/5 text-tg-text-muted opacity-35 cursor-not-allowed'
          }`}
        >
          <span>Continue to Dashboard</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <p className="text-[9px] text-center text-tg-text-muted/65 uppercase tracking-wider">
          Locked Security Layer • 500 TM Token Claim Pending
        </p>
      </div>
    </div>
  );
};
