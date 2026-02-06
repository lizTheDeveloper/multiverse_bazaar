import * as SecureStore from 'expo-secure-store';
import { storage } from '../../lib/storage';

describe('storage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getToken', () => {
    it('should return token when it exists', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('test-token');

      const token = await storage.getToken();

      expect(token).toBe('test-token');
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('auth_token');
    });

    it('should return null when token does not exist', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

      const token = await storage.getToken();

      expect(token).toBeNull();
    });

    it('should return null on error', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const token = await storage.getToken();

      expect(token).toBeNull();
    });
  });

  describe('setToken', () => {
    it('should store token', async () => {
      await storage.setToken('new-token');

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('auth_token', 'new-token');
    });
  });

  describe('removeToken', () => {
    it('should remove token', async () => {
      await storage.removeToken();

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('auth_token');
    });
  });

  describe('getUser', () => {
    it('should return parsed user when it exists', async () => {
      const user = { id: '1', name: 'Test User', email: 'test@example.com' };
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(JSON.stringify(user));

      const result = await storage.getUser();

      expect(result).toEqual(user);
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('user_data');
    });

    it('should return null when user does not exist', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

      const result = await storage.getUser();

      expect(result).toBeNull();
    });

    it('should return null on parse error', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('invalid-json');

      const result = await storage.getUser();

      expect(result).toBeNull();
    });
  });

  describe('setUser', () => {
    it('should store serialized user', async () => {
      const user = { id: '1', name: 'Test User' };

      await storage.setUser(user);

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('user_data', JSON.stringify(user));
    });
  });

  describe('removeUser', () => {
    it('should remove user data', async () => {
      await storage.removeUser();

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('user_data');
    });
  });

  describe('clear', () => {
    it('should remove both token and user data', async () => {
      await storage.clear();

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('auth_token');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('user_data');
    });
  });
});
