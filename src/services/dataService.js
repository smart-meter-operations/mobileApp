// Mock data service - will be replaced with actual API calls
import { STATUS, TASK_TYPES } from '../constants';

// Mock installation data - this will come from your backend API
export const mockInstallationData = [
  {
    id: '1',
    name: 'Ranjit Das',
    address: '21A, Beliaghata Main Road, Phool...',
    status: STATUS.COMPLETED,
    taskType: TASK_TYPES.INSTALLATION,
    phoneNumber: '+91 9876543210',
    coordinates: { lat: 22.5726, lng: 88.3639 },
    assignedDate: '2024-01-15',
    completedDate: '2024-01-16',
  },
  {
    id: '2',
    name: 'Amit Roy',
    address: '45, S.P. Mukherjee Road, Kalighat,',
    status: STATUS.COMPLETED,
    taskType: TASK_TYPES.INSTALLATION,
    phoneNumber: '+91 9876543211',
    coordinates: { lat: 22.5244, lng: 88.3426 },
    assignedDate: '2024-01-14',
    completedDate: '2024-01-15',
  },
  {
    id: '3',
    name: 'Sandip Banerj...',
    address: '54, S.P. Mukherjee Road, Kalighat,',
    status: STATUS.PENDING,
    taskType: TASK_TYPES.INSTALLATION,
    phoneNumber: '+91 9876543212',
    coordinates: { lat: 22.5244, lng: 88.3426 },
    assignedDate: '2024-01-17',
    completedDate: null,
  },
  {
    id: '4',
    name: 'Arun G',
    address: '88, Lake View Road, Jodhpur Park',
    status: STATUS.PENDING,
    taskType: TASK_TYPES.INSTALLATION,
    phoneNumber: '+91 9876543213',
    coordinates: { lat: 22.4989, lng: 88.3417 },
    assignedDate: '2024-01-18',
    completedDate: null,
  },
  {
    id: '5',
    name: 'Vivek Kumar',
    address: '45, S.P. Mukherjee Road, Kalighat,',
    status: STATUS.PENDING,
    taskType: TASK_TYPES.INSTALLATION,
    phoneNumber: '+91 9876543214',
    coordinates: { lat: 22.5244, lng: 88.3426 },
    assignedDate: '2024-01-19',
    completedDate: null,
  },
  {
    id: '6',
    name: 'Ram Tiwari',
    address: '16B, Raja Ram Mohan Roy Road',
    status: STATUS.PENDING,
    taskType: TASK_TYPES.INSTALLATION,
    phoneNumber: '+91 9876543215',
    coordinates: { lat: 22.5697, lng: 88.3697 },
    assignedDate: '2024-01-20',
    completedDate: null,
  },
  {
    id: '7',
    name: 'Lalita Aggarwal',
    address: '22, S.P. Mukherjee Road, Kalighat,',
    status: STATUS.PENDING,
    taskType: TASK_TYPES.INSTALLATION,
    phoneNumber: '+91 9876543216',
    coordinates: { lat: 22.5244, lng: 88.3426 },
    assignedDate: '2024-01-21',
    completedDate: null,
  },
];

// Mock survey data
export const mockSurveyData = [
  {
    id: 's1',
    name: 'Priya Sharma',
    address: '12, Park Street, Central Kolkata',
    status: STATUS.COMPLETED,
    taskType: TASK_TYPES.SURVEY,
    phoneNumber: '+91 9876543220',
    coordinates: { lat: 22.5535, lng: 88.3619 },
    assignedDate: '2024-01-10',
    completedDate: '2024-01-11',
  },
  {
    id: 's2',
    name: 'Rahul Ghosh',
    address: '34, Rashbehari Avenue, South Kolkata',
    status: STATUS.COMPLETED,
    taskType: TASK_TYPES.SURVEY,
    phoneNumber: '+91 9876543221',
    coordinates: { lat: 22.5205, lng: 88.3532 },
    assignedDate: '2024-01-09',
    completedDate: '2024-01-10',
  },
  // Add more survey items...
];

// Mock user data
export const mockUserData = {
  id: 'user_123',
  name: 'Rajesh',
  role: 'Surveyor / Installer',
  avatar: '👨‍💼',
  status: 'offline',
  phoneNumber: '+91 8981675554',
  employeeId: 'EMP001',
  department: 'Field Operations',
};

// Data service functions that will be replaced with actual API calls
export class DataService {
  // Get dashboard stats
  static async getDashboardStats() {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const installations = mockInstallationData;
    const surveys = mockSurveyData;

    const installationStats = {
      total: installations.length,
      completed: installations.filter(
        (item) => item.status === STATUS.COMPLETED
      ).length,
      pending: installations.filter((item) => item.status === STATUS.PENDING)
        .length,
    };

    const surveyStats = {
      total: surveys.length,
      completed: surveys.filter((item) => item.status === STATUS.COMPLETED)
        .length,
      pending: surveys.filter((item) => item.status === STATUS.PENDING).length,
    };

    return {
      installation: installationStats,
      survey: surveyStats,
    };
  }

  // Get installation list
  static async getInstallationList() {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300));
    return mockInstallationData;
  }

  // Get survey list
  static async getSurveyList() {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300));
    return mockSurveyData;
  }

  // Get user profile
  static async getUserProfile() {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 200));
    return mockUserData;
  }

  // Update task status
  static async updateTaskStatus(taskId, newStatus) {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 400));

    // In real implementation, this would make an API call
    console.log(`Updating task ${taskId} to status ${newStatus}`);
    return { success: true, taskId, newStatus };
  }

  // Create new installation task
  static async createInstallationTask(taskData) {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 600));

    // In real implementation, this would make an API call
    const newTask = {
      id: `new_${Date.now()}`,
      ...taskData,
      status: STATUS.PENDING,
      assignedDate: new Date().toISOString().split('T')[0],
      completedDate: null,
    };

    console.log('Creating new installation task:', newTask);
    return { success: true, task: newTask };
  }
}
