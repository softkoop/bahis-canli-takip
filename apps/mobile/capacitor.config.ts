import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.futbol.betting",
  appName: "Futbol Bahis",
  webDir: "dist",
  android: {
    backgroundColor: "#000000",
    allowMixedContent: true,
    webContentsDebuggingEnabled: true,
  },
  ios: {
    backgroundColor: "#000000",
  },
};

export default config;
