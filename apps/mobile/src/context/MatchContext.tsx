import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { mockDataService, Match, LeagueGroup } from "../services/api.service";

// Filtre tipleri
export interface FilterStats {
  totalPlay: number;
  totalShot: number;
  accurateShot: number;
  dangerousAttack: number;
  totalCorner: number;
  duration: number;
  soundEnabled: boolean;
}

// Maçın yeşil ışık ve animasyon durumu
export interface MatchGreenState {
  isGreenActive: boolean;
  showGoalAnimation: boolean;
  greenActivatedAtMinute: number;
  goalScoredAfterGreen: boolean;
  activeHalf: "first" | "second" | null;
}

export interface MatchingFilterItem {
  label: string;
  matchValue: number;
  filterValue: number;
  unit: string;
  homeValue: number;
  awayValue: number;
}

interface MatchContextType {
  matches: Match[];
  liveMatches: Match[];
  groupedMatches: LeagueGroup[];
  loading: boolean;
  error: string | null;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  dateList: { date: string; dayName: string; dayNumber: number }[];
  refreshMatches: () => Promise<void>;
  isSocketConnected: boolean;
  firstHalfFilters: FilterStats;
  secondHalfFilters: FilterStats;
  updateFirstHalfFilters: (values: FilterStats) => void;
  updateSecondHalfFilters: (values: FilterStats) => void;
  clearFilters: () => void;
  isMatchMatchingFilters: (match: Match) => boolean;
  getMatchingFilterItems: (match: Match) => MatchingFilterItem[];
  getMatchGreenState: (matchId: number) => MatchGreenState;
  trackedMatchIds: number[];
  toggleTrackMatch: (matchId: number) => void;
}

// 1. YARI için varsayılan filtreler
const defaultFirstHalfFilters: FilterStats = {
  totalPlay: 50,
  totalShot: 1,
  accurateShot: 1,
  dangerousAttack: 1,
  totalCorner: 1,
  duration: 20,
  soundEnabled: false,
};

// 2. YARI için varsayılan filtreler
const defaultSecondHalfFilters: FilterStats = {
  totalPlay: 50,
  totalShot: 1,
  accurateShot: 1,
  dangerousAttack: 1,
  totalCorner: 1,
  duration: 60,
  soundEnabled: false,
};

// Filtreleri localStorage'a kaydet
const saveFirstHalfFilters = (values: FilterStats) => {
  localStorage.setItem("first_half_filters", JSON.stringify(values));
};

const saveSecondHalfFilters = (values: FilterStats) => {
  localStorage.setItem("second_half_filters", JSON.stringify(values));
};

const loadFirstHalfFilters = (): FilterStats => {
  const saved = localStorage.getItem("first_half_filters");
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return defaultFirstHalfFilters;
    }
  }
  return defaultFirstHalfFilters;
};

const loadSecondHalfFilters = (): FilterStats => {
  const saved = localStorage.getItem("second_half_filters");
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return defaultSecondHalfFilters;
    }
  }
  return defaultSecondHalfFilters;
};

// Bir takımın tüm filtreleri sağlayıp sağlamadığını kontrol et
const doesTeamPassAllFilters = (
  teamStats: {
    possession: number;
    shots: number;
    accurateShots: number;
    dangerousAttacks: number;
    corners: number;
  },
  filters: FilterStats,
): boolean => {
  return (
    teamStats.possession >= filters.totalPlay &&
    teamStats.shots >= filters.totalShot &&
    teamStats.accurateShots >= filters.accurateShot &&
    teamStats.dangerousAttacks >= filters.dangerousAttack &&
    teamStats.corners >= filters.totalCorner
  );
};

// İki takımdan birinin tüm filtreleri sağlayıp sağlamadığını kontrol et
const doesAnyTeamPassAllFilters = (
  match: Match,
  filters: FilterStats,
): boolean => {
  if (!match.stats) return false;
  return (
    doesTeamPassAllFilters(match.stats.home, filters) ||
    doesTeamPassAllFilters(match.stats.away, filters)
  );
};

const doTeamsTogetherPassAllFilters = (
  match: Match,
  filters: FilterStats,
): boolean => {
  if (!match.stats) return false;

  const totalStats = {
    possession: match.stats.home.possession + match.stats.away.possession,
    shots: match.stats.home.shots + match.stats.away.shots,
    accurateShots:
      match.stats.home.accurateShots + match.stats.away.accurateShots,
    dangerousAttacks:
      match.stats.home.dangerousAttacks + match.stats.away.dangerousAttacks,
    corners: match.stats.home.corners + match.stats.away.corners,
  };

  return (
    totalStats.possession >= filters.totalPlay &&
    totalStats.shots >= filters.totalShot &&
    totalStats.accurateShots >= filters.accurateShot &&
    totalStats.dangerousAttacks >= filters.dangerousAttack &&
    totalStats.corners >= filters.totalCorner
  );
};

// goalScored parametresi ile yeşil ışık hesaplama
const calculateGreenState = (
  match: Match,
  firstHalfFilters: FilterStats,
  secondHalfFilters: FilterStats,
  previousState: MatchGreenState,
  goalScored: boolean,
): MatchGreenState => {
  if (!match.isLive || !match.stats) {
    return {
      isGreenActive: false,
      showGoalAnimation: false,
      greenActivatedAtMinute: 0,
      goalScoredAfterGreen: false,
      activeHalf: null,
    };
  }

  const currentMinute = match.minute || 0;
  const isFirstHalf = currentMinute <= 45;
  const isSecondHalf = currentMinute > 45 && currentMinute <= 90;

  // Yarı değiştiyse state'i sıfırla
  if (previousState.activeHalf === "first" && isSecondHalf) {
    return {
      isGreenActive: false,
      showGoalAnimation: false,
      greenActivatedAtMinute: 0,
      goalScoredAfterGreen: false,
      activeHalf: "second",
    };
  }

  if (previousState.activeHalf === "second" && !match.isLive) {
    return {
      isGreenActive: false,
      showGoalAnimation: false,
      greenActivatedAtMinute: 0,
      goalScoredAfterGreen: false,
      activeHalf: null,
    };
  }

  // 🔥 GOL KONTROLÜ: Gol olduysa veya daha önce olduysa yeşil asla yanmaz
  const hasGoalOccurred = previousState.goalScoredAfterGreen || goalScored;

  if (hasGoalOccurred) {
    return {
      isGreenActive: false,
      showGoalAnimation: previousState.showGoalAnimation || goalScored,
      greenActivatedAtMinute: previousState.greenActivatedAtMinute,
      goalScoredAfterGreen: true,
      activeHalf:
        previousState.activeHalf || (isFirstHalf ? "first" : "second"),
    };
  }

  // 🔥 DAKİKA FİLTRESİ YOK! Sadece yarı bazında filtre seç
  const currentFilters = isFirstHalf ? firstHalfFilters : secondHalfFilters;
  const currentHalf = isFirstHalf ? "first" : "second";

  // 🔥 Yeşil zaten yanıyorsa aynen devam et
  if (previousState.isGreenActive) {
    return previousState;
  }

  // 🔥 YENİ KONTROL: Takımların toplam istatistikleri filtreleri geçiyor mu?
  const teamsTogetherPass = doTeamsTogetherPassAllFilters(
    match,
    currentFilters,
  );

  if (teamsTogetherPass) {
    return {
      isGreenActive: true,
      showGoalAnimation: false,
      greenActivatedAtMinute: currentMinute,
      goalScoredAfterGreen: false,
      activeHalf: currentHalf,
    };
  }

  return previousState;
};

// ============ SIRALAMA FONKSİYONLARI ============

const sortMatchesByLiveAndTime = (matches: Match[]): Match[] => {
  return [...matches].sort((a, b) => {
    // Canlı maçlar her zaman üstte
    if (a.isLive !== b.isLive) {
      return a.isLive ? -1 : 1;
    }

    // İKİSİ DE CANLIYSA: dakikaya göre sırala (küçük dakika üstte = yeni başlayan)
    if (a.isLive && b.isLive) {
      const aMinute = a.minute || 0;
      const bMinute = b.minute || 0;
      // Yeni başlayan (dakikası küçük olan) üstte
      if (aMinute !== bMinute) {
        return aMinute - bMinute; // Küçük dakika önce
      }
    }

    // İkisi de canlı değilse veya dakikalar eşitse saatine göre sırala
    if (a.time > b.time) return -1;
    if (a.time < b.time) return 1;
    return 0;
  });
};

// Gruplanmış maçları sırala
const sortGroupedMatches = (groups: LeagueGroup[]): LeagueGroup[] => {
  return groups.map((group) => ({
    ...group,
    matches: sortMatchesByLiveAndTime(group.matches),
  }));
};

const MatchContext = createContext<MatchContextType | undefined>(undefined);

export const MatchProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [groupedMatches, setGroupedMatches] = useState<LeagueGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(
    () => new Date().toISOString().split("T")[0],
  );
  const [dateList, setDateList] = useState<
    { date: string; dayName: string; dayNumber: number }[]
  >([]);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [firstHalfFilters, setFirstHalfFilters] =
    useState<FilterStats>(loadFirstHalfFilters);
  const [secondHalfFilters, setSecondHalfFilters] = useState<FilterStats>(
    loadSecondHalfFilters,
  );
  const [cleanupSocket, setCleanupSocket] = useState<(() => void) | null>(null);
  const [greenStates, setGreenStates] = useState<
    Record<number, MatchGreenState>
  >({});
  const [previousScores, setPreviousScores] = useState<
    Record<number, { home: number; away: number }>
  >({});
  const [trackedMatchIds, setTrackedMatchIds] = useState<number[]>(() => {
    const saved = localStorage.getItem("tracked_matches");
    return saved ? JSON.parse(saved) : [];
  });

  const toggleTrackMatch = useCallback((matchId: number) => {
    setTrackedMatchIds((prev) => {
      const newList = prev.includes(matchId)
        ? prev.filter((id) => id !== matchId)
        : [...prev, matchId];
      localStorage.setItem("tracked_matches", JSON.stringify(newList));
      mockDataService.updateTrackedMatches(newList);
      return newList;
    });
  }, []);

  // ============ GÜNCELLEME (Sadece minute, score, stats) ============
  const updateMatches = useCallback((updatedMatches: Match[]) => {
    setGroupedMatches((prev) => {
      // Önce grupları güncelle
      const updated = prev.map((group) => {
        const newMatches = group.matches.map((existing) => {
          const updatedMatch = updatedMatches.find((u) => u.id === existing.id);
          if (!updatedMatch) return existing;

          return {
            ...existing,
            ...updatedMatch,
            homeTeam: existing.homeTeam,
            awayTeam: existing.awayTeam,
            stats: updatedMatch.stats
              ? { ...existing.stats, ...updatedMatch.stats }
              : existing.stats,
          } as Match;
        });

        // ✅ Her güncellemede grubun içindeki maçları yeniden sırala
        return {
          ...group,
          matches: sortMatchesByLiveAndTime(newMatches),
        };
      });

      return updated;
    });
  }, []);

  // refreshLiveMatches fonksiyonunu da güncelle
  const refreshLiveMatches = useCallback(async () => {
    try {
      console.log("🔄 Canlı maçlar yenileniyor...");
      const freshLiveMatches = await mockDataService.getLiveMatches();

      setGroupedMatches((prev) => {
        const today = new Date().toISOString().split("T")[0];
        const liveGroup = {
          league: "🔴 CANLI MAÇLAR",
          flag: "⚽",
          matches: sortMatchesByLiveAndTime(freshLiveMatches), // ✅ Sırala
        };

        const hasLiveGroup = prev.some((g) => g.league === "🔴 CANLI MAÇLAR");
        let newGroups;
        if (hasLiveGroup) {
          newGroups = prev.map((g) =>
            g.league === "🔴 CANLI MAÇLAR" ? liveGroup : g,
          );
        } else {
          newGroups = [liveGroup, ...prev];
        }

        // ✅ Tüm grupları yeniden sırala
        return sortGroupedMatches(newGroups);
      });

      console.log(`✅ ${freshLiveMatches.length} canlı maç yüklendi`);
    } catch (error) {
      console.error("Refresh hatası:", error);
    }
  }, []);

  // ============ FİKSTÜR YÜKLEME ============
  const loadFixtures = useCallback(async () => {
    try {
      setLoading(true);
      const grouped = await mockDataService.getGroupedMatches(selectedDate);
      const live = await mockDataService.getLiveMatches();

      console.log("🔴 Fikstür maçları (grouped):", grouped.length, "grup");
      console.log("🔴 Canlı maçlar (live):", live.length, "maç");
      console.log(
        "🔴 Seçili tarih:",
        selectedDate,
        "bugün mü?",
        selectedDate === new Date().toISOString().split("T")[0],
      );

      const today = new Date().toISOString().split("T")[0];
      let finalGrouped = grouped;

      if (selectedDate === today && live.length > 0) {
        const liveGroup = {
          league: "🔴 CANLI MAÇLAR",
          flag: "⚽",
          matches: live,
        };
        finalGrouped = [liveGroup, ...grouped];
      }

      // Tüm gruplardaki maçları sırala
      setGroupedMatches(sortGroupedMatches(finalGrouped));
      setError(null);
    } catch (err) {
      setError("Veriler yüklenirken bir hata oluştu");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  // ============ WEBSOCKET BAĞLANTISI ============
  const startLiveDataSimulation = useCallback(() => {
    if (cleanupSocket) cleanupSocket();

    const cleanup = mockDataService.startLiveDataSimulation(
      (updatedMatches) => {
        updateMatches(updatedMatches);
      },
    );

    setCleanupSocket(() => cleanup);
    setIsSocketConnected(true);
    return cleanup;
  }, [cleanupSocket, updateMatches]);

  // ============ EVENT DİNLEYİCİLERİ ============
  useEffect(() => {
    const handleRefreshLiveMatches = () => {
      refreshLiveMatches();
    };

    window.addEventListener("refresh-live-matches", handleRefreshLiveMatches);
    return () => {
      window.removeEventListener(
        "refresh-live-matches",
        handleRefreshLiveMatches,
      );
    };
  }, [refreshLiveMatches]);

  const updateGreenStates = useCallback(() => {
    const allMatches: Match[] = [];
    groupedMatches.forEach((group) => {
      allMatches.push(...group.matches);
    });

    const newStates: Record<number, MatchGreenState> = {};
    const newPreviousScores: Record<number, { home: number; away: number }> =
      {};

    allMatches.forEach((match) => {
      const previousState = greenStates[match.id] || {
        isGreenActive: false,
        showGoalAnimation: false,
        greenActivatedAtMinute: 0,
        goalScoredAfterGreen: false,
        activeHalf: null,
      };

      const previousScore = previousScores[match.id];
      const goalScored = previousScore
        ? (match.score?.home || 0) > previousScore.home ||
          (match.score?.away || 0) > previousScore.away
        : false;

      newStates[match.id] = calculateGreenState(
        match,
        firstHalfFilters,
        secondHalfFilters,
        previousState,
        goalScored,
      );

      newPreviousScores[match.id] = match.score || { home: 0, away: 0 };
    });

    setGreenStates(newStates);
    setPreviousScores(newPreviousScores);
  }, [groupedMatches, firstHalfFilters, secondHalfFilters, previousScores]);

  // ============ GET MATCHING FILTER ITEMS (DOLDURULMUŞ HALİ) ============
  const getMatchingFilterItems = useCallback(
    (match: Match): MatchingFilterItem[] => {
      if (!match.isLive || !match.stats) return [];

      const currentMinute = match.stats.matchDuration;
      const isFirstHalf = currentMinute <= 45;
      const currentFilters = isFirstHalf ? firstHalfFilters : secondHalfFilters;

      const items: MatchingFilterItem[] = [];
      const doesHomePass = doesTeamPassAllFilters(
        match.stats.home,
        currentFilters,
      );
      const doesAwayPass = doesTeamPassAllFilters(
        match.stats.away,
        currentFilters,
      );
      const passingTeam = doesHomePass
        ? match.stats.home
        : doesAwayPass
          ? match.stats.away
          : null;

      if (passingTeam) {
        if (passingTeam.possession >= currentFilters.totalPlay) {
          items.push({
            label: "Topla Oynama",
            matchValue: passingTeam.possession,
            filterValue: currentFilters.totalPlay,
            unit: "%",
            homeValue: match.stats.home.possession,
            awayValue: match.stats.away.possession,
          });
        }
        if (passingTeam.shots >= currentFilters.totalShot) {
          items.push({
            label: "Toplam Şut",
            matchValue: passingTeam.shots,
            filterValue: currentFilters.totalShot,
            unit: "",
            homeValue: match.stats.home.shots,
            awayValue: match.stats.away.shots,
          });
        }
        if (passingTeam.accurateShots >= currentFilters.accurateShot) {
          items.push({
            label: "İsabetli Şut",
            matchValue: passingTeam.accurateShots,
            filterValue: currentFilters.accurateShot,
            unit: "",
            homeValue: match.stats.home.accurateShots,
            awayValue: match.stats.away.accurateShots,
          });
        }
        if (passingTeam.dangerousAttacks >= currentFilters.dangerousAttack) {
          items.push({
            label: "Tehlikeli Atak",
            matchValue: passingTeam.dangerousAttacks,
            filterValue: currentFilters.dangerousAttack,
            unit: "",
            homeValue: match.stats.home.dangerousAttacks,
            awayValue: match.stats.away.dangerousAttacks,
          });
        }
        if (passingTeam.corners >= currentFilters.totalCorner) {
          items.push({
            label: "Korner",
            matchValue: passingTeam.corners,
            filterValue: currentFilters.totalCorner,
            unit: "",
            homeValue: match.stats.home.corners,
            awayValue: match.stats.away.corners,
          });
        }
      }

      return items;
    },
    [firstHalfFilters, secondHalfFilters],
  );

  useEffect(() => {
    updateGreenStates();
  }, [groupedMatches, firstHalfFilters, secondHalfFilters]);

  const getMatchGreenState = useCallback(
    (matchId: number): MatchGreenState => {
      return (
        greenStates[matchId] || {
          isGreenActive: false,
          showGoalAnimation: false,
          greenActivatedAtMinute: 0,
          goalScoredAfterGreen: false,
          activeHalf: null,
        }
      );
    },
    [greenStates],
  );

  const isMatchMatchingFilters = useCallback(
    (match: Match): boolean => {
      return greenStates[match.id]?.isGreenActive || false;
    },
    [greenStates],
  );

  // ============ TARİH DEĞİŞİMİ ============
  const handleSetSelectedDate = useCallback((date: string) => {
    setSelectedDate(date);
    mockDataService.setSelectedDate(date);
  }, []);

  const refreshMatches = useCallback(async () => {
    await loadFixtures();
  }, [loadFixtures]);

  // ============ FİLTRELER ============
  const updateFirstHalfFilters = useCallback((values: FilterStats) => {
    setFirstHalfFilters(values);
    saveFirstHalfFilters(values);
  }, []);

  const updateSecondHalfFilters = useCallback((values: FilterStats) => {
    setSecondHalfFilters(values);
    saveSecondHalfFilters(values);
  }, []);

  const clearFilters = useCallback(() => {
    setFirstHalfFilters(defaultFirstHalfFilters);
    setSecondHalfFilters(defaultSecondHalfFilters);
    saveFirstHalfFilters(defaultFirstHalfFilters);
    saveSecondHalfFilters(defaultSecondHalfFilters);
  }, []);

  // ============ İNİTİALİZASYON ============
  useEffect(() => {
    loadFixtures();
    const cleanup = startLiveDataSimulation();
    return () => {
      if (cleanup) cleanup();
      if (cleanupSocket) cleanupSocket();
      mockDataService.stopLiveDataSimulation();
    };
  }, [selectedDate]);

  // ============ DATE LIST ============
  useEffect(() => {
    mockDataService.getDateList().then(setDateList).catch(console.error);
  }, []);

  return (
    <MatchContext.Provider
      value={{
        matches: [],
        liveMatches: [],
        groupedMatches,
        loading,
        error,
        selectedDate,
        setSelectedDate: handleSetSelectedDate,
        dateList,
        refreshMatches,
        isSocketConnected,
        firstHalfFilters,
        secondHalfFilters,
        updateFirstHalfFilters,
        updateSecondHalfFilters,
        clearFilters,
        isMatchMatchingFilters,
        getMatchingFilterItems,
        getMatchGreenState,
        trackedMatchIds,
        toggleTrackMatch,
      }}
    >
      {children}
    </MatchContext.Provider>
  );
};

export const useMatches = () => {
  const context = useContext(MatchContext);
  if (!context) throw new Error("useMatches must be used within MatchProvider");
  return context;
};
