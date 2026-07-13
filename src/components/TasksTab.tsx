import React, { useState } from 'react';
import { Task, UserProfile, AppDatabase } from '../types';
import { verifyTaskOnServer, completeUserTask } from '../lib/db';
import { CheckCircle2, Lock, Unlock, ArrowUpRight, HelpCircle, AlertCircle, Loader2, Upload, X, Image as ImageIcon, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TasksTabProps {
  user: UserProfile;
  db: AppDatabase;
  onUpdateState: (user: UserProfile, db: AppDatabase) => void;
  onNavigateToTab: (tab: string) => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'info' | 'pending') => void;
}

export const TasksTab: React.FC<TasksTabProps> = ({
  user,
  db,
  onUpdateState,
  onNavigateToTab,
  showToast
}) => {
  const [verifyingTaskId, setVerifyingTaskId] = useState<string | null>(null);
  const [clickedTasks, setClickedTasks] = useState<string[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filter tasks that are enabled
  const enabledTasks = db.tasks.filter(t => t.isEnabled);
  const mandatoryTasks = enabledTasks.filter(t => t.isMandatory);
  const optionalTasks = enabledTasks.filter(t => !t.isMandatory);

  // User's completed tasks
  const completedTaskIds = db.completedTasks[user.id] || [];

  // Mandatory progress
  const completedMandatoryCount = mandatoryTasks.filter(t => completedTaskIds.includes(t.id)).length;
  const totalMandatoryCount = mandatoryTasks.length;
  const isDashboardUnlocked = completedMandatoryCount === totalMandatoryCount;

  // Total progress
  const completedTotalCount = enabledTasks.filter(t => completedTaskIds.includes(t.id)).length;
  const totalCount = enabledTasks.length;

  const handleJoinClick = (task: Task) => {
    // Record that they clicked the task link
    if (!clickedTasks.includes(task.id)) {
      setClickedTasks([...clickedTasks, task.id]);
    }
    
    if (task.link && task.link !== "#") {
      window.open(task.link, '_blank', 'noopener,noreferrer');
    }
  };

  const handleVerify = async (task: Task) => {
    if (!clickedTasks.includes(task.id) && task.requiresVerification) {
      if (showToast) {
        showToast("Please join or click the 'Join'/'Open' button first to initiate verification.", 'error');
      } else {
        alert("Please join or click the 'Join'/'Open' button first to initiate verification.");
      }
      return;
    }
    
    setVerifyingTaskId(task.id);
    if (showToast) {
      showToast(`Verifying completion of ${task.title}...`, 'pending');
    }
    
    const result = await verifyTaskOnServer(user.id, task.id, clickedTasks.includes(task.id));
    setVerifyingTaskId(null);
    
    if (result.success) {
      onUpdateState(result.user, result.db);
      if (showToast) {
        showToast(`Successfully verified: ${task.title}! +${task.rewardTM} TM`, 'success');
      }
    } else {
      if (showToast) {
        showToast(result.message, 'error');
      } else {
        alert(result.message);
      }
    }
  };

  // Helper to categorize social media tasks
  const isSocialTask = (task: Task): boolean => {
    const title = task.title.toLowerCase();
    const desc = task.description.toLowerCase();
    const link = task.link.toLowerCase();
    
    return (
      task.type === 'ExternalLink' ||
      title.includes('twitter') || title.includes('x.com') || title.includes('instagram') || title.includes('facebook') || title.includes('youtube') || title.includes('tiktok') || title.includes('follow') || title.includes('subscribe') ||
      desc.includes('twitter') || desc.includes('instagram') || desc.includes('facebook') || desc.includes('youtube') || desc.includes('tiktok') || desc.includes('follow') || desc.includes('subscribe') ||
      link.includes('twitter.com') || link.includes('x.com') || link.includes('instagram.com') || link.includes('facebook.com') || link.includes('youtube.com') || (link.includes('t.me') && !task.isMandatory)
    );
  };

  const secondaryTasks = optionalTasks.filter(t => !isSocialTask(t));
  const socialTasks = optionalTasks.filter(t => isSocialTask(t));

  return (
    <div className="space-y-5">
      {/* Locked/Unlocked Banner */}
      <div className={`p-4 rounded-xl border ${
        isDashboardUnlocked 
          ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300' 
          : 'bg-amber-950/20 border-amber-500/30 text-amber-300'
      }`}>
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-white/5 mt-0.5">
            {isDashboardUnlocked ? (
              <Unlock className="w-5 h-5 text-emerald-400" />
            ) : (
              <Lock className="w-5 h-5 text-amber-400" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm flex items-center gap-1.5">
              {isDashboardUnlocked ? 'Dashboard Fully Unlocked!' : 'Dashboard Access Locked'}
            </h3>
            <p className="text-xs opacity-80 mt-1">
              {isDashboardUnlocked 
                ? 'Excellent work! You have completed all mandatory tasks. Explore your Staking Dashboard, Referral earnings, and Daily Bonus claims now.'
                : 'Complete all mandatory Telegram tasks below to unlock your active TM balance, daily staking bonuses, and instant USDT withdrawals.'}
            </p>
            {isDashboardUnlocked && (
              <button
                onClick={() => onNavigateToTab('dashboard')}
                className="mt-3 bg-emerald-500 hover:bg-emerald-600 text-tg-dark px-3 py-1.5 rounded-lg text-xs font-semibold font-display transition duration-200"
              >
                Go to Dashboard
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Progress Cards */}
      <div className="grid grid-cols-2 gap-3.5">
        <div className="glass-panel p-4 rounded-2xl relative overflow-hidden shadow-lg border border-white/5 bg-tg-surface/30">
          <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
          <span className="text-[9px] text-tg-text-muted uppercase tracking-widest block font-bold font-display">Mandatory Channels</span>
          <div className="flex items-baseline gap-1 mt-1.5">
            <span className="text-3xl font-black font-display text-amber-400 font-mono tracking-tight">{completedMandatoryCount}</span>
            <span className="text-xs text-tg-text-muted font-bold">/ {totalMandatoryCount}</span>
          </div>
          <div className="w-full bg-white/5 h-1.5 rounded-full mt-3 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-amber-500 to-amber-300 h-full rounded-full transition-all duration-500"
              style={{ width: `${(completedMandatoryCount / (totalMandatoryCount || 1)) * 100}%` }}
            />
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl relative overflow-hidden shadow-lg border border-white/5 bg-tg-surface/30">
          <div className="absolute top-0 right-0 w-16 h-16 bg-tg-blue/5 rounded-full blur-xl pointer-events-none" />
          <span className="text-[9px] text-tg-text-muted uppercase tracking-widest block font-bold font-display">All Achievements</span>
          <div className="flex items-baseline gap-1 mt-1.5">
            <span className="text-3xl font-black font-display text-tg-blue font-mono tracking-tight">{completedTotalCount}</span>
            <span className="text-xs text-tg-text-muted font-bold">/ {totalCount}</span>
          </div>
          <div className="w-full bg-white/5 h-1.5 rounded-full mt-3 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-600 to-cyan-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${(completedTotalCount / (totalCount || 1)) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Feedback Banner */}
      <AnimatePresence>
        {successMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 p-2.5 rounded-lg text-xs font-medium text-center"
          >
            {successMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mandatory Task Section */}
      {mandatoryTasks.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs text-tg-text-muted font-bold uppercase tracking-wider px-1">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>MANDATORY Telegram channels ({completedMandatoryCount}/{totalMandatoryCount})</span>
          </div>

          <div className="space-y-3">
            {mandatoryTasks.map((task) => {
              const isCompleted = completedTaskIds.includes(task.id);
              const isClicked = clickedTasks.includes(task.id);
              const isVerifying = verifyingTaskId === task.id;
              
              return (
                <div 
                  key={task.id}
                  className={`glass-panel p-4 rounded-xl border relative overflow-hidden transition duration-300 ${
                    isCompleted ? 'border-emerald-500/10 bg-emerald-950/5' : 'border-white/5'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm text-white font-display leading-tight">{task.title}</h4>
                        <span className="bg-amber-400/10 text-amber-400 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Required</span>
                      </div>
                      <p className="text-xs text-tg-text-muted leading-relaxed">{task.description}</p>
                      
                      <div className="flex items-center gap-2.5 pt-2">
                        <span className="text-xs font-mono font-bold text-tg-blue bg-tg-blue/10 px-2 py-0.5 rounded">
                          +{task.rewardTM} TM
                        </span>
                        <span className="text-[10px] text-tg-text-muted">
                          ≈ ${(task.rewardTM / db.settings.conversionRate).toFixed(2)} USDT
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 items-end shrink-0">
                      {isCompleted ? (
                        <span className="flex items-center gap-1 text-emerald-400 font-bold text-xs bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Done</span>
                        </span>
                      ) : (
                        <div className="flex flex-col gap-1.5 items-stretch w-20">
                          <button
                            onClick={() => handleJoinClick(task)}
                            className={`text-[11px] font-semibold py-1.5 px-2 rounded-lg text-center transition flex items-center justify-center gap-0.5 ${
                              isClicked 
                                ? 'bg-tg-surface-light text-tg-text-muted border border-white/5' 
                                : 'bg-tg-blue hover:bg-tg-blue-light text-white font-display'
                            }`}
                          >
                            <span>Join</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </button>
                          
                          <button
                            onClick={() => handleVerify(task)}
                            disabled={verifyingTaskId === task.id}
                            className={`text-[11px] font-semibold py-1.5 px-2 rounded-lg text-center transition mt-1.5 flex items-center justify-center gap-1 ${
                              verifyingTaskId === task.id
                                ? 'bg-tg-surface-light text-tg-text-muted cursor-wait'
                                : isClicked
                                  ? 'bg-amber-500 hover:bg-amber-600 text-tg-dark font-semibold'
                                  : 'bg-tg-surface-light text-tg-text-muted cursor-not-allowed border border-white/5'
                            }`}
                          >
                            {verifyingTaskId === task.id ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                                <span>Verifying...</span>
                              </>
                            ) : (
                              <span>Verify</span>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Gated Content for Tasks and Social Media */}
      {!isDashboardUnlocked ? (
        <div className="p-6 rounded-2xl border border-white/5 bg-tg-dark/40 text-center space-y-2">
          <Lock className="w-8 h-8 text-amber-400/80 mx-auto animate-pulse" />
          <h4 className="font-semibold text-white text-sm font-display">Optional Tasks & Social Media Gated</h4>
          <p className="text-xs text-tg-text-muted max-w-xs mx-auto leading-relaxed">
            Please join all of our mandatory channels above first. Once verified, other high-reward tasks and social media bonuses will be unlocked here!
          </p>
        </div>
      ) : (
        <>
          {/* Secondary Tasks Section */}
          {secondaryTasks.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs text-tg-text-muted font-bold uppercase tracking-wider px-1">
                <HelpCircle className="w-3.5 h-3.5 text-tg-blue" />
                <span>TASKS ({secondaryTasks.filter(t => completedTaskIds.includes(t.id)).length}/{secondaryTasks.length})</span>
              </div>

              <div className="space-y-3">
                {secondaryTasks.map((task) => {
                  const isCompleted = completedTaskIds.includes(task.id);
                  const isClicked = clickedTasks.includes(task.id);
                  const isVerifying = verifyingTaskId === task.id;
                  
                  return (
                    <div 
                      key={task.id}
                      className={`glass-panel p-4 rounded-xl border relative overflow-hidden transition duration-300 ${
                        isCompleted ? 'border-emerald-500/10 bg-emerald-950/5' : 'border-white/5'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 flex-1">
                          <h4 className="font-semibold text-sm text-white font-display leading-tight">{task.title}</h4>
                          <p className="text-xs text-tg-text-muted leading-relaxed">{task.description}</p>
                          
                          <div className="flex items-center gap-2.5 pt-2">
                            <span className="text-xs font-mono font-bold text-tg-blue bg-tg-blue/10 px-2 py-0.5 rounded">
                              +{task.rewardTM} TM
                            </span>
                            <span className="text-[10px] text-tg-text-muted">
                              ≈ ${(task.rewardTM / db.settings.conversionRate).toFixed(2)} USDT
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 items-end shrink-0">
                          {isCompleted ? (
                            <span className="flex items-center gap-1 text-emerald-400 font-bold text-xs bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Done</span>
                            </span>
                          ) : (
                            <div className="flex flex-col gap-1.5 items-stretch w-20">
                              {task.type === 'DailyCheckIn' ? (
                                <button
                                  onClick={() => {
                                    const result = completeUserTask(user.id, task.id);
                                    if (result.success) {
                                      onUpdateState(result.user, result.db);
                                      if (showToast) {
                                        showToast(`Daily check-in success! Earned +${task.rewardTM} TM.`, 'success');
                                      } else {
                                        setSuccessMsg(`Daily check-in success! +${task.rewardTM} TM.`);
                                        setTimeout(() => setSuccessMsg(null), 3000);
                                      }
                                    } else {
                                      if (showToast) showToast(result.message, 'error');
                                      else alert(result.message);
                                    }
                                  }}
                                  className="bg-tg-blue hover:bg-tg-blue-light text-white text-[11px] font-semibold py-1.5 px-2 rounded-lg text-center transition font-display"
                                >
                                  Check-In
                                </button>
                              ) : task.type === 'Referral' ? (
                                <button
                                  onClick={() => onNavigateToTab('profile')}
                                  className="bg-tg-blue hover:bg-tg-blue-light text-white text-[11px] font-semibold py-1.5 px-2 rounded-lg text-center transition font-display"
                                >
                                  Share Link
                                </button>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleJoinClick(task)}
                                    className={`text-[11px] font-semibold py-1.5 px-2 rounded-lg text-center transition flex items-center justify-center gap-0.5 ${
                                      isClicked 
                                        ? 'bg-tg-surface-light text-tg-text-muted border border-white/5' 
                                        : 'bg-tg-blue hover:bg-tg-blue-light text-white font-display'
                                    }`}
                                  >
                                    <span>Open</span>
                                    <ArrowUpRight className="w-3 h-3" />
                                  </button>
                                  
                                  <button
                                    onClick={() => handleVerify(task)}
                                    disabled={verifyingTaskId === task.id}
                                    className={`text-[11px] font-semibold py-1.5 px-2 rounded-lg text-center transition mt-1.5 flex items-center justify-center gap-1 ${
                                      verifyingTaskId === task.id
                                        ? 'bg-tg-surface-light text-tg-text-muted cursor-wait'
                                        : isClicked
                                          ? 'bg-amber-500 hover:bg-amber-600 text-tg-dark font-semibold'
                                          : 'bg-tg-surface-light text-tg-text-muted cursor-not-allowed border border-white/5'
                                    }`}
                                  >
                                    {verifyingTaskId === task.id ? (
                                      <>
                                        <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                                        <span>Verifying...</span>
                                      </>
                                    ) : (
                                      <span>Verify</span>
                                    )}
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Social Media Section */}
          {socialTasks.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs text-tg-text-muted font-bold uppercase tracking-wider px-1">
                <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>SOCIAL MEDIA ({socialTasks.filter(t => completedTaskIds.includes(t.id)).length}/{socialTasks.length})</span>
              </div>

              <div className="space-y-3">
                {socialTasks.map((task) => {
                  const isCompleted = completedTaskIds.includes(task.id);
                  const isClicked = clickedTasks.includes(task.id);
                  const isVerifying = verifyingTaskId === task.id;
                  
                  return (
                    <div 
                      key={task.id}
                      className={`glass-panel p-4 rounded-xl border relative overflow-hidden transition duration-300 ${
                        isCompleted ? 'border-emerald-500/10 bg-emerald-950/5' : 'border-white/5'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 flex-1">
                          <h4 className="font-semibold text-sm text-white font-display leading-tight">{task.title}</h4>
                          <p className="text-xs text-tg-text-muted leading-relaxed">{task.description}</p>
                          
                          <div className="flex items-center gap-2.5 pt-2">
                            <span className="text-xs font-mono font-bold text-tg-blue bg-tg-blue/10 px-2 py-0.5 rounded">
                              +{task.rewardTM} TM
                            </span>
                            <span className="text-[10px] text-tg-text-muted">
                              ≈ ${(task.rewardTM / db.settings.conversionRate).toFixed(2)} USDT
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 items-end shrink-0">
                          {isCompleted ? (
                            <span className="flex items-center gap-1 text-emerald-400 font-bold text-xs bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Done</span>
                            </span>
                          ) : (
                            <div className="flex flex-col gap-1.5 items-stretch w-20">
                              <button
                                onClick={() => handleJoinClick(task)}
                                className={`text-[11px] font-semibold py-1.5 px-2 rounded-lg text-center transition flex items-center justify-center gap-0.5 ${
                                  isClicked 
                                    ? 'bg-tg-surface-light text-tg-text-muted border border-white/5' 
                                    : 'bg-tg-blue hover:bg-tg-blue-light text-white font-display'
                                }`}
                              >
                                <span>Open</span>
                                <ArrowUpRight className="w-3 h-3" />
                              </button>
                              
                              <button
                                onClick={() => handleVerify(task)}
                                disabled={verifyingTaskId === task.id}
                                className={`text-[11px] font-semibold py-1.5 px-2 rounded-lg text-center transition mt-1.5 flex items-center justify-center gap-1 ${
                                  verifyingTaskId === task.id
                                    ? 'bg-tg-surface-light text-tg-text-muted cursor-wait'
                                    : isClicked
                                      ? 'bg-amber-500 hover:bg-amber-600 text-tg-dark font-semibold'
                                      : 'bg-tg-surface-light text-tg-text-muted cursor-not-allowed border border-white/5'
                                }`}
                              >
                                {verifyingTaskId === task.id ? (
                                  <>
                                    <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                                    <span>Verifying...</span>
                                  </>
                                ) : (
                                  <span>Verify</span>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
export default TasksTab;
