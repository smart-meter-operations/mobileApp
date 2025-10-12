import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Import components and styles
import { COLORS, SPACING, TYPOGRAPHY } from '../constants';

const MeterInfoScreen = ({ navigation, route }) => {
  const { photoUri, locationData, networkData } = route.params || {};
  
  const [ocrProcessing, setOcrProcessing] = useState(false);
  const [ocrResults, setOcrResults] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  // Simulate OCR processing when screen loads
  useEffect(() => {
    if (photoUri) {
      processOcr();
    }
  }, [photoUri]);

  const processOcr = async () => {
    setOcrProcessing(true);
    
    try {
      // Simulate OCR processing delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Mock OCR results - in a real implementation, this would call an OCR service
      const mockResults = {
        meterNumber: 'MTR123456789',
        reading: '12345.67',
        units: 'kWh',
        date: '2025-10-07',
        time: '14:30:25',
        meterType: 'Single Phase',
        manufacturer: 'L&T',
        accuracyClass: '2.0',
        maxCurrent: '60A',
        voltage: '230V'
      };
      
      setOcrResults(mockResults);
    } catch (error) {
      console.error('OCR processing failed:', error);
      Alert.alert('Error', 'Failed to process meter information');
    } finally {
      setOcrProcessing(false);
    }
  };

  const copyToClipboard = (text, fieldName) => {
    Clipboard.setString(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
    Alert.alert('Copied', `${fieldName} copied to clipboard`);
  };

  const showError = (message) => {
    Alert.alert('Error', message, [{ text: 'OK' }]);
  };

  const renderOcrResults = () => {
    if (!ocrResults) return null;

    const fields = [
      { label: 'Meter Number', value: ocrResults.meterNumber, key: 'meterNumber' },
      { label: 'Current Reading', value: `${ocrResults.reading} ${ocrResults.units}`, key: 'reading' },
      { label: 'Reading Date', value: ocrResults.date, key: 'date' },
      { label: 'Reading Time', value: ocrResults.time, key: 'time' },
      { label: 'Meter Type', value: ocrResults.meterType, key: 'meterType' },
      { label: 'Manufacturer', value: ocrResults.manufacturer, key: 'manufacturer' },
      { label: 'Accuracy Class', value: ocrResults.accuracyClass, key: 'accuracyClass' },
      { label: 'Max Current', value: ocrResults.maxCurrent, key: 'maxCurrent' },
      { label: 'Voltage', value: ocrResults.voltage, key: 'voltage' }
    ];

    return (
      <View style={styles.resultsContainer}>
        <Text style={styles.sectionTitle}>Extracted Meter Information</Text>
        
        {fields.map((field, index) => (
          <View key={field.key} style={styles.fieldContainer}>
            <View style={styles.fieldLabelContainer}>
              <Text style={styles.fieldLabel}>{field.label}</Text>
            </View>
            <View style={styles.fieldValueContainer}>
              <Text style={styles.fieldValue}>{field.value}</Text>
              <TouchableOpacity 
                style={styles.copyButton}
                onPress={() => copyToClipboard(field.value, field.label)}
              >
                <Ionicons 
                  name={copiedField === field.label ? "checkmark" : "copy-outline"} 
                  size={20} 
                  color={COLORS.primary} 
                />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    );
  };

  // Render loading state
  if (ocrProcessing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Extracting meter information...</Text>
          <Text style={styles.loadingSubtext}>This may take a few moments</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Render main screen
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Meter Information</Text>
        </View>

        {/* Captured Image */}
        {photoUri && (
          <View style={styles.imageContainer}>
            <Text style={styles.sectionTitle}>Captured Meter</Text>
            <Image
              source={{ uri: photoUri }}
              style={styles.capturedImage}
              resizeMode="contain"
            />
          </View>
        )}

        {/* OCR Results */}
        {ocrResults ? renderOcrResults() : (
          <View style={styles.noResultsContainer}>
            <Ionicons name="alert-circle-outline" size={60} color={COLORS.gray} />
            <Text style={styles.noResultsText}>No meter information extracted</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={processOcr}
            >
              <Text style={styles.retryButtonText}>Retry Extraction</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.retakeButton]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.actionButtonText}>Retake Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.useButton]}
            onPress={() => {
              // Navigate back to Consumer Indexing Form with the extracted data
              navigation.navigate('ConsumerIndexingForm', {
                meterData: ocrResults
              });
            }}
          >
            <Text style={styles.actionButtonText}>Use Information</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  actionButton: {
    alignItems: 'center',
    borderRadius: 8,
    flex: 1,
    padding: 15,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    padding: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 15,
    padding: 20,
  },
  capturedImage: {
    height: 200,
    width: '100%',
  },
  container: {
    backgroundColor: COLORS.background,
    flex: 1,
  },
  copyButton: {
    padding: 5,
  },
  fieldContainer: {
    borderBottomColor: COLORS.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingVertical: 15,
  },
  fieldLabel: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
  fieldLabelContainer: {
    flex: 1,
  },
  fieldValue: {
    color: COLORS.text,
    fontSize: 16,
  },
  fieldValueContainer: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    padding: 20,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  imageContainer: {
    padding: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  loadingSubtext: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 10,
  },
  loadingText: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
  },
  noResultsContainer: {
    alignItems: 'center',
    padding: 40,
  },
  noResultsText: {
    color: COLORS.textSecondary,
    fontSize: 18,
    marginTop: 20,
    textAlign: 'center',
  },
  resultsContainer: {
    padding: 20,
  },
  retakeButton: {
    backgroundColor: COLORS.gray,
    marginRight: 10,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    marginTop: 20,
    padding: 15,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  useButton: {
    backgroundColor: COLORS.primary,
    marginLeft: 10,
  },
});

export default MeterInfoScreen;