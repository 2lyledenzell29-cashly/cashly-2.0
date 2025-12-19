import { Request, Response } from 'express';
import { ReminderService } from '../services/ReminderService';
import { ApiResponse, CreateReminderRequest, UpdateReminderRequest, ReminderQueryParams } from '../types';

export class ReminderController {
  private reminderService: ReminderService;

  constructor() {
    this.reminderService = new ReminderService();
  }

  // GET /api/reminders - Get user's reminders with optional filtering
  getUserReminders = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTH_TOKEN_INVALID',
            message: 'Invalid authentication token'
          }
        } as ApiResponse);
        return;
      }

      const queryParams: ReminderQueryParams = req.query;
      let reminders;

      // Handle different query parameters
      if (queryParams.type) {
        reminders = await this.reminderService.getRemindersByType(userId, queryParams.type as 'Payment' | 'Receivable');
      } else if (queryParams.upcoming_days) {
        const days = parseInt(queryParams.upcoming_days);
        if (isNaN(days) || days < 0) {
          res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_FAILED',
              message: 'upcoming_days must be a non-negative number'
            }
          } as ApiResponse);
          return;
        }
        reminders = await this.reminderService.getUpcomingReminders(userId, days);
      } else if (queryParams.overdue === 'true') {
        reminders = await this.reminderService.getOverdueReminders(userId);
      } else if (queryParams.is_active === 'true') {
        reminders = await this.reminderService.getActiveReminders(userId);
      } else {
        reminders = await this.reminderService.getUserReminders(userId);
      }

      res.status(200).json({
        success: true,
        data: reminders
      } as ApiResponse);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  // GET /api/reminders/upcoming - Get upcoming reminders (default 7 days)
  getUpcomingReminders = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTH_TOKEN_INVALID',
            message: 'Invalid authentication token'
          }
        } as ApiResponse);
        return;
      }

      const days = req.query.days ? parseInt(req.query.days as string) : 7;
      if (isNaN(days) || days < 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: 'Days parameter must be a non-negative number'
          }
        } as ApiResponse);
        return;
      }

      const reminders = await this.reminderService.getUpcomingReminders(userId, days);

      res.status(200).json({
        success: true,
        data: reminders
      } as ApiResponse);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  // GET /api/reminders/:id - Get specific reminder
  getReminderById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTH_TOKEN_INVALID',
            message: 'Invalid authentication token'
          }
        } as ApiResponse);
        return;
      }

      const reminder = await this.reminderService.getReminderById(id, userId);

      if (!reminder) {
        res.status(404).json({
          success: false,
          error: {
            code: 'RESOURCE_NOT_FOUND',
            message: 'Reminder not found'
          }
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: reminder
      } as ApiResponse);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  // POST /api/reminders - Create new reminder
  createReminder = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTH_TOKEN_INVALID',
            message: 'Invalid authentication token'
          }
        } as ApiResponse);
        return;
      }

      const reminderData: CreateReminderRequest = req.body;

      // Validate required fields
      if (!reminderData.title || !reminderData.amount || !reminderData.type || !reminderData.due_date) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: 'Title, amount, type, and due_date are required'
          }
        } as ApiResponse);
        return;
      }

      // Validate amount is a positive number
      if (typeof reminderData.amount !== 'number' || reminderData.amount <= 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: 'Amount must be a positive number'
          }
        } as ApiResponse);
        return;
      }

      // Validate type
      if (!['Payment', 'Receivable'].includes(reminderData.type)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: 'Type must be either Payment or Receivable'
          }
        } as ApiResponse);
        return;
      }

      // Validate recurrence
      if (reminderData.recurrence && !['once', 'daily', 'weekly', 'monthly', 'custom'].includes(reminderData.recurrence)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: 'Recurrence must be one of: once, daily, weekly, monthly, custom'
          }
        } as ApiResponse);
        return;
      }

      const reminder = await this.reminderService.createReminder(userId, reminderData);

      res.status(201).json({
        success: true,
        data: reminder
      } as ApiResponse);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  // PUT /api/reminders/:id - Update reminder
  updateReminder = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTH_TOKEN_INVALID',
            message: 'Invalid authentication token'
          }
        } as ApiResponse);
        return;
      }

      const reminderData: UpdateReminderRequest = req.body;

      // Validate amount if provided
      if (reminderData.amount !== undefined) {
        if (typeof reminderData.amount !== 'number' || reminderData.amount <= 0) {
          res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_FAILED',
              message: 'Amount must be a positive number'
            }
          } as ApiResponse);
          return;
        }
      }

      // Validate type if provided
      if (reminderData.type && !['Payment', 'Receivable'].includes(reminderData.type)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: 'Type must be either Payment or Receivable'
          }
        } as ApiResponse);
        return;
      }

      // Validate recurrence if provided
      if (reminderData.recurrence && !['once', 'daily', 'weekly', 'monthly', 'custom'].includes(reminderData.recurrence)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: 'Recurrence must be one of: once, daily, weekly, monthly, custom'
          }
        } as ApiResponse);
        return;
      }

      const reminder = await this.reminderService.updateReminder(id, userId, reminderData);

      if (!reminder) {
        res.status(404).json({
          success: false,
          error: {
            code: 'RESOURCE_NOT_FOUND',
            message: 'Reminder not found'
          }
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: reminder
      } as ApiResponse);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  // DELETE /api/reminders/:id - Delete reminder
  deleteReminder = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTH_TOKEN_INVALID',
            message: 'Invalid authentication token'
          }
        } as ApiResponse);
        return;
      }

      const success = await this.reminderService.deleteReminder(id, userId);

      if (!success) {
        res.status(404).json({
          success: false,
          error: {
            code: 'RESOURCE_NOT_FOUND',
            message: 'Reminder not found'
          }
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: { message: 'Reminder deleted successfully' }
      } as ApiResponse);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  // PUT /api/reminders/:id/deactivate - Deactivate reminder
  deactivateReminder = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTH_TOKEN_INVALID',
            message: 'Invalid authentication token'
          }
        } as ApiResponse);
        return;
      }

      const reminder = await this.reminderService.deactivateReminder(id, userId);

      if (!reminder) {
        res.status(404).json({
          success: false,
          error: {
            code: 'RESOURCE_NOT_FOUND',
            message: 'Reminder not found'
          }
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: reminder
      } as ApiResponse);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  // PUT /api/reminders/:id/activate - Activate reminder
  activateReminder = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTH_TOKEN_INVALID',
            message: 'Invalid authentication token'
          }
        } as ApiResponse);
        return;
      }

      const reminder = await this.reminderService.activateReminder(id, userId);

      if (!reminder) {
        res.status(404).json({
          success: false,
          error: {
            code: 'RESOURCE_NOT_FOUND',
            message: 'Reminder not found'
          }
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: reminder
      } as ApiResponse);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  // GET /api/reminders/:id/occurrences - Get upcoming occurrences for a reminder
  getReminderOccurrences = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTH_TOKEN_INVALID',
            message: 'Invalid authentication token'
          }
        } as ApiResponse);
        return;
      }

      const maxOccurrences = req.query.max ? parseInt(req.query.max as string) : 10;
      if (isNaN(maxOccurrences) || maxOccurrences < 1 || maxOccurrences > 50) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: 'Max occurrences must be between 1 and 50'
          }
        } as ApiResponse);
        return;
      }

      const reminder = await this.reminderService.getReminderById(id, userId);
      if (!reminder) {
        res.status(404).json({
          success: false,
          error: {
            code: 'RESOURCE_NOT_FOUND',
            message: 'Reminder not found'
          }
        } as ApiResponse);
        return;
      }

      const occurrences = await this.reminderService.getAllUpcomingOccurrences(reminder, maxOccurrences);

      res.status(200).json({
        success: true,
        data: {
          reminder,
          occurrences
        }
      } as ApiResponse);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  // GET /api/reminders/schedule - Get reminders with their upcoming occurrences
  getRemindersSchedule = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTH_TOKEN_INVALID',
            message: 'Invalid authentication token'
          }
        } as ApiResponse);
        return;
      }

      const days = req.query.days ? parseInt(req.query.days as string) : 30;
      if (isNaN(days) || days < 1 || days > 365) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: 'Days parameter must be between 1 and 365'
          }
        } as ApiResponse);
        return;
      }

      const schedule = await this.reminderService.getRemindersWithUpcomingOccurrences(userId, days);

      res.status(200).json({
        success: true,
        data: schedule
      } as ApiResponse);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  // GET /api/reminders/due - Get reminders that are due today or on a specific date
  getDueReminders = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTH_TOKEN_INVALID',
            message: 'Invalid authentication token'
          }
        } as ApiResponse);
        return;
      }

      let checkDate = new Date();
      if (req.query.date) {
        checkDate = new Date(req.query.date as string);
        if (isNaN(checkDate.getTime())) {
          res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_FAILED',
              message: 'Invalid date format'
            }
          } as ApiResponse);
          return;
        }
      }

      const dueReminders = await this.reminderService.getDueReminders(userId, checkDate);

      res.status(200).json({
        success: true,
        data: dueReminders
      } as ApiResponse);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  private handleError(error: any, res: Response): void {
    const errorMessage = error.message || 'INTERNAL_SERVER_ERROR';

    switch (errorMessage) {
      case 'RESOURCE_NOT_FOUND':
        res.status(404).json({
          success: false,
          error: {
            code: 'RESOURCE_NOT_FOUND',
            message: 'Reminder or wallet not found'
          }
        } as ApiResponse);
        break;

      case 'VALIDATION_INVALID_AMOUNT':
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_INVALID_AMOUNT',
            message: 'Amount must be a positive number'
          }
        } as ApiResponse);
        break;

      case 'VALIDATION_INVALID_DATE':
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_INVALID_DATE',
            message: 'Invalid date format'
          }
        } as ApiResponse);
        break;

      case 'VALIDATION_INVALID_RECURRENCE_INTERVAL':
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_INVALID_RECURRENCE_INTERVAL',
            message: 'Recurrence interval must be a positive number for custom recurrence'
          }
        } as ApiResponse);
        break;

      case 'VALIDATION_INVALID_DURATION_END':
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_INVALID_DURATION_END',
            message: 'Invalid duration end date format'
          }
        } as ApiResponse);
        break;

      case 'VALIDATION_DURATION_END_BEFORE_DUE_DATE':
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_DURATION_END_BEFORE_DUE_DATE',
            message: 'Duration end date must be after due date'
          }
        } as ApiResponse);
        break;

      default:
        console.error('Reminder controller error:', error);
        res.status(500).json({
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An unexpected error occurred'
          }
        } as ApiResponse);
        break;
    }
  }
}