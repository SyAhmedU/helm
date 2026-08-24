import { useState, useMemo } from 'react'
import { useCollection } from '../lib/useCollection.js'
import { SidePanel, Field, Spinner, Empty, Pill, btnPrimary, btnGhost, inputCls } from '../components/ui.jsx'
import { HelpCircle, Plus, Pencil, Trash2, Search, X } from 'lucide-react'

const DIFF_TONE = { easy: 'emerald', medium: 'amber', hard: 'brand' }

export default function Questions() {
  const { rows, loading, create, update, remove } = useCollection('questions')
  const [editing, setEditing] = useState(null)
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('')
  const [diff, setDiff] = useState('')

  const categories = useMemo(() => [...new Set(rows.map(r => r.category).filter(Boolean))].sort(), [rows])
  const filtered = useMemo(() => rows.filter(r =>
    (!q || r.title?.toLowerCase().includes(q.toLowerCase()) || r.text?.toLowerCase().includes(q.toLowerCase())) &&
    (!cat || r.category === cat) && (!diff || r.difficulty === diff)
  ), [rows, q, cat, diff])

  if (loading) return <Spinner label="Loading question bank…" />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold text-ink-900">Question Bank</h1>
          <p className="text-sm text-ink-400">{rows.length} questions · showing {filtered.length}</p>
        </div>
        <button className={btnPrimary} onClick={() => setEditing({})}><Plus size={15} /> Add question</button>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative max-w-xs flex-1 min-w-[12rem]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input className={`${inputCls} pl-8`} placeholder="Search title or text…" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <select className={`${inputCls} max-w-[10rem]`} value={cat} onChange={e => setCat(e.target.value)}>
          <option value="">All categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className={`${inputCls} max-w-[9rem]`} value={diff} onChange={e => setDiff(e.target.value)}>
          <option value="">All difficulty</option>
          <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
        </select>
      </div>

      {!filtered.length ? <Empty icon={HelpCircle} title="No questions match" hint="Add one, or clear the filters." /> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.slice(0, 90).map(r => (
            <div key={r.id} className="card p-4 flex flex-col gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <Pill tone={r.type === 'MCQ' ? 'sky' : 'brand'}>{r.type}</Pill>
                <Pill tone={DIFF_TONE[r.difficulty]}>{r.difficulty}</Pill>
                <span className="text-xs text-ink-400 ml-auto">{r.totalMarks} pt{r.totalMarks === 1 ? '' : 's'}</span>
              </div>
              <p className="text-sm font-medium text-ink-900 line-clamp-2">{r.title}</p>
              <p className="text-xs text-ink-400 line-clamp-2">{r.text || r.passage}</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[11px] text-ink-400 truncate">{r.category} · {r.topic}</span>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => setEditing(r)} className="text-ink-400 hover:text-ink-900 p-1"><Pencil size={13} /></button>
                  <button onClick={() => confirm('Remove this question?') && remove(r.id)} className="text-ink-400 hover:text-brand-600 p-1"><Trash2 size={13} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {filtered.length > 90 && <p className="text-xs text-ink-400 text-center">Showing the first 90 of {filtered.length} — narrow with search or filters.</p>}

      {editing && (
        <QuestionForm row={editing} onClose={() => setEditing(null)}
          onSave={async body => { editing.id ? await update(editing.id, body) : await create(body); setEditing(null) }} />
      )}
    </div>
  )
}

function QuestionForm({ row, onClose, onSave }) {
  const [form, setForm] = useState({
    type: row.type || 'MCQ', difficulty: row.difficulty || 'medium', totalMarks: row.totalMarks || 1,
    category: row.category || '', topic: row.topic || '', title: row.title || '', text: row.text || '',
    options: row.options || ['', '', '', ''], correctOption: row.correctOption || 'A', rationale: row.rationale || '',
  })
  const [err, setErr] = useState('')
  const letters = ['A', 'B', 'C', 'D', 'E']
  const setOpt = (i, v) => setForm(f => ({ ...f, options: f.options.map((o, oi) => (oi === i ? v : o)) }))

  return (
    <SidePanel title={row.id ? 'Edit question' : 'Add question'} subtitle={`questions/${row.id || '(auto)'}`} onClose={onClose}
      footer={<>
        <button className={btnGhost} onClick={onClose}>Cancel</button>
        <button className={btnPrimary} disabled={!form.title} onClick={() => onSave(form).catch(e => setErr(e.message))}>{row.id ? 'Save' : 'Create'}</button>
      </>}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Type" required>
          <select className={inputCls} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
            <option value="MCQ">MCQ</option><option value="RC">Reading Comprehension</option>
          </select>
        </Field>
        <Field label="Difficulty" required>
          <select className={inputCls} value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))}>
            <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Category"><input className={inputCls} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="e.g. DSA" /></Field>
        <Field label="Topic"><input className={inputCls} value={form.topic} onChange={e => setForm(f => ({ ...f, topic: e.target.value }))} placeholder="e.g. Linked List" /></Field>
      </div>
      <Field label="Total marks" required><input type="number" min="1" className={`${inputCls} max-w-[8rem]`} value={form.totalMarks} onChange={e => setForm(f => ({ ...f, totalMarks: Number(e.target.value) || 1 }))} /></Field>
      <Field label="Title" required><input className={inputCls} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} autoFocus /></Field>
      <Field label={form.type === 'MCQ' ? 'Question text' : 'Passage'}><textarea className={`${inputCls} min-h-[80px]`} value={form.text} onChange={e => setForm(f => ({ ...f, text: e.target.value }))} /></Field>

      {form.type === 'MCQ' && (
        <Field label="Options" required>
          <div className="space-y-1.5">
            {form.options.map((o, i) => (
              <div key={i} className="flex items-center gap-2">
                <button type="button" onClick={() => setForm(f => ({ ...f, correctOption: letters[i] }))}
                  className={`w-6 h-6 rounded-full text-[11px] font-bold shrink-0 flex items-center justify-center border ${form.correctOption === letters[i] ? 'bg-emerald-500 text-white border-emerald-500' : 'border-line text-ink-400'}`}>{letters[i]}</button>
                <input className={inputCls} value={o} onChange={e => setOpt(i, e.target.value)} placeholder={`Option ${letters[i]}`} />
              </div>
            ))}
          </div>
          <p className="text-xs text-ink-400 mt-1.5">Click a letter to mark it as the correct answer — {form.correctOption} is currently correct.</p>
        </Field>
      )}
      <Field label="Rationale" hint="Shown to students alongside the correct answer.">
        <textarea className={`${inputCls} min-h-[60px]`} value={form.rationale} onChange={e => setForm(f => ({ ...f, rationale: e.target.value }))} />
      </Field>
      {err && <p className="text-sm text-brand-600">{err}</p>}
    </SidePanel>
  )
}
