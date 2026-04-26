import React, { useState, useEffect } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonToggle,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonIcon,
  IonInput,
  IonText,
  IonToast,
  IonAlert,
  IonAvatar,
  IonCard,
  IonCardContent,
  IonMenuButton,
  IonButtons,
} from "@ionic/react";
import {
  moonOutline,
  sunnyOutline,
  personAddOutline,
  trashOutline,
  logOutOutline,
  saveOutline,
  keyOutline,
  notificationsOutline,
  languageOutline,
  refreshOutline,
} from "ionicons/icons";
import { useAuth } from "../context/AuthContext";
import { useHistory } from "react-router-dom";

interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  role: string;
}

interface SettingsType {
  theme: "light" | "dark";
  notifications: boolean;
  language: "tr" | "en";
  autoRefresh: boolean;
  refreshInterval: number;
}

const Settings: React.FC = () => {
  const { user, logout } = useAuth();
  const history = useHistory();

  const [settings, setSettings] = useState<SettingsType>({
    theme: "dark",
    notifications: true,
    language: "tr",
    autoRefresh: true,
    refreshInterval: 30,
  });

  const [users, setUsers] = useState<User[]>([
    {
      id: 1,
      username: "demo",
      name: "Demo Kullanıcı",
      email: "demo@futbol.com",
      role: "admin",
    },
    {
      id: 2,
      username: "user1",
      name: "Ahmet Yılmaz",
      email: "ahmet@futbol.com",
      role: "user",
    },
  ]);

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showAddUser, setShowAddUser] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [newUser, setNewUser] = useState({
    username: "",
    name: "",
    email: "",
    password: "",
  });

  // Ayarları yükle
  useEffect(() => {
    const savedSettings = localStorage.getItem("app-settings");
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  // Ayarları kaydet
  const saveSettings = () => {
    localStorage.setItem("app-settings", JSON.stringify(settings));
    setToastMessage("Ayarlar kaydedildi");
    setShowToast(true);
  };

  // Tema değiştir
  const toggleTheme = (checked: boolean) => {
    const newTheme = checked ? "dark" : "light";
    setSettings({ ...settings, theme: newTheme });
    document.body.classList.toggle("dark-theme", checked);
  };

  // Yeni kullanıcı ekle
  const addUser = () => {
    if (!newUser.username || !newUser.name || !newUser.email) {
      setToastMessage("Lütfen tüm alanları doldurun");
      setShowToast(true);
      return;
    }

    const newId = Math.max(...users.map((u) => u.id), 0) + 1;
    const userToAdd: User = {
      id: newId,
      username: newUser.username,
      name: newUser.name,
      email: newUser.email,
      role: "user",
    };

    setUsers([...users, userToAdd]);
    setNewUser({ username: "", name: "", email: "", password: "" });
    setShowAddUser(false);
    setToastMessage(`${newUser.name} eklendi`);
    setShowToast(true);
  };

  // Kullanıcı sil
  const deleteUser = () => {
    if (selectedUser) {
      setUsers(users.filter((u) => u.id !== selectedUser.id));
      setToastMessage(`${selectedUser.name} silindi`);
      setShowToast(true);
      setShowDeleteConfirm(false);
      setSelectedUser(null);
    }
  };

  // Çıkış yap
  const handleLogout = async () => {
    await logout();
    history.push("/login");
  };

  return (
    <IonPage className="settings-page">
      <IonHeader>
        <IonToolbar className="settings-header">
          <IonButtons slot="start">
            <IonMenuButton className="menu-button" />
          </IonButtons>
          <IonTitle>Ayarlar</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="settings-content">
        {/* Kullanıcı Profili */}
        <IonCard className="settings-card">
          <IonCardContent>
            <div className="profile-section">
              <IonAvatar className="profile-avatar">
                <img
                  src="https://via.placeholder.com/80?text=👤"
                  alt="Profile"
                />
              </IonAvatar>
              <div className="profile-info">
                <h3>{user?.name || "Misafir Kullanıcı"}</h3>
                <p>{user?.username || "giris@yapiniz.com"}</p>
                <IonText color="success" className="profile-role">
                  {user?.role || "Kullanıcı"}
                </IonText>
              </div>
            </div>
          </IonCardContent>
        </IonCard>

        {/* Genel Ayarlar */}
        <IonCard className="settings-card">
          <IonCardContent>
            <h4 className="settings-section-title">Genel</h4>

            <IonItem className="settings-item" lines="none">
              <IonIcon
                icon={settings.theme === "dark" ? moonOutline : sunnyOutline}
                slot="start"
              />
              <IonLabel>Karanlık Mod</IonLabel>
              <IonToggle
                checked={settings.theme === "dark"}
                onIonChange={(e) => toggleTheme(e.detail.checked)}
              />
            </IonItem>

            <IonItem className="settings-item" lines="none">
              <IonIcon icon={notificationsOutline} slot="start" />
              <IonLabel>Bildirimler</IonLabel>
              <IonToggle
                checked={settings.notifications}
                onIonChange={(e) =>
                  setSettings({ ...settings, notifications: e.detail.checked })
                }
              />
            </IonItem>

            <IonItem className="settings-item" lines="none">
              <IonIcon icon={languageOutline} slot="start" />
              <IonLabel>Dil</IonLabel>
              <IonSelect
                value={settings.language}
                onIonChange={(e) =>
                  setSettings({ ...settings, language: e.detail.value })
                }
                interface="popover"
              >
                <IonSelectOption value="tr">Türkçe</IonSelectOption>
                <IonSelectOption value="en">English</IonSelectOption>
              </IonSelect>
            </IonItem>

            <IonItem className="settings-item" lines="none">
              <IonIcon icon={refreshOutline} slot="start" />
              <IonLabel>Otomatik Yenileme</IonLabel>
              <IonToggle
                checked={settings.autoRefresh}
                onIonChange={(e) =>
                  setSettings({ ...settings, autoRefresh: e.detail.checked })
                }
              />
            </IonItem>
          </IonCardContent>
        </IonCard>

        {/* Kullanıcı Yönetimi */}
        <IonCard className="settings-card">
          <IonCardContent>
            <div className="settings-section-header">
              <h4 className="settings-section-title">Kullanıcı Yönetimi</h4>
              <IonButton
                fill="clear"
                size="small"
                color="success"
                onClick={() => setShowAddUser(true)}
              >
                <IonIcon icon={personAddOutline} slot="start" />
                Ekle
              </IonButton>
            </div>

            <IonList className="user-list">
              {users.map((u) => (
                <IonItem key={u.id} className="user-item" lines="none">
                  <IonAvatar slot="start" className="user-avatar-small">
                    <img
                      src="https://via.placeholder.com/40?text=👤"
                      alt={u.name}
                    />
                  </IonAvatar>
                  <IonLabel>
                    <h3>{u.name}</h3>
                    <p>{u.username}</p>
                    <IonText color="medium" className="user-email">
                      {u.email}
                    </IonText>
                  </IonLabel>
                  {u.role !== "admin" && (
                    <IonButton
                      fill="clear"
                      color="danger"
                      onClick={() => {
                        setSelectedUser(u);
                        setShowDeleteConfirm(true);
                      }}
                    >
                      <IonIcon icon={trashOutline} />
                    </IonButton>
                  )}
                </IonItem>
              ))}
            </IonList>
          </IonCardContent>
        </IonCard>

        {/* Çıkış Butonu */}
        <div className="logout-section">
          <IonButton
            expand="block"
            fill="outline"
            color="danger"
            onClick={handleLogout}
            className="logout-button"
          >
            <IonIcon icon={logOutOutline} slot="start" />
            Çıkış Yap
          </IonButton>
        </div>

        {/* Kaydet Butonu */}
        <div className="save-section">
          <IonButton
            expand="block"
            color="success"
            onClick={saveSettings}
            className="save-button"
          >
            <IonIcon icon={saveOutline} slot="start" />
            Ayarları Kaydet
          </IonButton>
        </div>
      </IonContent>

      {/* Yeni Kullanıcı Ekleme Modalı */}
      <IonAlert
        isOpen={showAddUser}
        onDidDismiss={() => setShowAddUser(false)}
        header="Yeni Kullanıcı Ekle"
        inputs={[
          { name: "username", placeholder: "Kullanıcı Adı", type: "text" },
          { name: "name", placeholder: "Ad Soyad", type: "text" },
          { name: "email", placeholder: "E-posta", type: "email" },
          { name: "password", placeholder: "Şifre", type: "password" },
        ]}
        buttons={[
          { text: "İptal", role: "cancel" },
          {
            text: "Ekle",
            handler: (data) => {
              setNewUser({
                username: data.username,
                name: data.name,
                email: data.email,
                password: data.password,
              });
              setTimeout(addUser, 100);
            },
          },
        ]}
      />

      {/* Silme Onayı */}
      <IonAlert
        isOpen={showDeleteConfirm}
        onDidDismiss={() => setShowDeleteConfirm(false)}
        header="Kullanıcı Sil"
        message={`${selectedUser?.name} kullanıcısını silmek istediğinize emin misiniz?`}
        buttons={[
          { text: "İptal", role: "cancel" },
          { text: "Sil", handler: deleteUser, cssClass: "danger-alert" },
        ]}
      />

      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={2000}
        position="bottom"
      />
    </IonPage>
  );
};

export default Settings;
