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

  // Dakika ve yarı bilgisini match.minute'ten al
  const currentMinute = match.minute || 0;
  const currentHalf = currentMinute <= 45 ? "first" : "second";

  // Çubuk uzunluğunu hesapla (max değere göre oran)
  const calculateBarWidth = (homeValue: number, awayValue: number) => {
    const max = Math.max(homeValue, awayValue, 1); // Max değer (en az 1)
    return {
      homeWidth: (homeValue / max) * 100,
      awayWidth: (awayValue / max) * 100,
    };
  };

  const statItems = [
    {
      label: "Topla Oynama",
      homeValue: stats.home.possession,
      awayValue: stats.away.possession,
      unit: "%",
      getBarWidth: () =>
        calculateBarWidth(stats.home.possession, stats.away.possession),
    },
    {
      label: "Toplam Şut",
      homeValue: stats.home.shots,
      awayValue: stats.away.shots,
      unit: "",
      getBarWidth: () => calculateBarWidth(stats.home.shots, stats.away.shots),
    },
    {
      label: "İsabetli Şut",
      homeValue: stats.home.accurateShots,
      awayValue: stats.away.accurateShots,
      unit: "",
      getBarWidth: () =>
        calculateBarWidth(stats.home.accurateShots, stats.away.accurateShots),
    },
    {
      label: "Tehlikeli Atak",
      homeValue: stats.home.dangerousAttacks,
      awayValue: stats.away.dangerousAttacks,
      unit: "",
      getBarWidth: () =>
        calculateBarWidth(
          stats.home.dangerousAttacks,
          stats.away.dangerousAttacks,
        ),
    },
    {
      label: "Korner",
      homeValue: stats.home.corners,
      awayValue: stats.away.corners,
      unit: "",
      getBarWidth: () =>
        calculateBarWidth(stats.home.corners, stats.away.corners),
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
          <span className="match-duration">{currentMinute}'</span>
          <span className="match-half">
            {currentHalf === "first" ? "İlk Yarı" : "İkinci Yarı"}
          </span>
        </div>

        {/* İstatistikler - SADECE DEĞERLER VE ÇUBUKLAR */}
        <div className="stats-list">
          {statItems.map((item, idx) => {
            const { homeWidth, awayWidth } = item.getBarWidth();

            return (
              <div key={idx} className="stats-list-item">
                <div className="stats-label">{item.label}</div>
                <div className="stats-values-row">
                  <span className="stats-value home-value">
                    {item.homeValue}
                    {item.unit}
                  </span>
                  <div className="stats-bar-wrapper">
                    <div className="stats-bar-container">
                      <div
                        className="stats-bar home-stats-bar"
                        style={{ width: `${homeWidth}%` }}
                      />
                      <div
                        className="stats-bar away-stats-bar"
                        style={{ width: `${awayWidth}%` }}
                      />
                    </div>
                  </div>
                  <span className="stats-value away-value">
                    {item.awayValue}
                    {item.unit}
                  </span>
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
