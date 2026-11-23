/** Soft Landing helpers based on public DSO facts (Judge & Mentor Guide, Nov 2026). */
export interface FounderProfile {
  teamSize: number
  visas: number
  residentInUae: boolean
  sector?: string
}

export interface SetupChecklist {
  recommendation: string
  documents: string[]
  steps: string[]
  confirmWithHuman: string[]
}

const BASE_DOCUMENTS = [
  'Letter of intent',
  'Passport copies for all shareholders',
  'Bank statement or bank reference letter',
  'Application form',
  'Business plan',
  'UBO declaration'
]

const STEPS = [
  'Apply on the DSOA portal',
  'Pay fees and upload documents',
  'E-lease and bank share capital letter',
  'Pre-approval (activity and security checks)',
  'Digital lease',
  'E-licence issued'
]

function workspaceFor (visas: number): string {
  if (visas <= 2) return 'a Dtec flexi desk (up to 2 visas, agency quote about AED 18,000/yr)'
  if (visas <= 3) return 'a fixed desk (up to 3 visas, agency quote about AED 24,000/yr)'
  return 'a furnished office (2 visas per desk, 12–50 m², agency quote from AED 47,820/yr)'
}

export function buildSetupChecklist (profile: FounderProfile): SetupChecklist {
  const documents = profile.residentInUae ? [...BASE_DOCUMENTS, 'NOC from current UAE sponsor'] : BASE_DOCUMENTS
  return {
    recommendation: `New company as an FZCO with ${workspaceFor(profile.visas)}.`,
    documents,
    steps: STEPS,
    confirmWithHuman: [
      'Minimum share capital (DSO page says AED 100,000; 2023 DIEZ rules reportedly AED 1)',
      'Whether setup can be completed fully remotely',
      'Current workspace prices (agency quotes, not DSO prices)',
      'Timeline: DSO states 7 days + 2 days; agencies quote 2–4 weeks'
    ]
  }
}
