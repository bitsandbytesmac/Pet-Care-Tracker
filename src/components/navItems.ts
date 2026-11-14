import { CalendarCheck, NotebookPen, PawPrint, Pill, Stethoscope, type LucideIcon } from 'lucide-react'

export interface NavItem {
  to: string
  /** Label in the desktop sidebar */
  label: string
  /** Shorter label in the phone tab bar */
  shortLabel: string
  icon: LucideIcon
  isActive: (pathname: string) => boolean
}

export const navItems: NavItem[] = [
  { to: '/', label: 'Today', shortLabel: 'Today', icon: CalendarCheck, isActive: (p) => p === '/' },
  { to: '/pets', label: 'Pets', shortLabel: 'Pets', icon: PawPrint, isActive: (p) => p.startsWith('/pets') },
  {
    to: '/medications',
    label: 'Medications',
    shortLabel: 'Meds',
    icon: Pill,
    isActive: (p) => p.startsWith('/medications'),
  },
  { to: '/visits', label: 'Vet visits', shortLabel: 'Visits', icon: Stethoscope, isActive: (p) => p.startsWith('/visits') },
  { to: '/log', label: 'Symptom log', shortLabel: 'Log', icon: NotebookPen, isActive: (p) => p.startsWith('/log') },
]
