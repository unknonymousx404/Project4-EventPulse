const express = require('express');
const { body, param } = require('express-validator');
const eventsController = require('../controllers/events.controller');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');
const validate = require('../middleware/validate');

const registrationsController = require('../controllers/registrations.controller');
const announcementsController = require('../controllers/announcements.controller');

const router = express.Router();

router.get('/', eventsController.getEvents);

// Event registration aliases (Task 4 alternative routes)
router.post('/:id/register', requireAuth, registrationsController.registerForEventByParam);
router.delete('/:id/register', requireAuth, registrationsController.cancelRegistrationByEvent);
router.get('/:id/attendees', registrationsController.getAttendees);
router.get('/:id/status', registrationsController.getStatus);

// Announcement history alias (Task 5)
router.get('/:id/announcements', announcementsController.getByEvent);

router.get('/:id', eventsController.getEventById);

router.post(
  '/',
  requireAuth,
  requireRole('admin'),
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('category').isMongoId().withMessage('Category must be a valid MongoId'),
    body('date').isISO8601().withMessage('Date must be a valid date'),
    body('city').trim().notEmpty().withMessage('City is required'),
    body('venue').trim().notEmpty().withMessage('Venue is required'),
    body('capacity').isInt({ min: 1 }).withMessage('Capacity must be a positive number'),
  ],
  validate,
  eventsController.createEvent
);

router.patch(
  '/:id',
  requireAuth,
  requireRole('admin'),
  [param('id').isMongoId().withMessage('Invalid event id')],
  validate,
  eventsController.updateEvent
);

router.put(
  '/:id',
  requireAuth,
  requireRole('admin'),
  [param('id').isMongoId().withMessage('Invalid event id')],
  validate,
  eventsController.updateEvent
);

router.delete(
  '/:id',
  requireAuth,
  requireRole('admin'),
  [param('id').isMongoId().withMessage('Invalid event id')],
  validate,
  eventsController.deleteEvent
);

module.exports = router;
