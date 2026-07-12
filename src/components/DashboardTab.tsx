import React, { useState, useEffect } from 'react';
import { UserProfile, AppDatabase } from '../types';
import { claimDailyBonus, transferTMBalance } from '../lib/db';
import { 
  Coins, Wallet, Star, Flame, Trophy, 
  ArrowUpRight, ArrowDownLeft, Clock, Sparkles, CheckCircle2, AlertTriangle, ArrowRight,
  Send, Copy, Check, Info
} from 'lucide-react';
import { motion } from 'motion/react';
import { TopReferrers } from './TopReferrers';

interface DashboardTabProps {
  user: UserProfile;
  db: AppDatabase;
  onUpdateState: (user: UserProfile, db: AppDatabase) => void;
  onNavigateToTab: (tab: string) => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'info' | 'pending') => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  user,
  db,
  onUpdateState,
  onNavigateToTab,
  showToast
}) => {
  const [countdownText, setCountdownText] = useState<string>('00:00:00');
  const [canClaim, setCanClaim] = useState<boolean>(false);
  const [isClaiming, setIsClaiming] = useState<boolean>(false);
  const [claimStatus, setClaimStatus] = useState<{ success: boolean; msg: string } | null>(null);

  // P2P TM Share State
  const [recipientId, setRecipientId] = useState<string>('');
  const [transferAmount, setTransferAmount] = useState<string>('');
  const [isTransferring, setIsTransferring] = useState<boolean>(false);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [transferSuccess, setTransferSuccess] = useState<string | null>(null);
  const [isCopiedId, setIsCopiedId] = useState<boolean>(false);

  const handleCopyUserId = () => {
    navigator.clipboard.writeText(user.id);
    setIsCopiedId(true);
    setTimeout(() => setIsCopiedId(false), 2000);
  };

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError(null);
    setTransferSuccess(null);

    const amount = parseInt(transferAmount);
    if (isNaN(amount) || amount <= 0) {
      setTransferError("Please enter a valid positive TM amount.");
      return;
    }

    if (!recipientId.trim()) {
      setTransferError("Please enter the recipient's Telegram User ID.");
      return;
    }

    setIsTransferring(true);

    setTimeout(() => {
      const res = transferTMBalance(user.id, recipientId.trim(), amount);
      setIsTransferring(false);
      if (res.success) {
        onUpdateState(res.user!, res.db);
        if (showToast) {
          showToast(res.message, 'success');
        } else {
          setTransferSuccess(res.message);
        }
        setRecipientId('');
        setTransferAmount('');
      } else {
        if (showToast) {
          showToast(res.message, 'error');
        } else {
          setTransferError(res.message);
        }
      }
    }, 1000);
  };

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
        if (showToast) {
          showToast(res.message, 'success');
        } else {
          setClaimStatus({ success: true, msg: res.message });
          setTimeout(() => setClaimStatus(null), 5000);
        }
      } else {
        if (showToast) {
          showToast(res.message, 'error');
        } else {
          setClaimStatus({ success: false, msg: res.message });
          setTimeout(() => setClaimStatus(null), 5000);
        }
      }
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
      <div className="space-y-3">
        <h3 className="text-[10px] text-tg-text-muted font-bold uppercase tracking-widest px-1 font-display">Staking & Rewards Wallet</h3>
        
        <div className="grid grid-cols-2 gap-3.5">
          {/* Claimable Balance USDT */}
          <div className="glass-panel p-4 rounded-2xl border border-white/5 bg-tg-surface/30 relative overflow-hidden shadow-lg flex flex-col justify-between">
            <div className="absolute -top-3 -right-3 w-12 h-12 bg-emerald-500/5 rounded-full blur-md pointer-events-none" />
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-tg-text-muted">
                <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[9px] uppercase font-bold tracking-widest font-display">Withdrawable</span>
              </div>
              <div className="text-xl font-black font-display text-emerald-400 font-mono tracking-tight leading-none pt-0.5">
                ${user.balanceUSDT.toFixed(4)}
              </div>
            </div>
            <button
              onClick={() => onNavigateToTab('withdraw')}
              className="text-[10px] text-tg-blue hover:text-tg-blue-light font-bold flex items-center gap-1 pt-3 transition-colors group cursor-pointer"
            >
              <span>Instant Withdraw</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* Lifetime Earnings */}
          <div className="glass-panel p-4 rounded-2xl border border-white/5 bg-tg-surface/30 relative overflow-hidden shadow-lg flex flex-col justify-between">
            <div className="absolute -top-3 -right-3 w-12 h-12 bg-tg-blue/5 rounded-full blur-md pointer-events-none" />
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-tg-text-muted">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[9px] uppercase font-bold tracking-widest font-display">Total Payouts</span>
              </div>
              <div className="text-xl font-black font-display text-white font-mono tracking-tight leading-none pt-0.5">
                ${user.lifetimeEarningsUSDT.toFixed(4)}
              </div>
            </div>
            <span className="text-[9px] text-tg-text-muted/80 block pt-3">Staking + completions</span>
          </div>

          {/* Referral Earnings */}
          <div className="glass-panel p-4 rounded-2xl border border-white/5 bg-tg-surface/30 relative overflow-hidden shadow-lg flex flex-col justify-between">
            <div className="absolute -top-3 -right-3 w-12 h-12 bg-indigo-500/5 rounded-full blur-md pointer-events-none" />
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-tg-text-muted">
                <Coins className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-[9px] uppercase font-bold tracking-widest font-display">Referral Commission</span>
              </div>
              <div className="text-xl font-black font-display text-indigo-400 font-mono tracking-tight leading-none pt-0.5">
                ${user.referralEarningsUSDT.toFixed(4)}
              </div>
            </div>
            <div className="text-[9px] text-tg-text-muted flex justify-between items-center pt-3">
              <span className="font-semibold">{user.referralCount} Invites</span>
              <button onClick={() => onNavigateToTab('profile')} className="text-indigo-400 hover:text-indigo-300 font-bold hover:underline cursor-pointer">Invite</button>
            </div>
          </div>

          {/* Today's Claimed Bonus */}
          <div className="glass-panel p-4 rounded-2xl border border-white/5 bg-tg-surface/30 relative overflow-hidden shadow-lg flex flex-col justify-between">
            <div className="absolute -top-3 -right-3 w-12 h-12 bg-amber-400/5 rounded-full blur-md pointer-events-none" />
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-tg-text-muted">
                <Star className="w-3.5 h-3.5 text-amber-300" />
                <span className="text-[9px] uppercase font-bold tracking-widest font-display">Today's Yield</span>
              </div>
              <div className="text-xl font-black font-display text-amber-300 font-mono tracking-tight leading-none pt-0.5">
                ${user.todayBonusUSDT.toFixed(4)}
              </div>
            </div>
            <span className="text-[9px] text-tg-text-muted/80 block pt-3">Recent claiming yield</span>
          </div>
        </div>
      </div>

      {/* Deposit / Withdrawal Actions and Statuses */}
      <div className="grid grid-cols-2 gap-3.5">
        <button
          onClick={() => onNavigateToTab('deposit')}
          className="flex flex-col items-start justify-between gap-3 p-4 rounded-2xl border border-emerald-500/10 bg-emerald-950/5 hover:bg-emerald-950/10 text-left transition-all duration-200 cursor-pointer shadow-md"
        >
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <ArrowDownLeft className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-white font-display">Deposit USDT</span>
          </div>
          <span className="text-[10px] text-tg-text-muted/90 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
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
          className="flex flex-col items-start justify-between gap-3 p-4 rounded-2xl border border-tg-blue/15 bg-tg-blue/5 hover:bg-tg-blue/10 text-left transition-all duration-200 cursor-pointer shadow-md"
        >
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-tg-blue/15 text-tg-blue">
              <ArrowUpRight className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-white font-display">Withdraw USDT</span>
          </div>
          <span className="text-[10px] text-tg-text-muted/90 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-tg-blue animate-pulse" />
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

      {/* TM Token ID-to-ID Share (P2P Transfer) */}
      <div className="glass-panel p-4 rounded-xl border border-white/5 space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
          <div className="flex items-center gap-1.5">
            <span className="p-1 rounded-lg bg-tg-blue/15 text-tg-blue">
              <Send className="w-4 h-4" />
            </span>
            <span className="font-semibold text-xs text-white uppercase tracking-wider font-display">P2P Token Transfer</span>
          </div>
          
          <button
            onClick={handleCopyUserId}
            className="text-[10px] bg-white/5 hover:bg-white/10 text-tg-blue-light font-bold px-2 py-1 rounded transition flex items-center gap-1 border border-white/5"
          >
            {isCopiedId ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">Copied ID!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>My ID: {user.id}</span>
              </>
            )}
          </button>
        </div>

        <form onSubmit={handleTransfer} className="space-y-3.5">
          <div className="space-y-1.5">
            <label className="text-[10px] text-tg-text-muted uppercase font-bold tracking-wider block">Recipient Telegram User ID</label>
            <input
              type="text"
              value={recipientId}
              onChange={(e) => setRecipientId(e.target.value)}
              placeholder="e.g. 581923041"
              disabled={isTransferring}
              className="w-full bg-tg-dark/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-tg-text-muted/50 focus:outline-none focus:border-tg-blue/50 transition font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[10px] text-tg-text-muted uppercase font-bold tracking-wider block">Amount to Transfer (TM)</label>
              <button
                type="button"
                onClick={() => setTransferAmount(Math.floor(user.balanceTM).toString())}
                disabled={user.balanceTM <= 0 || isTransferring}
                className="text-[10px] text-tg-blue hover:text-tg-blue-light font-bold transition-colors"
              >
                Max Balance ({Math.floor(user.balanceTM).toLocaleString()})
              </button>
            </div>
            
            <div className="relative">
              <input
                type="number"
                min="1"
                step="1"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                placeholder="0"
                disabled={isTransferring}
                className="w-full bg-tg-dark/50 border border-white/10 rounded-xl pl-3.5 pr-12 py-2.5 text-xs text-white placeholder-tg-text-muted/50 focus:outline-none focus:border-tg-blue/50 transition font-mono"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-tg-text-muted">TM</span>
            </div>
          </div>

          {transferError && (
            <div className="bg-red-950/40 border border-red-500/30 text-red-300 p-2.5 rounded-lg text-xs font-semibold flex items-start gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-red-400" />
              <span>{transferError}</span>
            </div>
          )}

          {transferSuccess && (
            <div className="bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 p-2.5 rounded-lg text-xs font-semibold flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-400" />
              <span>{transferSuccess}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isTransferring || !recipientId.trim() || !transferAmount || Number(transferAmount) <= 0 || user.balanceTM < Number(transferAmount)}
            className={`w-full py-2.5 rounded-xl text-xs font-bold font-display transition flex items-center justify-center gap-1.5 ${
              isTransferring
                ? 'bg-tg-surface-light text-tg-text-muted cursor-wait'
                : !recipientId.trim() || !transferAmount || Number(transferAmount) <= 0 || user.balanceTM < Number(transferAmount)
                  ? 'bg-white/5 text-tg-text-muted/40 cursor-not-allowed border border-white/5'
                  : 'bg-tg-blue hover:bg-tg-blue-light text-white glow-blue'
            }`}
          >
            {isTransferring ? 'Processing Transfer...' : 'Send TM Token Instantly'}
          </button>
        </form>

        <div className="flex items-start gap-1.5 p-2 bg-tg-dark/30 border border-white/5 rounded-lg text-[10px] text-tg-text-muted">
          <Info className="w-3.5 h-3.5 text-tg-blue shrink-0 mt-0.5" />
          <span>This feature allows instant TM Token peer-to-peer transfers inside the TM Digital network based on Telegram User ID. Transfers are fully secure and complete in real-time.</span>
        </div>
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
