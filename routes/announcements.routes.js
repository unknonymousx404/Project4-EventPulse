const express = require('express');
const { body } = require('express-validator');
const announcementsController = require('../controllers/announcements.controller');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');
const validate = require('../middleware/validate');

const router = express.Router();

// POST /api/announcements - admin only
router.post(
  '/',
  requireAuth,
  requireRole('admin'),
  [
    body('eventId')
      .if((value, { req }) => !req.body.event)
      .notEmpty()
      .withMessage('eventId is required')
      .isMongoId()
      .withMessage('eventId must be valid MongoId'),
    body('text')
      .if((value, { req }) => !req.body.message)
      .notEmpty()
      .withMessage('text is required')
      .trim()
      .notEmpty(),
  ],
  validate,
  announcementsController.sendAnnouncement
);

// GET /api/announcements/:eventId - public history
router.get('/:eventId', announcementsController.getByEvent);

module.exports = router;
