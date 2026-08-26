const AppError = require('../../utils/AppError');

describe('AppError', () => {
  test('creates error with 404 and status fail', () => {
    const err = new AppError('Not found', 404);
    expect(err.message).toBe('Not found');
    expect(err.statusCode).toBe(404);
    expect(err.status).toBe('fail');
    expect(err.isOperational).toBe(true);
    expect(err).toBeInstanceOf(Error);
  });

  test('creates error with 500 and status error', () => {
    const err = new AppError('Server error', 500);
    expect(err.statusCode).toBe(500);
    expect(err.status).toBe('error');
    expect(err.isOperational).toBe(true);
  });

  test('isOperational is always true', () => {
    const err = new AppError('Something', 400);
    expect(err.isOperational).toBe(true);
  });

  test('is instance of Error', () => {
    const err = new AppError('Test', 400);
    expect(err instanceof Error).toBe(true);
    expect(err.stack).toBeDefined();
  });
});
