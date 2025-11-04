const appConfig = {
  // Feature toggles
  features: {
    watermark: true,
    simValidation: true,
  },

  // Watermark configuration
  watermark: {
    // Format for the watermark text. Placeholders will be replaced dynamically.
    // Available placeholders: {userName}, {userId}, {dateTime}, {lat}, {lng}
    format: 'Captured by: {userName} ({userId}) | {dateTime}',
  },

  // Sync configuration
  sync: {
    autoSync: false, // keep background/periodic sync OFF by default
    intervalMinutes: 15,
    maxRetries: 3,
    batchSize: 50,
  },
};

export default appConfig;