import * as SQLite from 'expo-sqlite';

class DatabaseService {
  constructor() {
    this.db = null;
    this.isInitialized = false;
  }

  // Initialize database
  async initialize() {
    try {
      this.db = await SQLite.openDatabaseAsync('smov_offline.db');
      await this.createTables();
      this.isInitialized = true;
      console.log('Database initialized successfully');
      return true;
    } catch (error) {
      console.error('Database initialization failed:', error);
      return false;
    }
  }

  // Create all necessary tables
  async createTables() {
    try {
      // Users table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          phone TEXT UNIQUE,
          name TEXT,
          role TEXT,
          status TEXT DEFAULT 'offline',
          avatar TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
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
          retry_count INTEGER DEFAULT 0
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
          last_updated TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `);

      console.log('All tables created successfully');
    } catch (error) {
      console.error('Create tables failed:', error);
      throw error;
    }
  }

  // User operations
  async saveUser(userData) {
    try {
      const { phone, name, role, status = 'offline', avatar } = userData;
      
      const result = await this.db.runAsync(
        `INSERT OR REPLACE INTO users (phone, name, role, status, avatar, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [phone, name, role, status, avatar, new Date().toISOString()]
      );

      await this.addToSyncQueue('users', result.lastInsertRowId, 'INSERT', userData);
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
      const { name, address, status = 'pending', latitude, longitude, assigned_to } = installationData;
      
      const result = await this.db.runAsync(
        `INSERT INTO installations (name, address, status, latitude, longitude, assigned_to, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [name, address, status, latitude, longitude, assigned_to, new Date().toISOString()]
      );

      await this.addToSyncQueue('installations', result.lastInsertRowId, 'INSERT', installationData);
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

      await this.addToSyncQueue('installations', id, 'UPDATE', { status });
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
        bandwidth_info 
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
          new Date().toISOString()
        ]
      );

      await this.addToSyncQueue('captures', result.lastInsertRowId, 'INSERT', captureData);
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
        installation_pending = 0
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
          new Date().toISOString()
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
            pending: result.survey_pending
          },
          installation: {
            total: result.installation_total,
            completed: result.installation_completed,
            pending: result.installation_pending
          },
          lastUpdated: result.last_updated
        };
      }

      // Return default stats if no data found
      return {
        survey: { total: 0, completed: 0, pending: 0 },
        installation: { total: 0, completed: 0, pending: 0 },
        lastUpdated: null
      };
    } catch (error) {
      console.error('Get dashboard stats failed:', error);
      return {
        survey: { total: 0, completed: 0, pending: 0 },
        installation: { total: 0, completed: 0, pending: 0 },
        lastUpdated: null
      };
    }
  }

  // Sync queue operations
  async addToSyncQueue(tableName, recordId, action, data) {
    try {
      await this.db.runAsync(
        'INSERT INTO sync_queue (table_name, record_id, action, data) VALUES (?, ?, ?, ?)',
        [tableName, recordId, action, JSON.stringify(data)]
      );
    } catch (error) {
      console.error('Add to sync queue failed:', error);
    }
  }

  async getSyncQueue(limit = 100) {
    try {
      const result = await this.db.getAllAsync(
        'SELECT * FROM sync_queue ORDER BY created_at ASC LIMIT ?',
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

  // Utility methods
  async getTableCount(tableName) {
    try {
      const result = await this.db.getFirstAsync(
        `SELECT COUNT(*) as count FROM ${tableName}`
      );
      return result?.count || 0;
    } catch (error) {
      console.error(`Get ${tableName} count failed:`, error);
      return 0;
    }
  }

  async clearAllData() {
    try {
      await this.db.execAsync(`
        DELETE FROM captures;
        DELETE FROM installations;
        DELETE FROM users;
        DELETE FROM sync_queue;
        DELETE FROM dashboard_stats;
      `);
      console.log('All data cleared successfully');
      return { success: true };
    } catch (error) {
      console.error('Clear all data failed:', error);
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
export default new DatabaseService();