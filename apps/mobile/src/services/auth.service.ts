import { Preferences } from "@capacitor/preferences";
import { isPlatform } from "@ionic/react";
import SecureLS from "secure-ls";

class AuthService {
  private ls = new SecureLS({ encodingType: "aes" });
  private isMobile: boolean;

  constructor() {
    // isPlatform ile platform kontrolü
    this.isMobile = isPlatform("hybrid"); // capacitor/cordova içinde çalışıyorsa
  }

  // Token kaydet
  async setToken(token: string): Promise<void> {
    if (this.isMobile) {
      await Preferences.set({
        key: "auth_token",
        value: token,
      });
    } else {
      this.ls.set("auth_token", token);
    }
  }

  // Token al
  async getToken(): Promise<string | null> {
    if (this.isMobile) {
      const { value } = await Preferences.get({ key: "auth_token" });
      return value || null;
    } else {
      const token = this.ls.get("auth_token");
      return token || null;
    }
  }

  // Token sil
  async removeToken(): Promise<void> {
    if (this.isMobile) {
      await Preferences.remove({ key: "auth_token" });
    } else {
      this.ls.remove("auth_token");
    }
  }

  // Kullanıcı bilgilerini kaydet
  async setUser(user: any): Promise<void> {
    const userStr = JSON.stringify(user);
    if (this.isMobile) {
      await Preferences.set({
        key: "user_data",
        value: userStr,
      });
    } else {
      this.ls.set("user_data", userStr);
    }
  }

  // Kullanıcı bilgilerini al
  async getUser(): Promise<any | null> {
    if (this.isMobile) {
      const { value } = await Preferences.get({ key: "user_data" });
      return value ? JSON.parse(value) : null;
    } else {
      const user = this.ls.get("user_data");
      return user || null;
    }
  }

  // Login işlemi (mock)
  async login(
    username: string,
    password: string,
  ): Promise<{ success: boolean; token?: string; user?: any; error?: string }> {
    // Mock API çağrısı
    return new Promise((resolve) => {
      setTimeout(() => {
        if (username === "demo" && password === "123456") {
          const token = "mock-jwt-token-" + Date.now();
          const user = { id: 1, username, name: "Demo Kullanıcı" };
          resolve({ success: true, token, user });
        } else {
          resolve({ success: false, error: "Kullanıcı adı veya şifre hatalı" });
        }
      }, 500);
    });
  }

  // Logout
  async logout(): Promise<void> {
    await this.removeToken();
    await Preferences.remove({ key: "user_data" });
    this.ls.remove("user_data");
  }

  // Giriş yapılmış mı?
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return !!token;
  }
}

export const authService = new AuthService();
