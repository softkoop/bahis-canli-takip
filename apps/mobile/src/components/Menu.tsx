import React from "react";
import {
  IonMenu,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonIcon,
  IonLabel,
  IonAvatar,
  IonMenuToggle,
  IonImg,
} from "@ionic/react";
import {
  homeOutline,
  calendarOutline,
  personOutline,
  settingsOutline,
  logOutOutline,
  footballOutline,
  trophyOutline,
  starOutline,
} from "ionicons/icons";
import { useAuth } from "../context/AuthContext";
import { useHistory } from "react-router-dom";

const Menu: React.FC = () => {
  const { user, logout } = useAuth();
  const history = useHistory();

  const handleLogout = async () => {
    await logout();
    history.push("/login");
  };

  const menuItems = [
    { path: "/home", icon: footballOutline, label: "Ana Sayfa" },
    { path: "/stats", icon: footballOutline, label: "Filtreler" },
    { path: "/settings", icon: settingsOutline, label: "Ayarlar" },
  ];

  return (
    <IonMenu contentId="main" type="overlay" className="custom-menu">
      <IonHeader>
        <IonToolbar className="menu-header">
          <div className="menu-header-content">
            <IonAvatar className="menu-avatar">
              <IonImg src="https://via.placeholder.com/80?text=⚽" />
            </IonAvatar>
            <div className="menu-user-info">
              <h3>{user?.name || "Misafir Kullanıcı"}</h3>
              <p>{user?.username || "giris@yapiniz.com"}</p>
            </div>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent className="menu-content">
        <IonList className="menu-list">
          {menuItems.map((item, index) => (
            <IonMenuToggle key={index} autoHide={false}>
              <IonItem
                button
                routerLink={item.path}
                routerDirection="none"
                className="menu-item"
                lines="none"
              >
                <IonIcon icon={item.icon} slot="start" className="menu-icon" />
                <IonLabel className="menu-label">{item.label}</IonLabel>
              </IonItem>
            </IonMenuToggle>
          ))}

          <div className="menu-divider"></div>

          <IonItem
            button
            onClick={handleLogout}
            className="menu-item logout-item"
            lines="none"
          >
            <IonIcon
              icon={logOutOutline}
              slot="start"
              className="logout-icon"
            />
            <IonLabel className="logout-label">Çıkış Yap</IonLabel>
          </IonItem>
        </IonList>

        <div className="menu-footer">
          <div className="menu-version">v1.0.0</div>
        </div>
      </IonContent>
    </IonMenu>
  );
};

export default Menu;
