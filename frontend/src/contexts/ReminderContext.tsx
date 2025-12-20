import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Reminder } from '@/types';
import { reminderApi, CreateReminderRequest, UpdateReminderRequest, ReminderSchedule } from '@/utils/reminderApi';
import toast from 'react-hot-toast';

interface ReminderContextType {
  reminders: Reminder[];
  upcomingReminders: Reminder[];
  overdueReminders: Reminder[];
  loading: boolean;
  error: string | null;
  
  // Reminder operations
  fetchUserReminders: () => Promise<void>;
  fetchUpcomingReminders: (days?: number) => Promise<void>;
  fetchOverdueReminders: () => Promise<void>;
  fetchRemindersByType: (type: 'Payment' | 'Receivable') => Promise<Reminder[]>;
  fetchActiveReminders: () => Promise<void>;
  fetchRemindersSchedule: (days?: number) => Promise<ReminderSchedule[]>;
  createReminder: (reminderData: CreateReminderRequest) => Promise<Reminder | null>;
  updateReminder: (reminderId: string, reminderData: UpdateReminderRequest) => Promise<Reminder | null>;
  deleteReminder: (reminderId: string) => Promise<boolean>;
  activateReminder: (reminderId: string) => Promise<Reminder | null>;
  deactivateReminder: (reminderId: string) => Promise<Reminder | null>;
  
  // Utility functions
  clearError: () => void;
  getReminderById: (reminderId: string) => Reminder | undefined;
  refreshReminders: () => Promise<void>;
}

const ReminderContext = createContext<ReminderContextType | undefined>(undefined);

export const useReminder = () => {
  const context = useContext(ReminderContext);
  if (context === undefined) {
    throw new Error('useReminder must be used within a ReminderProvider');
  }
  return context;
};

interface ReminderProviderProps {
  children: ReactNode;
}

export const ReminderProvider: React.FC<ReminderProviderProps> = ({ children }) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [upcomingReminders, setUpcomingReminders] = useState<Reminder[]>([]);
  const [overdueReminders, setOverdueReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const fetchUserReminders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const userReminders = await reminderApi.getUserReminders();
      setReminders(userReminders);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch reminders';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUpcomingReminders = useCallback(async (days: number = 7) => {
    try {
      setError(null);
      const upcoming = await reminderApi.getUpcomingReminders(days);
      setUpcomingReminders(upcoming);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch upcoming reminders';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  }, []);

  const fetchOverdueReminders = useCallback(async () => {
    try {
      setError(null);
      const overdue = await reminderApi.getOverdueReminders();
      setOverdueReminders(overdue);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch overdue reminders';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  }, []);

  const fetchRemindersByType = useCallback(async (type: 'Payment' | 'Receivable'): Promise<Reminder[]> => {
    try {
      setError(null);
      const typeReminders = await reminderApi.getRemindersByType(type);
      return typeReminders;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Failed to fetch ${type.toLowerCase()} reminders`;
      setError(errorMessage);
      toast.error(errorMessage);
      return [];
    }
  }, []);

  const fetchActiveReminders = useCallback(async () => {
    try {
      setError(null);
      const activeReminders = await reminderApi.getActiveReminders();
      setReminders(activeReminders);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch active reminders';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  }, []);

  const fetchRemindersSchedule = useCallback(async (days: number = 30): Promise<ReminderSchedule[]> => {
    try {
      setError(null);
      const schedule = await reminderApi.getRemindersSchedule(days);
      return schedule;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch reminders schedule';
      setError(errorMessage);
      toast.error(errorMessage);
      return [];
    }
  }, []);

  const createReminder = useCallback(async (reminderData: CreateReminderRequest): Promise<Reminder | null> => {
    console.log('ReminderContext: createReminder called with data:', reminderData);
    try {
      setLoading(true);
      setError(null);
      console.log('ReminderContext: Loading set to true, calling API...');
      const newReminder = await reminderApi.createReminder(reminderData);
      console.log('ReminderContext: API call successful, result:', newReminder);
      
      setReminders(prev => [...prev, newReminder]);
      toast.success('Reminder created successfully');
      return newReminder;
    } catch (err) {
      console.error('ReminderContext: Error creating reminder:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create reminder';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      console.log('ReminderContext: Setting loading to false');
      setLoading(false);
    }
  }, []);

  const updateReminder = useCallback(async (reminderId: string, reminderData: UpdateReminderRequest): Promise<Reminder | null> => {
    try {
      setLoading(true);
      setError(null);
      const updatedReminder = await reminderApi.updateReminder(reminderId, reminderData);
      
      setReminders(prev => prev.map(reminder => 
        reminder.id === reminderId ? updatedReminder : reminder
      ));
      
      // Update upcoming reminders if it exists there
      setUpcomingReminders(prev => prev.map(reminder => 
        reminder.id === reminderId ? updatedReminder : reminder
      ));
      
      toast.success('Reminder updated successfully');
      return updatedReminder;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update reminder';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteReminder = useCallback(async (reminderId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      await reminderApi.deleteReminder(reminderId);
      
      setReminders(prev => prev.filter(reminder => reminder.id !== reminderId));
      setUpcomingReminders(prev => prev.filter(reminder => reminder.id !== reminderId));
      setOverdueReminders(prev => prev.filter(reminder => reminder.id !== reminderId));
      
      toast.success('Reminder deleted successfully');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete reminder';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const activateReminder = useCallback(async (reminderId: string): Promise<Reminder | null> => {
    try {
      setError(null);
      const activatedReminder = await reminderApi.activateReminder(reminderId);
      
      setReminders(prev => prev.map(reminder => 
        reminder.id === reminderId ? activatedReminder : reminder
      ));
      
      toast.success('Reminder activated successfully');
      return activatedReminder;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to activate reminder';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    }
  }, []);

  const deactivateReminder = useCallback(async (reminderId: string): Promise<Reminder | null> => {
    try {
      setError(null);
      const deactivatedReminder = await reminderApi.deactivateReminder(reminderId);
      
      setReminders(prev => prev.map(reminder => 
        reminder.id === reminderId ? deactivatedReminder : reminder
      ));
      
      // Remove from upcoming if deactivated
      setUpcomingReminders(prev => prev.filter(reminder => reminder.id !== reminderId));
      
      toast.success('Reminder deactivated successfully');
      return deactivatedReminder;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to deactivate reminder';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    }
  }, []);

  const getReminderById = useCallback((reminderId: string): Reminder | undefined => {
    return reminders.find(reminder => reminder.id === reminderId);
  }, [reminders]);

  const refreshReminders = useCallback(async () => {
    await Promise.all([
      fetchUserReminders(),
      fetchUpcomingReminders(),
      fetchOverdueReminders(),
    ]);
  }, [fetchUserReminders, fetchUpcomingReminders, fetchOverdueReminders]);

  const value: ReminderContextType = {
    reminders,
    upcomingReminders,
    overdueReminders,
    loading,
    error,
    fetchUserReminders,
    fetchUpcomingReminders,
    fetchOverdueReminders,
    fetchRemindersByType,
    fetchActiveReminders,
    fetchRemindersSchedule,
    createReminder,
    updateReminder,
    deleteReminder,
    activateReminder,
    deactivateReminder,
    clearError,
    getReminderById,
    refreshReminders,
  };

  return (
    <ReminderContext.Provider value={value}>
      {children}
    </ReminderContext.Provider>
  );
};