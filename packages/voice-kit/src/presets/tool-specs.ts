import { defineClientTool } from '../tools/define.js'

const s = (description: string, extra: { enum?: string[], optional?: boolean } = {}) =>
  ({ type: 'string' as const, description, ...extra })

export const handoverTool = defineClientTool({
  name: 'handover_to_human',
  description: 'Hand the conversation to a human: out of scope, disputes, legal/tax questions, conflicting facts, or the user asks for a person.',
  params: { reason: s('Short reason for the handover') }
})

export const researchTool = defineClientTool({
  name: 'research_fact',
  description: 'Look up a fact that is not in your knowledge (DSO rules, prices, places, agenda). May take a few seconds; the caller hears hold music.',
  params: { question: s('The precise factual question, in English') },
  timeoutSecs: 30,
  speakFirst: true
})

export const bookingTools = [
  defineClientTool({
    name: 'book_appointment',
    description: 'Book a slot in the DSO calendar. Collect name, contact, service, date and time first.',
    params: {
      name: s('Full name'), contact: s('Phone or email'), service: s('Service name'),
      date: s('Date as YYYY-MM-DD'), time: s('Time as HH:MM, on the hour or half hour, 08:00-15:00')
    }
  }),
  defineClientTool({
    name: 'reschedule_appointment',
    description: 'Move an existing booking to a new date and time.',
    params: { ref: s('Booking reference like DSO-1001'), date: s('New date YYYY-MM-DD'), time: s('New time HH:MM') }
  }),
  defineClientTool({
    name: 'cancel_appointment',
    description: 'Cancel an existing booking.',
    params: { ref: s('Booking reference like DSO-1001') }
  })
]

export const findServiceTool = defineClientTool({
  name: 'find_service',
  description: 'Identify which DSO service applies and its required documents.',
  params: { query: s('What the caller needs, in their words') }
})

export const routeTool = defineClientTool({
  name: 'send_route_to_phone',
  description: 'Send walking/driving directions to the visitor\'s phone.',
  params: { destination: s('Place name, e.g. DSO Masjid') }
})

export const checklistTool = defineClientTool({
  name: 'build_setup_checklist',
  description: 'Build a company setup recommendation and document checklist for a founder.',
  params: {
    team_size: { type: 'number', description: 'Number of founders/employees' },
    visas: { type: 'number', description: 'Visas needed' },
    resident_in_uae: { type: 'boolean', description: 'Whether any founder already lives in the UAE' }
  }
})
