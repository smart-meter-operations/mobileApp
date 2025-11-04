const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
const PORT = 3001;

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// Enable CORS for all routes
app.use(cors({
  origin: '*', // Allow all origins for testing
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Parse JSON bodies (for non-multipart requests)
app.use(express.json());

// Serve static files from assets directory for easy access
app.use('/assets', express.static(path.join(__dirname, 'assets')));

/**
 * Real Image Upload API Endpoint (matches production API)
 * POST /api/method/upload_file
 *
 * This endpoint simulates the actual Frappe upload_file method
 * Handles multipart/form-data with is_private, folder, and file fields
 */
app.post('/api/method/upload_file', upload.single('file'), (req, res) => {
  console.log('📤 Image upload request received (multipart/form-data)');
  console.log('Headers:', req.headers);
  console.log('Body fields:', req.body);
  console.log('File info:', req.file ? {
    fieldname: req.file.fieldname,
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size
  } : 'No file uploaded');

  // Validate required fields
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded',
      error: 'file is required'
    });
  }

  if (!req.body.is_private) {
    return res.status(400).json({
      success: false,
      message: 'Missing required field: is_private',
      error: 'is_private is required'
    });
  }

  if (!req.body.folder) {
    return res.status(400).json({
      success: false,
      message: 'Missing required field: folder',
      error: 'folder is required'
    });
  }

  // Simulate file processing and storage
  const fileId = 'file-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  const fileName = req.file.originalname || 'uploaded-image.png';

  // Create realistic response matching Frappe API format
  const response = {
    success: true,
    message: 'File uploaded successfully',
    data: {
      name: fileId,
      file_name: fileName,
      file_url: `/files/${fileName}`,
      is_private: parseInt(req.body.is_private) === 1,
      folder: req.body.folder,
      file_size: req.file.size,
      uploaded_at: new Date().toISOString(),
      // Additional metadata that might be expected
      mime_type: req.file.mimetype,
      file_type: req.file.mimetype.split('/')[0], // 'image', 'video', etc.
      uploaded_by: 'System'
    }
  };

  console.log('📥 Responding with:', JSON.stringify(response, null, 2));

  res.json(response);
});

/**
 * GET endpoint to test CORS and server connectivity
 */
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Dummy upload API server is running',
    timestamp: new Date().toISOString(),
    availableEndpoints: [
      'POST /api/method/upload_file - Real image upload (multipart/form-data)',
      'GET /assets/icon.png - Download test image'
    ],
    expectedFormat: {
      method: 'POST',
      url: '/api/method/upload_file',
      contentType: 'multipart/form-data',
      fields: {
        is_private: '0 or 1',
        folder: 'Home/Consumer Survey',
        file: 'file field with image data'
      }
    }
  });
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

/**
 * List available test files
 */
app.get('/api/files', (req, res) => {
  const assetsDir = path.join(__dirname, 'assets');
  fs.readdir(assetsDir, (err, files) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }

    const imageFiles = files.filter(file => /\.(png|jpg|jpeg|gif|webp)$/i.test(file));
    res.json({
      success: true,
      files: imageFiles.map(file => ({
        name: file,
        url: `/assets/${file}`,
        size: fs.statSync(path.join(assetsDir, file)).size
      }))
    });
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large',
        error: 'File size exceeds 10MB limit'
      });
    }
  }

  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: error.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 Dummy Image Upload API Server Started (Frappe-compatible)');
  console.log(`📍 Server running at: http://localhost:${PORT}`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/test`);
  console.log(`📷 Image files: http://localhost:${PORT}/api/files`);
  console.log(`📤 Upload endpoint: POST http://localhost:${PORT}/api/method/upload_file`);
  console.log('');
  console.log('🔧 CORS is enabled for all origins');
  console.log('📝 Server handles multipart/form-data exactly like Frappe API');
  console.log('📋 Expected format:');
  console.log('   - is_private: 0 or 1');
  console.log('   - folder: "Home/Consumer Survey"');
  console.log('   - file: image file');
});
