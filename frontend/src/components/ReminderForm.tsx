import React, { useState, useEffect } from 'react';
import { Reminder } from '@/types';
import { useReminder } from '@/contexts/ReminderContext';
import { useWallet } from '@/contexts/WalletContext';
import { CreateReminderRequest, UpdateReminderRequest } from '@/utils/reminderApi';

interface ReminderFormProps {
  reminder?: Reminder;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const ReminderForm: React.FC<ReminderFormProps> = ({
  reminder,
  onSuccess,
  onCancel,
}) => {
  const { createReminder, updateReminder, loading } = useReminder();
  const { wallets } = useWallet();
  
  const [formData, setFormData] = useState({
    title: reminder?.title || '',
    amount: reminder?.amount || 0,
    type: reminder?.type || 'Payment' as 'Payment' | 'Receivable',
    due_date: reminder?.due_date ? reminder.due_date.split('T')[0] : '',
    wallet_id: reminder?.wallet_id || '',
    recurrence: reminder?.recurrence || 'once' as 'once' | 'daily' | 'weekly' | 'monthly' | 'custom',
    recurrence_interval: reminder?.recurrence_interval || 1,
    duration_end: reminder?.duration_end ? reminder.duration_end.split('T')[0] : '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (reminder) {
      setFormData({
        title: reminder.title,
        amount: reminder.amount,
        type: reminder.type,
        due_date: reminder.due_date.split('T')[0],
        wallet_id: reminder.wallet_id || '',
        recurrence: reminder.recurrence,
        recurrence_interval: reminder.recurrence_interval || 1,
        duration_end: reminder.duration_end ? reminder.duration_end.split('T')[0] : '',
      });
    }
  }, [reminder]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (!formData.due_date) {
      newErrors.due_date = 'Due date is required';
    } else {
      const dueDate = new Date(formData.due_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (dueDate < today) {
        newErrors.due_date = 'Due date cannot be in the past';
      }
    }

    if (formData.recurrence === 'custom' && (!formData.recurrence_interval || formData.recurrence_interval <= 0)) {
      newErrors.recurrence_interval = 'Recurrence interval must be greater than 0 for custom recurrence';
    }

    if (formData.duration_end) {
      const dueDate = new Date(formData.due_date);
      const endDate = new Date(formData.duration_end);
      
      if (endDate <= dueDate) {
        newErrors.duration_end = 'End date must be after due date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      if (reminder) {
        // Update existing reminder
        const updateData: UpdateReminderRequest = {
          title: formData.title.trim(),
          amount: formData.amount,
          type: formData.type,
          due_date: formData.due_date,
          wallet_id: formData.wallet_id || undefined,
          recurrence: formData.recurrence,
          recurrence_interval: formData.recurrence === 'custom' ? formData.recurrence_interval : undefined,
          duration_end: formData.duration_end || undefined,
        };
        const result = await updateReminder(reminder.id, updateData);
        if (result) {
          onSuccess?.();
        }
      } else {
        // Create new reminder
        const createData: CreateReminderRequest = {
          title: formData.title.trim(),
          amount: formData.amount,
          type: formData.type,
          due_date: formData.due_date,
          wallet_id: formData.wallet_id || undefined,
          recurrence: formData.recurrence,
          recurrence_interval: formData.recurrence === 'custom' ? formData.recurrence_interval : undefined,
          duration_end: formData.duration_end || undefined,
        };
        const result = await createReminder(createData);
        if (result) {
          setFormData({
            title: '',
            amount: 0,
            type: 'Payment',
            due_date: '',
            wallet_id: '',
            recurrence: 'once',
            recurrence_interval: 1,
            duration_end: '',
          });
          onSuccess?.();
        }
      }
    } catch (error) {
      console.error('Error submitting reminder form:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' || name === 'recurrence_interval' 
        ? parseFloat(value) || 0 
        : value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const getWalletName = (walletId: string): string => {
    const wallet = wallets.find(w => w.id === walletId);
    return wallet ? wallet.name : 'Unknown Wallet';
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        {reminder ? 'Edit Reminder' : 'Create New Reminder'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.title ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter reminder title"
            required
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title}</p>
          )}
        </div>

        {/* Amount and Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
              Amount ($)
            </label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              min="0"
              step="0.01"
              className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.amount ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="0.00"
              required
            />
            {errors.amount && (
              <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
            )}
          </div>

          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="Payment">Payment (Outgoing)</option>
              <option value="Receivable">Receivable (Incoming)</option>
            </select>
          </div>
        </div>

        {/* Due Date */}
        <div>
          <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 mb-1">
            Due Date
          </label>
          <input
            type="date"
            id="due_date"
            name="due_date"
            value={formData.due_date}
            onChange={handleInputChange}
            className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.due_date ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          />
          {errors.due_date && (
            <p className="mt-1 text-sm text-red-600">{errors.due_date}</p>
          )}
        </div>

        {/* Wallet Selection */}
        <div>
          <label htmlFor="wallet_id" className="block text-sm font-medium text-gray-700 mb-1">
            Wallet (Optional)
          </label>
          <select
            id="wallet_id"
            name="wallet_id"
            value={formData.wallet_id}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">No specific wallet</option>
            {wallets.map((wallet) => (
              <option key={wallet.id} value={wallet.id}>
                {wallet.name} {wallet.is_default && '(Default)'}
              </option>
            ))}
          </select>
        </div>

        {/* Recurrence */}
        <div>
          <label htmlFor="recurrence" className="block text-sm font-medium text-gray-700 mb-1">
            Recurrence
          </label>
          <select
            id="recurrence"
            name="recurrence"
            value={formData.recurrence}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="once">One-time</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="custom">Custom Interval</option>
          </select>
        </div>

        {/* Custom Recurrence Interval */}
        {formData.recurrence === 'custom' && (
          <div>
            <label htmlFor="recurrence_interval" className="block text-sm font-medium text-gray-700 mb-1">
              Repeat Every (Days)
            </label>
            <input
              type="number"
              id="recurrence_interval"
              name="recurrence_interval"
              value={formData.recurrence_interval}
              onChange={handleInputChange}
              min="1"
              className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.recurrence_interval ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Number of days"
            />
            {errors.recurrence_interval && (
              <p className="mt-1 text-sm text-red-600">{errors.recurrence_interval}</p>
            )}
          </div>
        )}

        {/* Duration End (for recurring reminders) */}
        {formData.recurrence !== 'once' && (
          <div>
            <label htmlFor="duration_end" className="block text-sm font-medium text-gray-700 mb-1">
              End Date (Optional)
            </label>
            <input
              type="date"
              id="duration_end"
              name="duration_end"
              value={formData.duration_end}
              onChange={handleInputChange}
              className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.duration_end ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.duration_end && (
              <p className="mt-1 text-sm text-red-600">{errors.duration_end}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              Leave empty for indefinite recurrence
            </p>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Saving...' : reminder ? 'Update Reminder' : 'Create Reminder'}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};