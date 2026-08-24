import { useState, useMemo } from 'react'
import { useCollection } from '../lib/useCollection.js'
import { SidePanel, Field, Spinner, SearchSelect, Pill, btnPrimary, btnGhost, inputCls } from '../components/ui.jsx'
import { Layers, Plus, Pencil, Trash2, ChevronRight, ChevronDown, Users2, AlertCircle, Search, GitBranch } from 'lucide-react'

export default function Batches() {
  const { rows: batches, loading: bLoading, create, update, remove } = useCollection('batches')
  const { rows: institutions, loading: iLoading } = useCollection('institutions')
  const { rows: users, loading: uLoading } = useCollection('users')
  const [instId, setInstId] = useState('')
  const [editing, setEditing] = useState(null)
  const [addParent, setAddParent] = useState(null) // batch → "add subgroup of this" prefill
  const [q, setQ] = useState('')

  const loading = bLoading || iLoading || uLoading
  const activeInstId = instId || institutions[0]?.id || ''

  const studentCount = useMemo(() => {
    const m = {}
    for (const u of users) if (u.role === 'Student') for (const b of u.batchIds || []) m[b] = (m[b] || 0) + 1
    return m
  }, [users])

  const instBatches = useMemo(() => batches.filter(b => b.institutionId === activeInstId), [batches, activeInstId])
  const roots = useMemo(() => instBatches.filter(b => !b.parentBatchId && (!q || b.name.toLowerCase().includes(q.toLowerCase()))), [instBatches, q])
  const childrenOf = (id) => instBatches.filter(b => b.parentBatchId === id)

  if (loading) return <Spinner label="Loading batches…" />

  return (
    <div className="grid lg:grid-cols-[240px_1fr] gap-5">
      {/* Institution rail */}
      <div className="card p-2 h-fit lg:sticky lg:top-6">
        <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide px-2 py-1.5">Institutions</p>
        <div className="space-y-0.5">
          {institutions.map(inst => {
            const n = batches.filter(b => b.institutionId === inst.id).length
            const active = inst.id === activeInstId
            return (
              <button key={inst.id} onClick={() => setInstId(inst.id)} className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-sm text-left transition-colors ${active ? 'bg-brand-50 text-brand-700 font-semibold' : 'text-ink-700 hover:bg-paper-dim'}`}>
                <span className="truncate">{inst.name}</span>
                <span className={`text-[11px] shrink-0 ml-2 ${active ? 'text-brand-500' : 'text-ink-400'}`}>{n}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Batch tree */}
      <div className="space-y-4 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-xl font-bold text-ink-900">Batches</h1>
            <p className="text-sm text-ink-400">{institutions.find(i => i.id === activeInstId)?.name} · {instBatches.length} batches</p>
          </div>
          <button className={btnPrimary} onClick={() => setEditing({ institutionId: activeInstId })}><Plus size={15} /> Add batch</button>
        </div>
        <div className="relative max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input className={`${inputCls} pl-8`} placeholder="Search batches…" value={q} onChange={e => setQ(e.target.value)} />
        </div>

        {!roots.length ? (
          <div className="card p-10 text-center text-sm text-ink-400">No batches for this institution yet.</div>
        ) : (
          <div className="card divide-y divide-line overflow-hidden">
            {roots.map(b => (
              <BatchRow key={b.id} batch={b} depth={0} childrenOf={childrenOf} studentCount={studentCount}
                onEdit={setEditing} onAddSub={setAddParent} onDelete={remove} users={users} />
            ))}
          </div>
        )}
      </div>

      {editing && (
        <BatchForm row={editing} institutions={institutions} batches={batches} onClose={() => setEditing(null)}
          onSave={async body => { editing.id ? await update(editing.id, body) : await create(body); setEditing(null) }} />
      )}
      {addParent && (
        <BatchForm row={{ institutionId: addParent.institutionId, parentBatchId: addParent.id, year: addParent.year }} institutions={institutions} batches={batches} onClose={() => setAddParent(null)}
          onSave={async body => { await create(body); setAddParent(null) }} />
      )}
    </div>
  )
}

function BatchRow({ batch, depth, childrenOf, studentCount, onEdit, onAddSub, onDelete, users }) {
  const [open, setOpen] = useState(depth === 0)
  const [showStudents, setShowStudents] = useState(false)
  const kids = childrenOf(batch.id)
  const count = studentCount[batch.id] || 0
  const empty = !kids.length && count === 0

  return (
    <div>
      <div className="flex items-center gap-2 px-4 py-2.5 hover:bg-paper-dim/60" style={{ paddingLeft: 16 + depth * 22 }}>
        {kids.length ? (
          <button onClick={() => setOpen(o => !o)} className="text-ink-400 shrink-0">{open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}</button>
        ) : <span className="w-[15px] shrink-0" />}
        <Layers size={14} className={depth ? 'text-ink-300' : 'text-brand-500'} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-ink-900 truncate">{batch.name}</span>
            <span className="text-xs text-ink-400">{batch.year}</span>
            {empty && <span title="No students enrolled"><AlertCircle size={13} className="text-amber-signal" /></span>}
          </div>
        </div>
        <button onClick={() => setShowStudents(s => !s)} className="flex items-center gap-1 text-xs font-medium text-ink-600 hover:text-brand-600 shrink-0">
          <Users2 size={13} /> {count}
        </button>
        {kids.length > 0 && <span className="flex items-center gap-1 text-xs text-ink-400 shrink-0"><GitBranch size={12} /> {kids.length}</span>}
        <div className="flex items-center gap-1 shrink-0 ml-1">
          <button onClick={() => onAddSub(batch)} title="Add subgroup" className="text-ink-400 hover:text-ink-900 p-1"><Plus size={14} /></button>
          <button onClick={() => onEdit(batch)} title="Edit" className="text-ink-400 hover:text-ink-900 p-1"><Pencil size={14} /></button>
          <button onClick={() => confirm(`Remove ${batch.name}? Subgroups will be un-linked, not deleted.`) && onDelete(batch.id)} title="Delete" className="text-ink-400 hover:text-brand-600 p-1"><Trash2 size={14} /></button>
        </div>
      </div>

      {showStudents && <StudentStrip batchId={batch.id} users={users} depth={depth} />}

      {open && kids.map(k => (
        <BatchRow key={k.id} batch={k} depth={depth + 1} childrenOf={childrenOf} studentCount={studentCount} onEdit={onEdit} onAddSub={onAddSub} onDelete={onDelete} users={users} />
      ))}
    </div>
  )
}

function StudentStrip({ batchId, users, depth }) {
  const [q, setQ] = useState('')
  const students = users.filter(u => u.role === 'Student' && (u.batchIds || []).includes(batchId))
    .filter(u => !q || u.name.toLowerCase().includes(q.toLowerCase()) || u.email.toLowerCase().includes(q.toLowerCase()))
  return (
    <div className="bg-paper-dim/60 border-y border-line" style={{ paddingLeft: 16 + depth * 22 + 21 }}>
      <div className="py-2.5 pr-4">
        {students.length > 8 && (
          <input className={`${inputCls} !py-1 !text-xs max-w-[14rem] mb-2`} placeholder="Search students…" value={q} onChange={e => setQ(e.target.value)} />
        )}
        {!students.length ? <p className="text-xs text-ink-400 py-1">No students in this batch.</p> : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-1 max-h-48 overflow-y-auto">
            {students.map(s => (
              <div key={s.id} className="flex items-center justify-between text-xs py-1 border-b border-line/60">
                <span className="text-ink-800">{s.name}</span>
                <span className="text-ink-400 font-mono">{s.registerNumber || '—'}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function BatchForm({ row, institutions, batches, onClose, onSave }) {
  const [form, setForm] = useState({ institutionId: row.institutionId || '', name: row.name || '', year: row.year || '', parentBatchId: row.parentBatchId || '' })
  const [err, setErr] = useState('')
  const siblingCandidates = batches.filter(b => b.id !== row.id && b.institutionId === form.institutionId)
  return (
    <SidePanel title={row.id ? 'Edit batch' : 'Add batch'} subtitle={`batches/${row.id || '(auto)'}`} onClose={onClose}
      footer={<>
        <button className={btnGhost} onClick={onClose}>Cancel</button>
        <button className={btnPrimary} disabled={!form.name || !form.year || !form.institutionId} onClick={() => onSave({ ...form, parentBatchId: form.parentBatchId || null }).catch(e => setErr(e.message))}>{row.id ? 'Save' : 'Create'}</button>
      </>}>
      <Field label="Institution" required>
        <SearchSelect options={institutions.map(i => ({ id: i.id, label: i.name }))} value={form.institutionId} onChange={v => setForm(f => ({ ...f, institutionId: v, parentBatchId: '' }))} allowClear={false} />
      </Field>
      <Field label="Name" required><input className={inputCls} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus /></Field>
      <Field label="Academic year" required><input className={inputCls} value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} placeholder="2026-2029" /></Field>
      <Field label="Parent batch" hint="If this batch is a subgroup (e.g. a placement-prep section), pick its parent batch here.">
        <SearchSelect options={siblingCandidates.map(b => ({ id: b.id, label: `${b.name} (${b.year})` }))} value={form.parentBatchId} onChange={v => setForm(f => ({ ...f, parentBatchId: v }))} />
      </Field>
      {err && <p className="text-sm text-brand-600">{err}</p>}
    </SidePanel>
  )
}
