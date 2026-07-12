import React, { useState, useMemo } from 'react';
import { UserProfile, AppDatabase } from '../types';
import { Trophy, Medal, Award, Sparkles, TrendingUp, HelpCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface LeaderboardTabProps {
  user: UserProfile;
  db: AppDatabase;
  onUpdateState?: (user: UserProfile, db: AppDatabase) => void;
  showToast?: (message: string, type: 'success' | 'error' | 'info' | 'pending') => void;
}

interface BalanceRankEntry {
  rank: number;
  id: string;
  firstName: string;
  lastName?: string;
  photoUrl?: string;
  balanceTM: number;
  isCurrentUser: boolean;
}

// Custom avatar component to handle missing or broken Telegram profile pictures elegantly
const LeaderboardAvatar: React.FC<{ photoUrl?: string; firstName: string }> = ({ photoUrl, firstName }) => {
  const [error, setError] = useState(false);
  const initials = firstName ? firstName[0].toUpperCase() : '?';

  if (!photoUrl || error) {
    return (
      <div className="w-8 h-8 rounded-full bg-tg-blue/20 text-tg-blue-light border border-white/5 flex items-center justify-center font-bold text-xs shrink-0 font-sans">
        {initials}
      </div>
    );
  }

  return (
    <img
      src={photoUrl}
      alt={firstName}
      className="w-8 h-8 rounded-full border border-white/5 object-cover shrink-0"
      referrerPolicy="no-referrer"
      onError={() => setError(true)}
    />
  );
};

export const LeaderboardTab: React.FC<LeaderboardTabProps> = ({ user, db }) => {
  // Sort and rank all non-banned users by balanceTM
  const sortedUsers = useMemo(() => {
    const activeUsers = db.users.filter(u => !u.isBanned);
    
    // Sort by balance desc, break ties with ID
    const sorted = [...activeUsers].sort((a, b) => {
      if (b.balanceTM !== a.balanceTM) {
        return b.balanceTM - a.balanceTM;
      }
      return a.id.localeCompare(b.id);
    });

    return sorted.map((u, index) => ({
      rank: index + 1,
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      photoUrl: u.photoUrl,
      balanceTM: u.balanceTM,
      isCurrentUser: u.id === user.id
    }));
  }, [db.users, user.id]);

  // Top 10 entries for display
  const top10Entries = useMemo(() => {
    return sortedUsers.slice(0, 10);
  }, [sortedUsers]);

  // Find current user's ranking
  const currentUserRankInfo = useMemo(() => {
    const index = sortedUsers.findIndex(u => u.isCurrentUser);
    if (index !== -1) {
      return sortedUsers[index];
    }
    return { rank: sortedUsers.length + 1, balanceTM: user.balanceTM };
  }, [sortedUsers, user.balanceTM]);

  return (
    <div className="space-y-4 animate-fade-in pb-10 select-none">
      
      {/* Dynamic Rank Header Stats Panel */}
      <div className="glass-panel p-4 rounded-2xl relative overflow-hidden shadow-lg border border-white/5 bg-gradient-to-br from-tg-surface via-tg-surface-light/40 to-tg-surface">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-tg-text-muted flex items-center gap-1.5">
              <Trophy className="w-3 h-3 text-amber-400" />
              TM Wealth Ranking
            </span>
            <h2 className="text-lg font-black font-display text-white tracking-tight">
              Global Leaderboard
            </h2>
            <p className="text-[10px] text-tg-text-muted max-w-[210px] sm:max-w-xs leading-relaxed">
              Top 10 holders ranked by their total TM balance. Earn rewards to climb the list!
            </p>
          </div>

          {/* Current user's rank status badge */}
          <div className="text-center bg-tg-dark/50 px-3.5 py-3 rounded-xl border border-white/5 shrink-0 flex flex-col items-center justify-center min-w-[90px]">
            <span className="text-[9px] text-tg-text-muted font-bold uppercase tracking-wider block">Your Rank</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-black font-display text-amber-400 font-mono">
                #{currentUserRankInfo.rank}
              </span>
            </div>
            <span className="text-[9px] font-mono text-tg-blue-light font-bold mt-0.5 block">
              {currentUserRankInfo.balanceTM.toLocaleString()} TM
            </span>
          </div>
        </div>
      </div>

      {/* Leaderboard entries container card */}
      <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
        <div className="px-4 py-3 bg-white/[0.02] border-b border-white/5 flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold tracking-wider text-tg-text-muted">
            Ranked Users (Top 10)
          </span>
          <span className="text-[10px] uppercase font-bold tracking-wider text-tg-text-muted">
            Balance
          </span>
        </div>

        <div className="divide-y divide-white/5">
          {top10Entries.map((entry) => {
            const isTop3 = entry.rank <= 3;
            return (
              <div
                key={entry.id}
                className={`px-4 py-3 flex items-center justify-between transition-all duration-150 ${
                  entry.isCurrentUser 
                    ? 'bg-tg-blue/10 border-l-2 border-tg-blue' 
                    : 'hover:bg-white/[0.01]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Rank Badge */}
                  <div className="w-6 shrink-0 flex justify-center text-xs font-black font-mono">
                    {entry.rank === 1 ? (
                      <Trophy className="w-4 h-4 text-amber-400" />
                    ) : entry.rank === 2 ? (
                      <Medal className="w-4 h-4 text-slate-300" />
                    ) : entry.rank === 3 ? (
                      <Medal className="w-4 h-4 text-amber-600" />
                    ) : (
                      <span className="text-tg-text-muted">#{entry.rank}</span>
                    )}
                  </div>

                  {/* Profile Avatar */}
                  <LeaderboardAvatar photoUrl={entry.photoUrl} firstName={entry.firstName} />

                  {/* Name (No Username/ID) */}
                  <div className="flex items-center overflow-hidden">
                    <span className="font-semibold text-xs text-white truncate max-w-[150px] sm:max-w-[200px]">
                      {entry.firstName} {entry.lastName || ''}
                      {entry.isCurrentUser && (
                        <span className="ml-1.5 px-1.5 py-0.2 text-[8px] bg-tg-blue text-white rounded-full uppercase font-extrabold font-sans">
                          You
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                {/* TM Balance display */}
                <div className="text-right shrink-0">
                  <span className="font-mono font-extrabold text-xs text-amber-400">
                    {entry.balanceTM.toLocaleString()}
                  </span>
                  <span className="text-[9px] text-tg-text-muted/80 ml-0.5 uppercase font-bold font-sans">
                    TM
                  </span>
                </div>
              </div>
            );
          })}

          {top10Entries.length === 0 && (
            <div className="text-center py-10 text-tg-text-muted text-xs">
              No ranked wealth holders found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaderboardTab;
