export interface UserProfile {
  id: string;
  phone: string;
  username: string;
  role: 'admin' | 'user';
  isVip: boolean;
  vipTier?: string;
  vipExpiresAt?: string | null;
  bio?: string;
  avatarUrl?: string;
  friendIds: string[];
  friendRequestsReceived: string[];
  friendRequestsSent: string[];
  createdAt: string;
  isBanned?: boolean;
}

export interface PredictionItem {
  id: string;
  sport: string;
  competition: string;
  homeTeam: string;
  awayTeam: string;
  matchTime: string;
  category: string;
  confidence: number;
  oddsIndicator: string;
  adminAnalysis: string;
  imageUrl?: string;
  isVipOnly: boolean;
  isPinned: boolean;
  status: 'PENDING' | 'WON' | 'LOST' | 'VOID' | 'REFUND';
  finalScore?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isLocked?: boolean;
}

export interface LiveMatchItem {
  id: string;
  leagueSlug: string;
  competition: string;
  competitionCode: string;
  country: string;
  homeTeam: string;
  homeTeamLogo?: string;
  awayTeam: string;
  awayTeamLogo?: string;
  homeScore: number;
  awayScore: number;
  status: 'LIVE' | 'HT' | 'FT' | 'UPCOMING';
  statusDetail: string;
  minute?: number | string;
  startTime: string;
  venue?: string;
  odds?: {
    provider?: string;
    details?: string;
    overUnder?: number;
    homeMoneyline?: number | string;
    awayMoneyline?: number | string;
    drawOdds?: number | string;
  };
}

export interface MatchPlayer {
  id?: string;
  name: string;
  jersey?: string;
  position?: string;
  starter: boolean;
}

export interface MatchEvent {
  type: 'GOAL' | 'YELLOW_CARD' | 'RED_CARD' | 'SUBSTITUTION' | 'HALFTIME' | 'KICKOFF' | 'VAR' | 'INFO';
  clock: string;
  text: string;
  team?: 'home' | 'away';
}

export interface MatchStats {
  possession: { home: string; away: string };
  totalShots: { home: number; away: number };
  shotsOnTarget: { home: number; away: number };
  wonCorners: { home: number; away: number };
  foulsCommitted: { home: number; away: number };
  yellowCards: { home: number; away: number };
  redCards: { home: number; away: number };
  offsides: { home: number; away: number };
  saves: { home: number; away: number };
  accuratePasses?: { home: number; away: number };
  passAccuracyPct?: { home: string; away: string };
}

export interface RealMatchDetails {
  id: string;
  leagueSlug: string;
  competition: string;
  homeTeam: string;
  homeTeamLogo?: string;
  awayTeam: string;
  awayTeamLogo?: string;
  homeScore: number;
  awayScore: number;
  status: string;
  statusDetail: string;
  clock?: string;
  venue?: string;
  referee?: string;
  attendance?: string;
  stats: MatchStats;
  lineups: {
    home: {
      formation?: string;
      starters: MatchPlayer[];
      substitutes: MatchPlayer[];
    };
    away: {
      formation?: string;
      starters: MatchPlayer[];
      substitutes: MatchPlayer[];
    };
  };
  events: MatchEvent[];
  odds?: {
    provider?: string;
    details?: string;
    overUnder?: number;
    homeMoneyline?: number | string;
    awayMoneyline?: number | string;
    drawOdds?: number | string;
  };
}

export interface RealStandingEntry {
  rank: number;
  team: string;
  teamLogo?: string;
  gamesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export interface PostItem {
  id: string;
  authorId: string;
  authorName: string;
  authorPhoneMasked: string;
  authorIsVip: boolean;
  content: string;
  imageUrl?: string;
  likes: string[];
  likesCount: number;
  hasLiked: boolean;
  commentsCount: number;
  reportsCount: number;
  isPinned?: boolean;
  createdAt: string;
}

export interface CommentItem {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorIsVip: boolean;
  content: string;
  createdAt: string;
}

export interface ChatMessageItem {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  senderIsVip: boolean;
  senderIsAdmin: boolean;
  text: string;
  sharedPredictionId?: string;
  imageUrl?: string;
  reportsCount: number;
  createdAt: string;
}

export interface SubscriptionItem {
  id: string;
  userId: string;
  tier: string;
  amountNgn: number;
  paymentReference: string;
  status: 'active' | 'expired';
  startedAt: string;
  expiresAt: string;
}

export interface AdminStats {
  totalUsers: number;
  activeVipCount: number;
  totalPredictions: number;
  winRatePercent: number;
  totalCommunityPosts: number;
  openReportsCount: number;
  totalSubscriptions: number;
  totalRevenueNgn: number;
}
