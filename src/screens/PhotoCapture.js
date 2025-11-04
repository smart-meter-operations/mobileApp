import React, { useState, useRef, useEffect } from 'react';

import { View, Text, TouchableOpacity, Image, Alert, StyleSheet, Platform } from 'react-native';
import { Controller } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import Constants from 'expo-constants';
import ViewShot from 'react-native-view-shot';
import * as Location from 'expo-location';

import ImageViewerModal from './ImageViewerModal';
import { applyWatermark } from '../services/imageUtils';
import appConfig from '../services/appConfig';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../constants';
import NetworkService from '../services/networkService';

// Helper to check if a value is a valid image URI
const isImageUri = (value) => {
  return value && typeof value === 'string' && value.startsWith('file://');
};

// Helper to check if an operation is in progress
const isProcessing = (value) => {
  return value === 'capturing' || value === 'processing';
};

const PhotoCapture = ({
  control,
  name,
  label,
  required = false,
  style = {},
  watermarkData = {},
  onPhotoCapture,
}) => {
  const [viewerVisible, setViewerVisible] = useState(false);
  // ViewShot-based watermark composer (Expo Go compatible)
  const viewShotRef = useRef(null);
  const [composeSourceUri, setComposeSourceUri] = useState(null);
  const [composeText, setComposeText] = useState('');
  const [composeSize, setComposeSize] = useState({ width: 0, height: 0 });
  const pendingResolveRef = useRef(null);
  const [imageReady, setImageReady] = useState(false);
  const [processingNote, setProcessingNote] = useState('');

  // When a source is set, wait for layout and capture
  useEffect(() => {
    const tryCapture = async () => {
      if (!composeSourceUri || !viewShotRef.current || !imageReady) return;
      try {
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        const uri = await viewShotRef.current.capture?.({
          format: 'jpg',
          quality: 0.9,
          result: 'tmpfile',
        });
        if (pendingResolveRef.current) {
          pendingResolveRef.current(uri);
          pendingResolveRef.current = null;
        }
      } catch (err) {
        console.error('ViewShot capture failed:', err);
        if (pendingResolveRef.current) {
          pendingResolveRef.current(null);
          pendingResolveRef.current = null;
        }
      } finally {
        setComposeSourceUri(null);
        setComposeText('');
        setComposeSize({ width: 0, height: 0 });
        setImageReady(false);
      }
    };
    tryCapture();
  }, [composeSourceUri, imageReady]);

  const handleCapture = async (onChange) => {
    try {
      const t0 = Date.now();
      console.log(`[WM] ${new Date().toISOString()} - Capture start`);
      onChange('capturing');

      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is required to take photos.', [{ text: 'OK', onPress: () => onChange('') }]);
        return;
      }

      const result = await Promise.race([
        ImagePicker.launchCameraAsync({ allowsEditing: false, quality: 0.2, base64: false }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Camera timeout')), 30000)),
      ]);
      console.log(`[WM] ${new Date().toISOString()} - Camera returned in ${Date.now() - t0} ms`);

      if (!result.canceled && result?.assets?.[0]?.uri) {
        const asset = result.assets[0];
        onChange('processing');
        setProcessingNote('Processing image...');
        const tMoveStart = Date.now();

        const imageDirectory = FileSystem.documentDirectory + 'images/';
        await FileSystem.makeDirectoryAsync(imageDirectory, { intermediates: true });
        const permanentUri = imageDirectory + `${name}_${Date.now()}.jpg`;

        await FileSystem.moveAsync({ from: asset.uri, to: permanentUri });
        console.log(`[WM] ${new Date().toISOString()} - File moved in ${Date.now() - tMoveStart} ms`);

        let watermarkedUri = permanentUri;
        if (appConfig.features.watermark) {
          let watermarkText = '';
          let wmOptions = {};

          if (name === 'oldMeterPhoto') {
            // Build 4-line red bold bottom-left watermark with Consumer ID, Address, Lat/Long, GSM dBm
            try {
              const tGpsStart = Date.now();
              setProcessingNote('Capturing GPS...');
              // Request location permission and get coordinates (optimized)
              let lat = 'N/A';
              let lng = 'N/A';
              try {
                const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
                if (locStatus === 'granted') {
                  // Try last known fast
                  const last = await Location.getLastKnownPositionAsync();
                  if (last?.coords) {
                    lat = Number(last.coords.latitude)?.toFixed(6) || lat;
                    lng = Number(last.coords.longitude)?.toFixed(6) || lng;
                  } else {
                    // Balance speed and accuracy with a timeout
                    const pos = await Promise.race([
                      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced, mayShowUserSettingsDialog: false }),
                      new Promise((_, reject) => setTimeout(() => reject(new Error('gps_timeout')), 5000)),
                    ]);
                    if (pos?.coords) {
                      lat = Number(pos.coords.latitude)?.toFixed(6) || lat;
                      lng = Number(pos.coords.longitude)?.toFixed(6) || lng;
                    }
                  }
                }
              } catch (geoErr) {
                // Fallback to provided location if available
                lat = Number(watermarkData?.location?.latitude)?.toFixed(6) || lat;
                lng = Number(watermarkData?.location?.longitude)?.toFixed(6) || lng;
              }
              console.log(`[WM] ${new Date().toISOString()} - GPS captured in ${Date.now() - tGpsStart} ms`);

              // Get GSM RSSI dBm via NetworkService; default to standard -85 dBm if unavailable (optimized)
              const tNetStart = Date.now();
              setProcessingNote('Capturing network info...');
              let rssiDbm = '-85';
              try {
                const cellular = await NetworkService.getDetailedCellularInfo();
                const val = cellular?.sim1RSSI;
                if (val !== undefined && val !== null && !Number.isNaN(Number(val))) {
                  rssiDbm = String(val);
                }
              } catch (nerr) {}
              console.log(`[WM] ${new Date().toISOString()} - Network info captured in ${Date.now() - tNetStart} ms`);

              const consumerId = watermarkData?.consumerId || 'N/A';
              const consumerAddress = watermarkData?.consumerAddress || 'N/A';

              // Add icons at the start of each line (emoji for compatibility across native and ViewShot)
              watermarkText = `🆔 Consumer Id: ${consumerId}\n🏠 Address: ${consumerAddress}\n📍 Lat: ${lat}  Long: ${lng}\n📶 GSM: ${rssiDbm} dBm`;
              // 4x font size for native watermarking
              wmOptions = {
                position: 'bottomLeft',
                color: '#FF0000',
                fontName: 'Arial-BoldMT',
                fontSize: 112,
                X: -20,
                Y: -20,
                shadowStyle: { dx: 2, dy: 2, radius: 3, color: '#00000080' },
              };
            } catch (specialErr) {
              console.warn('Failed building old meter watermark, using default format:', specialErr?.message);
            }
          }

          if (!watermarkText) {
            // Default watermark per appConfig
            const { userName = 'N/A', userId = 'N/A', location } = watermarkData;
            const now = new Date();
            const dateTime = `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
            const lat = Number(location?.latitude)?.toFixed(4) || 'N/A';
            const lng = Number(location?.longitude)?.toFixed(4) || 'N/A';
            watermarkText = appConfig.watermark.format
              .replace('{userName}', userName)
              .replace('{userId}', userId)
              .replace('{dateTime}', dateTime)
              .replace('{lat}', lat)
              .replace('{lng}', lng);
          }

          // Compose with ViewShot when running in Expo or when old meter photo requires semi-transparent background
          if (Constants?.appOwnership === 'expo' || name === 'oldMeterPhoto') {
            try {
              // Measure original image to preserve size
              await new Promise((resolveMeasure) => {
                Image.getSize(permanentUri, (w, h) => {
                  setComposeSize({ width: w, height: h });
                  resolveMeasure();
                }, () => resolveMeasure());
              });

              setProcessingNote('Composing watermark...');
              const tComposeStart = Date.now();
              const composed = await new Promise((resolve) => {
                pendingResolveRef.current = resolve;
                setComposeText(watermarkText);
                setComposeSourceUri(permanentUri);
                setImageReady(false);
              });

              if (composed) {
                watermarkedUri = composed;
                console.log(`[WM] ${new Date().toISOString()} - ViewShot composition in ${Date.now() - tComposeStart} ms`);
              } else {
                console.warn('ViewShot composition returned null, falling back to original');
              }
            } catch (err) {
              console.error('Expo Go watermark composition failed:', err);
            }
          } else {
            // Native path
            const tComposeStart = Date.now();
            watermarkedUri = await applyWatermark(permanentUri, watermarkText, wmOptions);
            console.log(`[WM] ${new Date().toISOString()} - Native composition in ${Date.now() - tComposeStart} ms`);
          }
        }

        setProcessingNote('Saving data...');
        const tSaveStart = Date.now();
        await onPhotoCapture(name, watermarkedUri);
        console.log(`[WM] ${new Date().toISOString()} - Saved in ${Date.now() - tSaveStart} ms; Total ${Date.now() - t0} ms`);
        onChange(watermarkedUri);
        setProcessingNote('');
      } else {
        onChange(''); // Reset on cancellation
      }
    } catch (e) {
      console.error('Image capture failed:', e);
      Alert.alert('Capture Error', e.message || 'Failed to capture image. Please try again.', [{ text: 'OK', onPress: () => onChange('') }]);
    }
  };

  return (
    <View style={[styles.inputContainer, style]}>
      <Text style={styles.inputLabel}>
        {label} {required && <Text style={styles.requiredIndicator}>*</Text>}
      </Text>
      <Controller
        control={control}
        name={name}
        rules={required ? { required: 'Photo is required' } : {}}
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <>
            <View style={[styles.photoCaptureContainer, error && { borderColor: COLORS.error }]}>
              {isImageUri(value) ? (
                <View style={styles.photoCapturedView}>
                  <TouchableOpacity onPress={() => setViewerVisible(true)}>
                    <Image source={{ uri: value }} style={styles.thumbnail} />
                  </TouchableOpacity>
                  <View style={styles.photoInfo}>
                    <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                    <Text style={styles.photoText}>Photo Captured</Text>
                  </View>
                  <View style={styles.photoActions}>
                    <TouchableOpacity style={styles.photoActionButton} onPress={() => setViewerVisible(true)}>
                      <Ionicons name="eye-outline" size={24} color={COLORS.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.photoActionButton} onPress={() => handleCapture(onChange)}>
                      <Ionicons name="camera-reverse-outline" size={24} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.photoContainer}
                  disabled={isProcessing(value)}
                  onPress={() => handleCapture(onChange)}
                >
                  <Ionicons
                    name={isProcessing(value) ? 'hourglass-outline' : 'camera-outline'}
                    size={24}
                    color={COLORS.textSecondary}
                  />
                  <Text style={styles.photoText}>
                    {value === 'capturing' ? 'Opening Camera...' :
                     value === 'processing' ? (processingNote || 'Processing image, capturing details...') :
                     'Tap to Capture Photo'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            {error && <Text style={styles.errorText}>{error.message}</Text>}
            <ImageViewerModal visible={viewerVisible} imageUri={isImageUri(value) ? value : null} onClose={() => setViewerVisible(false)} />

            {/* Hidden composer for Expo Go watermarking */}
            {composeSourceUri ? (
              <View
                style={{ position: 'absolute', top: -10000, left: -10000, opacity: 1 }}
                pointerEvents="none"
                collapsable={false}
                renderToHardwareTextureAndroid
              >
                <ViewShot
                  ref={viewShotRef}
                  style={{ width: composeSize.width || 1000, height: composeSize.height || 1000, backgroundColor: 'transparent' }}
                  options={{ format: 'jpg', quality: 0.95, result: 'tmpfile' }}
                  collapsable={false}
                >
                  <View style={{ flex: 1 }} collapsable={false} renderToHardwareTextureAndroid>
                    <Image
                      source={{ uri: composeSourceUri }}
                      style={{ width: composeSize.width || '100%', height: composeSize.height || '100%', resizeMode: 'cover' }}
                      onLoad={() => setImageReady(true)}
                    />
                    <View style={{ position: 'absolute', left: 16, bottom: 16 }}>
                      <View style={{ backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 8 }}>
                        <Text style={{ color: '#FF0000', fontSize: (name === 'oldMeterPhoto' ? 72 : 18), fontWeight: 'bold', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 3 }}>{composeText}</Text>
                      </View>
                    </View>
                  </View>
                </ViewShot>
              </View>
            ) : null}
          </>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    marginBottom: SPACING.sm,
  },
  inputLabel: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
    marginBottom: SPACING.xs,
  },
  requiredIndicator: {
    color: COLORS.error,
  },
  photoCaptureContainer: {
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    minHeight: 80,
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
  },
  photoContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  photoCapturedView: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.border,
  },
  photoInfo: {
    flex: 1,
    marginLeft: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  photoText: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSizes.base,
    marginLeft: SPACING.md,
  },
  photoActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  photoActionButton: {
    padding: SPACING.sm,
    marginLeft: SPACING.xs,
  },
  errorText: {
    color: COLORS.error,
    fontSize: TYPOGRAPHY.fontSizes.sm,
    marginTop: SPACING.xs,
    marginLeft: SPACING.xs,
  },
});

export default PhotoCapture;