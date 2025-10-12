import databaseService from './databaseService';
import { ApiService } from './apiService';
import networkService from './networkService';
import syncService from './syncService';

// Data service functions that work with local database and sync with remote API
export class DataService {
  // Get dashboard stats - try local first, fallback to API
  static async getDashboardStats() {
    try {
      // Try to get stats from local database first
      const localStats = await databaseService.getDashboardStats();
      
      if (localStats && localStats.lastUpdated) {
        return localStats;
      }
      
      // If no local data, fetch from API (if online)
      const networkState = await networkService.getNetworkState();
      if (networkState.isInternetReachable) {
        const apiResponse = await ApiService.getDashboardStats();
        if (apiResponse.success) {
          // Save to local database
          await databaseService.updateDashboardStats({
            survey_total: apiResponse.data.survey.total,
            survey_completed: apiResponse.data.survey.completed,
            survey_pending: apiResponse.data.survey.pending,
            installation_total: apiResponse.data.installation.total,
            installation_completed: apiResponse.data.installation.completed,
            installation_pending: apiResponse.data.installation.pending,
          });
          return apiResponse.data;
        }
      }
      
      // Return default stats if both local and API fail
      return {
        survey: { total: 0, completed: 0, pending: 0 },
        installation: { total: 0, completed: 0, pending: 0 },
        lastUpdated: null,
      };
    } catch (error) {
      console.error('Get dashboard stats failed:', error);
      return {
        survey: { total: 0, completed: 0, pending: 0 },
        installation: { total: 0, completed: 0, pending: 0 },
        lastUpdated: null,
      };
    }
  }

  // Get dashboard counters for home KPI cards
  static async getDashboardCounters() {
    try {
      // Update dashboard counters based on actual installation data
      await databaseService.updateDashboardCountersFromInstallations();
      
      const counters = await databaseService.getDashboardCounters();
      return counters;
    } catch (error) {
      console.error('Get dashboard counters failed:', error);
      return {
        totalCompleted: 0,
        consumerIndexing: { assigned: 0, draft: 0, completed: 0, toSync: 0 },
        meterInstallation: { assigned: 0, draft: 0, completed: 0, toSync: 0 },
        lastUpdated: null,
      };
    }
  }

  // Get installation list - try local first, fallback to API
  static async getInstallationList() {
    try {
      // Try to get installations from local database first
      const localInstallations = await databaseService.getInstallations();
      
      if (localInstallations && localInstallations.length > 0) {
        return localInstallations;
      }
      
      // If no local data, fetch from API (if online)
      const networkState = await networkService.getNetworkState();
      if (networkState.isInternetReachable) {
        const apiResponse = await ApiService.getInstallations();
        if (apiResponse.success) {
          // Save to local database
          for (const installation of apiResponse.data) {
            await databaseService.saveInstallation(installation);
          }
          return apiResponse.data;
        }
      }
      
      // Return empty array if both local and API fail
      return [];
    } catch (error) {
      console.error('Get installation list failed:', error);
      return [];
    }
  }

  // Get survey list - try local captures, fallback to API
  static async getSurveyList() {
    try {
      // Try to get captures from local database first
      const localCaptures = await databaseService.getCaptures();
      
      // Transform captures to survey format
      const surveys = localCaptures.map(capture => ({
        id: capture.id,
        name: `Survey ${capture.id}`,
        address: 'Local Capture',
        status: 'completed',
        taskType: 'survey',
        phoneNumber: '',
        coordinates: { lat: capture.latitude, lng: capture.longitude },
        assignedDate: capture.captured_at,
        completedDate: capture.captured_at,
      }));
      
      if (surveys.length > 0) {
        return surveys;
      }
      
      // If no local data, fetch from API (if online)
      const networkState = await networkService.getNetworkState();
      if (networkState.isInternetReachable) {
        const apiResponse = await ApiService.getSurveys();
        if (apiResponse.success) {
          return apiResponse.data;
        }
      }
      
      // Return empty array if both local and API fail
      return [];
    } catch (error) {
      console.error('Get survey list failed:', error);
      return [];
    }
  }

  // Get user profile - try local first, fallback to API
  static async getUserProfile() {
    try {
      // In a real app, we would get the current user's phone number
      // For now, we'll use a placeholder
      const currentUserPhone = '+91 8981675554'; // This should come from auth context
      
      // Try to get user from local database first
      const localUser = await databaseService.getUser(currentUserPhone);
      
      if (localUser) {
        return {
          id: localUser.id,
          name: localUser.name,
          role: localUser.role,
          avatar: localUser.avatar,
          status: localUser.status,
          phoneNumber: localUser.phone,
          employeeId: 'EMP001', // This would come from API in real implementation
          department: 'Field Operations',
        };
      }
      
      // If no local data, fetch from API (if online)
      const networkState = await networkService.getNetworkState();
      if (networkState.isInternetReachable) {
        const apiResponse = await ApiService.getUserProfile();
        if (apiResponse.success) {
          // Save to local database
          await databaseService.saveUser({
            phone: apiResponse.data.phoneNumber,
            name: apiResponse.data.name,
            role: apiResponse.data.role,
            status: apiResponse.data.status,
            avatar: apiResponse.data.avatar,
          });
          return apiResponse.data;
        }
      }
      
      // Return mock user if both local and API fail
      return {
        id: 'user_123',
        name: 'Rajesh',
        role: 'Surveyor / Installer',
        avatar: '👨‍💼',
        status: 'offline',
        phoneNumber: '+91 8981675554',
        employeeId: 'EMP001',
        department: 'Field Operations',
      };
    } catch (error) {
      console.error('Get user profile failed:', error);
      return {
        id: 'user_123',
        name: 'Rajesh',
        role: 'Surveyor / Installer',
        avatar: '👨‍💼',
        status: 'offline',
        phoneNumber: '+91 8981675554',
        employeeId: 'EMP001',
        department: 'Field Operations',
      };
    }
  }

  // Update task status - save locally and queue for sync
  static async updateTaskStatus(taskId, newStatus) {
    try {
      // Update in local database
      const result = await databaseService.updateInstallationStatus(taskId, newStatus);
      
      if (result.success) {
        // Trigger sync if online
        const networkState = await networkService.getNetworkState();
        if (networkState.isInternetReachable) {
          setTimeout(() => {
            syncService.syncOnDemand();
          }, 1000);
        }
        
        return { success: true, taskId, newStatus };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Update task status failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Create new installation task - save locally and queue for sync
  static async createInstallationTask(taskData) {
    try {
      // Save to local database
      const result = await databaseService.saveInstallation(taskData);
      
      if (result.success) {
        const newTask = {
          id: result.id,
          ...taskData,
          status: 'pending',
          assignedDate: new Date().toISOString().split('T')[0],
          completedDate: null,
        };
        
        // Trigger sync if online
        const networkState = await networkService.getNetworkState();
        if (networkState.isInternetReachable) {
          setTimeout(() => {
            syncService.syncOnDemand();
          }, 1000);
        }
        
        return { success: true, task: newTask };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Create installation task failed:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Save capture data - save locally and queue for sync
  static async saveCaptureData(captureData) {
    try {
      // Save to local database
      const result = await databaseService.saveCapture(captureData);
      
      if (result.success) {
        // Trigger sync if online
        const networkState = await networkService.getNetworkState();
        if (networkState.isInternetReachable) {
          setTimeout(() => {
            syncService.syncOnDemand();
          }, 1000);
        }
        
        return { success: true, captureId: result.id };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Save capture data failed:', error);
      return { success: false, error: error.message };
    }
  }
}