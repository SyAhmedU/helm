import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '../AuthContext.jsx'
import { Spinner, Empty, inputCls } from '../components/ui.jsx'
import { ScrollText, Search } from 'lucide-react'

export default function Logs() {
  const { authFetch } = useAuth()
  const [rows, setRows] = useState(null)
  const [forbidden, setForbidden] = useState(false)
  const [q, setQ] = useState('')
  useEffect(() => {
    authFetch('/logs').then(r => {
      if (r.status === 403) { setForbidden(true); return [] }
      return r.json()
    }).then(d => setRows(d || []))
  }, [authFetch])

  const filtered = useMemo(() => (rows || []).filter(l => !q || l.event.toLowerCase().includes(q.toLowerCase())), [rows, q])

  if (forbidden) return <Empty icon={ScrollText} title="Super Admin only" hint="The audit trail is restricted to Super Admin accounts." />
  if (!rows) return <Spinner label="Loading logs…" />

  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h1 className="font-display text-xl font-bold text-ink-900">Logs</h1>
        <p className="text-sm text-ink-400">Most recent {rows.length} events, newest first.</p>
      </div>
      <div className="relative max-w-xs">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
        <input className={`${inputCls} pl-8`} placeholder="Filter by event…" value={q} onChange={e => setQ(e.target.value)} />
      </div>
      {!filtered.length ? <Empty icon={ScrollText} title="No logs yet" /> : (
        <div className="card divide-y divide-line max-h-[70vh] overflow-y-auto">
          {filtered.map(l => (
            <div key={l.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
              <span className="font-mono text-ink-800">{l.event}</span>
              <span className="text-xs text-ink-400">{new Date(l.at).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
