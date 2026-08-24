import { useState, useEffect, useMemo, useRef } from 'react'
import { NAV } from '../lib/nav.js'
import { useAuth } from '../AuthContext.jsx'
import { Command, LogOut, ChevronRight, Anchor } from 'lucide-react'

export default function Shell({ active, onSelect, children }) {
  const { user, logout } = useAuth()
  const [paletteOpen, setPaletteOpen] = useState(false)

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPaletteOpen(true) }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const activeItem = NAV.flatMap(g => g.items).find(i => i.id === active)

  return (
    <div className="min-h-screen flex bg-paper">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 bg-ink-950 text-white flex flex-col">
        <div className="flex items-center gap-2.5 px-5 h-16 border-b border-white/10">
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center shrink-0"><Anchor size={16} className="text-white" /></div>
          <div className="leading-tight">
            <p className="font-display font-bold text-[15px]">Helm</p>
            <p className="text-[10px] text-white/40 uppercase tracking-wider">FACE Prep Operations</p>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
          {NAV.map((g, gi) => (
            <div key={gi}>
              {g.label && <p className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-white/30 mb-1.5">{g.label}</p>}
              <div className="space-y-0.5">
                {g.items.map(item => (
                  <button key={item.id} onClick={() => onSelect(item.id)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13.5px] font-medium transition-colors ${active === item.id ? 'bg-brand-500 text-white' : 'text-white/65 hover:bg-white/5 hover:text-white'}`}>
                    <item.icon size={16} className="shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10">
          <button onClick={() => setPaletteOpen(true)} className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-[12.5px] text-white/50 hover:bg-white/5 hover:text-white/80 transition-colors">
            <span className="flex items-center gap-2"><Command size={13} /> Jump to…</span>
            <kbd className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded">⌘K</kbd>
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-line bg-white/80 backdrop-blur px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-sm text-ink-400">
            <span>Helm</span><ChevronRight size={13} />
            <span className="font-semibold text-ink-900">{activeItem?.label || 'Command Center'}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right leading-tight hidden sm:block">
              <p className="text-[13px] font-semibold text-ink-900">{user?.name}</p>
              <p className="text-[11px] text-ink-400">{user?.role}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-brand-500 text-white flex items-center justify-center text-[12px] font-bold">{(user?.name || '?')[0]}</div>
            <button onClick={logout} title="Sign out" className="text-ink-400 hover:text-brand-600 p-1.5"><LogOut size={16} /></button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>

      {paletteOpen && <CommandPalette onClose={() => setPaletteOpen(false)} onSelect={id => { onSelect(id); setPaletteOpen(false) }} />}
    </div>
  )
}

function CommandPalette({ onClose, onSelect }) {
  const [q, setQ] = useState('')
  const inputRef = useRef(null)
  useEffect(() => { inputRef.current?.focus() }, [])
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const items = useMemo(() => NAV.flatMap(g => g.items), [])
  const filtered = useMemo(() => {
    const qq = q.toLowerCase()
    return items.filter(i => i.label.toLowerCase().includes(qq))
  }, [items, q])

  return (
    <div className="fixed inset-0 z-[60] bg-ink-950/60 backdrop-blur-sm flex items-start justify-center pt-[15vh] px-4" onClick={onClose}>
      <div className="card w-full max-w-lg shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-2 px-4 py-3 border-b border-line">
          <Command size={16} className="text-ink-400" />
          <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)} placeholder="Jump to a module…" className="flex-1 outline-none text-sm bg-transparent" />
          <kbd className="text-[10px] text-ink-400 border border-line rounded px-1.5 py-0.5">esc</kbd>
        </div>
        <div className="max-h-72 overflow-y-auto py-1.5">
          {filtered.map(i => (
            <button key={i.id} onClick={() => onSelect(i.id)} className="w-full flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-paper-dim text-left">
              <i.icon size={15} className="text-ink-400" /> {i.label}
            </button>
          ))}
          {!filtered.length && <p className="px-4 py-6 text-sm text-ink-400 text-center">No modules match "{q}"</p>}
        </div>
      </div>
    </div>
  )
}
