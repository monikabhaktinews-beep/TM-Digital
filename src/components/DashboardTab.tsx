import React, { useState, useEffect } from 'react';
import { UserProfile, AppDatabase } from '../types';
import { claimDailyBonus } from '../lib/db';
import { 
  Coins, Wallet, Star, Flame, Trophy, 
  ArrowUpRight, ArrowDownLeft, Clock, Sparkles, CheckCircle2, AlertTriangle, ArrowRight 
} from 'lucide-react';
import { motion } from 'motion/react';
import { TopReferrers } from './TopReferrers';

interface DashboardTabProps {
  user: UserProfile;
  db: AppDatabase;
  onUpdateState: (user: UserProfile, db: AppDatabase) => void;
  onNavigateToTab: (tab: string) => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  user,
  db,
  onUpdateState,
  onNavigateToTab
}) => {
  const [countdownText, setCountdownText] = useState<string>('00:00:00');
  const [canClaim, setCanClaim] = useState<boolean>(false);
  const [isClaiming, setIsClaiming] = useState<boolean>(false);
  const [claimStatus, setClaimStatus] = useState<{ success: boolean; msg: string } | null>(null);

  // Filter transaction log for this specific user
  const userTransactions = db.transactions
    .filter(tx => tx.userId === user.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Daily bonus countdown calculation
  useEffect(() => {
    const interval = setInterval(() => {
      const lastClaimStr = db.claimedBonuses[user.id];
      if (!lastClaimStr) {
        setCountdownText('Ready to Claim');
        setCanClaim(user.balanceTM >= 1000);
        return;
      }

      const lastClaim = new Date(lastClaimStr);
      const nextClaim = new Date(lastClaim.getTime() + db.settings.dailyBonusIntervalHours * 60 * 60 * 1000);
      const now = new Date();

      const diffMs = nextClaim.getTime() - now.getTime();

      if (diffMs <= 0) {
        setCountdownText('Ready to Claim');
        setCanClaim(user.balanceTM >= 1000);
      } else {
        setCanClaim(false);
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

        const pad = (num: number) => num.toString().padStart(2, '0');
        setCountdownText(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [user.balanceTM, db.claimedBonuses, db.settings.dailyBonusIntervalHours]);

  const handleClaim = () => {
    if (!canClaim) return;
    setIsClaiming(true);

    setTimeout(() => {
      const res = claimDailyBonus(user.id);
      setIsClaiming(false);
      if (res.success) {
        onUpdateState(res.user, res.db);
        setClaimStatus({ success: true, msg: res.message });
      } else {
        setClaimStatus({ success: false, msg: res.message });
      }
      setTimeout(() => setClaimStatus(null), 5000);
    }, 1200);
  };

  const thousandsOfTM = Math.floor(user.balanceTM / 1000);
  const potentialDailyBonus = Number((thousandsOfTM * db.settings.dailyBonusRateUSDT).toFixed(4));

  return (
    <div className="space-y-5">
      {/* Dynamic Staking / Holding Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-tg-blue/30 via-tg-surface-light to-tg-surface border border-tg-blue/20 p-5 rounded-2xl glow-blue">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Flame className="w-24 h-24 text-tg-blue" />
        </div>
        
        <div className="relative space-y-4">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-tg-blue/20 text-tg-blue">
              <Sparkles className="w-4 h-4 animate-spin-slow" />
            </span>
            <span className="text-[10px] uppercase tracking-wider font-bold text-tg-blue-light font-display">Holding Power Staking</span>
          </div>

          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-xs text-tg-text-muted block">Current Active Holding Balance</span>
              <span className="text-3xl font-extrabold font-display text-white">{user.balanceTM.toLocaleString()} <span className="text-sm font-semibold text-tg-blue-light font-sans">TM</span></span>
            </div>
            <div className="text-right">
              <span className="text-xs text-tg-text-muted block">Estimated Value</span>
              <span className="text-lg font-bold font-display text-emerald-400">${(user.balanceTM / db.settings.conversionRate).toFixed(2)} <span className="text-xs font-semibold font-sans">USDT</span></span>
            </div>
          </div>

          {/* Staking Bonus Claim UI */}
          <div className="bg-tg-dark/40 border border-white/5 rounded-xl p-3.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs font-semibold text-white">
                <Clock className="w-3.5 h-3.5 text-tg-blue" />
                <span>Next Claim Window:</span>
                <span className={`font-mono px-2 py-0.5 rounded ${canClaim ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-400 bg-amber-500/10'}`}>
                  {countdownText}
                </span>
              </div>
              <p className="text-[10px] text-tg-text-muted">
                Every 1,000 TM earns {db.settings.dailyBonusRateUSDT} USDT daily. Your potential bonus today: <span className="text-emerald-400 font-bold">{potentialDailyBonus} USDT</span>.
              </p>
            </div>

            <button
              onClick={handleClaim}
              disabled={!canClaim || isClaiming}
              className={`py-2 px-4 rounded-lg text-xs font-bold font-display transition shrink-0 ${
                canClaim 
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-tg-dark glow-green' 
                  : 'bg-tg-surface-light text-tg-text-muted border border-white/5 cursor-not-allowed'
              }`}
            >
              {isClaiming ? 'Claiming...' : 'Claim Daily Bonus'}
            </button>
          </div>

          {claimStatus && (
            <div className={`p-2.5 rounded-lg text-xs font-medium text-center border ${
              claimStatus.success 
                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' 
                : 'bg-red-950/40 border-red-500/30 text-red-300'
            }`}>
              {claimStatus.msg}
            </div>
          )}
        </div>
      </div>

      {/* Main Financial stats grid */}
      <div>
        <h3 className="text-xs text-tg-text-muted font-bold uppercase tracking-wider mb-2.5 px-1 font-display">Staking & Rewards Wallet</h3>
        
        <div className="grid grid-cols-2 gap-3">
          {/* Claimable Balance USDT */}
          <div className="glass-panel p-4 rounded-xl border border-white/5 space-y-1">
            <div className="flex items-center gap-1 text-tg-text-muted">
              <Wallet className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px] uppercase font-bold tracking-wider">Withdrawable USDT</span>
            </div>
            <div className="text-xl font-bold font-display text-emerald-400">
              ${user.balanceUSDT.toFixed(4)}
            </div>
            <button
              onClick={() => onNavigateToTab('withdraw')}
              className="text-[10px] text-tg-blue hover:text-tg-blue-light font-semibold flex items-center gap-0.5 pt-1.5 transition"
            >
              <span>Instant Withdraw</span>
              <ArrowRight className="w-2.5 h-2.5" />
            </button>
          </div>

          {/* Lifetime Earnings */}
          <div className="glass-panel p-4 rounded-xl border border-white/5 space-y-1">
            <div className="flex items-center gap-1 text-tg-text-muted">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[10px] uppercase font-bold tracking-wider">Lifetime Earnings</span>
            </div>
            <div className="text-xl font-bold font-display text-white">
              ${user.lifetimeEarningsUSDT.toFixed(4)}
            </div>
            <span className="text-[9px] text-tg-text-muted block">Staking + Task completions</span>
          </div>

          {/* Referral Earnings */}
          <div className="glass-panel p-4 rounded-xl border border-white/5 space-y-1">
            <div className="flex items-center gap-1 text-tg-text-muted">
              <Coins className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-[10px] uppercase font-bold tracking-wider">Referral Earnings</span>
            </div>
            <div className="text-xl font-bold font-display text-white">
              ${user.referralEarningsUSDT.toFixed(4)}
            </div>
            <div className="text-[9px] text-tg-text-muted flex justify-between items-center pt-1">
              <span>{user.referralCount} Invites</span>
              <button onClick={() => onNavigateToTab('profile')} className="text-indigo-400 hover:underline">Invite</button>
            </div>
          </div>

          {/* Today's Claimed Bonus */}
          <div className="glass-panel p-4 rounded-xl border border-white/5 space-y-1">
            <div className="flex items-center gap-1 text-tg-text-muted">
              <Star className="w-3.5 h-3.5 text-amber-300" />
              <span className="text-[10px] uppercase font-bold tracking-wider">Today's Bonus</span>
            </div>
            <div className="text-xl font-bold font-display text-amber-300">
              ${user.todayBonusUSDT.toFixed(4)}
            </div>
            <span className="text-[9px] text-tg-text-muted block">Recent claiming yield</span>
          </div>
        </div>
      </div>

      {/* Deposit / Withdrawal Actions and Statuses */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onNavigateToTab('deposit')}
          className="flex flex-col items-start gap-1 p-3.5 rounded-xl border border-emerald-500/10 bg-emerald-950/5 hover:bg-emerald-950/10 text-left transition"
        >
          <div className="flex items-center gap-1.5">
            <span className="p-1 rounded bg-emerald-500/10 text-emerald-400">
              <ArrowDownLeft className="w-4 h-4" />
            </span>
            <span className="text-xs font-semibold text-white">Deposit USDT</span>
          </div>
          <span className="text-[10px] text-tg-text-muted pt-1">
            Status:{' '}
            {user.depositStatus === 'Approved' ? (
              <span className="text-emerald-400 font-bold">Active</span>
            ) : user.depositStatus === 'Pending' ? (
              <span className="text-amber-400 font-bold">Pending Review</span>
            ) : (
              <span className="text-tg-text-muted">No Deposits</span>
            )}
          </span>
        </button>

        <button
          onClick={() => onNavigateToTab('withdraw')}
          className="flex flex-col items-start gap-1 p-3.5 rounded-xl border border-tg-blue/10 bg-tg-blue/5 hover:bg-tg-blue/10 text-left transition"
        >
          <div className="flex items-center gap-1.5">
            <span className="p-1 rounded bg-tg-blue/10 text-tg-blue">
              <ArrowUpRight className="w-4 h-4" />
            </span>
            <span className="text-xs font-semibold text-white">Withdraw USDT</span>
          </div>
          <span className="text-[10px] text-tg-text-muted pt-1">
            Status:{' '}
            {user.withdrawStatus === 'Approved' ? (
              <span className="text-emerald-400 font-bold">Approved</span>
            ) : user.withdrawStatus === 'Pending' ? (
              <span className="text-amber-400 font-bold">Pending Approval</span>
            ) : (
              <span className="text-tg-text-muted">No Pending</span>
            )}
          </span>
        </button>
      </div>

      {/* Transaction History Logs */}
      <div className="space-y-2.5">
        <h3 className="text-xs text-tg-text-muted font-bold uppercase tracking-wider px-1 font-display">Recent Yield & Transactions</h3>

        <div className="glass-panel rounded-xl border border-white/5 divide-y divide-white/5">
          {userTransactions.length === 0 ? (
            <div className="p-6 text-center text-xs text-tg-text-muted">
              No recent transactions recorded in this account. Complete some tasks first!
            </div>
          ) : (
            userTransactions.map((tx) => {
              const isPositive = tx.amountTM > 0 || tx.amountUSDT > 0;
              const isNeg = tx.amountTM < 0 || tx.amountUSDT < 0;
              
              return (
                <div key={tx.id} className="p-3.5 flex items-start justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <span className="font-semibold text-white block">{tx.description}</span>
                    <span className="text-[10px] text-tg-text-muted block">
                      {new Date(tx.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    {tx.amountTM !== 0 && (
                      <span className={`font-mono font-bold block ${isPositive ? 'text-emerald-400' : isNeg ? 'text-red-400' : 'text-tg-text'}`}>
                        {tx.amountTM > 0 ? '+' : ''}{tx.amountTM.toLocaleString()} TM
                      </span>
                    )}
                    {tx.amountUSDT !== 0 && (
                      <span className={`font-mono font-bold block text-xs ${isPositive ? 'text-emerald-400' : isNeg ? 'text-red-400' : 'text-tg-text'}`}>
                        {tx.amountUSDT > 0 ? '+' : ''}${tx.amountUSDT.toFixed(3)} USDT
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Top Referrers Leaderboard */}
      <TopReferrers currentUser={user} db={db} />
    </div>
  );
};
export default DashboardTab;
