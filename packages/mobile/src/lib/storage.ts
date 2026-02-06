import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

export const storage = {
  async getToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch {
      return null;
    }
  },

  async setToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  },

  async removeToken(): Promise<void> {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
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
    await SecureStore.deleteItemAsync(USER_KEY);
  },

  async clear(): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync(TOKEN_KEY),
      SecureStore.deleteItemAsync(USER_KEY),
    ]);
  },
};
