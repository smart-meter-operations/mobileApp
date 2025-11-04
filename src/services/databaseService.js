import * as SQLite from 'expo-sqlite';
// Update the FileSystem import to use the legacy API
import * as FileSystem from 'expo-file-system/legacy';

class DatabaseService {
  constructor() {
    this.db = null;
    this.isInitialized = false;
    this.databaseVersion = 7; // Track database version for migrations
  }

  // Initialize database
  async initialize() {
    try {
      // Check if already initialized
      if (this.isInitialized && this.db) {
        console.log('Database already initialized');
        return true;
      }

      console.log('Initializing database...');
      this.db = await SQLite.openDatabaseAsync('smov_offline.db');

      // Log database path for debugging
      console.log('=== DATABASE INITIALIZATION ===');
      console.log('Database name: smov_offline.db');
      console.log('Database object initialized:', !!this.db);

      // Try to get more detailed path information
      try {
        // This is a workaround to get the actual file path
        // Note: This might not work in all environments
        const dbInfo = await this.db.getFirstAsync('PRAGMA database_list');
        if (dbInfo && dbInfo.file) {
          console.log('Database file path:', dbInfo.file);
        }
      } catch (pathError) {
        console.log('Could not retrieve detailed database path information');
      }

      console.log('==============================');

      // Check current database version and perform migrations if needed
      await this.checkAndMigrateDatabase();

      await this.createTables();
      await this.seedIfEmpty();
      this.isInitialized = true;
      console.log('Database initialized successfully');
      return true;
    } catch (error) {
      console.error('Database initialization failed:', error);
      this.isInitialized = false;
      return false;
    }
  }

  // Check database version and perform migrations
  async checkAndMigrateDatabase() {
    try {
      // Ensure database is initialized
      if (!this.db) {
        console.error('Database not initialized');
        return;
      }

      // Create metadata table if it doesn't exist
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS database_metadata (
          id INTEGER PRIMARY KEY,
          version INTEGER NOT NULL DEFAULT 1
        );
      `);

      // Insert default version if not exists
      await this.db.runAsync(`
        INSERT OR IGNORE INTO database_metadata (id, version) VALUES (1, 1);
      `);

      // Get current version
      const metadata = await this.db.getFirstAsync(
        'SELECT version FROM database_metadata WHERE id = 1'
      );
      const currentVersion = metadata?.version || 1;

      console.log(
        `Current database version: ${currentVersion}, App version: ${this.databaseVersion}`
      );

      // Perform migrations if needed
      if (currentVersion < this.databaseVersion) {
        console.log(
          `Starting migrations from version ${currentVersion} to ${this.databaseVersion}`
        );
        await this.performMigrations(currentVersion);

        // Update version in metadata
        await this.db.runAsync(
          'UPDATE database_metadata SET version = ? WHERE id = 1',
          [this.databaseVersion]
        );
        console.log(`Database migrated to version ${this.databaseVersion}`);
      } else {
        console.log('No migrations needed, database is up to date');
      }

      // Debug: Check if EMAIL_M column exists
      try {
        const emailColumnCheck = await this.db.getFirstAsync(`
          SELECT COUNT(*) as count 
          FROM pragma_table_info('consumer_indexing') 
          WHERE name = 'EMAIL_M'
        `);
        console.log('EMAIL_M column exists:', emailColumnCheck.count > 0);
      } catch (error) {
        console.log('Error checking for EMAIL_M column:', error.message);
      }
    } catch (error) {
      console.error('Database migration check failed:', error);
    }
  }

  // Perform database migrations
  async performMigrations(fromVersion) {
    try {
      // Ensure database is initialized
      if (!this.db) {
        console.error('Database not initialized');
        return;
      }

      console.log(
        `Performing database migrations from version ${fromVersion} to ${this.databaseVersion}`
      );

      // Migration from version 1 to 2
      if (fromVersion < 2) {
        console.log('Running migration to version 2');

        // Check if sync_queue table exists and has priority column
        try {
          // Try to add the priority column - this will fail if it already exists
          await this.db.execAsync(`
            ALTER TABLE sync_queue
            ADD COLUMN priority INTEGER DEFAULT 0;
          `);
          console.log('Added priority column to sync_queue table');
        } catch (error) {
          // Column might already exist, check if it's a duplicate column error
          console.log(
            'Priority column might already exist or other error:',
            error.message
          );
        }

        // Add new columns to installations table if they don't exist
        try {
          await this.db.execAsync(`
            ALTER TABLE installations
            ADD COLUMN synced INTEGER DEFAULT 0;
          `);
        } catch (error) {
          console.log(
            'Synced column might already exist in installations table'
          );
        }

        // Add new columns to captures table if they don't exist
        try {
          await this.db.execAsync(`
            ALTER TABLE captures
            ADD COLUMN synced INTEGER DEFAULT 0;
          `);
        } catch (error) {
          console.log('Synced column might already exist in captures table');
        }
      }

      // Migration from version 4 to 5 - Add SIM/Network fields
      if (fromVersion < 5) {
        console.log('Running migration to version 5 - Adding SIM/Network fields');
        
        const simFields = [
          'sim1NetworkProvider TEXT',
          'sim1SignalStrength TEXT',
          'sim1SignalLevel TEXT',
          'sim1SignalType TEXT',
          'sim1Category TEXT',
          'sim1RSSI TEXT',
          'sim1RSRP TEXT',
          'sim1SNR TEXT',
          'sim1CellId TEXT',
          'sim2NetworkProvider TEXT',
          'sim2SignalStrength TEXT',
          'sim2SignalLevel TEXT',
          'sim2SignalType TEXT',
          'sim2Category TEXT',
          'sim2RSSI TEXT',
          'sim2RSRP TEXT',
          'sim2SNR TEXT',
          'sim2CellId TEXT'
        ];

        for (const field of simFields) {
          try {
            const [columnName] = field.split(' ');
            const columnExists = await this.db.getFirstAsync(`
              SELECT COUNT(*) as count 
              FROM pragma_table_info('consumer_indexing') 
              WHERE name = '${columnName}'
            `);

            if (columnExists.count === 0) {
              await this.db.execAsync(`
                ALTER TABLE consumer_indexing ADD COLUMN ${field};
              `);
              console.log(`Added ${columnName} column to consumer_indexing table`);
            } else {
              console.log(`${columnName} column already exists in consumer_indexing table`);
            }
          } catch (error) {
            console.log(`Error adding ${field}:`, error.message);
          }
        }
      }

      // Migration from version 3 to 4
      if (fromVersion < 4) {
        console.log('Running migration to version 4');
        try {
          const indexingStatusColumnExists = await this.db.getFirstAsync(`
            SELECT COUNT(*) as count 
            FROM pragma_table_info('consumer_indexing') 
            WHERE name = 'IndexingStatus'
          `);

          if (indexingStatusColumnExists.count === 0) {
            await this.db.execAsync(`
              ALTER TABLE consumer_indexing
              ADD COLUMN IndexingStatus TEXT NOT NULL DEFAULT 'Assigned';
            `);
            console.log('Added IndexingStatus column to consumer_indexing table');
          } else {
            console.log('IndexingStatus column already exists in consumer_indexing table');
          }
        } catch (error) {
          console.log('Error checking or adding IndexingStatus column:', error.message);
        }
      }

      // Migration from version 2 to 3
      if (fromVersion < 3) {
        console.log('Running migration to version 3');

        // Check if EMAIL_M column exists in consumer_indexing table
        try {
          const emailColumnExists = await this.db.getFirstAsync(`
            SELECT COUNT(*) as count 
            FROM pragma_table_info('consumer_indexing') 
            WHERE name = 'EMAIL_M'
          `);

          if (emailColumnExists.count === 0) {
            // Add EMAIL_M column to consumer_indexing table
            await this.db.execAsync(`
              ALTER TABLE consumer_indexing
              ADD COLUMN EMAIL_M TEXT;
            `);
            console.log('Added EMAIL_M column to consumer_indexing table');
          } else {
            console.log(
              'EMAIL_M column already exists in consumer_indexing table'
            );
          }
        } catch (error) {
          console.log(
            'Error checking or adding EMAIL_M column:',
            error.message
          );
        }

        // Check and add other columns if they don't exist
        const columnsToAdd = [
          // Metadata columns
          { name: 'created_by', definition: 'TEXT' },
          { name: 'modified_by', definition: 'TEXT' },
          { name: 'sync_status', definition: "TEXT DEFAULT 'PENDING'" },
          // Form fields
          { name: 'actualUserType', definition: 'TEXT' },
          { name: 'actualUserName', definition: 'TEXT' },
          { name: 'actualCategoryOfUse', definition: 'TEXT' },
          { name: 'area', definition: 'TEXT' },
          { name: 'districtName', definition: 'TEXT' },
          { name: 'tehsilName', definition: 'TEXT' },
          { name: 'block', definition: 'TEXT' },
          { name: 'gramPanchayat', definition: 'TEXT' },
          { name: 'villageName', definition: 'TEXT' },
          { name: 'villageCensusCode', definition: 'TEXT' },
          { name: 'habitation', definition: 'TEXT' },
          { name: 'landmark', definition: 'TEXT' },
          { name: 'verifiedMobileNumber', definition: 'TEXT' },
          { name: 'whatsappNumber', definition: 'TEXT' },
          { name: 'govIdDetails', definition: 'TEXT' },
          { name: 'numberOfConnections', definition: 'TEXT' },
          { name: 'connectionStatus', definition: 'TEXT' },
          { name: 'meteredConsumer', definition: 'TEXT' },
          { name: 'correctMeterMake', definition: 'TEXT' },
          { name: 'correctSerialNumber', definition: 'TEXT' },
          { name: 'meterBoxStatus', definition: 'TEXT' },
          { name: 'meterBoxSealingStatus', definition: 'TEXT' },
          { name: 'oldMeterStatus', definition: 'TEXT' },
          { name: 'clearLineOfSight', definition: 'TEXT' },
          { name: 'meterLocation', definition: 'TEXT' },
          { name: 'meterInMetallicEnclosure', definition: 'TEXT' },
          { name: 'oldMeterReadingMD', definition: 'TEXT' },
          { name: 'serviceLineStatus', definition: 'TEXT' },
          { name: 'installedServiceCable', definition: 'TEXT' },
          { name: 'armoredServiceCable', definition: 'TEXT' },
          { name: 'neutralAvailability', definition: 'TEXT' },
          { name: 'meterShiftingRequired', definition: 'TEXT' },
          { name: 'lengthOfCable', definition: 'TEXT' },
          { name: 'ltPoleCondition', definition: 'TEXT' },
          { name: 'jeName', definition: 'TEXT' },
        ];

        for (const column of columnsToAdd) {
          try {
            const columnExists = await this.db.getFirstAsync(
              `
              SELECT COUNT(*) as count 
              FROM pragma_table_info('consumer_indexing') 
              WHERE name = ?
            `,
              [column.name]
            );

            if (columnExists.count === 0) {
              await this.db.execAsync(`
                ALTER TABLE consumer_indexing
                ADD COLUMN ${column.name} ${column.definition};
              `);
              console.log(
                `Added ${column.name} column to consumer_indexing table`
              );
            } else {
              console.log(
                `${column.name} column already exists in consumer_indexing table`
              );
            }
          } catch (error) {
            console.log(
              `Error checking or adding ${column.name} column:`,
              error.message
            );
          }
        }
      }

      // Migration from version 5 to 6 - Add missing API fields and ensure SIM fields exist
      if (fromVersion < 6) {
        console.log('Running migration to version 6 - Adding missing API fields');
        
        const missingFields = [
          'consumerNumber TEXT',
          'subStationName TEXT',
          'subStationCode TEXT',
          'feederName TEXT',
          'feederCode TEXT',
          'dtrName TEXT',
          'dtrCode TEXT',
          'conditionOfInstalledServiceCable TEXT',
          'dateAndTime TEXT'
        ];

        for (const field of missingFields) {
          try {
            const [columnName] = field.split(' ');
            const columnExists = await this.db.getFirstAsync(`
              SELECT COUNT(*) as count 
              FROM pragma_table_info('consumer_indexing') 
              WHERE name = '${columnName}'
            `);

            if (columnExists.count === 0) {
              await this.db.execAsync(`
                ALTER TABLE consumer_indexing ADD COLUMN ${field};
              `);
              console.log(`Added ${columnName} column to consumer_indexing table`);
            } else {
              console.log(`${columnName} column already exists in consumer_indexing table`);
            }
          } catch (error) {
            console.log(`Error adding ${field}:`, error.message);
          }
        }
      }

      // Migration from version 6 to 7 - Add survey_id column
      if (fromVersion < 7) {
        console.log('Running migration to version 7 - Adding survey_id column');
        try {
          const columnExists = await this.db.getFirstAsync(`
            SELECT COUNT(*) as count 
            FROM pragma_table_info('consumer_indexing') 
            WHERE name = 'survey_id'
          `);

          if (columnExists.count === 0) {
            await this.db.execAsync(`
              ALTER TABLE consumer_indexing
              ADD COLUMN survey_id TEXT;
            `);
            console.log('Added survey_id column to consumer_indexing table');
          } else {
            console.log('survey_id column already exists in consumer_indexing table');
          }
        } catch (error) {
          console.log('Error checking or adding survey_id column:', error.message);
        }
      }
    } catch (error) {
      console.error('Database migrations failed:', error);
    }
  }

  // Create all necessary tables
  async createTables() {
    try {
      // Ensure database is initialized
      if (!this.db) {
        console.error('Database not initialized');
        throw new Error('Database not initialized');
      }

      // Users table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          phone TEXT UNIQUE,
          name TEXT,
          role TEXT,
          status TEXT DEFAULT 'offline',
          avatar TEXT,
          sim_provider TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
          created_by TEXT,
          modified_by TEXT,
          sync_status TEXT NOT NULL DEFAULT 'PENDING'
        );
      `);

      // Installations table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS installations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          address TEXT,
          status TEXT DEFAULT 'pending',
          latitude REAL,
          longitude REAL,
          assigned_to INTEGER,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
          synced INTEGER DEFAULT 0,
          created_by TEXT,
          modified_by TEXT,
          sync_status TEXT NOT NULL DEFAULT 'PENDING',
          FOREIGN KEY (assigned_to) REFERENCES users (id)
        );
      `);

      // Captures table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS captures (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          installation_id INTEGER,
          image_path TEXT NOT NULL,
          latitude REAL,
          longitude REAL,
          network_type TEXT,
          signal_strength TEXT,
          connection_quality TEXT,
          bandwidth_info TEXT,
          captured_at TEXT DEFAULT CURRENT_TIMESTAMP,
          synced INTEGER DEFAULT 0,
          created_by TEXT,
          modified_by TEXT,
          sync_status TEXT NOT NULL DEFAULT 'PENDING',
          FOREIGN KEY (installation_id) REFERENCES installations (id)
        );
      `);

      // Sync queue table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS sync_queue (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          table_name TEXT NOT NULL,
          record_id INTEGER NOT NULL,
          action TEXT NOT NULL,
          data TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          retry_count INTEGER DEFAULT 0,
          priority INTEGER DEFAULT 0,
          created_by TEXT,
          modified_by TEXT,
          sync_status TEXT NOT NULL DEFAULT 'PENDING'
        );
      `);

      // Dashboard stats table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS dashboard_stats (
          id INTEGER PRIMARY KEY,
          survey_total INTEGER DEFAULT 0,
          survey_completed INTEGER DEFAULT 0,
          survey_pending INTEGER DEFAULT 0,
          installation_total INTEGER DEFAULT 0,
          installation_completed INTEGER DEFAULT 0,
          installation_pending INTEGER DEFAULT 0,
          last_updated TEXT DEFAULT CURRENT_TIMESTAMP,
          created_by TEXT,
          modified_by TEXT,
          sync_status TEXT NOT NULL DEFAULT 'PENDING'
        );
      `);

      // Dashboard counters table (for home KPI cards)
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS dashboard_counters (
          id INTEGER PRIMARY KEY,
          total_completed INTEGER DEFAULT 0,
          ci_assigned INTEGER DEFAULT 0,
          ci_draft INTEGER DEFAULT 0,
          ci_completed INTEGER DEFAULT 0,
          ci_to_sync INTEGER DEFAULT 0,
          mi_assigned INTEGER DEFAULT 0,
          mi_draft INTEGER DEFAULT 0,
          mi_completed INTEGER DEFAULT 0,
          mi_to_sync INTEGER DEFAULT 0,
          last_updated TEXT DEFAULT CURRENT_TIMESTAMP,
          created_by TEXT,
          modified_by TEXT,
          sync_status TEXT NOT NULL DEFAULT 'PENDING'
        );
      `);

      // Consumer Master table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS consumerMaster (
          ConsumerID TEXT PRIMARY KEY,
          CustomerName TEXT,
          Address TEXT,
          Email TEXT,
          Phone TEXT,
          PaymentStatus TEXT,
          AmountDue REAL,
          LastPaymentDate TEXT,
          created_on TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime')),
          created_by TEXT,
          modified_on TEXT,
          modified_by TEXT,
          status TEXT DEFAULT 'ACTIVE',
          sync_status TEXT NOT NULL DEFAULT 'PENDING'
        );
      `);

      // Consumer Indexing table
      await this.db.execAsync(` CREATE TABLE IF NOT EXISTS consumer_indexing (
          -- Primary Key
          id INTEGER PRIMARY KEY AUTOINCREMENT,

          -- Fields from Excel/CSV
          survey_id TEXT,
          CONSUMER_ID_M TEXT,
          STATUS TEXT,
          DISCOM_M TEXT,
          ZONE_NAME_WITH_CODE_M TEXT,
          CIRCLE_NAME_WITH_CODE_M TEXT,
          DIVISION_NAME_WITH_CODE_M TEXT,
          SUB_DIVISION_NAME_WITH_CODE_M TEXT,
          CONSUMER_NAME_M TEXT,
          FATHER_HUSBAND_PROPRITEOR_NAME_M TEXT,
          SANCTIONED_LOAD_M REAL,
          CONSUMER_ADDRESS_M TEXT,
          REGISTERED_MOBILE_NO_AS_PER_RMS_M TEXT,
          SUB_STATION_CODE_M TEXT,
          SUB_STATION_NAME_M TEXT,
          FEEDER_CODE_M TEXT,
          FEEDER_NAME_M TEXT,
          DTR_CODE_M TEXT,
          DTR_NAME_M TEXT,
          CATEGORY_IN_MASTER_DATA_M TEXT,
          SUB_CATEGORY_CODE_M TEXT,
          OLD_METER_SERIAL_NUMBER_M TEXT,
          OLD_METER_PHASE_M TEXT,
          OLD_MF_M TEXT,
          BILLING_TYPE_M TEXT,
          LATITUDE_M REAL,
          LONGITUDE_M REAL,
          OLD_METER_BADGE_NUMBER_M TEXT,
          METER_MAKE_M TEXT,
          CONNECTED_LOAD_M REAL,
          OLD_CONS_NO_M TEXT,
          READING_DIGITS_M TEXT,
          TDC_FLAG_M TEXT,
          MAXIMUM_DEMAND_M TEXT,
          METER_READING_SEQUENCE_M TEXT,
          EMAIL_M TEXT,
          consumer_name TEXT,
          account_number TEXT,
          address TEXT,
          contact_number TEXT,
          meter_serial_number TEXT,
          meter_type TEXT,
          sanctioned_load REAL,
          feeder_code TEXT,
          dt_code TEXT,
          pole_number TEXT,
          latitude REAL,
          longitude REAL,
          remarks TEXT,
          email TEXT,

          -- Additional editable fields from the form
          actualUserType TEXT,
          actualUserName TEXT,
          actualCategoryOfUse TEXT,
          area TEXT,
          districtName TEXT,
          tehsilName TEXT,
          block TEXT,
          gramPanchayat TEXT,
          villageName TEXT,
          villageCensusCode TEXT,
          habitation TEXT,
          landmark TEXT,
          verifiedMobileNumber TEXT,
          whatsappNumber TEXT,
          govIdDetails TEXT,
          numberOfConnections TEXT,
          connectionStatus TEXT,
          meteredConsumer TEXT,
          correctMeterMake TEXT,
          correctSerialNumber TEXT,
          meterBoxStatus TEXT,
          meterBoxSealingStatus TEXT,
          oldMeterStatus TEXT,
          clearLineOfSight TEXT,
          meterLocation TEXT,
          meterInMetallicEnclosure TEXT,
          oldMeterReadingMD TEXT,
          serviceLineStatus TEXT,
          installedServiceCable TEXT,
          armoredServiceCable TEXT,
          neutralAvailability TEXT,
          meterShiftingRequired TEXT,
          lengthOfCable TEXT,
          ltPoleCondition TEXT,
          jeName TEXT,

          -- Network/SIM Information fields
sim1NetworkProvider TEXT,
sim1SignalStrength TEXT,
sim1SignalLevel TEXT,
sim1SignalType TEXT,
sim1Category TEXT,
sim1RSSI TEXT,
sim1RSRP TEXT,
sim1SNR TEXT,
sim1CellId TEXT,
sim2NetworkProvider TEXT,
sim2SignalStrength TEXT,
sim2SignalLevel TEXT,
sim2SignalType TEXT,
sim2Category TEXT,
sim2RSSI TEXT,
sim2RSRP TEXT,
sim2SNR TEXT,
sim2CellId TEXT,

          -- Missing API fields
          consumerNumber TEXT,
          subStationName TEXT,
          subStationCode TEXT,
          feederName TEXT,
          feederCode TEXT,
          dtrName TEXT,
          dtrCode TEXT,
          conditionOfInstalledServiceCable TEXT,
          dateAndTime TEXT,

          -- Evidence fields
          pole_photo BLOB,
          old_meter_photo BLOB,
          old_meter_kwh_photo BLOB,
          house_photo BLOB,

          -- Status and metadata
          IndexingStatus TEXT NOT NULL DEFAULT 'Assigned', -- Assigned, Draft, ToSync, Completed
          sync_status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, SYNCED, FAILED
          created_on TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime')),
          created_by TEXT,
          modified_on TEXT,
          modified_by TEXT
        );
      `);

      // Table to store images for consumer indexing
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS consumer_images (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          consumer_id TEXT NOT NULL,
          image_type TEXT NOT NULL,
          image_base64 TEXT,
          created_on TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime')),
          UNIQUE(consumer_id, image_type)
        );
      `);

      console.log(`Database migrations completed successfully`);
    } catch (error) {
      console.error('Database migration failed:', error);
      throw error;
    }
  }

  // Initialize database with empty counters
  async seedIfEmpty() {
    try {
      const stats = await this.getDashboardStats();
      const counters = await this.getDashboardCounters();

      // Initialize dashboard stats with zeros if not already initialized
      if (!stats.lastUpdated) {
        await this.updateDashboardStats({
          survey_total: 0,
          survey_completed: 0,
          survey_pending: 0,
          installation_total: 0,
          installation_completed: 0,
          installation_pending: 0,
        });
      }

      // Initialize dashboard counters with zeros if not already initialized
      if (!counters.lastUpdated) {
        await this.updateDashboardCounters({
          total_completed: 0,
          ci_assigned: 0,
          ci_draft: 0,
          ci_completed: 0,
          ci_to_sync: 0,
          mi_assigned: 0,
          mi_draft: 0,
          mi_completed: 0,
          mi_to_sync: 0,
        });
      }

      console.log('Database initialized with empty counters');
    } catch (error) {
      console.error('Database initialization failed:', error);
    }
  }

  // Dashboard counters operations
  async updateDashboardCounters(counters) {
    try {
      const {
        total_completed = 0,
        ci_assigned = 0,
        ci_draft = 0,
        ci_completed = 0,
        ci_to_sync = 0,
        mi_assigned = 0,
        mi_draft = 0,
        mi_completed = 0,
        mi_to_sync = 0,
      } = counters;

      await this.db.runAsync(
        `INSERT OR REPLACE INTO dashboard_counters 
         (id, total_completed, ci_assigned, ci_draft, ci_completed, ci_to_sync, 
          mi_assigned, mi_draft, mi_completed, mi_to_sync, last_updated)
         VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          total_completed,
          ci_assigned,
          ci_draft,
          ci_completed,
          ci_to_sync,
          mi_assigned,
          mi_draft,
          mi_completed,
          mi_to_sync,
          new Date().toISOString(),
        ]
      );

      return { success: true };
    } catch (error) {
      console.error('Update dashboard counters failed:', error);
      return { success: false, error: error.message };
    }
  }

  async getDashboardCounters() {
    try {
      const result = await this.db.getFirstAsync(
        'SELECT * FROM dashboard_counters WHERE id = 1'
      );

      if (result) {
        return {
          totalCompleted: result.total_completed,
          consumerIndexing: {
            assigned: result.ci_assigned,
            draft: result.ci_draft,
            completed: result.ci_completed,
            toSync: result.ci_to_sync,
          },
          meterInstallation: {
            assigned: result.mi_assigned,
            draft: result.mi_draft,
            completed: result.mi_completed,
            toSync: result.mi_to_sync,
          },
          lastUpdated: result.last_updated,
        };
      }

      return {
        totalCompleted: 0,
        consumerIndexing: { assigned: 0, draft: 0, completed: 0, toSync: 0 },
        meterInstallation: { assigned: 0, draft: 0, completed: 0, toSync: 0 },
        lastUpdated: null,
      };
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

  // Update the status of a consumer indexing record
  async updateConsumerIndexingStatus(consumerId, status) {
    try {
      await this.db.runAsync('UPDATE consumer_indexing SET IndexingStatus = ? WHERE CONSUMER_ID_M = ?', [status, consumerId]);
      console.log(`Updated status for consumer ${consumerId} to ${status}`);
      return { success: true };
    } catch (error) {
      console.error('Error updating consumer indexing status:', error);
      return { success: false, error: error.message };
    }
  }

  // Save an image for a consumer with optional GPS coordinates and network info
  async saveConsumerImage(consumerId, imageType, imageUri, gpsCoordinates = null, networkInfo = null) {
    try {
      console.log('saveConsumerImage called with:', {
        consumerId,
        imageType,
        hasUri: !!imageUri,
        hasGPS: !!gpsCoordinates,
        hasNetwork: !!networkInfo
      });

      if (!consumerId || !imageType || !imageUri) {
        throw new Error('Consumer ID, image type, and image URI are required.');
      }
      
      // Save image URI to consumer_images table
      console.log('Saving image URI to consumer_images table...');
      await this.db.runAsync(
        `INSERT OR REPLACE INTO consumer_images (consumer_id, image_type, image_base64) VALUES (?, ?, ?)`,
        [consumerId, imageType, imageUri]
      );
      console.log('Image URI saved to consumer_images table successfully');
      // Note: image_base64 field now contains file URI, not base64 data (field name is legacy)
      
      // Prepare update fields and values
      let updateFields = [];
      let updateValues = [];
      
      // Add GPS coordinates if provided
      if (gpsCoordinates && gpsCoordinates.latitude && gpsCoordinates.longitude) {
        console.log(`Updating GPS coordinates for consumer ${consumerId}:`, gpsCoordinates);
        updateFields.push('LATITUDE_M = ?', 'LONGITUDE_M = ?');
        updateValues.push(gpsCoordinates.latitude, gpsCoordinates.longitude);
      }
      
      // Add network/SIM information if provided
      if (networkInfo && networkInfo.cellular) {
        console.log(`Updating network info for consumer ${consumerId}:`, networkInfo.cellular);
        const cellular = networkInfo.cellular;
        console.log('Available cellular fields:', Object.keys(cellular));
        
        // Add SIM1 fields
        if (cellular.sim1NetworkProvider) {
          updateFields.push('sim1NetworkProvider = ?');
          updateValues.push(cellular.sim1NetworkProvider);
        }
        if (cellular.sim1SignalStrength) {
          updateFields.push('sim1SignalStrength = ?');
          updateValues.push(cellular.sim1SignalStrength);
        }
        if (cellular.sim1SignalLevel) {
          updateFields.push('sim1SignalLevel = ?');
          updateValues.push(cellular.sim1SignalLevel);
        }
        if (cellular.sim1SignalType) {
          updateFields.push('sim1SignalType = ?');
          updateValues.push(cellular.sim1SignalType);
        }
        if (cellular.sim1Category) {
          updateFields.push('sim1Category = ?');
          updateValues.push(cellular.sim1Category);
        }
        if (cellular.sim1RSSI) {
          updateFields.push('sim1RSSI = ?');
          updateValues.push(cellular.sim1RSSI);
        }
        if (cellular.sim1RSRP) {
          updateFields.push('sim1RSRP = ?');
          updateValues.push(cellular.sim1RSRP);
        }
        if (cellular.sim1SNR) {
          updateFields.push('sim1SNR = ?');
          updateValues.push(cellular.sim1SNR);
        }
        if (cellular.sim1CellId) {
          updateFields.push('sim1CellId = ?');
          updateValues.push(cellular.sim1CellId);
        }
      }
      
      // Update consumer_indexing table if we have any fields to update
      if (updateFields.length > 0) { // We have fields to update
        updateValues.push(consumerId); // Add consumerId for WHERE clause
        
        const updateQuery = `UPDATE consumer_indexing 
                           SET ${updateFields.join(', ')}
                           WHERE CONSUMER_ID_M = ?`;
        
        console.log('Executing update query:', updateQuery);
        console.log('Update values:', updateValues);
        
        await this.db.runAsync(updateQuery, updateValues);
        console.log('Consumer indexing table updated successfully');
        
        console.log(`Updated consumer ${consumerId} with:`, {
          gps: gpsCoordinates ? `lat=${gpsCoordinates.latitude}, lng=${gpsCoordinates.longitude}` : 'none',
          network: networkInfo ? 'SIM info captured' : 'none'
        });
      }
      
      console.log(`Image '${imageType}' saved for consumer '${consumerId}'`);
      return { success: true };
    } catch (error) {
      console.error(
        `Failed to save image for consumer ${consumerId}:`,
        error
      );
      return { success: false, error: error.message };
    }
  }

  // User operations
  async saveUser(userData) {
    try {
      const { phone, name, role, status = 'offline', avatar, sim_provider } = userData;

      const result = await this.db.runAsync(
        `INSERT OR REPLACE INTO users (phone, name, role, status, avatar, sim_provider, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [phone, name, role, status, avatar, sim_provider, new Date().toISOString()]
      );

      await this.addToSyncQueue(
        'users',
        result.lastInsertRowId,
        'INSERT',
        userData,
        1 // High priority
      );
      return { success: true, id: result.lastInsertRowId };
    } catch (error) {
      console.error('Save user failed:', error);
      return { success: false, error: error.message };
    }
  }

  async getUser(phone) {
    try {
      const result = await this.db.getFirstAsync(
        'SELECT * FROM users WHERE phone = ?',
        [phone]
      );
      return result;
    } catch (error) {
      console.error('Get user failed:', error);
      return null;
    }
  }

  // Installation operations
  async saveInstallation(installationData) {
    try {
      const {
        name,
        address,
        status = 'pending',
        latitude,
        longitude,
        assigned_to,
      } = installationData;

      const result = await this.db.runAsync(
        `INSERT INTO installations (name, address, status, latitude, longitude, assigned_to, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          name,
          address,
          status,
          latitude,
          longitude,
          assigned_to,
          new Date().toISOString(),
        ]
      );

      await this.addToSyncQueue(
        'installations',
        result.lastInsertRowId,
        'INSERT',
        installationData,
        2 // Medium priority
      );
      return { success: true, id: result.lastInsertRowId };
    } catch (error) {
      console.error('Save installation failed:', error);
      return { success: false, error: error.message };
    }
  }

  async getInstallations(limit = 50) {
    try {
      const result = await this.db.getAllAsync(
        'SELECT * FROM installations ORDER BY created_at DESC LIMIT ?',
        [limit]
      );
      return result || [];
    } catch (error) {
      console.error('Get installations failed:', error);
      return [];
    }
  }

  async updateInstallationStatus(id, status) {
    try {
      await this.db.runAsync(
        'UPDATE installations SET status = ?, updated_at = ? WHERE id = ?',
        [status, new Date().toISOString(), id]
      );

      await this.addToSyncQueue(
        'installations',
        id,
        'UPDATE',
        { id, status },
        2 // Medium priority
      );
      return { success: true };
    } catch (error) {
      console.error('Update installation status failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Capture operations
  async saveCapture(captureData) {
    try {
      const {
        installation_id,
        image_path,
        latitude,
        longitude,
        network_type,
        signal_strength,
        connection_quality,
        bandwidth_info,
      } = captureData;

      const result = await this.db.runAsync(
        `INSERT INTO captures (installation_id, image_path, latitude, longitude, 
         network_type, signal_strength, connection_quality, bandwidth_info, captured_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          installation_id,
          image_path,
          latitude,
          longitude,
          network_type,
          signal_strength,
          connection_quality,
          JSON.stringify(bandwidth_info),
          new Date().toISOString(),
        ]
      );

      await this.addToSyncQueue(
        'captures',
        result.lastInsertRowId,
        'INSERT',
        captureData,
        3 // Lower priority
      );
      return { success: true, id: result.lastInsertRowId };
    } catch (error) {
      console.error('Save capture failed:', error);
      return { success: false, error: error.message };
    }
  }

  async getCaptures(installationId = null) {
    try {
      let query = 'SELECT * FROM captures';
      let params = [];

      if (installationId) {
        query += ' WHERE installation_id = ?';
        params.push(installationId);
      }

      query += ' ORDER BY captured_at DESC';

      const result = await this.db.getAllAsync(query, params);
      return result || [];
    } catch (error) {
      console.error('Get captures failed:', error);
      return [];
    }
  }

  // Dashboard stats operations
  async updateDashboardStats(stats) {
    try {
      const {
        survey_total = 0,
        survey_completed = 0,
        survey_pending = 0,
        installation_total = 0,
        installation_completed = 0,
        installation_pending = 0,
      } = stats;

      await this.db.runAsync(
        `INSERT OR REPLACE INTO dashboard_stats 
         (id, survey_total, survey_completed, survey_pending, 
          installation_total, installation_completed, installation_pending, last_updated) 
         VALUES (1, ?, ?, ?, ?, ?, ?, ?)`,
        [
          survey_total,
          survey_completed,
          survey_pending,
          installation_total,
          installation_completed,
          installation_pending,
          new Date().toISOString(),
        ]
      );

      return { success: true };
    } catch (error) {
      console.error('Update dashboard stats failed:', error);
      return { success: false, error: error.message };
    }
  }

  async getDashboardStats() {
    try {
      const result = await this.db.getFirstAsync(
        'SELECT * FROM dashboard_stats WHERE id = 1'
      );

      if (result) {
        return {
          survey: {
            total: result.survey_total,
            completed: result.survey_completed,
            pending: result.survey_pending,
          },
          installation: {
            total: result.installation_total,
            completed: result.installation_completed,
            pending: result.installation_pending,
          },
          lastUpdated: result.last_updated,
        };
      }

      // Return default stats if no data found
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

  // Sync queue operations
  async addToSyncQueue(tableName, recordId, action, data, priority = 0) {
    try {
      await this.db.runAsync(
        'INSERT INTO sync_queue (table_name, record_id, action, data, priority) VALUES (?, ?, ?, ?, ?)',
        [tableName, recordId, action, JSON.stringify(data), priority]
      );
    } catch (error) {
      console.error('Add to sync queue failed:', error);
    }
  }

  async getSyncQueue(limit = 100) {
    try {
      const result = await this.db.getAllAsync(
        'SELECT * FROM sync_queue ORDER BY priority ASC, created_at ASC LIMIT ?',
        [limit]
      );
      return result || [];
    } catch (error) {
      console.error('Get sync queue failed:', error);
      return [];
    }
  }

  async removeSyncQueueItem(id) {
    try {
      await this.db.runAsync('DELETE FROM sync_queue WHERE id = ?', [id]);
      return { success: true };
    } catch (error) {
      console.error('Remove sync queue item failed:', error);
      return { success: false, error: error.message };
    }
  }

  async clearSyncQueue() {
    try {
      await this.db.runAsync('DELETE FROM sync_queue');
      return { success: true };
    } catch (error) {
      console.error('Clear sync queue failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Get count of items in sync queue
  async getSyncQueueCount() {
    try {
      const result = await this.db.getFirstAsync(
        'SELECT COUNT(*) as count FROM sync_queue'
      );
      return result?.count || 0;
    } catch (error) {
      console.error('Get sync queue count failed:', error);
      return 0;
    }
  }

  // Update dashboard counters based on actual installation data and consumer indexing records
  async updateDashboardCountersFromInstallations() {
    try {
      // Query counts from consumer_indexing table based on IndexingStatus
      const assignedResult = await this.db.getFirstAsync("SELECT COUNT(*) as count FROM consumer_indexing WHERE IndexingStatus = 'Assigned' OR IndexingStatus IS NULL OR IndexingStatus = ''");
      const draftResult = await this.db.getFirstAsync("SELECT COUNT(*) as count FROM consumer_indexing WHERE IndexingStatus = 'Draft'");
      const toSyncResult = await this.db.getFirstAsync("SELECT COUNT(*) as count FROM consumer_indexing WHERE IndexingStatus = 'ToSync'");
      const completedResult = await this.db.getFirstAsync("SELECT COUNT(*) as count FROM consumer_indexing WHERE IndexingStatus = 'Completed'");

      const ci_assigned = assignedResult?.count ?? 0;
      const ci_draft = draftResult?.count ?? 0;
      const ci_to_sync = toSyncResult?.count ?? 0;
      const ci_completed = completedResult?.count ?? 0;

      // Get total completed count (can be a sum of different completed tasks)
      const totalCompleted = ci_completed; // Add other completed counts here in the future

      // Get current counters
      const currentCounters = await this.getDashboardCounters();

      // Update with actual counts
      await this.updateDashboardCounters({
        total_completed: totalCompleted,
        ci_assigned: ci_assigned,
        ci_draft: ci_draft,
        ci_completed: ci_completed,
        ci_to_sync: ci_to_sync,
        // Keep MI counters as they are for now
        mi_assigned: currentCounters.meterInstallation.assigned,
        mi_draft: currentCounters.meterInstallation.draft,
        mi_completed: currentCounters.meterInstallation.completed,
        mi_to_sync: currentCounters.meterInstallation.toSync,
      });

      return { success: true };
    } catch (error) {
      console.error(
        'Update dashboard counters from installations failed:',
        error
      );
      return { success: false, error: error.message };
    }
  }

  // Consumer Master operations
  async insertConsumerMasterData(consumers) {
    try {
      console.log('Inserting consumer master data, count:', consumers.length);
      if (consumers.length > 0) {
        console.log('First consumer:', consumers[0]);
      }

      // Begin transaction for better performance
      await this.db.execAsync('BEGIN TRANSACTION;');

      // Clear existing data
      await this.db.runAsync('DELETE FROM consumerMaster');

      // Insert new data
      let insertedCount = 0;
      for (const consumer of consumers) {
        // Skip consumers without required fields
        if (!consumer.ConsumerID) {
          console.log('Skipping consumer without ConsumerID:', consumer);
          continue;
        }

        const result = await this.db.runAsync(
          `INSERT OR REPLACE INTO consumerMaster 
           (ConsumerID, CustomerName, Address, Email, Phone, PaymentStatus, AmountDue, LastPaymentDate)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            consumer.ConsumerID,
            consumer.CustomerName,
            consumer.Address,
            consumer.Email,
            consumer.Phone,
            consumer.PaymentStatus,
            consumer.AmountDue,
            consumer.LastPaymentDate,
          ]
        );

        insertedCount++;
        // Log first 3 insertions and then every 10th insertion for progress tracking
        if (
          insertedCount <= 3 ||
          insertedCount % 10 === 0 ||
          insertedCount === consumers.length
        ) {
          console.log(
            `Inserted consumer ${insertedCount}:`,
            consumer.ConsumerID
          );
        }
      }

      // Commit transaction
      await this.db.execAsync('COMMIT;');

      console.log(`Successfully inserted ${insertedCount} consumer records`);
      return { success: true, count: insertedCount };
    } catch (error) {
      console.error('Insert consumer master data failed:', error);
      // Rollback transaction on error
      await this.db.execAsync('ROLLBACK;');
      return { success: false, error: error.message };
    }
  }

  async getConsumerMasterData(limit = 100) {
    try {
      const result = await this.db.getAllAsync(
        'SELECT * FROM consumerMaster LIMIT ?',
        [limit]
      );
      console.log(`Retrieved ${result.length} consumer records from database`);
      if (result.length > 0) {
        console.log('First few records:', result.slice(0, 3));
      }
      return result || [];
    } catch (error) {
      console.error('Get consumer master data failed:', error);
      return [];
    }
  }

  async clearConsumerMasterData() {
    try {
      const count = await this.getTableCount('consumerMaster');
      console.log(`Clearing ${count} consumer records from database`);
      await this.db.runAsync('DELETE FROM consumerMaster');
      return { success: true };
    } catch (error) {
      console.error('Clear consumer master data failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Clear consumer indexing data
  async clearConsumerIndexingData() {
    try {
      const count = await this.getTableCount('consumer_indexing');
      console.log(`Clearing ${count} consumer indexing records from database`);
      await this.db.runAsync('DELETE FROM consumer_indexing');
      return { success: true };
    } catch (error) {
      console.error('Clear consumer indexing data failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Clear all data from all tables
  async clearAllData() {
    try {
      console.log('Clearing all data from all tables...');

      // Begin transaction for better performance
      await this.db.execAsync('BEGIN TRANSACTION;');

      // Clear all data from all tables
      await this.db.runAsync('DELETE FROM users');
      await this.db.runAsync('DELETE FROM installations');
      await this.db.runAsync('DELETE FROM captures');
      await this.db.runAsync('DELETE FROM sync_queue');
      await this.db.runAsync('DELETE FROM dashboard_stats');
      await this.db.runAsync('DELETE FROM dashboard_counters');
      await this.db.runAsync('DELETE FROM consumerMaster');
      await this.db.runAsync('DELETE FROM consumer_indexing');

      // Reset auto-increment counters
      await this.db.runAsync(
        `DELETE FROM sqlite_sequence WHERE name IN ('users', 'installations', 'captures', 'sync_queue', 'dashboard_stats', 'dashboard_counters', 'consumerMaster', 'consumer_indexing')`
      );

      // Commit transaction
      await this.db.execAsync('COMMIT;');

      // Reinitialize dashboard counters with zeros
      await this.seedIfEmpty();

      console.log('All data cleared successfully');
      return { success: true };
    } catch (error) {
      console.error('Failed to clear all data:', error);
      // Rollback transaction on error
      await this.db.execAsync('ROLLBACK;');
      return { success: false, error: error.message };
    }
  }

  // Utility methods
  async getTableCount(tableName) {
    try {
      const result = await this.db.getFirstAsync(
        `SELECT COUNT(*) as count FROM ${tableName}`
      );
      console.log(`Table ${tableName} has ${result?.count || 0} records`);
      return result?.count || 0;
    } catch (error) {
      console.error(`Get ${tableName} count failed:`, error);
      return 0;
    }
  }

  // Insert Consumer Indexing Data
  async insertConsumerIndexingData(records) {
    try {
      console.log('Inserting consumer indexing data, count:', records.length);
      if (records.length > 0) {
        console.log('First record:', records[0]);
      }

      // Begin transaction for better performance
      await this.db.execAsync('BEGIN TRANSACTION;');

      // Clear existing data
      await this.db.runAsync('DELETE FROM consumer_indexing');

      // Check if EMAIL_M column exists
      let hasEmailMColumn = false;
      try {
        const emailColumnCheck = await this.db.getFirstAsync(`
          SELECT COUNT(*) as count 
          FROM pragma_table_info('consumer_indexing') 
          WHERE name = 'EMAIL_M'
        `);
        hasEmailMColumn = emailColumnCheck.count > 0;
      } catch (error) {
        console.log('Error checking for EMAIL_M column:', error.message);
      }

      // Check if other new columns exist
      let hasNewColumns = false;
      try {
        const newColumnsCheck = await this.db.getFirstAsync(`
          SELECT COUNT(*) as count 
          FROM pragma_table_info('consumer_indexing') 
          WHERE name IN ('created_by', 'modified_by', 'sync_status', 'pole_photo', 'old_meter_photo', 'old_meter_kwh_photo', 'house_photo')
        `);
        hasNewColumns = newColumnsCheck.count >= 7; // We expect 7 new columns
      } catch (error) {
        console.log('Error checking for new columns:', error.message);
      }

      console.log(
        'Column check - EMAIL_M:',
        hasEmailMColumn,
        'New columns:',
        hasNewColumns
      );

      // Use appropriate insert statement based on available columns
      let insertSQL, insertValues;

      if (hasEmailMColumn && hasNewColumns) {
        // Full insert with all columns
        insertSQL = `INSERT OR REPLACE INTO consumer_indexing 
          (survey_id, CONSUMER_ID_M, STATUS, DISCOM_M, ZONE_NAME_WITH_CODE_M, CIRCLE_NAME_WITH_CODE_M, 
           DIVISION_NAME_WITH_CODE_M, SUB_DIVISION_NAME_WITH_CODE_M, CONSUMER_NAME_M, 
           FATHER_HUSBAND_PROPRITEOR_NAME_M, SANCTIONED_LOAD_M, CONSUMER_ADDRESS_M, 
           REGISTERED_MOBILE_NO_AS_PER_RMS_M, SUB_STATION_CODE_M, SUB_STATION_NAME_M, 
           FEEDER_CODE_M, FEEDER_NAME_M, DTR_CODE_M, DTR_NAME_M, CATEGORY_IN_MASTER_DATA_M, 
           SUB_CATEGORY_CODE_M, OLD_METER_SERIAL_NUMBER_M, OLD_METER_PHASE_M, OLD_MF_M, 
           BILLING_TYPE_M, LATITUDE_M, LONGITUDE_M, OLD_METER_BADGE_NUMBER_M, METER_MAKE_M, 
           CONNECTED_LOAD_M, OLD_CONS_NO_M, READING_DIGITS_M, TDC_FLAG_M, MAXIMUM_DEMAND_M, 
           METER_READING_SEQUENCE_M, EMAIL_M, consumer_name, account_number, address, 
           contact_number, meter_serial_number, meter_type, sanctioned_load, feeder_code, 
           dt_code, pole_number, latitude, longitude, remarks, email, pole_photo, 
           old_meter_photo, old_meter_kwh_photo, house_photo, sync_status, created_by, modified_by)
          VALUES (?, ?, ?, ?, ?, ?, ?,  ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,

        insertValues = (record) => [
            record.survey_id || 'CI-2025-006',
            record.CONSUMER_ID_M,
            record.STATUS,
            record.DISCOM_M,
            record.ZONE_NAME_WITH_CODE_M,
            record.CIRCLE_NAME_WITH_CODE_M,
            record.DIVISION_NAME_WITH_CODE_M,
            record.SUB_DIVISION_NAME_WITH_CODE_M,
            record.CONSUMER_NAME_M,
            record.FATHER_HUSBAND_PROPRITEOR_NAME_M,
            record.SANCTIONED_LOAD_M,
            record.CONSUMER_ADDRESS_M,
            record.REGISTERED_MOBILE_NO_AS_PER_RMS_M,
            record.SUB_STATION_CODE_M,
            record.SUB_STATION_NAME_M,
            record.FEEDER_CODE_M,
            record.FEEDER_NAME_M,
            record.DTR_CODE_M,
            record.DTR_NAME_M,
            record.CATEGORY_IN_MASTER_DATA_M,
            record.SUB_CATEGORY_CODE_M,
            record.OLD_METER_SERIAL_NUMBER_M,
            record.OLD_METER_PHASE_M,
            record.OLD_MF_M,
            record.BILLING_TYPE_M,
            record.LATITUDE_M,
            record.LONGITUDE_M,
            record.OLD_METER_BADGE_NUMBER_M,
            record.METER_MAKE_M,
            record.CONNECTED_LOAD_M,
            record.OLD_CONS_NO_M,
            record.READING_DIGITS_M,
            record.TDC_FLAG_M,
            record.MAXIMUM_DEMAND_M,
            record.METER_READING_SEQUENCE_M,
            record.EMAIL_M,
            record.consumer_name,
            record.account_number,
            record.address,
            record.contact_number,
            record.meter_serial_number,
            record.meter_type,
            record.sanctioned_load,
            record.feeder_code,
            record.dt_code,
            record.pole_number,
            record.latitude,
            record.longitude,
            record.remarks,
            record.email,
            record.pole_photo,
            record.old_meter_photo,
            record.old_meter_kwh_photo,
            record.house_photo,
            'PENDING', // sync_status
            record.created_by,
            record.modified_by,
          ];
      } else {
        // Fallback for older schema without new columns
        insertSQL = `INSERT OR REPLACE INTO consumer_indexing 
          (CONSUMER_ID_M, STATUS, DISCOM_M, ZONE_NAME_WITH_CODE_M, CIRCLE_NAME_WITH_CODE_M, 
           DIVISION_NAME_WITH_CODE_M, SUB_DIVISION_NAME_WITH_CODE_M, CONSUMER_NAME_M, 
           FATHER_HUSBAND_PROPRITEOR_NAME_M, SANCTIONED_LOAD_M, CONSUMER_ADDRESS_M, 
           REGISTERED_MOBILE_NO_AS_PER_RMS_M, SUB_STATION_CODE_M, SUB_STATION_NAME_M, 
           FEEDER_CODE_M, FEEDER_NAME_M, DTR_CODE_M, DTR_NAME_M, CATEGORY_IN_MASTER_DATA_M, 
           SUB_CATEGORY_CODE_M, OLD_METER_SERIAL_NUMBER_M, OLD_METER_PHASE_M, OLD_MF_M, 
           BILLING_TYPE_M, LATITUDE_M, LONGITUDE_M, OLD_METER_BADGE_NUMBER_M, METER_MAKE_M, 
           CONNECTED_LOAD_M, OLD_CONS_NO_M, READING_DIGITS_M, TDC_FLAG_M, MAXIMUM_DEMAND_M, 
           METER_READING_SEQUENCE_M, EMAIL_M)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        insertValues = (record) => [
          record.CONSUMER_ID_M,
          record.STATUS,
          record.DISCOM_M,
          record.ZONE_NAME_WITH_CODE_M,
          record.CIRCLE_NAME_WITH_CODE_M,
          record.DIVISION_NAME_WITH_CODE_M,
          record.SUB_DIVISION_NAME_WITH_CODE_M,
          record.CONSUMER_NAME_M,
          record.FATHER_HUSBAND_PROPRITEOR_NAME_M,
          record.SANCTIONED_LOAD_M,
          record.CONSUMER_ADDRESS_M,
          record.REGISTERED_MOBILE_NO_AS_PER_RMS_M,
          record.SUB_STATION_CODE_M,
          record.SUB_STATION_NAME_M,
          record.FEEDER_CODE_M,
          record.FEEDER_NAME_M,
          record.DTR_CODE_M,
          record.DTR_NAME_M,
          record.CATEGORY_IN_MASTER_DATA_M,
          record.SUB_CATEGORY_CODE_M,
          record.OLD_METER_SERIAL_NUMBER_M,
          record.OLD_METER_PHASE_M,
          record.OLD_MF_M,
          record.BILLING_TYPE_M,
          record.LATITUDE_M,
          record.LONGITUDE_M,
          record.OLD_METER_BADGE_NUMBER_M,
          record.METER_MAKE_M,
          record.CONNECTED_LOAD_M,
          record.OLD_CONS_NO_M,
          record.READING_DIGITS_M,
          record.TDC_FLAG_M,
          record.MAXIMUM_DEMAND_M,
          record.METER_READING_SEQUENCE_M,
          record.EMAIL_M,
        ];
      }

      // Insert new data
      let insertedCount = 0;
      for (const record of records) {
        // Skip records without required fields
        if (!record.CONSUMER_ID_M) {
          console.log('Skipping record without CONSUMER_ID_M:', record);
          continue;
        }

        await this.db.runAsync(insertSQL, insertValues(record));

        insertedCount++;
        // Log first 3 insertions and then every 10th insertion for progress tracking
        if (
          insertedCount <= 3 ||
          insertedCount % 10 === 0 ||
          insertedCount === records.length
        ) {
          console.log(
            `Inserted record ${insertedCount}:`,
            record.CONSUMER_ID_M
          );
        }
      }

      // Commit transaction
      await this.db.execAsync('COMMIT;');

      console.log(
        `Successfully inserted ${insertedCount} consumer indexing records`
      );
      return { success: true, count: insertedCount };
    } catch (error) {
      console.error('Insert consumer indexing data failed:', error);
      // Rollback transaction on error
      await this.db.execAsync('ROLLBACK;');
      return { success: false, error: error.message };
    }
  }

  // Get Consumer Indexing Data
  async getConsumerIndexingData(limit = 100, offset = 0, filter = {}) {
    try {
      let query = 'SELECT * FROM consumer_indexing';
      const params = [];

      if (filter.status) {
        if (filter.status.toLowerCase() === 'assigned') {
          query += " WHERE IndexingStatus = 'Assigned' OR IndexingStatus IS NULL OR IndexingStatus = ''";
        } else {
          query += ' WHERE IndexingStatus = ?';
          params.push(filter.status);
        }
      }

      query += ' LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const result = await this.db.getAllAsync(query, params);
      console.log(
        `Retrieved ${result.length} consumer indexing records from database`
      );
      if (result.length > 0) {
        console.log('First few records:', result.slice(0, 3));
      }
      return result || [];
    } catch (error) {
      console.error('Get consumer indexing data failed:', error);
      return [];
    }
  }

  // Search Consumer Indexing Data
  async searchConsumerIndexing(searchTerm) {
    try {
      const result = await this.db.getAllAsync(
        `SELECT * FROM consumer_indexing 
         WHERE CONSUMER_ID_M LIKE ? OR CONSUMER_NAME_M LIKE ? OR REGISTERED_MOBILE_NO_AS_PER_RMS_M LIKE ?`,
        [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]
      );
      return result || [];
    } catch (error) {
      console.error('Search consumer indexing failed:', error);
      return [];
    }
  }

  // Get a single consumer indexing record by ID
  async getConsumerIndexingById(id) {
    try {
      const result = await this.db.getFirstAsync(
        'SELECT * FROM consumer_indexing WHERE id = ?',
        [id]
      );
      return result;
    } catch (error) {
      console.error('Get consumer indexing by ID failed:', error);
      return null;
    }
  }

  // Update a consumer indexing record
  async updateConsumerIndexing(id, data) {
    try {
      const fields = Object.keys(data);
      const values = Object.values(data);

      if (fields.length === 0) {
        return { success: false, error: 'No data provided for update' };
      }

      const setClause = fields.map((field) => `${field} = ?`).join(', ');

      await this.db.runAsync(
        `UPDATE consumer_indexing SET ${setClause}, modified_on = ? WHERE id = ?`,
        [...values, new Date().toISOString(), id]
      );

      // Add to sync queue
      await this.addToSyncQueue('consumer_indexing', id, 'UPDATE', data, 2);

      return { success: true };
    } catch (error) {
      console.error('Update consumer indexing failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Get all images for a specific consumer
  async getImagesForConsumer(consumerId) {
    try {
      const result = await this.db.getAllAsync(
        'SELECT * FROM consumer_images WHERE consumer_id = ? ORDER BY id ASC',
        [consumerId]
      );
      return result || [];
    } catch (error) {
      console.error('Get images for consumer failed:', error);
      return [];
    }
  }

  // Get unique DTR data with coordinates for GIS
  async getDtrData() {
    try {
      // Fetch potential DTR identifiers and coordinates from both legacy (*_M) and camelCase columns
      const rows = await this.db.getAllAsync(
        `SELECT 
           DTR_CODE_M, DTR_NAME_M, LATITUDE_M, LONGITUDE_M,
           dtrCode, dtrName, latitude, longitude
         FROM consumer_indexing
         WHERE (DTR_CODE_M IS NOT NULL AND DTR_CODE_M <> '')
            OR (dtrCode IS NOT NULL AND dtrCode <> '')`
      );

      const byCode = new Map();
      for (const r of rows) {
        const code = r.DTR_CODE_M || r.dtrCode;
        const name = r.DTR_NAME_M || r.dtrName || '';
        const lat = r.LATITUDE_M ?? r.latitude;
        const lon = r.LONGITUDE_M ?? r.longitude;

        if (!code) continue;

        // Prefer entries which have valid coordinates
        const hasCoords = lat != null && lon != null;
        if (!byCode.has(code)) {
          byCode.set(code, {
            dtr_code: code,
            dtr_name: name,
            latitude: hasCoords ? String(lat) : null,
            longitude: hasCoords ? String(lon) : null,
          });
        } else if (hasCoords) {
          // Upgrade existing entry with coordinates if missing
          const existing = byCode.get(code);
          if (existing.latitude == null || existing.longitude == null) {
            existing.latitude = String(lat);
            existing.longitude = String(lon);
          }
          if (!existing.dtr_name && name) {
            existing.dtr_name = name;
          }
        }
      }

      return Array.from(byCode.values());
    } catch (error) {
      console.error('Get DTR data failed:', error);
      return [];
    }
  }

  // Close database connection
  async close() {
    try {
      if (this.db) {
        await this.db.closeAsync();
        this.db = null;
        this.isInitialized = false;
        console.log('Database connection closed');
      }
    } catch (error) {
      console.error('Failed to close database:', error);
    }
  }
}

// Export a singleton instance
const databaseService = new DatabaseService();
export default databaseService;
