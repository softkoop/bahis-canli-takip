import React, { useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonRange,
  IonButton,
  IonIcon,
  IonSegment,
  IonSegmentButton,
  IonCard,
  IonCardContent,
  IonChip,
  IonText,
  IonToast,
  IonLabel,
  IonButtons,
  IonMenuButton,
} from "@ionic/react";
import {
  footballOutline,
  refreshOutline,
  saveOutline,
  pulseOutline,
  peopleOutline,
  alertCircleOutline,
  timeOutline,
} from "ionicons/icons";
import { useMatches, FilterStats } from "../context/MatchContext";

const defaultFilters: FilterStats = {
  totalPlay: 50,
  totalShot: 1,
  accurateShot: 1,
  dangerousAttack: 1,
  totalCorner: 1,
  duration: 1,
  soundEnabled: true,
};

const Stats: React.FC = () => {
  const {
    firstHalfFilters,
    secondHalfFilters,
    updateFirstHalfFilters,
    updateSecondHalfFilters,
    clearFilters,
  } = useMatches();

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [selectedHalf, setSelectedHalf] = useState<"first" | "second">("first");

  // Yerel state'ler
  const [localFirstHalf, setLocalFirstHalf] =
    useState<FilterStats>(firstHalfFilters);
  const [localSecondHalf, setLocalSecondHalf] =
    useState<FilterStats>(secondHalfFilters);

  const currentLocalFilters =
    selectedHalf === "first" ? localFirstHalf : localSecondHalf;

  const handleFilterChange = (key: keyof FilterStats, value: any) => {
    if (selectedHalf === "first") {
      setLocalFirstHalf({ ...localFirstHalf, [key]: value });
    } else {
      setLocalSecondHalf({ ...localSecondHalf, [key]: value });
    }
  };

  const handleApplyFilters = () => {
    if (selectedHalf === "first") {
      updateFirstHalfFilters(localFirstHalf);
      setToastMessage("1. Yarı filtreleri uygulandı");
    } else {
      updateSecondHalfFilters(localSecondHalf);
      setToastMessage("2. Yarı filtreleri uygulandı");
    }
    setShowToast(true);
  };

  const handleResetFilters = () => {
    if (selectedHalf === "first") {
      setLocalFirstHalf(defaultFilters);
      updateFirstHalfFilters(defaultFilters);
      setToastMessage("1. Yarı filtreleri sıfırlandı");
    } else {
      setLocalSecondHalf(defaultFilters);
      updateSecondHalfFilters(defaultFilters);
      setToastMessage("2. Yarı filtreleri sıfırlandı");
    }
    setShowToast(true);
  };

  const handleClearAllFilters = () => {
    setLocalFirstHalf(defaultFilters);
    setLocalSecondHalf(defaultFilters);
    clearFilters();
    setToastMessage("Tüm filtreler sıfırlandı");
    setShowToast(true);
  };

  return (
    <IonPage className="stats-page">
      <IonHeader>
        <IonToolbar className="stats-header">
          <IonButtons slot="start">
            <IonMenuButton className="menu-button-dark" />
          </IonButtons>
          <IonTitle>İstatistik Filtreleri</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleClearAllFilters} color="danger">
              <IonIcon icon={refreshOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="stats-content">
        {/* Yarı Seçimi Segmenti */}
        <IonCard className="stats-card">
          <IonCardContent>
            <div className="filter-title">
              <IonIcon icon={timeOutline} />
              <IonLabel>Yarı Seçimi</IonLabel>
            </div>
            <IonSegment
              value={selectedHalf}
              onIonChange={(e) =>
                setSelectedHalf(e.detail.value as "first" | "second")
              }
              className="half-segment"
            >
              <IonSegmentButton value="first">
                <IonLabel>1. Yarı</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="second">
                <IonLabel>2. Yarı</IonLabel>
              </IonSegmentButton>
            </IonSegment>
          </IonCardContent>
        </IonCard>

        {/* Topla Oynama */}
        <IonCard className="stats-card">
          <IonCardContent>
            <div className="filter-title">
              <IonIcon icon={footballOutline} />
              <IonLabel>Topla Oynama Oranı (%)</IonLabel>
            </div>
            <IonRange
              min={0}
              max={100}
              step={1}
              value={currentLocalFilters.totalPlay}
              onIonChange={(e) =>
                handleFilterChange("totalPlay", e.detail.value)
              }
              className="filter-range"
            >
              <div slot="start" className="range-min">
                0%
              </div>
              <div slot="end" className="range-max">
                100%
              </div>
            </IonRange>
            <div className="current-value">
              <span className="current-value-label">Seçilen Değer:</span>
              <span className="current-value-number">
                {currentLocalFilters.totalPlay}%
              </span>
            </div>
          </IonCardContent>
        </IonCard>

        {/* Toplam Şut */}
        <IonCard className="stats-card">
          <IonCardContent>
            <div className="filter-title">
              <IonIcon icon={footballOutline} />
              <IonLabel>Toplam Şut</IonLabel>
            </div>
            <IonRange
              min={1}
              max={15}
              step={1}
              value={currentLocalFilters.totalShot}
              onIonChange={(e) =>
                handleFilterChange("totalShot", e.detail.value)
              }
              className="filter-range"
            >
              <div slot="start" className="range-min">
                1
              </div>
              <div slot="end" className="range-max">
                15
              </div>
            </IonRange>
            <div className="current-value">
              <span className="current-value-label">Seçilen Değer:</span>
              <span className="current-value-number">
                {currentLocalFilters.totalShot}
              </span>
            </div>
          </IonCardContent>
        </IonCard>

        {/* İsabetli Şut */}
        <IonCard className="stats-card">
          <IonCardContent>
            <div className="filter-title">
              <IonIcon icon={footballOutline} />
              <IonLabel>İsabetli Şut</IonLabel>
            </div>
            <IonRange
              min={1}
              max={10}
              step={1}
              value={currentLocalFilters.accurateShot}
              onIonChange={(e) =>
                handleFilterChange("accurateShot", e.detail.value)
              }
              className="filter-range"
            >
              <div slot="start" className="range-min">
                1
              </div>
              <div slot="end" className="range-max">
                10
              </div>
            </IonRange>
            <div className="current-value">
              <span className="current-value-label">Seçilen Değer:</span>
              <span className="current-value-number">
                {currentLocalFilters.accurateShot}
              </span>
            </div>
          </IonCardContent>
        </IonCard>

        {/* Tehlikeli Atak */}
        <IonCard className="stats-card">
          <IonCardContent>
            <div className="filter-title">
              <IonIcon icon={alertCircleOutline} />
              <IonLabel>Tehlikeli Atak</IonLabel>
            </div>
            <IonRange
              min={1}
              max={50}
              step={1}
              value={currentLocalFilters.dangerousAttack}
              onIonChange={(e) =>
                handleFilterChange("dangerousAttack", e.detail.value)
              }
              className="filter-range"
            >
              <div slot="start" className="range-min">
                1
              </div>
              <div slot="end" className="range-max">
                50
              </div>
            </IonRange>
            <div className="current-value">
              <span className="current-value-label">Seçilen Değer:</span>
              <span className="current-value-number">
                {currentLocalFilters.dangerousAttack}
              </span>
            </div>
          </IonCardContent>
        </IonCard>

        {/* Toplam Korner */}
        <IonCard className="stats-card">
          <IonCardContent>
            <div className="filter-title">
              <IonIcon icon={peopleOutline} />
              <IonLabel>Toplam Korner</IonLabel>
            </div>
            <IonRange
              min={1}
              max={10}
              step={1}
              value={currentLocalFilters.totalCorner}
              onIonChange={(e) =>
                handleFilterChange("totalCorner", e.detail.value)
              }
              className="filter-range"
            >
              <div slot="start" className="range-min">
                1
              </div>
              <div slot="end" className="range-max">
                10
              </div>
            </IonRange>
            <div className="current-value">
              <span className="current-value-label">Seçilen Değer:</span>
              <span className="current-value-number">
                {currentLocalFilters.totalCorner}
              </span>
            </div>
          </IonCardContent>
        </IonCard>

        {/* Süre Dakika */}
        <IonCard className="stats-card">
          <IonCardContent>
            <div className="filter-title">
              <IonIcon icon={timeOutline} />
              <IonLabel>Süre (Dakika)</IonLabel>
            </div>
            <IonRange
              min={selectedHalf === "first" ? 1 : 45}
              max={selectedHalf === "first" ? 45 : 90}
              step={1}
              value={currentLocalFilters.duration}
              onIonChange={(e) =>
                handleFilterChange("duration", e.detail.value)
              }
              className="filter-range"
            >
              <div slot="start" className="range-min">
                {selectedHalf === "first" ? "1'" : "45'"}
              </div>
              <div slot="end" className="range-max">
                {selectedHalf === "first" ? "45'" : "90'"}
              </div>
            </IonRange>
            <div className="current-value">
              <span className="current-value-label">Seçilen Değer:</span>
              <span className="current-value-number">
                {currentLocalFilters.duration}'
              </span>
            </div>
          </IonCardContent>
        </IonCard>

        {/* Ses Seçimi */}
        <IonCard className="stats-card">
          <IonCardContent>
            <div className="filter-title">
              <IonIcon icon={pulseOutline} />
              <IonLabel>Ses Seçimi</IonLabel>
            </div>
            <div className="sound-options">
              <IonChip
                onClick={() => handleFilterChange("soundEnabled", true)}
                color={currentLocalFilters.soundEnabled ? "success" : "medium"}
                className="sound-chip"
              >
                <IonLabel>Sesli Anons</IonLabel>
              </IonChip>
              <IonChip
                onClick={() => handleFilterChange("soundEnabled", false)}
                color={!currentLocalFilters.soundEnabled ? "danger" : "medium"}
                className="sound-chip"
              >
                <IonLabel>Sessiz</IonLabel>
              </IonChip>
            </div>
          </IonCardContent>
        </IonCard>

        {/* Buttons */}
        <div className="filter-buttons">
          <IonButton
            expand="block"
            fill="outline"
            color="medium"
            onClick={handleResetFilters}
            className="reset-button"
          >
            <IonIcon icon={refreshOutline} slot="start" />
            {selectedHalf === "first" ? "1. Yarı Sıfırla" : "2. Yarı Sıfırla"}
          </IonButton>
          <IonButton
            expand="block"
            color="success"
            onClick={handleApplyFilters}
            className="apply-button"
          >
            <IonIcon icon={saveOutline} slot="start" />
            {selectedHalf === "first"
              ? "1. Yarı Filtreleri Uygula"
              : "2. Yarı Filtreleri Uygula"}
          </IonButton>
        </div>
      </IonContent>

      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={2000}
        position="bottom"
        color="dark"
      />
    </IonPage>
  );
};

export default Stats;
