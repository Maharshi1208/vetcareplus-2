import { z } from 'zod';
const OwnerDTO = z.object({ name: z.string().min(1), email: z.string().email(), phone: z.string().min(7) });
const PetDTO   = z.object({ ownerId: z.string().min(1), name: z.string().min(1), species: z.string().min(1) });
const ApptDTO  = z.object({ ownerId: z.string().min(1), petId: z.string().min(1), vetId: z.string().min(1), start: z.string(), end: z.string() });
const InvoiceDTO = z.object({ appointmentId: z.string().min(1), items: z.array(z.object({ name: z.string(), price: z.number().nonnegative() })) });
describe('DTO validation', () => {
  it('Owner ok/bad', () => {
    expect(OwnerDTO.safeParse({ name: 'A', email: 'a@b.com', phone: '1234567' }).success).toBe(true);
    expect(OwnerDTO.safeParse({ name: '', email: 'bad', phone: '' }).success).toBe(false);
  });
  it('Pet needs ownerId', () => {
    expect(PetDTO.safeParse({ ownerId: '1', name: 'Buddy', species: 'Dog' }).success).toBe(true);
    expect(PetDTO.safeParse({ name: 'Buddy', species: 'Dog' }).success).toBe(false);
  });
  it('Appt needs ids & times', () => {
    expect(ApptDTO.safeParse({ ownerId:'1', petId:'1', vetId:'1', start:'2025-10-02T10:00:00Z', end:'2025-10-02T11:00:00Z' }).success).toBe(true);
    expect(ApptDTO.safeParse({ ownerId:'1', petId:'1', vetId:'1' }).success).toBe(false);
  });
  it('Invoice items positive', () => {
    expect(InvoiceDTO.safeParse({ appointmentId:'1', items:[{name:'Exam', price:50}] }).success).toBe(true);
    expect(InvoiceDTO.safeParse({ appointmentId:'1', items:[{name:'Exam', price:-1}] }).success).toBe(false);
  });
});
