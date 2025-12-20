import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useReminder } from '@/contexts/ReminderContext';
import { Reminder } from '@/types';

const UpcomingReminders: React.FC = () => {
  const router = useRouter();
  const { upcomingReminders, overdueReminders, fetchUpcomingReminders, fetchOverdueReminders, loading } = useReminder();

  useEffect(() => {
    fetchUpcomingReminders();
    fetchOverdueReminders();
  }, [fetchUpcomingReminders, fetchOverdueReminders]);

  // Combine and sort reminders by due date (nearest first)
  const allReminders = [...overdueReminders, ...upcomingReminders]
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 5); // Show only top 5

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(date);
    dueDate.setHours(0, 0, 0, 0);

    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        text: `${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''} overdue`,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
      };
    } else if (diffDays === 0) {
      return {
        text: 'Due today',
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
      };
    } else if (diffDays === 1) {
      return {
        text: 'Due tomorrow',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
      };
    } else if (diffDays <= 7) {
      return {
        text: `Due in ${diffDays} days`,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
      };
    } else {
      return {
        text: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
      };
    }
  };

  const getTypeIcon = (type: 'Payment' | 'Receivable') => {
    if (type === 'Payment') {
      return (
        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      );
    } else {
      return (
        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
  };

  if (loading && allReminders.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Upcoming Reminders</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <svg className="w-6 h-6 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900">Upcoming Reminders</h3>
        </div>
        <button
          onClick={() => router.push('/reminders')}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          View All
        </button>
      </div>

      {allReminders.length === 0 ? (
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No upcoming reminders</h3>
          <p className="mt-1 text-sm text-gray-500">
            You're all caught up! No reminders in the next 7 days.
          </p>
          <div className="mt-4">
            <button
              onClick={() => router.push('/reminders?create=true')}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Reminder
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {allReminders.map((reminder) => {
            const dueInfo = formatDueDate(reminder.due_date);
            return (
              <div
                key={reminder.id}
                className={`border ${dueInfo.borderColor} ${dueInfo.bgColor} rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow cursor-pointer`}
                onClick={() => router.push('/reminders')}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start flex-1 min-w-0">
                    <div className="flex-shrink-0 mt-0.5">
                      {getTypeIcon(reminder.type)}
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {reminder.title}
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs text-gray-600">
                        <span className={`font-semibold ${reminder.type === 'Payment' ? 'text-red-600' : 'text-green-600'}`}>
                          {formatCurrency(reminder.amount)}
                        </span>
                        <span className="hidden sm:inline">•</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          reminder.type === 'Payment' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {reminder.type}
                        </span>
                        {reminder.recurrence !== 'once' && (
                          <>
                            <span className="hidden sm:inline">•</span>
                            <span className="inline-flex items-center">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              {reminder.recurrence}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="ml-3 flex-shrink-0">
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${dueInfo.color} ${dueInfo.bgColor} border ${dueInfo.borderColor}`}>
                      {dueInfo.text}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {allReminders.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              {overdueReminders.length > 0 && (
                <span className="text-red-600 font-medium">
                  {overdueReminders.length} overdue
                </span>
              )}
              {upcomingReminders.length > 0 && (
                <span className="text-blue-600 font-medium">
                  {upcomingReminders.length} upcoming
                </span>
              )}
            </div>
            <button
              onClick={() => router.push('/reminders?create=true')}
              className="text-blue-600 hover:text-blue-700 font-medium flex items-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Reminder
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UpcomingReminders;
