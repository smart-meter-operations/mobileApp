import { API_CONFIG } from '../constants';
import DatabaseService from './databaseService';
import NetInfo from '@react-native-community/netinfo';

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
  static mockMode = true;
  // Authentication APIs
  static async login(phoneNumber) {
    // For now, return mock response
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

      // Use native fetch without AbortController for OTP API to debug abort issues
      const response = await fetch('https://clostridial-chalcographic-glenna.ngrok-free.dev/otpauth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
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

      // Try multiple possible verify OTP endpoints
      const possibleEndpoints = [
        'https://clostridial-chalcographic-glenna.ngrok-free.dev/otpauth/verify-otp',
        'https://clostridial-chalcographic-glenna.ngrok-free.dev/otpauth/verify',
        'https://clostridial-chalcographic-glenna.ngrok-free.dev/otp/verify-otp',
        'https://clostridial-chalcographic-glenna.ngrok-free.dev/otp/verify',
        'https://clostridial-chalcographic-glenna.ngrok-free.dev/auth/verify-otp',
        'https://clostridial-chalcographic-glenna.ngrok-free.dev/auth/verify',
      ];

      let lastError = null;

      for (const endpoint of possibleEndpoints) {
        try {
          console.log(`🔄 Trying verify OTP endpoint: ${endpoint}`);

          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify(requestData)
          });

          console.log(`📥 OTP Verify Response [${response.status}] from ${endpoint}:`, response.status);

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
            console.log(`✅ OTP verified successfully using endpoint: ${endpoint}`);
            return new ApiResponse(data, response.status, true);
          } else if (response.status === 404) {
            // Try next endpoint if 404
            console.log(`❌ Endpoint ${endpoint} returned 404, trying next...`);
            lastError = { status: response.status, message: 'Endpoint not found' };
            continue;
          } else {
            // Other HTTP errors - don't retry different endpoints
            const errorMessage = data?.message || data?.error || `HTTP ${response.status}`;
            console.error('❌ OTP verification failed:', errorMessage);
            return new ApiResponse(null, response.status, false, errorMessage);
          }
        } catch (error) {
          console.error(`💥 Error with endpoint ${endpoint}:`, error.message);
          lastError = error;
          // Continue to next endpoint
          continue;
        }
      }

      // All endpoints failed
      console.error('💥 All verify OTP endpoints failed');
      const errorMessage = lastError?.message || 'All OTP verification endpoints failed';
      return new ApiResponse(null, 0, false, errorMessage);

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
      const absoluteUrl = `https://clostridial-chalcographic-glenna.ngrok-free.dev/consumer_survey/${docName}`;
      
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
   * Uploads an image as multipart/form-data.
   * @param {Object} params - The parameters
   * @param {string} params.consumerId - The consumer ID (consumer_number)
   * @param {string} params.surveyId - The survey ID
   * @param {string} params.imageBase64 - The base64 encoded image string
   * @param {number} params.sequence - The sequence number for the image (e.g., 1, 2, 3, 4)
   * @returns {Promise<Object>} The response object
   */
  static async uploadImage({ imageBase64, fileName }) {
    const url = 'https://sponge-balanced-cat.ngrok-free.app/api/method/upload_file';
    const headers = {
      'Authorization': 'token 0a3ac2415acc9a4:ee04f1881306858',
    };

    try {
      const fetchResponse = await fetch(`data:image/jpeg;base64,${imageBase64}`);
      const blob = await fetchResponse.blob();

      const formData = new FormData();
      formData.append('is_private', '0');
      formData.append('folder', 'Home/Consumer Survey');
      formData.append('file', blob, fileName);

      // Enhanced logging for request
      console.log('--- IMAGE UPLOAD REQUEST ---');
      console.log('URL:', url);
      console.log('Method: POST');
      console.log('Headers:', headers);
      console.log('FormData Fields:', {
        is_private: '0',
        folder: 'Home/Consumer Survey',
        fileName: fileName,
        fileSize: blob.size,
      });
      console.log('--------------------------');

      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        headers,
      });

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
        console.log(`Image ${fileName} uploaded successfully.`);
        return { success: true, status: response.status, data };
      } else {
        console.error(`Image ${fileName} upload failed.`);
        return { success: false, status: response.status, message: data?.message || data };
      }
    } catch (error) {
      console.error('--- IMAGE UPLOAD FAILED ---');
      console.error('FileName:', fileName);
      console.error('Error:', error.message);
      console.error(error);
      console.error('-------------------------');
      return { success: false, status: 0, message: error.message || 'Network request failed' };
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
