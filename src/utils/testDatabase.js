import databaseService from '../services/databaseService';

/**
 * Test database functionality
 */
export const testDatabase = async () => {
  try {
    console.log('Testing database functionality...');
    
    // Initialize database
    await databaseService.initialize();
    console.log('Database initialized successfully');
    
    // Test getting dashboard stats (should be empty initially)
    const initialStats = await databaseService.getDashboardStats();
    console.log('Initial dashboard stats:', initialStats);
    
    // Test getting installations (should be empty initially)
    const initialInstallations = await databaseService.getInstallations();
    console.log('Initial installations count:', initialInstallations.length);
    
    // Test getting user (should be null initially)
    const initialUser = await databaseService.getUser('+91 8981675554');
    console.log('Initial user:', initialUser);
    
    console.log('Database test completed successfully!');
    return { success: true };
  } catch (error) {
    console.error('Database test failed:', error);
    return { success: false, error: error.message };
  }
};

// Run the test if called directly
if (require.main === module) {
  testDatabase()
    .then(() => {
      console.log('Test execution completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}