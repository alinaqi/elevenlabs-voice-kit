import { describe, expect, it, vi } from 'vitest'
import { withHold } from '../src/tools/hold.js'
import { createDemoToolHandlers, createMockCalendar } from '../src/tools/index.js'

const hold = () => ({ start: vi.fn(), stop: vi.fn() })
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

describe('withHold', () => {
  it('does not play hold music for fast tasks', async () => {
    const h = hold()
    expect(await withHold(async () => 'fast', h, { thresholdMs: 50 })).toBe('fast')
    expect(h.start).not.toHaveBeenCalled()
  })

  it('plays and then stops hold music for slow tasks', async () => {
    const h = hold()
    expect(await withHold(async () => { await sleep(80); return 'slow' }, h, { thresholdMs: 20 })).toBe('slow')
    expect(h.start).toHaveBeenCalledOnce()
    expect(h.stop).toHaveBeenCalledOnce()
  })

  it('stops hold music when the task fails', async () => {
    const h = hold()
    await expect(withHold(async () => { await sleep(50); throw new Error('x') }, h, { thresholdMs: 10 })).rejects.toThrow('x')
    expect(h.stop).toHaveBeenCalledOnce()
  })
})

describe('createDemoToolHandlers', () => {
  const now = () => new Date('2026-11-24T08:00:00+04:00')
  const make = (research = vi.fn(async () => ({ answer: 'AED 100,000 per DSO page', sources: ['dso.ae'], cached: true }))) => {
    const events: Array<{ type: string }> = []
    const handlers = createDemoToolHandlers({ calendar: createMockCalendar({ now }), research, hold: hold(), onEvent: (e) => events.push(e) })
    return { handlers, events, research }
  }

  it('books appointments and reports events for the UI', async () => {
    const { handlers, events } = make()
    const reply = await handlers.book_appointment({ name: 'Sara', contact: '050', service: 'visa renewal', date: '2026-11-26', time: '10:00' })
    expect(reply).toMatch(/DSO-\d+/)
    expect(events[0].type).toBe('booking')
  })

  it('returns a readable error the agent can say', async () => {
    const { handlers } = make()
    expect(await handlers.book_appointment({ name: '', contact: '050', service: 'x', date: '2026-11-26', time: '10:00' })).toMatch(/could not book/i)
  })

  it('finds services, routes, checklists and hands over', async () => {
    const { handlers, events } = make()
    expect(await handlers.find_service({ query: 'renew visa' })).toContain('Employment visa renewal')
    expect(await handlers.send_route_to_phone({ destination: 'DSO Masjid' })).toContain('DSO Masjid')
    expect(await handlers.build_setup_checklist({ team_size: 2, visas: 2, resident_in_uae: false })).toContain('FZCO')
    expect(await handlers.handover_to_human({ reason: 'fee dispute' })).toContain('600 59 55 57')
    expect(events.map((e) => e.type)).toEqual(['service', 'route', 'checklist', 'handover'])
  })

  it('researches facts through the research service', async () => {
    const { handlers, research } = make()
    expect(await handlers.research_fact({ question: 'minimum capital?' })).toContain('AED 100,000')
    expect(research).toHaveBeenCalledWith('minimum capital?')
  })
})
