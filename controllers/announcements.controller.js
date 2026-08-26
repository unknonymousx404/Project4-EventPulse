const Message = require('../models/message.model');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

exports.sendAnnouncement = asyncHandler(async (req, res, next) => {
  const { eventId, text, event, message } = req.body;
  const resolvedEventId = eventId || event;
  const resolvedText = text || message;

  if (!resolvedEventId) {
    return next(new AppError('eventId is required', 400));
  }
  if (!resolvedText) {
    return next(new AppError('text is required', 400));
  }

  const saved = await Message.create({
    event: resolvedEventId,
    sender: req.user.userId,
    text: resolvedText,
  });

  await saved.populate('sender', 'name email role');

  // Emit via Socket.io if available
  const io = req.app.get('io');
  if (io) {
    io.to(resolvedEventId.toString()).emit('announcement', saved);
  }

  res.status(201).json({ status: 'success', data: saved });
});

exports.getByEvent = asyncHandler(async (req, res, next) => {
  const eventId = req.params.eventId || req.params.id;
  const messages = await Message.find({ event: eventId })
    .populate('sender', 'name email role')
    .sort({ createdAt: 1 });

  res.status(200).json({ status: 'success', data: messages });
});
