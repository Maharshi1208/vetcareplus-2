// backend/tests/_globalMocks.ts
// Make all mail sends no-ops for every test run
jest.mock('../src/lib/mailer', () => ({
  sendApptBooked: jest.fn().mockResolvedValue(undefined),
  sendApptRescheduled: jest.fn().mockResolvedValue(undefined),
  sendApptCancelled: jest.fn().mockResolvedValue(undefined),
}));
