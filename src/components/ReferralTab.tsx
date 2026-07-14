import React, { useState } from 'react';
import { UserProfile, AppDatabase } from '../types';
import { Copy, Check, Share2, Award, ShieldQuestion, HelpCircle, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface ReferralTabProps {
  user: UserProfile;
  db: AppDatabase;
  onUpdateState: (user: UserProfile, db: AppDatabase) => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'info' | 'pending') => void;
}

export const ReferralTab: React.FC<ReferralTabProps> = ({
  user,
  db,
  showToast
}) => {
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Generate Referral link using the user's permanent UID
  const referralLink = `https://t.me/TM_DigitalBot/app?startapp=ref_${user.uid}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    if (showToast) {
      showToast("📋 Referral link copied successfully!", "success");
    }
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleShareTelegram = () => {
    const text = `💰 Join TM Digital and start earning today! Sign up using my referral link to unlock rewards:`;
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(text)}`;
    window.open(shareUrl, '_blank');
  };

  return (
    <div className="space-y-6 pb-24" id="referral_tab_container">
      
      {/* Top Card */}
      <div className="glass-panel rounded-3xl p-6 relative overflow-hidden border border-white/10 text-center" id="referral_top_card">
        {/* Decorative background glow */}
        <div className="absolute top-[-50px] left-1/2 -translate-x-1/2 w-40 h-40 bg-tg-blue/15 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-2">
          <div className="w-12 h-12 bg-tg-blue/10 rounded-2xl flex items-center justify-center text-tg-blue mx-auto mb-3 shadow-inner">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Invite & Earn</h2>
          <p className="text-sm text-tg-text-muted max-w-xs mx-auto">
            Get <strong className="text-emerald-400 font-extrabold">$0.02 USDT</strong> instantly when they join! Plus up to <strong className="text-emerald-400 font-extrabold">$28.00</strong> in tiered deposit commissions.
          </p>
        </div>
      </div>

      {/* Reward Tiers Card */}
      <div className="glass-panel rounded-3xl p-5 border border-white/10 space-y-4" id="reward_tiers_card">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Tiered Deposit Rewards</h3>
            <p className="text-[10px] text-tg-text-muted">Earn cash rewards as your friends deposit</p>
          </div>
        </div>

        <div className="space-y-2.5 pt-1" id="tiers_list">
          {[
            { tier: "Tier 1", deposit: "$10+", reward: "$3.00", color: "from-blue-500/10 to-transparent", border: "border-blue-500/20" },
            { tier: "Tier 2", deposit: "$50+", reward: "$10.00", color: "from-amber-500/10 to-transparent", border: "border-amber-500/20" },
            { tier: "Tier 3", deposit: "$100+", reward: "$15.00", color: "from-emerald-500/10 to-transparent", border: "border-emerald-500/20" }
          ].map((item, index) => (
            <div key={index} className={`flex items-center justify-between p-3.5 bg-gradient-to-r ${item.color} rounded-2xl border ${item.border}`}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold text-white">
                  {index + 1}
                </div>
                <div>
                  <span className="text-xs text-white font-extrabold block">{item.tier} Reward</span>
                  <span className="text-[10px] text-tg-text-muted block">Friend's Deposit: <strong className="text-white font-bold">{item.deposit}</strong></span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-lg font-black text-emerald-400 font-mono">{item.reward}</span>
                <span className="text-[8px] uppercase tracking-wider text-tg-text-muted block font-extrabold">Instant USDT</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How It Works Card */}
      <div className="glass-panel rounded-3xl p-5 border border-white/10 space-y-4" id="how_it_works_card">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/5 rounded-xl text-tg-text-muted">
            <HelpCircle className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white tracking-tight">How It Works</h3>
        </div>

        {/* Steps */}
        <div className="space-y-3 pt-1" id="how_it_works_steps">
          {[
            { step: 1, text: "Share your referral link." },
            { step: 2, text: "Friend registers using your referral link." },
            { step: 3, text: "Friend completes an approved deposit of $10, $50, or $100." },
            { step: 4, text: "You instantly receive the corresponding tiered commission." }
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-4 p-3 bg-white/5 rounded-2xl border border-white/5">
              <div className="w-6 h-6 bg-tg-blue text-white rounded-full flex items-center justify-center text-xs font-black shrink-0 mt-0.5 shadow-md">
                {item.step}
              </div>
              <p className="text-xs text-tg-text-muted font-medium pt-0.5">{item.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Section: Referral Link & Copy */}
      <div className="glass-panel rounded-3xl p-5 border border-white/10 space-y-3" id="referral_link_section">
        <label className="text-xs text-tg-text-muted font-semibold block px-1">Your Referral Link</label>
        
        <div className="flex gap-2">
          <input 
            type="text" 
            readOnly 
            value={referralLink} 
            className="flex-1 bg-tg-dark/50 border border-white/10 rounded-2xl py-3 px-4 text-xs text-white font-mono focus:outline-none"
            id="referral_link_field"
          />
          <button 
            onClick={handleCopyLink}
            className="px-4 bg-tg-blue hover:bg-tg-blue/90 text-white rounded-2xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 focus:outline-none"
            id="copy_referral_btn"
          >
            {copiedLink ? <Check className="w-4 h-4 text-green-300" /> : <Copy className="w-4 h-4" />}
            <span>{copiedLink ? "Copied" : "Copy"}</span>
          </button>
        </div>

        <button
          onClick={handleShareTelegram}
          className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-2xl text-xs transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer focus:outline-none"
          id="share_telegram_btn"
        >
          <Share2 className="w-4 h-4 text-tg-blue" />
          <span>Share in Telegram</span>
        </button>
      </div>

    </div>
  );
};
