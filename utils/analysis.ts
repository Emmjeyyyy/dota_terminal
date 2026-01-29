import { ExtendedMatch, MatchDetail, MatchSummary, PartyGroup, Teammate } from '../types';
import { getHeroName } from '../services/heroService';

// Identify which team the user was on (Radiant < 128, Dire >= 128)
// and extract teammates who have account IDs.
export const analyzeMatch = (
  userId: number,
  summary: MatchSummary,
  details: MatchDetail
): ExtendedMatch | null => {
  // Find user in details
  const userPlayer = details.players.find(p => p.account_id === userId);
  if (!userPlayer) return null; // Should not happen if API is consistent

  const isRadiant = userPlayer.player_slot < 128;
  const didWin = (isRadiant && details.radiant_win) || (!isRadiant && !details.radiant_win);

  // Find known teammates (exclude user, exclude anonymous)
  const teammates: Teammate[] = details.players
    .filter(p => {
      const pIsRadiant = p.player_slot < 128;
      return (
        pIsRadiant === isRadiant && 
        p.account_id !== userId && 
        p.account_id !== null
      );
    })
    .map(p => ({
      account_id: p.account_id!,
      personaname: p.personaname || `Unknown (${p.account_id})`,
      hero_id: p.hero_id
    }));

  return {
    ...summary,
    teammates,
    result: didWin ? 'Won' : 'Lost',
    playedHeroName: getHeroName(summary.hero_id)
  };
};

export const groupMatchesByParty = (matches: ExtendedMatch[]): PartyGroup[] => {
  // Intermediate structure to aggregate data
  const groups: Record<string, {
    id: string;
    playerIds: number[];
    wins: number;
    losses: number;
    matches: ExtendedMatch[];
    heroCounts: Record<number, Record<number, number>>; // accountId -> heroId -> count
    names: Record<number, string>; // accountId -> latestName
  }> = {};

  matches.forEach(match => {
    // Sort teammates to create a consistent key
    const sortedIds = match.teammates.map(t => t.account_id).sort((a, b) => a - b);
    
    // Key is comma-separated IDs. If empty, it's Solo.
    const key = sortedIds.length > 0 ? sortedIds.join(',') : 'SOLO';

    if (!groups[key]) {
      groups[key] = {
        id: key,
        playerIds: sortedIds,
        wins: 0,
        losses: 0,
        matches: [],
        heroCounts: {},
        names: {}
      };
    }

    // Update stats
    if (match.result === 'Won') {
      groups[key].wins += 1;
    } else {
      groups[key].losses += 1;
    }
    groups[key].matches.push(match);

    // Track stats for teammates in this party context
    match.teammates.forEach(t => {
       // Update name (most recent entry will prevail naturally)
       groups[key].names[t.account_id] = t.personaname;

       // Count hero usage
       if (!groups[key].heroCounts[t.account_id]) {
         groups[key].heroCounts[t.account_id] = {};
       }
       const counts = groups[key].heroCounts[t.account_id];
       counts[t.hero_id] = (counts[t.hero_id] || 0) + 1;
    });
  });

  // Convert to array and calculate summaries
  return Object.values(groups).map(g => {
    const teammates = g.playerIds.map(pid => {
        const counts = g.heroCounts[pid] || {};
        let bestHero = 0;
        let maxCount = -1;

        // Find most played hero for this teammate in this group
        for (const [hidStr, count] of Object.entries(counts)) {
            if (count > maxCount) {
                maxCount = count;
                bestHero = parseInt(hidStr, 10);
            }
        }

        return {
            account_id: pid,
            personaname: g.names[pid] || 'Unknown',
            mostPlayedHeroId: bestHero
        };
    });

    return {
        id: g.id,
        playerIds: g.playerIds,
        teammates: teammates,
        wins: g.wins,
        losses: g.losses,
        matches: g.matches
    };
  }).sort((a, b) => b.matches.length - a.matches.length);
};
