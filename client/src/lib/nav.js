import {
  LayoutDashboard, Building2, Users2, Layers, HelpCircle, ClipboardList,
  SlidersHorizontal, GraduationCap, Rocket, Activity, Tags, ScrollText,
} from 'lucide-react'

export const NAV = [
  { label: '', items: [{ id: 'dashboard', label: 'Command Center', icon: LayoutDashboard }] },
  { label: 'Organization', items: [
    { id: 'institutions', label: 'Institutions', icon: Building2 },
    { id: 'batches', label: 'Batches', icon: Layers },
    { id: 'users', label: 'Users', icon: Users2 },
  ] },
  { label: 'Assessment', items: [
    { id: 'questions', label: 'Question Bank', icon: HelpCircle },
    { id: 'assessments', label: 'Assessments', icon: ClipboardList },
  ] },
  { label: 'LMS', items: [
    { id: 'courses', label: 'Courses', icon: GraduationCap },
  ] },
  { label: 'Delivery', items: [
    { id: 'delivery', label: 'Administration', icon: Rocket },
    { id: 'attempts', label: 'Attempts', icon: Activity },
  ] },
  { label: 'System', items: [
    { id: 'tags', label: 'Tags', icon: Tags },
    { id: 'logs', label: 'Logs', icon: ScrollText },
  ] },
]
