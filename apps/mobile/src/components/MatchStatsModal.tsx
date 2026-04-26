import React from "react";
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonButtons,
} from "@ionic/react";
import { closeOutline } from "ionicons/icons";
import "./MatchStatsModal.css";

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

interface MatchStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: any;
}

const MatchStatsModal: React.FC<MatchStatsModalProps> = ({
  isOpen,
  onClose,
  match,
}) => {
  if (!match || !match.stats) return null;

  const homeTeam = match.homeTeam;
  const awayTeam = match.awayTeam;
  const stats = match.stats;

  // YÜZDE HESAPLAMA: Toplam üzerinden oran
  const calculatePercentage = (homeValue: number, awayValue: number) => {
    const total = homeValue + awayValue;
    if (total === 0) return { homePercent: 50, awayPercent: 50 };
    return {
      homePercent: (homeValue / total) * 100,
      awayPercent: (awayValue / total) * 100,
    };
  };

  const statItems = [
    {
      label: "Topla Oynama",
      homeValue: stats.home.possession,
      awayValue: stats.away.possession,
      unit: "%",
      getPercent: () =>
        calculatePercentage(stats.home.possession, stats.away.possession),
    },
    {
      label: "Toplam Şut",
      homeValue: stats.home.shots,
      awayValue: stats.away.shots,
      unit: "",
      getPercent: () => calculatePercentage(stats.home.shots, stats.away.shots),
    },
    {
      label: "İsabetli Şut",
      homeValue: stats.home.accurateShots,
      awayValue: stats.away.accurateShots,
      unit: "",
      getPercent: () =>
        calculatePercentage(stats.home.accurateShots, stats.away.accurateShots),
    },
    {
      label: "Tehlikeli Atak",
      homeValue: stats.home.dangerousAttacks,
      awayValue: stats.away.dangerousAttacks,
      unit: "",
      getPercent: () =>
        calculatePercentage(
          stats.home.dangerousAttacks,
          stats.away.dangerousAttacks,
        ),
    },
    {
      label: "Korner",
      homeValue: stats.home.corners,
      awayValue: stats.away.corners,
      unit: "",
      getPercent: () =>
        calculatePercentage(stats.home.corners, stats.away.corners),
    },
  ];

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose} className="stats-modal">
      <IonHeader>
        <IonToolbar className="stats-modal-header">
          <IonTitle>Maç İstatistikleri</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onClose}>
              <IonIcon icon={closeOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="stats-modal-content">
        {/* Takım Başlıkları */}
        <div className="stats-modal-teams">
          <div className="stats-team home-team">
            <div
              className="team-logo-large"
              style={{
                backgroundColor: teamColors[homeTeam.logo] || "#6b7280",
              }}
            >
              {homeTeam.logo.slice(0, 2)}
            </div>
            <span className="team-name-large">
              {homeTeam.shortName || homeTeam.name}
            </span>
            {match.score && (
              <span className="team-score-large">{match.score.home}</span>
            )}
          </div>
          <div className="stats-vs">VS</div>
          <div className="stats-team away-team">
            {match.score && (
              <span className="team-score-large">{match.score.away}</span>
            )}
            <span className="team-name-large">
              {awayTeam.shortName || awayTeam.name}
            </span>
            <div
              className="team-logo-large"
              style={{
                backgroundColor: teamColors[awayTeam.logo] || "#6b7280",
              }}
            >
              {awayTeam.logo.slice(0, 2)}
            </div>
          </div>
        </div>

        {/* Maç Bilgisi */}
        <div className="stats-match-info">
          <span className="match-duration">{stats.matchDuration}'</span>
          <span className="match-half">
            {stats.currentHalf === "first" ? "İlk Yarı" : "İkinci Yarı"}
          </span>
        </div>

        {/* İstatistikler - YENİ PROGRESS BAR MANTIĞI */}
        <div className="stats-list">
          {statItems.map((item, idx) => {
            const { homePercent, awayPercent } = item.getPercent();

            return (
              <div key={idx} className="stats-list-item">
                <div className="stats-label">{item.label}</div>
                <div className="stats-values">
                  <span className="home-value">
                    {item.homeValue}
                    {item.unit}
                  </span>
                  <span className="away-value">
                    {item.awayValue}
                    {item.unit}
                  </span>
                </div>
                <div className="stats-bar-container">
                  <div
                    className="stats-bar home-stats-bar"
                    style={{ width: `${homePercent}%` }}
                  >
                    <span className="stats-percent">
                      {Math.round(homePercent)}%
                    </span>
                  </div>
                  <div
                    className="stats-bar away-stats-bar"
                    style={{ width: `${awayPercent}%` }}
                  >
                    <span className="stats-percent">
                      {Math.round(awayPercent)}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="stats-legend">
          <div className="legend-item">
            <div className="legend-color home-legend"></div>
            <span>{homeTeam.shortName || homeTeam.name}</span>
          </div>
          <div className="legend-item">
            <div className="legend-color away-legend"></div>
            <span>{awayTeam.shortName || awayTeam.name}</span>
          </div>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default MatchStatsModal;
