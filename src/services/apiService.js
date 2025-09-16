import { API_CONFIG } from '../constants';

// HTTP methods
const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  PATCH: 'PATCH',
};

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
      'Accept': 'application/json',
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
    const url = `${this.baseURL}${endpoint}`;
    const requestOptions = {
      ...options,
      headers: this.getHeaders(options.headers),
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
          const errorMessage = data?.message || data?.error || `HTTP ${response.status}`;
          return new ApiResponse(null, response.status, false, errorMessage);
        }
        
      } catch (error) {
        clearTimeout(timeoutId);
        lastError = error;
        
        console.warn(`API Request failed [Attempt ${attempt + 1}]:`, error.message);
        
        // Don't retry on certain errors
        if (error.name === 'AbortError' || error.message.includes('Network request failed')) {
          if (attempt < this.retryAttempts) {
            // Wait before retry (exponential backoff)
            const delay = Math.pow(2, attempt) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
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
  
  static async logout() {
    // For now, return mock response
    // In production, this will make actual API call
    httpClient.clearAuthToken();
    return httpClient.post('/auth/logout');
  }
  
  // User APIs
  static async getUserProfile() {
    return httpClient.get('/user/profile');
  }
  
  static async updateUserProfile(userData) {
    return httpClient.put('/user/profile', userData);
  }
  
  // Dashboard APIs
  static async getDashboardStats() {
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