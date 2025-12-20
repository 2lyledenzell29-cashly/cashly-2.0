import React, { useState } from 'react';
import { Reminder } from '@/types';
import { useReminder } from '@/contexts/ReminderContext';
import { useWallet } from '@/contexts/WalletContext';
import { ReminderForm } from './ReminderForm';

interface ReminderCardProps {
  reminder: Reminder;
  onEdit?: () => void;
  onDelete?: () => void;
  showUpcoming?: boolean;
}

export const ReminderCard: React.FC<ReminderCardProps> = ({
  reminder,
  onEdit,
  onDelete,
  showUpcoming = false,
}) => {
  const { deleteReminder, activateReminder, deactivateReminder } = useReminder();
  const { wallets } = useWallet();
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const getWalletName = (): string => {
    if (!reminder.wallet_id) return 'No specific wallet';
    const wallet = wallets.find(w => w.id === reminder.wallet_id);
    return wallet ? wallet.name : 'Unknown Wallet';
  };

  const getTypeColor = (type: string): string => {
    return type === 'Payment' ? 'text-red-600 bg-red-50' : 'text-green-600 bg-green-50';
  };

  const getTypeIcon = (type: string): string => {
    return type === 'Payment' ? '↗' : '↙';
  };

  const getRecurrenceText = (): string => {
    switch (reminder.recurrence) {
      case 'once':
        return 'One-time';
      case 'daily':
        return 'Daily';
      case 'weekly':
        return 'Weekly';
      case 'monthly':
        return 'Monthly';
      case 'custom':
        return `Every ${reminder.recurrence_interval} days`;
      default:
        return 'Unknown';
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Reset time for comparison
    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    
    if (date.getTime() === today.getTime()) {
      return 'Today';
    } else if (date.getTime() === tomorrow.getTime()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const getDaysUntilDue = (): number => {
    const dueDate = new Date(reminder.due_date);
    const today = new Date();
    
    // Reset time for comparison
    dueDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    const diffTime = dueDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const isOverdue = (): boolean => {
    return getDaysUntilDue() < 0;
  };

  const isDueToday = (): boolean => {
    return getDaysUntilDue() === 0;
  };

  const getStatusBadge = () => {
    if (!reminder.is_active) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          Inactive
        </span>
      );
    }

    if (isOverdue()) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Overdue
        </span>
      );
    }

    if (isDueToday()) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
          Due Today
        </span>
      );
    }

    const daysUntil = getDaysUntilDue();
    if (daysUntil <= 3) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Due Soon
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Active
      </span>
    );
  };

  const handleEdit = () => {
    setShowEditForm(true);
    onEdit?.();
  };

  const handleDelete = async () => {
    const success = await deleteReminder(reminder.id);
    if (success) {
      setShowDeleteConfirm(false);
      onDelete?.();
    }
  };

  const handleToggleActive = async () => {
    if (reminder.is_active) {
      await deactivateReminder(reminder.id);
    } else {
      await activateReminder(reminder.id);
    }
  };

  const handleEditSuccess = () => {
    setShowEditForm(false);
  };

  if (showEditForm) {
    return (
      <ReminderForm
        reminder={reminder}
        onSuccess={handleEditSuccess}
        onCancel={() => setShowEditForm(false)}
      />
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {reminder.title}
            </h3>
            {getStatusBadge()}
          </div>
          <p className="text-sm text-gray-600">{getWalletName()}</p>
        </div>
        
        <div className="flex gap-2 ml-4">
          <button
            onClick={handleEdit}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Edit
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="text-red-600 hover:text-red-800 text-sm font-medium"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Amount and Type */}
      <div className="flex items-center justify-between mb-4">
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(reminder.type)}`}>
          <span className="mr-1">{getTypeIcon(reminder.type)}</span>
          {reminder.type}
        </div>
        <span className="text-xl font-bold text-gray-900">
          {formatCurrency(reminder.amount)}
        </span>
      </div>

      {/* Due Date */}
      <div className="mb-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Due Date</span>
          <span className={`text-sm font-medium ${
            isOverdue() ? 'text-red-600' : isDueToday() ? 'text-orange-600' : 'text-gray-900'
          }`}>
            {formatDate(reminder.due_date)}
          </span>
        </div>
        {showUpcoming && (
          <div className="mt-1">
            <span className="text-xs text-gray-500">
              {isOverdue() 
                ? `${Math.abs(getDaysUntilDue())} days overdue`
                : isDueToday()
                ? 'Due today'
                : `${getDaysUntilDue()} days remaining`
              }
            </span>
          </div>
        )}
      </div>

      {/* Recurrence */}
      <div className="mb-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Recurrence</span>
          <span className="text-sm text-gray-900">{getRecurrenceText()}</span>
        </div>
        {reminder.duration_end && (
          <div className="mt-1">
            <span className="text-xs text-gray-500">
              Until {formatDate(reminder.duration_end)}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4 border-t border-gray-200">
        <button
          onClick={handleToggleActive}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            reminder.is_active
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              : 'bg-green-100 text-green-700 hover:bg-green-200'
          }`}
        >
          {reminder.is_active ? 'Deactivate' : 'Activate'}
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Delete Reminder
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete the reminder "{reminder.title}"? 
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};