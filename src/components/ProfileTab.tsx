import React, { useState } from 'react';
import { UserProfile, AppDatabase } from '../types';
import { Copy, Users, Star, Award, Calendar, Share2, ClipboardCheck, ArrowDownLeft, ArrowUpRight, Coins, TrendingUp } from 'lucide-react';

interface ProfileTabProps {
  user: UserProfile;
  db: AppDatabase;
  onUpdateState: (user: UserProfile, db: AppDatabase) => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'info' | 'pending') => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({
  user,
  db,
  onUpdateState,
  showToast
}) => {
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<boolean>(false);

  // Calculate stats
  const totalApprovedDeposits = db.deposits
    .filter(d => d.userId === user.id && d.status === 'Approved')
    .reduce((sum, d) => sum + d.amountUSDT, 0);

  const totalApprovedWithdrawals = db.withdrawals
    .filter(w => w.userId === user.id && w.status === 'Approved')
    .reduce((sum, w) => sum + w.amountUSDT, 0);

  // Generate Referral link
  // Uses standard Telegram WebApp start parameter. Example: t.me/botname?startapp=USERID
  const appBotUrl = `https://t.me/TMDigitalEarningBot/app?startapp=${user.id}`;

  const handleCopyReferral = () => {
    navigator.clipboard.writeText(appBotUrl);
    setCopiedLink(true);
    if (showToast) {
      showToast("Referral link copied to clipboard!", "success");
    }
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(user.id.toString());
    setCopiedId(true);
    if (showToast) {
      showToast("Telegram User ID copied to clipboard!", "success");
    }
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Find users invited by this profile
  const invitedUsers = db.users.filter(u => u.referredBy === user.id);

  return (
    <div className="space-y-5">
      {/* Telegram Profile Header Card */}
      <div className="relative overflow-hidden glass-panel p-5 rounded-2xl border border-white/5 bg-gradient-to-br from-tg-surface-light via-tg-surface to-tg-dark/40">
        <div className="absolute top-3 right-3 text-tg-blue-light opacity-25">
          <Star className="w-16 h-16" />
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 relative z-10">
          <img 
            src={user.photoUrl} 
            alt={user.firstName} 
            className="w-20 h-20 rounded-full border-2 border-tg-blue/30 object-cover glow-blue" 
            referrerPolicy="no-referrer"
          />
          <div className="text-center sm:text-left space-y-1">
            <h3 className="text-xl font-bold font-display text-white">
              {user.firstName} {user.lastName || ''}
            </h3>
            <span className="text-xs text-tg-blue-light font-mono font-medium block">
              @{user.username || 'telegram_user'}
            </span>
            <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2 pt-1">
              <span className="bg-tg-surface-light text-[10px] text-tg-text-muted px-2.5 py-0.5 rounded-full font-mono border border-white/5">
                ID: {user.id}
              </span>
              <span className="bg-tg-blue/10 text-[10px] text-tg-blue-light px-2.5 py-0.5 rounded-full font-semibold border border-tg-blue/20">
                User Language: {user.languageCode?.toUpperCase() || 'EN'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Simplified Referral Statistics Grid */}
      <div className="grid grid-cols-3 gap-2.5">
        {/* Total Referrals */}
        <div className="glass-panel p-3.5 rounded-2xl border border-white/5 bg-tg-surface/30 relative overflow-hidden shadow-lg flex flex-col justify-between">
          <div className="absolute -top-3 -right-3 w-10 h-10 bg-tg-blue/5 rounded-full blur-md pointer-events-none" />
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-tg-text-muted">
              <Users className="w-3.5 h-3.5 text-tg-blue" />
              <span className="text-[8px] uppercase font-bold tracking-widest font-display">Total Refer</span>
            </div>
            <div className="text-lg font-black font-display text-white font-mono tracking-tight leading-none pt-0.5">
              {user.referralCount}
            </div>
          </div>
          <span className="text-[8.5px] text-tg-text-muted/75 block pt-2 leading-none">Invites sent</span>
        </div>

        {/* Reward per referral */}
        <div className="glass-panel p-3.5 rounded-2xl border border-white/5 bg-tg-surface/30 relative overflow-hidden shadow-lg flex flex-col justify-between">
          <div className="absolute -top-3 -right-3 w-10 h-10 bg-amber-400/5 rounded-full blur-md pointer-events-none" />
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-tg-text-muted">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[8px] uppercase font-bold tracking-widest font-display font-semibold">Amount</span>
            </div>
            <div className="text-sm sm:text-base font-black font-display text-amber-400 font-mono tracking-tight leading-none pt-0.5">
              {db.settings.referralRewardTM || 50} TM
            </div>
          </div>
          <span className="text-[8.5px] text-tg-text-muted/75 block pt-2 leading-none">Per invite</span>
        </div>

        {/* Total Referral Revenue */}
        <div className="glass-panel p-3.5 rounded-2xl border border-white/5 bg-tg-surface/30 relative overflow-hidden shadow-lg flex flex-col justify-between">
          <div className="absolute -top-3 -right-3 w-10 h-10 bg-emerald-500/5 rounded-full blur-md pointer-events-none" />
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-tg-text-muted">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[8px] uppercase font-bold tracking-widest font-display">Revenue</span>
            </div>
            <div className="text-sm sm:text-base font-black font-display text-emerald-400 font-mono tracking-tight leading-none pt-0.5 truncate">
              {(user.referralEarningsTM ?? (user.referralCount * (db.settings.referralRewardTM || 50))).toLocaleString()} TM
            </div>
          </div>
          <span className="text-[8.5px] text-tg-text-muted/75 block pt-2 leading-none font-medium">Earned TM</span>
        </div>
      </div>

      {/* Referral Program Segment */}
      <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-tg-blue/10 text-tg-blue shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="font-semibold text-sm text-white font-display">Automatic Telegram Referrals</h4>
            <p className="text-xs text-tg-text-muted leading-relaxed">
              Earn an instant commission of <span className="text-emerald-400 font-bold">${db.settings.referralRewardUSDT} USDT</span> for every user who starts the mini app through your referral connection!
            </p>
          </div>
        </div>

        {/* Copy User ID Widget */}
        <div className="space-y-2 pt-1">
          <span className="text-[10px] text-tg-text-muted uppercase tracking-wider font-bold block">Your Referral User ID:</span>
          
          <div className="flex items-center gap-1.5 bg-tg-dark/50 border border-white/5 rounded-xl p-2.5">
            <span className="text-xs font-mono select-all truncate text-amber-400 font-bold block flex-1">
              {user.id}
            </span>
            <button
              onClick={handleCopyId}
              className={`p-2 rounded-lg font-semibold transition shrink-0 flex items-center gap-1 cursor-pointer ${
                copiedId 
                  ? 'bg-emerald-500/10 text-emerald-400' 
                  : 'bg-tg-blue hover:bg-tg-blue-light text-white text-[11px]'
              }`}
            >
              {copiedId ? (
                <>
                  <ClipboardCheck className="w-3.5 h-3.5" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy User ID</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Copy referral link widget */}
        <div className="space-y-2 pt-1">
          <span className="text-[10px] text-tg-text-muted uppercase tracking-wider font-bold block">Your Custom Referral Link:</span>
          
          <div className="flex items-center gap-1.5 bg-tg-dark/50 border border-white/5 rounded-xl p-2.5">
            <span className="text-xs font-mono select-all truncate text-tg-blue-light block flex-1">
              {appBotUrl}
            </span>
            <button
              onClick={handleCopyReferral}
              className={`p-2 rounded-lg font-semibold transition shrink-0 flex items-center gap-1 cursor-pointer ${
                copiedLink 
                  ? 'bg-emerald-500/10 text-emerald-400' 
                  : 'bg-tg-blue hover:bg-tg-blue-light text-white text-[11px]'
              }`}
            >
              {copiedLink ? (
                <>
                  <ClipboardCheck className="w-3.5 h-3.5" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Bot Link</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Invited Users List */}
        <div className="space-y-2 pt-3 border-t border-white/5">
          <h5 className="text-[10px] text-tg-text-muted uppercase tracking-wider font-bold block">Invited Users ({invitedUsers.length})</h5>
          
          {invitedUsers.length === 0 ? (
            <div className="p-4 text-center text-xs text-tg-text-muted bg-tg-dark/30 rounded-xl border border-dashed border-white/5">
              No invited users yet. Copy and share your link above to begin earning commission!
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {invitedUsers.map((invited) => (
                <div 
                  key={invited.id} 
                  className="bg-tg-dark/40 border border-white/5 rounded-xl p-2.5 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <img 
                      src={invited.photoUrl} 
                      alt={invited.firstName} 
                      className="w-7 h-7 rounded-full object-cover border border-white/5" 
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <span className="font-semibold text-white block leading-tight">{invited.firstName}</span>
                      <span className="text-[10px] text-tg-text-muted block">@{invited.username || invited.id}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-emerald-400 font-bold font-mono block">+${db.settings.referralRewardUSDT}</span>
                    <span className="text-[9px] text-tg-text-muted block">
                      {new Date(invited.registeredAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default ProfileTab;
