import type { MockCalendar } from './calendar.js'
import { findService } from './catalogue.js'
import { buildSetupChecklist } from './checklist.js'
import { withHold, type HoldController } from './hold.js'
import { routeLink } from './places.js'

export interface ResearchAnswer { answer: string, sources: string[], cached: boolean }
export interface ToolEvent { type: string, data: unknown }
type Params = Record<string, unknown>
export type ToolHandlers = Record<string, (params: Params) => Promise<string>>

export interface DemoToolDeps {
  calendar: MockCalendar
  research: (question: string) => Promise<ResearchAnswer>
  hold: HoldController
  onEvent?: (event: ToolEvent) => void
}

const HANDOVER = 'DSO customer service on 600 59 55 57, Monday to Friday 08:00 to 15:00'
const str = (v: unknown) => String(v ?? '')

function bookingHandlers ({ calendar, onEvent }: DemoToolDeps): ToolHandlers {
  const report = (r: ReturnType<MockCalendar['book']>, verb: string) => {
    if (!r.ok) return `Could not ${verb}: ${r.error}.`
    onEvent?.({ type: 'booking', data: { ...r.booking, action: verb } })
    const b = r.booking
    return `${verb} done. Reference ${b.ref}: ${b.service} for ${b.name} on ${b.date} at ${b.time}. Read this back to confirm.`
  }
  return {
    book_appointment: async (p) => report(calendar.book({
      name: str(p.name), contact: str(p.contact), service: str(p.service), date: str(p.date), time: str(p.time)
    }), 'book'),
    reschedule_appointment: async (p) => report(calendar.reschedule(str(p.ref), str(p.date), str(p.time)), 'reschedule'),
    cancel_appointment: async (p) => report(calendar.cancel(str(p.ref)), 'cancel')
  }
}

function infoHandlers ({ onEvent }: DemoToolDeps): ToolHandlers {
  return {
    find_service: async (p) => {
      const s = findService(str(p.query))
      if (!s) return 'No matching service. Ask a clarifying question or offer a handover.'
      onEvent?.({ type: 'service', data: s })
      return `${s.name} (${s.nameAr}). Documents: ${s.documents.join(', ')}. Demo fee AED ${s.demoFeeAed}, about ${s.demoDays} working days (demo values).`
    },
    send_route_to_phone: async (p) => {
      const r = routeLink(str(p.destination))
      if (!r) return 'Unknown destination. Ask the visitor to clarify.'
      onEvent?.({ type: 'route', data: r })
      return `Route to ${r.place.name} sent: ${r.place.description}`
    },
    build_setup_checklist: async (p) => {
      const c = buildSetupChecklist({ teamSize: Number(p.team_size), visas: Number(p.visas), residentInUae: Boolean(p.resident_in_uae) })
      onEvent?.({ type: 'checklist', data: c })
      return `${c.recommendation} Documents: ${c.documents.join('; ')}. A human adviser must confirm: ${c.confirmWithHuman.join('; ')}.`
    }
  }
}

function escalationHandlers ({ research, hold, onEvent }: DemoToolDeps): ToolHandlers {
  return {
    handover_to_human: async (p) => {
      onEvent?.({ type: 'handover', data: { reason: str(p.reason) } })
      return `Handover logged (${str(p.reason)}). Tell the caller a person will follow up, or they can call ${HANDOVER}.`
    },
    research_fact: async (p) => {
      const a = await withHold(() => research(str(p.question)), hold)
      onEvent?.({ type: 'research', data: a })
      return `${a.answer} (sources: ${a.sources.join(', ') || 'none'})`
    }
  }
}

/** Ready-made handlers for every tool used by the built-in presets. */
export function createDemoToolHandlers (deps: DemoToolDeps): ToolHandlers {
  return { ...bookingHandlers(deps), ...infoHandlers(deps), ...escalationHandlers(deps) }
}
