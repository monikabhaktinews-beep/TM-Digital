import React from 'react';
import { UserNotification, AppDatabase, UserProfile } from '../types';
import { markNotificationsAsRead } from '../lib/db';
import { X, Bell, ShieldCheck, CheckCircle, Sparkles, Users, Award, CheckSquare, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NotificationCenterProps {
  user: UserProfile;
  db: AppDatabase;
  onUpdateState: (user: UserProfile, db: AppDatabase) => void;
  onClose: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  user,
  db,
  onUpdateState,
  onClose
}) => {
  // Fetch user specific notifications
  const notifications = (db.notifications || []).filter(n => n.userId === user.id);
  
  const handleMarkAllRead = () => {
    const updatedDb = markNotificationsAsRead(user.id);
    onUpdateState(user, updatedDb);
  };

  const handleClearAll = () => {
    const updatedDb = { ...db };
    if (updatedDb.notifications) {
      updatedDb.notifications = updatedDb.notifications.filter(n => n.userId !== user.id);
    }
    onUpdateState(user, updatedDb);
  };

  // Helper for notification icons and styling
  const getNotifDetails = (type: string) => {
    switch (type) {
      case 'deposit_approved':
        return {
          icon: ShieldCheck,
          iconColor: 'text-emerald-400',
          bgColor: 'bg-emerald-500/10 border-emerald-500/20'
        };
      case 'withdraw_approved':
        return {
          icon: CheckCircle,
          iconColor: 'text-emerald-400',
          bgColor: 'bg-emerald-500/10 border-emerald-500/20'
        };
      case 'daily_claimed':
        return {
          icon: Sparkles,
          iconColor: 'text-amber-400',
          bgColor: 'bg-amber-500/10 border-amber-500/20'
        };
      case 'referral_completed':
        return {
          icon: Users,
          iconColor: 'text-tg-blue-light',
          bgColor: 'bg-tg-blue/10 border-tg-blue/20'
        };
      case 'milestone_unlocked':
        return {
          icon: Award,
          iconColor: 'text-amber-500',
          bgColor: 'bg-amber-500/10 border-amber-500/20'
        };
      case 'task_completed':
        default:
        return {
          icon: CheckSquare,
          iconColor: 'text-tg-blue-light',
          bgColor: 'bg-tg-blue/10 border-white/5'
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#060913]/90 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        className="w-full max-w-md bg-tg-surface border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-tg-blue/10 text-tg-blue rounded-xl">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white font-display">System Alerts</h3>
              <p className="text-[10px] text-tg-text-muted">Direct transaction logs & commissions</p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-tg-text-muted transition cursor-pointer"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Action Bar */}
        {notifications.length > 0 && (
          <div className="px-4 py-2 bg-tg-dark/40 border-b border-white/5 flex justify-between items-center text-[10px] font-bold">
            <button 
              onClick={handleMarkAllRead}
              className="text-tg-blue-light hover:text-white transition cursor-pointer"
            >
              Mark all as read
            </button>
            <button 
              onClick={handleClearAll}
              className="text-red-400 hover:text-red-300 transition flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear alerts</span>
            </button>
          </div>
        )}

        {/* Alerts list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 min-h-[250px]">
          {notifications.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-3 py-10">
              <div className="p-4 bg-white/5 rounded-full border border-dashed border-white/5 text-tg-text-muted">
                <Bell className="w-7 h-7 opacity-30" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-white">No system alerts yet</p>
                <p className="text-[10px] text-tg-text-muted max-w-xs mx-auto px-4">
                  Actions like approved deposits, commission bonuses, and task rewards will notify you instantly here.
                </p>
              </div>
            </div>
          ) : (
            notifications.map((n) => {
              const details = getNotifDetails(n.type);
              const NotifIcon = details.icon;
              
              return (
                <div 
                  key={n.id}
                  className={`p-3 rounded-xl border flex items-start gap-3 transition relative ${details.bgColor} ${
                    !n.read ? 'bg-tg-blue/5' : 'bg-transparent'
                  }`}
                >
                  {/* Unread marker dot */}
                  {!n.read && (
                    <span className="absolute top-3.5 right-3.5 w-1.5 h-1.5 bg-tg-blue rounded-full" />
                  )}

                  <div className={`p-2 rounded-lg ${details.iconColor} bg-white/5 shrink-0`}>
                    <NotifIcon className="w-4 h-4" />
                  </div>

                  <div className="space-y-1 flex-1 min-w-0 pr-2">
                    <span className="font-bold text-xs text-white block truncate leading-tight">
                      {n.title}
                    </span>
                    <p className="text-[10px] text-tg-text-muted leading-relaxed">
                      {n.message}
                    </p>
                    <span className="text-[8px] font-mono text-tg-text-muted/60 block pt-0.5">
                      {new Date(n.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/5 bg-tg-dark/30 text-center">
          <button 
            onClick={onClose}
            className="w-full py-2 bg-white/5 hover:bg-white/10 text-xs font-semibold text-white rounded-xl transition cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      </motion.div>
    </div>
  );
};
export default NotificationCenter;
