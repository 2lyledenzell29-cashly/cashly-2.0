import { Reminder, ApiResponse } from '@/types';
import { AuthService } from './auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = AuthService.getToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Helper function to handle API responses
const handleResponse = async <T>(response: Response): Promise<T> => {
  const data: ApiResponse<T> = await response.json();
  
  if (!response.ok || !data.success) {
    throw new Error(data.error?.message || 'An error occurred');
  }
  
  return data.data as T;
};

export interface CreateReminderRequest {
  title: string;
  amount: number;
  type: 'Payment' | 'Receivable';
  due_date: string;
  wallet_id?: string;
  recurrence?: 'once' | 'daily' | 'weekly' | 'monthly' | 'custom';
  recurrence_interval?: number;
  duration_end?: string;
}

export interface UpdateReminderRequest {
  title?: string;
  amount?: number;
  type?: 'Payment' | 'Receivable';
  due_date?: string;
  wallet_id?: string;
  recurrence?: 'once' | 'daily' | 'weekly' | 'monthly' | 'custom';
  recurrence_interval?: number;
  duration_end?: string;
  is_active?: boolean;
}

export interface ReminderOccurrence {
  reminder: Reminder;
  occurrences: string[];
}

export interface ReminderSchedule {
  reminder: Reminder;
  nextOccurrences: string[];
}

export const reminderApi = {
  // Get all user reminders
  getUserReminders: async (): Promise<Reminder[]> => {
    const response = await fetch(`${API_BASE_URL}/api/reminders`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return handleResponse<Reminder[]>(response);
  },

  // Get upcoming reminders
  getUpcomingReminders: async (days: number = 7): Promise<Reminder[]> => {
    const response = await fetch(`${API_BASE_URL}/api/reminders/upcoming?days=${days}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return handleResponse<Reminder[]>(response);
  },

  // Get reminders by type
  getRemindersByType: async (type: 'Payment' | 'Receivable'): Promise<Reminder[]> => {
    const response = await fetch(`${API_BASE_URL}/api/reminders?type=${type}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return handleResponse<Reminder[]>(response);
  },

  // Get active reminders
  getActiveReminders: async (): Promise<Reminder[]> => {
    const response = await fetch(`${API_BASE_URL}/api/reminders?is_active=true`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return handleResponse<Reminder[]>(response);
  },

  // Get overdue reminders
  getOverdueReminders: async (): Promise<Reminder[]> => {
    const response = await fetch(`${API_BASE_URL}/api/reminders?overdue=true`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return handleResponse<Reminder[]>(response);
  },

  // Get specific reminder
  getReminderById: async (reminderId: string): Promise<Reminder> => {
    const response = await fetch(`${API_BASE_URL}/api/reminders/${reminderId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return handleResponse<Reminder>(response);
  },

  // Create new reminder
  createReminder: async (reminderData: CreateReminderRequest): Promise<Reminder> => {
    const response = await fetch(`${API_BASE_URL}/api/reminders`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(reminderData),
    });
    
    return handleResponse<Reminder>(response);
  },

  // Update reminder
  updateReminder: async (reminderId: string, reminderData: UpdateReminderRequest): Promise<Reminder> => {
    const response = await fetch(`${API_BASE_URL}/api/reminders/${reminderId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(reminderData),
    });
    
    return handleResponse<Reminder>(response);
  },

  // Delete reminder
  deleteReminder: async (reminderId: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/reminders/${reminderId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    
    await handleResponse<{ message: string }>(response);
  },

  // Activate reminder
  activateReminder: async (reminderId: string): Promise<Reminder> => {
    const response = await fetch(`${API_BASE_URL}/api/reminders/${reminderId}/activate`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
    
    return handleResponse<Reminder>(response);
  },

  // Deactivate reminder
  deactivateReminder: async (reminderId: string): Promise<Reminder> => {
    const response = await fetch(`${API_BASE_URL}/api/reminders/${reminderId}/deactivate`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
    
    return handleResponse<Reminder>(response);
  },

  // Get reminder occurrences
  getReminderOccurrences: async (reminderId: string, maxOccurrences: number = 10): Promise<ReminderOccurrence> => {
    const response = await fetch(`${API_BASE_URL}/api/reminders/${reminderId}/occurrences?max=${maxOccurrences}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return handleResponse<ReminderOccurrence>(response);
  },

  // Get reminders schedule
  getRemindersSchedule: async (days: number = 30): Promise<ReminderSchedule[]> => {
    const response = await fetch(`${API_BASE_URL}/api/reminders/schedule?days=${days}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return handleResponse<ReminderSchedule[]>(response);
  },

  // Get due reminders
  getDueReminders: async (date?: string): Promise<Reminder[]> => {
    const url = date 
      ? `${API_BASE_URL}/api/reminders/due?date=${date}`
      : `${API_BASE_URL}/api/reminders/due`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return handleResponse<Reminder[]>(response);
  },
};