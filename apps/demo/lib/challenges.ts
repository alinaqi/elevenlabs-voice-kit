export interface Challenge {
  id: string
  code: string
  title: string
  where: string
  pitch: string
  mustHave: string[]
  trySaying: string[]
}

export const CHALLENGES: Challenge[] = [
  {
    id: 'navigator', code: '01', title: 'AI Voice Navigator', where: 'Humanoid robot A',
    pitch: 'A multilingual voice guide for the district. Ask where to go in your own language and it gets you there.',
    mustHave: ['Directions a person can follow', 'Clarifying question when vague', 'Language switch mid-conversation', 'Short answers first'],
    trySaying: ['عندي اجتماع في أوراسيا كابيتال الساعة الثالثة وأريد أن أصلي أولاً', 'Can you send the route to the mosque to my phone?', 'Which buses serve DSO?']
  },
  {
    id: 'soft-landing', code: '02', title: 'Soft Landing Guide', where: 'Software only · web or phone',
    pitch: "Company setup by conversation. Maps a founder's business to a DSO licence, builds the checklist, books a human.",
    mustHave: ['Questions before advice', 'Plain explanation of the route', 'Checklist built for this founder', 'Booked call with a human adviser'],
    trySaying: ["We're a two-person SaaS team in Lagos and need two visas.", 'What is the minimum capital?', 'Book me a call with an adviser on Thursday at 11.']
  },
  {
    id: 'hala', code: '03', title: 'HALA Concierge', where: 'Humanoid robot B',
    pitch: "A multilingual voice line into DSO's 340+ services: answers, status checks and appointment booking.",
    mustHave: ['Five+ services end to end', 'Name, date, contact for bookings', 'Spoken confirmation', 'Clean handover to a person'],
    trySaying: ['أريد تجديد تأشيرة عمل لموظف', 'How do I get an access card?', 'This fee is ridiculous, I want to talk to someone.']
  }
]

export const getChallenge = (id: string) => CHALLENGES.find((c) => c.id === id)
