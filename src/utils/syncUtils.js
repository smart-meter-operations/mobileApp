import syncService from '../services/syncService';
import networkService from '../services/networkService';
import { ApiService } from '../services/apiService';
import databaseService from '../services/databaseService';

const buildMappedPayload = (rawValues, imageFileNames = {}) => {
  const values = rawValues || {};
  const withoutMeta = Object.fromEntries(
    Object.entries(values).filter(([k]) => !k.endsWith('_M'))
  );

  const mapVal = (v) => {
    if (v === undefined || v === null) return '';
    const s = String(v).replace(/\r?\n/g, ' ').trim();
    return s;
  };

  const formatPhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return '';
    const cleaned = String(phoneNumber).replace(/[^\d]/g, '');
    return cleaned.startsWith('91') ? `+${cleaned}` : `+91${cleaned}`;
  };

  const mapped = {
    status: mapVal(withoutMeta.indexingStatus || withoutMeta.status),
    correct_consumer_name: mapVal(withoutMeta.correctConsumerName),
    correct_father_husband_propriteor_name: mapVal(withoutMeta.correctFatherHusbandName || withoutMeta.correctFatherHusbandProprietorName),
    actual_user_type: mapVal(withoutMeta.actualUserType),
    actual_user_name: mapVal(withoutMeta.actualUserName),
    actual_category_of_use_on_site: mapVal(withoutMeta.actualCategoryOfUse || withoutMeta.actualCategoryOfUseOnSite),
    actual_consumer_address: mapVal(withoutMeta.actualConsumerAddress),
    area: mapVal(withoutMeta.area),
    district_name: mapVal(withoutMeta.districtName),
    tehsil_name: mapVal(withoutMeta.tehsilName),
    block: mapVal(withoutMeta.block),
    gram_panchayat: mapVal(withoutMeta.gramPanchayat),
    village_name: mapVal(withoutMeta.villageName),
    village_census_code: mapVal(withoutMeta.villageCensusCode),
    habitation_majra: mapVal(withoutMeta.habitationMajra),
    landmark: mapVal(withoutMeta.landmark),
    verified_mob_no: formatPhoneNumber(withoutMeta.verifiedMobileNumber),
    whatsapp_number: formatPhoneNumber(withoutMeta.whatsappNumber),
    detail_of_id_issued_by_govt: mapVal(withoutMeta.detailOfIdIssuedByGovt),
    lt_pole_code: mapVal(withoutMeta.ltPoleCode),
    number_of_connections_in_the_premise: mapVal(withoutMeta.numberOfConnections),
    connection_status: mapVal(withoutMeta.connectionStatus),
    metered_consumer: mapVal(withoutMeta.meteredConsumer),
    correct_meter_make: mapVal(withoutMeta.correctMeterMake),
    correct_serial_number: mapVal(withoutMeta.correctSerialNumber),
    meter_box_status: mapVal(withoutMeta.meterBoxStatus),
    meter_box_sealing_status: mapVal(withoutMeta.meterBoxSealingStatus),
    old_meter_status: mapVal(withoutMeta.oldMeterStatus),
    clear_line_of_sight: mapVal(withoutMeta.clearLineOfSight),
    meter_location: mapVal(withoutMeta.meterLocation),
    meter_in_metallic_enclosure: mapVal(withoutMeta.meterInMetallicEnclosure),
    old_meter_reading_md_kw: mapVal(withoutMeta.oldMeterReadingMD),
    service_line_status: mapVal(withoutMeta.serviceLineStatus),
    installed_service_cable: mapVal(withoutMeta.installedServiceCable),
    is_armored_service_cable_to_be_installed: mapVal(withoutMeta.armoredServiceCable || withoutMeta.isArmoredServiceCableToBeInstalled),
    neutral_availbility: mapVal(withoutMeta.neutralAvailability),
    meter_shifting_required: mapVal(withoutMeta.meterShiftingRequired),
    length_of_cable_in_meter: mapVal(withoutMeta.lengthOfCable),
    lt_pole_condition_for_service_cable_replacement: mapVal(withoutMeta.ltPoleCondition),
    ci_remarks: mapVal(withoutMeta.ciRemarks),
    je_name: mapVal(withoutMeta.jeName),
    correct_latitude: mapVal(values.LATITUDE_M || withoutMeta.latitude),
    correct_longitude: mapVal(values.LONGITUDE_M || withoutMeta.longitude),
    ...imageFileNames,
  };

  return Object.fromEntries(
    Object.entries(mapped).filter(([, v]) => String(v).trim() !== '')
  );
};

export const submitConsumerSurveyGroup = async (consumerRecord) => {
  const consumerNumber = consumerRecord.consumerId || consumerRecord.CONSUMER_ID_M;
  if (!consumerNumber) {
    return { success: false, error: 'Missing consumer number for submission.' };
  }

  const docName = consumerRecord.survey_id || consumerNumber || 'CI-2025-006';

  // Step 1: Get images from DB to know how many filenames to generate
  const imagesToUpload = await databaseService.getImagesForConsumer(consumerNumber);
  const imageFileNames = {};
  const generatedFileNames = [];

  if (imagesToUpload.length > 0) {
    const imageFieldNames = ['attach_pole_photo', 'old_meter_photo', 'old_meter_kwh_reading_photo', 'house_photo'];
    for (let i = 0; i < imagesToUpload.length; i++) {
      const fieldName = imageFieldNames[i];
      const fileName = `/files/${consumerNumber}_image${i + 1}.jpg`;
      if(fieldName) imageFileNames[fieldName] = fileName;
      generatedFileNames.push(fileName);
    }
  }

  // Step 2: Build the main data payload, now including the generated filenames
  const payload = buildMappedPayload(consumerRecord, imageFileNames);

  // Step 3: Submit the main data via PUT
  const dataApiRes = await ApiService.updateConsumerSurveyAbsolute({ docName, payload });

  if (!dataApiRes.success) {
    console.error(`Group submission failed at data PUT for ${docName}:`, dataApiRes.message);
    return { success: false, error: `Data submission failed: ${dataApiRes.message}` };
  }

  console.log(`Data PUT successful for ${docName}. Proceeding to image uploads.`);

  // Step 4: If data submission was successful, upload images sequentially but don't stop on failure
  if (imagesToUpload.length > 0) {
    for (let i = 0; i < imagesToUpload.length; i++) {
      const image = imagesToUpload[i];
      const fileName = generatedFileNames[i];
      try {
        const imageApiRes = await ApiService.uploadImage({
          imageBase64: image.image_base64,
          fileName: fileName,
        });
        if (!imageApiRes.success) {
          console.log(`Image POST for ${fileName} failed:`, imageApiRes.message);
        }
      } catch (uploadError) {
        console.log(`Image POST for ${fileName} threw an exception:`, uploadError);
      }
    }
  }

  console.log(`Image upload sequence finished for ${docName}.`);
  return { success: true }; // Always return true if the main data PUT was successful
};

/**
 * Perform on-demand synchronization for a single record using the group logic.
 * @returns {Promise<Object>} Sync result
 */
export const performManualSync = async () => {
  try {
    console.log('Manual sync requested (syncUtils.performManualSync)');
    // Check network connectivity first
    const networkState = await networkService.getNetworkState();
    
    if (!networkState.isConnected || !networkState.isInternetReachable) {
      return {
        success: false,
        message: 'No internet connection available',
        syncedRecords: 0
      };
    }
    
    // Perform sync
    // Only sync consumer_indexing records when manually triggered
    const result = await syncService.syncOnDemand({ onlyConsumerIndexing: true });
    console.log('Manual sync completed (syncUtils.performManualSync):', result);
    return result;
  } catch (error) {
    console.error('Manual sync failed (syncUtils.performManualSync):', error?.message, error?.stack, error);
    return {
      success: false,
      error: error.message,
      syncedRecords: 0
    };
  }
};

/**
 * Perform force synchronization of all pending items
 * @returns {Promise<Object>} Sync result
 */
export const performForceSync = async () => {
  try {
    console.log('Force sync requested (syncUtils.performForceSync)');
    // Check network connectivity first
    const networkState = await networkService.getNetworkState();
    
    if (!networkState.isConnected || !networkState.isInternetReachable) {
      return {
        success: false,
        message: 'No internet connection available',
        syncedRecords: 0
      };
    }
    
    // Perform force sync (all tables)
    const result = await syncService.forceSyncAll();
    console.log('Force sync completed (syncUtils.performForceSync):', result);
    return result;
  } catch (error) {
    console.error('Force sync failed (syncUtils.performForceSync):', error?.message, error?.stack, error);
    return {
      success: false,
      error: error.message,
      syncedRecords: 0
    };
  }
};

/**
 * Get sync status information
 * @returns {Promise<Object>} Sync status
 */
export const getSyncStatus = async () => {
  try {
    // Get network status
    const networkState = await networkService.getNetworkState();
    
    // Get pending sync items count
    const pendingItems = await databaseService.getSyncQueueCount();
    
    return {
      isOnline: networkState.isConnected && networkState.isInternetReachable,
      networkType: networkState.type,
      pendingItems: pendingItems
    };
  } catch (error) {
    console.error('Failed to get sync status:', error);
    return {
      isOnline: false,
      networkType: 'unknown',
      pendingItems: 0,
      error: error.message
    };
  }
};

/**
 * Configure sync settings
 * @param {Object} config - Sync configuration
 */
export const configureSync = (config) => {
  syncService.configure(config);
};

/**
 * Test helper: sends sample PUT to Consumer Survey CI-2025-006 without auth
 */
export const testConsumerSurveyPut = async () => {
  try {
    const resp = await ApiService.testConsumerSurveyPutSample();
    return resp;
  } catch (e) {
    return { success: false, status: 0, message: e.message };
  }
};
export default {
  performManualSync,
  performForceSync,
  getSyncStatus,
  configureSync,
  testConsumerSurveyPut,
};