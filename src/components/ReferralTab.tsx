import React, { useState } from 'react';
import { UserProfile, AppDatabase } from '../types';
import { TopReferrers } from './TopReferrers';
import { Copy, Check, Users, Gift, Share2, Sparkles, TrendingUp, DollarSign } from 'lucide-react';

interface ReferralTabProps {
  user: UserProfile;
  db: AppDatabase;
  showToast?: (message: string, type?: 'success' | 'error' | 'info' | 'pending') => void;
}

export const ReferralTab: React.FC<ReferralTabProps> = ({
  user,
  db,
  showToast
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  // Generate Website-based Referral Link using user's unique numeric UID
  const referralLink = `${window.location.origin}?ref=${user.uid}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    if (showToast) {
      showToast("📋 Referral link copied to clipboard!", "success");
    }
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'TM Digital Earning',
        text: `Join TM Digital and start earning today! Use my UID ${user.uid} for premium rewards.`,
        url: referralLink,
      }).catch(err => console.log('Share failed:', err));
    } else {
      handleCopyLink();
    }
  };

  // Find all users referred by this user
  const referredUsers = db.users.filter(u => u.referredBy === user.id);

  return (
    <div className="space-y-5 pb-28">
      {/* 1. Header Banner */}
      <div className="glass-panel p-5 rounded-2xl border border-white/5 relative overflow-hidden shadow-xl shadow-black/30 bg-gradient-to-br from-[#0c1329] to-[#040814]">
        <div className="absolute top-0 right-0 w-32 h-32 bg-tg-blue/15 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-tg-blue/10 border border-tg-blue/20 text-tg-blue flex items-center justify-center shrink-0 animate-pulse">
            <Gift className="w-5 h-5 text-tg-blue-light" />
          </div>
          <div className="text-left">
            <h2 className="font-extrabold text-sm text-white font-display uppercase tracking-wider flex items-center gap-1.5">
              <span>Referral Program</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </h2>
            <p className="text-[10px] text-tg-text-muted mt-0.5 leading-snug">
              Share your website link and earn instant USDT rewards for every friend who joins!
            </p>
          </div>
        </div>
      </div>

      {/* 2. Referral Stats Card */}
      <div className="grid grid-cols-2 gap-3.5">
        <div className="glass-panel p-4 rounded-2xl border border-white/5 bg-tg-surface/30 relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 w-12 h-12 bg-tg-blue/5 rounded-full blur-lg" />
          <span className="text-[9px] text-tg-text-muted uppercase tracking-widest block font-bold font-display">Total Invites</span>
          <div className="flex items-baseline gap-1 mt-1.5">
            <span className="text-3xl font-black font-display text-tg-blue font-mono tracking-tight">
              {user.referralCount || 0}
            </span>
            <span className="text-xs text-tg-text-muted font-bold">friends</span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-white/5 bg-tg-surface/30 relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 w-12 h-12 bg-amber-500/5 rounded-full blur-lg" />
          <span className="text-[9px] text-tg-text-muted uppercase tracking-widest block font-bold font-display">Referral Income</span>
          <div className="flex items-baseline gap-0.5 mt-1.5">
            <span className="text-xs font-bold text-slate-400 mr-0.5">$</span>
            <span className="text-3xl font-black font-display text-amber-400 font-mono tracking-tight">
              {(user.referralEarningsUSDT || 0).toFixed(3)}
            </span>
            <span className="text-[10px] text-tg-text-muted font-bold uppercase ml-1">USDT</span>
          </div>
        </div>
      </div>

      {/* 3. Link Generator Panel */}
      <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
        <div className="text-left space-y-1">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider font-display">Your Referral Link</h3>
          <p className="text-[10px] text-tg-text-muted leading-relaxed">
            Every person who signs up using this link will instantly be registered under your network, awarding you <strong className="text-amber-400 font-bold">$0.03 USDT</strong> instantly.
          </p>
        </div>

        {/* Copy Link Input group */}
        <div className="flex items-center gap-2 bg-tg-dark/50 border border-white/5 rounded-xl p-1.5 pl-3">
          <span className="text-xs text-tg-text-muted select-all font-mono truncate flex-1 text-left">
            {referralLink}
          </span>
          <button
            onClick={handleCopyLink}
            className="bg-tg-blue hover:bg-tg-blue-light text-white p-2.5 rounded-lg transition duration-200 shrink-0 cursor-pointer focus:outline-none"
            title="Copy Link"
            id="copy_referral_link_btn"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleCopyLink}
            className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-xl border border-white/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer focus:outline-none"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copy Link</span>
          </button>
          <button
            onClick={handleShare}
            className="w-full py-2.5 bg-tg-blue hover:bg-tg-blue-light text-white text-xs font-bold rounded-xl shadow-md shadow-tg-blue/15 transition-all flex items-center justify-center gap-1.5 cursor-pointer focus:outline-none animate-pulse-slow"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share Link</span>
          </button>
        </div>
      </div>

      {/* 4. Referral Rewards Info Panel */}
      <div className="glass-panel p-5 rounded-2xl border border-white/5 text-left space-y-3.5">
        <h4 className="text-xs text-white font-bold uppercase tracking-wider font-display flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <span>Referral Commission Tiers</span>
        </h4>
        
        <div className="space-y-2.5">
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 text-xs">
            <div>
              <span className="font-bold text-white block">Instant Join Bonus</span>
              <span className="text-[9px] text-tg-text-muted block mt-0.5">Awarded instantly upon friend registration</span>
            </div>
            <div className="text-right">
              <span className="font-bold text-emerald-400 block font-mono">+$0.03 USDT</span>
              <span className="text-[9px] text-tg-text-muted block">Direct Balance</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 text-xs">
            <div>
              <span className="font-bold text-white block">Starter Deposit Milestone</span>
              <span className="text-[9px] text-tg-text-muted block mt-0.5">Awarded when friend cumulative deposit reach $10 USDT</span>
            </div>
            <div className="text-right">
              <span className="font-bold text-emerald-400 block font-mono">+$3.00 USDT</span>
              <span className="text-[9px] text-tg-text-muted block">Withdrawable</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Top Referrers Leaderboard */}
      <TopReferrers currentUser={user} db={db} />

      {/* 6. My Referrals List */}
      <div className="glass-panel p-5 rounded-2xl border border-white/5 text-left space-y-4">
        <h4 className="text-xs text-white font-bold uppercase tracking-wider font-display flex items-center gap-1.5">
          <Users className="w-4 h-4 text-tg-blue" />
          <span>My Network ({referredUsers.length})</span>
        </h4>

        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {referredUsers.length === 0 ? (
            <div className="text-center py-4 text-xs text-tg-text-muted">
              No direct referrals under your link yet.
            </div>
          ) : (
            referredUsers.map((u) => (
              <div key={u.id} className="flex items-center justify-between p-2.5 bg-white/5 rounded-xl border border-white/5">
                <div className="flex items-center gap-2.5">
                  <img
                    src={u.photoUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.firstName}`}
                    alt={u.firstName}
                    className="w-8 h-8 rounded-full border border-white/5 object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <p className="text-xs font-semibold text-white truncate max-w-[150px]">
                      {u.firstName} {u.lastName || ''}
                    </p>
                    <p className="text-[8px] text-tg-text-muted">UID: {u.uid}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-mono font-bold text-emerald-400">
                    +{u.balanceTM.toLocaleString()} TM
                  </p>
                  <p className="text-[8px] text-tg-text-muted">Balance</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
export default ReferralTab;
