import React, { useState, useRef } from 'react';
import { UserProfile, AppDatabase } from '../types';
import { submitDeposit } from '../lib/db';
import { 
  Copy, CheckCircle, AlertCircle, ArrowLeft, Coins, 
  ArrowRight, ShieldCheck, Wallet, QrCode, ClipboardCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DepositTabProps {
  user: UserProfile;
  db: AppDatabase;
  onUpdateState: (user: UserProfile, db: AppDatabase) => void;
  onNavigateToTab: (tab: string) => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'info' | 'pending') => void;
}

export const DepositTab: React.FC<DepositTabProps> = ({
  user,
  db,
  onUpdateState,
  onNavigateToTab,
  showToast
}) => {
  const [amount, setAmount] = useState<string>('2');
  const [txid, setTxid] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Control showing of payment details and TXID submission form
  const [showPaymentDetails, setShowPaymentDetails] = useState<boolean>(false);
  const paymentDetailsRef = useRef<HTMLDivElement>(null);

  const conversionRate = db.settings.conversionRate || 1000;
  const minDeposit = db.settings.depositMinUSDT ?? 1.0;

  // Calculate equivalent TM received based on USD/USDT input
  const usdtAmount = parseFloat(amount) || 0;
  const tmReceived = usdtAmount * conversionRate;

  // Staking plans / Return Tiers matching the screenshot
  const plans = [
    { id: 1, limit: 0, returnRate: 5.5, label: "Amount >= 0 TM ($0+ USDT)" },
    { id: 2, limit: 20000, returnRate: 6.0, label: "Amount >= 20,000 TM ($20+ USDT)" },
    { id: 3, limit: 300000, returnRate: 6.5, label: "Amount >= 300,000 TM ($300+ USDT)", isPopular: true },
    { id: 4, limit: 3000000, returnRate: 7.0, label: "Amount >= 3,000,000+ TM ($3,000+ USDT)" },
  ];

  // Determine active plan tier based on input amount
  const getActivePlanId = (tmVal: number) => {
    if (tmVal >= 3000000) return 4;
    if (tmVal >= 300000) return 3;
    if (tmVal >= 20000) return 2;
    return 1;
  };

  const activePlanId = getActivePlanId(tmReceived);
  const currentPlan = plans.find(p => p.id === activePlanId) || plans[0];

  // Estimated yields in USDT ($)
  const estimatedDailyRewardUSDT = (usdtAmount * currentPlan.returnRate) / 100;
  const estimated10DaysRewardUSDT = estimatedDailyRewardUSDT * 10;
  const estimatedProfitUSDT = estimated10DaysRewardUSDT; // Staking net profit

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(db.settings.walletAddressUSDT);
    setIsCopied(true);
    if (showToast) {
      showToast("📋 USDT BEP20 Address copied!", "success");
    }
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Trigger when clicking "Continue"
  const handleContinue = () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    const amtNum = parseFloat(amount);
    if (!amount || isNaN(amtNum) || amtNum <= 0) {
      setErrorMsg(`Please enter a valid deposit amount.`);
      if (showToast) showToast("Please enter a valid amount.", "error");
      return;
    }

    if (amtNum < minDeposit) {
      setErrorMsg(`Minimum deposit amount is ${minDeposit} USDT.`);
      if (showToast) showToast(`Minimum deposit is ${minDeposit} USDT.`, "error");
      return;
    }

    setShowPaymentDetails(true);
    setTimeout(() => {
      paymentDetailsRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSubmitTXID = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const amtNum = parseFloat(amount);
    if (!amount || isNaN(amtNum) || amtNum <= 0) {
      setErrorMsg("Please enter a valid deposit amount in USDT.");
      return;
    }

    if (!txid.trim()) {
      setErrorMsg("Transaction Hash (TXID) is required to verify the blockchain transfer.");
      if (showToast) showToast("TXID hash is required.", "error");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const res = submitDeposit(user.id, amtNum, txid.trim(), "");
      setLoading(false);
      
      if (res.success) {
        onUpdateState(res.user, res.db);
        if (showToast) {
          showToast("🎉 Deposit submitted successfully! Admin will audit shortly.", "success");
        } else {
          setSuccessMsg(res.message);
        }
        // Reset states
        setAmount('');
        setTxid('');
        setShowPaymentDetails(false);
      } else {
        setErrorMsg(res.message);
        if (showToast) showToast(res.message, "error");
      }
    }, 1500);
  };

  const depositHistory = db.deposits.filter(d => d.userId === user.id);

  return (
    <div className="space-y-5 pb-24">
      
      {/* HEADER WITH BACK ARROW (Inspired by Screenshot 2) */}
      <div className="flex items-center gap-3 p-1">
        <button 
          onClick={() => onNavigateToTab('profile')}
          className="p-2 rounded-xl bg-white/5 border border-white/5 text-tg-text-muted hover:text-white transition cursor-pointer"
          title="Back to Home"
          id="deposit_back_btn"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h3 className="font-extrabold text-base text-white font-display">Deposit TM</h3>
          <p className="text-[10px] text-tg-text-muted">Acquire TM Staking Power and multiply your returns</p>
        </div>
      </div>

      {/* TM DEPOSIT PLANS (Inspired by Screenshot 2: Daily Return Tiers) */}
      <div className="space-y-2.5">
        <span className="text-xs text-tg-text-muted font-bold uppercase tracking-wider px-1 block font-display">
          TM Deposit Plans
        </span>

        <div className="grid grid-cols-1 gap-2.5" id="deposit_plans_grid">
          {plans.map((plan) => {
            const isSelected = activePlanId === plan.id;
            return (
              <div 
                key={plan.id}
                className={`p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden flex items-center justify-between ${
                  isSelected 
                    ? 'bg-tg-blue/15 border-tg-blue shadow-lg shadow-tg-blue/10 scale-[1.01]' 
                    : 'glass-panel border-white/5 bg-white/5 hover:bg-white/8'
                }`}
              >
                {/* Visual circle selector */}
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full font-bold text-xs flex items-center justify-center border transition-colors ${
                    isSelected 
                      ? 'bg-tg-blue border-white text-white' 
                      : 'border-white/20 text-tg-text-muted bg-white/5'
                  }`}>
                    {plan.id}
                  </div>
                  <div>
                    <span className={`text-xs font-bold block ${isSelected ? 'text-white' : 'text-tg-text-muted'}`}>
                      {plan.label}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-tg-text-muted block font-semibold uppercase tracking-wider">Return</span>
                  <span className={`text-sm font-black ${isSelected ? 'text-tg-blue-light' : 'text-white'}`}>
                    {plan.returnRate.toFixed(1)}%
                  </span>
                </div>

                {/* Popular badge */}
                {plan.isPopular && (
                  <div className="absolute right-12 top-0 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[7px] font-black px-2 py-0.5 rounded-b-md uppercase tracking-wider shadow">
                    Popular
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* CALCULATOR / USER INPUT (Inspired by Calculator in Screenshot 2) */}
      <div className="glass-panel p-5 rounded-3xl border border-white/5 space-y-4" id="deposit_calculator_card">
        <div>
          <span className="text-[10px] text-tg-text-muted font-black uppercase tracking-wider block">
            You Want to Deposit (USDT Amount)
          </span>
          
          <div className="relative mt-2">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {/* Styled Tether symbol */}
              <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-[10px] tracking-tighter">
                ₮
              </div>
            </div>
            
            <input
              type="number"
              step="any"
              placeholder={`Min $${minDeposit.toFixed(2)} USDT`}
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setShowPaymentDetails(false); // require Continue click to re-validate if edited
              }}
              className="w-full bg-tg-dark/50 border border-white/10 focus:border-tg-blue rounded-2xl py-3.5 pl-12 pr-16 text-sm text-white font-mono font-bold focus:outline-none transition-all placeholder:text-white/20 placeholder:font-sans placeholder:font-normal"
              id="calculator_amount_input"
              required
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-tg-text-muted font-extrabold uppercase">
              USDT
            </span>
          </div>
        </div>

        {/* You Will Receive (USDT value mapped to TM) */}
        <div className="flex items-center justify-between p-3.5 bg-tg-blue/5 border border-tg-blue/10 rounded-2xl">
          <span className="text-xs text-tg-text-muted font-bold">You Will Receive:</span>
          <div className="flex items-center gap-1 text-sm font-extrabold text-amber-400 font-mono">
            <Coins className="w-4 h-4 text-amber-500 animate-pulse" />
            <span>{tmReceived.toLocaleString()} TM</span>
          </div>
        </div>

        {/* ESTIMATED RETURN 3 COLUMNS */}
        <div className="space-y-2">
          <span className="text-[10px] text-tg-text-muted font-black uppercase tracking-wider block px-0.5">
            Estimated Return ($ USDT)
          </span>

          <div className="grid grid-cols-3 gap-2" id="estimated_return_grid">
            {/* Daily column */}
            <div className="p-3 bg-tg-dark/50 rounded-xl border border-white/5 text-center">
              <span className="text-[9px] text-tg-text-muted block font-bold uppercase tracking-wider">Daily</span>
              <span className="text-xs font-extrabold text-white block mt-1 font-mono text-tg-blue-light">
                ${estimatedDailyRewardUSDT.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
              </span>
            </div>

            {/* 10 Days column */}
            <div className="p-3 bg-tg-dark/50 rounded-xl border border-white/5 text-center">
              <span className="text-[9px] text-tg-text-muted block font-bold uppercase tracking-wider">10 Days</span>
              <span className="text-xs font-extrabold text-white block mt-1 font-mono">
                ${estimated10DaysRewardUSDT.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
              </span>
            </div>

            {/* Profit column */}
            <div className="p-3 bg-tg-dark/50 rounded-xl border border-white/5 text-center bg-emerald-500/5 border-emerald-500/10">
              <span className="text-[9px] text-emerald-400 block font-bold uppercase tracking-wider">Profit</span>
              <span className="text-xs font-extrabold text-emerald-400 block mt-1 font-mono">
                ${estimatedProfitUSDT.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
              </span>
            </div>
          </div>
        </div>

        {/* Large Continue Button */}
        <button
          onClick={handleContinue}
          className="w-full py-4 bg-tg-blue hover:bg-tg-blue-light text-white font-extrabold rounded-2xl text-sm transition-all duration-300 shadow-lg shadow-tg-blue/20 flex items-center justify-center gap-2 cursor-pointer focus:outline-none"
          id="calculator_continue_btn"
        >
          <span>Continue</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* ERROR FEEDBACK FOR CALCULATION */}
      {errorMsg && !showPaymentDetails && (
        <div className="bg-red-950/40 border border-red-500/30 text-red-300 p-3.5 rounded-2xl text-xs font-semibold flex items-start gap-2.5 animate-pulse">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* REVEALED PAYMENT PORTAL (Only shown when amount is valid and user clicked "Continue") */}
      <AnimatePresence>
        {showPaymentDetails && (
          <motion.div
            ref={paymentDetailsRef}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            transition={{ duration: 0.3 }}
            className="space-y-5"
            id="payment_portal_panel"
          >
            {/* Payment Guidelines & Wallet Address */}
            <div className="glass-panel p-5 rounded-3xl border border-white/5 flex flex-col items-center text-center space-y-4 bg-[#0a1128]/40">
              <div className="w-10 h-10 rounded-full bg-tg-blue/10 border border-tg-blue/20 text-tg-blue-light flex items-center justify-center">
                <Wallet className="w-5 h-5 animate-pulse" />
              </div>

              <div>
                <h4 className="font-extrabold text-sm text-white font-display">Transfer Staking Deposit</h4>
                <p className="text-[10px] text-tg-text-muted mt-1 max-w-sm leading-relaxed">
                  Transfer exactly <strong className="text-white">${usdtAmount.toFixed(2)} USDT</strong> to the BEP20 address below. You will receive <strong className="text-amber-400">{tmReceived.toLocaleString()} TM Staking Power</strong> instantly on confirmation.
                </p>
              </div>

              {/* QR Code */}
              <div className="bg-white p-2.5 rounded-2xl border border-white/10 shadow-lg relative group">
                <img 
                  src={db.settings.qrCodeUrl || "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=200"} 
                  alt="USDT BSC Deposit QR" 
                  className="w-36 h-36 object-contain"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center rounded-2xl">
                  <QrCode className="w-8 h-8 text-white" />
                </div>
              </div>

              {/* Wallet address copy widget */}
              <div className="w-full space-y-1.5">
                <span className="text-[9px] text-tg-text-muted font-extrabold uppercase tracking-wider block">Company BEP20 Wallet Address (BSC):</span>
                <div className="flex items-center gap-2 bg-tg-dark/80 border border-white/15 rounded-xl p-3 max-w-md mx-auto">
                  <span className="text-xs font-mono select-all truncate text-tg-blue-light font-black block flex-1">
                    {db.settings.walletAddressUSDT}
                  </span>
                  <button
                    onClick={handleCopyAddress}
                    className={`p-1.5 rounded-lg transition-all duration-200 cursor-pointer ${
                      isCopied 
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                        : 'bg-white/5 hover:bg-white/10 text-tg-text-muted border border-white/5'
                    }`}
                  >
                    {isCopied ? <ClipboardCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                {isCopied && (
                  <span className="text-[10px] text-emerald-400 font-bold block">Copied wallet address!</span>
                )}
              </div>

              {/* Secure guarantee */}
              <div className="flex items-center gap-2 text-[9px] text-emerald-400 font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>Verified Binance Smart Chain Node Protocol</span>
              </div>
            </div>

            {/* Submission Notification Form */}
            <div className="glass-panel p-5 rounded-3xl border border-white/5 space-y-4">
              <div>
                <h4 className="font-bold text-xs text-white uppercase tracking-wider">Confirm Staking Blockchain Hash</h4>
                <p className="text-[10px] text-tg-text-muted mt-0.5 leading-snug">
                  Provide your completed transfer details below so our smart contract auditors can credit your TM balance.
                </p>
              </div>

              <form onSubmit={handleSubmitTXID} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-tg-text-muted uppercase tracking-wider font-bold">Transaction TXID / TxHash</label>
                  <input
                    type="text"
                    placeholder="Enter 64-character blockchain transfer hash"
                    value={txid}
                    onChange={(e) => setTxid(e.target.value)}
                    className="w-full bg-tg-dark/50 border border-white/5 focus:border-tg-blue rounded-xl px-3.5 py-3 text-xs text-white focus:outline-none transition-all font-mono"
                    required
                  />
                </div>

                {errorMsg && (
                  <div className="bg-red-950/40 border border-red-500/30 text-red-300 p-3 rounded-xl text-xs font-semibold flex items-start gap-1.5 animate-pulse">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 p-3 rounded-xl text-xs font-semibold flex items-start gap-1.5">
                    <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{successMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-extrabold text-xs py-3.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 focus:outline-none disabled:bg-white/5 disabled:text-tg-text-muted/40"
                >
                  {loading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Verifying Blockchain Hash...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Verify and Activate TM Staking</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LOCAL DEPOSIT HISTORY LIST */}
      <div className="space-y-2.5">
        <h4 className="text-xs text-tg-text-muted font-bold uppercase tracking-wider px-1 font-display">
          Your Deposit Notifications
        </h4>

        <div className="glass-panel rounded-2xl border border-white/5 divide-y divide-white/5 overflow-hidden">
          {depositHistory.length === 0 ? (
            <div className="p-6 text-center text-xs text-tg-text-muted">
              You haven't submitted any deposit verification receipts yet.
            </div>
          ) : (
            depositHistory.map((d) => (
              <div key={d.id} className="p-3.5 flex items-start justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <span className="font-bold text-white block">Deposited ${d.amountUSDT.toFixed(2)} USDT</span>
                  <span className="text-[10px] text-amber-400 font-bold block">
                    ≈ {(d.amountUSDT * conversionRate).toLocaleString()} TM Power
                  </span>
                  <span className="text-[9px] font-mono text-tg-text-muted block truncate max-w-xs">
                    TXID: {d.txid.substring(0, 12)}...{d.txid.slice(-12)}
                  </span>
                  <span className="text-[9px] text-tg-text-muted block">
                    {new Date(d.createdAt).toLocaleString()}
                  </span>
                </div>

                <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase ${
                  d.status === 'Approved' 
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' 
                    : d.status === 'Rejected' 
                      ? 'bg-red-500/15 text-red-400 border border-red-500/20' 
                      : 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                }`}>
                  {d.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
export default DepositTab;
