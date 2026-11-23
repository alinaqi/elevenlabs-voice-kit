import { z } from 'zod'

/** In-memory demo calendar: DSO hours (Mon–Fri 08:00–15:00 Dubai), 30-minute slots. */
export interface Booking {
  ref: string
  name: string
  contact: string
  service: string
  date: string
  time: string
}

export type CalendarResult = { ok: true, booking: Booking } | { ok: false, error: string }

const bookingSchema = z.object({
  name: z.string().trim().min(1, 'name is required'),
  contact: z.string().trim().min(3, 'contact is required'),
  service: z.string().trim().min(1, 'service is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
  time: z.string().regex(/^\d{2}:(00|30)$/, 'time must be HH:00 or HH:30')
})

function slotError (date: string, time: string, now: Date): string | undefined {
  const at = new Date(`${date}T${time}:00+04:00`)
  if (Number.isNaN(at.getTime())) return 'invalid date'
  if (at <= now) return 'that time is in the past'
  const day = at.getUTCDay()
  if (day === 0 || day === 6) return 'DSO is closed on weekends'
  const hour = Number(time.slice(0, 2))
  if (hour < 8 || hour >= 15) return 'DSO service hours are 08:00 to 15:00'
  return undefined
}

export function createMockCalendar ({ now = () => new Date() }: { now?: () => Date } = {}) {
  const bookings = new Map<string, Booking>()
  let seq = 1000
  const taken = (date: string, time: string, ignore?: string) =>
    [...bookings.values()].some((b) => b.date === date && b.time === time && b.ref !== ignore)
  const check = (date: string, time: string, ignore?: string) =>
    slotError(date, time, now()) ?? (taken(date, time, ignore) ? 'that slot is already booked' : undefined)

  function book (input: Omit<Booking, 'ref'>): CalendarResult {
    const parsed = bookingSchema.safeParse(input)
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }
    const error = check(input.date, input.time)
    if (error) return { ok: false, error }
    const booking = { ...parsed.data, ref: `DSO-${++seq}` }
    bookings.set(booking.ref, booking)
    return { ok: true, booking }
  }

  function reschedule (ref: string, date: string, time: string): CalendarResult {
    const existing = bookings.get(ref)
    if (!existing) return { ok: false, error: `no booking ${ref}` }
    const error = check(date, time, ref)
    if (error) return { ok: false, error }
    const booking = { ...existing, date, time }
    bookings.set(ref, booking)
    return { ok: true, booking }
  }

  function cancel (ref: string): CalendarResult {
    const existing = bookings.get(ref)
    if (!existing) return { ok: false, error: `no booking ${ref}` }
    bookings.delete(ref)
    return { ok: true, booking: existing }
  }

  return { book, reschedule, cancel, list: () => [...bookings.values()] }
}

export type MockCalendar = ReturnType<typeof createMockCalendar>
