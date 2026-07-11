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
  photoUrl: string;
  referralCount: number;
  isCurrentUser: boolean;
}

const AVATAR_POOL = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=80&h=80&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1554151228-14d9def656e4?w=80&h=80&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=80&h=80&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=faces"
];

const FIRST_NAMES = [
  "Alex", "Sophia", "Dmitry", "Fatima", "Carlos", "Yuki", "Chloe", "Arjun", "Amara", "Sergei",
  "Maxim", "Elena", "Lucas", "Olivia", "Ethan", "Zoe", "Leo", "Mia", "Noah", "Emma",
  "Viktor", "Svetlana", "Ivan", "Anna", "Pavel", "Maria", "Igor", "Olga", "Andrey", "Tatiana",
  "Liam", "Ava", "Oliver", "Isabella", "James", "Sophia", "Benjamin", "Charlotte", "Mason", "Amelia"
];

const LAST_NAMES = [
  "Petrov", "Sokolov", "Ivanov", "Smirnov", "Kuznetsov", "Popov", "Vasiliev", "Morozov", "Novikov", "Fedorov",
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez"
];

export const TopReferrers: React.FC<TopReferrersProps> = ({ currentUser, db }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAll, setShowAll] = useState(false);

  // Generate 95 deterministic mock referrers and merge them with active DB users
  const leaderboard: LeaderboardEntry[] = useMemo(() => {
    const list: LeaderboardEntry[] = [];

    // 1. Add real users from DB
    db.users.forEach((u) => {
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
    });

    // 2. Generate 95 high-fidelity mock users to form a rich leaderboard up to 100+ entries
    for (let i = 1; i <= 95; i++) {
      const mockId = `mock_${i}`;
      // Skip if somehow ID clashes with real user
      if (db.users.some((u) => u.id === mockId)) continue;

      // Seed-like deterministic generation based on index i
      const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
      const lastName = LAST_NAMES[(i * 3) % LAST_NAMES.length];
      const username = `${firstName.toLowerCase()}_${i * 7}`;
      const photoUrl = AVATAR_POOL[(i * 2) % AVATAR_POOL.length];

      // Smooth decay referral count curve: starts around 78, drops down to 1
      const baseReferralCount = Math.max(1, Math.floor(78 - Math.pow(i, 0.72) * 2.1));
      const referralCount = baseReferralCount + (i % 3); // Add tiny stable variance

      list.push({
        id: mockId,
        firstName,
        lastName,
        username,
        photoUrl,
        referralCount,
        isCurrentUser: false,
        rank: 0,
      });
    }

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
                    <img
                      src={entry.photoUrl}
                      alt={entry.firstName}
                      className="w-8 h-8 rounded-full border border-white/5 object-cover shrink-0"
                      referrerPolicy="no-referrer"
                    />

                    {/* Name / Username */}
                    <div className="text-left overflow-hidden max-w-[150px] sm:max-w-[200px]">
                      <span className="font-semibold text-xs text-white block truncate">
                        {entry.firstName} {entry.lastName || ''}
                        {entry.isCurrentUser && (
                          <span className="ml-1 px-1.5 py-0.2 text-[8px] bg-tg-blue text-white rounded-full uppercase font-extrabold font-sans">
                            You
                          </span>
                        )}
                      </span>
                      <span className="text-[10px] text-tg-text-muted block truncate">
                        @{entry.username}
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
            <div className="text-center py-6 text-xs text-tg-text-muted">
              No matching ranked referrers found.
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
