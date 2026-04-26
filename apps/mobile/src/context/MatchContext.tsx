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

  const currentMinute = match.stats.matchDuration;
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

  // Gol olduktan sonra yeşil bir daha yanmasın
  if (previousState.goalScoredAfterGreen) {
    return {
      isGreenActive: false,
      showGoalAnimation: previousState.showGoalAnimation,
      greenActivatedAtMinute: previousState.greenActivatedAtMinute,
      goalScoredAfterGreen: true,
      activeHalf: previousState.activeHalf,
    };
  }

  const currentFilters = isFirstHalf ? firstHalfFilters : secondHalfFilters;
  const currentHalf = isFirstHalf ? "first" : "second";
  const filterMinute = currentFilters.duration;
  const filterWindowEnd = filterMinute + 3; // 3 dakika tolerans

  const goalMinute = match.minute || 0;

  // Gol filtre dakikasından ÖNCE olduysa ASLA YEŞİL YANMAZ
  const goalBeforeFilter =
    goalScored && goalMinute > 0 && goalMinute < filterMinute;
  if (goalBeforeFilter) {
    return {
      isGreenActive: false,
      showGoalAnimation: false,
      greenActivatedAtMinute: 0,
      goalScoredAfterGreen: true,
      activeHalf: currentHalf,
    };
  }

  // Filtre penceresi geçtiyse artık kontrol etme
  if (currentMinute > filterWindowEnd) {
    return {
      isGreenActive: false,
      showGoalAnimation: false,
      greenActivatedAtMinute: 0,
      goalScoredAfterGreen: previousState.goalScoredAfterGreen,
      activeHalf: currentHalf,
    };
  }

  // Yeşil zaten yanıyorsa
  if (previousState.isGreenActive) {
    if (goalScored && !previousState.goalScoredAfterGreen) {
      return {
        isGreenActive: false,
        showGoalAnimation: true,
        greenActivatedAtMinute: previousState.greenActivatedAtMinute,
        goalScoredAfterGreen: true,
        activeHalf: currentHalf,
      };
    }
    return previousState;
  }

  // Yeşil yanmıyorsa ve filtre penceresindeysek kontrol et
  if (currentMinute >= filterMinute && currentMinute <= filterWindowEnd) {
    const oneTeamPasses = doesAnyTeamPassAllFilters(match, currentFilters);
    if (oneTeamPasses) {
      return {
        isGreenActive: true,
        showGoalAnimation: false,
        greenActivatedAtMinute: currentMinute,
        goalScoredAfterGreen: false,
        activeHalf: currentHalf,
      };
    }
  }

  return previousState;
};

const MatchContext = createContext<MatchContextType | undefined>(undefined);

export const MatchProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [groupedMatches, setGroupedMatches] = useState<LeagueGroup[]>([]);
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });
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

  // previousScores state'i - gol kontrolü için
  const [previousScores, setPreviousScores] = useState<
    Record<number, { home: number; away: number }>
  >({});

  const [trackedMatchIds, setTrackedMatchIds] = useState<number[]>(() => {
    const saved = localStorage.getItem("tracked_matches");
    return saved ? JSON.parse(saved) : [];
  });

  // Takip listesini güncelleme fonksiyonu
  const toggleTrackMatch = useCallback((matchId: number) => {
    setTrackedMatchIds((prev) => {
      const newList = prev.includes(matchId)
        ? prev.filter((id) => id !== matchId)
        : [...prev, matchId];

      // localStorage'a kaydet
      localStorage.setItem("tracked_matches", JSON.stringify(newList));

      // WebSocket'e bildir
      mockDataService.updateTrackedMatches(newList);

      return newList;
    });
  }, []);

  const loadDateList = useCallback(async () => {
    try {
      const dates = await mockDataService.getDateList();
      setDateList(dates);
    } catch (err) {
      console.error("Failed to load date list:", err);
    }
  }, []);

  // Refresh fonksiyonu

  // 🔴 DÜZELTİLDİ: Sonsuz döngüyü önlemek için updateGreenStates useCallback içinde ama bağımlılıklar optimize edildi
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
  }, [
    groupedMatches,
    firstHalfFilters,
    secondHalfFilters,
    previousScores,
    greenStates,
  ]);

  // 🔴 DÜZELTİLDİ: useEffect sadece groupedMatches ve filtreler değiştiğinde çalışır
  useEffect(() => {
    updateGreenStates();
  }, [groupedMatches, firstHalfFilters, secondHalfFilters]); // ← updateGreenStates bağımlılıktan çıkarıldı!

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

  useEffect(() => {
    const handleMatchRemoved = (event: CustomEvent) => {
      const { matchId } = event.detail;
      setTrackedMatchIds((prev) => prev.filter((id) => id !== matchId));
    };

    window.addEventListener(
      "match-removed",
      handleMatchRemoved as EventListener,
    );

    return () => {
      window.removeEventListener(
        "match-removed",
        handleMatchRemoved as EventListener,
      );
    };
  }, []);

  const loadMatches = useCallback(async () => {
    try {
      setLoading(true);
      const grouped = await mockDataService.getGroupedMatches(selectedDate);
      const live = await mockDataService.getLiveMatches();

      // 🔴 Canlı maçları groupedMatches'e ekle (bugünse)
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

      setGroupedMatches(finalGrouped);
      setLiveMatches(live);
      setError(null);
    } catch (err) {
      setError("Veriler yüklenirken bir hata oluştu");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  const refreshMatches = useCallback(async () => {
    await loadMatches();
  }, [loadMatches]);

  const handleSetSelectedDate = useCallback((date: string) => {
    setSelectedDate(date);
    mockDataService.setSelectedDate(date);
  }, []);

  const updateFirstHalfFilters = useCallback((values: FilterStats) => {
    console.log("updateFirstHalfFilters çağrıldı, gelen değer:", values);
    setFirstHalfFilters(values);
    saveFirstHalfFilters(values);
  }, []);

  const updateSecondHalfFilters = useCallback((values: FilterStats) => {
    console.log("updateSecondHalfFilters çağrıldı, gelen değer:", values);
    setSecondHalfFilters(values);
    saveSecondHalfFilters(values);
  }, []);

  const clearFilters = useCallback(() => {
    setFirstHalfFilters(defaultFirstHalfFilters);
    setSecondHalfFilters(defaultSecondHalfFilters);
    saveFirstHalfFilters(defaultFirstHalfFilters);
    saveSecondHalfFilters(defaultSecondHalfFilters);
  }, []);

  const isMatchMatchingFilters = useCallback(
    (match: Match): boolean => {
      const state = greenStates[match.id];
      return state?.isGreenActive || false;
    },
    [greenStates],
  );

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

  const startLiveDataSimulation = useCallback(() => {
    if (cleanupSocket) {
      cleanupSocket();
    }

    const cleanup = mockDataService.startLiveDataSimulation(
      (updatedMatches) => {
        setGroupedMatches((prev) =>
          prev.map((group) => ({
            ...group,
            matches: group.matches.map((m) => {
              const updated = updatedMatches.find((u) => u.id === m.id);
              if (updated) {
                const mergedStats = updated.stats
                  ? {
                      ...m.stats,
                      ...updated.stats,
                      home: updated.stats.home
                        ? ({
                            ...(m.stats?.home || {}),
                            ...updated.stats.home,
                          } as any)
                        : m.stats?.home,
                      away: updated.stats.away
                        ? ({
                            ...(m.stats?.away || {}),
                            ...updated.stats.away,
                          } as any)
                        : m.stats?.away,
                    }
                  : m.stats;

                return {
                  ...m,
                  ...updated,
                  homeTeam: m.homeTeam,
                  awayTeam: m.awayTeam,
                  stats: mergedStats,
                } as Match;
              }
              return m;
            }),
          })),
        );

        setLiveMatches((prev) =>
          prev.map((m) => {
            const updated = updatedMatches.find((u) => u.id === m.id);
            if (updated) {
              const mergedStats = updated.stats
                ? {
                    ...m.stats,
                    ...updated.stats,
                    home: updated.stats.home
                      ? ({
                          ...(m.stats?.home || {}),
                          ...updated.stats.home,
                        } as any)
                      : m.stats?.home,
                    away: updated.stats.away
                      ? ({
                          ...(m.stats?.away || {}),
                          ...updated.stats.away,
                        } as any)
                      : m.stats?.away,
                  }
                : m.stats;

              return {
                ...m,
                ...updated,
                homeTeam: m.homeTeam,
                awayTeam: m.awayTeam,
                stats: mergedStats,
              } as Match;
            }
            return m;
          }),
        );
      },
    );

    setCleanupSocket(() => cleanup);
    setIsSocketConnected(true);

    return cleanup;
  }, [cleanupSocket]);

  useEffect(() => {
    loadDateList();
    loadMatches();
    const cleanup = startLiveDataSimulation();

    return () => {
      if (cleanup) {
        cleanup();
      }
      if (cleanupSocket) {
        cleanupSocket();
      }
      mockDataService.stopLiveDataSimulation();
    };
  }, [selectedDate]);

  return (
    <MatchContext.Provider
      value={{
        matches: [],
        liveMatches,
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
  if (!context) {
    throw new Error("useMatches must be used within MatchProvider");
  }
  return context;
};
