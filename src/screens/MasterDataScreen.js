import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import { readString } from 'react-native-csv';
import { DatabaseService } from '../services';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../constants';
import { insertDummyData } from '../utils/insertDummyData';
// Add JSZip for creating zip files
import JSZip from 'jszip';

export default function MasterDataScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState({});
  const [isDatabaseReady, setIsDatabaseReady] = useState(false);

  // Initialize database when component mounts
  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        const initialized = await DatabaseService.initialize();
        setIsDatabaseReady(initialized);
        if (!initialized) {
          console.error('Failed to initialize database');
        }
      } catch (error) {
        console.error('Database initialization error:', error);
        setIsDatabaseReady(false);
      }
    };

    initializeDatabase();
  }, []);

  const downloadAndProcessConsumerData = async () => {
    if (!isDatabaseReady) {
      Alert.alert('Error', 'Database is not ready. Please try again.');
      return;
    }

    setLoading(true);
    setDownloadProgress({ consumer: 'Downloading...' });

    try {
      // URL for consumer data CSV (updated with the correct URL)
      const url =
        'https://customer-content-repository.s3.ap-south-1.amazonaws.com/sample_users.csv?response-content-disposition=inline&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEMr%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCmFwLXNvdXRoLTEiRjBEAiBvkJ4FSyjuMF8uzHbstWk69dG2o1I6RXliVH0XttFtNQIgRhsTUOBojHTzBUaw8yIA3Rolfewqll2ke0O7%2FvF7Nh0quQMIYxAAGgwzNzA1MTk5MTMyMjYiDD7Sy62btqiJ7LSeDiqWA0f%2BvqGpAppc4Z%2F3D9BYtllscjZA1K363XZ521FY7iGWamZnV3o9kKqL80yEKanEdaYGkoEpvhXpUhGwG8r5K6kQCTlG9UYfvQlKPkJDKWCstrf%2Flon4K%2B%2BYytX6BtMndDMqB8bdOg%2Fxxuix2UbyeH1XCxznBhvwgghG2jbtjKh1t4m8rpx87TtJH8zckAvN6DChLxOf5TZfArAC%2FuNZpFAKGSQPeaiPuPqVytd4BVtZd7GIUEQwqvHkLGvAV5JN3uRFb5AYaFq2B2dqnd2xnPTcxsTfeh3DD%2BnY8nPwHhvHn4uCm919mJQbUrSfrJZ0X5eBh7K5WuCC2MBX3FVUBbIgTnCAHY75hA6jdSES0%2BL1E8M67XltW3FzJFQCVagzP2LRjn0mPgZ%2FLNQpdYcwTRuYoele5F%2F1%2BU5AFc2LpL99pds%2B%2B7CMpyHiP2AlCrbYrOgErot1EtT4tIzWvkU3zNlLd44xvuQqV6y1bhnpdQSdVcgLkJ37Bkvny6OdrTW3Ev6fNMqYsq0f6MQTQqG0WkNfbE2FeOswk7qFxwY63wJmIijGl6oyN%2Bh%2F9aGtokGPw0%2FnA%2Bks6oRvmAR8qxpZZC1eYfNU5Hi5Zkiw%2FIRfkKM6dGAUO%2B6s4DP2vpb7CcUAgaLxLBnJfYLjMLF5ceeixn7wyzOsTpHcMUe81AIjuBIXNRpmf7Zv1HGMryirC%2Bz4DvYr9xKf0gy4k8AqEqkynUkK5EBcTPFsrzuurnem9%2BS6JWkmr3b5MZcwvjPNQnDPkF%2Bxuc%2BDq5Eg5Jxee71ob8oMWqdbqQvU8VcRrSc2ZEGl6EvUZIKFWdVVwBEAUmvzUpLSVANvKLoUgrSeBV6GiDHqJLsx6sUuVLvr47li8WdFpQpnzyWNWwrLOULNDE33yYxv09EQImdsPNOioEIGtRXF9fVgAVXvHfroFPtUAgy7FHn3W0aEzPEQFiFo6Anlt7Wi8INYciotNdlCi3GrkWfCekBzTqH%2BagFOP70FHfK%2Bbo7rXDND5aNF9ik3En0%3D&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=ASIAVMRFVGMFLLTBXR2R%2F20251004%2Fap-south-1%2Fs3%2Faws4_request&X-Amz-Date=20251004T175332Z&X-Amz-Expires=43200&X-Amz-SignedHeaders=host&X-Amz-Signature=3ae79f9cedd086e6fad3c508895c039a784e1490735ca95d97015d0a70afba03';

      // Download the file using the legacy API
      const fileName = `${FileSystem.documentDirectory}sample_users.csv`;
      const downloadResumable = FileSystem.createDownloadResumable(
        url,
        fileName,
        {},
        (downloadProgress) => {
          const progress =
            (downloadProgress.totalBytesWritten /
              downloadProgress.totalBytesExpectedToWrite) *
            100;
          setDownloadProgress({
            consumer: `Downloading... ${Math.round(progress)}%`,
          });
        }
      );

      const { uri } = await downloadResumable.downloadAsync();
      setDownloadProgress({ consumer: 'Processing data...' });

      // Read the file
      const fileContent = await FileSystem.readAsStringAsync(uri);
      console.log('File content length:', fileContent.length);

      // Parse CSV data using react-native-csv
      const parsedResult = readString(fileContent, {
        header: true,
        skipEmptyLines: true,
      });

      const parsedData = parsedResult.data;
      console.log('Parsed data length:', parsedData.length);
      console.log(
        'CSV headers:',
        parsedResult.meta?.fields || 'No headers found'
      );
      console.log('First few raw records:', parsedData.slice(0, 3));

      // Transform data to match our database schema
      const consumers = parsedData
        .map((record) => {
          // Log the first record to understand the structure
          if (parsedData.indexOf(record) === 0) {
            console.log('First record keys:', Object.keys(record));
          }

          // Flexible column mapping - try different possible column names
          const consumer = {
            ConsumerID:
              record.ConsumerID ||
              record.consumer_id ||
              record.id ||
              record.Id ||
              record['Consumer ID'] ||
              '',
            CustomerName:
              record.CustomerName ||
              record.customer_name ||
              record.name ||
              record.Name ||
              record['Customer Name'] ||
              '',
            Address:
              record.Address ||
              record.address ||
              record['Billing Address'] ||
              '',
            Email:
              record.Email || record.email || record['Email Address'] || '',
            Phone: record.Phone || record.phone || record['Phone Number'] || '',
            PaymentStatus:
              record.PaymentStatus ||
              record.payment_status ||
              record.status ||
              record.Status ||
              '',
            AmountDue: parseFloat(
              record.AmountDue ||
                record.amount_due ||
                record['Amount Due'] ||
                record.balance ||
                0
            ),
            LastPaymentDate:
              record.LastPaymentDate ||
              record.last_payment_date ||
              record['Last Payment Date'] ||
              '',
          };

          return consumer;
        })
        .filter((record) => record.ConsumerID); // Filter out records without ConsumerID

      console.log('Transformed consumers length:', consumers.length);
      console.log('First few consumers:', consumers.slice(0, 3));

      setDownloadProgress({
        consumer: `Inserting ${consumers.length} records...`,
      });

      // Insert data into database
      const result = await DatabaseService.insertConsumerMasterData(consumers);

      if (result.success) {
        Alert.alert(
          'Success',
          `Consumer data downloaded and inserted successfully!\n${result.count} records added.`,
          [{ text: 'OK' }]
        );
      } else {
        throw new Error(result.error || 'Failed to insert consumer data');
      }
    } catch (error) {
      console.error('Download consumer data failed:', error);
      Alert.alert(
        'Error',
        `Failed to download consumer data: ${error.message}`,
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
      setDownloadProgress({});
    }
  };

  const downloadCIData = async () => {
    if (!isDatabaseReady) {
      Alert.alert('Error', 'Database is not ready. Please try again.');
      return;
    }

    setLoading(true);
    setDownloadProgress({ ci: 'Downloading CI Data...' });

    try {
      // URL for CI Master data CSV
      const url =
        'https://sponge-balanced-cat.ngrok-free.app/files/Consumer%20Master%20Records.csv';

      // Download the file using the legacy API
      const fileName = `${FileSystem.documentDirectory}dummyCIMaster.csv`;
      const downloadResumable = FileSystem.createDownloadResumable(
        url,
        fileName,
        {},
        (downloadProgress) => {
          const progress =
            (downloadProgress.totalBytesWritten /
              downloadProgress.totalBytesExpectedToWrite) *
            100;
          setDownloadProgress({
            ci: `Downloading... ${Math.round(progress)}%`,
          });
        }
      );

      const { uri } = await downloadResumable.downloadAsync();
      setDownloadProgress({ ci: 'Processing data...' });

      // Read the file
      const fileContent = await FileSystem.readAsStringAsync(uri);
      console.log('CI Master file content length:', fileContent.length);
      console.log(
        'CI Master file content preview:',
        fileContent.substring(0, 200)
      );

      // Check if the response is XML (error response) instead of CSV
      const trimmedContent = fileContent.trim();
      if (
        trimmedContent.startsWith('<') &&
        (trimmedContent.includes('<xml') || trimmedContent.includes('<Error'))
      ) {
        console.log('Received XML error response instead of CSV data');
        // Try to extract error message from XML
        const errorMessageMatch = trimmedContent.match(
          /<Message>(.*?)<\/Message>/
        );
        const errorMessage = errorMessageMatch
          ? errorMessageMatch[1]
          : 'Server returned an error response.';
        throw new Error(`Server Error: ${errorMessage}`);
      }

      // Check if the content looks like a valid CSV
      if (!fileContent || fileContent.length < 10) {
        console.log('Received empty or invalid response');
        throw new Error('Received empty or invalid data from server.');
      }

      // Parse CSV data using react-native-csv
      const parsedResult = readString(fileContent, {
        header: true,
        skipEmptyLines: true,
      });

      const parsedData = parsedResult.data;

      // Additional check: if the first record has XML-like keys, it's probably an error
      if (parsedData && parsedData.length > 0) {
        const firstRecord = parsedData[0];
        const firstKey = Object.keys(firstRecord)[0];
        if (
          (firstKey && firstKey.startsWith('<?xml')) ||
          firstKey.includes('<Error')
        ) {
          console.log('Detected XML error response in CSV parsing');
          throw new Error(
            'File not available on server. Please try again later.'
          );
        }
      }

      // Check if we have valid CSV data
      if (!parsedData || parsedData.length === 0) {
        console.log('No valid data found in CSV');
        throw new Error('No valid data found in the downloaded file.');
      }

      console.log('Parsed CI data length:', parsedData.length);
      console.log(
        'CSV headers:',
        parsedResult.meta?.fields || 'No headers found'
      );
      console.log('First few raw records:', parsedData.slice(0, 3));

      // Transform data to match our database schema
      const ciRecords = parsedData.map((record) => {
        // Log the first record to understand the structure
        if (parsedData.indexOf(record) === 0) {
          console.log('First CI record keys:', Object.keys(record));
        }

        // Map CSV columns to database columns
        const ciRecord = {
          survey_id: record['survey_id'] || '',
          CONSUMER_ID_M: record['Consumer Number'] || '',
          CONSUMER_NAME_M: record['Consumer Name'] || '',
          FATHER_HUSBAND_PROPRITEOR_NAME_M:
            record['Father or Husband or Proprietor Name'] || '',
          CONSUMER_ADDRESS_M: record['Address'] || '',
          REGISTERED_MOBILE_NO_AS_PER_RMS_M: record['Mobile No'] || '',
          EMAIL_M: record['Email'] || '',
          DISCOM_M: record['Discom'] || '',
          CIRCLE_NAME_WITH_CODE_M: record['Circle'] || '',
          DIVISION_NAME_WITH_CODE_M: record['Division'] || '',
          ZONE_NAME_WITH_CODE_M: record['Zone'] || '',
          SUB_DIVISION_NAME_WITH_CODE_M: record['Sub Division'] || '',
          CATEGORY_IN_MASTER_DATA_M: record['Category Code'] || '',
          SANCTIONED_LOAD_M: parseFloat(record['Sanctioned Load Unit']) || 0,
          OLD_METER_SERIAL_NUMBER_M: record['Old Meter Serial Number'] || '',
          OLD_MF_M: record['Old MF (Only in case of LTCT & CTPT)'] || '',
          BILLING_TYPE_M: record['Billing Type'] || '',
          SUB_CATEGORY_CODE_M: record['Sub Category Code'] || '',
          CONNECTED_LOAD_M: parseFloat(record['Connected Load']) || 0,
          OLD_METER_PHASE_M: record['Old Meter Phase'] || '',
          OLD_METER_BADGE_NUMBER_M: record['Old Meter Badge Number'] || '',
          METER_MAKE_M: record['Meter Make'] || '',
          LATITUDE_M: parseFloat(record['Latitude']) || 0,
          LONGITUDE_M: parseFloat(record['Longitude']) || 0,
          OLD_CONS_NO_M: record['OLD_CONS_NO'] || '',
          TDC_FLAG_M: record['TDC_FLAG'] || '',
          METER_READING_SEQUENCE_M: record['Meter Reading Sequence'] || '',
          READING_DIGITS_M: record['READING_DIGITS'] || '',
          MAXIMUM_DEMAND_M: record['Maximum Demand'] || '',
          STATUS: 'ACTIVE', // Default status
        };

        return ciRecord;
      });

      console.log('Transformed CI records length:', ciRecords.length);
      console.log('First few CI records:', ciRecords.slice(0, 3));

      setDownloadProgress({ ci: `Inserting ${ciRecords.length} records...` });

      // Clear any existing data and insert new CI Masterdata
      // The insertConsumerIndexingData method already clears existing data
      const result =
        await DatabaseService.insertConsumerIndexingData(ciRecords);

      if (result.success) {
        // Update dashboard counters after inserting consumer indexing data
        await DatabaseService.updateDashboardCountersFromInstallations();

        Alert.alert(
          'Success',
          `CI Master data downloaded and inserted successfully!\n${result.count} records added.`,
          [{ text: 'OK' }]
        );
      } else {
        throw new Error(result.error || 'Failed to insert CI Master data');
      }
    } catch (error) {
      console.error('Download CI data failed:', error);
      Alert.alert('Error', `Failed to download CI data: ${error.message}`, [
        { text: 'OK' },
      ]);
    } finally {
      setLoading(false);
      setDownloadProgress({});
    }
  };

  const downloadMIData = async () => {
    if (!isDatabaseReady) {
      Alert.alert('Error', 'Database is not ready. Please try again.');
      return;
    }

    setLoading(true);
    setDownloadProgress({ mi: 'Downloading MI Data...' });

    try {
      // Placeholder for MI data download
      // In a real implementation, this would download and process MI data
      await new Promise((resolve) => setTimeout(resolve, 2000));

      Alert.alert(
        'Info',
        'MI Data download functionality would be implemented here.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Download MI data failed:', error);
      Alert.alert('Error', `Failed to download MI data: ${error.message}`, [
        { text: 'OK' },
      ]);
    } finally {
      setLoading(false);
      setDownloadProgress({});
    }
  };

  // Function to load dummy data
  const loadDummyData = async () => {
    if (!isDatabaseReady) {
      Alert.alert('Error', 'Database is not ready. Please try again.');
      return;
    }

    setLoading(true);
    setDownloadProgress({ dummy: 'Loading dummy data...' });

    try {
      const result = await insertDummyData();

      if (result.success) {
        // Update dashboard counters after inserting dummy data
        await DatabaseService.updateDashboardCountersFromInstallations();

        Alert.alert('Success', 'Dummy data loaded successfully!', [
          { text: 'OK' },
        ]);
      } else {
        throw new Error(result.error || 'Failed to load dummy data');
      }
    } catch (error) {
      console.error('Load dummy data failed:', error);
      Alert.alert('Error', `Failed to load dummy data: ${error.message}`, [
        { text: 'OK' },
      ]);
    } finally {
      setLoading(false);
      setDownloadProgress({});
    }
  };

  // New function to export database as CSV files in a zip
  const exportDatabase = async () => {
    if (!isDatabaseReady) {
      Alert.alert('Error', 'Database is not ready. Please try again.');
      return;
    }

    setLoading(true);
    setDownloadProgress({ export: 'Preparing export...' });

    try {
      // Get list of all tables in the database
      setDownloadProgress({ export: 'Getting table list...' });
      const tableNames = await getTableNames();
      console.log('Tables found:', tableNames);

      // Create a new JSZip instance
      const zip = new JSZip();

      // For each table, export data to CSV
      const csvFiles = [];
      for (let i = 0; i < tableNames.length; i++) {
        const tableName = tableNames[i];
        setDownloadProgress({
          export: `Exporting ${tableName} (${i + 1}/${tableNames.length})...`,
        });

        try {
          // Get all records from the table
          const records = await getAllRecordsFromTable(tableName);
          console.log(`Found ${records.length} records in ${tableName}`);

          if (records.length > 0) {
            // Convert to CSV format
            const csvContent = convertToCSV(records);
            const csvFileName = `${tableName}.csv`;

            // Add CSV to zip
            zip.file(csvFileName, csvContent);
            csvFiles.push(csvFileName);
            console.log(`Added ${tableName} to zip`);
          } else {
            console.log(`No records found in ${tableName}`);
          }
        } catch (tableError) {
          console.error(`Error exporting table ${tableName}:`, tableError);
        }
      }

      if (csvFiles.length === 0) {
        throw new Error('No data found to export');
      }

      setDownloadProgress({ export: 'Creating zip file...' });

      // Generate zip file as base64
      try {
        const zipContent = await zip.generateAsync({ type: 'base64' });
        const zipPath = `${FileSystem.documentDirectory}database_export.zip`;

        // Write zip file to filesystem
        await FileSystem.writeAsStringAsync(zipPath, zipContent, {
          encoding: FileSystem.EncodingType.Base64,
        });

        console.log('Zip file created at:', zipPath);
      } catch (zipError) {
        console.error('Error creating zip file:', zipError);
        throw new Error(`Failed to create zip file: ${zipError.message}`);
      }

      setDownloadProgress({ export: 'Download ready...' });

      // Show success message with download option
      Alert.alert(
        'Export Complete',
        `Database exported successfully to ${csvFiles.length} CSV files.\n\nThe zip file is ready for download.`,
        [
          { text: 'OK' },
          {
            text: 'Download',
            onPress: async () => {
              try {
                // In a real app, you would use Sharing API or similar to allow download
                // For now, we'll just show where the file is located
                const zipPath = `${FileSystem.documentDirectory}database_export.zip`;
                const fileInfo = await FileSystem.getInfoAsync(zipPath);
                if (fileInfo.exists) {
                  Alert.alert(
                    'File Location',
                    `Export file is available at:\n${zipPath}\n\nYou can access this file through your device's file manager.`,
                    [{ text: 'OK' }]
                  );
                } else {
                  throw new Error('Export file not found');
                }
              } catch (downloadError) {
                console.error('Download failed:', downloadError);
                Alert.alert(
                  'Download Error',
                  `Failed to access export file: ${downloadError.message}`
                );
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Export database failed:', error);
      Alert.alert(
        'Export Error',
        `Failed to export database: ${error.message}`,
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
      setDownloadProgress({});
    }
  };

  // Helper function to get all table names
  const getTableNames = async () => {
    try {
      // Query SQLite master table to get all user tables
      const result = await DatabaseService.db.getAllAsync(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '__%'"
      );

      return result.map((row) => row.name);
    } catch (error) {
      console.error('Error getting table names:', error);
      throw error;
    }
  };

  // Helper function to get all records from a table
  const getAllRecordsFromTable = async (tableName) => {
    try {
      const result = await DatabaseService.db.getAllAsync(
        `SELECT * FROM ${tableName}`
      );
      return result;
    } catch (error) {
      console.error(`Error getting records from ${tableName}:`, error);
      throw error;
    }
  };

  // Helper function to convert array of objects to CSV
  const convertToCSV = (data) => {
    if (!data || data.length === 0) return '';

    // Get headers from the first object
    const headers = Object.keys(data[0]);
    const csvRows = [];

    // Add header row
    csvRows.push(headers.join(','));

    // Add data rows
    for (const row of data) {
      const values = headers.map((header) => {
        const value = row[header];
        // Handle values that might contain commas or quotes
        if (typeof value === 'string') {
          // Escape quotes and wrap in quotes if needed
          if (
            value.includes(',') ||
            value.includes('"') ||
            value.includes('\n')
          ) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }
        return value ?? ''; // Handle null/undefined values
      });
      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  };

  const clearDatabase = async () => {
    if (!isDatabaseReady) {
      Alert.alert('Error', 'Database is not ready. Please try again.');
      return;
    }

    try {
      // Clear all data from all tables to ensure all cards show 0 count
      await DatabaseService.clearAllData();

      // Update dashboard counters to ensure they show 0
      await DatabaseService.updateDashboardCountersFromInstallations();

      Alert.alert(
        'Success',
        'Database cleared successfully! All cards now show 0 count.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Clear database failed:', error);
      Alert.alert('Error', `Failed to clear database: ${error.message}`);
    }
  };

  const renderDownloadButton = (
    title,
    onPress,
    progressKey,
    isGreen = false
  ) => (
    <TouchableOpacity
      style={[
        styles.downloadButton,
        isGreen && { backgroundColor: COLORS.success },
      ]}
      onPress={onPress}
      disabled={loading || !isDatabaseReady}
    >
      <View style={styles.buttonContent}>
        {!isGreen && (
          <Ionicons
            name="cloud-download-outline"
            size={24}
            color={COLORS.textPrimary}
            style={styles.buttonIcon}
          />
        )}
        <View style={styles.buttonTextContainer}>
          <Text
            style={[styles.buttonTitle, isGreen && { color: COLORS.textWhite }]}
          >
            {title}
          </Text>
          {downloadProgress[progressKey] && (
            <Text style={styles.buttonSubtitle}>
              {downloadProgress[progressKey]}
            </Text>
          )}
        </View>
        {loading && downloadProgress[progressKey] && (
          <ActivityIndicator
            size="small"
            color={isGreen ? COLORS.textWhite : COLORS.primary}
            style={styles.buttonLoader}
          />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        {/* Add back button */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: SPACING.sm,
          }}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ padding: SPACING.sm, marginRight: SPACING.sm }}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Master Data</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          Download and manage master data
        </Text>
      </View>

      <View style={styles.content}>
        {renderDownloadButton(
          'Download MasterData',
          downloadAndProcessConsumerData,
          'consumer'
        )}

        {renderDownloadButton('Download CI Data', downloadCIData, 'ci')}

        {renderDownloadButton('Download MI Data', downloadMIData, 'mi')}

        {/* New Export Database button - green without icon */}
        {renderDownloadButton(
          'Export Database',
          exportDatabase,
          'export',
          true // isGreen
        )}

        {/* Load Dummy Data button - green without icon */}
        {renderDownloadButton(
          'Load Dummy Data',
          loadDummyData,
          'dummy',
          true // isGreen
        )}

        {/* Debug buttons for development */}
        <View style={{ marginTop: SPACING.lg }}>
          <TouchableOpacity
            style={[styles.downloadButton, { backgroundColor: COLORS.error }]}
            onPress={clearDatabase}
          >
            <Text style={[styles.buttonTitle, { color: COLORS.textWhite }]}>
              Clear Database
            </Text>
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Processing data...</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  buttonContent: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  buttonIcon: {
    marginRight: SPACING.lg,
  },
  buttonLoader: {
    marginLeft: SPACING.md,
  },
  buttonSubtitle: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSizes.sm,
  },
  buttonTextContainer: {
    flex: 1,
  },
  buttonTitle: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    marginBottom: SPACING.xs,
  },
  container: {
    backgroundColor: COLORS.background,
    flex: 1,
  },
  content: {
    flex: 1,
    padding: SPACING.xl,
  },
  downloadButton: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    elevation: 2,
    marginBottom: SPACING.lg,
    padding: SPACING.lg,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  header: {
    backgroundColor: COLORS.surface,
    borderBottomColor: COLORS.border,
    borderBottomWidth: 1,
    padding: SPACING.xl,
  },
  headerSubtitle: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSizes.md,
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSizes['2xl'],
    fontWeight: TYPOGRAPHY.fontWeights.bold,
    marginBottom: SPACING.sm,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
  },
  loadingText: {
    color: COLORS.textWhite,
    fontSize: TYPOGRAPHY.fontSizes.lg,
    marginTop: SPACING.md,
  },
});
