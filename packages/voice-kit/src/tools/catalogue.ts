/** Demo DSO service catalogue. Fees and times are DEMO VALUES (the real ones sit behind DSO's member login). */
export interface DsoService {
  id: string
  name: string
  nameAr: string
  keywords: string[]
  documents: string[]
  demoFeeAed: number
  demoDays: number
}

export const DSO_SERVICES: DsoService[] = [
  { id: 'visa_new', name: 'New employment visa', nameAr: 'تأشيرة عمل جديدة', keywords: ['new', 'new visa', 'employment visa', 'hire', 'جديدة', 'تأشيرة'], documents: ['Passport copy', 'Photo', 'Offer letter', 'Establishment card'], demoFeeAed: 3500, demoDays: 5 },
  { id: 'visa_renewal', name: 'Employment visa renewal', nameAr: 'تجديد تأشيرة العمل', keywords: ['renew', 'renewal', 'employment visa', 'تجديد', 'تأشيرة'], documents: ['Passport copy', 'Current visa', 'Emirates ID', 'Medical fitness result'], demoFeeAed: 2800, demoDays: 4 },
  { id: 'visa_cancel', name: 'Employment visa cancellation', nameAr: 'إلغاء تأشيرة العمل', keywords: ['cancel', 'cancellation', 'employment visa', 'إلغاء', 'تأشيرة'], documents: ['Passport copy', 'Signed cancellation form'], demoFeeAed: 500, demoDays: 2 },
  { id: 'establishment_card', name: 'Establishment card', nameAr: 'بطاقة المنشأة', keywords: ['establishment card', 'immigration card', 'بطاقة المنشأة'], documents: ['Trade licence', 'Lease', 'Manager passport'], demoFeeAed: 1200, demoDays: 3 },
  { id: 'licence_renewal', name: 'Licence renewal', nameAr: 'تجديد الرخصة', keywords: ['licence renewal', 'license renewal', 'renew licence', 'renew license', 'الرخصة'], documents: ['Current licence', 'Valid lease', 'Audited accounts'], demoFeeAed: 15000, demoDays: 3 },
  { id: 'licence_amendment', name: 'Licence amendment', nameAr: 'تعديل الرخصة', keywords: ['amend licence', 'amendment', 'add activity', 'تعديل'], documents: ['Board resolution', 'Current licence'], demoFeeAed: 2000, demoDays: 4 },
  { id: 'noc', name: 'No objection certificate (NOC)', nameAr: 'شهادة عدم ممانعة', keywords: ['noc', 'no objection', 'عدم ممانعة'], documents: ['Request letter', 'Passport copy'], demoFeeAed: 300, demoDays: 1 },
  { id: 'access_card', name: 'Access / ID card', nameAr: 'بطاقة الدخول', keywords: ['access card', 'id card', 'badge', 'بطاقة دخول', 'بطاقة الدخول'], documents: ['Passport copy', 'Photo', 'Employment letter'], demoFeeAed: 150, demoDays: 1 },
  { id: 'leasing', name: 'Leasing enquiry', nameAr: 'استفسار التأجير', keywords: ['lease', 'leasing', 'office space', 'إيجار', 'تأجير'], documents: ['Trade licence', 'Passport copy'], demoFeeAed: 0, demoDays: 2 },
  { id: 'maintenance', name: 'Maintenance request', nameAr: 'طلب صيانة', keywords: ['maintenance', 'repair', 'broken', 'صيانة'], documents: ['Unit number', 'Photo of the issue'], demoFeeAed: 0, demoDays: 1 },
  { id: 'complaint', name: 'Complaint', nameAr: 'شكوى', keywords: ['complaint', 'complain', 'شكوى'], documents: ['Description of the issue'], demoFeeAed: 0, demoDays: 3 }
]

const tokens = (s: string) => s.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean)

/** Find the best-matching service for free text (English or Arabic), matching whole words only. */
export function findService (query: string): DsoService | undefined {
  const q = new Set(tokens(query))
  const hits = (k: string) => tokens(k).every((w) => q.has(w)) ? tokens(k).length : 0
  const score = (s: DsoService) => s.keywords.reduce((n, k) => n + hits(k), 0)
  const best = DSO_SERVICES.map((s) => ({ s, n: score(s) })).sort((a, b) => b.n - a.n)[0]
  return best && best.n > 0 ? best.s : undefined
}
