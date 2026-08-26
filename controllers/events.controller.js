const Event = require('../models/event.model');
const Registration = require('../models/registration.model');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

exports.getEvents = asyncHandler(async (req, res, next) => {
  const { category, city, startDate, endDate, search, page = 1, limit = 10, sortBy, order } = req.query;

  const filter = {};

  if (category) filter.category = category;
  if (city) filter.city = city;

  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(endDate);
  }

  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const skip = (pageNum - 1) * limitNum;

  // Sorting with whitelist
  const allowedSortFields = ['date', 'registrations', 'createdAt'];
  const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'date';
  const sortDirection = order === 'desc' ? -1 : 1;

  // Special handling for registrations sorting (count registrations)
  if (sortField === 'registrations') {
    // Use aggregation to sort by registration count
    const matchStage = { $match: filter };
    const lookupStage = {
      $lookup: {
        from: 'registrations',
        localField: '_id',
        foreignField: 'event',
        as: 'regs',
      },
    };
    const addFieldsStage = {
      $addFields: { registrationsCount: { $size: '$regs' } },
    };
    const sortStage = { $sort: { registrationsCount: sortDirection } };
    const facetStage = {
      $facet: {
        data: [
          { $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: 'category' } },
          { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
          { $skip: skip },
          { $limit: limitNum },
        ],
        totalCount: [{ $count: 'count' }],
      },
    };

    const agg = await Event.aggregate([
      matchStage,
      lookupStage,
      addFieldsStage,
      sortStage,
      facetStage,
    ]);

    const data = agg[0]?.data || [];
    const total = agg[0]?.totalCount[0]?.count || 0;
    const totalPages = Math.ceil(total / limitNum) || 1;

    return res.status(200).json({
      status: 'success',
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
      data,
    });
  }

  const sort = { [sortField]: sortDirection };

  const [data, total] = await Promise.all([
    Event.find(filter).populate('category').sort(sort).skip(skip).limit(limitNum),
    Event.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limitNum) || 1;

  res.status(200).json({
    status: 'success',
    total,
    page: pageNum,
    limit: limitNum,
    totalPages,
    data,
  });
});

exports.getEventById = asyncHandler(async (req, res, next) => {
  const event = await Event.findById(req.params.id).populate('category').populate('organizer', 'name email role');
  if (!event) {
    return next(new AppError('Event not found', 404));
  }
  res.status(200).json({ status: 'success', data: event });
});

exports.createEvent = asyncHandler(async (req, res, next) => {
  const { title, description, category, date, city, venue, capacity } = req.body;

  const event = await Event.create({
    title,
    description,
    category,
    date,
    city,
    venue,
    capacity,
    organizer: req.user.userId,
  });

  const populated = await event.populate('category');

  res.status(201).json({ status: 'success', data: populated });
});

exports.updateEvent = asyncHandler(async (req, res, next) => {
  const allowedFields = ['title', 'description', 'category', 'date', 'city', 'venue', 'capacity'];
  const updates = {};
  for (const key of allowedFields) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  const event = await Event.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  })
    .populate('category')
    .populate('organizer', 'name email role');

  if (!event) {
    return next(new AppError('Event not found', 404));
  }

  res.status(200).json({ status: 'success', data: event });
});

exports.deleteEvent = asyncHandler(async (req, res, next) => {
  const event = await Event.findByIdAndDelete(req.params.id);
  if (!event) {
    return next(new AppError('Event not found', 404));
  }
  res.status(200).json({ status: 'success', data: null, message: 'Event deleted successfully' });
});
