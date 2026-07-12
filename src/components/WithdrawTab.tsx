import React, { useState } from 'react';
import { UserProfile, AppDatabase } from '../types';
import { submitWithdrawal, getLifetimeApprovedDeposits } from '../lib/db';
import { ShieldAlert, AlertCircle, CheckCircle, ArrowUpRight, HelpCircle, Wallet } from 'lucide-react';

interface WithdrawTabProps {
  user: UserProfile;
  db: AppDatabase;
  onUpdateState: (user: UserProfile, db: AppDatabase) => void;
  onNavigateToTab: (tab: string) => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'info' | 'pending') => void;
}

export const WithdrawTab: React.FC<WithdrawTabProps> = ({
  user,
  db,
  onUpdateState,
  onNavigateToTab,
  showToast
}) => {
  const [amount, setAmount] = useState<string>('');
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Compute lifetime approved deposits
  const lifetimeDeposits = getLifetimeApprovedDeposits(user.id, db);

  // Find the first rule that is not yet satisfied
  const nextLockedRule = db.withdrawalRules.find(rule => lifetimeDeposits < rule.requiredLifetimeDepositUSDT);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const amtNum = parseFloat(amount);
    if (!amount || isNaN(amtNum) || amtNum <= 0) {
      setErrorMsg("Please enter a valid withdrawal amount.");
      if (showToast) showToast("Invalid withdrawal amount.", "error");
      return;
    }

    if (amtNum < 0.1) {
      setErrorMsg("Minimum withdrawal amount is 0.1 USDT.");
      if (showToast) showToast("Minimum withdrawal is 0.1 USDT.", "error");
      return;
    }

    if (!walletAddress.trim()) {
      setErrorMsg("Please enter your receiving USDT BEP20 Wallet Address.");
      if (showToast) showToast("Receiving address is required.", "error");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const res = submitWithdrawal(user.id, amtNum, walletAddress.trim());
      setLoading(false);
      
      if (res.success) {
        onUpdateState(res.user, res.db);
        if (showToast) {
          showToast("Withdrawal submitted! Admin will process the transaction soon.", "success");
        } else {
          setSuccessMsg(res.message);
        }
        setAmount('');
        setWalletAddress('');
      } else {
        setErrorMsg(res.message);
        if (showToast) showToast(res.message, "error");
      }
    }, 1500);
  };

  // User's withdrawal requests
  const withdrawalHistory = db.withdrawals.filter(w => w.userId === user.id);

  return (
    <div className="space-y-5">
      {/* Wallet Balance Card */}
      <div className="glass-panel p-5 rounded-2xl border border-white/5 bg-gradient-to-br from-tg-surface via-tg-dark/40 to-tg-surface flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-tg-text-muted text-xs">
            <Wallet className="w-4 h-4 text-emerald-400" />
            <span className="font-bold uppercase tracking-wider">Withdrawable USDT Balance</span>
          </div>
          <span className="text-3xl font-extrabold font-display text-emerald-400">
            ${user.balanceUSDT.toFixed(4)} <span className="text-xs text-tg-text-muted font-sans font-semibold">USDT</span>
          </span>
          <p className="text-[10px] text-tg-text-muted leading-relaxed">
            Earnings generated from daily holding staking, completed optional tasks, and referral commission rewards.
          </p>
        </div>

        <div className="bg-tg-dark/60 border border-white/5 rounded-xl p-3 space-y-1 md:w-52 shrink-0">
          <span className="text-[9px] text-tg-text-muted uppercase tracking-wider font-bold block">Approved Deposit History</span>
          <span className="text-lg font-bold font-mono text-white">${lifetimeDeposits.toFixed(2)} USDT</span>
          <p className="text-[9px] text-tg-text-muted">
            Used to check withdrawal rules eligibility. (Balance cannot be used).
          </p>
        </div>
      </div>

      {/* Rules Eligibility Panel */}
      <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-3">
        <div>
          <h4 className="font-semibold text-sm text-white font-display flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>Anti-Fake Verification Check</span>
          </h4>
          <p className="text-[10px] text-tg-text-muted leading-relaxed">
            A one-time security deposit is required to verify your wallet and prevent multiple fake accounts or automated bot spam.
          </p>
        </div>

        <div className="space-y-2">
          {nextLockedRule ? (
            <div className="p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 bg-amber-950/10 border-amber-500/25 text-amber-300">
              <div className="space-y-1">
                <span className="font-semibold text-white text-xs block">
                  One-Time Security Deposit Verification
                </span>
                <p className="text-[10px] opacity-80 leading-relaxed">
                  Deposit a total of <strong className="text-amber-400">$1.00 USDT</strong> on BEP20 (BSC Network) to verify your account. Once verified, you can withdraw any amount as many times as you like. You have currently deposited <strong className="text-white">${lifetimeDeposits.toFixed(2)} USDT</strong>.
                </p>
              </div>
              <span className="text-[9px] font-bold uppercase px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                Not Verified
              </span>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 bg-emerald-950/10 border-emerald-500/25 text-emerald-300">
              <div className="space-y-1">
                <span className="font-semibold text-white text-xs block">Anti-Fake Verification Completed!</span>
                <p className="text-[10px] opacity-80 leading-relaxed">
                  Congratulations! Your account is verified with a lifetime approved deposit total of <strong className="text-emerald-400">${lifetimeDeposits.toFixed(2)} USDT</strong>. Lifetime unlimited withdrawals are fully unlocked.
                </p>
              </div>
              <span className="text-[9px] font-bold uppercase px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                Verified
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Submission Form */}
      <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
        <div>
          <h4 className="font-semibold text-sm text-white font-display">Request Instant Withdrawal</h4>
          <p className="text-[10px] text-tg-text-muted">Requests are processed manually within 1-12 hours.</p>
        </div>

        {db.settings.withdrawEnabled === false ? (
          <div className="bg-red-500/10 border border-red-500/25 rounded-2xl p-4 text-center space-y-2.5 animate-pulse-slow">
            <div className="w-10 h-10 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="text-xs font-semibold text-red-300 leading-relaxed whitespace-pre-line">
              {db.settings.withdrawDisabledMessage || "🚫 Withdrawals are temporarily unavailable.\nPlease try again later."}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] text-tg-text-muted uppercase tracking-wider font-bold block">USDT Withdrawal Amount</label>
              <input
                type="number"
                step="any"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-tg-dark/50 border border-white/5 focus:border-tg-blue/50 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none transition font-mono font-bold"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-tg-text-muted uppercase tracking-wider font-bold block">Your Receiving USDT Wallet Address (BEP20 Only)</label>
              <input
                type="text"
                placeholder="Enter your USDT BEP20 Wallet Address"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                className="w-full bg-tg-dark/50 border border-white/5 focus:border-tg-blue/50 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition font-mono font-bold"
                required
              />
            </div>

            {errorMsg && (
              <div className="bg-red-950/40 border border-red-500/30 text-red-300 p-2.5 rounded-lg text-xs font-semibold flex items-start gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 p-2.5 rounded-lg text-xs font-semibold flex items-start gap-1.5">
                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-tg-blue hover:bg-tg-blue-light text-white font-semibold font-display text-xs py-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              {loading ? 'Processing...' : 'Submit Withdrawal Request'}
            </button>
          </form>
        )}
      </div>

      {/* History */}
      <div className="space-y-2.5">
        <h4 className="text-xs text-tg-text-muted font-bold uppercase tracking-wider px-1 font-display">Withdrawal History</h4>

        <div className="glass-panel rounded-xl border border-white/5 divide-y divide-white/5">
          {withdrawalHistory.length === 0 ? (
            <div className="p-6 text-center text-xs text-tg-text-muted">
              No withdrawals submitted yet in this account.
            </div>
          ) : (
            withdrawalHistory.map((w) => (
              <div key={w.id} className="p-3.5 flex items-start justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <span className="font-semibold text-white block">Withdrawal of {w.amountUSDT} USDT</span>
                  <span className="text-[9px] font-mono text-tg-text-muted block truncate max-w-xs">
                    To Address: {w.walletAddress}
                  </span>
                  <span className="text-[9px] text-tg-text-muted block">
                    {new Date(w.createdAt).toLocaleString()}
                  </span>
                </div>

                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  w.status === 'Approved' 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                    : w.status === 'Rejected' 
                      ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}>
                  {w.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
export default WithdrawTab;
