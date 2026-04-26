import { io, Socket } from "socket.io-client";

// Interface'ler (Aynen mock-data'daki gibi)
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
  score?: { home: number; away: number };
  minute?: number;
  date?: string;
  stats?: MatchStats;
}

export interface LeagueGroup {
  league: string;
  flag: string;
  matches: Match[];
}

class ApiService {
  private baseURL = "http://localhost:3001";
  private socket: Socket | null = null;
  private updateCallbacks: ((matches: Match[]) => void)[] = [];

  // ============ REST API METHODS ============

  updateTrackedMatches(matchIds: number[]) {
    if (this.socket?.connected) {
      this.socket.emit("track-matches", { matchIds });
      console.log("🔴 track-matches gönderildi:", matchIds);
    } else {
      console.log("⚠️ WebSocket bağlı değil, track-matches gönderilemedi");
    }
  }

  async getMatchesByDate(date?: string): Promise<Match[]> {
    const targetDate = date || new Date().toISOString().split("T")[0];
    const response = await fetch(
      `${this.baseURL}/api/fixtures/date/${targetDate}`,
    );
    const result = await response.json();

    if (!result.success) throw new Error(result.message);
    return result.data.matches;
  }

  async getTodayMatches(): Promise<Match[]> {
    return this.getMatchesByDate(new Date().toISOString().split("T")[0]);
  }

  async getLiveMatches(): Promise<Match[]> {
    const response = await fetch(`${this.baseURL}/api/fixtures/live`);
    const result = await response.json();

    console.log("🔴 API /live response:", result);
    console.log("🔴 Matches count:", result.data?.matches?.length);

    if (!result.success) throw new Error(result.message);
    return result.data.matches;
  }

  async getGroupedMatches(date?: string): Promise<LeagueGroup[]> {
    const targetDate = date || new Date().toISOString().split("T")[0];
    const response = await fetch(
      `${this.baseURL}/api/fixtures/date/${targetDate}`,
    );
    const result = await response.json();

    if (!result.success) throw new Error(result.message);
    return result.data.groupedByLeague;
  }

  async getDateList(): Promise<
    { date: string; dayName: string; dayNumber: number }[]
  > {
    const response = await fetch(`${this.baseURL}/api/fixtures/dates`);
    const result = await response.json();
    return result.success ? result.data : [];
  }

  async filterMatches(filters: {
    date?: string;
    league?: string;
    isLive?: boolean;
    searchText?: string;
  }): Promise<Match[]> {
    const params = new URLSearchParams();
    if (filters.date) params.append("date", filters.date);
    if (filters.league) params.append("league", filters.league);
    if (filters.isLive !== undefined)
      params.append("isLive", String(filters.isLive));
    if (filters.searchText) params.append("searchText", filters.searchText);

    const response = await fetch(
      `${this.baseURL}/api/fixtures/filter?${params}`,
    );
    const result = await response.json();

    if (!result.success) throw new Error(result.message);
    return result.data.items;
  }

  setSelectedDate(date: string): void {
    localStorage.setItem("selected_date", date);
  }

  // ============ TRACKED MATCHES STORAGE ============

  getTrackedMatchesFromStorage(): number[] {
    const saved = localStorage.getItem("tracked_matches");
    return saved ? JSON.parse(saved) : [];
  }

  // ============ WEBSOCKET METHODS (Socket.io) ============

  startLiveDataSimulation(
    callback: (updatedMatches: Match[]) => void,
  ): () => void {
    this.updateCallbacks.push(callback);

    if (!this.socket) {
      this.socket = io(`${this.baseURL}/live`, {
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      this.socket.on("match-update", (updates: any) => {
        // Eğer array değilse, array yap
        const matchesArray = Array.isArray(updates) ? updates : [updates];
        const hasStats = !!updates.stats;
        if (hasStats) {
          console.log("Gelen güncelleme:", {
            id: updates.id,
            hasStats: !!updates.stats,
            minute: updates.minute,
            stats: updates.stats,
          });
        }

        this.updateCallbacks.forEach((cb) => cb(matchesArray));
      });

      this.socket.on("initial-live-matches", (matches: Match[]) => {
        console.log("🔴 initial-live-matches ALINDI!", matches?.length, "maç");
        this.updateCallbacks.forEach((cb) => cb(matches));
      });

      this.socket.on("connect", async () => {
        console.log("🔌 WebSocket connected");

        // 🔴 Kullanıcının takip etmek istediği maçları backend'e bildir
        // Bu listede canlı maçların ID'leri olacak
        const trackedMatchIds = this.getTrackedMatchesFromStorage(); // localStorage'dan al
        if (trackedMatchIds.length > 0) {
          this.socket?.emit("track-matches", { matchIds: trackedMatchIds });
        }
      });

      this.socket.on("disconnect", () => {
        console.log("🔌 WebSocket disconnected");
      });

      this.socket.on("connect_error", (error) => {
        console.error("WebSocket connection error:", error);
      });
      this.socket.on("match-removed", (data: { matchId: number }) => {
        console.log(`❌ Maç ${data.matchId} canlılığını kaybetti`);

        // Context'teki trackedMatchIds'ten çıkar
        const stored = localStorage.getItem("tracked_matches");
        if (stored) {
          const tracked = JSON.parse(stored);
          const newTracked = tracked.filter(
            (id: number) => id !== data.matchId,
          );
          localStorage.setItem("tracked_matches", JSON.stringify(newTracked));

          // Context'i güncellemek için event fırlat
          window.dispatchEvent(
            new CustomEvent("match-removed", {
              detail: { matchId: data.matchId },
            }),
          );
        }
      });
    }

    return () => {
      const index = this.updateCallbacks.indexOf(callback);
      if (index !== -1) this.updateCallbacks.splice(index, 1);

      if (this.updateCallbacks.length === 0 && this.socket) {
        this.socket.disconnect();
        this.socket = null;
      }
    };
  }

  stopLiveDataSimulation(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.updateCallbacks = [];
  }
}

// MockDataService ile AYNI isimde export et (Frontend'de hiçbir import değişmiyor!)
export const mockDataService = new ApiService();
