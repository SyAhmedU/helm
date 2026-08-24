import { useState, useMemo, useRef, useEffect } from 'react'
import { X, Search, ChevronDown, Loader2, Inbox } from 'lucide-react'
import { createPortal } from 'react-dom'

export function Spinner({ label }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-ink-400">
      <Loader2 size={18} className="animate-spin" /> {label && <span className="text-sm">{label}</span>}
    </div>
  )
}

export function Empty({ icon: Icon = Inbox, title, hint }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      <div className="w-11 h-11 rounded-full bg-brand-50 flex items-center justify-center text-brand-500 mb-1"><Icon size={20} /></div>
      <p className="font-semibold text-ink-900">{title}</p>
      {hint && <p className="text-sm text-ink-400 max-w-sm">{hint}</p>}
    </div>
  )
}

export function Field({ label, hint, required, children }) {
  return (
    <div className="mb-3.5">
      <label className="label">{label}{required && <span className="text-brand-500"> *</span>}</label>
      {children}
      {hint && <p className="text-xs text-ink-400 mt-1">{hint}</p>}
    </div>
  )
}

export function Modal({ title, subtitle, onClose, footer, wide, children }) {
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/50 backdrop-blur-[2px] p-4" onClick={onClose}>
      <div className={`card w-full ${wide ? 'max-w-2xl' : 'max-w-md'} max-h-[85vh] flex flex-col shadow-2xl`} onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between px-5 py-4 border-b border-line shrink-0">
          <div>
            <h3 className="font-display font-semibold text-ink-900">{title}</h3>
            {subtitle && <p className="text-xs text-ink-400 font-mono mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-900 p-1 -mr-1 -mt-1"><X size={18} /></button>
        </div>
        <div className="px-5 py-4 overflow-y-auto">{children}</div>
        {footer && <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-line shrink-0">{footer}</div>}
      </div>
    </div>,
    document.body
  )
}

// A side-panel — mirrors the real portal's #new_side create/edit drawer, but
// as an actually pleasant slide-in rather than a cramped fixed-width form.
export function SidePanel({ title, subtitle, onClose, footer, children }) {
  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end bg-ink-950/40 backdrop-blur-[1px]" onClick={onClose}>
      <div className="w-full max-w-md bg-white h-full flex flex-col shadow-2xl animate-[slideIn_.18s_ease-out]" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between px-5 py-4 border-b border-line shrink-0">
          <div>
            <h3 className="font-display font-semibold text-ink-900">{title}</h3>
            {subtitle && <p className="text-xs text-ink-400 font-mono mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-900 p-1 -mr-1 -mt-1"><X size={18} /></button>
        </div>
        <div className="px-5 py-4 overflow-y-auto flex-1">{children}</div>
        {footer && <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-line shrink-0">{footer}</div>}
      </div>
      <style>{'@keyframes slideIn { from { transform: translateX(24px); opacity: 0 } to { transform: translateX(0); opacity: 1 } }'}</style>
    </div>,
    document.body
  )
}

export function SearchSelect({ options, value, onChange, placeholder = 'Select…', allowClear = true }) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const ref = useRef(null)
  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])
  const filtered = useMemo(() => options.filter(o => o.label.toLowerCase().includes(q.toLowerCase())), [options, q])
  const current = options.find(o => o.id === value)
  return (
    <div className="relative" ref={ref}>
      <button type="button" className="input flex items-center justify-between text-left" onClick={() => setOpen(o => !o)}>
        <span className={current ? '' : 'text-ink-400'}>{current ? current.label : placeholder}</span>
        <ChevronDown size={14} className="text-ink-400 shrink-0 ml-2" />
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-full card shadow-lg overflow-hidden">
          <div className="p-2 border-b border-line">
            <div className="flex items-center gap-1.5 px-2 py-1.5 bg-paper-dim rounded-lg">
              <Search size={13} className="text-ink-400" />
              <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search…" className="bg-transparent outline-none text-sm flex-1" />
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            {allowClear && <button type="button" className="w-full text-left px-3 py-1.5 text-sm text-ink-400 hover:bg-paper-dim" onClick={() => { onChange(''); setOpen(false) }}>— None —</button>}
            {filtered.map(o => (
              <button key={o.id} type="button" className={`w-full text-left px-3 py-1.5 text-sm hover:bg-paper-dim ${o.id === value ? 'font-semibold text-brand-600' : ''}`} onClick={() => { onChange(o.id); setOpen(false); setQ('') }}>{o.label}</button>
            ))}
            {!filtered.length && <p className="px-3 py-2 text-sm text-ink-400">No matches</p>}
          </div>
        </div>
      )}
    </div>
  )
}

export function StatCard({ icon: Icon, label, value, sub, tone = 'ink', onClick }) {
  const toneCls = { ink: 'text-ink-900', brand: 'text-brand-600', amber: 'text-amber-signal', emerald: 'text-emerald-signal' }[tone]
  return (
    <button onClick={onClick} disabled={!onClick} className={`card p-4 text-left flex flex-col gap-2 ${onClick ? 'hover:border-brand-200 hover:shadow-sm transition-all cursor-pointer' : ''}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-ink-400 uppercase tracking-wide">{label}</span>
        {Icon && <Icon size={15} className="text-ink-300" />}
      </div>
      <span className={`font-display text-2xl font-bold ${toneCls}`}>{value}</span>
      {sub && <span className="text-xs text-ink-400">{sub}</span>}
    </button>
  )
}

export function Pill({ tone = 'slate', children }) {
  const map = {
    slate: 'bg-paper-dim text-ink-600', brand: 'bg-brand-50 text-brand-600',
    amber: 'bg-amber-50 text-amber-700', emerald: 'bg-emerald-50 text-emerald-700', sky: 'bg-sky-50 text-sky-700',
  }
  return <span className={`chip ${map[tone] || map.slate}`}>{children}</span>
}

export const inputCls = 'input'
export const btnPrimary = 'btn btn-brand'
export const btnGhost = 'btn btn-ghost'
export const btnDanger = 'btn btn-danger'
