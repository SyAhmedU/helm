import { useState, useMemo } from 'react'
import { useCollection } from '../lib/useCollection.js'
import { Spinner, Empty, Pill, inputCls } from '../components/ui.jsx'
import { Activity, Search, ShieldAlert } from 'lucide-react'

const STATUS_TONE = { Submitted: 'emerald', 'Hard Submitted': 'brand', Extended: 'sky' }

const PER_PAGE = 25

export default function Attempts() {
  const { rows, loading } = useCollection('attempts')
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(0)

  const withPct = useMemo(() => rows.map(a => ({ ...a, pct: a.totalScore ? Math.round((a.obtainedScore / a.totalScore) * 100) : 0 })), [rows])
  const dist = useMemo(() => {
    const b = [0, 0, 0, 0, 0]
    for (const a of withPct) b[Math.min(4, Math.floor(a.pct / 20))]++
    return b
  }, [withPct])
  const maxDist = Math.max(1, ...dist)
  const statusCounts = useMemo(() => {
    const m = {}
    for (const a of rows) m[a.status] = (m[a.status] || 0) + 1
    return m
  }, [rows])
  const violations = rows.filter(a => a.status === 'Hard Submitted')

  const filtered = useMemo(() => withPct.filter(a =>
    (!q || a.userName.toLowerCase().includes(q.toLowerCase()) || a.userEmail.toLowerCase().includes(q.toLowerCase())) &&
    (!status || a.status === status)
  ).sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt)), [withPct, q, status])
  const pageCount = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const pageSafe = Math.min(page, pageCount - 1)
  const paged = filtered.slice(pageSafe * PER_PAGE, pageSafe * PER_PAGE + PER_PAGE)

  if (loading) return <Spinner label="Loading attempts…" />

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl font-bold text-ink-900">Attempts</h1>
        <p className="text-sm text-ink-400">{rows.length} recorded · analytics first, raw log below — not the other way round.</p>
      </div>

      <div className="grid lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 card p-5">
          <h3 className="font-display font-semibold text-ink-900 mb-4">Score distribution</h3>
          <div className="flex items-end gap-3 h-32">
            {dist.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1.5">
                <span className="text-xs font-semibold text-ink-600">{v}</span>
                <div className="w-full rounded-t-md bg-brand-400" style={{ height: `${Math.max(v ? 4 : 0, (v / maxDist) * 76)}px` }} />
                <span className="text-[10px] text-ink-400">{['0–20', '21–40', '41–60', '61–80', '81–100'][i]}%</span>
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-2 card p-5">
          <h3 className="font-display font-semibold text-ink-900 mb-3">By status</h3>
          <div className="space-y-2">
            {Object.entries(statusCounts).map(([s, n]) => (
              <div key={s} className="flex items-center justify-between text-sm">
                <Pill tone={STATUS_TONE[s]}>{s}</Pill>
                <span className="font-semibold text-ink-900">{n}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {violations.length > 0 && (
        <div className="card p-5 border-brand-100">
          <h3 className="font-display font-semibold text-ink-900 mb-1 flex items-center gap-2"><ShieldAlert size={16} className="text-brand-500" /> Integrity violations</h3>
          <p className="text-xs text-ink-400 mb-3">Attempts hard-submitted after a proctoring violation (tab switch / reload limit).</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {violations.slice(0, 12).map(a => (
              <div key={a.id} className="flex items-center justify-between text-xs bg-brand-50 rounded-lg px-3 py-2">
                <span className="text-ink-800 font-medium truncate">{a.userName}</span>
                <span className="text-ink-400 font-mono">{a.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <div className="relative max-w-xs flex-1 min-w-[12rem]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input className={`${inputCls} pl-8`} placeholder="Search student…" value={q} onChange={e => { setQ(e.target.value); setPage(0) }} />
        </div>
        <select className={`${inputCls} max-w-[10rem]`} value={status} onChange={e => { setStatus(e.target.value); setPage(0) }}>
          <option value="">All statuses</option>
          {Object.keys(statusCounts).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {!filtered.length ? <Empty icon={Activity} title="No attempts match" /> : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-paper-dim text-xs text-ink-400"><tr>
                <th className="text-left px-4 py-2.5 font-semibold">Student</th>
                <th className="text-left px-4 py-2.5 font-semibold">Status</th>
                <th className="text-left px-4 py-2.5 font-semibold">Score</th>
                <th className="text-left px-4 py-2.5 font-semibold">Date</th>
              </tr></thead>
              <tbody>
                {paged.map(a => (
                  <tr key={a.id} className="border-t border-line hover:bg-paper-dim/60">
                    <td className="px-4 py-2.5">
                      <p className="font-medium text-ink-900">{a.userName}</p>
                      <p className="text-xs text-ink-400">{a.userEmail}</p>
                    </td>
                    <td className="px-4 py-2.5"><Pill tone={STATUS_TONE[a.status]}>{a.status}</Pill></td>
                    <td className="px-4 py-2.5 text-ink-900 font-semibold">{a.obtainedScore}/{a.totalScore} <span className="text-ink-400 font-normal">({a.pct}%)</span></td>
                    <td className="px-4 py-2.5 text-ink-400">{new Date(a.startedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-line text-xs text-ink-400">
            <span>{filtered.length ? `${pageSafe * PER_PAGE + 1}–${Math.min((pageSafe + 1) * PER_PAGE, filtered.length)} of ${filtered.length}` : '0 results'}</span>
            <div className="flex items-center gap-2">
              <button disabled={pageSafe === 0} onClick={() => setPage(p => p - 1)} className="disabled:opacity-30 font-medium hover:text-ink-900">◀ Prev</button>
              <span>Page {pageSafe + 1} of {pageCount}</span>
              <button disabled={pageSafe >= pageCount - 1} onClick={() => setPage(p => p + 1)} className="disabled:opacity-30 font-medium hover:text-ink-900">Next ▶</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
