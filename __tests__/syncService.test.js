import syncService from '../src/services/syncService';
import databaseService from '../src/services/databaseService';

// Mock the database service
jest.mock('../src/services/databaseService', () => ({
  initialize: jest.fn(),
  getSyncQueue: jest.fn(),
  removeSyncQueueItem: jest.fn(),
  getSyncQueueCount: jest.fn(),
  isInitialized: false,
  db: {
    runAsync: jest.fn(),
  },
}));

// Mock the API service
jest.mock('../src/services/apiService', () => ({
  ApiService: {
    updateUserProfile: jest.fn(),
    createInstallation: jest.fn(),
    updateInstallation: jest.fn(),
    createSurvey: jest.fn(),
  },
}));

// Mock network service
jest.mock('../src/services/networkService', () => ({
  getNetworkState: jest.fn(),
}));

describe('SyncService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    databaseService.isInitialized = false;
  });

  describe('configure', () => {
    it('should update sync configuration', () => {
      const newConfig = {
        autoSync: false,
        syncIntervalMinutes: 30,
        maxRetries: 5,
        batchSize: 100,
      };

      syncService.configure(newConfig);

      // Access the syncConfig property to verify it was updated
      expect(syncService.syncConfig.autoSync).toBe(false);
      expect(syncService.syncConfig.syncIntervalMinutes).toBe(30);
      expect(syncService.syncConfig.maxRetries).toBe(5);
      expect(syncService.syncConfig.batchSize).toBe(100);
    });
  });

  describe('syncQueueItem', () => {
    it('should sync user data successfully', async () => {
      const mockApiResponse = { success: true };
      require('../src/services/apiService').ApiService.updateUserProfile.mockResolvedValue(mockApiResponse);

      const queueItem = {
        table_name: 'users',
        record_id: 1,
        action: 'INSERT',
        data: JSON.stringify({ name: 'John Doe', phone: '1234567890' }),
      };

      const result = await syncService.syncQueueItem(queueItem);

      expect(result.success).toBe(true);
      expect(require('../src/services/apiService').ApiService.updateUserProfile).toHaveBeenCalledWith({
        name: 'John Doe',
        phone: '1234567890',
      });
    });

    it('should sync installation data successfully', async () => {
      const mockApiResponse = { success: true };
      require('../src/services/apiService').ApiService.createInstallation.mockResolvedValue(mockApiResponse);

      const queueItem = {
        table_name: 'installations',
        record_id: 1,
        action: 'INSERT',
        data: JSON.stringify({ name: 'Installation 1', address: '123 Main St' }),
      };

      const result = await syncService.syncQueueItem(queueItem);

      expect(result.success).toBe(true);
      expect(require('../src/services/apiService').ApiService.createInstallation).toHaveBeenCalledWith({
        name: 'Installation 1',
        address: '123 Main St',
      });
    });

    it('should handle unsupported table types', async () => {
      const queueItem = {
        table_name: 'unsupported_table',
        record_id: 1,
        action: 'INSERT',
        data: JSON.stringify({}),
      };

      const result = await syncService.syncQueueItem(queueItem);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unsupported table type: unsupported_table');
    });
  });

  describe('performSync', () => {
    it('should skip sync when no internet connection', async () => {
      require('../src/services/networkService').getNetworkState.mockResolvedValue({
        isInternetReachable: false,
      });

      const result = await syncService.performSync();

      expect(result.success).toBe(true);
      expect(result.message).toBe('No internet connection, sync skipped');
    });

    it('should handle empty sync queue', async () => {
      require('../src/services/networkService').getNetworkState.mockResolvedValue({
        isInternetReachable: true,
      });
      databaseService.getSyncQueue.mockResolvedValue([]);

      const result = await syncService.performSync();

      expect(result.success).toBe(true);
      expect(result.message).toBe('No items in sync queue');
    });
  });
});