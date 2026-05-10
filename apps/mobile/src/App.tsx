// App.tsx - AYNI, DEĞİŞMESİN
import React, { useEffect } from "react";
import {
  IonApp,
  IonRouterOutlet,
  IonSplitPane,
  setupIonicReact,
} from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import { Route, Redirect } from "react-router-dom";

import "@ionic/react/css/core.css";
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";
import "@ionic/react/css/padding.css";
import "@ionic/react/css/float-elements.css";
import "@ionic/react/css/text-alignment.css";
import "@ionic/react/css/text-transformation.css";
import "@ionic/react/css/flex-utils.css";
import "@ionic/react/css/display.css";

import "./theme/variables.css";
import "./theme/global.css";

import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Settings from "./pages/Settings";
import Menu from "./components/Menu";
import Stats from "./pages/Stats";
import { MatchProvider } from "./context/MatchContext";

setupIonicReact();

const ProtectedRoute: React.FC<{
  component: React.ComponentType;
  path: string;
  exact?: boolean;
}> = ({ component: Component, path, exact }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Route
      path={path}
      exact={exact}
      render={() =>
        isAuthenticated ? <Component /> : <Redirect to="/login" />
      }
    />
  );
};

const AppContent: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <IonReactRouter>
      {isAuthenticated ? (
        <IonSplitPane contentId="main">
          <Menu />
          <IonRouterOutlet id="main">
            <ProtectedRoute path="/home" component={Home} exact />
            <ProtectedRoute path="/stats" component={Stats} exact />
            <ProtectedRoute path="/settings" component={Settings} exact />
            <Redirect exact from="/" to="/home" />
          </IonRouterOutlet>
        </IonSplitPane>
      ) : (
        <IonRouterOutlet>
          <Route path="/login" component={Login} exact />
          <Redirect exact from="/" to="/login" />
        </IonRouterOutlet>
      )}
    </IonReactRouter>
  );
};

const App: React.FC = () => {
  useEffect(() => {
    document.body.classList.add("dark");
  }, []);
  return (
    <IonApp>
      <AuthProvider>
        <MatchProvider>
          <AppContent />
        </MatchProvider>
      </AuthProvider>
    </IonApp>
  );
};

export default App;
