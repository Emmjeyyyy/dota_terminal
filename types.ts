export interface PlayerProfile {
  profile: {
    account_id: number;
    personaname: string;
    avatarfull: string;
    profileurl: string;
    loccountrycode?: string;
    plus?: boolean;
  };
  rank_tier?: number;
  leaderboard_rank?: number;
}

export interface WinLoss {
  win: number;
  lose: number;
}

export interface MatchSummary {
  match_id: number;
  player_slot: number;
  radiant_win: boolean;
  duration: number;
  start_time: number;
  hero_id: number;
  kills: number;
  deaths: number;
  assists: number;
  party_size?: number;
  lobby_type?: number;
  skill?: number;
}

export interface MatchPlayerDetail {
  account_id: number | null;
  player_slot: number;
  hero_id: number;
  personaname?: string;
  kills: number;
  deaths: number;
  assists: number;
  win: number;
  gold_per_min: number;
  xp_per_min: number;
  hero_damage: number;
  tower_damage: number;
  item_0: number;
  item_1: number;
  item_2: number;
  item_3: number;
  item_4: number;
  item_5: number;
  backpack_0: number;
  backpack_1: number;
  backpack_2: number;
  neutral_item: number;
}

export interface MatchDetail {
  match_id: number;
  radiant_win: boolean;
  duration: number;
  start_time: number;
  radiant_score: number;
  dire_score: number;
  players: MatchPlayerDetail[];
}

export interface Peer {
  account_id: number;
  last_played: number;
  win: number;
  games: number;
  with_win: number;
  with_games: number;
  against_win: number;
  against_games: number;
  personaname: string;
  avatar: string;
}

export interface PlayerHeroStats {
  hero_id: number;
  last_played: number;
  games: number;
  win: number;
  with_games: number;
  with_win: number;
  against_games: number;
  against_win: number;
}

export interface Hero {
  id: number;
  name: string;
  localized_name: string;
  primary_attr: string;
  attack_type: string;
  roles: string[];
}

export interface GlobalHero {
  id: number;
  name: string;
  localized_name: string;
  primary_attr: string;
  attack_type: string;
  roles: string[];
  img: string;
  icon: string;
}

export interface ProMatch {
  match_id: number;
  duration: number;
  start_time: number;
  radiant_team_id: number;
  radiant_name: string;
  dire_team_id: number;
  dire_name: string;
  leagueid: number;
  league_name: string;
  series_id: number;
  series_type: number;
  radiant_score: number;
  dire_score: number;
  radiant_win: boolean;
}

export enum FetchStatus {
  IDLE,
  LOADING,
  COMPLETE,
  ERROR,
}

export interface Teammate {
  account_id: number;
  personaname: string;
  hero_id: number;
}

export interface PartyTeammate {
  account_id: number;
  personaname: string;
  mostPlayedHeroId: number;
}

export interface ExtendedMatch extends MatchSummary {
  teammates: Teammate[];
  result: 'Won' | 'Lost';
  playedHeroName: string;
}

export interface PartyGroup {
  id: string;
  playerIds: number[];
  teammates: PartyTeammate[];
  wins: number;
  losses: number;
  matches: ExtendedMatch[];
}