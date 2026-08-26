const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'test_secret_key_for_jwt_testing';
process.env.JWT_EXPIRES_IN = '7d';
process.env.NODE_ENV = 'test';

const { app } = require('../../app');
const Event = require('../../models/event.model');

describe('Events API Integration', () => {
  let adminToken;
  let attendeeToken;
  let categoryId;

  beforeAll(() => {
    const adminId = new mongoose.Types.ObjectId();
    const attendeeId = new mongoose.Types.ObjectId();
    adminToken = jwt.sign({ userId: adminId.toString(), role: 'admin' }, process.env.JWT_SECRET);
    attendeeToken = jwt.sign({ userId: attendeeId.toString(), role: 'attendee' }, process.env.JWT_SECRET);
    categoryId = new mongoose.Types.ObjectId().toString();
  });

  beforeEach(() => {
    const mockEvent = {
      _id: new mongoose.Types.ObjectId(),
      title: 'Tech Conference',
      description: 'A great tech event about AI',
      category: { _id: categoryId, name: 'Tech' },
      city: 'Cairo',
      date: new Date('2025-06-15'),
      venue: 'Cairo Center',
      capacity: 100,
    };

    const chain = {
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([mockEvent]),
    };

    jest.spyOn(Event, 'find').mockReturnValue(chain);
    jest.spyOn(Event, 'countDocuments').mockResolvedValue(1);
    jest.spyOn(Event, 'aggregate').mockResolvedValue([{ data: [mockEvent], totalCount: [{ count: 1 }] }]);
    jest.spyOn(Event, 'findById').mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockEvent),
      }),
    });
    jest.spyOn(Event, 'create').mockImplementation((data) =>
      Promise.resolve({
        ...data,
        _id: new mongoose.Types.ObjectId(),
        populate: jest.fn().mockResolvedValue({ ...data, _id: new mongoose.Types.ObjectId(), category: { name: 'Tech' } }),
      })
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('GET /api/events returns 200 and array', async () => {
    const res = await request(app).get('/api/events');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('POST /api/events without token returns 401', async () => {
    const res = await request(app)
      .post('/api/events')
      .send({ title: 'Test', description: 'desc', category: categoryId, date: '2025-01-01', city: 'Cairo', venue: 'Hall', capacity: 10 });
    expect(res.status).toBe(401);
  });

  test('POST /api/events with invalid data returns 422', async () => {
    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: '', capacity: 0 });
    expect(res.status).toBe(422);
    expect(res.body.errors).toBeDefined();
  });

  test('POST /api/events with attendee role returns 403', async () => {
    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${attendeeToken}`)
      .send({ title: 'Test', description: 'desc', category: categoryId, date: '2025-01-01', city: 'Cairo', venue: 'Hall', capacity: 10 });
    expect(res.status).toBe(403);
  });

  test('GET /api/events/:id returns 200', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app).get(`/api/events/${fakeId}`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
  });

  test('Filtering by city still returns 200', async () => {
    const res = await request(app).get('/api/events?city=Cairo');
    expect(res.status).toBe(200);
  });

  test('Search works', async () => {
    const res = await request(app).get('/api/events?search=TECH');
    expect(res.status).toBe(200);
  });

  test('Pagination returns metadata', async () => {
    const res = await request(app).get('/api/events?page=1&limit=1');
    expect(res.status).toBe(200);
    expect(res.body.total).toBeDefined();
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(1);
    expect(res.body.totalPages).toBeDefined();
  });
});
