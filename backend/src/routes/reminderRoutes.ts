import { Router } from 'express';
import { ReminderController } from '../controllers/ReminderController';
import { authenticate } from '../middleware/authMiddleware';
import { validateReminderAccess } from '../middleware/ownershipMiddleware';

const router = Router();
const reminderController = new ReminderController();

// Apply authentication middleware to all routes
router.use(authenticate);

// GET /api/reminders - Get user's reminders with optional filtering
router.get('/', reminderController.getUserReminders);

// GET /api/reminders/upcoming - Get upcoming reminders
router.get('/upcoming', reminderController.getUpcomingReminders);

// GET /api/reminders/schedule - Get reminders with their upcoming occurrences
router.get('/schedule', reminderController.getRemindersSchedule);

// GET /api/reminders/due - Get reminders that are due today or on a specific date
router.get('/due', reminderController.getDueReminders);

// GET /api/reminders/:id - Get specific reminder
router.get('/:id', validateReminderAccess(), reminderController.getReminderById);

// GET /api/reminders/:id/occurrences - Get upcoming occurrences for a reminder
router.get('/:id/occurrences', validateReminderAccess(), reminderController.getReminderOccurrences);

// POST /api/reminders - Create new reminder
router.post('/', reminderController.createReminder);

// PUT /api/reminders/:id - Update reminder
router.put('/:id', validateReminderAccess(), reminderController.updateReminder);

// DELETE /api/reminders/:id - Delete reminder
router.delete('/:id', validateReminderAccess(), reminderController.deleteReminder);

// PUT /api/reminders/:id/deactivate - Deactivate reminder
router.put('/:id/deactivate', validateReminderAccess(), reminderController.deactivateReminder);

// PUT /api/reminders/:id/activate - Activate reminder
router.put('/:id/activate', validateReminderAccess(), reminderController.activateReminder);

export default router;