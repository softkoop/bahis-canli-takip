import React, { useState } from "react";
import {
  IonContent,
  IonPage,
  IonInput,
  IonButton,
  IonItem,
  IonLabel,
  IonLoading,
  IonText,
  IonGrid,
  IonRow,
  IonCol,
  IonImg,
  IonCard,
  IonCardContent,
  IonIcon,
} from "@ionic/react";
import { logInOutline, personOutline, lockClosedOutline } from "ionicons/icons";
import { useAuth } from "../context/AuthContext";
import { useHistory } from "react-router-dom";

const Login: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const history = useHistory();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const success = await login(username, password);
    setLoading(false);

    if (success) {
      history.push("/home");
    } else {
      setError("Kullanıcı adı veya şifre hatalı");
    }
  };

  return (
    <IonPage className="login-page">
      <IonContent className="login-content" scrollY={false}>
        <IonGrid className="login-container">
          <IonRow
            className="ion-justify-content-center ion-align-items-center"
            style={{ height: "100%" }}
          >
            <IonCol size="12" sizeSm="8" sizeMd="6" sizeLg="4">
              <IonCard className="login-card">
                <IonCardContent>
                  <div style={{ textAlign: "center", marginBottom: "32px" }}>
                    <div className="login-logo">
                      <span className="login-logo-text">⚽</span>
                    </div>
                    <h2 className="login-title">Futbol Bahis</h2>
                    <IonText color="medium">
                      <p className="login-subtitle">Hesabınıza giriş yapın</p>
                    </IonText>
                  </div>

                  <form onSubmit={handleLogin}>
                    <IonItem className="login-input-item" lines="none">
                      <IonIcon
                        icon={personOutline}
                        slot="start"
                        className="login-input-icon"
                      />
                      <IonLabel
                        position="stacked"
                        className="login-input-label"
                      >
                        Kullanıcı Adı
                      </IonLabel>
                      <IonInput
                        value={username}
                        onIonInput={(e) => setUsername(e.detail.value!)}
                        type="text"
                        required
                        className="login-input"
                        placeholder=" "
                      />
                    </IonItem>

                    <IonItem className="login-input-item" lines="none">
                      <IonIcon
                        icon={lockClosedOutline}
                        slot="start"
                        className="login-input-icon"
                      />
                      <IonLabel
                        position="stacked"
                        className="login-input-label"
                      >
                        Şifre
                      </IonLabel>
                      <IonInput
                        value={password}
                        onIonInput={(e) => setPassword(e.detail.value!)}
                        type="password"
                        required
                        className="login-input"
                        placeholder=" "
                      />
                    </IonItem>

                    {error && (
                      <IonText color="danger" className="login-error">
                        <small>{error}</small>
                      </IonText>
                    )}

                    <IonButton
                      expand="block"
                      type="submit"
                      className="login-button"
                      disabled={!username || !password}
                    >
                      <IonIcon icon={logInOutline} slot="start" />
                      Giriş Yap
                    </IonButton>

                    <IonText color="medium" className="login-demo">
                      <small>Demo: username: demo / password: 123456</small>
                    </IonText>
                  </form>
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>

      <IonLoading isOpen={loading} message="Giriş yapılıyor..." />
    </IonPage>
  );
};

export default Login;
