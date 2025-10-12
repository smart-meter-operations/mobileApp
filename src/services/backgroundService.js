import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import syncService from './syncService';
import networkService from './networkService';

// Task name for background sync
const BACKGROUND_SYNC_TASK = 'background-sync-task';

// Register background tasks
export const registerBackgroundTasks = () => {
  try {
    // Define background sync task
    TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
      try {
        console.log('Background sync task started');
        
        // Check network connectivity
        const networkState = await networkService.getNetworkState();
        if (!networkState.isInternetReachable) {
          console.log('No internet connection, skipping background sync');
          return BackgroundFetch.BackgroundFetchResult.NoData;
        }
        
        // Perform sync
        const result = await syncService.performSync();
        
        if (result.success && result.syncedRecords > 0) {
          console.log(`Background sync completed: ${result.syncedRecords} records synced`);
          return BackgroundFetch.BackgroundFetchResult.NewData;
        } else {
          console.log('Background sync completed with no new data');
          return BackgroundFetch.BackgroundFetchResult.NoData;
        }
      } catch (error) {
        console.error('Background sync failed:', error);
        return BackgroundFetch.BackgroundFetchResult.Failed;
      }
    });
    
    console.log('Background tasks registered successfully');
    return true;
  } catch (error) {
    console.error('Failed to register background tasks:', error);
    return false;
  }
};

// Start background fetch
export const startBackgroundFetch = async () => {
  try {
    // Check if task is already registered
    const taskExists = await TaskManager.isTaskDefined(BACKGROUND_SYNC_TASK);
    if (!taskExists) {
      console.warn('Background sync task not registered');
      return false;
    }
    
    // Start background fetch
    await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
      minimumInterval: 15 * 60, // 15 minutes in seconds
      stopOnTerminate: false,
      startOnBoot: true,
    });
    
    console.log('Background fetch started successfully');
    return true;
  } catch (error) {
    console.error('Failed to start background fetch:', error);
    return false;
  }
};

// Stop background fetch
export const stopBackgroundFetch = async () => {
  try {
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_SYNC_TASK);
    console.log('Background fetch stopped successfully');
    return true;
  } catch (error) {
    console.error('Failed to stop background fetch:', error);
    return false;
  }
};

export default {
  registerBackgroundTasks,
  startBackgroundFetch,
  stopBackgroundFetch,
};