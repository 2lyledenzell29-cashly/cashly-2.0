import React, { useState, useEffect, useMemo } from 'react';
import { Reminder } from '@/types';
import { useReminder } from '@/contexts/ReminderContext';
import { useWallet } from '@/contexts/WalletContext';

interface ReminderCalendarProps {
  onReminderClick?: (reminder: Reminder) => void;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  reminders: ReminderOccurrence[];
}

interface ReminderOccurrence {
  reminder: Reminder;
  isRecurring: boolean;
  originalDate: Date;
}

export const ReminderCalendar: React.FC<ReminderCalendarProps> = ({
  onReminderClick
}) => {
  const { reminders, fetchUserReminders, loading } = useReminder();
  const { wallets } = useWallet();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    fetchUserReminders();
  }, [fetchUserReminders]);

  // Helper function to calculate monthly occurrence with day adjustment
  const calculateMonthlyOccurrence = (originalDate: Date, targetMonth: number, targetYear: number): Date => {
    const originalDay = originalDate.getDate();
    
    // Get the last day of the target month
    const lastDayOfMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
    
    // If original day is greater than the last day of target month, use last day
    const adjustedDay = Math.min(originalDay, lastDayOfMonth);
    
    return new Date(targetYear, targetMonth, adjustedDay);
  };

  // Generate all occurrences for a reminder within the calendar view
  const generateReminderOccurrences = (reminder: Reminder, startDate: Date, endDate: Date): ReminderOccurrence[] => {
    const occurrences: ReminderOccurrence[] = [];
    const originalDueDate = new Date(reminder.due_date);
    
    // If it's a one-time reminder, just check if it falls within the range
    if (reminder.recurrence === 'once') {
      if (originalDueDate >= startDate && originalDueDate <= endDate) {
        occurrences.push({
          reminder,
          isRecurring: false,
          originalDate: originalDueDate
        });
      }
      return occurrences;
    }

    // For recurring reminders, we need to find all occurrences in the date range
    switch (reminder.recurrence) {
      case 'daily':
        {
          let currentDate = new Date(originalDueDate);
          
          // If original due date is before start date, find the first occurrence within range
          if (currentDate < startDate) {
            const daysDiff = Math.ceil((startDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
            currentDate.setDate(currentDate.getDate() + daysDiff);
          }
          
          while (currentDate <= endDate) {
            if (currentDate >= startDate) {
              occurrences.push({
                reminder,
                isRecurring: true,
                originalDate: new Date(currentDate)
              });
            }
            currentDate.setDate(currentDate.getDate() + 1);
            
            // Check duration end
            if (reminder.duration_end && currentDate > new Date(reminder.duration_end)) {
              break;
            }
          }
        }
        break;
        
      case 'weekly':
        {
          let currentDate = new Date(originalDueDate);
          
          // If original due date is before start date, find the first occurrence within range
          if (currentDate < startDate) {
            const daysDiff = Math.ceil((startDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
            const weeksDiff = Math.ceil(daysDiff / 7);
            currentDate.setDate(currentDate.getDate() + (weeksDiff * 7));
          }
          
          while (currentDate <= endDate) {
            if (currentDate >= startDate) {
              occurrences.push({
                reminder,
                isRecurring: true,
                originalDate: new Date(currentDate)
              });
            }
            currentDate.setDate(currentDate.getDate() + 7);
            
            // Check duration end
            if (reminder.duration_end && currentDate > new Date(reminder.duration_end)) {
              break;
            }
          }
        }
        break;
        
      case 'monthly':
        {
          const originalDay = originalDueDate.getDate();
          
          // Start from the original due date month/year or find the first month within range
          let currentYear = originalDueDate.getFullYear();
          let currentMonth = originalDueDate.getMonth();
          
          // If original due date is before start date, find the first month within range
          if (originalDueDate < startDate) {
            currentYear = startDate.getFullYear();
            currentMonth = startDate.getMonth();
            
            // Check if we need to go to the next month
            const monthlyOccurrence = calculateMonthlyOccurrence(originalDueDate, currentMonth, currentYear);
            if (monthlyOccurrence < startDate) {
              currentMonth++;
              if (currentMonth > 11) {
                currentMonth = 0;
                currentYear++;
              }
            }
          }
          
          // Generate monthly occurrences
          const maxIterations = 50; // Prevent infinite loops
          let iterations = 0;
          
          while (iterations < maxIterations) {
            iterations++;
            
            const monthlyOccurrence = calculateMonthlyOccurrence(originalDueDate, currentMonth, currentYear);
            
            // If this occurrence is past our end date, stop
            if (monthlyOccurrence > endDate) {
              break;
            }
            
            // If this occurrence is within our range, add it
            if (monthlyOccurrence >= startDate && monthlyOccurrence <= endDate) {
              occurrences.push({
                reminder,
                isRecurring: true,
                originalDate: new Date(monthlyOccurrence)
              });
            }
            
            // Move to next month
            currentMonth++;
            if (currentMonth > 11) {
              currentMonth = 0;
              currentYear++;
            }
            
            // Check duration end
            if (reminder.duration_end) {
              const nextOccurrence = calculateMonthlyOccurrence(originalDueDate, currentMonth, currentYear);
              if (nextOccurrence > new Date(reminder.duration_end)) {
                break;
              }
            }
          }
        }
        break;
        
      case 'custom':
        {
          if (!reminder.recurrence_interval) break;
          
          let currentDate = new Date(originalDueDate);
          
          // If original due date is before start date, find the first occurrence within range
          if (currentDate < startDate) {
            const daysDiff = Math.ceil((startDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
            const intervalsDiff = Math.ceil(daysDiff / reminder.recurrence_interval);
            currentDate.setDate(currentDate.getDate() + (intervalsDiff * reminder.recurrence_interval));
          }
          
          while (currentDate <= endDate) {
            if (currentDate >= startDate) {
              occurrences.push({
                reminder,
                isRecurring: true,
                originalDate: new Date(currentDate)
              });
            }
            currentDate.setDate(currentDate.getDate() + reminder.recurrence_interval);
            
            // Check duration end
            if (reminder.duration_end && currentDate > new Date(reminder.duration_end)) {
              break;
            }
          }
        }
        break;
    }
    
    return occurrences;
  };

  // Generate calendar days for the current month
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    // Start from the first day of the week containing the first day of the month
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    
    // End at the last day of the week containing the last day of the month
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
    
    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Generate all reminder occurrences for the calendar view period
    const allOccurrences: ReminderOccurrence[] = [];
    reminders.forEach(reminder => {
      if (reminder.is_active) {
        const occurrences = generateReminderOccurrences(reminder, startDate, endDate);
        allOccurrences.push(...occurrences);
      }
    });
    
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const currentDay = new Date(date);
      currentDay.setHours(0, 0, 0, 0);
      
      // Find reminders for this specific day
      const dayReminders = allOccurrences.filter(occurrence => {
        const occurrenceDate = new Date(occurrence.originalDate);
        occurrenceDate.setHours(0, 0, 0, 0);
        return occurrenceDate.getTime() === currentDay.getTime();
      });
      
      days.push({
        date: new Date(date),
        isCurrentMonth: date.getMonth() === month,
        isToday: date.getTime() === today.getTime(),
        reminders: dayReminders
      });
    }
    
    return days;
  }, [currentDate, reminders]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(null);
  };

  const getWalletName = (walletId: string | null): string => {
    if (!walletId) return 'No Wallet';
    const wallet = wallets.find(w => w.id === walletId);
    return wallet ? wallet.name : 'Unknown Wallet';
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getDayRemindersTotal = (dayReminders: ReminderOccurrence[]) => {
    const payments = dayReminders.filter(r => r.reminder.type === 'Payment').reduce((sum, r) => sum + r.reminder.amount, 0);
    const receivables = dayReminders.filter(r => r.reminder.type === 'Receivable').reduce((sum, r) => sum + r.reminder.amount, 0);
    return { payments, receivables };
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (loading && reminders.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded mb-4"></div>
        <div className="grid grid-cols-7 gap-2 mb-4">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="h-8 bg-gray-200 rounded"></div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {[...Array(35)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Calendar Header */}
      <div className="bg-gray-50 px-4 sm:px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <div className="flex items-center justify-between sm:justify-end space-x-2">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              aria-label="Previous month"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goToToday}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              aria-label="Next month"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-3 sm:p-6">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 sm:mb-4">
          {dayNames.map((day, index) => (
            <div key={day} className="text-center text-xs sm:text-sm font-medium text-gray-500 py-2">
              <span className="hidden sm:inline">{day}</span>
              <span className="sm:hidden">{day.charAt(0)}</span>
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {calendarDays.map((day, dayIndex) => {
            const { payments, receivables } = getDayRemindersTotal(day.reminders);
            const hasReminders = day.reminders.length > 0;
            
            return (
              <div
                key={dayIndex}
                className={`
                  min-h-[60px] sm:min-h-[100px] p-1 sm:p-2 border rounded-lg cursor-pointer transition-all
                  ${day.isCurrentMonth ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100'}
                  ${day.isToday ? 'ring-2 ring-blue-500 border-blue-500' : ''}
                  ${hasReminders ? 'hover:shadow-md' : 'hover:bg-gray-50'}
                  ${selectedDate?.getTime() === day.date.getTime() ? 'bg-blue-50 border-blue-300' : ''}
                `}
                onClick={() => setSelectedDate(day.date)}
              >
                {/* Date Number */}
                <div className={`
                  text-xs sm:text-sm font-medium mb-1
                  ${day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                  ${day.isToday ? 'text-blue-600' : ''}
                `}>
                  {day.date.getDate()}
                </div>

                {/* Reminders Summary */}
                {hasReminders && (
                  <div className="space-y-1">
                    {payments > 0 && (
                      <div className="text-[10px] sm:text-xs bg-red-100 text-red-800 px-1 sm:px-2 py-0.5 sm:py-1 rounded truncate">
                        <span className="hidden sm:inline">Pay: </span>{formatCurrency(payments)}
                      </div>
                    )}
                    {receivables > 0 && (
                      <div className="text-[10px] sm:text-xs bg-green-100 text-green-800 px-1 sm:px-2 py-0.5 sm:py-1 rounded truncate">
                        <span className="hidden sm:inline">Receive: </span>{formatCurrency(receivables)}
                      </div>
                    )}
                    {day.reminders.length > 2 && (
                      <div className="text-[10px] sm:text-xs text-gray-500">
                        +{day.reminders.length - 2}
                      </div>
                    )}
                    {/* Show recurring indicator */}
                    {day.reminders.some(r => r.isRecurring) && (
                      <div className="text-[8px] sm:text-[10px] text-blue-600 font-medium">
                        ↻
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Date Details */}
      {selectedDate && (
        <div className="border-t border-gray-200 bg-gray-50 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">
            {selectedDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h3>
          
          {(() => {
            const year = selectedDate.getFullYear();
            const month = selectedDate.getMonth();
            
            // First day of the month
            const firstDay = new Date(year, month, 1);
            // Last day of the month
            const lastDay = new Date(year, month + 1, 0);
            
            // Start from the first day of the week containing the first day of the month
            const startDate = new Date(firstDay);
            startDate.setDate(startDate.getDate() - startDate.getDay());
            
            // End at the last day of the week containing the last day of the month
            const endDate = new Date(lastDay);
            endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
            
            // Generate all reminder occurrences for the calendar view period
            const allOccurrences: ReminderOccurrence[] = [];
            reminders.forEach(reminder => {
              if (reminder.is_active) {
                const occurrences = generateReminderOccurrences(reminder, startDate, endDate);
                allOccurrences.push(...occurrences);
              }
            });
            
            const dayReminders = allOccurrences.filter(occurrence => {
              const occurrenceDate = new Date(occurrence.originalDate);
              occurrenceDate.setHours(0, 0, 0, 0);
              const selected = new Date(selectedDate);
              selected.setHours(0, 0, 0, 0);
              return occurrenceDate.getTime() === selected.getTime();
            });

            if (dayReminders.length === 0) {
              return (
                <p className="text-gray-500 text-sm">No reminders for this date.</p>
              );
            }

            return (
              <div className="space-y-3">
                {dayReminders.map((occurrence, occurrenceIndex) => (
                  <div
                    key={`${occurrence.reminder.id}-${occurrenceIndex}`}
                    className={`
                      p-3 sm:p-4 rounded-lg border cursor-pointer transition-colors
                      ${occurrence.reminder.type === 'Payment' 
                        ? 'bg-red-50 border-red-200 hover:bg-red-100' 
                        : 'bg-green-50 border-green-200 hover:bg-green-100'
                      }
                    `}
                    onClick={() => onReminderClick?.(occurrence.reminder)}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900 text-sm sm:text-base truncate">
                            {occurrence.reminder.title}
                          </h4>
                          {occurrence.isRecurring && (
                            <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                              ↻ Recurring
                            </span>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1 truncate">
                          {getWalletName(occurrence.reminder.wallet_id)}
                        </p>
                        <div className="flex flex-wrap items-center mt-2 gap-2 sm:gap-4">
                          <span className={`
                            text-xs sm:text-sm font-medium
                            ${occurrence.reminder.type === 'Payment' ? 'text-red-700' : 'text-green-700'}
                          `}>
                            {occurrence.reminder.type === 'Payment' ? 'Payment' : 'Receivable'}
                          </span>
                          {occurrence.reminder.recurrence !== 'once' && (
                            <span className="text-xs sm:text-sm text-gray-500">
                              Recurring {occurrence.reminder.recurrence}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className={`
                        text-base sm:text-lg font-semibold self-end sm:self-start
                        ${occurrence.reminder.type === 'Payment' ? 'text-red-700' : 'text-green-700'}
                      `}>
                        {formatCurrency(occurrence.reminder.amount)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};