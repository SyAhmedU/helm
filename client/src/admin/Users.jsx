import { useState, useMemo } from 'react'
import { useCollection } from '../lib/useCollection.js'
import { SidePanel, Field, Spinner, Empty, Pill, SearchSelect, btnPrimary, btnGhost, inputCls } from '../components/ui.jsx'
import { Users2, Plus, Pencil, Trash2, Search } from 'lucide-react'

const ROLES = ['Super Admin', 'Sub Admin', 'Coordinator', 'Author', 'Student']
const ROLE_TONE = { 'Super Admin': 'brand', 'Sub Admin': 'sky', Coordinator: 'emerald', Author: 'amber', Student: 'slate' }
const PER_PAGE = 30

export default function Users() {
  const { rows, loading, create, update, remove } = useCollection('users')
  const { rows: institutions } = useCollection('institutions')
  const { rows: batches } = useCollection('batches')
  const [editing, setEditing] = useState(null)
  const [q, setQ] = useState('')
  const [role, setRole] = useState('')
  const [instId, setInstId] = useState('')
  const [page, setPage] = useState(0)

  const batchName = (id) => batches.find(b => b.id === id)?.name || id
  const instName = (id) => institutions.find(i => i.id === id)?.name || '—'

  const filtered = useMemo(() => rows.filter(u =>
    (!q || u.name.toLowerCase().includes(q.toLowerCase()) || u.email.toLowerCase().includes(q.toLowerCase())) &&
    (!role || u.role === role) && (!instId || u.institutionId === instId)
  ), [rows, q, role, instId])
  const pageCount = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const pageSafe = Math.min(page, pageCount - 1)
  const paged = filtered.slice(pageSafe * PER_PAGE, pageSafe * PER_PAGE + PER_PAGE)
  const resetPage = () => setPage(0)

  if (loading) return <Spinner label="Loading users…" />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold text-ink-900">Users</h1>
          <p className="text-sm text-ink-400">{rows.length} accounts · showing {filtered.length}</p>
        </div>
        <button className={btnPrimary} onClick={() => setEditing({})}><Plus size={15} /> Add user</button>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative max-w-xs flex-1 min-w-[12rem]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input className={`${inputCls} pl-8`} placeholder="Search name or email…" value={q} onChange={e => { setQ(e.target.value); resetPage() }} />
        </div>
        <select className={`${inputCls} max-w-[10rem]`} value={role} onChange={e => { setRole(e.target.value); resetPage() }}>
          <option value="">All roles</option>
          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select className={`${inputCls} max-w-[14rem]`} value={instId} onChange={e => { setInstId(e.target.value); resetPage() }}>
          <option value="">All institutions</option>
          {institutions.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
        </select>
      </div>

      {!filtered.length ? <Empty icon={Users2} title="No users match" hint="Try a different filter." /> : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[760px]">
              <thead className="bg-paper-dim text-xs text-ink-400"><tr>
                <th className="text-left px-4 py-2.5 font-semibold">Name</th>
                <th className="text-left px-4 py-2.5 font-semibold">Email</th>
                <th className="text-left px-4 py-2.5 font-semibold">Role</th>
                <th className="text-left px-4 py-2.5 font-semibold">Institution</th>
                <th className="text-left px-4 py-2.5 font-semibold">Batch</th>
                <th className="px-4 py-2.5"></th>
              </tr></thead>
              <tbody>
                {paged.map(u => (
                  <tr key={u.id} className="border-t border-line hover:bg-paper-dim/60">
                    <td className="px-4 py-2.5 font-medium text-ink-900">{u.name}</td>
                    <td className="px-4 py-2.5 text-ink-600">{u.email}</td>
                    <td className="px-4 py-2.5"><Pill tone={ROLE_TONE[u.role]}>{u.role}</Pill></td>
                    <td className="px-4 py-2.5 text-ink-600 truncate max-w-[10rem]">{instName(u.institutionId)}</td>
                    <td className="px-4 py-2.5 text-ink-600">{(u.batchIds || []).map(batchName).join(', ') || '—'}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setEditing(u)} className="text-ink-400 hover:text-ink-900 p-1"><Pencil size={14} /></button>
                        <button onClick={() => confirm(`Remove ${u.name}?`) && remove(u.id)} className="text-ink-400 hover:text-brand-600 p-1"><Trash2 size={14} /></button>
                      </div>
                    </td>
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

      {editing && (
        <UserForm row={editing} institutions={institutions} batches={batches} onClose={() => setEditing(null)}
          onSave={async body => { editing.id ? await update(editing.id, body) : await create(body); setEditing(null) }} />
      )}
    </div>
  )
}

function UserForm({ row, institutions, batches, onClose, onSave }) {
  const [form, setForm] = useState({ name: row.name || '', email: row.email || '', role: row.role || 'Student', institutionId: row.institutionId || '', batchIds: row.batchIds || [], registerNumber: row.registerNumber || '', phoneNumber: row.phoneNumber || '', password: '' })
  const [err, setErr] = useState('')
  const instBatches = batches.filter(b => b.institutionId === form.institutionId)
  const toggleBatch = (id) => setForm(f => ({ ...f, batchIds: f.batchIds.includes(id) ? f.batchIds.filter(x => x !== id) : [...f.batchIds, id] }))
  return (
    <SidePanel title={row.id ? 'Edit user' : 'Add user'} subtitle={`users/${row.id || '(auto)'}`} onClose={onClose}
      footer={<>
        <button className={btnGhost} onClick={onClose}>Cancel</button>
        <button className={btnPrimary} disabled={!form.name || !form.email} onClick={() => onSave(form).catch(e => setErr(e.message))}>{row.id ? 'Save' : 'Create'}</button>
      </>}>
      <Field label="Name" required><input className={inputCls} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus /></Field>
      <Field label="Email" required><input className={inputCls} type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></Field>
      <Field label="Role" required>
        <select className={inputCls} value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </Field>
      <Field label="Institution">
        <SearchSelect options={institutions.map(i => ({ id: i.id, label: i.name }))} value={form.institutionId} onChange={v => setForm(f => ({ ...f, institutionId: v, batchIds: [] }))} />
      </Field>
      {form.institutionId && (
        <Field label="Batches" hint="A user can belong to more than one batch.">
          <div className="max-h-40 overflow-y-auto rounded-lg border border-line p-1.5 space-y-0.5">
            {instBatches.map(b => (
              <label key={b.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-paper-dim cursor-pointer text-sm">
                <input type="checkbox" checked={form.batchIds.includes(b.id)} onChange={() => toggleBatch(b.id)} /> {b.name} <span className="text-ink-400 text-xs">({b.year})</span>
              </label>
            ))}
            {!instBatches.length && <p className="text-xs text-ink-400 px-2 py-1">No batches for this institution yet.</p>}
          </div>
        </Field>
      )}
      {form.role === 'Student' && (
        <>
          <Field label="Register number"><input className={inputCls} value={form.registerNumber} onChange={e => setForm(f => ({ ...f, registerNumber: e.target.value }))} /></Field>
          <Field label="Phone number"><input className={inputCls} value={form.phoneNumber} onChange={e => setForm(f => ({ ...f, phoneNumber: e.target.value }))} /></Field>
        </>
      )}
      <Field label="Password" hint={row.id ? 'Leave blank to keep the current password.' : 'Leave blank for the default (student123).'}>
        <input className={inputCls} type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
      </Field>
      {err && <p className="text-sm text-brand-600">{err}</p>}
    </SidePanel>
  )
}
