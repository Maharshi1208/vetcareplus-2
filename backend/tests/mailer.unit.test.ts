// tests/mailer.unit.test.ts
import nodemailer from 'nodemailer'

// Provide both default and named to be safe with CJS/ESM interop.
jest.mock('nodemailer', () => {
  const createTransport = jest.fn()
  return {
    __esModule: true,
    default: { createTransport },
    createTransport,
  }
})

const asAny = (x: unknown) => x as any

describe('mailer safe send', () => {
  let logSpy: jest.SpyInstance
  let errSpy: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
    errSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    logSpy.mockRestore()
    errSpy.mockRestore()
  })

  function loadMailerWithSendMail(sendMailImpl: jest.Mock) {
    // Set the mocked transport BEFORE importing the module so `transporter` is created from it.
    asAny(nodemailer).createTransport.mockReturnValue({ sendMail: sendMailImpl })

    let api: any
    jest.isolateModules(() => {
      api = require('../src/lib/mailer')
    })
    return api as typeof import('../src/lib/mailer')
  }

  it('sendApptBooked resolves (success path)', async () => {
    const sendMail = jest.fn().mockResolvedValue({ messageId: 'x' } as any)
    const api = loadMailerWithSendMail(sendMail)

    await expect(
      api.sendApptBooked('a@b.c', 'Fluffy', 'Dr V', new Date(), new Date())
    ).resolves.toBeUndefined()

    expect(asAny(nodemailer).createTransport).toHaveBeenCalled()
    expect(sendMail).toHaveBeenCalled()
  })

  it('sendApptCancelled swallows errors (resolves despite send failure)', async () => {
    const sendMail = jest.fn().mockRejectedValue(new Error('smtp failed'))
    const api = loadMailerWithSendMail(sendMail)

    // NOTE: 4 args (to, pet, vet, start) – matches your implementation
    await expect(
      api.sendApptCancelled('a@b.c', 'Fluffy', 'Dr V', new Date())
    ).resolves.toBeUndefined()

    // Prove we attempted to send but did not throw
    expect(sendMail).toHaveBeenCalled()
  })

  it('sendApptRescheduled resolves', async () => {
    const sendMail = jest.fn().mockResolvedValue({ messageId: 'x' } as any)
    const api = loadMailerWithSendMail(sendMail)

    await expect(
      api.sendApptRescheduled('a@b.c', 'Fluffy', 'Dr V', new Date(), new Date())
    ).resolves.toBeUndefined()
  })

  it('sendPaymentReceipt resolves', async () => {
    const sendMail = jest.fn().mockResolvedValue({ messageId: 'x' } as any)
    const api = loadMailerWithSendMail(sendMail)

    await expect(
      api.sendPaymentReceipt('a@b.c', 'R-123', 1299, 'USD')
    ).resolves.toBeUndefined()
  })
})
