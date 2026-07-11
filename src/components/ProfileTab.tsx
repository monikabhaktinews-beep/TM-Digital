import React, { useState } from 'react';
import { UserProfile, AppDatabase } from '../types';
import { Copy, Users, Star, Award, Calendar, Share2, ClipboardCheck, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

interface ProfileTabProps {
  user: UserProfile;
  db: AppDatabase;
  onUpdateState: (user: UserProfile, db: AppDatabase) => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({
  user,
  db,
  onUpdateState
}) => {
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

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
    setTimeout(() => setCopiedLink(false), 2000);
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

      {/* Account Statistics Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-panel p-4 rounded-xl border border-white/5 space-y-1">
          <div className="flex items-center gap-1 text-tg-text-muted">
            <Calendar className="w-3.5 h-3.5 text-tg-blue" />
            <span className="text-[10px] uppercase font-bold tracking-wider">Registration Date</span>
          </div>
          <span className="text-xs font-semibold text-white block">
            {new Date(user.registeredAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
          </span>
          <span className="text-[9px] text-tg-text-muted block">Joined community</span>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-white/5 space-y-1">
          <div className="flex items-center gap-1 text-tg-text-muted">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[10px] uppercase font-bold tracking-wider">Active TM Balance</span>
          </div>
          <span className="text-sm font-bold text-amber-400 font-mono block">
            {user.balanceTM.toLocaleString()} TM
          </span>
          <span className="text-[9px] text-tg-text-muted block">
            ≈ ${(user.balanceTM / db.settings.conversionRate).toFixed(2)} USDT
          </span>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-white/5 space-y-1">
          <div className="flex items-center gap-1 text-tg-text-muted">
            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[10px] uppercase font-bold tracking-wider">Total Approved Deposits</span>
          </div>
          <span className="text-sm font-bold text-white font-mono block">
            ${totalApprovedDeposits.toFixed(2)} USDT
          </span>
          <span className="text-[9px] text-tg-text-muted block">Required for rule unlocks</span>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-white/5 space-y-1">
          <div className="flex items-center gap-1 text-tg-text-muted">
            <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />
            <span className="text-[10px] uppercase font-bold tracking-wider">Approved Withdrawals</span>
          </div>
          <span className="text-sm font-bold text-white font-mono block">
            ${totalApprovedWithdrawals.toFixed(2)} USDT
          </span>
          <span className="text-[9px] text-tg-text-muted block">Processed payouts</span>
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

        {/* Copy referral link widget */}
        <div className="space-y-2 pt-1">
          <span className="text-[10px] text-tg-text-muted uppercase tracking-wider font-bold block">Your Custom Referral Link:</span>
          
          <div className="flex items-center gap-1.5 bg-tg-dark/50 border border-white/5 rounded-xl p-2.5">
            <span className="text-xs font-mono select-all truncate text-tg-blue-light block flex-1">
              {appBotUrl}
            </span>
            <button
              onClick={handleCopyReferral}
              className={`p-2 rounded-lg font-semibold transition shrink-0 flex items-center gap-1 ${
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
