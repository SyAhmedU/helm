import { useState, useMemo } from 'react'
import { useCollection } from '../lib/useCollection.js'
import { SidePanel, Field, Spinner, Empty, btnPrimary, btnGhost, btnDanger, inputCls } from '../components/ui.jsx'
import { Building2, Plus, Pencil, Trash2, Search } from 'lucide-react'

export default function Institutions() {
  const { rows, loading, create, update, remove } = useCollection('institutions')
  const [editing, setEditing] = useState(null)
  const [q, setQ] = useState('')
  const filtered = useMemo(() => rows.filter(r => !q || r.name.toLowerCase().includes(q.toLowerCase())), [rows, q])

  if (loading) return <Spinner label="Loading institutions…" />

  return (
    <div className="max-w-4xl space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold text-ink-900">Institutions</h1>
          <p className="text-sm text-ink-400">{rows.length} on file</p>
        </div>
        <button className={btnPrimary} onClick={() => setEditing({})}><Plus size={15} /> Add institution</button>
      </div>
      <div className="relative max-w-xs">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
        <input className={`${inputCls} pl-8`} placeholder="Search…" value={q} onChange={e => setQ(e.target.value)} />
      </div>

      {!filtered.length ? <Empty icon={Building2} title="No institutions" hint="Add the first one." /> : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-paper-dim text-xs text-ink-400"><tr>
              <th className="text-left px-4 py-2.5 font-semibold">Name</th>
              <th className="text-left px-4 py-2.5 font-semibold">Address</th>
              <th className="text-left px-4 py-2.5 font-mono font-semibold">ID</th>
              <th className="px-4 py-2.5"></th>
            </tr></thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className="border-t border-line hover:bg-paper-dim/60">
                  <td className="px-4 py-2.5 font-medium text-ink-900">{r.name}</td>
                  <td className="px-4 py-2.5 text-ink-600">{r.address || '—'}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-ink-400">{r.id}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setEditing(r)} className="text-ink-400 hover:text-ink-900 p-1"><Pencil size={14} /></button>
                      <button onClick={() => confirm(`Remove ${r.name}?`) && remove(r.id)} className="text-ink-400 hover:text-brand-600 p-1"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <InstitutionForm row={editing} onClose={() => setEditing(null)}
          onSave={async body => { editing.id ? await update(editing.id, body) : await create(body); setEditing(null) }} />
      )}
    </div>
  )
}

function InstitutionForm({ row, onClose, onSave }) {
  const [form, setForm] = useState({ name: row.name || '', address: row.address || '' })
  const [err, setErr] = useState('')
  return (
    <SidePanel title={row.id ? 'Edit institution' : 'Add institution'} subtitle={`institutions/${row.id || '(auto)'}`} onClose={onClose}
      footer={<>
        <button className={btnGhost} onClick={onClose}>Cancel</button>
        <button className={btnPrimary} disabled={!form.name} onClick={() => onSave(form).catch(e => setErr(e.message))}>{row.id ? 'Save' : 'Create'}</button>
      </>}>
      <Field label="Institution name" required><input className={inputCls} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus /></Field>
      <Field label="Address"><input className={inputCls} value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} /></Field>
      {err && <p className="text-sm text-brand-600">{err}</p>}
    </SidePanel>
  )
}
