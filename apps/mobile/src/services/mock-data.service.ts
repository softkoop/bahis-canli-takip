export interface Team {
  name: string;
  shortName: string;
  logo: string;
}

export interface Odds {
  "1": number | string;
  X: number | string;
  "2": number | string;
}

export interface TeamStats {
  possession: number;
  shots: number;
  accurateShots: number;
  dangerousAttacks: number;
  corners: number;
}

export interface MatchStats {
  home: TeamStats;
  away: TeamStats;
  matchDuration: number;
  currentHalf: "first" | "second";
}

export interface Match {
  id: number;
  time: string;
  homeTeam: Team;
  awayTeam: Team;
  odds: Odds;
  confidence: string | null;
  betType: string | null;
  betOdd: number | null;
  isLive: boolean;
  league: string | null;
  flag: string | null;
  score?: {
    home: number;
    away: number;
  };
  minute?: number;
  date?: string;
  stats?: MatchStats;
}

export interface LeagueGroup {
  league: string;
  flag: string;
  matches: Match[];
}

// Ligler ve takımlar
const LEAGUES = [
  {
    name: "İspanya - La Liga",
    flag: "🇪🇸",
    teams: [
      "Real Madrid",
      "Barcelona",
      "Atletico Madrid",
      "Rayo Vallecano",
      "Levante",
      "Sevilla",
    ],
  },
  {
    name: "İtalya - Serie A",
    flag: "🇮🇹",
    teams: [
      "Juventus",
      "AC Milan",
      "Inter Milan",
      "Roma",
      "Cremonese",
      "Fiorentina",
    ],
  },
  {
    name: "İngiltere - Premier League",
    flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    teams: [
      "Manchester City",
      "Liverpool",
      "Chelsea",
      "Arsenal",
      "Manchester United",
      "Tottenham",
    ],
  },
  {
    name: "İngiltere - Championship",
    flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    teams: [
      "Portsmouth",
      "Derby County",
      "Norwich City",
      "Leeds United",
      "West Brom",
      "Southampton",
    ],
  },
  {
    name: "Türkiye - Süper Lig",
    flag: "🇹🇷",
    teams: [
      "Galatasaray",
      "Fenerbahçe",
      "Beşiktaş",
      "Trabzonspor",
      "Başakşehir",
      "Adana Demirspor",
    ],
  },
  {
    name: "ABD - Major League Soccer",
    flag: "🇺🇸",
    teams: [
      "LA Galaxy",
      "Inter Miami",
      "New York City",
      "Chicago Fire",
      "Seattle Sounders",
      "Atlanta United",
    ],
  },
  {
    name: "Almanya - Bundesliga",
    flag: "🇩🇪",
    teams: [
      "Bayern Munich",
      "Borussia Dortmund",
      "RB Leipzig",
      "Bayer Leverkusen",
      "Eintracht Frankfurt",
      "Wolfsburg",
    ],
  },
  {
    name: "Fransa - Ligue 1",
    flag: "🇫🇷",
    teams: ["PSG", "Marseille", "Lyon", "Monaco", "Lille", "Nice"],
  },
];

const TEAM_LOGOS: Record<string, string> = {
  "Rayo Vallecano": "RAY",
  Levante: "LEV",
  Cremonese: "CRE",
  Fiorentina: "FIO",
  Portsmouth: "POR",
  "Derby County": "DER",
  Galatasaray: "GAL",
  Fenerbahçe: "FEN",
  Beşiktaş: "BJK",
  Trabzonspor: "TS",
  "Real Madrid": "RMA",
  Barcelona: "BAR",
  "Manchester City": "MNC",
  Liverpool: "LIV",
  Juventus: "JUV",
  "AC Milan": "ACM",
  "Bayern Munich": "BAY",
  PSG: "PSG",
};

const random = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const randomOdds = () => {
  const home = (Math.random() * 3 + 1.5).toFixed(2);
  const draw = (Math.random() * 2 + 2.5).toFixed(2);
  const away = (Math.random() * 3 + 1.5).toFixed(2);
  return { "1": parseFloat(home), X: parseFloat(draw), "2": parseFloat(away) };
};

const randomConfidence = () => `${random(55, 92)}%`;

const randomBetType = () => {
  const types = ["1", "X", "2", "1X", "X2", "12", "-1.5", "+2.5", "-3.5"];
  return types[Math.floor(Math.random() * types.length)];
};

const randomMinute = () => {
  const minutes = [0, 15, 30, 45];
  return minutes[Math.floor(Math.random() * minutes.length)];
};

// ============ YENİ EKLENEN FONKSİYONLAR ============

// Şu anki zamanı al
const getCurrentDateTime = () => new Date();

// Maç saatini Date nesnesine çevir
const getMatchDateTime = (date: Date, timeStr: string): Date => {
  const [hour, minute] = timeStr.split(":").map(Number);
  const matchDate = new Date(date);
  matchDate.setHours(hour, minute, 0, 0);
  return matchDate;
};

// Maçın canlı olup olmadığını ve dakikasını hesapla
const calculateMatchLiveStatus = (
  matchDate: Date,
  matchTime: string,
): { isLive: boolean; currentMinute: number } => {
  const now = getCurrentDateTime();
  const matchDateTime = getMatchDateTime(matchDate, matchTime);
  const matchEndTime = new Date(matchDateTime);
  matchEndTime.setHours(
    matchDateTime.getHours() + 1,
    matchDateTime.getMinutes() + 45,
    0,
    0,
  );

  // Maç henüz başlamamış
  if (now < matchDateTime) {
    return { isLive: false, currentMinute: 0 };
  }

  // Maç devam ediyor (başladı ama bitmedi)
  if (now >= matchDateTime && now <= matchEndTime) {
    const elapsedMinutes = Math.floor(
      (now.getTime() - matchDateTime.getTime()) / (1000 * 60),
    );
    const currentMinute = Math.min(90, Math.max(0, elapsedMinutes));
    return { isLive: true, currentMinute };
  }

  // Maç bitmiş
  return { isLive: false, currentMinute: 90 };
};

// Belirli bir dakikadaki istatistikleri üret
const generateMatchStatsAtMinute = (minute: number): MatchStats => {
  const possession = generatePossession();
  const progress = minute / 90;

  return {
    home: {
      possession: possession.home,
      shots: Math.floor(random(0, 15) * progress),
      accurateShots: Math.floor(random(0, 10) * progress),
      dangerousAttacks: Math.floor(random(0, 50) * progress),
      corners: Math.floor(random(0, 10) * progress),
    },
    away: {
      possession: possession.away,
      shots: Math.floor(random(0, 15) * progress),
      accurateShots: Math.floor(random(0, 10) * progress),
      dangerousAttacks: Math.floor(random(0, 50) * progress),
      corners: Math.floor(random(0, 10) * progress),
    },
    matchDuration: minute,
    currentHalf: minute > 45 ? "second" : "first",
  };
};

// Belirli bir dakikadaki skoru üret
const generateScoreAtMinute = (
  minute: number,
): { home: number; away: number } => {
  const avgGoalsPerMatch = 2.5;
  const expectedGoals = (minute / 90) * avgGoalsPerMatch;

  let homeGoals = 0;
  let awayGoals = 0;
  const totalGoals = Math.floor(
    Math.random() * (Math.floor(expectedGoals * 2) + 1),
  );

  for (let i = 0; i < totalGoals; i++) {
    if (Math.random() > 0.5) {
      homeGoals++;
    } else {
      awayGoals++;
    }
  }

  return { home: homeGoals, away: awayGoals };
};

// ============ MEVCUT FONKSİYONLAR ============

// Topla oynama yüzdelerini üret (toplamı 100 olacak)
const generatePossession = (): { home: number; away: number } => {
  const home = random(35, 65);
  const away = 100 - home;
  return { home, away };
};

// Takım istatistiklerini üret (0'dan başlayan değerler için)
const generateInitialTeamStats = (): TeamStats => ({
  possession: 0,
  shots: 0,
  accurateShots: 0,
  dangerousAttacks: 0,
  corners: 0,
});

// Maç istatistiği üret (0'dan başlayan değerler)
const generateInitialMatchStats = (): MatchStats => {
  const possession = generatePossession();
  return {
    home: {
      ...generateInitialTeamStats(),
      possession: possession.home,
    },
    away: {
      ...generateInitialTeamStats(),
      possession: possession.away,
    },
    matchDuration: 0,
    currentHalf: "first",
  };
};

// Rastgele artış yap (0 veya 1 artır)
const randomIncrease = (probability: number = 0.3): number => {
  return Math.random() < probability ? 1 : 0;
};

// Takımın filtre skorunu hesapla (gol olasılığı için)
const calculateTeamFilterScore = (
  teamStats: TeamStats,
  filterValues: any,
): number => {
  let score = 0;
  if (teamStats.possession >= filterValues.totalPlay)
    score += teamStats.possession;
  if (teamStats.shots >= filterValues.totalShot) score += teamStats.shots * 10;
  if (teamStats.accurateShots >= filterValues.accurateShot)
    score += teamStats.accurateShots * 15;
  if (teamStats.dangerousAttacks >= filterValues.dangerousAttack)
    score += teamStats.dangerousAttacks;
  if (teamStats.corners >= filterValues.totalCorner)
    score += teamStats.corners * 5;
  return score;
};

// Gol olup olmayacağını belirle
const shouldGoalHappen = (
  homeStats: TeamStats,
  awayStats: TeamStats,
  filterValues: any,
): "home" | "away" | null => {
  const homeScore = calculateTeamFilterScore(homeStats, filterValues);
  const awayScore = calculateTeamFilterScore(awayStats, filterValues);
  const totalScore = homeScore + awayScore;

  if (totalScore === 0) return null;

  if (Math.random() > 0.9) {
    const randomValue = Math.random() * totalScore;
    return randomValue < homeScore ? "home" : "away";
  }
  return null;
};

// Takım istatistiklerini güncelle
const updateTeamStats = (stats: TeamStats, filterValues: any): TeamStats => {
  return {
    possession: Math.min(70, Math.max(30, stats.possession + random(-5, 5))),
    shots: Math.min(30, stats.shots + randomIncrease(0.4)),
    accurateShots: Math.min(20, stats.accurateShots + randomIncrease(0.3)),
    dangerousAttacks: Math.min(
      60,
      stats.dangerousAttacks + randomIncrease(0.35),
    ),
    corners: Math.min(15, stats.corners + randomIncrease(0.25)),
  };
};

// Maç istatistiklerini güncelle
const updateMatchStats = (stats: MatchStats, filterValues: any): MatchStats => {
  const newDuration = stats.matchDuration + 1;
  const newHalf: "first" | "second" = newDuration > 45 ? "second" : "first";
  const goalScorer = shouldGoalHappen(stats.home, stats.away, filterValues);

  return {
    home: updateTeamStats(stats.home, filterValues),
    away: updateTeamStats(stats.away, filterValues),
    matchDuration: newDuration,
    currentHalf: newHalf,
  };
};

// Skoru güncelle
const updateScore = (
  currentScore: { home: number; away: number },
  goalScorer: "home" | "away" | null,
): { home: number; away: number } => {
  if (!goalScorer) return currentScore;
  if (goalScorer === "home") {
    return { ...currentScore, home: currentScore.home + 1 };
  } else {
    return { ...currentScore, away: currentScore.away + 1 };
  }
};

// Filtreleme için toplam değerleri hesapla
export const getTotalForFilter = (
  stats: MatchStats,
  filterKey: string,
): number => {
  switch (filterKey) {
    case "totalPlay":
      return Math.max(stats.home.possession, stats.away.possession);
    case "totalShot":
      return stats.home.shots + stats.away.shots;
    case "accurateShot":
      return stats.home.accurateShots + stats.away.accurateShots;
    case "dangerousAttack":
      return stats.home.dangerousAttacks + stats.away.dangerousAttacks;
    case "totalCorner":
      return stats.home.corners + stats.away.corners;
    default:
      return 0;
  }
};

export const getTeamValues = (
  stats: MatchStats,
  filterKey: string,
): { home: number; away: number } => {
  switch (filterKey) {
    case "totalPlay":
      return { home: stats.home.possession, away: stats.away.possession };
    case "totalShot":
      return { home: stats.home.shots, away: stats.away.shots };
    case "accurateShot":
      return { home: stats.home.accurateShots, away: stats.away.accurateShots };
    case "dangerousAttack":
      return {
        home: stats.home.dangerousAttacks,
        away: stats.away.dangerousAttacks,
      };
    case "totalCorner":
      return { home: stats.home.corners, away: stats.away.corners };
    default:
      return { home: 0, away: 0 };
  }
};

const getWeekDates = () => {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(date);
  }
  return dates;
};

const formatDate = (date: Date) => date.toISOString().split("T")[0];
const getDayName = (date: Date) => {
  const days = ["PAZ", "PZT", "SAL", "ÇAR", "PER", "CUM", "CMT"];
  return days[date.getDay()];
};

// ============ GÜNCELLENEN GENERATE FONKSİYONU ============

const generateMatchesForDate = (date: Date, baseId: number): Match[] => {
  const matches: Match[] = [];
  const dateStr = formatDate(date);
  const isToday = formatDate(new Date()) === dateStr;
  const dayOfWeek = date.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const matchCount = isWeekend ? random(15, 25) : random(8, 15);
  const leaguesToUse = [...LEAGUES];
  const now = getCurrentDateTime();
  const currentHour = now.getHours();

  // NORMAL MAÇLARI OLUŞTUR
  for (let i = 0; i < matchCount && i < leaguesToUse.length * 3; i++) {
    const league =
      leaguesToUse[Math.floor(Math.random() * leaguesToUse.length)];
    const teams = [...league.teams];
    const homeTeamName = teams[Math.floor(Math.random() * teams.length)];
    const awayTeamName = teams[Math.floor(Math.random() * teams.length)];
    if (homeTeamName === awayTeamName) continue;

    // Maç saati belirleme
    let hour: number;
    if (isToday) {
      const minHour = Math.min(Math.max(currentHour + 1, 14), 22);
      hour = random(minHour, 23);
    } else {
      hour = random(18, 23);
    }
    const minute = randomMinute();
    const timeStr = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
    const odds = randomOdds();

    const { isLive, currentMinute: liveMinute } = calculateMatchLiveStatus(
      date,
      timeStr,
    );

    let matchStats: MatchStats | undefined;
    let matchScore: { home: number; away: number } | undefined;
    let matchMinute: number | undefined;

    if (isLive && liveMinute > 0) {
      matchStats = generateMatchStatsAtMinute(liveMinute);
      matchScore = generateScoreAtMinute(liveMinute);
      matchMinute = liveMinute;
    } else if (isLive && liveMinute === 0) {
      matchStats = generateInitialMatchStats();
      matchScore = { home: 0, away: 0 };
      matchMinute = 0;
    }

    const match: Match = {
      id: baseId + i,
      time: timeStr,
      homeTeam: {
        name: homeTeamName,
        shortName:
          homeTeamName.length > 15
            ? homeTeamName.substring(0, 12) + "..."
            : homeTeamName,
        logo:
          TEAM_LOGOS[homeTeamName] ||
          homeTeamName.substring(0, 3).toUpperCase(),
      },
      awayTeam: {
        name: awayTeamName,
        shortName:
          awayTeamName.length > 15
            ? awayTeamName.substring(0, 12) + "..."
            : awayTeamName,
        logo:
          TEAM_LOGOS[awayTeamName] ||
          awayTeamName.substring(0, 3).toUpperCase(),
      },
      odds: odds,
      confidence: randomConfidence(),
      betType: randomBetType(),
      betOdd: odds["1"],
      isLive: isLive,
      league: league.name,
      flag: league.flag,
      date: dateStr,
      stats: matchStats,
    };

    if (matchScore) match.score = matchScore;
    if (matchMinute !== undefined) match.minute = matchMinute;

    matches.push(match);
  }

  // Eğer bugünse ve hiç canlı maç yoksa, zorla bir tane ekle (0. dakikadan başlasın)
  if (isToday && !matches.some((m) => m.isLive)) {
    console.log("Hiç canlı maç yok, zorla ekleniyor...");

    const league = LEAGUES[Math.floor(Math.random() * LEAGUES.length)];
    const teams = [...league.teams];
    const homeTeamName = teams[Math.floor(Math.random() * teams.length)];
    const awayTeamName = teams[Math.floor(Math.random() * teams.length)];

    const liveHour = Math.max(currentHour, 14);
    const timeStr = `${liveHour.toString().padStart(2, "0")}:00`;

    // ZORLA EKLENEN MAÇ - TAMAMEN SIFIRDAN BAŞLIYOR
    const initialStats = generateInitialMatchStats();

    const liveMatch: Match = {
      id: baseId + matchCount + 100,
      time: timeStr,
      homeTeam: {
        name: homeTeamName,
        shortName:
          homeTeamName.length > 15
            ? homeTeamName.substring(0, 12) + "..."
            : homeTeamName,
        logo:
          TEAM_LOGOS[homeTeamName] ||
          homeTeamName.substring(0, 3).toUpperCase(),
      },
      awayTeam: {
        name: awayTeamName,
        shortName:
          awayTeamName.length > 15
            ? awayTeamName.substring(0, 12) + "..."
            : awayTeamName,
        logo:
          TEAM_LOGOS[awayTeamName] ||
          awayTeamName.substring(0, 3).toUpperCase(),
      },
      odds: randomOdds(),
      confidence: randomConfidence(),
      betType: randomBetType(),
      betOdd: randomOdds()["1"],
      isLive: true,
      league: league.name,
      flag: league.flag,
      date: dateStr,
      stats: initialStats, // matchDuration: 0, tüm istatistikler 0
      score: { home: 0, away: 0 },
      minute: 0, // 0. dakika
    };

    console.log("Zorla eklenen maç:", {
      minute: liveMatch.minute,
      matchDuration: liveMatch.stats?.matchDuration,
      stats: liveMatch.stats,
    });

    matches.push(liveMatch);
  }

  console.log(
    `${matches.length} maç oluşturuldu, canlı maç sayısı: ${matches.filter((m) => m.isLive).length}`,
  );

  matches.sort((a, b) => (a.league || "").localeCompare(b.league || ""));
  return matches;
};

const generateAllWeekMatches = (): Match[] => {
  const weekDates = getWeekDates();
  let allMatches: Match[] = [];
  let nextId = 1;
  weekDates.forEach((date) => {
    const dayMatches = generateMatchesForDate(date, nextId);
    allMatches = [...allMatches, ...dayMatches];
    nextId += dayMatches.length + 100;
  });
  return allMatches;
};

class MockDataService {
  private allMatches: Match[] = [];
  private selectedDate: string = formatDate(new Date());
  private liveUpdateInterval: NodeJS.Timeout | null = null;
  private updateCallbacks: ((matches: Match[]) => void)[] = [];
  private currentFilters: any = null;

  constructor() {
    this.allMatches = generateAllWeekMatches();
    console.log(`${this.allMatches.length} maç oluşturuldu`);
  }

  setFilters(filters: any) {
    this.currentFilters = filters;
  }

  async getMatchesByDate(date?: string): Promise<Match[]> {
    const targetDate = date || this.selectedDate;
    const filtered = this.allMatches.filter(
      (match) => match.date === targetDate,
    );
    return new Promise((resolve) =>
      setTimeout(() => resolve([...filtered]), 300),
    );
  }

  async getTodayMatches(): Promise<Match[]> {
    return this.getMatchesByDate(formatDate(new Date()));
  }

  setSelectedDate(date: string) {
    this.selectedDate = date;
  }

  async getLiveMatches(): Promise<Match[]> {
    const today = formatDate(new Date());
    const todayMatches = await this.getMatchesByDate(today);
    return todayMatches.filter((match) => match.isLive);
  }

  async getGroupedMatches(date?: string): Promise<LeagueGroup[]> {
    const matches = await this.getMatchesByDate(date);
    const grouped: { [key: string]: Match[] } = {};
    matches.forEach((match) => {
      const leagueKey = match.league || "__no_league";
      if (!grouped[leagueKey]) grouped[leagueKey] = [];
      grouped[leagueKey].push(match);
    });
    const result: LeagueGroup[] = [];
    if (grouped["__no_league"]) {
      result.push({ league: "", flag: "", matches: grouped["__no_league"] });
    }
    Object.keys(grouped).forEach((key) => {
      if (key !== "__no_league") {
        result.push({
          league: key,
          flag: matches.find((m) => m.league === key)?.flag || "",
          matches: grouped[key],
        });
      }
    });
    return result;
  }

  getDateList(): { date: string; dayName: string; dayNumber: number }[] {
    const weekDates = getWeekDates();
    return weekDates.map((date) => ({
      date: formatDate(date),
      dayName: getDayName(date),
      dayNumber: date.getDate(),
    }));
  }

  async filterMatches(filters: {
    date?: string;
    league?: string;
    isLive?: boolean;
    searchText?: string;
  }): Promise<Match[]> {
    let filtered = await this.getMatchesByDate(filters.date);
    if (filters.isLive !== undefined)
      filtered = filtered.filter((m) => m.isLive === filters.isLive);
    if (filters.league && filters.league !== "all")
      filtered = filtered.filter((m) => m.league === filters.league);
    if (filters.searchText) {
      const search = filters.searchText.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.homeTeam.name.toLowerCase().includes(search) ||
          m.awayTeam.name.toLowerCase().includes(search) ||
          m.league?.toLowerCase().includes(search),
      );
    }
    return filtered;
  }

  startLiveDataSimulation(
    callback: (updatedMatches: Match[]) => void,
  ): () => void {
    this.updateCallbacks.push(callback);

    if (!this.liveUpdateInterval) {
      this.liveUpdateInterval = setInterval(() => {
        const today = formatDate(new Date());
        const updatedMatches: Match[] = [];

        this.allMatches = this.allMatches.map((match) => {
          if (
            match.date === today &&
            match.isLive &&
            match.stats &&
            match.minute !== undefined &&
            match.minute < 90
          ) {
            const filterValues = this.currentFilters || {
              totalPlay: 50,
              totalShot: 1,
              accurateShot: 1,
              dangerousAttack: 1,
              totalCorner: 1,
              duration: 1,
            };

            const updated = { ...match };
            updated.stats = updateMatchStats(
              updated.stats as MatchStats,
              filterValues,
            );
            updated.minute = updated.stats.matchDuration;

            const goalScorer = shouldGoalHappen(
              updated.stats.home,
              updated.stats.away,
              filterValues,
            );

            if (updated.score) {
              updated.score = updateScore(updated.score, goalScorer);
            }

            updatedMatches.push(updated);
            return updated;
          }
          return match;
        });

        if (updatedMatches.length > 0 && this.updateCallbacks.length > 0) {
          this.updateCallbacks.forEach((cb) => cb([...updatedMatches]));
        }
      }, 5000);
    }

    return () => {
      const index = this.updateCallbacks.indexOf(callback);
      if (index !== -1) this.updateCallbacks.splice(index, 1);
      if (this.updateCallbacks.length === 0 && this.liveUpdateInterval) {
        clearInterval(this.liveUpdateInterval);
        this.liveUpdateInterval = null;
      }
    };
  }

  stopLiveDataSimulation() {
    if (this.liveUpdateInterval) {
      clearInterval(this.liveUpdateInterval);
      this.liveUpdateInterval = null;
    }
    this.updateCallbacks = [];
  }
}

export const mockDataService = new MockDataService();
