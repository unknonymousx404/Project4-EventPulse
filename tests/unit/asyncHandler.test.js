const asyncHandler = require('../../utils/asyncHandler');

describe('asyncHandler', () => {
  test('calls wrapped function with req, res, next', async () => {
    const fn = jest.fn((req, res, next) => Promise.resolve('ok'));
    const wrapped = asyncHandler(fn);
    const req = {};
    const res = {};
    const next = jest.fn();
    await wrapped(req, res, next);
    expect(fn).toHaveBeenCalledWith(req, res, next);
    expect(next).not.toHaveBeenCalled();
  });

  test('passes error to next when function throws', async () => {
    const error = new Error('fail');
    const fn = jest.fn(() => Promise.reject(error));
    const wrapped = asyncHandler(fn);
    const next = jest.fn();
    await wrapped({}, {}, next);
    expect(next).toHaveBeenCalledWith(error);
  });

  test('passes sync thrown error to next', async () => {
    const error = new Error('sync fail');
    const fn = jest.fn(() => {
      throw error;
    });
    const wrapped = asyncHandler(fn);
    const next = jest.fn();
    await wrapped({}, {}, next);
    expect(next).toHaveBeenCalledWith(error);
  });

  test('resolves successfully without calling next', async () => {
    const fn = jest.fn(async (req, res, next) => {
      res.json = jest.fn();
    });
    const wrapped = asyncHandler(fn);
    const next = jest.fn();
    await wrapped({}, {}, next);
    expect(next).not.toHaveBeenCalled();
  });
});
