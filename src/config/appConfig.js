// Global app configuration
// Toggle features like auto-sync here without touching service code

export default {
  sync: {
    autoSync: false, // keep background/periodic sync OFF by default
    intervalMinutes: 15,
    maxRetries: 3,
    batchSize: 50,
  },
};
