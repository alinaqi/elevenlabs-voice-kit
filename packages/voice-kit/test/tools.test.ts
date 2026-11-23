import { describe, expect, it } from 'vitest'
import {
  buildSetupChecklist,
  createMockCalendar,
  defineClientTool,
  findService,
  routeLink,
  toElevenTool
} from '../src/tools/index.js'

describe('defineClientTool', () => {
  const tool = defineClientTool({
    name: 'book_slot',
    description: 'Book a slot',
    params: {
      name: { type: 'string', description: 'Caller name' },
      service: { type: 'string', description: 'Service', enum: ['visa', 'card'] },
      notes: { type: 'string', description: 'Notes', optional: true }
    }
  })

  it('converts to an ElevenLabs client tool with required params', () => {
    const eleven = toElevenTool(tool)
    expect(eleven.type).toBe('client')
    expect(eleven.expectsResponse).toBe(true)
    expect(eleven.parameters?.required).toEqual(['name', 'service'])
    expect(eleven.parameters?.properties?.service).toMatchObject({ enum: ['visa', 'card'] })
  })

  it('rejects invalid tool names', () => {
    expect(() => defineClientTool({ name: 'Bad Name', description: 'x', params: {} })).toThrow()
  })
})

describe('createMockCalendar', () => {
  const now = new Date('2026-11-24T08:00:00+04:00')
  const booking = { name: 'Sara', contact: '+971500000000', service: 'visa_renewal', date: '2026-11-26', time: '10:00' }

  it('books, reschedules and cancels', () => {
    const cal = createMockCalendar({ now: () => now })
    const booked = cal.book(booking)
    expect(booked.ok).toBe(true)
    const ref = booked.ok ? booked.booking.ref : ''
    expect(cal.reschedule(ref, '2026-11-27', '11:00').ok).toBe(true)
    expect(cal.list()[0]).toMatchObject({ date: '2026-11-27', time: '11:00' })
    expect(cal.cancel(ref).ok).toBe(true)
    expect(cal.list()).toHaveLength(0)
  })

  it('rejects past dates, weekends, out-of-hours and double booking', () => {
    const cal = createMockCalendar({ now: () => now })
    expect(cal.book({ ...booking, date: '2026-11-20' }).ok).toBe(false)
    expect(cal.book({ ...booking, date: '2026-11-28' }).ok).toBe(false)
    expect(cal.book({ ...booking, time: '16:00' }).ok).toBe(false)
    expect(cal.book(booking).ok).toBe(true)
    expect(cal.book(booking).ok).toBe(false)
  })

  it('rejects missing fields and unknown refs', () => {
    const cal = createMockCalendar({ now: () => now })
    expect(cal.book({ ...booking, name: '' }).ok).toBe(false)
    expect(cal.cancel('NOPE').ok).toBe(false)
    expect(cal.reschedule('NOPE', '2026-11-27', '11:00').ok).toBe(false)
  })
})

describe('demo data helpers', () => {
  it('finds DSO services by keyword in English and Arabic', () => {
    expect(findService('renew visa')?.id).toBe('visa_renewal')
    expect(findService('بطاقة دخول')?.id).toBe('access_card')
    expect(findService('xyz')).toBeUndefined()
    expect(findService('renew employment visa for an employee')?.id).toBe('visa_renewal')
    expect(findService('new employment visa for a hire')?.id).toBe('visa_new')
    expect(findService('أريد تجديد تأشيرة عمل')?.id).toBe('visa_renewal')
  })

  it('builds a founder checklist that flags figures to confirm', () => {
    const list = buildSetupChecklist({ teamSize: 2, visas: 2, residentInUae: false })
    expect(list.recommendation).toContain('FZCO')
    expect(list.recommendation).toContain('flexi desk')
    expect(list.documents).toContain('Passport copies for all shareholders')
    expect(list.documents.join(' ')).not.toContain('NOC')
    expect(list.confirmWithHuman.length).toBeGreaterThan(0)
    expect(buildSetupChecklist({ teamSize: 3, visas: 3, residentInUae: true }).documents.join(' ')).toContain('NOC')
    expect(buildSetupChecklist({ teamSize: 5, visas: 6, residentInUae: false }).recommendation).toContain('office')
  })

  it('creates a map link for a known place and rejects unknown ones', () => {
    expect(routeLink('DSO Masjid')?.url).toMatch(/^https:\/\/www\.google\.com\/maps/)
    expect(routeLink('Atlantis')).toBeUndefined()
  })
})
