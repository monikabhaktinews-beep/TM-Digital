import React, { useState, useMemo } from 'react';
import { UserProfile, AppDatabase } from '../types';
import { Trophy, Medal, Search, Sparkles, User, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TopReferrersProps {
  currentUser: UserProfile;
  db: AppDatabase;
}

interface LeaderboardEntry {
  rank: number;
  id: string;
  firstName: string;
  lastName?: string;
  username: string;
  photoUrl?: string;
  referralCount: number;
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

export const TopReferrers: React.FC<TopReferrersProps> = ({ currentUser, db }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAll, setShowAll] = useState(false);

  // Filter real users from DB who have referrals
  const leaderboard: LeaderboardEntry[] = useMemo(() => {
    const list: LeaderboardEntry[] = [];

    // Add real users from DB who have active referrals
    db.users.forEach((u) => {
      if (u.referralCount > 0) {
        list.push({
          id: u.id,
          firstName: u.firstName,
          lastName: u.lastName,
          username: u.username || 'NoUsername',
          photoUrl: u.photoUrl,
          referralCount: u.referralCount,
          isCurrentUser: u.id === currentUser.id,
          rank: 0, // Assigned later
        });
      }
    });

    // Sort by referralCount DESC, break ties with username
    list.sort((a, b) => {
      if (b.referralCount !== a.referralCount) {
        return b.referralCount - a.referralCount;
      }
      return a.username.localeCompare(b.username);
    });

    // Assign rank values
    list.forEach((entry, idx) => {
      entry.rank = idx + 1;
    });

    return list;
  }, [db.users, currentUser.id]);

  // Find current user's entry
  const currentUserEntry = useMemo(() => {
    return leaderboard.find((e) => e.isCurrentUser);
  }, [leaderboard]);

  // Filter based on search query
  const filteredLeaderboard = useMemo(() => {
    if (!searchQuery.trim()) return leaderboard;
    const q = searchQuery.toLowerCase();
    return leaderboard.filter(
      (e) =>
        e.firstName.toLowerCase().includes(q) ||
        (e.lastName && e.lastName.toLowerCase().includes(q)) ||
        e.username.toLowerCase().includes(q) ||
        e.rank.toString() === q
    );
  }, [leaderboard, searchQuery]);

  // Slice based on whether "Show All" (Top 100) is expanded
  const displayedEntries = useMemo(() => {
    if (searchQuery.trim()) {
      return filteredLeaderboard.slice(0, 100);
    }
    return showAll ? filteredLeaderboard.slice(0, 100) : filteredLeaderboard.slice(0, 10);
  }, [filteredLeaderboard, showAll, searchQuery]);

  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs text-tg-text-muted font-bold uppercase tracking-wider font-display flex items-center gap-1.5">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>Top Invite Leaderboard</span>
        </h3>
        <span className="text-[10px] font-bold font-mono text-tg-blue-light bg-tg-blue/10 px-2 py-0.5 rounded-full border border-tg-blue/20">
          Rank List
        </span>
      </div>

      <div className="glass-panel p-4 rounded-2xl border border-white/5 space-y-4">
        {/* Intro banner */}
        <div className="flex items-center gap-3 bg-tg-blue/10 border border-tg-blue/20 p-3 rounded-xl">
          <div className="w-8 h-8 rounded-lg bg-tg-blue/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-tg-blue-light animate-pulse" />
          </div>
          <div className="text-left">
            <span className="text-xs font-bold text-white block">Refer & Rise Up!</span>
            <span className="text-[10px] text-tg-text-muted block leading-tight">
              Grow your team to claim premium badges and dominate the network rankings.
            </span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-2 bg-tg-dark/50 border border-white/5 rounded-xl px-3 py-2">
          <Search className="w-4 h-4 text-tg-text-muted" />
          <input
            type="text"
            placeholder="Search by name, username or rank..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-xs text-white focus:outline-none w-full"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-[10px] text-tg-text-muted hover:text-white transition"
            >
              Clear
            </button>
          )}
        </div>

        {/* Leaderboard Table */}
        <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
          <AnimatePresence initial={false}>
            {displayedEntries.map((entry) => {
              const isTop3 = entry.rank <= 3;
              const rankColor =
                entry.rank === 1
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                  : entry.rank === 2
                  ? 'bg-slate-300/20 text-slate-200 border-slate-300/30'
                  : entry.rank === 3
                  ? 'bg-amber-700/20 text-amber-600 border-amber-700/30'
                  : 'bg-tg-surface-light border-white/5 text-tg-text-muted';

              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition ${
                    entry.isCurrentUser
                      ? 'bg-tg-blue/20 border-tg-blue shadow-[0_0_10px_rgba(36,129,204,0.15)]'
                      : 'bg-tg-dark/30 border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {/* Rank Badge */}
                    <div
                      className={`w-6 h-6 rounded-lg border flex items-center justify-center font-bold text-xs font-mono shrink-0 ${rankColor}`}
                    >
                      {entry.rank === 1 ? (
                        <Trophy className="w-3.5 h-3.5 text-amber-400" />
                      ) : entry.rank === 2 ? (
                        <Medal className="w-3.5 h-3.5 text-slate-300" />
                      ) : entry.rank === 3 ? (
                        <Medal className="w-3.5 h-3.5 text-amber-600" />
                      ) : (
                        entry.rank
                      )}
                    </div>

                    {/* Profile image */}
                    <LeaderboardAvatar photoUrl={entry.photoUrl} firstName={entry.firstName} />

                    {/* Name */}
                    <div className="text-left overflow-hidden max-w-[150px] sm:max-w-[200px] flex items-center">
                      <span className="font-semibold text-xs text-white truncate">
                        {entry.firstName} {entry.lastName || ''}
                        {entry.isCurrentUser && (
                          <span className="ml-1.5 px-1.5 py-0.2 text-[8px] bg-tg-blue text-white rounded-full uppercase font-extrabold font-sans">
                            You
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Referral Count */}
                  <div className="text-right shrink-0">
                    <span className="font-mono font-bold text-xs text-emerald-400">
                      {entry.referralCount}
                    </span>
                    <span className="text-[9px] text-tg-text-muted block font-medium">Invites</span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {displayedEntries.length === 0 && (
            <div className="text-center py-10 px-4 space-y-3">
              <div className="p-4 bg-white/5 rounded-full border border-dashed border-white/5 text-tg-text-muted w-14 h-14 flex items-center justify-center mx-auto">
                <Users className="w-6 h-6 opacity-30" />
              </div>
              <p className="text-xs text-tg-text-muted max-w-xs mx-auto leading-relaxed">
                {searchQuery.trim() 
                  ? "No matching ranked referrers found." 
                  : "No referral rankings available yet. Invite friends to become the first on the leaderboard."}
              </p>
            </div>
          )}
        </div>

        {/* Toggle Expand Button */}
        {!searchQuery.trim() && filteredLeaderboard.length > 10 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full py-2 border border-white/5 hover:border-tg-blue/20 bg-tg-surface-light hover:bg-tg-blue/5 text-tg-blue-light hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
          >
            <span>{showAll ? 'Show Top 10 Only' : 'Expand to Top 100'}</span>
            {showAll ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Floating Sticky User Rank Summary Box if they are outside the Top 10 */}
      {!searchQuery.trim() && !showAll && currentUserEntry && currentUserEntry.rank > 10 && (
        <div className="glass-panel p-3 rounded-2xl border border-tg-blue/40 bg-tg-blue/10 flex items-center justify-between shadow-[0_-4px_20px_rgba(0,0,0,0.4)] animate-slideUp">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-tg-blue/30 text-white font-mono font-bold text-xs flex items-center justify-center border border-tg-blue/40">
              #{currentUserEntry.rank}
            </div>
            <div className="text-left">
              <span className="text-xs font-bold text-white block">Your Leaderboard Standing</span>
              <span className="text-[10px] text-tg-text-muted block">Keep inviting to unlock premium staking levels!</span>
            </div>
          </div>
          <div className="text-right font-mono">
            <span className="text-xs font-bold text-emerald-400 block">{currentUserEntry.referralCount} Invites</span>
            <span className="text-[9px] text-tg-text-muted block">Level Rank</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TopReferrers;
