import databaseService from '../services/databaseService';

/**
 * Insert dummy data into the SQLite database for testing purposes
 */
export const insertDummyData = async () => {
  try {
    // Initialize database if not already initialized
    if (!databaseService.isInitialized) {
      await databaseService.initialize();
    }

    console.log('Inserting dummy data...');

    // Insert dummy user
    const userResult = await databaseService.saveUser({
      phone: '+91 8981675554',
      name: 'Rajesh Kumar',
      role: 'Field Technician',
      status: 'online',
      avatar: '👨‍🔧'
    });

    console.log('User inserted:', userResult);

    // Insert dummy dashboard stats
    const statsResult = await databaseService.updateDashboardStats({
      survey_total: 28,
      survey_completed: 22,
      survey_pending: 6,
      installation_total: 36,
      installation_completed: 30,
      installation_pending: 6
    });

    console.log('Dashboard stats inserted:', statsResult);

    // Insert dummy installations with more relevant data for power utility
    const installations = [
      {
        name: 'Transformer Substation TS-01',
        address: 'Sector 12, Pune - 411001',
        status: 'completed',
        latitude: 18.5204,
        longitude: 73.8567,
        assigned_to: userResult.id
      },
      {
        name: 'Distribution Feeder DF-15',
        address: 'Kothrud, Pune - 411038',
        status: 'pending',
        latitude: 18.5074,
        longitude: 73.8077,
        assigned_to: userResult.id
      },
      {
        name: 'Utility Pole UP-221',
        address: 'Baner, Pune - 411045',
        status: 'in_progress',
        latitude: 18.559,
        longitude: 73.7898,
        assigned_to: userResult.id
      },
      {
        name: 'Meter Installation MI-001',
        address: 'Aundh, Pune - 411007',
        status: 'completed',
        latitude: 18.5586,
        longitude: 73.8157,
        assigned_to: userResult.id
      },
      {
        name: 'Cable Laying CL-05',
        address: 'Hinjewadi, Pune - 411057',
        status: 'pending',
        latitude: 18.5916,
        longitude: 73.7389,
        assigned_to: userResult.id
      },
      {
        name: 'Switchgear Maintenance SM-12',
        address: 'Shivaji Nagar, Pune - 411005',
        status: 'in_progress',
        latitude: 18.5293,
        longitude: 73.8431,
        assigned_to: userResult.id
      },
      {
        name: 'Grid Station Upgrade GS-03',
        address: 'Hadapsar, Pune - 411028',
        status: 'completed',
        latitude: 18.4933,
        longitude: 73.9222,
        assigned_to: userResult.id
      },
      {
        name: 'Power Line Inspection PL-08',
        address: 'Wakad, Pune - 411057',
        status: 'pending',
        latitude: 18.5916,
        longitude: 73.7389,
        assigned_to: userResult.id
      }
    ];

    for (const installation of installations) {
      const result = await databaseService.saveInstallation(installation);
      console.log('Installation inserted:', result);
    }

    // Insert dummy captures with power utility specific data
    const captures = [
      {
        installation_id: 1,
        image_path: 'file:///local/images/transformer_ts01.jpg',
        latitude: 18.5204,
        longitude: 73.8567,
        network_type: '4G',
        signal_strength: 'Strong',
        connection_quality: 'Excellent',
        bandwidth_info: {
          download: '45 Mbps',
          upload: '18 Mbps',
          latency: '22ms'
        }
      },
      {
        installation_id: 2,
        image_path: 'file:///local/images/feeder_df15.jpg',
        latitude: 18.5074,
        longitude: 73.8077,
        network_type: 'WiFi',
        signal_strength: 'Medium',
        connection_quality: 'Good',
        bandwidth_info: {
          download: '85 Mbps',
          upload: '42 Mbps',
          latency: '18ms'
        }
      },
      {
        installation_id: 3,
        image_path: 'file:///local/images/pole_up221.jpg',
        latitude: 18.559,
        longitude: 73.7898,
        network_type: '3G',
        signal_strength: 'Weak',
        connection_quality: 'Fair',
        bandwidth_info: {
          download: '12 Mbps',
          upload: '5 Mbps',
          latency: '85ms'
        }
      }
    ];

    for (const capture of captures) {
      const result = await databaseService.saveCapture(capture);
      console.log('Capture inserted:', result);
    }
    
    // Insert dummy consumer indexing data
    const consumerIndexingData = [
      {
        CONSUMER_ID_M: 'CI001',
        CONSUMER_NAME_M: 'Rajesh Kumar',
        FATHER_HUSBAND_PROPRITEOR_NAME_M: 'Shankar Prasad',
        CONSUMER_ADDRESS_M: 'Flat 101, ABC Apartments, Sector 15, Pune - 411015',
        REGISTERED_MOBILE_NO_AS_PER_RMS_M: '9876543210',
        EMAIL_M: 'rajesh.kumar@email.com',
        DISCOM_M: 'MSEB',
        CIRCLE_NAME_WITH_CODE_M: 'Pune Circle',
        DIVISION_NAME_WITH_CODE_M: 'Pune Division',
        ZONE_NAME_WITH_CODE_M: 'Central Zone',
        SUB_DIVISION_NAME_WITH_CODE_M: 'Pune Sub Division',
        CATEGORY_IN_MASTER_DATA_M: 'DOMESTIC',
        SANCTIONED_LOAD_M: 5.0,
        OLD_METER_SERIAL_NUMBER_M: 'MT123456',
        OLD_METER_PHASE_M: 'Single Phase',
        OLD_MF_M: '1',
        BILLING_TYPE_M: 'Normal',
        SUB_CATEGORY_CODE_M: 'DOM',
        CONNECTED_LOAD_M: 4.5,
        OLD_METER_BADGE_NUMBER_M: 'BDG789',
        METER_MAKE_M: 'L&G',
        LATITUDE_M: 18.5204,
        LONGITUDE_M: 73.8567,
        OLD_CONS_NO_M: 'OCN12345',
        TDC_FLAG_M: 'N',
        METER_READING_SEQUENCE_M: 'SEQ001',
        READING_DIGITS_M: '6',
        MAXIMUM_DEMAND_M: '4.2',
        STATUS: 'ACTIVE',
        consumer_name: 'Rajesh Kumar',
        account_number: 'ACC001',
        address: 'Flat 101, ABC Apartments, Sector 15, Pune - 411015',
        contact_number: '9876543210',
        meter_serial_number: 'MT123456',
        meter_type: 'Single Phase',
        sanctioned_load: 5.0,
        feeder_code: 'FD001',
        dt_code: 'DT001',
        pole_number: 'PL001',
        latitude: 18.5204,
        longitude: 73.8567,
        remarks: 'Regular consumer',
        email: 'rajesh.kumar@email.com',
        sync_status: 'PENDING',
        created_by: 'System',
        modified_by: 'System'
      },
      {
        CONSUMER_ID_M: 'CI002',
        CONSUMER_NAME_M: 'Sunita Sharma',
        FATHER_HUSBAND_PROPRITEOR_NAME_M: 'Ramesh Sharma',
        CONSUMER_ADDRESS_M: 'House 25, XYZ Colony, Kothrud, Pune - 411038',
        REGISTERED_MOBILE_NO_AS_PER_RMS_M: '8765432109',
        EMAIL_M: 'sunita.sharma@email.com',
        DISCOM_M: 'MSEB',
        CIRCLE_NAME_WITH_CODE_M: 'Pune Circle',
        DIVISION_NAME_WITH_CODE_M: 'Pune Division',
        ZONE_NAME_WITH_CODE_M: 'Central Zone',
        SUB_DIVISION_NAME_WITH_CODE_M: 'Pune Sub Division',
        CATEGORY_IN_MASTER_DATA_M: 'COMMERCIAL',
        SANCTIONED_LOAD_M: 15.0,
        OLD_METER_SERIAL_NUMBER_M: 'MT789012',
        OLD_METER_PHASE_M: 'Three Phase',
        OLD_MF_M: '1',
        BILLING_TYPE_M: 'Normal',
        SUB_CATEGORY_CODE_M: 'COM',
        CONNECTED_LOAD_M: 12.0,
        OLD_METER_BADGE_NUMBER_M: 'BDG456',
        METER_MAKE_M: 'HPL',
        LATITUDE_M: 18.5074,
        LONGITUDE_M: 73.8077,
        OLD_CONS_NO_M: 'OCN67890',
        TDC_FLAG_M: 'N',
        METER_READING_SEQUENCE_M: 'SEQ002',
        READING_DIGITS_M: '6',
        MAXIMUM_DEMAND_M: '10.5',
        STATUS: 'ACTIVE',
        consumer_name: 'Sunita Sharma',
        account_number: 'ACC002',
        address: 'House 25, XYZ Colony, Kothrud, Pune - 411038',
        contact_number: '8765432109',
        meter_serial_number: 'MT789012',
        meter_type: 'Three Phase',
        sanctioned_load: 15.0,
        feeder_code: 'FD002',
        dt_code: 'DT002',
        pole_number: 'PL002',
        latitude: 18.5074,
        longitude: 73.8077,
        remarks: 'Commercial establishment',
        email: 'sunita.sharma@email.com',
        sync_status: 'PENDING',
        created_by: 'System',
        modified_by: 'System'
      },
      {
        CONSUMER_ID_M: 'CI003',
        CONSUMER_NAME_M: 'Amit Patel',
        FATHER_HUSBAND_PROPRITEOR_NAME_M: 'Vijay Patel',
        CONSUMER_ADDRESS_M: 'Shop 5, Market Complex, Baner, Pune - 411045',
        REGISTERED_MOBILE_NO_AS_PER_RMS_M: '7654321098',
        EMAIL_M: 'amit.patel@email.com',
        DISCOM_M: 'MSEB',
        CIRCLE_NAME_WITH_CODE_M: 'Pune Circle',
        DIVISION_NAME_WITH_CODE_M: 'Pune Division',
        ZONE_NAME_WITH_CODE_M: 'Central Zone',
        SUB_DIVISION_NAME_WITH_CODE_M: 'Pune Sub Division',
        CATEGORY_IN_MASTER_DATA_M: 'INDUSTRIAL',
        SANCTIONED_LOAD_M: 50.0,
        OLD_METER_SERIAL_NUMBER_M: 'MT345678',
        OLD_METER_PHASE_M: 'Three Phase LT',
        OLD_MF_M: '5',
        BILLING_TYPE_M: 'Normal',
        SUB_CATEGORY_CODE_M: 'IND',
        CONNECTED_LOAD_M: 45.0,
        OLD_METER_BADGE_NUMBER_M: 'BDG123',
        METER_MAKE_M: 'L&G',
        LATITUDE_M: 18.559,
        LONGITUDE_M: 73.7898,
        OLD_CONS_NO_M: 'OCN23456',
        TDC_FLAG_M: 'Y',
        METER_READING_SEQUENCE_M: 'SEQ003',
        READING_DIGITS_M: '6',
        MAXIMUM_DEMAND_M: '35.0',
        STATUS: 'ACTIVE',
        consumer_name: 'Amit Patel',
        account_number: 'ACC003',
        address: 'Shop 5, Market Complex, Baner, Pune - 411045',
        contact_number: '7654321098',
        meter_serial_number: 'MT345678',
        meter_type: 'Three Phase LT',
        sanctioned_load: 50.0,
        feeder_code: 'FD003',
        dt_code: 'DT003',
        pole_number: 'PL003',
        latitude: 18.559,
        longitude: 73.7898,
        remarks: 'Small industry',
        email: 'amit.patel@email.com',
        sync_status: 'DRAFT',
        created_by: 'System',
        modified_by: 'System'
      }
    ];
    
    // Insert consumer indexing data
    const ciResult = await databaseService.insertConsumerIndexingData(consumerIndexingData);
    console.log('Consumer indexing data inserted:', ciResult);

    console.log('Dummy data insertion completed successfully!');
    return { success: true };
  } catch (error) {
    console.error('Failed to insert dummy data:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Clear all data from the database
 */
export const clearAllData = async () => {
  try {
    if (!databaseService.isInitialized) {
      await databaseService.initialize();
    }

    // Clear all data from all tables
    await databaseService.db.runAsync('DELETE FROM users');
    await databaseService.db.runAsync('DELETE FROM installations');
    await databaseService.db.runAsync('DELETE FROM captures');
    await databaseService.db.runAsync('DELETE FROM sync_queue');
    await databaseService.db.runAsync('DELETE FROM dashboard_stats');
    await databaseService.db.runAsync('DELETE FROM dashboard_counters');
    await databaseService.db.runAsync('DELETE FROM consumerMaster');
    await databaseService.db.runAsync('DELETE FROM consumer_indexing');
    
    // Reset auto-increment counters
    await databaseService.db.runAsync('DELETE FROM sqlite_sequence WHERE name IN (?, ?, ?, ?, ?, ?, ?, ?)', 
      ['users', 'installations', 'captures', 'sync_queue', 'dashboard_stats', 'dashboard_counters', 'consumerMaster', 'consumer_indexing']);
    
    // Reinitialize dashboard counters with zeros
    await databaseService.seedIfEmpty();
    
    console.log('All data cleared successfully');
    return { success: true };
  } catch (error) {
    console.error('Failed to clear data:', error);
    return { success: false, error: error.message };
  }
};

// Run the script if called directly
if (require.main === module) {
  insertDummyData()
    .then(() => {
      console.log('Script execution completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script execution failed:', error);
      process.exit(1);
    });
}