import React, { useState, useEffect, useCallback } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Animated,
  LayoutAnimation,
  UIManager,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Location from 'expo-location';
import { useForm, Controller } from 'react-hook-form';

// Import components and services
import { AppHeader, Button, Input } from '../components';
import { DatabaseService } from '../services';
import { ApiService } from '../services/apiService'; // Add this import
import NetworkService from '../services/networkService'; // Add this import
import InAppConsoleComponent from '../components/InAppConsole'; // Add this import
import { useKeyboard, useEntranceAnimation, useAsyncOperation } from '../hooks';
import { submitConsumerSurveyGroup } from '../utils/syncUtils';
import { layoutStyles, textStyles } from '../styles';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../constants';

// Enable LayoutAnimation for Android
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Unified section header component
const SectionHeader = ({ title }) => (
  <Text style={styles.sectionHeader}>{title}</Text>
);

// Collapsible section component
const CollapsibleSection = ({
  title,
  children,
  sectionKey,
  isExpanded,
  toggleSection,
  statusText,
}) => {
  return (
    <View style={styles.sectionContainer}>
      <TouchableOpacity
        style={styles.collapsibleHeader}
        onPress={() => toggleSection(sectionKey)}
        activeOpacity={0.7}
      >
        <Text style={styles.collapsibleTitle}>{title}</Text>
        {statusText ? (
          <View style={styles.sectionStatusBadge}>
            <Text style={styles.sectionStatusText}>{statusText}</Text>
          </View>
        ) : null}
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={COLORS.textPrimary}
        />
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.collapsibleContent}>{children}</View>
      )}
    </View>
  );
};

// Unified input field component with react-hook-form integration
const FormInput = ({
  control,
  name,
  label,
  placeholder,
  multiline = false,
  error,
  numberOfLines = 1,
  keyboardType = 'default',
  editable = true,
  required = false,
  rules = {},
  style = {},
}) => (
  <View style={[styles.inputContainer, style]}>
    {label && (
      <Text style={styles.inputLabel}>
        {label} {required && <Text style={styles.requiredIndicator}>*</Text>}
      </Text>
    )}
    <Controller
      control={control}
      name={name}
      rules={required ? { required: 'This field is required' } : rules}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <>
          <Input
            placeholder={placeholder || label}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            multiline={multiline}
            numberOfLines={multiline ? numberOfLines : 1}
            keyboardType={keyboardType}
            editable={editable}
            style={[styles.inputField, multiline && styles.multilineInput, error && { borderColor: COLORS.error }]}
            error={!!error}
            onFocus={() => {
              setTimeout(() => {}, 100);
            }}
          />
          {error ? (
            <Text style={styles.errorText}>{error.message}</Text>
          ) : null}
        </>
      )}
    />
  </View>
);

// Unified dropdown component with react-hook-form integration
const FormDropdown = ({
  control,
  name,
  label,
  options = [],
  required = false,
  rules = {},
  style = {},
}) => (
  <View style={[styles.inputContainer, style]}>
    <Text style={styles.inputLabel}>
      {label} {required && <Text style={styles.requiredIndicator}>*</Text>}
    </Text>
    <Controller
      control={control}
      name={name}
      rules={required ? { required: 'This field is required' } : rules}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <TouchableOpacity
          style={[styles.dropdownContainer, error && { borderColor: COLORS.error }]}
          onPress={() => {
            Alert.alert(label, 'Select an option', [
              ...options.map((option) => ({
                text: option,
                onPress: () => onChange(option),
              })),
              { text: 'Cancel', style: 'cancel' },
            ]);
          }}
        >
          <Text style={styles.dropdownText}>
            {value || `Select ${label}`}
          </Text>
          <Ionicons
            name="chevron-down"
            size={20}
            color={COLORS.textSecondary}
          />
        </TouchableOpacity>
      )}
    />
  </View>
);

// Unified photo capture component
const PhotoCapture = ({
  control,
  name,
  label,
  required = false,
  rules = {},
  style = {},
  onPhotoCapture,
}) => {
  return (
    <View style={[styles.inputContainer, style]}>
      <Text style={styles.inputLabel}>
        {label} {required && <Text style={styles.requiredIndicator}>*</Text>}
      </Text>
      <Controller
        control={control}
        name={name}
        rules={required ? { required: 'Photo is required' } : rules}
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <TouchableOpacity
            style={[styles.photoContainer, error && { borderColor: COLORS.error }]}
            onPress={async () => {
              try {
                const { status } = await ImagePicker.requestCameraPermissionsAsync();
                if (status !== 'granted') {
                  console.error('Permission Denied', 'Camera permission is required to take photos.');
                  return;
                }
                
                console.log('Starting camera capture for field:', name);
                const result = await ImagePicker.launchCameraAsync({
                  allowsEditing: false,
                  quality: 0.3,
                  base64: true,
                });
                
                console.log('ImagePicker result:', {
                  canceled: result?.canceled,
                  assetsCount: result?.assets?.length || 0,
                  hasBase64: !!(result?.assets?.[0]?.base64),
                });
                
                if (!result.canceled) {
                  const asset = result?.assets?.[0];
                  if (!asset) {
                    console.error('No asset returned from ImagePicker');
                    console.error('Capture Error', 'No image data returned from camera. Please try again.');
                    return;
                  }
                  
                  console.log('Processing asset:', { hasUri: !!asset.uri, hasBase64: !!asset.base64 });
                  
                  // Update form value so validation and UI reflect capture
                  onChange('photo_captured');
                  
                  // Persist to DB via parent callback
                  if (asset.base64) {
                    console.log('Calling onPhotoCapture with base64, length:', asset.base64.length);
                    onPhotoCapture(name, { base64: asset.base64 });
                  } else if (asset.uri) {
                    console.log('Calling onPhotoCapture with URI:', asset.uri);
                    onPhotoCapture(name, asset.uri);
                  } else {
                    console.error('Asset has neither base64 nor URI');
                    console.error('Capture Error', 'Invalid image data. Please try again.');
                  }
                }
              } catch (e) {
                console.error('Image capture failed:', {
                  message: e?.message,
                  name: e?.name,
                  stack: e?.stack,
                  error: e
                });
                console.error('Capture Error', `Failed to capture image: ${e?.message || 'Unknown error'}`);
              }
            }}
          >
            <Ionicons
              name={value ? 'camera' : 'camera-outline'}
              size={24}
              color={COLORS.textSecondary}
            />
            <Text style={styles.photoText}>
              {value ? 'Photo Captured' : 'Tap to Capture Photo'}
            </Text>
          </TouchableOpacity>
        )}
      />
      {/** optional inline error intentionally omitted for PhotoCapture */}
    </View>
  );
};

// Screen component
export default function ConsumerIndexingFormScreen({ navigation, route }) {
  const { consumerId, consumerName, indexingStatus } = route?.params || {};
  const [currentStatus, setCurrentStatus] = useState(indexingStatus || 'Assigned');

  // Add dummyData flag
  const dummyData = 'Y'; // Set to 'Y' to enable dummy data, 'N' to disable

  // Custom hooks
  const isKeyboardVisible = useKeyboard();
  const { animatedStyle } = useEntranceAnimation();
  const { loading, execute } = useAsyncOperation();

  // Section required fields mapping for status badges
  const requiredPerSection = {
    consumerInfo: [
      'correctConsumerName',
      'correctFatherHusbandName',
      'actualUserType',
      'actualUserName',
      'actualCategoryOfUse',
      'actualConsumerAddress',
      'area',
      'districtName',
      'tehsilName',
      'block',
      'villageName',
      'landmark',
    ],
    electricalNetwork: ['ltPoleCode', 'polePhoto'],
    oldMeterDetails: [
      'numberOfConnections',
      'connectionStatus',
      'meteredConsumer',
      'correctMeterMake',
      'correctSerialNumber',
    ],
    siteServiceCondition: [
      'meterBoxStatus',
      'meterBoxSealingStatus',
      'oldMeterStatus',
      'clearLineOfSight',
      'meterLocation',
      'meterInMetallicEnclosure',
      'serviceLineStatus',
      'installedServiceCable',
      'armoredServiceCable',
      'neutralAvailability',
      'meterShiftingRequired',
      'lengthOfCable',
      'ltPoleCondition',
    ],
    evidenceFinalization: [
      'ciRemarks',
      'jeName',
      'oldMeterPhoto',
      'oldMeterKWHPhoto',
      'housePhoto',
    ],
  };

  const getSectionStatus = (sectionKey) => {
    const values = control?._formValues || {};
    const req = requiredPerSection[sectionKey] || [];
    if (req.length === 0) return undefined;
    const missing = req.filter((k) => !values[k]).length;
    return missing === 0 ? `Completed ${req.length}/${req.length}` : `Missing ${missing}`;
  };
 
  // Check if photos are actually saved in database for validation
  const checkPhotosInDatabase = useCallback(async () => {
    if (!consumerId) return {};

    try {
      const initialized = await DatabaseService.initialize();
      if (!initialized) return {};

      // Query database for saved photos
      const savedPhotos = await DatabaseService.db.getFirstAsync(
        'SELECT pole_photo, old_meter_photo, old_meter_kwh_photo, house_photo FROM consumer_indexing WHERE CONSUMER_ID_M = ?',
        [consumerId]
      );

      if (!savedPhotos) return {};

      return {
        polePhoto: !!savedPhotos.pole_photo,
        oldMeterPhoto: !!savedPhotos.old_meter_photo,
        oldMeterKWHPhoto: !!savedPhotos.old_meter_kwh_photo,
        housePhoto: !!savedPhotos.house_photo,
      };
    } catch (error) {
      console.error('Error checking photos in database:', error);
      return {};
    }
  }, [consumerId]);

  // Enhanced form progress calculation that validates actual photo capture
  const getFormProgress = useCallback(() => {
    const values = control?._formValues || {};
    const required = Object.values(requiredPerSection).flat();
    const uniqueRequired = Array.from(new Set(required));
    const total = uniqueRequired.length;
    if (total === 0) return 0;
    const filled = uniqueRequired.reduce((acc, key) => {
      const v = values[key];
      const hasValue = v !== undefined && v !== null && String(v).trim() !== '';
      return acc + (hasValue ? 1 : 0);
    }, 0);
    return Math.round((filled / total) * 100);
  }, [control]);

  // Enhanced validation that checks actual photo capture
  const validateFormCompletion = useCallback(() => {
    const values = control?._formValues || {};
    const required = Object.values(requiredPerSection).flat();
    const uniqueRequired = Array.from(new Set(required));

    const missingFields = [];

    for (const key of uniqueRequired) {
      const v = values[key];
      const hasValue = v !== undefined && v !== null && String(v).trim() !== '';

      if (!hasValue) {
        missingFields.push(key);
      }
    }

    return {
      isComplete: missingFields.length === 0,
      missingFields,
      totalFields: uniqueRequired.length,
      completedFields: uniqueRequired.length - missingFields.length,
    };
  }, [control]);
  
  // Form setup with react-hook-form
  const {
    control,
    handleSubmit: handleFormSubmit,
    formState: { errors },
    watch,
    setValue,
    setError,
    getValues,
  } = useForm({
    defaultValues: {
      // General Information (Read Only)
      discom: '',
      zone: '',
      circle: '',
      division: '',
      subDivision: '',

      // Consumer Information
      consumerId: consumerId || '',
      consumerName: consumerName || '',
      fatherHusbandName: '',
      sanctionLoad: '',
      sanctionLoadUnit: '',
      consumerAddress: '',
      registeredMobile: '',
      email: '',
      correctConsumerName: '',
      correctFatherHusbandName: '',
      actualUserType: '',
      actualUserName: '',
      actualCategoryOfUse: '',
      actualConsumerAddress: '',
      area: '',
      districtName: '',
      tehsilName: '',
      block: '',
      gramPanchayat: '',
      villageName: '',
      villageCensusCode: '',
      habitation: '',
      landmark: '',
      verifiedMobileNumber: '',
      whatsappNumber: '',
      govIdDetails: '',

      // Electrical Network Information
      subStationCode: '',
      subStationName: '',
      feederCode: '',
      feederName: '',
      dtrCode: '',
      dtrName: '',
      ltPoleCode: '',
      polePhoto: null,

      // Old Meter Details
      categoryInMasterData: '',
      subCategoryCode: '',
      oldMeterNumber: '',
      oldMeterPhase: '',
      oldMF: '',
      billingType: '',
      latitude: '',
      longitude: '',
      oldMeterBadgeNumber: '',
      meterMake: '',
      connectedLoad: '',
      oldConsNo: '',
      readingDigits: '',
      tdcFlag: '',
      maximumDemand: '',
      meterReadingSequence: '',
      numberOfConnections: '',
      connectionStatus: '',
      meteredConsumer: '',
      correctMeterMake: '',
      correctSerialNumber: '',
      meterBoxStatus: '',
      meterBoxSealingStatus: '',
      oldMeterStatus: '',
      clearLineOfSight: '',
      meterLocation: '',
      meterInMetallicEnclosure: '',
      oldMeterReadingMD: '',
      serviceLineStatus: '',
      installedServiceCable: '',
      conditionOfInstalledServiceCable: '',
      armoredServiceCable: '',
      neutralAvailability: '',
      meterShiftingRequired: '',
      lengthOfCable: '',
      ltPoleCondition: '',
      sim1NetworkProvider: '',
      sim1SignalStrength: '',
      sim1SignalLevel: '',
      sim1SignalType: '',
      sim1Category: '',
      sim1RSSI: '',
      sim1RSRP: '',
      sim1SNR: '',
      sim1CellId: '',
      sim2NetworkProvider: '',
      sim2SignalStrength: '',
      sim2SignalLevel: '',
      sim2SignalType: '',
      sim2Category: '',
      sim2RSSI: '',
      sim2RSRP: '',
      sim2SNR: '',
      sim2CellId: '',
      ciRemarks: '',
      jeName: '',
      oldMeterPhoto: null,
      oldMeterKWHPhoto: null,
      housePhoto: null,

      // Status
      status: 'assigned', // assigned, draft, completed
    },
    mode: 'onChange',
  });

  // Helper function to set value only if field is empty
  const setValueIfEmpty = useCallback((fieldName, value) => {
    const currentValue = getValues(fieldName);
    if (!currentValue || currentValue === '' || currentValue === null || currentValue === undefined) {
      setValue(fieldName, value);
      return true; // Field was filled
    }
    return false; // Field was already filled
  }, [getValues, setValue]);

  // Function to fill dummy data for EMPTY fields only
  const fillDummyData = useCallback(() => {
    console.log('Filling dummy data for empty fields only...');
    
    let filledCount = 0;

    // General Information (Read Only) - Fill only empty fields
    if (setValueIfEmpty('discom', 'UPPCL')) filledCount++;
    if (setValueIfEmpty('zone', 'Zone A')) filledCount++;
    if (setValueIfEmpty('circle', 'Circle B')) filledCount++;
    if (setValueIfEmpty('division', 'Division C')) filledCount++;
    if (setValueIfEmpty('subDivision', 'Sub Division D')) filledCount++;

    // Consumer Information (Read Only) - Fill only empty fields
    if (setValueIfEmpty('fatherHusbandName', 'Ramesh Kumar')) filledCount++;
    if (setValueIfEmpty('sanctionLoad', '5.0')) filledCount++;
    if (setValueIfEmpty('consumerAddress', '123 Main Street, City, State - 123456')) filledCount++;
    if (setValueIfEmpty('registeredMobile', '9876543210')) filledCount++;
    if (setValueIfEmpty('email', 'consumer@example.com')) filledCount++;
    if (setValueIfEmpty('govIdDetails', 'AADHAAR: 1234-5678-9012')) filledCount++;

    // Electrical Network Information - Fill only empty fields
    if (setValueIfEmpty('subStationCode', 'SS001')) filledCount++;
    if (setValueIfEmpty('subStationName', 'Main Substation')) filledCount++;
    if (setValueIfEmpty('feederCode', 'FD001')) filledCount++;
    if (setValueIfEmpty('feederName', 'Feeder 1')) filledCount++;
    if (setValueIfEmpty('dtrCode', 'DTR001')) filledCount++;
    if (setValueIfEmpty('dtrName', 'DTR 1')) filledCount++;
    if (setValueIfEmpty('ltPoleCode', 'LT-001')) filledCount++;

    // Consumer Information - Mandatory Fields - Fill only empty fields
    if (setValueIfEmpty('correctConsumerName', 'John Doe')) filledCount++;
    if (setValueIfEmpty('correctFatherHusbandName', 'Ram Kumar')) filledCount++;
    if (setValueIfEmpty('actualUserType', 'Owner')) filledCount++;
    if (setValueIfEmpty('actualUserName', 'John Doe')) filledCount++;
    if (setValueIfEmpty('actualCategoryOfUse', 'Domestic')) filledCount++;
    if (setValueIfEmpty('actualConsumerAddress', 'House No. 12, Main Street, City')) filledCount++;
    if (setValueIfEmpty('area', 'Urban')) filledCount++;
    if (setValueIfEmpty('districtName', 'Lucknow')) filledCount++;
    if (setValueIfEmpty('tehsilName', 'Sadar')) filledCount++;
    if (setValueIfEmpty('block', 'Block A')) filledCount++;
    if (setValueIfEmpty('villageName', 'Sector 10')) filledCount++;
    if (setValueIfEmpty('landmark', 'Near Park')) filledCount++;
    if (setValueIfEmpty('verifiedMobileNumber', '9876543210')) filledCount++;
    if (setValueIfEmpty('whatsappNumber', '9876543210')) filledCount++;

    // Old Meter Details - Fill only empty fields
    if (setValueIfEmpty('categoryInMasterData', 'Domestic')) filledCount++;
    if (setValueIfEmpty('subCategoryCode', 'SUB001')) filledCount++;
    if (setValueIfEmpty('oldMeterNumber', 'MTR123456')) filledCount++;
    if (setValueIfEmpty('oldMeterPhase', 'Single Phase')) filledCount++;
    if (setValueIfEmpty('oldMF', '1')) filledCount++;
    if (setValueIfEmpty('billingType', 'Prepaid')) filledCount++;
    // GPS coordinates should be filled by image capture, only fill if empty
    if (setValueIfEmpty('latitude', '28.6139')) filledCount++;
    if (setValueIfEmpty('longitude', '77.2090')) filledCount++;
    if (setValueIfEmpty('oldMeterBadgeNumber', 'MBN123')) filledCount++;
    if (setValueIfEmpty('meterMake', 'L&T')) filledCount++;
    if (setValueIfEmpty('connectedLoad', '4.5')) filledCount++;
    if (setValueIfEmpty('oldConsNo', 'CONS123')) filledCount++;
    if (setValueIfEmpty('readingDigits', '5')) filledCount++;
    if (setValueIfEmpty('tdcFlag', 'N')) filledCount++;
    if (setValueIfEmpty('maximumDemand', '5.0')) filledCount++;
    if (setValueIfEmpty('meterReadingSequence', '12345')) filledCount++;
    if (setValueIfEmpty('numberOfConnections', '1')) filledCount++;
    if (setValueIfEmpty('connectionStatus', 'Live')) filledCount++;
    if (setValueIfEmpty('meteredConsumer', 'Yes')) filledCount++;
    if (setValueIfEmpty('correctMeterMake', 'L&T')) filledCount++;
    if (setValueIfEmpty('correctSerialNumber', 'SN123456')) filledCount++;

    // Site/Service Condition - Fill only empty fields
    if (setValueIfEmpty('meterBoxStatus', 'Yes')) filledCount++;
    if (setValueIfEmpty('meterBoxSealingStatus', 'Available')) filledCount++;
    if (setValueIfEmpty('oldMeterStatus', 'Working')) filledCount++;
    if (setValueIfEmpty('clearLineOfSight', 'Yes')) filledCount++;
    if (setValueIfEmpty('meterLocation', 'Outside')) filledCount++;
    if (setValueIfEmpty('meterInMetallicEnclosure', 'No')) filledCount++;
    if (setValueIfEmpty('oldMeterReadingMD', '100')) filledCount++;
    if (setValueIfEmpty('serviceLineStatus', 'Good')) filledCount++;
    if (setValueIfEmpty('installedServiceCable', 'Yes')) filledCount++;
    if (setValueIfEmpty('conditionOfInstalledServiceCable', 'Good')) filledCount++;
    if (setValueIfEmpty('armoredServiceCable', 'No')) filledCount++;
    if (setValueIfEmpty('neutralAvailability', 'Yes')) filledCount++;
    if (setValueIfEmpty('meterShiftingRequired', 'No')) filledCount++;
    if (setValueIfEmpty('lengthOfCable', '10')) filledCount++;
    if (setValueIfEmpty('ltPoleCondition', 'Good')) filledCount++;

    // Evidence & Finalization - Fill only empty fields
    if (setValueIfEmpty('ciRemarks', 'All checks completed successfully.')) filledCount++;
    if (setValueIfEmpty('jeName', 'JE Verifier')) filledCount++;
    // Don't fill photos as they should be captured by user
    
    // Additional fields - Fill only empty fields
    if (setValueIfEmpty('gramPanchayat', 'Gram Panchayat A')) filledCount++;
    if (setValueIfEmpty('villageCensusCode', 'VCC001')) filledCount++;
    if (setValueIfEmpty('habitation', 'Habitation A')) filledCount++;

    // Network Signal Strength - Fill only empty fields (these should be filled by image capture)
    if (setValueIfEmpty('sim1NetworkProvider', 'Jio')) filledCount++;
    if (setValueIfEmpty('sim1SignalStrength', '-85 dBm')) filledCount++;
    if (setValueIfEmpty('sim1SignalLevel', 'Good')) filledCount++;
    if (setValueIfEmpty('sim1SignalType', '4G')) filledCount++;
    if (setValueIfEmpty('sim1Category', 'LTE')) filledCount++;
    if (setValueIfEmpty('sim1RSSI', '-85')) filledCount++;
    if (setValueIfEmpty('sim1RSRP', '-105')) filledCount++;
    if (setValueIfEmpty('sim1SNR', '15')) filledCount++;
    if (setValueIfEmpty('sim1CellId', 'CID001')) filledCount++;
    if (setValueIfEmpty('sim2NetworkProvider', 'Airtel')) filledCount++;
    if (setValueIfEmpty('sim2SignalStrength', '-90 dBm')) filledCount++;
    if (setValueIfEmpty('sim2SignalLevel', 'Average')) filledCount++;
    if (setValueIfEmpty('sim2SignalType', '4G')) filledCount++;
    if (setValueIfEmpty('sim2Category', 'LTE')) filledCount++;
    if (setValueIfEmpty('sim2RSSI', '-90')) filledCount++;
    if (setValueIfEmpty('sim2RSRP', '-110')) filledCount++;
    if (setValueIfEmpty('sim2SNR', '12')) filledCount++;
    
    if (setValueIfEmpty('sim2CellId', 'CID002')) filledCount++;
    
    console.log(`Dummy data filled successfully. ${filledCount} fields were populated.`);
  }, [setValueIfEmpty]);

  // Function to load existing consumer data from database
  const loadConsumerData = useCallback(async () => {
    try {
      if (!consumerId) {
        // If no consumerId, fill with dummy data
        fillDummyData();
        return;
      }

      // Initialize database
      const initialized = await DatabaseService.initialize();
      if (!initialized) {
        console.error('Failed to initialize database');
        // Fall back to dummy data
        fillDummyData();
        return;
      }

      // Query the database for existing consumer indexing data
      const consumerData = await DatabaseService.db.getFirstAsync(
        'SELECT * FROM consumer_indexing WHERE CONSUMER_ID_M = ?',
        [consumerId]
      );

      if (consumerData) {
        // Load existing data into form
        console.log('Loading existing consumer data:', consumerData);
        setCurrentStatus(consumerData.IndexingStatus || currentStatus);

        // Map database fields to form fields for General Information (Read Only)
        setValue('discom', consumerData.DISCOM_M || '');
        setValue('zone', consumerData.ZONE_NAME_WITH_CODE_M || '');
        setValue('circle', consumerData.CIRCLE_NAME_WITH_CODE_M || '');
        setValue('division', consumerData.DIVISION_NAME_WITH_CODE_M || '');
        setValue(
          'subDivision',
          consumerData.SUB_DIVISION_NAME_WITH_CODE_M || ''
        );

        // Map database fields to form fields for Consumer Information
        setValue('consumerId', consumerData.CONSUMER_ID_M || consumerId);
        setValue('survey_id', consumerData.survey_id || '');
        setValue('consumerName', consumerData.CONSUMER_NAME_M || consumerName);
        setValue(
          'correctFatherHusbandName',
          consumerData.FATHER_HUSBAND_PROPRITEOR_NAME_M || ''
        );
        setValue('sanctionLoad', String(consumerData.SANCTIONED_LOAD_M || ''));
        setValue('consumerAddress', consumerData.CONSUMER_ADDRESS_M || '');
        setValue(
          'registeredMobile',
          consumerData.REGISTERED_MOBILE_NO_AS_PER_RMS_M || ''
        );
        setValue('email', consumerData.EMAIL_M || '');
        setValue('subStationCode', consumerData.SUB_STATION_CODE_M || '');
        setValue('subStationName', consumerData.SUB_STATION_NAME_M || '');
        setValue('feederCode', consumerData.FEEDER_CODE_M || '');
        setValue('feederName', consumerData.FEEDER_NAME_M || '');
        setValue('dtrCode', consumerData.DTR_CODE_M || '');
        setValue('dtrName', consumerData.DTR_NAME_M || '');
        setValue(
          'categoryInMasterData',
          consumerData.CATEGORY_IN_MASTER_DATA_M || ''
        );
        setValue('subCategoryCode', consumerData.SUB_CATEGORY_CODE_M || '');
        setValue(
          'oldMeterNumber',
          consumerData.OLD_METER_SERIAL_NUMBER_M || ''
        );
        setValue('oldMeterPhase', consumerData.OLD_METER_PHASE_M || '');
        setValue('oldMF', consumerData.OLD_MF_M || '');
        setValue('billingType', consumerData.BILLING_TYPE_M || '');
        setValue('latitude', String(consumerData.LATITUDE_M || ''));
        setValue('longitude', String(consumerData.LONGITUDE_M || ''));
        setValue(
          'oldMeterBadgeNumber',
          consumerData.OLD_METER_BADGE_NUMBER_M || ''
        );
        setValue('meterMake', consumerData.METER_MAKE_M || '');
        setValue('connectedLoad', String(consumerData.CONNECTED_LOAD_M || ''));
        setValue('oldConsNo', consumerData.OLD_CONS_NO_M || '');
        setValue('readingDigits', consumerData.READING_DIGITS_M || '');
        setValue('tdcFlag', consumerData.TDC_FLAG_M || '');
        setValue('maximumDemand', consumerData.MAXIMUM_DEMAND_M || '');
        setValue(
          'meterReadingSequence',
          consumerData.METER_READING_SEQUENCE_M || ''
        );
        setValue('govIdDetails', consumerData.govIdDetails || '');
        setValue('gramPanchayat', consumerData.gramPanchayat || '');
        setValue('villageCensusCode', consumerData.villageCensusCode || '');
        setValue('habitation', consumerData.habitation || '');
        setValue(
          'correctConsumerName',
          consumerData.consumer_name ||
            consumerData.CONSUMER_NAME_M ||
            consumerName ||
            ''
        );
        setValue(
          'actualConsumerAddress',
          consumerData.address || consumerData.CONSUMER_ADDRESS_M || ''
        );
        setValue(
          'verifiedMobileNumber',
          consumerData.contact_number ||
            consumerData.REGISTERED_MOBILE_NO_AS_PER_RMS_M ||
            ''
        );
        setValue(
          'correctSerialNumber',
          consumerData.meter_serial_number ||
            consumerData.OLD_METER_SERIAL_NUMBER_M ||
            ''
        );

        // Set other editable fields from existing data if available
        setValue('actualUserType', consumerData.actualUserType || '');
        setValue('actualUserName', consumerData.actualUserName || '');
        setValue('actualCategoryOfUse', consumerData.actualCategoryOfUse || '');
        setValue('area', consumerData.area || '');
        setValue('districtName', consumerData.districtName || '');
        setValue('tehsilName', consumerData.tehsilName || '');
        setValue('block', consumerData.block || '');
        setValue('villageName', consumerData.villageName || '');
        setValue('landmark', consumerData.landmark || '');
        setValue('whatsappNumber', consumerData.whatsappNumber || '');
        setValue('ltPoleCode', consumerData.pole_number || '');
        setValue('numberOfConnections', consumerData.numberOfConnections || '');
        setValue('connectionStatus', consumerData.connectionStatus || '');
        setValue('meteredConsumer', consumerData.meteredConsumer || '');
        setValue('correctMeterMake', consumerData.correctMeterMake || '');
        setValue('meterBoxStatus', consumerData.meterBoxStatus || '');
        setValue(
          'meterBoxSealingStatus',
          consumerData.meterBoxSealingStatus || ''
        );
        setValue('oldMeterStatus', consumerData.oldMeterStatus || '');
        setValue('clearLineOfSight', consumerData.clearLineOfSight || '');
        setValue('meterLocation', consumerData.meterLocation || '');
        setValue(
          'meterInMetallicEnclosure',
          consumerData.meterInMetallicEnclosure || ''
        );
        setValue('oldMeterReadingMD', consumerData.oldMeterReadingMD || '');
        setValue('serviceLineStatus', consumerData.serviceLineStatus || '');
        setValue(
          'installedServiceCable',
          consumerData.installedServiceCable || ''
        );
        setValue('armoredServiceCable', consumerData.armoredServiceCable || '');
        setValue('neutralAvailability', consumerData.neutralAvailability || '');
        setValue(
          'meterShiftingRequired',
          consumerData.meterShiftingRequired || ''
        );
        setValue('lengthOfCable', consumerData.lengthOfCable || '');
        setValue('ltPoleCondition', consumerData.ltPoleCondition || '');
        setValue('ciRemarks', consumerData.remarks || '');
        setValue('jeName', consumerData.jeName || '');

        // Handle photo fields by checking the separate consumer_images table
        const savedImages = await DatabaseService.getImagesForConsumer(consumerId);
        for (const image of savedImages) {
          // The form field name (e.g., 'polePhoto') might differ from the image_type ('pole_photo')
          // This simple mapping handles the current cases
          if (image.image_type === 'pole_photo') setValue('polePhoto', 'photo_captured');
          if (image.image_type === 'old_meter_photo') setValue('oldMeterPhoto', 'photo_captured');
          if (image.image_type === 'old_meter_kwh_photo') setValue('oldMeterKWHPhoto', 'photo_captured');
          if (image.image_type === 'house_photo') setValue('housePhoto', 'photo_captured');
        }
      } else {
        // No existing data found, fill with dummy data
        console.log(
          'No existing data found for consumer ID:',
          consumerId,
          'filling with dummy data'
        );
        fillDummyData();

        // Pre-fill consumer data passed from ConsumerSelectionScreen
        if (consumerId) {
          setValue('consumerId', consumerId);
        }
        if (consumerName) {
          setValue('consumerName', consumerName);
          setValue('correctConsumerName', consumerName); // Also set as correct name
        }
      }
    } catch (error) {
      console.error('Error loading consumer data:', error);
      // Fall back to dummy data in case of error
      fillDummyData();

      // Pre-fill consumer data passed from ConsumerSelectionScreen
      if (consumerId) {
        setValue('consumerId', consumerId);
      }
      if (consumerName) {
        setValue('consumerName', consumerName);
        setValue('correctConsumerName', consumerName); // Also set as correct name
      }
    }
  }, [consumerId, consumerName, setValue, fillDummyData]);

  // Effect to load existing data or fill dummy data on component mount
  useEffect(() => {
    loadConsumerData();
  }, [consumerId, consumerName]);

  // State for collapsible sections
  const [expandedSections, setExpandedSections] = useState({
    generalInfo: true,
    consumerInfo: false,
    electricalNetwork: false,
    oldMeterDetails: false,
    siteCondition: false,
    networkSignal: false,
    evidence: false,
  });

  // State for in-app console
  const [showConsole, setShowConsole] = useState(false);

  // Toggle section expansion
  const toggleSection = (section) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Get current GPS location
  const getCurrentLocation = async () => {
    try {
      console.log('Getting current location for image capture...');
      
      // Check location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Location permission not granted');
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeout: 10000,
      });

      const { latitude, longitude } = location.coords;
      console.log('Location obtained for image capture:', { latitude, longitude });

      return {
        latitude,
        longitude,
        accuracy: location.coords.accuracy,
        timestamp: new Date(location.timestamp).toISOString(),
      };
    } catch (error) {
      console.error('Get current location failed:', error);
      return null;
    }
  };

  const handlePhotoCapture = async (name, imageSource) => {
    if (!consumerId) {
      console.error('Error', 'Consumer ID is not available. Cannot save image.');
      return;
    }
    try {
      if (!imageSource) {
        console.error('handlePhotoCapture: missing imageSource', { name, imageSource });
        console.error('Error', 'Invalid image source returned from camera.');
        return;
      }

      let gpsCoordinates = null;
      let networkInfo = null;

      // Only capture GPS and Network info for the old meter photo
      if (name === 'old_meter_photo') {
        try {
          console.log('Getting GPS coordinates for old_meter_photo...');
          gpsCoordinates = await getCurrentLocation();
          if (gpsCoordinates) {
            console.log(`GPS coordinates captured for ${name}:`, gpsCoordinates);
          } else {
            console.warn(`No GPS coordinates available for ${name}`);
          }
        } catch (gpsError) {
          console.error('Error getting GPS coordinates:', gpsError);
        }
        
        try {
          console.log('Getting network info for old_meter_photo...');
          networkInfo = await NetworkService.getCaptureNetworkInfo();
          if (networkInfo && networkInfo.cellular) {
            console.log(`Network info captured for ${name}:`, networkInfo.cellular);
          } else {
            console.warn(`No network info available for ${name}`);
          }
        } catch (networkError) {
          console.error('Error getting network info:', networkError);
        }
      }

      let base64Data = '';
      if (typeof imageSource === 'object' && imageSource.base64) {
        base64Data = String(imageSource.base64);
      } else if (typeof imageSource === 'string' && imageSource.startsWith('file://')) {
        try {
          base64Data = await FileSystem.readAsStringAsync(imageSource, { encoding: FileSystem.EncodingType.Base64 });
        } catch (fsErr) {
          console.error('FileSystem read failed', fsErr?.message);
        }
      } else if (typeof imageSource === 'string') {
        base64Data = imageSource;
      }

      setValue(name, 'photo_captured');

      if (base64Data && typeof base64Data === 'string') {
        const result = await DatabaseService.saveConsumerImage(
          consumerId,
          name,
          base64Data,
          gpsCoordinates, // Will be null for other photos
          networkInfo     // Will be null for other photos
        );
        if (!result.success) {
          console.error('Error', `Failed to save image to database: ${result.error || 'Unknown error'}`);
        } else {
          if (gpsCoordinates) {
            setValue('latitude', gpsCoordinates.latitude.toString());
            setValue('longitude', gpsCoordinates.longitude.toString());
          }
        }
      } else {
        console.error('Error', 'Could not process captured image.');
      }
    } catch (e) {
      console.error('Failed to process/save image:', { name, imageSource, error: e?.message });
    }
  };

  // Dropdown options
  const userTypeOptions = ['Family Member', 'Relative', 'Tenant', 'Owner'];
  const categoryOfUseOptions = [
    'Commercial',
    'Domestic',
    'Cold Storage',
    'Hospital',
    'Industry',
    'Multistoried Appartments',
    'Power Loom Small & Medium',
    'Public Institution',
    'School',
    'Telecom Tower',
  ];
  const areaOptions = ['Rural', 'Urban'];
  const connectionStatusOptions = ['Live', 'Temprory Disconnection (TD)'];
  const meteredConsumerOptions = ['Yes', 'No'];
  const meterMakeOptions = [
    'Capital DLMS',
    'L&T',
    'Genus',
    'Avon',
    'HPL',
    'Indotech',
    'LnG',
    'Landis',
  ];
  const meterBoxStatusOptions = ['Yes', 'No'];
  const meterBoxSealingStatusOptions = ['Available', 'Not Available'];
  const clearLineOfSightOptions = ['Yes', 'No'];
  const meterInMetallicEnclosureOptions = ['Yes', 'No'];
  const meterShiftingRequiredOptions = ['Yes', 'No'];
  const armoredServiceCableOptions = ['Yes', 'No'];
  const neutralAvailabilityOptions = ['Yes', 'No'];
  const serviceLineStatusOptions = ['Good', 'Bad', 'Average'];
  const installedServiceCableOptions = ['Yes', 'No'];
  const ltPoleConditionOptions = ['Good', 'Bad', 'Average'];
  const meterLocationOptions = ['Inside', 'Outside', 'Roof', 'Pole'];
  const oldMeterStatusOptions = ['Working', 'Not Available', 'Damaged'];



  const onSubmit = async (data) => {
    // Restore detailed validation logic
    const validation = validateFormCompletion();
    if (!validation.isComplete) {
      const photoFields = validation.missingFields.filter(field =>
        ['polePhoto', 'oldMeterPhoto', 'oldMeterKWHPhoto', 'housePhoto'].includes(field)
      );

      if (photoFields.length > 0) {
        console.warn(
          'Photos Missing',
          `Please capture the following required photos before submitting:\n\n${photoFields.map(field => {
            switch (field) {
              case 'polePhoto': return '• Pole Photo';
              case 'oldMeterPhoto': return '• Old Meter Photo';
              case 'oldMeterKWHPhoto': return '• Old Meter KWH Photo';
              case 'housePhoto': return '• House Photo';
              default: return `• ${field}`;
            }
          }).join('\n')}`
        );
      } else {
        console.warn(
          'Form Incomplete',
          `Please fill all mandatory fields. Missing:\n\n${validation.missingFields.join('\n')}`
        );
      }
      return; // Stop submission
    }

    await execute(async () => {
      // Correctly merge form data with route params to ensure IDs are always present
      const formValues = control._formValues || {};
      const submissionData = { ...route.params, ...formValues };

      const submissionResult = await submitConsumerSurveyGroup(submissionData);

      if (submissionResult.success) {
        await DatabaseService.updateConsumerIndexingStatus(submissionData.consumerId, 'Completed');
        Alert.alert('Success', 'Submitted online successfully', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        await saveConsumerIndexingData(submissionData, 'ToSync', false);
        // Log the technical error for debugging, but show a clean message to the user
        console.error('Submission failed, saved offline:', submissionResult.error);
        Alert.alert('Saved Offline', 'Could not connect to the server. Your data has been saved securely and will be synced later.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    });
  };

  const onFormError = (errors) => {
    console.log('Form validation errors:', errors);
    Alert.alert('Missing Information', 'Please fill all mandatory fields marked with * and fix any errors.');
  };

  // Sync Now action for ToSync records
  const handleSyncNow = async () => {
    await execute(async () => {
      const formValues = control._formValues;
      const submissionResult = await submitConsumerSurveyGroup(formValues);

      if (submissionResult.success) {
        await DatabaseService.updateConsumerIndexingStatus(formValues.consumerId, 'Completed');
        await DatabaseService.updateDashboardCountersFromInstallations();
        Alert.alert('Synced', 'Record synced successfully.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        console.error('Sync Failed', submissionResult.error || 'Server unreachable. Please try again later.');
      }
    });
  };

  const handleSaveDraft = async () => {
    try {
      await execute(async () => {
        // Get form data
        const formData = control._formValues;
  
        // Save as draft
        const result = await saveConsumerIndexingData(formData, 'Draft', true);

        if (result.success) {
          Alert.alert('Draft Saved', 'Consumer indexing data saved as draft!', [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]);
        } else {
          throw new Error(result.error || 'Failed to save draft');
        }
      });
    } catch (error) {
      console.error('Save draft error:', error);
      console.error('Error', 'Failed to save draft. Please try again.');
    }
  };

  // Function to save consumer indexing data to the database
  const saveConsumerIndexingData = async (
    data,
    status = 'ToSync',
    isDraft = false
  ) => {
    try {
      // Find the database record ID from the consumerId
      const consumerRecord = await DatabaseService.db.getFirstAsync(
        'SELECT id FROM consumer_indexing WHERE CONSUMER_ID_M = ?',
        [consumerId]
      );

      if (!consumerRecord?.id) {
        return {
          success: false,
          error: 'Could not find the consumer record in the local database.',
        };
      }

      const dbId = consumerRecord.id;

      // Prepare data for saving
      const dbData = {
        consumer_name: data.correctConsumerName,
        FATHER_HUSBAND_PROPRITEOR_NAME_M: data.correctFatherHusbandName,
        actualUserType: data.actualUserType,
        actualUserName: data.actualUserName,
        actualCategoryOfUse: data.actualCategoryOfUse,
        address: data.actualConsumerAddress,
        area: data.area,
        districtName: data.districtName,
        tehsilName: data.tehsilName,
        block: data.block,
        villageName: data.villageName,
        landmark: data.landmark,
        contact_number: data.verifiedMobileNumber,
        whatsappNumber: data.whatsappNumber,
        pole_number: data.ltPoleCode,
        numberOfConnections: data.numberOfConnections,
        connectionStatus: data.connectionStatus,
        meteredConsumer: data.meteredConsumer,
        correctMeterMake: data.correctMeterMake,
        meter_serial_number: data.correctSerialNumber,
        meterBoxStatus: data.meterBoxStatus,
        meterBoxSealingStatus: data.meterBoxSealingStatus,
        oldMeterStatus: data.oldMeterStatus,
        clearLineOfSight: data.clearLineOfSight,
        meterLocation: data.meterLocation,
        meterInMetallicEnclosure: data.meterInMetallicEnclosure,
        serviceLineStatus: data.serviceLineStatus,
        installedServiceCable: data.installedServiceCable,
        armoredServiceCable: data.armoredServiceCable,
        neutralAvailability: data.neutralAvailability,
        meterShiftingRequired: data.meterShiftingRequired,
        lengthOfCable: data.lengthOfCable,
        ltPoleCondition: data.ltPoleCondition,
        remarks: data.ciRemarks,
        jeName: data.jeName,
        IndexingStatus: isDraft ? 'Draft' : status,
      };

      // Update the record in the database
      const result = await DatabaseService.updateConsumerIndexing(dbId, dbData);

      // Update dashboard counters
      if (result.success) {
        await DatabaseService.updateDashboardCountersFromInstallations();
      }

      return result;
    } catch (error) {
      console.error('Error in saveConsumerIndexingData:', error);
      return { success: false, error: error.message };
    }
  };

  // subscribe to form changes to update progress UI
  const __watchAll = watch?.();
  const formProgress = getFormProgress();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* Remove AppHeader to eliminate "WATTLY" heading */}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 48 : 24}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        >
          <Animated.View style={[styles.content, animatedStyle]}>
            <View style={styles.formContainer}>
              <View style={styles.headerContainer}>
                <TouchableOpacity
                  onPress={() => navigation.goBack()}
                  style={styles.backButton}
                >
                  <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                {/* Make the heading smaller */}
                <Text style={styles.title}>Consumer Indexing</Text>
                {/* Hide progress display for completed forms */}
                {currentStatus !== 'Completed' && (
                  <View style={styles.progressContainer}>
                    <View style={styles.progressChip}>
                      <Text style={styles.progressChipText}>{formProgress}%</Text>
                    </View>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressBarFill, { width: `${formProgress}%` }]} />
                    </View>
                  </View>
                )}
              </View>

              {currentStatus === 'Assigned' && (
                <View style={styles.fillDummyContainer}>
                  <TouchableOpacity
                    onPress={fillDummyData}
                    style={styles.fillDummyPrimaryBtn}
                    activeOpacity={0.9}
                  >
                    <Ionicons name="sparkles" size={18} color={COLORS.background} />
                    <Text style={styles.fillDummyPrimaryText}>Fill Form With Dummy Data</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Remove the subtitle to reduce space */}

              {/* General Information Section (Read Only) - Expanded by default */}
              <CollapsibleSection
                title="General Information"
                sectionKey="generalInfo"
                isExpanded={expandedSections.generalInfo}
                toggleSection={toggleSection}
              >
                <FormInput
                  control={control}
                  name="discom"
                  label="Discom"
                  editable={false}
                  error={errors.discom}
                  placeholder="Discom"
                />

                <FormInput
                  control={control}
                  name="zone"
                  label="Zone"
                  editable={false}
                  error={errors.zone}
                  placeholder="Zone"
                />

                <FormInput
                  control={control}
                  name="circle"
                  label="Circle"
                  editable={false}
                  error={errors.circle}
                  placeholder="Circle"
                />

                <FormInput
                  control={control}
                  name="division"
                  label="Division"
                  editable={false}
                  error={errors.division}
                  placeholder="Division"
                />

                <FormInput
                  control={control}
                  name="subDivision"
                  label="Sub Division"
                  editable={false}
                  error={errors.subDivision}
                  placeholder="Sub Division"
                />
              </CollapsibleSection>

              {/* Consumer Information Section - Expanded by default */}
              <CollapsibleSection
                title="Consumer Information"
                sectionKey="consumerInfo"
                isExpanded={expandedSections.consumerInfo}
                toggleSection={toggleSection}
              >
                <FormInput
                  control={control}
                  name="consumerId"
                  label="Consumer Id"
                  editable={false}
                  error={errors.consumerId}
                  placeholder="Consumer Id"
                />

                <FormInput
                  control={control}
                  name="consumerName"
                  label="Consumer Name"
                  editable={false}
                  error={errors.consumerName}
                  placeholder="Consumer Name"
                />

                <FormInput
                  control={control}
                  name="fatherHusbandName"
                  label="Father Husband Name"
                  editable={false}
                  error={errors.fatherHusbandName}
                  placeholder="Father Husband Name"
                />

                <FormInput
                  control={control}
                  name="sanctionLoad"
                  label="Sanction Load"
                  editable={false}
                  error={errors.sanctionLoad}
                  placeholder="Sanction Load"
                />

                <FormInput
                  control={control}
                  name="consumerAddress"
                  label="Consumer Address"
                  multiline
                  numberOfLines={3}
                  editable={false}
                  error={errors.consumerAddress}
                  placeholder="Consumer Address"
                />

                <FormInput
                  control={control}
                  name="registeredMobile"
                  label="Registered Mobile"
                  keyboardType="phone-pad"
                  error={errors.registeredMobile}
                  editable={false}
                  placeholder="Registered Mobile"
                />

                <FormInput
                  control={control}
                  name="email"
                  label="Email"
                  keyboardType="email-address"
                  error={errors.email}
                  placeholder="Email"
                />

                {/* Mandatory Fields */}
                <FormInput
                  control={control}
                  name="correctConsumerName"
                  label="Correct Consumer Name"
                  required
                  error={errors.correctConsumerName}
                  placeholder="Correct Consumer Name"
                />

                <FormInput
                  control={control}
                  name="correctFatherHusbandName"
                  label="Correct Father Husband Name"
                  required
                  error={errors.correctFatherHusbandName}
                  placeholder="Correct Father Husband Name"
                />

                <FormDropdown
                  control={control}
                  name="actualUserType"
                  label="Actual User Type"
                  options={userTypeOptions}
                  error={errors.actualUserType}
                  required
                />

                <FormInput
                  control={control}
                  name="actualUserName"
                  label="Actual User Name"
                  required
                  error={errors.actualUserName}
                  placeholder="Actual User Name"
                />

                <FormDropdown
                  control={control}
                  name="actualCategoryOfUse"
                  label="Actual Category Of Use"
                  options={categoryOfUseOptions}
                  error={errors.actualCategoryOfUse}
                  required
                />

                <FormInput
                  control={control}
                  name="actualConsumerAddress"
                  label="Actual Consumer Address"
                  multiline
                  numberOfLines={3}
                  required
                  error={errors.actualConsumerAddress}
                  placeholder="Actual Consumer Address"
                />

                <FormDropdown
                  control={control}
                  name="area"
                  label="Area"
                  options={areaOptions}
                  error={errors.area}
                  required
                />

                <FormInput
                  control={control}
                  name="districtName"
                  label="District Name"
                  required
                  error={errors.districtName}
                  placeholder="District Name"
                />

                <FormInput
                  control={control}
                  name="tehsilName"
                  label="Tehsil Name"
                  required
                  error={errors.tehsilName}
                  placeholder="Tehsil Name"
                />

                <FormInput
                  control={control}
                  name="block"
                  label="Block"
                  required
                  error={errors.block}
                  placeholder="Block"
                />

                <FormInput
                  control={control}
                  name="gramPanchayat"
                  label="Gram Panchayat"
                  editable={false}
                  error={errors.gramPanchayat}
                  placeholder="Gram Panchayat"
                />

                <FormInput
                  control={control}
                  name="villageName"
                  label="Village Name"
                  required
                  error={errors.villageName}
                  placeholder="Village Name"
                />

                <FormInput
                  control={control}
                  name="villageCensusCode"
                  label="Village Census Code"
                  editable={false}
                  error={errors.villageCensusCode}
                  placeholder="Village Census Code"
                />

                <FormInput
                  control={control}
                  name="habitation"
                  label="Habitation"
                  editable={false}
                  error={errors.habitation}
                  placeholder="Habitation"
                />

                <FormInput
                  control={control}
                  name="landmark"
                  label="Landmark"
                  required
                  error={errors.landmark}
                  placeholder="Landmark"
                />

                <FormInput
                  control={control}
                  name="verifiedMobileNumber"
                  label="Verified Mobile Number"
                  keyboardType="phone-pad"
                  error={errors.verifiedMobileNumber}
                  placeholder="Verified Mobile Number"
                />

                <FormInput
                  control={control}
                  name="whatsappNumber"
                  label="Whatsapp Number"
                  keyboardType="phone-pad"
                  error={errors.whatsappNumber}
                  placeholder="Whatsapp Number"
                />

                <FormInput
                  control={control}
                  name="govIdDetails"
                  label="Gov Id Details"
                  editable={false}
                  error={errors.govIdDetails}
                  placeholder="Gov Id Details"
                />
              </CollapsibleSection>

              {/* Electrical Network Information Section */}
              <CollapsibleSection
                title="Electrical Network Information"
                sectionKey="electricalNetwork"
                isExpanded={expandedSections.electricalNetwork}
                toggleSection={toggleSection}
              >
                <FormInput
                  control={control}
                  name="subStationCode"
                  label="Sub Station Code"
                  editable={false}
                  error={errors.subStationCode}
                  placeholder="Sub Station Code"
                />

                <FormInput
                  control={control}
                  name="subStationName"
                  label="Sub Station Name"
                  editable={false}
                  error={errors.subStationName}
                  placeholder="Sub Station Name"
                />

                <FormInput
                  control={control}
                  name="feederCode"
                  label="Feeder Code"
                  editable={false}
                  error={errors.feederCode}
                  placeholder="Feeder Code"
                />

                <FormInput
                  control={control}
                  name="feederName"
                  label="Feeder Name"
                  editable={false}
                  error={errors.feederName}
                  placeholder="Feeder Name"
                />

                <FormInput
                  control={control}
                  name="dtrCode"
                  label="Dtr Code"
                  editable={false}
                  error={errors.dtrCode}
                  placeholder="Dtr Code"
                />

                <FormInput
                  control={control}
                  name="dtrName"
                  label="Dtr Name"
                  editable={false}
                  error={errors.dtrName}
                  placeholder="Dtr Name"
                />

                <FormInput
                  control={control}
                  name="ltPoleCode"
                  label="Lt Pole Code"
                  required
                  error={errors.ltPoleCode}
                  placeholder="Lt Pole Code"
                />

                <PhotoCapture
                  control={control}
                  name="polePhoto"
                  label="Pole Photo"
                  required
                  error={errors.polePhoto}
                  onPhotoCapture={(base64) => handlePhotoCapture('pole_photo', base64)}
                />
              </CollapsibleSection>

              {/* Old Meter Details Section */}
              <CollapsibleSection
                title="Old Meter Details"
                sectionKey="oldMeterDetails"
                isExpanded={expandedSections.oldMeterDetails}
                toggleSection={toggleSection}
              >
                <FormInput
                  control={control}
                  name="categoryInMasterData"
                  label="Category In Master Data"
                  editable={false}
                  error={errors.categoryInMasterData}
                  placeholder="Category In Master Data"
                />

                <FormInput
                  control={control}
                  name="subCategoryCode"
                  label="Sub Category Code"
                  editable={false}
                  error={errors.subCategoryCode}
                  placeholder="Sub Category Code"
                />

                <FormInput
                  control={control}
                  name="oldMeterNumber"
                  label="Old Meter Number"
                  editable={false}
                  error={errors.oldMeterNumber}
                  placeholder="Old Meter Number"
                />

                <FormInput
                  control={control}
                  name="oldMeterPhase"
                  label="Old Meter Phase"
                  editable={false}
                  error={errors.oldMeterPhase}
                  placeholder="Old Meter Phase"
                />

                <FormInput
                  control={control}
                  name="oldMF"
                  label="Old Mf"
                  editable={false}
                  error={errors.oldMF}
                  placeholder="Old Mf"
                />

                <FormInput
                  control={control}
                  name="billingType"
                  label="Billing Type"
                  editable={false}
                  error={errors.billingType}
                  placeholder="Billing Type"
                />

                <FormInput
                  control={control}
                  name="latitude"
                  label="Latitude"
                  editable={false}
                  error={errors.latitude}
                  placeholder="Latitude"
                />

                <FormInput
                  control={control}
                  name="longitude"
                  label="Longitude"
                  editable={false}
                  error={errors.longitude}
                  placeholder="Longitude"
                />

                <FormInput
                  control={control}
                  name="oldMeterBadgeNumber"
                  label="Old Meter Badge Number"
                  editable={false}
                  error={errors.oldMeterBadgeNumber}
                  placeholder="Old Meter Badge Number"
                />

                <FormInput
                  control={control}
                  name="meterMake"
                  label="Meter Make"
                  editable={false}
                  error={errors.meterMake}
                  placeholder="Meter Make"
                />

                <FormInput
                  control={control}
                  name="connectedLoad"
                  label="Connected Load"
                  editable={false}
                  error={errors.connectedLoad}
                  placeholder="Connected Load"
                />

                <FormInput
                  control={control}
                  name="oldConsNo"
                  label="Old Cons No"
                  error={errors.oldConsNo}
                  placeholder="Old Cons No"
                />

                <FormInput
                  control={control}
                  name="readingDigits"
                  label="Reading Digits"
                  error={errors.readingDigits}
                  placeholder="Reading Digits"
                />

                <FormInput
                  control={control}
                  name="tdcFlag"
                  label="Tdc Flag"
                  error={errors.tdcFlag}
                  placeholder="Tdc Flag"
                />

                <FormInput
                  control={control}
                  name="maximumDemand"
                  label="Maximum Demand"
                  error={errors.maximumDemand}
                  placeholder="Maximum Demand"
                />

                <FormInput
                  control={control}
                  name="meterReadingSequence"
                  label="Meter Reading Sequence"
                  error={errors.meterReadingSequence}
                  placeholder="Meter Reading Sequence"
                />

                <FormInput
                  control={control}
                  name="numberOfConnections"
                  label="Number Of Connections"
                  required
                  error={errors.numberOfConnections}
                  placeholder="Number Of Connections"
                />

                <FormDropdown
                  control={control}
                  name="connectionStatus"
                  label="Connection Status"
                  options={connectionStatusOptions}
                  error={errors.connectionStatus}
                  required
                />

                <FormDropdown
                  control={control}
                  name="meteredConsumer"
                  label="Metered Consumer"
                  options={meteredConsumerOptions}
                  error={errors.meteredConsumer}
                  required
                />

                <FormDropdown
                  control={control}
                  name="correctMeterMake"
                  label="Correct Meter Make"
                  options={meterMakeOptions}
                  error={errors.correctMeterMake}
                  required
                />

                <FormInput
                  control={control}
                  name="correctSerialNumber"
                  label="Correct Serial Number"
                  required
                  error={errors.correctSerialNumber}
                  placeholder="Correct Serial Number"
                />
              </CollapsibleSection>

              {/* Site & Service Condition Section */}
              <CollapsibleSection
                title="Site And Service Condition"
                sectionKey="siteServiceCondition"
                isExpanded={expandedSections.siteServiceCondition}
                toggleSection={toggleSection}
              >
                <FormDropdown
                  control={control}
                  name="meterBoxStatus"
                  label="Meter Box Status"
                  options={meterBoxStatusOptions}
                  error={errors.meterBoxStatus}
                  required
                />

                <FormDropdown
                  control={control}
                  name="meterBoxSealingStatus"
                  label="Meter Box Sealing Status"
                  options={meterBoxSealingStatusOptions}
                  error={errors.meterBoxSealingStatus}
                  required
                />

                <FormDropdown
                  control={control}
                  name="oldMeterStatus"
                  label="Old Meter Status"
                  options={oldMeterStatusOptions}
                  error={errors.oldMeterStatus}
                  required
                />

                <FormDropdown
                  control={control}
                  name="clearLineOfSight"
                  label="Clear Line Of Sight"
                  options={clearLineOfSightOptions}
                  error={errors.clearLineOfSight}
                  required
                />

                <FormDropdown
                  control={control}
                  name="meterLocation"
                  label="Meter Location"
                  options={meterLocationOptions}
                  error={errors.meterLocation}
                  required
                />

                <FormDropdown
                  control={control}
                  name="meterInMetallicEnclosure"
                  label="Meter In Metallic Enclosure"
                  options={meterInMetallicEnclosureOptions}
                  error={errors.meterInMetallicEnclosure}
                  required
                />

                <FormInput
                  control={control}
                  name="oldMeterReadingMD"
                  label="Old Meter Reading Md"
                  error={errors.oldMeterReadingMD}
                  placeholder="Old Meter Reading Md"
                />

                <FormDropdown
                  control={control}
                  name="serviceLineStatus"
                  label="Service Line Status"
                  options={serviceLineStatusOptions}
                  error={errors.serviceLineStatus}
                  required
                />

                <FormDropdown
                  control={control}
                  name="installedServiceCable"
                  label="Installed Service Cable"
                  options={installedServiceCableOptions}
                  error={errors.installedServiceCable}
                  required
                />

                <FormDropdown
                  control={control}
                  name="conditionOfInstalledServiceCable"
                  label="Condition Of Installed Service Cable"
                  options={[
                    { label: 'Good', value: 'Good' },
                    { label: 'Average', value: 'Average' },
                    { label: 'Poor', value: 'Poor' },
                    { label: 'Damaged', value: 'Damaged' },
                    { label: 'Needs Replacement', value: 'Needs Replacement' },
                  ]}
                  error={errors.conditionOfInstalledServiceCable}
                  required
                />

                <FormDropdown
                  control={control}
                  name="armoredServiceCable"
                  label="Armored Service Cable"
                  options={armoredServiceCableOptions}
                  error={errors.armoredServiceCable}
                  required
                />

                <FormDropdown
                  control={control}
                  name="neutralAvailability"
                  label="Neutral Availability"
                  options={neutralAvailabilityOptions}
                  error={errors.neutralAvailability}
                  required
                />

                <FormDropdown
                  control={control}
                  name="meterShiftingRequired"
                  label="Meter Shifting Required"
                  options={meterShiftingRequiredOptions}
                  error={errors.meterShiftingRequired}
                  required
                />

                <FormInput
                  control={control}
                  name="lengthOfCable"
                  label="Length Of Cable"
                  required
                  error={errors.lengthOfCable}
                  placeholder="Length Of Cable"
                />

                <FormDropdown
                  control={control}
                  name="ltPoleCondition"
                  label="Lt Pole Condition"
                  options={ltPoleConditionOptions}
                  error={errors.ltPoleCondition}
                  required
                />
              </CollapsibleSection>

              {/* Network Signal Strength Section */}
              <CollapsibleSection
                title="Network Signal Strength"
                sectionKey="networkSignal"
                isExpanded={expandedSections.networkSignal}
                toggleSection={toggleSection}
              >
                <FormInput
                  control={control}
                  name="sim1NetworkProvider"
                  label="Sim1 Network Provider"
                  editable={false}
                  error={errors.sim1NetworkProvider}
                  placeholder="Sim1 Network Provider"
                />

                <FormInput
                  control={control}
                  name="sim1SignalStrength"
                  label="Sim1 Signal Strength"
                  editable={false}
                  error={errors.sim1SignalStrength}
                  placeholder="Sim1 Signal Strength"
                />

                <FormInput
                  control={control}
                  name="sim1SignalLevel"
                  label="Sim1 Signal Level"
                  editable={false}
                  error={errors.sim1SignalLevel}
                  placeholder="Sim1 Signal Level"
                />

                <FormInput
                  control={control}
                  name="sim1SignalType"
                  label="Sim1 Signal Type"
                  editable={false}
                  error={errors.sim1SignalType}
                  placeholder="Sim1 Signal Type"
                />

                <FormInput
                  control={control}
                  name="sim1Category"
                  label="Sim1 Category"
                  editable={false}
                  error={errors.sim1Category}
                  placeholder="Sim1 Category"
                />

                <FormInput
                  control={control}
                  name="sim1RSSI"
                  label="Sim1 Rssi"
                  editable={false}
                  error={errors.sim1RSSI}
                  placeholder="Sim1 Rssi"
                />

                <FormInput
                  control={control}
                  name="sim1RSRP"
                  label="Sim1 Rsrp"
                  editable={false}
                  error={errors.sim1RSRP}
                  placeholder="Sim1 Rsrp"
                />

                <FormInput
                  control={control}
                  name="sim1SNR"
                  label="Sim1 Snr"
                  editable={false}
                  error={errors.sim1SNR}
                  placeholder="Sim1 Snr"
                />

                <FormInput
                  control={control}
                  name="sim1CellId"
                  label="Sim1 Cell Id"
                  editable={false}
                  error={errors.sim1CellId}
                  placeholder="Sim1 Cell Id"
                />

                <FormInput
                  control={control}
                  name="sim2NetworkProvider"
                  label="Sim2 Network Provider"
                  editable={false}
                  error={errors.sim2NetworkProvider}
                  placeholder="Sim2 Network Provider"
                />

                <FormInput
                  control={control}
                  name="sim2SignalStrength"
                  label="Sim2 Signal Strength"
                  editable={false}
                  error={errors.sim2SignalStrength}
                  placeholder="Sim2 Signal Strength"
                />

                <FormInput
                  control={control}
                  name="sim2SignalLevel"
                  label="Sim2 Signal Level"
                  editable={false}
                  error={errors.sim2SignalLevel}
                  placeholder="Sim2 Signal Level"
                />

                <FormInput
                  control={control}
                  name="sim2SignalType"
                  label="Sim2 Signal Type"
                  editable={false}
                  error={errors.sim2SignalType}
                  placeholder="Sim2 Signal Type"
                />

                <FormInput
                  control={control}
                  name="sim2Category"
                  label="Sim2 Category"
                  editable={false}
                  error={errors.sim2Category}
                  placeholder="Sim2 Category"
                />

                <FormInput
                  control={control}
                  name="sim2RSSI"
                  label="Sim2 Rssi"
                  editable={false}
                  error={errors.sim2RSSI}
                  placeholder="Sim2 Rssi"
                />

                <FormInput
                  control={control}
                  name="sim2RSRP"
                  label="Sim2 Rsrp"
                  editable={false}
                  error={errors.sim2RSRP}
                  placeholder="Sim2 Rsrp"
                />

                <FormInput
                  control={control}
                  name="sim2SNR"
                  label="Sim2 Snr"
                  editable={false}
                  error={errors.sim2SNR}
                  placeholder="Sim2 Snr"
                />

                <FormInput
                  control={control}
                  name="sim2CellId"
                  label="Sim2 Cell Id"
                  editable={false}
                  error={errors.sim2CellId}
                  placeholder="Sim2 Cell Id"
                />
              </CollapsibleSection>

              {/* Evidence & Finalization Section */}
              <CollapsibleSection
                title="Evidence And Finalization"
                sectionKey="evidenceFinalization"
                isExpanded={expandedSections.evidenceFinalization}
                toggleSection={toggleSection}
              >
                <FormInput
                  control={control}
                  name="ciRemarks"
                  label="Ci Remarks"
                  multiline
                  numberOfLines={3}
                  required
                  error={errors.ciRemarks}
                  placeholder="Ci Remarks"
                />

                <FormInput
                  control={control}
                  name="jeName"
                  label="Je Name"
                  required
                  error={errors.jeName}
                  placeholder="Je Name"
                />

                <PhotoCapture
                  control={control}
                  name="oldMeterPhoto"
                  label="Old Meter Photo"
                  required
                  error={errors.oldMeterPhoto}
                                                      onPhotoCapture={(base64) =>
                                                        handlePhotoCapture('old_meter_photo', base64)
                                                      }                />

                <PhotoCapture
                  control={control}
                  name="oldMeterKWHPhoto"
                  label="Old Meter Kwh Photo"
                  required
                  error={errors.oldMeterKWHPhoto}
                                                      onPhotoCapture={(base64) =>
                                                        handlePhotoCapture('old_meter_kwh_photo', base64)
                                                      }                />

                <PhotoCapture 
                  control={control}
                  name="housePhoto" 
                  label="House Photo" 
                  required
                  error={errors.housePhoto}
                  onPhotoCapture={(base64) => handlePhotoCapture('house_photo', base64)}
                />
              </CollapsibleSection>
            </View>
          </Animated.View>
        </ScrollView>

        {currentStatus === 'ToSync' ? (
          <View style={styles.buttonContainer}>
            <Button
              title="Sync Now"
              onPress={handleSyncNow}
              style={styles.submitButton}
              disabled={loading}
              loading={loading}
            />
          </View>
        ) : currentStatus === 'Completed' ? (
          // No buttons for completed forms - read-only view
          <View style={styles.completedContainer}>
            <View style={styles.completedBadge}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
              <Text style={styles.completedText}>Form Completed</Text>
            </View>
          </View>
        ) : (
          <View style={styles.buttonContainer}>
            <Button
              title="Save Draft"
              onPress={handleSaveDraft}
              variant="outline"
              style={styles.draftButton}
              disabled={loading}
            />
            <Button
              title="Submit"
              onPress={handleFormSubmit(onSubmit, onFormError)}
              style={styles.submitButton}
              disabled={loading}
              loading={loading}
            />
          </View>
        )}
      </KeyboardAvoidingView>
      
      {/* Floating Console Button */}
      <TouchableOpacity
        style={styles.floatingConsoleButton}
        onPress={() => setShowConsole(true)}
      >
        <Text style={styles.floatingConsoleText}>📱</Text>
      </TouchableOpacity>
      
      {/* In-App Console */}
      <InAppConsoleComponent
        visible={showConsole}
        onClose={() => setShowConsole(false)}
      />
    </SafeAreaView>
  );
}

// Styles for consistent UI with black and white theme
const styles = StyleSheet.create({
  backButton: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    marginRight: SPACING.sm,
    padding: SPACING.xs,
  },
  buttonContainer: {
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  collapsibleContent: {
    padding: SPACING.md,
  },
  collapsibleHeader: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: SPACING.md,
  },
  collapsibleTitle: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
  },
  sectionStatusBadge: {
    backgroundColor: COLORS.infoLight,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    marginRight: SPACING.sm,
  },
  sectionStatusText: {
    color: COLORS.info,
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
  },
  container: {
    backgroundColor: COLORS.background,
    flex: 1,
  },
  content: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    flex: 1,
    marginTop: -12,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },
  draftButton: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  dropdownContainer: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 40,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  dropdownText: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSizes.base,
  },
  formContainer: {
    flex: 1,
  },
  headerContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.sm,
    paddingTop: SPACING.sm,
  },
  inputContainer: {
    marginBottom: SPACING.sm,
  },
  inputField: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSizes.base,
    minHeight: 44,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm, // Minimum touch target size
  },
  inputLabel: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
    marginBottom: SPACING.xs,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  photoContainer: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: 80,
    padding: SPACING.lg,
  },
  photoText: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSizes.base,
    marginLeft: SPACING.md,
  },
  requiredIndicator: {
    color: COLORS.error,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: SPACING.xl,
  },
  scrollView: {
    flex: 1,
  },
  sectionContainer: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    elevation: 2,
    marginBottom: SPACING.sm,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionHeader: {
    borderBottomColor: COLORS.border,
    borderBottomWidth: 1,
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    marginBottom: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  submitButton: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSizes.xl, // Smaller font size
    fontWeight: TYPOGRAPHY.fontWeights.bold,
    marginBottom: 0,
  },
  fillDummyPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginHorizontal: SPACING.sm,
    marginBottom: SPACING.md,
  },
  fillDummyPrimaryText: {
    color: COLORS.background,
    fontSize: TYPOGRAPHY.fontSizes.base,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
  },
  floatingConsoleButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    zIndex: 1000,
  },
  floatingConsoleText: {
    fontSize: 20,
    color: '#fff',
  },
  progressContainer: {
    alignItems: 'center',
    flex: 1,
    marginLeft: SPACING.md,
  },
  progressChip: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    marginBottom: SPACING.xs,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  progressChipText: {
    color: COLORS.background,
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: TYPOGRAPHY.fontWeights.bold,
  },
  progressBar: {
    backgroundColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    height: 6,
    width: '100%',
    overflow: 'hidden',
  },
  progressBarFill: {
    backgroundColor: COLORS.success,
    height: '100%',
    borderRadius: BORDER_RADIUS.sm,
  },
  completedContainer: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    paddingBottom: SPACING.lg,
    alignItems: 'center',
  },
  completedBadge: {
    backgroundColor: COLORS.successLight,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  completedText: {
    color: COLORS.success,
    fontSize: TYPOGRAPHY.fontSizes.base,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    marginLeft: SPACING.sm,
  },
});
