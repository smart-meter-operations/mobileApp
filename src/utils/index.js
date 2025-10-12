// Validation utilities
export const validatePhone = (phoneNumber) => {
  // Validate Indian phone number format
  const indianPhoneRegex = /^(\+91[\-\s]?)?[0]?(91)?[789]\d{9}$/;
  return indianPhoneRegex.test(phoneNumber.replace(/\s/g, ''));
};

export const validateOTP = (otp) => {
  return otp && otp.length === 6 && /^\d{6}$/.test(otp);
};

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Format utilities
export const formatPhoneNumber = (phoneNumber) => {
  const cleaned = phoneNumber.replace(/\D/g, '');

  if (cleaned.startsWith('91')) {
    return `+91 ${cleaned.slice(2)}`;
  } else if (cleaned.length === 10) {
    return `+91 ${cleaned}`;
  }

  return phoneNumber;
};

export const formatDate = (dateString) => {
  if (!dateString) return '';

  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (dateString) => {
  if (!dateString) return '';

  const date = new Date(dateString);
  return date.toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Data utilities
export const groupBy = (array, key) => {
  return array.reduce((result, item) => {
    const group = item[key];
    if (!result[group]) {
      result[group] = [];
    }
    result[group].push(item);
    return result;
  }, {});
};

export const sortBy = (array, key, direction = 'asc') => {
  return [...array].sort((a, b) => {
    const aValue = a[key];
    const bValue = b[key];

    if (direction === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });
};

export const filterBy = (array, filters) => {
  return array.filter((item) => {
    return Object.keys(filters).every((key) => {
      const filterValue = filters[key];
      const itemValue = item[key];

      if (Array.isArray(filterValue)) {
        return filterValue.includes(itemValue);
      }

      return itemValue === filterValue;
    });
  });
};

// Async utilities
export const delay = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const throttle = (func, limit) => {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Error handling utilities
export const handleApiError = (error) => {
  console.error('API Error:', error);

  if (error.message) {
    return error.message;
  }

  if (error.response) {
    return error.response.data?.message || 'Server error occurred';
  }

  return 'An unexpected error occurred';
};

// Database utilities
export { default as databaseUtils } from './databaseUtils';

// Storage utilities (for future use with AsyncStorage)
export const storage = {
  async get(key) {
    try {
      // In React Native, use AsyncStorage
      // const value = await AsyncStorage.getItem(key);
      // return value ? JSON.parse(value) : null;
      return null;
    } catch (error) {
      console.error('Storage get error:', error);
      return null;
    }
  },

  async set(key, value) {
    try {
      // In React Native, use AsyncStorage
      // await AsyncStorage.setItem(key, JSON.stringify(value));
      console.log(`Would store ${key}:`, value);
    } catch (error) {
      console.error('Storage set error:', error);
    }
  },

  async remove(key) {
    try {
      // In React Native, use AsyncStorage
      // await AsyncStorage.removeItem(key);
      console.log(`Would remove ${key}`);
    } catch (error) {
      console.error('Storage remove error:', error);
    }
  },

  async clear() {
    try {
      // In React Native, use AsyncStorage
      // await AsyncStorage.clear();
      console.log('Would clear all storage');
    } catch (error) {
      console.error('Storage clear error:', error);
    }
  },
};

// Map fallback for web platform
export { default as mapFallback } from './mapFallback';