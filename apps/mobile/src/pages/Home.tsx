import React, { useState, useEffect } from "react";
import {
  IonPage,
  IonContent,
  IonButton,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonBadge,
  IonMenuButton,
} from "@ionic/react";
import { calendarOutline, starOutline } from "ionicons/icons";
import { useMatches } from "../context/MatchContext";
import MatchStatsModal from "../components/MatchStatsModal";
import { getCountryInfo } from "../utils/countries";

// Takım logo renkleri
const teamColors: Record<string, string> = {
  WOL: "#eab308",
  RAY: "#ef4444",
  LEV: "#3b82f6",
  CRE: "#9ca3af",
  FIO: "#9333ea",
  POR: "#1d4ed8",
  DER: "#6b7280",
  GAL: "#eab308",
  FEN: "#3b82f6",
  BJK: "#000000",
  TS: "#ef4444",
  RMA: "#ffffff",
  BAR: "#ef4444",
  MNC: "#6b7280",
  LIV: "#ef4444",
  JUV: "#000000",
  ACM: "#ef4444",
  BAY: "#ef4444",
  PSG: "#ef4444",
};

const TeamLogo: React.FC<{ team: any }> = ({ team }) => {
  const [imageError, setImageError] = useState(false);

  // ⭐ Logo URL'sini oluştur (eğer ID ise)
  const getLogoUrl = (logo: string): string => {
    if (logo.startsWith("http")) return logo;
    // ID ise URL'ye çevir
    return `https://media.api-sports.io/football/teams/${logo}.png`;
  };

  const logoUrl = getLogoUrl(team.logo);

  if (!imageError) {
    return (
      <img
        src={logoUrl}
        alt={team.fullName}
        className="team-logo-img"
        onError={() => setImageError(true)}
        style={{ width: "32px", height: "32px", objectFit: "contain" }}
      />
    );
  }

  // Fallback: renkli kutu
  const teamCode =
    team.shortName || team.fullName.substring(0, 3).toUpperCase();
  const color = teamColors[teamCode] || "#6b7280";

  return (
    <div className="team-logo" style={{ backgroundColor: color }}>
      {teamCode.substring(0, 2)}
    </div>
  );
};

// Canlı Saat Bileşeni
const LiveClock: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="live-clock">
      <span className="live-clock-icon">🕐</span>
      <span className="live-clock-time">{formatTime(currentTime)}</span>
    </div>
  );
};

const MatchCard: React.FC<{ match: any }> = ({ match }) => {
  const {
    getMatchGreenState,
    firstHalfFilters,
    secondHalfFilters,
    trackedMatchIds,
    toggleTrackMatch,
  } = useMatches();
  const [showModal, setShowModal] = useState(false);
  const [hasEverReceivedData, setHasEverReceivedData] = useState(false); // ← isim değişti

  const greenState = getMatchGreenState(match.id);
  const currentMinute = match.stats?.matchDuration || 0;
  const isFirstHalf = currentMinute <= 45;
  const currentFilters = isFirstHalf ? firstHalfFilters : secondHalfFilters;
  const isTracked = trackedMatchIds.includes(match.id);

  // Stats var mı? (undefined veya null değilse)
  const hasStats = match.stats !== undefined && match.stats !== null;

  // Veri geldi mi? (stats olsun veya olmasın, API cevap verdi mi?)
  // Bunu anlamak için match'in herhangi bir canlı verisi var mı kontrol et
  const hasReceivedData =
    match.isLive && (match.minute !== undefined || match.score !== undefined);

  useEffect(() => {
    if (hasReceivedData && !hasEverReceivedData) {
      setHasEverReceivedData(true);
    }
  }, [hasReceivedData, hasEverReceivedData]);

  // Sadece veri geldikten SONRA ve stats yoksa hata göster
  const showNoStats =
    isTracked && hasEverReceivedData && !hasStats && match.isLive;

  const hasActiveFilters =
    currentFilters.totalPlay !== 50 ||
    currentFilters.totalShot !== 1 ||
    currentFilters.accurateShot !== 1 ||
    currentFilters.dangerousAttack !== 1 ||
    currentFilters.totalCorner !== 1 ||
    currentFilters.duration !== 1;

  const getFilterBoxContent = () => {
    if (showNoStats) {
      return (
        <div className="stats-error-box">
          <span className="stats-error-icon">⚠️</span>
          <span className="stats-error-text">İstatistik bulunamadı</span>
        </div>
      );
    }
    if (!match.isLive) {
      return (
        <div className="empty-box">
          <span>Maç başlamadı</span>
        </div>
      );
    }
    if (!hasActiveFilters) {
      return (
        <div className="empty-box">
          <span>Filtre seçiniz</span>
        </div>
      );
    }
    if (greenState.showGoalAnimation) {
      return (
        <div className="goal-animation-container">
          <span className="goal-text">⚽ GOL ⚽</span>
        </div>
      );
    }
    if (greenState.isGreenActive) {
      return <div className="green-active-box"></div>;
    }
    return (
      <div className="empty-box">
        <span>Filtre değerleri tutmuyor</span>
      </div>
    );
  };

  const getBoxClassName = () => {
    if (showNoStats) return "filter-value-box stats-error";
    if (!match.isLive || !hasActiveFilters) return "filter-value-box";
    if (greenState.showGoalAnimation) return "filter-value-box goal-animation";
    if (greenState.isGreenActive) return "filter-value-box active";
    return "filter-value-box";
  };

  const handleStarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleTrackMatch(match.id);
  };

  const countryInfo = match.flag ? getCountryInfo(match.flag) : null;

  return (
    <>
      <div
        className="match-card-wrapper"
        onClick={() => match.isLive && match.stats && setShowModal(true)}
        style={{ cursor: match.isLive && match.stats ? "pointer" : "default" }}
      >
        {match.league && (
          <div className="league-header">
            <div className="league-info">
              <IonIcon icon={starOutline} className="star-icon" />
              {countryInfo && (
                <span className="league-flag">{countryInfo.flag}</span>
              )}
              <span className="league-name">{match.league}</span>
            </div>
            <div className="league-odds">
              <span>{match.odds["1"]}</span>
              <span>{match.odds.X}</span>
              <span>{match.odds["2"]}</span>
            </div>
          </div>
        )}

        <div className={`match-card ${match.league ? "with-league" : ""}`}>
          <div className="time-column">
            {match.isLive && (
              <>
                <IonIcon
                  icon={starOutline}
                  className={`star-icon ${isTracked ? "active" : ""}`}
                  onClick={handleStarClick}
                />
                <div className="live-dot"></div>
                <div className="live-minute">{match.minute || 45}'</div>
              </>
            )}
            {!match.isLive && <span className="match-time">{match.time}</span>}
          </div>

          <div className="teams-column">
            <div className="team-row">
              <TeamLogo team={match.homeTeam} />
              <span className="team-name">
                {match.homeTeam.shortName || match.homeTeam.name}
              </span>
              {match.score && (
                <span className="team-score">{match.score.home}</span>
              )}
            </div>
            <div className="team-row">
              <TeamLogo team={match.awayTeam} />
              <span className="team-name">
                {match.awayTeam.shortName || match.awayTeam.name}
              </span>
              {match.score && (
                <span className="team-score">{match.score.away}</span>
              )}
            </div>
          </div>

          <div className={getBoxClassName()}>{getFilterBoxContent()}</div>
        </div>

        {match.league && (
          <div className="progress-bar">
            <div className="progress-yellow"></div>
            <div className="progress-red"></div>
            <div className="progress-red"></div>
          </div>
        )}
      </div>

      <MatchStatsModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        match={match}
      />
    </>
  );
};
const Home: React.FC = () => {
  const {
    groupedMatches,
    loading,
    refreshMatches,
    selectedDate,
    setSelectedDate,
    dateList,
    trackedMatchIds,
  } = useMatches();

  const [showOnlyLive, setShowOnlyLive] = useState(false);
  const [showOnlyTracked, setShowOnlyTracked] = useState(false); // ← YENİ

  const handleRefresh = async (event: CustomEvent) => {
    await refreshMatches();
    event.detail.complete();
  };

  const liveCount = groupedMatches.reduce((total, group) => {
    return total + group.matches.filter((m) => m.isLive).length;
  }, 0);

  const trackedCount = groupedMatches.reduce((total, group) => {
    return (
      total + group.matches.filter((m) => trackedMatchIds.includes(m.id)).length
    );
  }, 0);

  const getFilteredMatches = () => {
    if (showOnlyLive && showOnlyTracked) {
      // Hem canlı hem takip edilen
      return groupedMatches
        .map((group) => ({
          ...group,
          matches: group.matches.filter(
            (m) => m.isLive && trackedMatchIds.includes(m.id),
          ),
        }))
        .filter((group) => group.matches.length > 0);
    } else if (showOnlyLive) {
      // Sadece canlı
      return groupedMatches
        .map((group) => ({
          ...group,
          matches: group.matches.filter((m) => m.isLive),
        }))
        .filter((group) => group.matches.length > 0);
    } else if (showOnlyTracked) {
      // Sadece takip edilen
      return groupedMatches
        .map((group) => ({
          ...group,
          matches: group.matches.filter((m) => trackedMatchIds.includes(m.id)),
        }))
        .filter((group) => group.matches.length > 0);
    }
    return groupedMatches;
  };

  const displayMatches = getFilteredMatches();

  const toggleLiveFilter = () => {
    setShowOnlyLive(!showOnlyLive);
  };

  const toggleTrackedFilter = () => {
    setShowOnlyTracked(!showOnlyTracked);
  };

  return (
    <IonPage className="matches-page">
      {/* Header - Sadece menü butonu */}
      <div className="custom-header">
        <div className="main-header">
          <IonMenuButton className="menu-button" />
        </div>
      </div>

      <IonContent className="matches-content">
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="date-selector">
          <div className="dates-scroll">
            {dateList.map((d) => (
              <button
                key={d.date}
                onClick={() => {
                  setSelectedDate(d.date);
                  setShowOnlyLive(false);
                }}
                className={`date-item ${selectedDate === d.date ? "active" : ""}`}
              >
                <span className="date-day">{d.dayName}</span>
                <span className="date-number">{d.dayNumber}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Live Butonu ve Saat - Aynı satırda */}
        <div className="live-row">
          <button
            className={`live-button ${showOnlyLive ? "active" : ""}`}
            onClick={toggleLiveFilter}
          >
            <span className="live-button-text">Canlı</span>
            <IonBadge className="live-badge" color="danger">
              {liveCount}
            </IonBadge>
          </button>
          <button
            className={`filter-button tracked-button ${showOnlyTracked ? "active" : ""}`}
            onClick={toggleTrackedFilter}
          >
            <span className="filter-button-text">Takip</span>
            <IonBadge className="filter-badge" color="warning">
              {trackedCount}
            </IonBadge>
          </button>
          <LiveClock />
        </div>

        {loading && (
          <div className="loading-container">
            <IonSpinner name="crescent" />
            <p>Maçlar yükleniyor...</p>
          </div>
        )}

        {!loading && (
          <div className="matches-list">
            {displayMatches.length === 0 ? (
              <div className="no-matches">
                {showOnlyLive ? (
                  <p>🔴 Şu anda canlı maç bulunmuyor</p>
                ) : (
                  <p>Bu tarihte maç bulunamadı</p>
                )}
              </div>
            ) : (
              displayMatches.map((group, idx) => (
                <div key={idx}>
                  {group.matches.map((match) => (
                    <MatchCard key={match.id} match={match} />
                  ))}
                </div>
              ))
            )}
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Home;
