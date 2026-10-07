export interface RealMatchItem {
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

// ---------------------------------------------
// CACHING STATE (30s TTL for real-time live speed)
// ---------------------------------------------
const SCOREBOARD_CACHE_TTL_MS = 25 * 1000;
let scoreboardsCache: { timestamp: number; matches: RealMatchItem[] } | null = null;

const MATCH_DETAIL_CACHE_TTL_MS = 15 * 1000;
const matchDetailCache = new Map<string, { timestamp: number; data: RealMatchDetails }>();

const STANDINGS_CACHE_TTL_MS = 120 * 1000;
const standingsCache = new Map<string, { timestamp: number; data: RealStandingEntry[] }>();

// League configurations
export const SUPPORTED_LEAGUES = [
  { slug: 'eng.1', name: 'English Premier League', code: 'EPL', country: 'England' },
  { slug: 'uefa.champions', name: 'UEFA Champions League', code: 'UCL', country: 'Europe' },
  { slug: 'esp.1', name: 'Spanish La Liga', code: 'ESP', country: 'Spain' },
  { slug: 'ita.1', name: 'Italian Serie A', code: 'ITA', country: 'Italy' },
  { slug: 'ger.1', name: 'German Bundesliga', code: 'GER', country: 'Germany' },
  { slug: 'fra.1', name: 'French Ligue 1', code: 'FRA', country: 'France' },
  { slug: 'uefa.europa', name: 'UEFA Europa League', code: 'UEL', country: 'Europe' },
  { slug: 'uefa.nations', name: 'UEFA Nations League', code: 'UNL', country: 'Europe' },
  { slug: 'fifa.friendly', name: 'International Friendlies', code: 'INT', country: 'World' },
  { slug: 'eng.fa', name: 'English FA Cup', code: 'FAC', country: 'England' },
  { slug: 'usa.1', name: 'Major League Soccer', code: 'MLS', country: 'USA' },
];

// Helper to fetch JSON with timeout
async function fetchWithTimeout(url: string, timeoutMs = 4000): Promise<any> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

// ---------------------------------------------
// 1. FETCH LIVE SCORES & FIXTURES
// ---------------------------------------------
export async function fetchLiveScores(filterLeague?: string): Promise<{
  matches: RealMatchItem[];
  cachedAt: string;
  totalLeagues: number;
}> {
  const now = Date.now();

  // Return cached if fresh
  if (scoreboardsCache && now - scoreboardsCache.timestamp < SCOREBOARD_CACHE_TTL_MS) {
    let result = scoreboardsCache.matches;
    if (filterLeague && filterLeague !== 'ALL') {
      result = result.filter((m) => m.leagueSlug === filterLeague);
    }
    return {
      matches: result,
      cachedAt: new Date(scoreboardsCache.timestamp).toISOString(),
      totalLeagues: SUPPORTED_LEAGUES.length,
    };
  }

  const allMatches: RealMatchItem[] = [];

  // Concurrently fetch scoreboards across leagues
  const promises = SUPPORTED_LEAGUES.map(async (league) => {
    try {
      const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${league.slug}/scoreboard`;
      const data = await fetchWithTimeout(url, 3500);

      if (data.events && Array.isArray(data.events)) {
        for (const ev of data.events) {
          const comp = ev.competitions?.[0];
          if (!comp) continue;

          const homeComp = comp.competitors?.find((c: any) => c.homeAway === 'home');
          const awayComp = comp.competitors?.find((c: any) => c.homeAway === 'away');
          if (!homeComp || !awayComp) continue;

          const statusType = comp.status?.type?.name || 'STATUS_SCHEDULED';
          let status: RealMatchItem['status'] = 'UPCOMING';
          if (statusType.includes('IN_PROGRESS')) status = 'LIVE';
          else if (statusType.includes('HALFTIME')) status = 'HT';
          else if (statusType.includes('FINAL') || statusType.includes('FULL_TIME')) status = 'FT';

          // Extract odds if provided in feed
          let odds: RealMatchItem['odds'] = undefined;
          if (comp.odds && comp.odds.length > 0) {
            const o = comp.odds[0];
            odds = {
              provider: o.provider?.name || 'Sportsbook',
              details: o.details,
              overUnder: o.overUnder,
              drawOdds: o.drawOdds?.moneyLine,
              homeMoneyline: o.homeTeamOdds?.moneyLine || o.moneyline?.home?.moneyLine,
              awayMoneyline: o.awayTeamOdds?.moneyLine || o.moneyline?.away?.moneyLine,
            };
          }

          allMatches.push({
            id: ev.id,
            leagueSlug: league.slug,
            competition: data.leagues?.[0]?.name || league.name,
            competitionCode: league.code,
            country: league.country,
            homeTeam: homeComp.team?.displayName || 'Home Team',
            homeTeamLogo: homeComp.team?.logo,
            awayTeam: awayComp.team?.displayName || 'Away Team',
            awayTeamLogo: awayComp.team?.logo,
            homeScore: parseInt(homeComp.score || '0', 10),
            awayScore: parseInt(awayComp.score || '0', 10),
            status,
            statusDetail: comp.status?.type?.detail || comp.status?.type?.shortDetail || 'Scheduled',
            minute: comp.status?.displayClock,
            startTime: ev.date || comp.date || new Date().toISOString(),
            venue: comp.venue?.fullName ? `${comp.venue.fullName}, ${comp.venue.address?.city || ''}` : undefined,
            odds,
          });
        }
      }
    } catch (_err) {
      // Individual league timeout - continue with other leagues
    }
  });

  await Promise.all(promises);

  // Sort: LIVE first, then UPCOMING (by kickoff asc), then FT (by kickoff desc)
  allMatches.sort((a, b) => {
    const getOrder = (s: RealMatchItem['status']) => (s === 'LIVE' || s === 'HT' ? 0 : s === 'UPCOMING' ? 1 : 2);
    const orderA = getOrder(a.status);
    const orderB = getOrder(b.status);
    if (orderA !== orderB) return orderA - orderB;
    return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
  });

  if (allMatches.length > 0) {
    scoreboardsCache = { timestamp: now, matches: allMatches };
  }

  let finalResult = allMatches.length > 0 ? allMatches : (scoreboardsCache?.matches || []);
  if (filterLeague && filterLeague !== 'ALL') {
    finalResult = finalResult.filter((m) => m.leagueSlug === filterLeague);
  }

  return {
    matches: finalResult,
    cachedAt: new Date(now).toISOString(),
    totalLeagues: SUPPORTED_LEAGUES.length,
  };
}

// ---------------------------------------------
// 2. FETCH MATCH DETAILS (Stats, Lineups, Events, Odds)
// ---------------------------------------------
export async function fetchMatchDetails(matchId: string, leagueSlug?: string): Promise<RealMatchDetails | null> {
  const now = Date.now();

  const cached = matchDetailCache.get(matchId);
  if (cached && now - cached.timestamp < MATCH_DETAIL_CACHE_TTL_MS) {
    return cached.data;
  }

  // Find league slug if not provided
  let targetLeague = leagueSlug || 'eng.1';
  if (!leagueSlug && scoreboardsCache) {
    const found = scoreboardsCache.matches.find((m) => m.id === matchId);
    if (found) targetLeague = found.leagueSlug;
  }

  // Try target league, fallback to trying all leagues if 404
  const leaguesToTry = [targetLeague, ...SUPPORTED_LEAGUES.map((l) => l.slug).filter((s) => s !== targetLeague)];

  for (const slug of leaguesToTry.slice(0, 4)) {
    try {
      const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${slug}/summary?event=${matchId}`;
      const data = await fetchWithTimeout(url, 4000);

      const headerComp = data.header?.competitions?.[0];
      const homeComp = headerComp?.competitors?.find((c: any) => c.homeAway === 'home');
      const awayComp = headerComp?.competitors?.find((c: any) => c.homeAway === 'away');

      if (!homeComp || !awayComp) continue;

      // Extract statistics
      const homeStatsRaw = data.boxscore?.teams?.find((t: any) => t.homeAway === 'home')?.statistics || [];
      const awayStatsRaw = data.boxscore?.teams?.find((t: any) => t.homeAway === 'away')?.statistics || [];

      const getStat = (list: any[], name: string, fallback = 0) => {
        const item = list.find((s: any) => s.name === name);
        if (!item) return fallback;
        const val = parseFloat(item.displayValue || item.value || '0');
        return isNaN(val) ? fallback : val;
      };

      const getStatStr = (list: any[], name: string, fallback = '0%') => {
        const item = list.find((s: any) => s.name === name);
        return item ? item.displayValue || item.value || fallback : fallback;
      };

      const possessionHome = getStatStr(homeStatsRaw, 'possessionPct', '50%');
      const possessionAway = getStatStr(awayStatsRaw, 'possessionPct', '50%');

      const stats: MatchStats = {
        possession: { home: possessionHome.includes('%') ? possessionHome : `${possessionHome}%`, away: possessionAway.includes('%') ? possessionAway : `${possessionAway}%` },
        totalShots: { home: getStat(homeStatsRaw, 'totalShots'), away: getStat(awayStatsRaw, 'totalShots') },
        shotsOnTarget: { home: getStat(homeStatsRaw, 'shotsOnTarget'), away: getStat(awayStatsRaw, 'shotsOnTarget') },
        wonCorners: { home: getStat(homeStatsRaw, 'wonCorners'), away: getStat(awayStatsRaw, 'wonCorners') },
        foulsCommitted: { home: getStat(homeStatsRaw, 'foulsCommitted'), away: getStat(awayStatsRaw, 'foulsCommitted') },
        yellowCards: { home: getStat(homeStatsRaw, 'yellowCards'), away: getStat(awayStatsRaw, 'yellowCards') },
        redCards: { home: getStat(homeStatsRaw, 'redCards'), away: getStat(awayStatsRaw, 'redCards') },
        offsides: { home: getStat(homeStatsRaw, 'offsides'), away: getStat(awayStatsRaw, 'offsides') },
        saves: { home: getStat(homeStatsRaw, 'saves'), away: getStat(awayStatsRaw, 'saves') },
        accuratePasses: { home: getStat(homeStatsRaw, 'accuratePasses'), away: getStat(awayStatsRaw, 'accuratePasses') },
        passAccuracyPct: { home: getStatStr(homeStatsRaw, 'passPct', '80%'), away: getStatStr(awayStatsRaw, 'passPct', '80%') },
      };

      // Extract rosters & lineups
      const parseRoster = (teamObj: any) => {
        if (!teamObj || !teamObj.roster) return { formation: undefined, starters: [], substitutes: [] };
        const starters: MatchPlayer[] = [];
        const substitutes: MatchPlayer[] = [];

        for (const p of teamObj.roster) {
          const item: MatchPlayer = {
            id: p.athlete?.id,
            name: p.athlete?.displayName || p.athlete?.shortName || 'Player',
            jersey: p.jersey,
            position: p.position?.displayName || p.position?.abbreviation,
            starter: Boolean(p.starter),
          };
          if (p.starter) starters.push(item);
          else substitutes.push(item);
        }

        return {
          formation: teamObj.formation,
          starters,
          substitutes,
        };
      };

      const homeRosterRaw = data.rosters?.find((r: any) => r.homeAway === 'home' || r.team?.id === homeComp.team?.id);
      const awayRosterRaw = data.rosters?.find((r: any) => r.homeAway === 'away' || r.team?.id === awayComp.team?.id);

      const lineups = {
        home: parseRoster(homeRosterRaw),
        away: parseRoster(awayRosterRaw),
      };

      // Extract events
      const events: MatchEvent[] = [];
      if (data.keyEvents && Array.isArray(data.keyEvents)) {
        for (const ev of data.keyEvents) {
          const typeText = (ev.type?.text || '').toUpperCase();
          let evType: MatchEvent['type'] = 'INFO';
          if (typeText.includes('GOAL')) evType = 'GOAL';
          else if (typeText.includes('YELLOW CARD')) evType = 'YELLOW_CARD';
          else if (typeText.includes('RED CARD')) evType = 'RED_CARD';
          else if (typeText.includes('SUBSTITUTION')) evType = 'SUBSTITUTION';
          else if (typeText.includes('VAR')) evType = 'VAR';
          else if (typeText.includes('HALFTIME')) evType = 'HALFTIME';
          else if (typeText.includes('KICKOFF')) evType = 'KICKOFF';

          events.push({
            type: evType,
            clock: ev.clock?.displayValue || '',
            text: ev.text || '',
            team: ev.team?.id === homeComp.team?.id ? 'home' : ev.team?.id === awayComp.team?.id ? 'away' : undefined,
          });
        }
      }

      // Odds
      let odds: any = undefined;
      if (data.pickcenter && data.pickcenter.length > 0) {
        const o = data.pickcenter[0];
        odds = {
          provider: o.provider?.name || 'DraftKings',
          details: o.details,
          overUnder: o.overUnder,
          homeMoneyline: o.homeTeamOdds?.moneyLine,
          awayMoneyline: o.awayTeamOdds?.moneyLine,
          drawOdds: o.drawOdds?.moneyLine,
        };
      }

      const matchDetails: RealMatchDetails = {
        id: matchId,
        leagueSlug: slug,
        competition: data.header?.league?.name || 'League Match',
        homeTeam: homeComp.team?.displayName || 'Home Team',
        homeTeamLogo: homeComp.team?.logos?.[0]?.href || homeComp.team?.logo,
        awayTeam: awayComp.team?.displayName || 'Away Team',
        awayTeamLogo: awayComp.team?.logos?.[0]?.href || awayComp.team?.logo,
        homeScore: parseInt(homeComp.score || '0', 10),
        awayScore: parseInt(awayComp.score || '0', 10),
        status: headerComp?.status?.type?.name || 'STATUS_SCHEDULED',
        statusDetail: headerComp?.status?.type?.detail || 'Scheduled',
        clock: headerComp?.status?.displayClock,
        venue: data.gameInfo?.venue?.fullName,
        referee: data.gameInfo?.officials?.[0]?.displayName,
        attendance: data.gameInfo?.attendance ? data.gameInfo.attendance.toLocaleString() : undefined,
        stats,
        lineups,
        events,
        odds,
      };

      matchDetailCache.set(matchId, { timestamp: now, data: matchDetails });
      return matchDetails;
    } catch (_err) {
      // Continue to next league
    }
  }

  return null;
}

// ---------------------------------------------
// 3. FETCH REAL STANDINGS (League Tables)
// ---------------------------------------------
export async function fetchStandings(leagueSlug = 'eng.1'): Promise<RealStandingEntry[]> {
  const now = Date.now();

  const cached = standingsCache.get(leagueSlug);
  if (cached && now - cached.timestamp < STANDINGS_CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const url = `https://site.api.espn.com/apis/v2/sports/soccer/${leagueSlug}/standings`;
    const data = await fetchWithTimeout(url, 4000);

    const entries = data.children?.[0]?.standings?.entries || [];
    const parsed: RealStandingEntry[] = [];

    for (const item of entries) {
      const statsMap: Record<string, any> = {};
      if (item.stats && Array.isArray(item.stats)) {
        for (const s of item.stats) {
          statsMap[s.name] = s.value;
        }
      }

      parsed.push({
        rank: statsMap.rank || parsed.length + 1,
        team: item.team?.displayName || 'Team',
        teamLogo: item.team?.logos?.[0]?.href,
        gamesPlayed: statsMap.gamesPlayed || 0,
        wins: statsMap.wins || 0,
        draws: statsMap.ties || 0,
        losses: statsMap.losses || 0,
        goalsFor: statsMap.pointsFor || 0,
        goalsAgainst: statsMap.pointsAgainst || 0,
        goalDifference: statsMap.pointDifferential || 0,
        points: statsMap.points || 0,
      });
    }

    if (parsed.length > 0) {
      standingsCache.set(leagueSlug, { timestamp: now, data: parsed });
    }

    return parsed;
  } catch (err) {
    console.error(`Failed to fetch standings for ${leagueSlug}:`, err);
    return cached?.data || [];
  }
}
