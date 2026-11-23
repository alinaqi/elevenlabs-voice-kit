/** Navigator places from public listings. Indoor details (entrances, floors, lifts) are DEMO data. */
export interface Place {
  name: string
  aliases: string[]
  description: string
  hours?: string
}

export const DSO_PLACES: Place[] = [
  { name: 'Dtec TechnoHub 1', aliases: ['dtec', 'technohub'], description: 'Dtec main campus. Oraseya Capital is on the first floor.', hours: '07:30–15:00, members 24/7' },
  { name: 'Dtec A5, Dubai Digital Park', aliases: ['a5', 'digital park'], description: 'Second Dtec campus, building A5.' },
  { name: 'DSO Masjid', aliases: ['masjid', 'mosque', 'pray', 'مسجد'], description: 'In the Techno Point building, free parking.' },
  { name: 'Al Waha Masjid', aliases: ['al waha'], description: 'Mosque open 04:00–23:00.', hours: '04:00–23:00' },
  { name: 'Silicon Central Mall', aliases: ['mall', 'silicon central', 'friends avenue', 'emirates nbd'], description: 'Friends Avenue Cafe ground floor, Emirates NBD first floor.', hours: '08:00–00:00' },
  { name: 'Union Coop Silicon Oasis', aliases: ['union coop', 'supermarket'], description: 'Open 24 hours.', hours: '24h' },
  { name: 'Life Pharmacy Palace Towers', aliases: ['pharmacy', 'palace towers'], description: 'Open 24 hours.', hours: '24h' },
  { name: 'Burjeel Medical Center DSO', aliases: ['burjeel', 'clinic', 'doctor'], description: 'Clinic, daily 07:00–23:00.', hours: '07:00–23:00' }
]

export function findPlace (query: string): Place | undefined {
  const q = query.toLowerCase()
  return DSO_PLACES.find((p) => p.name.toLowerCase() === q) ??
    DSO_PLACES.find((p) => q.includes(p.name.toLowerCase()) || p.aliases.some((a) => q.includes(a)))
}

/** A Google Maps link the visitor can open on their phone. */
export function routeLink (destination: string): { place: Place, url: string } | undefined {
  const place = findPlace(destination)
  if (!place) return undefined
  const query = encodeURIComponent(`${place.name}, Dubai Silicon Oasis`)
  return { place, url: `https://www.google.com/maps/search/?api=1&query=${query}` }
}
