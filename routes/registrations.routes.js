const express = require('express');
const { body } = require('express-validator');
const registrationsController = require('../controllers/registrations.controller');
const requireAuth = require('../middleware/requireAuth');
const validate = require('../middleware/validate');

const router = express.Router();

// All registration routes require auth
router.use(requireAuth);

// POST /api/registrations - register for event
router.post(
  '/',
  [
    body('event')
      .if((value, { req }) => !req.body.eventId)
      .notEmpty()
      .withMessage('event is required')
      .isMongoId()
      .withMessage('Event must be valid MongoId'),
    body('eventId')
      .optional()
      .isMongoId()
      .withMessage('eventId must be valid MongoId'),
  ],
  validate,
  registrationsController.registerForEvent
);

// GET /api/registrations/my - my registrations (must be before /:id)
router.get('/my', registrationsController.getMyRegistrations);

// DELETE /api/registrations/:id - cancel registration
router.delete('/:id', registrationsController.cancelRegistration);

// --- Aliases for /api/events/:id/... style (mounted via events router alternative) ---
// These are also exposed via events routes file, but we keep helper routes here for testing

module.exports = router;
