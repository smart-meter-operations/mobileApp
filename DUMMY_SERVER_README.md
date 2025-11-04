# Dummy Image Upload API Server

A simple Node.js/Express server for testing image upload functionality and CORS issues without needing to run the full React Native app.

## Features

- ✅ **CORS Enabled** - Handles cross-origin requests
- ✅ **Image Upload Simulation** - Simulates file upload responses
- ✅ **Static File Serving** - Serves test images from `/assets` folder
- ✅ **Health Check Endpoint** - `/health` for server status
- ✅ **Test Endpoint** - `/api/test` for connectivity testing

## Quick Start

### 1. Install Dependencies
```bash
npm install express cors
```

### 2. Start the Server
```bash
node dummy-server.js
```

Or using npm script:
```bash
npm run start
```

### 3. Server Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/test` | GET | Test connectivity |
| `/api/upload-image` | POST | Simulate image upload |
| `/assets/*` | GET | Serve static files |

## Testing Image Upload

### Using cURL
```bash
curl -X POST http://localhost:3001/api/upload-image \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

### Using JavaScript/Fetch
```javascript
fetch('http://localhost:3001/api/upload-image', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ test: 'data' })
})
.then(response => response.json())
.then(data => console.log(data));
```

## CORS Configuration

The server is configured with permissive CORS settings:
```javascript
app.use(cors({
  origin: '*', // Allow all origins for testing
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

## Test Images

The server serves images from the `assets/` folder:
- `http://localhost:3001/assets/icon.png` - Main app icon
- `http://localhost:3001/assets/splash.png` - Splash screen image

## Integration with React Native App

Update your app's API service to point to the dummy server for testing:

```javascript
// In apiService.js
const uploadUrl = __DEV__
  ? 'http://localhost:3001/api/upload-image'  // Use dummy server in development
  : 'https://your-production-api.com/upload'; // Use production API
```

## Troubleshooting

### Port Already in Use
```bash
# Check what's using port 3001
netstat -an | findstr :3001

# Kill process using the port
npx kill-port 3001
```

### Connection Refused
- Ensure the server is running on `localhost:3001`
- Check firewall settings
- Verify port 3001 is not blocked

## Development

The server runs on port 3001 by default. You can modify this in `dummy-server.js`:

```javascript
const PORT = 3001; // Change this to your preferred port
```

## Production Deployment

For production use, consider:
- Environment variables for port configuration
- Proper authentication/authorization
- Rate limiting
- Input validation
- Error handling
