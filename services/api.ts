import { API_BASE_URL } from '../constants';
import { 
  MatchDetail, 
  MatchSummary, 
  PlayerProfile, 
  WinLoss, 
  Peer, 
  PlayerHeroStats,
  GlobalHero,
  ProMatch,
  PlayerCounts
} from '../types';

// Queue-based rate limiter to ensure sequential requests
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 250; // OpenDota free tier is ~60/min. 250ms spacing ensures we don't burst too hard.
let requestQueue = Promise.resolve();

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const rateLimitedFetch = (url: string, options?: RequestInit): Promise<Response> => {
  // Wrap the fetch operation in a promise that we can control via the queue
  return new Promise((resolve, reject) => {
    // Chain this request to the end of the global queue
    requestQueue = requestQueue.then(async () => {
      const now = Date.now();
      const timeSinceLast = now - lastRequestTime;
      
      // Enforce the minimum interval
      if (timeSinceLast < MIN_REQUEST_INTERVAL) {
        await wait(MIN_REQUEST_INTERVAL - timeSinceLast);
      }
      
      // Recursive function to handle 429 retries
      const executeFetch = async (): Promise<void> => {
        try {
            const res = await fetch(url, options);
            lastRequestTime = Date.now();
            
            // Handle Rate Limiting (429) by waiting and retrying
            if (res.status === 429) {
                console.warn(`Rate limit 429 hit on ${url}. Backing off 5s...`);
                await wait(5000); 
                return executeFetch();
            }
            
            resolve(res);
        } catch (e) {
            // Network errors (like Failed to fetch) are passed to the caller
            console.error(`Network error requesting ${url}:`, e);
            reject(e);
        }
      };

      await executeFetch();
    }).catch((e) => {
        // This catch handles critical errors in the queue logic itself
        // to ensure the queue chain isn't permanently broken.
        console.error("Queue processing error:", e);
    });
  });
};

export const getPlayerProfile = async (accountId: number): Promise<PlayerProfile | null> => {
  try {
    const res = await rateLimitedFetch(`${API_BASE_URL}/players/${accountId}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.error("Error fetching player:", e);
    return null;
  }
};

export const getPlayerWL = async (accountId: number): Promise<WinLoss | null> => {
  try {
    const res = await rateLimitedFetch(`${API_BASE_URL}/players/${accountId}/wl`);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.error("Error fetching WL:", e);
    return null;
  }
};

export const getRecentMatches = async (accountId: number): Promise<MatchSummary[]> => {
  try {
    const res = await rateLimitedFetch(`${API_BASE_URL}/players/${accountId}/matches?limit=50`);
    if (!res.ok) throw new Error("Failed to fetch matches");
    return await res.json();
  } catch (e) {
    console.error("Error fetching matches:", e);
    return [];
  }
};

export const getMatchDetails = async (matchId: number): Promise<MatchDetail | null> => {
  try {
    const res = await rateLimitedFetch(`${API_BASE_URL}/matches/${matchId}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.error(`Error fetching match ${matchId}:`, e);
    return null;
  }
};

export const getPlayerPeers = async (accountId: number): Promise<Peer[]> => {
  try {
    const res = await rateLimitedFetch(`${API_BASE_URL}/players/${accountId}/peers`);
    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    console.error("Error fetching peers:", e);
    return [];
  }
};

export const getPlayerHeroes = async (accountId: number): Promise<PlayerHeroStats[]> => {
  try {
    const res = await rateLimitedFetch(`${API_BASE_URL}/players/${accountId}/heroes`);
    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    console.error("Error fetching player heroes:", e);
    return [];
  }
};

export const getGlobalHeroes = async (): Promise<GlobalHero[]> => {
  try {
    const res = await rateLimitedFetch(`${API_BASE_URL}/heroStats`);
    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    console.error("Error fetching global heroes:", e);
    return [];
  }
};

export const getProMatches = async (): Promise<ProMatch[]> => {
  try {
    const res = await rateLimitedFetch(`${API_BASE_URL}/proMatches`);
    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    console.error("Error fetching pro matches:", e);
    return [];
  }
};

export const getPlayerCounts = async (accountId: number): Promise<PlayerCounts | null> => {
  try {
    const res = await rateLimitedFetch(`${API_BASE_URL}/players/${accountId}/counts`);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.error("Error fetching counts:", e);
    return null;
  }
};

export const requestMatchParse = async (matchId: number): Promise<void> => {
  try {
    await rateLimitedFetch(`${API_BASE_URL}/request/${matchId}`, { method: 'POST' });
  } catch (e) {
    console.error("Error requesting parse:", e);
  }
}