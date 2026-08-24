import { useState, useMemo } from 'react'
import { useCollection } from '../lib/useCollection.js'
import { SidePanel, Field, Spinner, Empty, Pill, SearchSelect, btnPrimary, btnGhost, inputCls } from '../components/ui.jsx'
import { Rocket, Plus, Trash2, CalendarClock, Users2 } from 'lucide-react'

const STATUS_TONE = { Scheduled: 'sky', Live: 'brand', Completed: 'emerald' }

export default function Delivery() {
  const { rows, loading, create, remove } = useCollection('administrations')
  const { rows: configured } = useCollection('configured_assessments')
  const { rows: assessments } = useCollection('assessments')
  const { rows: batches } = useCollection('batches')
  const { rows: users } = useCollection('users')
  const [creating, setCreating] = useState(false)
  const [filter, setFilter] = useState('')

  const titleFor = (r) => {
    const cfg = configured.find(c => c.id === r.targetId)
    const a = assessments.find(x => x.id === cfg?.assessmentId)
    return a?.title || r.targetId
  }
  const reachOf = (r) => users.filter(u => u.role === 'Student' && (u.batchIds || []).some(b => (r.audienceIds || []).includes(b))).length

  const filtered = useMemo(() => rows.filter(r => !filter || r.status === filter).sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)), [rows, filter])
  const counts = useMemo(() => ({ Scheduled: rows.filter(r => r.status === 'Scheduled').length, Live: rows.filter(r => r.status === 'Live').length, Completed: rows.filter(r => r.status === 'Completed').length }), [rows])

  if (loading) return <Spinner label="Loading administrations…" />

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold text-ink-900">Administration</h1>
          <p className="text-sm text-ink-400">Publish and track deliveries — a status board, not just a list.</p>
        </div>
        <button className={btnPrimary} onClick={() => setCreating(true)}><Plus size={15} /> Publish</button>
      </div>

      <div className="flex gap-2">
        {['Scheduled', 'Live', 'Completed'].map(s => (
          <button key={s} onClick={() => setFilter(f => (f === s ? '' : s))} className={`card px-4 py-2.5 flex-1 text-left transition-all ${filter === s ? 'border-brand-300 ring-1 ring-brand-200' : ''}`}>
            <p className="text-xs font-semibold text-ink-400 uppercase">{s}</p>
            <p className="font-display text-xl font-bold text-ink-900">{counts[s]}</p>
          </button>
        ))}
      </div>

      {!filtered.length ? <Empty icon={Rocket} title="Nothing here" hint="Publish a configured assessment to a batch." /> : (
        <div className="card divide-y divide-line">
          {filtered.map(r => (
            <div key={r.id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-ink-900 truncate">{titleFor(r)}</p>
                <p className="text-xs text-ink-400 flex items-center gap-3 mt-0.5">
                  <span className="flex items-center gap-1"><Users2 size={11} /> {reachOf(r)} students</span>
                  <span className="flex items-center gap-1"><CalendarClock size={11} /> {new Date(r.publishedAt).toLocaleDateString()}</span>
                </p>
              </div>
              <Pill tone={STATUS_TONE[r.status]}>{r.status}</Pill>
              <button onClick={() => confirm('Remove this administration?') && remove(r.id)} className="text-ink-300 hover:text-brand-600 p-1"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      )}

      {creating && (
        <PublishForm configured={configured} assessments={assessments} batches={batches} onClose={() => setCreating(false)}
          onSave={async body => { await create(body); setCreating(false) }} />
      )}
    </div>
  )
}

function PublishForm({ configured, assessments, batches, onClose, onSave }) {
  const [targetId, setTargetId] = useState('')
  const [audienceIds, setAudienceIds] = useState([])
  const [when, setWhen] = useState('now')
  const [err, setErr] = useState('')
  const options = configured.map(c => { const a = assessments.find(x => x.id === c.assessmentId); return { id: c.id, label: a ? `${a.title} (${c.id})` : c.id } })
  const toggleBatch = (id) => setAudienceIds(a => (a.includes(id) ? a.filter(x => x !== id) : [...a, id]))
  const save = () => onSave({
    type: 'Configured Assessment', targetId, audienceType: 'Batch', audienceIds,
    status: when === 'now' ? 'Live' : 'Scheduled', publishedAt: new Date().toISOString(),
  }).catch(e => setErr(e.message))
  return (
    <SidePanel title="Publish a delivery" subtitle="administrations/(auto)" onClose={onClose}
      footer={<><button className={btnGhost} onClick={onClose}>Cancel</button><button className={btnPrimary} disabled={!targetId || !audienceIds.length} onClick={save}>Publish</button></>}>
      <Field label="Target" required hint="The configured assessment this delivers.">
        <SearchSelect options={options} value={targetId} onChange={setTargetId} allowClear={false} />
      </Field>
      <Field label="Audience" required hint="Pick one or more batches.">
        <div className="max-h-56 overflow-y-auto rounded-lg border border-line p-1.5 space-y-0.5">
          {batches.map(b => (
            <label key={b.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-paper-dim cursor-pointer text-sm">
              <input type="checkbox" checked={audienceIds.includes(b.id)} onChange={() => toggleBatch(b.id)} /> {b.name} <span className="text-ink-400 text-xs">({b.year})</span>
            </label>
          ))}
        </div>
      </Field>
      <Field label="When">
        <div className="flex gap-2">
          <button type="button" onClick={() => setWhen('now')} className={`btn flex-1 justify-center ${when === 'now' ? 'btn-brand' : 'btn-ghost'}`}>Publish now</button>
          <button type="button" onClick={() => setWhen('later')} className={`btn flex-1 justify-center ${when === 'later' ? 'btn-brand' : 'btn-ghost'}`}>Schedule</button>
        </div>
      </Field>
      {err && <p className="text-sm text-brand-600">{err}</p>}
    </SidePanel>
  )
}
