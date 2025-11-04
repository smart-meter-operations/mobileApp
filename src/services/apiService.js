import { API_CONFIG } from '../constants';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import DatabaseService from './databaseService';
import networkService from './networkService';
import NetInfo from '@react-native-community/netinfo';
import appConfig from '../config/appConfig';
import * as FileSystem from 'expo-file-system/legacy';

// Check network connectivity
async function checkNetworkConnectivity() {
  try {
    const netInfo = await NetInfo.fetch();
    console.log('🌐 Network connectivity check:', netInfo);

    if (!netInfo.isConnected) {
      return { connected: false, type: null, error: 'No internet connection' };
    }

    if (!netInfo.isInternetReachable) {
      return { connected: false, type: netInfo.type, error: 'Internet not reachable' };
    }

    return { connected: true, type: netInfo.type, details: netInfo.details };
  } catch (error) {
    console.error('Network check error:', error);
    return { connected: false, type: null, error: 'Network check failed' };
  }
}

// API Response handler
class ApiResponse {
  constructor(data, status, success = true, message = '') {
    this.data = data;
    this.status = status;
    this.success = success;
    this.message = message;
  }
}

// HTTP Client with error handling and retry logic
class HttpClient {
  constructor(baseURL = API_CONFIG.baseUrl, timeout = API_CONFIG.timeout) {
    this.baseURL = baseURL;
    this.timeout = timeout;
    this.retryAttempts = API_CONFIG.retryAttempts;

    // Default headers
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    // Auth token (will be set after login)
    this.authToken = null;
  }

  // Set authentication token
  setAuthToken(token) {
    this.authToken = token;
  }

  // Remove authentication token
  clearAuthToken() {
    this.authToken = null;
  }

  // Get headers with auth token if available
  getHeaders(customHeaders = {}) {
    const headers = { ...this.defaultHeaders, ...customHeaders };

    if (this.authToken) {
      headers.Authorization = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  // Make HTTP request with retry logic
  async request(endpoint, options = {}) {
    // Check if endpoint is an absolute URL
    const isAbsoluteUrl = endpoint.startsWith('http://') || endpoint.startsWith('https://');
    const url = isAbsoluteUrl ? endpoint : `${this.baseURL}${endpoint}`;
    
    // Get headers with special handling for Authorization
    let headers = { ...this.defaultHeaders, ...options.headers };
    
    // Only add Bearer token if no Authorization header is provided in options
    if (this.authToken && !options.headers?.Authorization) {
      headers.Authorization = `Bearer ${this.authToken}`;
    }

    const requestOptions = {
      ...options,
      headers,
    };

    // Add timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    requestOptions.signal = controller.signal;

    let lastError;

    // Retry logic
    for (let attempt = 0; attempt <= this.retryAttempts; attempt++) {
      try {
        console.log(`API Request [Attempt ${attempt + 1}]:`, {
          method: options.method || 'GET',
          url,
          headers: requestOptions.headers,
          body: options.body,
        });

        const response = await fetch(url, requestOptions);
        clearTimeout(timeoutId);

        // Parse response
        let data = null;
        const contentType = response.headers.get('content-type');

        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else {
          data = await response.text();
        }

        console.log(`API Response [${response.status}]:`, data);

        if (response.ok) {
          return new ApiResponse(data, response.status, true);
        } else {
          // Handle HTTP errors
          const errorMessage =
            data?.message || data?.error || `HTTP ${response.status}`;
          return new ApiResponse(null, response.status, false, errorMessage);
        }
      } catch (error) {
        clearTimeout(timeoutId);
        lastError = error;

        console.warn(
          `API Request failed [Attempt ${attempt + 1}]:`,
          error.message
        );

        // Don't retry on certain errors
        if (
          error.name === 'AbortError' ||
          error.message.includes('Network request failed')
        ) {
          if (attempt < this.retryAttempts) {
            // Wait before retry (exponential backoff)
            const delay = Math.pow(2, attempt) * 1000;
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }
        }

        break;
      }
    }

    // All retries failed
    const errorMessage = lastError?.message || 'Network request failed';
    console.error('API Request failed after all retries:', errorMessage);
    return new ApiResponse(null, 0, false, errorMessage);
  }

  // HTTP Methods
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;

    return this.request(url, {
      method: HTTP_METHODS.GET,
    });
  }

  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: HTTP_METHODS.POST,
      body: JSON.stringify(data),
    });
  }

  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: HTTP_METHODS.PUT,
      body: JSON.stringify(data),
    });
  }

  async patch(endpoint, data = {}) {
    return this.request(endpoint, {
      method: HTTP_METHODS.PATCH,
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, {
      method: HTTP_METHODS.DELETE,
    });
  }
}

// Create HTTP client instance
const httpClient = new HttpClient();

// API Service class
export class ApiService {
  // Toggle mock mode to serve data from local SQLite instead of network
  // Ensure this is always a boolean, even if loaded from env vars (which are strings)
  // For example, `process.env.REACT_APP_MOCK_MODE === 'true'`
  static mockMode = true; 

  // Authentication APIs
  static async login(phoneNumber) {
    // For now, return mock response
    if (appConfig.features.simValidation) {
      try {
        const user = await DatabaseService.getUser(phoneNumber);
        if (user && user.sim_provider) {
          const primarySim = await networkService.getPrimarySimCarrier();
          if (primarySim && user.sim_provider.toLowerCase() !== primarySim.toLowerCase()) {
            const errorMessage = `SIM card validation failed. Please use the registered SIM card (${user.sim_provider}). Detected: ${primarySim}.`;
            console.error(errorMessage);
            return new ApiResponse(null, 403, false, errorMessage);
          }
        } else if (user) {
          console.warn(`SIM validation skipped for user ${phoneNumber}: no sim_provider in database.`);
        }
      } catch (error) {
        console.error('Error during SIM validation:', error);
        // Decide if login should fail here. For now, we'll allow it but log an error.
      }
    }

    // In production, this will make actual API call
    return httpClient.post('/auth/login', { phoneNumber });
  }

  static async verifyOTP(phoneNumber, otp) {
    // For now, return mock response
    // In production, this will make actual API call
    return httpClient.post('/auth/verify-otp', { phoneNumber, otp });
  }

  // New OTP APIs for actual OTP functionality
  static async sendOTPReal(phoneNumber) {
    try {
      // Check network connectivity first
      const networkStatus = await checkNetworkConnectivity();
      if (!networkStatus.connected) {
        console.error('❌ Network connectivity issue:', networkStatus.error);
        return new ApiResponse(null, 0, false, `Network error: ${networkStatus.error}`);
      }

      // Use longer timeout for OTP API and disable AbortController for debugging
      const otpTimeout = API_CONFIG.otpTimeout || 30000;

      console.log(`🚀 Sending OTP via API for: ${phoneNumber}`);
      console.log(`🌐 Network type: ${networkStatus.type}`);

      // Prepare request data
      const requestData = {
        phone: `+91${phoneNumber.replace(/\D/g, '').slice(-10)}`
      };

      console.log('📤 OTP Request payload:', requestData);

      // Diagnostics: basic TLS reachability test
      try {
        const tlsTest = await fetch('https://httpbin.org/get');
        console.log(`🧪 TLS test to httpbin status: ${tlsTest.status}`);
      } catch (e) {
        console.log('🧪 TLS test failed:', { name: e?.name, message: e?.message, stack: e?.stack });
      }

      // Diagnostics: DNS-over-HTTPS resolve of ALB hostname (A + AAAA)
      try {
        const dohA = await fetch('https://dns.google/resolve?name=bff-alb-927359164.ap-south-1.elb.amazonaws.com&type=A');
        const dohAAAA = await fetch('https://dns.google/resolve?name=bff-alb-927359164.ap-south-1.elb.amazonaws.com&type=AAAA');
        const aJson = await dohA.json().catch(() => null);
        const aaaaJson = await dohAAAA.json().catch(() => null);
        console.log('🧭 DoH A records:', aJson?.Answer?.map(a => a.data));
        console.log('🧭 DoH AAAA records:', aaaaJson?.Answer?.map(a => a.data));
      } catch (e) {
        console.log('🧭 DoH resolution failed:', { name: e?.name, message: e?.message, stack: e?.stack });
      }

      // Diagnostics: hit the OTP endpoint with GET to check SSL/DNS reachability
      try {
        const reachability = await fetch('https://wattly-bff.connect2.in/otpauth/send-otp', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Wattly-SMOV/1.0 (ExpoGo RN fetch)'
          },
        });
        console.log(`🧪 Endpoint reachability (GET) status: ${reachability.status}`);
      } catch (e) {
        console.log('🧪 Endpoint reachability (GET) failed:', { name: e?.name, message: e?.message, stack: e?.stack });
      }

      // Diagnostics: HEAD probe
      try {
        const headResp = await fetch('https://wattly-bff.connect2.in/otpauth/send-otp', {
          method: 'HEAD',
          headers: {
            'User-Agent': 'Wattly-SMOV/1.0 (ExpoGo RN fetch)'
          },
        });
        console.log(`🧪 Endpoint reachability (HEAD) status: ${headResp.status}`);
      } catch (e) {
        console.log('🧪 Endpoint reachability (HEAD) failed:', { name: e?.name, message: e?.message, stack: e?.stack });
      }

      // Use native fetch without AbortController for OTP API to debug abort issues
      const response = await fetch('https://wattly-bff.connect2.in/otpauth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Wattly-SMOV/1.0 (ExpoGo RN fetch)'
        },
        body: JSON.stringify(requestData)
      });

      // Parse response
      let data = null;
      const contentType = response.headers.get('content-type');

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      console.log(`📥 OTP Response [${response.status}]:`, data);

      if (response.ok) {
        console.log('✅ OTP sent successfully');
        return new ApiResponse(data, response.status, true);
      } else {
        const errorMessage = data?.message || data?.error || `HTTP ${response.status}`;
        console.error('❌ OTP send failed:', errorMessage);
        return new ApiResponse(null, response.status, false, errorMessage);
      }
    } catch (error) {
      console.error('💥 Send OTP API error:', error);

      // Provide more specific error messages
      let errorMessage = 'Failed to send OTP';
      if (error.message?.includes('Network request failed')) {
        errorMessage = 'Network connection error. Please check your internet connection.';
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again.';
      } else if (error.message?.includes('SSL')) {
        errorMessage = 'SSL/TLS error. Please check network security settings.';
      }

      return new ApiResponse(null, 0, false, errorMessage);
    }
  }

  static async verifyOTPReal(phoneNumber, otp) {
    try {
      // Check network connectivity first
      const networkStatus = await checkNetworkConnectivity();
      if (!networkStatus.connected) {
        console.error('❌ Network connectivity issue:', networkStatus.error);
        return new ApiResponse(null, 0, false, `Network error: ${networkStatus.error}`);
      }

      console.log(`🔐 Verifying OTP via API for: ${phoneNumber}`);
      console.log(`🌐 Network type: ${networkStatus.type}`);

      // Prepare request data
      const requestData = {
        phone: `+91${phoneNumber.replace(/\D/g, '').slice(-10)}`,
        code: otp
      };

      console.log('📤 OTP Verify payload:', requestData);

      // Single ALB endpoint for verify OTP
      const response = await fetch('https://wattly-bff.connect2.in/otpauth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      console.log(`📥 OTP Verify Response [${response.status}]:`, response.status);

      // Parse response
      let data = null;
      const contentType = response.headers.get('content-type');

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      console.log(`📋 Response data:`, data);

      if (response.ok) {
        console.log('✅ OTP verified successfully');
        return new ApiResponse(data, response.status, true);
      } else {
        const errorMessage = data?.message || data?.error || `HTTP ${response.status}`;
        console.error('❌ OTP verification failed:', errorMessage);
        return new ApiResponse(null, response.status, false, errorMessage);
      }

    } catch (error) {
      console.error('💥 Verify OTP API error:', error);

      // Provide more specific error messages
      let errorMessage = 'Failed to verify OTP';
      if (error.message?.includes('Network request failed')) {
        errorMessage = 'Network connection error. Please check your internet connection.';
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again.';
      } else if (error.message?.includes('SSL')) {
        errorMessage = 'SSL/TLS error. Please check network security settings.';
      }

      return new ApiResponse(null, 0, false, errorMessage);
    }
  }

  static async logout() {
    // For now, return mock response
    // In production, this will make actual API call
    httpClient.clearAuthToken();
    return httpClient.post('/auth/logout');
  }

  // User APIs
  static async getUserProfile() {
    if (ApiService.mockMode) {
      try {
        const user = await DatabaseService.getUser('+91 8981675554');
        if (!user) {
          return new ApiResponse(null, 404, false, 'User not found');
        }
        return new ApiResponse({
          id: user.id,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
          status: user.status,
          phoneNumber: user.phone,
          employeeId: 'EMP001',
          department: 'Field Operations',
          simProvider: user.sim_provider,
        }, 200, true);
      } catch (e) {
        return new ApiResponse(null, 500, false, e.message);
      }
    }
    return httpClient.get('/user/profile');
  }

  static async updateUserProfile(userData) {
    return httpClient.put('/user/profile', userData);
  }

  // Dashboard APIs
  static async getDashboardStats() {
    if (ApiService.mockMode) {
      try {
        const stats = await DatabaseService.getDashboardStats();
        return new ApiResponse(stats, 200, true);
      } catch (e) {
        return new ApiResponse(null, 500, false, e.message);
      }
    }
    return httpClient.get('/dashboard/stats');
  }

  // Task APIs
  static async getTasks(params = {}) {
    return httpClient.get('/tasks', params);
  }

  static async getTaskById(taskId) {
    return httpClient.get(`/tasks/${taskId}`);
  }

  static async createTask(taskData) {
    return httpClient.post('/tasks', taskData);
  }

  static async updateTask(taskId, taskData) {
    return httpClient.put(`/tasks/${taskId}`, taskData);
  }

  static async updateTaskStatus(taskId, status) {
    return httpClient.patch(`/tasks/${taskId}/status`, { status });
  }

  static async deleteTask(taskId) {
    return httpClient.delete(`/tasks/${taskId}`);
  }

  // Installation APIs
  static async getInstallations(params = {}) {
    if (ApiService.mockMode) {
      try {
        const list = await DatabaseService.getInstallations();
        return new ApiResponse(list, 200, true);
      } catch (e) {
        return new ApiResponse(null, 500, false, e.message);
      }
    }
    return httpClient.get('/installations', params);
  }

  static async createInstallation(installationData) {
    return httpClient.post('/installations', installationData);
  }

  static async updateInstallation(installationId, installationData) {
    return httpClient.put(`/installations/${installationId}`, installationData);
  }

  // Survey APIs
  static async getSurveys(params = {}) {
    return httpClient.get('/surveys', params);
  }

  static async createSurvey(surveyData) {
    return httpClient.post('/surveys', surveyData);
  }

  static async updateSurvey(surveyId, surveyData) {
    return httpClient.put(`/surveys/${surveyId}`, surveyData);
  }

  // Consumer Indexing APIs
  static async submitConsumerIndexingData(indexingData) {
    return httpClient.post('/consumer-indexing', indexingData);
  }

  /**
   * PUT to Frappe endpoint with token auth for Consumer Survey updates
   * @param {Object} params - The parameters
   * @param {string} params.docName - The document name
   * @param {Object} params.payload - The payload to send
   * @param {string} params.token - The token for authentication
   * @returns {Promise<Object>} The response object with success, status, and data/message
   */
  static async updateConsumerSurveyAbsolute({ docName, payload, token }) {
    try {
      // Use the requested absolute URL and dynamic document ID
      const absoluteUrl = `https://sponge-balanced-cat.ngrok-free.app/api/resource/Consumer Survey/CI-2025-006`;
      
      // Log request details for troubleshooting
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };
      // Always include Authorization as requested
      headers['Authorization'] = `token ${token || '0a3ac2415acc9a4:ee04f1881306858'}`;
      // Sanitize payload: remove newlines and trim string values
      const sanitizedPayload = Object.fromEntries(
        Object.entries(payload || {}).map(([k, v]) => {
          if (typeof v === 'string') {
            return [k, v.replace(/\r?\n/g, ' ').trim()];
          }
          return [k, v];
        })
      );

      console.log('PUT Consumer Survey request:', {
        url: absoluteUrl,
        headers,
        payloadKeys: Object.keys(sanitizedPayload),
      });
      // Log exact request JSON
      try {
        console.log('PUT Consumer Survey request body (exact JSON):', JSON.stringify(sanitizedPayload, null, 2));
      } catch (e) {
        console.warn('Failed to stringify request payload:', e?.message);
      }

      const response = await fetch(absoluteUrl, {
        method: 'PUT',
        headers,
        body: JSON.stringify(sanitizedPayload)
      });

      let data = null;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }
      // Log exact response JSON or text
      try {
        if (typeof data === 'string') {
          console.log('PUT Consumer Survey response body (raw text):', data);
        } else {
          console.log('PUT Consumer Survey response body (exact JSON):', JSON.stringify(data, null, 2));
        }
      } catch (e) {
        console.warn('Failed to stringify response body:', e?.message);
      }

      if (response.ok) {
        return { success: true, status: response.status, data };
      } else {
        // Handle HTTP errors
        const message = data?.message || data?.error || data || `HTTP ${response.status}`;
        console.error('PUT Consumer Survey failed:', {
          url: absoluteUrl,
          status: response.status,
          message,
          headers,
          requestBodyKeys: Object.keys(sanitizedPayload || {}),
          response: data,
        });
        return { success: false, status: response.status, message };
      }
    } catch (error) {
      console.error('updateConsumerSurveyAbsolute error:', {
        message: error?.message,
        stack: error?.stack,
        error,
      });
      return { success: false, status: 0, message: error.message || 'Network request failed' };
    }
  }

  static async testConsumerSurveyPutSample() {
    const docName = 'CI-2025-006';
    const samplePayload = {
      correct_consumer_name: 'Shri Amit Srivastava',
      actual_consumer_address: 'Sector 21, KOLKATA',
      meter_in_metallic_enclosure: 'No',
    };

    return this.updateConsumerSurveyAbsolute({ docName, payload: samplePayload });
  }

  /**
   * Uploads an image as multipart/form-data to the new API endpoint.
   * @param {Object} params - The parameters
   * @param {string} params.imageUri - The file URI of the image to upload
   * @param {string} params.fileName - The name of the file
   * @returns {Promise<Object>} The response object
   */
  static async uploadImage({ imageUri, fileName }) {
    const url = 'https://wattly-bff.connect2.in/upload_image/';
    const headers = {
      Accept: 'application/json',
      'User-Agent': 'Wattly-SMOV/1.0 (ExpoGo RN fetch)',
      // Do NOT set Content-Type manually; let fetch set the multipart boundary
    };

    try {
      // Validate inputs
      if (!imageUri || typeof imageUri !== 'string') {
        throw new Error('Invalid image URI provided');
      }
      if (!fileName || typeof fileName !== 'string') {
        throw new Error('Invalid file name provided');
      }

      // Check if the imageUri is a placeholder value
      if (imageUri === 'photo_captured') {
        throw new Error('Image URI is a placeholder value, not an actual file path');
      }

      // Sanitize filename for multipart (remove any path components or illegal chars)
      const safeFileName = (fileName || 'image.jpg').toString().split('\\').pop().split('/').pop().replace(/[^A-Za-z0-9._-]/g, '_');

      // Validate file exists and is accessible before uploading
      console.log('Validating image file before upload:', imageUri);
      
      // Check if FileSystem is properly imported and available
      let fileSystemAvailable = false;
      try {
        if (typeof FileSystem !== 'undefined' && FileSystem.getInfoAsync) {
          fileSystemAvailable = true;
          console.log('FileSystem module is available');
        } else {
          console.warn('FileSystem module not properly imported or available');
        }
      } catch (fsCheckError) {
        console.warn('Error checking FileSystem availability:', fsCheckError.message);
      }

      // Only validate with FileSystem if it's available and the URI is a file URI
      if (fileSystemAvailable && imageUri.startsWith('file://')) {
        try {
          console.log('Attempting FileSystem.getInfoAsync...');
          const fileInfo = await FileSystem.getInfoAsync(imageUri);
          console.log('FileSystem.getInfoAsync result:', fileInfo);
          if (!fileInfo.exists) {
            throw new Error('Image file does not exist or is not accessible');
          }
          if (fileInfo.size > 10 * 1024 * 1024) { // 10MB limit
            throw new Error('Image file is too large for upload (>10MB)');
          }
          if (fileInfo.size < 1024) { // 1KB minimum
            throw new Error('Image file is too small, may be corrupted');
          }

          console.log('Image file validation passed for upload:', {
            size: fileInfo.size,
            uri: imageUri,
            fileName: fileName
          });
        } catch (fileError) {
          console.warn('FileSystem validation failed in upload, continuing anyway:', fileError.message);
          console.error('FileSystem error details:', fileError);
          // For some URI formats (like content://), FileSystem might not work
          // but the file might still be valid, so we'll continue
        }
      } else {
        console.warn('Skipping FileSystem validation as module is not available or URI is not a file:// URI');
      }

    // Detect MIME type based on file extension
    const fileExtension = fileName.toLowerCase().split('.').pop();
    let mimeType = 'image/jpeg'; // Default

    switch (fileExtension) {
      case 'png':
        mimeType = 'image/png';
        break;
      case 'jpg':
      case 'jpeg':
        mimeType = 'image/jpeg';
        break;
      case 'gif':
        mimeType = 'image/gif';
        break;
      case 'webp':
        mimeType = 'image/webp';
      default:
        console.warn(`Unknown image extension: ${fileExtension}, defaulting to image/jpeg`);
    }

    // Reachability diagnostics (GET/HEAD)
    try {
      const reachGet = await fetch(url, { method: 'GET', headers: { 'Accept': 'application/json' } });
      console.log('🧪 Upload endpoint reachability (GET) status:', reachGet.status);
    } catch (e) {
      console.log('🧪 Upload endpoint reachability (GET) failed:', { name: e?.name, message: e?.message });
    }
    try {
      const reachHead = await fetch(url, { method: 'HEAD' });
      console.log('🧪 Upload endpoint reachability (HEAD) status:', reachHead.status);
    } catch (e) {
      console.log('🧪 Upload endpoint reachability (HEAD) failed:', { name: e?.name, message: e?.message });
    }

    // Primary approach: React Native FormData file object (uri/name/type)
    const formDataRN = new FormData();
    const rnFile = { uri: imageUri, name: safeFileName, type: mimeType };
    formDataRN.append('file', rnFile);

    console.log('--- IMAGE UPLOAD REQUEST ---');
    console.log('URL:', url);
    console.log('Method: POST');
    console.log('Headers:', headers);
    console.log('FormData Fields:', {
      fileName: safeFileName,
      field: 'file',
      type: mimeType,
      rnFileKeys: Object.keys(rnFile)
    });
    console.log('--------------------------');

    // Add timeout for upload
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

    console.log('Initiating API fetch to upload image (RN file object)...');
    console.log('URL:', url);
    console.log('Headers:', headers);
    console.log('FormData keys:', [...formDataRN.keys()]);
    let response = await fetch(url, {
      method: 'POST',
      body: formDataRN,
      headers: headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log('API fetch response status:', response.status);
    console.log('API fetch response headers:', response.headers);

    const responseHeadersObj = {};
    try {
      if (response.headers && response.headers.forEach) {
        response.headers.forEach((v, k) => {
          responseHeadersObj[k] = v;
        });
      }
    } catch {}
    console.log('API fetch response headers (object):', responseHeadersObj);

    console.log('Environment info:', {
      platform: Platform.OS,
      appOwnership: (Constants && Constants.appOwnership) ? Constants.appOwnership : 'unknown',
    });

    const corsHeaders = {
      'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
      'access-control-allow-methods': response.headers.get('access-control-allow-methods'),
      'access-control-allow-headers': response.headers.get('access-control-allow-headers'),
    };
    console.log('CORS headers:', corsHeaders);

    let data = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // Enhanced logging for response
    console.log('--- IMAGE UPLOAD RESPONSE ---');
    console.log('Status:', response.status);
    console.log('Body:', data);
    console.log('---------------------------');

    if (response.ok) {
      console.log(`Image ${safeFileName} uploaded successfully.`);
      return { success: true, status: response.status, data };
    }

    console.error(`Image ${safeFileName} upload failed.`);
    const errorMessage = (typeof data === 'string') ? data : (data?.message || data?.error || `HTTP ${response.status}`);
    // Fallback: try Blob-based upload once if RN file object path failed due to server expectations
    console.log('Attempting fallback upload using Blob...');

    // Read file as blob directly from URI (fallback path)
    let blob;
    try {
      const fetchResponse = await fetch(imageUri);
      if (!fetchResponse.ok) {
        throw new Error(`Failed to fetch image file: ${fetchResponse.status}`);
      }
      blob = await fetchResponse.blob();
    } catch (fetchError) {
      console.error('Fallback fetch->blob failed:', fetchError.message);
      return { success: false, status: response.status, message: errorMessage };
    }

    const blobWithType = new Blob([blob], { type: mimeType });
    if (blobWithType.size === 0) {
      return { success: false, status: response.status, message: 'Image blob is empty' };
    }

    const formDataBlob = new FormData();
    formDataBlob.append('file', blobWithType, safeFileName);

    // Retry once with blob formData
    const controller2 = new AbortController();
    const timeoutId2 = setTimeout(() => controller2.abort(), 60000);
    try {
      const resp2 = await fetch(url, {
        method: 'POST',
        body: formDataBlob,
        headers,
        signal: controller2.signal,
      });
      clearTimeout(timeoutId2);

      let data2 = null;
      const ct2 = resp2.headers.get('content-type');
      if (ct2 && ct2.includes('application/json')) data2 = await resp2.json(); else data2 = await resp2.text();

      if (resp2.ok) {
        console.log(`Image ${safeFileName} uploaded successfully on fallback.`);
        return { success: true, status: resp2.status, data: data2 };
      } else {
        const err2 = data2?.message || data2?.error || data2 || `HTTP ${resp2.status}`;
        return { success: false, status: resp2.status, message: err2 };
      }
    } catch (e2) {
      clearTimeout(timeoutId2);
      console.error('Fallback upload failed:', e2?.message || e2);
      return { success: false, status: 0, message: e2?.message || 'Network request failed' };
    }
  } catch (error) {
    console.error('--- IMAGE UPLOAD FAILED ---');
    console.error('FileName:', safeFileName || fileName);
    console.error('Error:', error.message);
    console.error('ErrorName:', error.name);
    console.error('Stack:', error.stack);
    console.error('-------------------------');

    // Provide specific error messages
    let errorMessage = error.message || 'Network request failed';
    if (error.name === 'AbortError') {
      errorMessage = 'Upload timed out. Please check your internet connection and try again.';
    } else if (error.message?.includes('fetch')) {
      if (error.message?.includes('content://') || error.message?.includes('ph://')) {
        errorMessage = 'Cannot process this type of image file. Please try taking the photo again.';
      } else {
        errorMessage = 'Failed to access image file. Please try capturing the image again.';
      }
    } else if (error.message?.includes('Network')) {
      errorMessage = 'Network connection error. Please check your internet connection.';
    } else if (error.message?.includes('placeholder')) {
      errorMessage = 'Image not properly captured. Please retake the photo.';
    }

    return { success: false, status: 0, message: errorMessage };
  }
  }

  // Reports APIs
  static async getReports(params = {}) {
    return httpClient.get('/reports', params);
  }

  static async generateReport(reportData) {
    return httpClient.post('/reports/generate', reportData);
  }

  // Utility method to set auth token
  static setAuthToken(token) {
    httpClient.setAuthToken(token);
  }

  // Utility method to clear auth token
  static clearAuthToken() {
    httpClient.clearAuthToken();
  }
}

// Export HTTP client for custom requests if needed
export { httpClient };

// Export for backward compatibility
export default ApiService;
