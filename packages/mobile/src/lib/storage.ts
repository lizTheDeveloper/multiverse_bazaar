import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user_data';

export const storage = {
  async get(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },

  async set(key: string, value: string): Promise<void> {
    await SecureStore.setItemAsync(key, value);
  },

  async remove(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(key);
  },

  async getToken(): Promise<string | null> {
    return this.get(TOKEN_KEY);
  },

  async setToken(token: string): Promise<void> {
    await this.set(TOKEN_KEY, token);
  },

  async removeToken(): Promise<void> {
    await this.remove(TOKEN_KEY);
  },

  async getRefreshToken(): Promise<string | null> {
    return this.get(REFRESH_TOKEN_KEY);
  },

  async setRefreshToken(token: string): Promise<void> {
    await this.set(REFRESH_TOKEN_KEY, token);
  },

  async removeRefreshToken(): Promise<void> {
    await this.remove(REFRESH_TOKEN_KEY);
  },

  async getUser<T>(): Promise<T | null> {
    try {
      const data = await SecureStore.getItemAsync(USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  async setUser<T>(user: T): Promise<void> {
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
  },

  async removeUser(): Promise<void> {
    await this.remove(USER_KEY);
  },

  async clear(): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync(TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
      SecureStore.deleteItemAsync(USER_KEY),
    ]);
  },
};
