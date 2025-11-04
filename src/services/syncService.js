import databaseService from './databaseService';
import { ApiService } from './apiService';
import networkService from './networkService';
import appConfig from '../config/appConfig';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';

// Default sync config
const defaultSyncConfig = {
  autoSync: false,
  syncIntervalMinutes: 15,
  maxRetries: 3,
  batchSize: 50,
};

// Sync task name for background sync
const BACKGROUND_SYNC_TASK = 'background-sync-task';

class SyncService {
  constructor() {
    this.syncInterval = null;
    this.syncInProgress = false;
    this.lastManualSyncAt = 0; // cooldown to prevent rapid re-triggers
    this.syncConfig = {
      autoSync: appConfig?.sync?.autoSync ?? false,
      syncIntervalMinutes: appConfig?.sync?.intervalMinutes ?? 15,
      maxRetries: appConfig?.sync?.maxRetries ?? 3,
      batchSize: appConfig?.sync?.batchSize ?? 50,
    };
  }

  // Initialize sync service
  async initialize() {
    try {
      // Always clear any existing periodic sync to avoid unintended repeats
      this.stopPeriodicSync();

      // Ensure previously registered background task is unregistered when autoSync is off
      try {
        if (!this.syncConfig.autoSync) {
          await BackgroundFetch.unregisterTaskAsync?.(BACKGROUND_SYNC_TASK);
          console.log('Background sync task unregistered');
        }
      } catch (e) {
        console.log('Background task unregistration skipped or failed:', e?.message);
      }

      // Register background sync task only when autoSync is enabled
      if (this.syncConfig.autoSync) {
        this.registerBackgroundSyncTask();
        // Start periodic sync if enabled
        this.startPeriodicSync();
      }
      
      console.log('SyncService initialized successfully');
      return { success: true };
    } catch (error) {
      console.error('SyncService initialization failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Configure sync settings
  configure(config) {
    this.syncConfig = { ...this.syncConfig, ...config };
    
    // Restart periodic sync with new settings if auto sync is enabled
    this.stopPeriodicSync();
    if (this.syncConfig.autoSync) {
      this.startPeriodicSync();
    }
  }

  // Register background sync task
  registerBackgroundSyncTask() {
    try {
      TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
        try {
          console.log('Background sync task triggered');
          
          // Check if we have internet connection
          const networkState = await networkService.getNetworkState();
          if (!networkState.isInternetReachable) {
            console.log('No internet connection, skipping background sync');
            return BackgroundFetch.BackgroundFetchResult.NoData;
          }
          
          // Perform sync
          const result = await this.performSync();
          
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
      
      console.log('Background sync task registered successfully');
    } catch (error) {
      console.error('Failed to register background sync task:', error);
    }
  }

  // Start periodic sync
  startPeriodicSync() {
    // Clear any existing interval
    this.stopPeriodicSync();
    
    // Set up periodic sync
    const intervalMs = this.syncConfig.syncIntervalMinutes * 60 * 1000;
    this.syncInterval = setInterval(async () => {
      try {
        await this.syncOnDemand();
      } catch (error) {
        console.error('Periodic sync failed:', error);
      }
    }, intervalMs);
    
    console.log(`Periodic sync started with interval: ${this.syncConfig.syncIntervalMinutes} minutes`);
  }

  // Stop periodic sync
  stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('Periodic sync stopped');
    }
  }

  // Perform on-demand sync
  // options: { onlyConsumerIndexing?: boolean }
  async syncOnDemand(options = {}) {
    // Debounce/cooldown manual trigger to once per 10s
    const now = Date.now();
    const cooldownMs = 10_000;
    if (now - this.lastManualSyncAt < cooldownMs) {
      return { success: false, message: 'Sync already triggered recently. Please wait a moment.' };
    }
    this.lastManualSyncAt = now;

    // Skip if sync is already in progress
    if (this.syncInProgress) {
      console.log('Sync already in progress, skipping');
      return { success: true, message: 'Sync already in progress' };
    }
    
    this.syncInProgress = true;
    
    try {
      console.log('Starting on-demand sync', options);
      const result = await this.performSync(options);
      console.log('On-demand sync completed:', result);
      return result;
    } catch (error) {
      console.error('On-demand sync failed:', error);
      return { success: false, error: error.message };
    } finally {
      this.syncInProgress = false;
    }
  }

  // Perform actual sync operation
  async performSync(options = {}) {
    try {
      // Check network connectivity
      const networkState = await networkService.getNetworkState();
      if (!networkState.isInternetReachable) {
        return { 
          success: true, 
          message: 'No internet connection, sync skipped',
          syncedRecords: 0 
        };
      }
      
      // Check if database is initialized
      if (!databaseService.isInitialized) {
        await databaseService.initialize();
      }
      
      // Get items from sync queue
      const rawQueue = await databaseService.getSyncQueue(this.syncConfig.batchSize);
      const syncQueue = options.onlyConsumerIndexing
        ? rawQueue.filter((q) => q.table_name === 'consumer_indexing')
        : rawQueue;
      
      if (syncQueue.length === 0) {
        return { 
          success: true, 
          message: 'No items in sync queue',
          syncedRecords: 0 
        };
      }
      
      console.log(`Starting sync for ${syncQueue.length} items${options.onlyConsumerIndexing ? ' (consumer_indexing only)' : ''}`);
      
      let syncedCount = 0;
      let errorCount = 0;
      
      // Process each item in the sync queue
      for (const queueItem of syncQueue) {
        try {
          const result = await this.syncQueueItem(queueItem);
          
          if (result.success) {
            // Remove item from sync queue after successful sync
            await databaseService.removeSyncQueueItem(queueItem.id);
            syncedCount++;
          } else {
            // Increment retry count or remove if max retries exceeded
            if (queueItem.retry_count >= this.syncConfig.maxRetries) {
              console.warn(`Max retries exceeded for sync item ${queueItem.id}, removing from queue`);
              await databaseService.removeSyncQueueItem(queueItem.id);
            } else {
              // Update retry count
              await databaseService.db.runAsync(
                'UPDATE sync_queue SET retry_count = retry_count + 1 WHERE id = ?',
                [queueItem.id]
              );
            }
            errorCount++;
          }
        } catch (error) {
          console.error(`Error syncing queue item ${queueItem.id}:`, error);
          errorCount++;
        }
      }
      
      return {
        success: true,
        syncedRecords: syncedCount,
        errorRecords: errorCount,
        totalRecords: syncQueue.length
      };
    } catch (error) {
      console.error('Sync operation failed:', error);
      throw error;
    }
  }

  // Sync a single queue item
  async syncQueueItem(queueItem) {
    try {
      const { table_name, record_id, action, data } = queueItem;
      const parsedData = JSON.parse(data);
      
      console.log(`Syncing item: ${table_name} (${record_id}) with action ${action}`);
      
      let apiResponse;
      
      // Handle different table types
      switch (table_name) {
        case 'users':
          if (action === 'INSERT' || action === 'UPDATE') {
            apiResponse = await ApiService.updateUserProfile(parsedData);
          }
          break;

        case 'installations':
          if (action === 'INSERT') {
            apiResponse = await ApiService.createInstallation(parsedData);
          } else if (action === 'UPDATE') {
            // Assuming we have an installation ID in the data
            const installationId = parsedData.id || record_id;
            apiResponse = await ApiService.updateInstallation(installationId, parsedData);
          }
          break;

        case 'captures':
          if (action === 'INSERT') {
            apiResponse = await ApiService.createSurvey(parsedData);
          }
          break;

        case 'consumer_indexing':
          if (action === 'INSERT' || action === 'UPDATE') {
            // Build Frappe PUT details using the same flow as immediate submit
            const docName = parsedData.CONSUMER_ID_M || parsedData.consumerId || null;
            if (!docName) {
              console.warn('consumer_indexing sync: Missing docName (CONSUMER_ID_M/consumerId)');
              return { success: false, error: 'Missing docName for Consumer Survey' };
            }
            // Build mapped payload to exact server keys
          const val = (v) => {
            if (v === undefined || v === null) return '';
            return String(v).replace(/\r?\n/g, ' ').trim();
          };
          const d = Object.fromEntries(Object.entries(parsedData).filter(([k]) => !k.endsWith('_M')));
          const mapped = {
            // Consumer identification
            consumer_number: val(d.consumerNumber || parsedData.CONSUMER_ID_M),
            correct_consumer_name: val(d.correctConsumerName),
            correct_father_husband_propriteor_name: val(d.correctFatherHusbandName || d.correctFatherHusbandProprietorName),
            actual_category_of_use_on_site: val(d.actualCategoryOfUse || d.actualCategoryOfUseOnSite),
            actual_user_name: val(d.actualUserName),
            actual_user_type: val(d.actualUserType),
            detail_of_id_issued_by_govt: val(d.detailOfIdIssuedByGovt),
            actual_consumer_address: val(d.actualConsumerAddress),
            
            // Location details
            district_name: val(d.districtName),
            block: val(d.block),
            village_name: val(d.villageName),
            habitation_majra: val(d.habitationMajra),
            area: val(d.area),
            tehsil_name: val(d.tehsilName),
            gram_panchayat: val(d.gramPanchayat),
            village_census_code: val(d.villageCensusCode),
            landmark: val(d.landmark),
            
            // Contact information
            email: val(d.email),
            verified_mob_no: val(d.verifiedMobileNumber),
            whatsapp_number: val(d.whatsappNumber),
            
            // Infrastructure details
            sub_station_name: val(d.subStationName || parsedData.SUB_STATION_NAME_M),
            sub_station_code: val(d.subStationCode || parsedData.SUB_STATION_CODE_M),
            feeder_name: val(d.feederName || parsedData.FEEDER_NAME_M),
            feeder_code: val(d.feederCode || parsedData.FEEDER_CODE_M),
            dtr_name: val(d.dtrName || parsedData.DTR_NAME_M),
            dtr_code: val(d.dtrCode || parsedData.DTR_CODE_M),
            lt_pole_code: val(d.ltPoleCode),
            //attach_pole_photo: val(d.pole_photo),
            
            // Meter details
            correct_serial_number: val(d.correctSerialNumber),
            connection_status: val(d.connectionStatus),
            meter_box_status: val(d.meterBoxStatus),
            old_meter_status: val(d.oldMeterStatus),
            meter_location: val(d.meterLocation),
            correct_meter_make: val(d.correctMeterMake),
            old_meter_reading_md_kw: val(d.oldMeterReadingMD),
            condition_of_installed_service_cable: val(d.conditionOfInstalledServiceCable),
            meter_shifting_required: val(d.meterShiftingRequired),
            lt_pole_condition_for_service_cable_replacement: val(d.ltPoleCondition),
            number_of_connections_in_the_premise: val(d.numberOfConnections),
            metered_consumer: val(d.meteredConsumer),
            meter_box_sealing_status: val(d.meterBoxSealingStatus),
            clear_line_of_sight: val(d.clearLineOfSight),
            meter_in_metallic_enclosure: val(d.meterInMetallicEnclosure),
            service_line_status: val(d.serviceLineStatus),
            installed_service_cable: val(d.installedServiceCable),
            neutral_availbility: val(d.neutralAvailability),
            length_of_cable_in_meter: val(d.lengthOfCable),
            
            // GPS coordinates
            correct_latitude: val(parsedData.LATITUDE_M || d.latitude),
            correct_longitude: val(parsedData.LONGITUDE_M || d.longitude),
            
            // SIM1 network information
            sim1_network_service_provider: val(d.sim1NetworkProvider),
            sim1_signal_strength: val(d.sim1SignalStrength),
            sim1_signal_level: val(d.sim1SignalLevel),
            sim1_signal_type: val(d.sim1SignalType),
            sim1_category: val(d.sim1Category),
            sim1_rssi: val(d.sim1RSSI),
            sim1_rsrp: val(d.sim1RSRP),
            sim1_snr: val(d.sim1SNR),
            sim1_cell_id: val(d.sim1CellId),
            
            // SIM2 network information
            sim2_network_service_provider: val(d.sim2NetworkProvider),
            sim2_signal_strength: val(d.sim2SignalStrength),
            sim2_signal_level: val(d.sim2SignalLevel),
            sim2_signal_type: val(d.sim2SignalType),
            sim2_category: val(d.sim2Category),
            sim2_rssi: val(d.sim2RSSI),
            sim2_rsrp: val(d.sim2RSRP),
            sim2_snr: val(d.sim2SNR),
            sim2_cell_id: val(d.sim2CellId),
            
            // Photo attachments
            old_meter_photo: val(d.old_meter_photo),
            old_meter_kwh_reading_photo: val(d.old_meter_kwh_photo),
            house_photo: val(d.house_photo),
            
            // Additional fields
            ci_remarks: val(d.ciRemarks),
            je_name: val(d.jeName),
            date_and_time: val(d.dateAndTime || new Date().toISOString()),
          };
          const payload = Object.fromEntries(Object.entries(mapped).filter(([, v]) => v !== ''));

            // Enhanced logging with timestamps and clear markers
            const timestamp = new Date().toISOString();
            console.log(`🚀 [${timestamp}] SYNC REQUEST START - Consumer Indexing PUT`);
            console.log(`📋 DocName: ${docName}`);
            console.log(`🔑 Payload Keys (${Object.keys(payload).length}):`, Object.keys(payload));
            
            // Log GPS and SIM data specifically
            const gpsData = { 
              correct_latitude: payload.correct_latitude, 
              correct_longitude: payload.correct_longitude 
            };
            const simData = Object.fromEntries(
              Object.entries(payload).filter(([key]) => key.startsWith('sim1_'))
            );
            console.log(`📍 GPS Data:`, gpsData);
            console.log(`📶 SIM1 Data:`, simData);
            
            try { 
              console.log(`📤 Full Payload:`, JSON.stringify(payload, null, 2)); 
            } catch (e) { 
              console.log(`📤 Payload (stringified):`, payload); 
            }
            
            console.log(`⏳ Making API call to updateConsumerSurveyAbsolute...`);
            apiResponse = await ApiService.updateConsumerSurveyAbsolute({ 
              docName, 
              payload,
              token: '0a3ac2415acc9a4:ee04f1881306858'
            });
            
            const responseTimestamp = new Date().toISOString();
            console.log(`✅ [${responseTimestamp}] SYNC RESPONSE RECEIVED`);
            try { 
              console.log(`📥 Response:`, JSON.stringify(apiResponse, null, 2)); 
            } catch (e) { 
              console.log(`📥 Response (raw):`, apiResponse); 
            }
            console.log(`🏁 [${responseTimestamp}] SYNC REQUEST END - Consumer Indexing PUT`);
          }
          break;

        default:
          console.warn(`Unsupported table type for sync: ${table_name}`);
          return { success: false, error: `Unsupported table type: ${table_name}` };
      }

      // Check API response
      if (apiResponse && apiResponse.success) {
        console.log(`Successfully synced ${table_name} item ${record_id}`);
        return { success: true };
      } else {
        const errorMessage = apiResponse?.message || 'API call failed';
        console.error(`Failed to sync ${table_name} item ${record_id}: ${errorMessage}`);
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      console.error(`Error syncing queue item ${queueItem.id}:`, error);
      return { success: false, error: error.message };
    }
  }

  // Force sync all pending items
  async forceSyncAll() {
    try {
      console.log('Starting force sync of all pending items');
      
      // Get all items from sync queue (no limit)
      const syncQueue = await databaseService.getSyncQueue();
      
      if (syncQueue.length === 0) {
        return { 
          success: true, 
          message: 'No items to sync',
          syncedRecords: 0 
        };
      }
      
      console.log(`Force syncing ${syncQueue.length} items`);
      
      let syncedCount = 0;
      let errorCount = 0;
      
      // Process each item
      for (const queueItem of syncQueue) {
        try {
          const result = await this.syncQueueItem(queueItem);
          
          if (result.success) {
            await databaseService.removeSyncQueueItem(queueItem.id);
            syncedCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          console.error(`Error force syncing queue item ${queueItem.id}:`, error);
          errorCount++;
        }
      }
      
      return {
        success: true,
        syncedRecords: syncedCount,
        errorRecords: errorCount,
        totalRecords: syncQueue.length
      };
    } catch (error) {
      console.error('Force sync failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Clean up sync service
  destroy() {
    this.stopPeriodicSync();
    console.log('SyncService destroyed');
  }
}

// Export singleton instance
export default new SyncService();