import { useState } from 'react'
import { useCollection } from '../lib/useCollection.js'
import { SidePanel, Modal, Field, Spinner, Empty, Pill, btnPrimary, btnGhost, inputCls } from '../components/ui.jsx'
import { ClipboardList, Plus, Pencil, Trash2, SlidersHorizontal, Shuffle, ShieldCheck, Award, RotateCcw } from 'lucide-react'

export default function Assessments() {
  const { rows, loading, create, update, remove } = useCollection('assessments')
  const { rows: configured, create: createCfg, update: updateCfg } = useCollection('configured_assessments')
  const [editing, setEditing] = useState(null)
  const [configuring, setConfiguring] = useState(null)

  if (loading) return <Spinner label="Loading assessments…" />

  const cfgFor = (assessmentId) => configured.find(c => c.assessmentId === assessmentId)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold text-ink-900">Assessments</h1>
          <p className="text-sm text-ink-400">{rows.length} question papers · delivery settings live inline, not a separate collection to hunt down</p>
        </div>
        <button className={btnPrimary} onClick={() => setEditing({})}><Plus size={15} /> New assessment</button>
      </div>

      {!rows.length ? <Empty icon={ClipboardList} title="No assessments yet" hint="Create one to start building a delivery." /> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {rows.map(a => {
            const cfg = cfgFor(a.id)
            return (
              <div key={a.id} className="card p-4 flex flex-col gap-2.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-ink-900 leading-snug">{a.title}</p>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => setEditing(a)} className="text-ink-400 hover:text-ink-900 p-1"><Pencil size={13} /></button>
                    <button onClick={() => confirm('Remove this assessment?') && remove(a.id)} className="text-ink-400 hover:text-brand-600 p-1"><Trash2 size={13} /></button>
                  </div>
                </div>
                <p className="text-xs text-ink-400">{a.jobRole} · {a.durationMinutes} min</p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {cfg?.shuffleQuestions && <Pill tone="sky"><Shuffle size={10} /> Shuffled</Pill>}
                  {cfg?.preventTabSwitching && <Pill tone="brand"><ShieldCheck size={10} /> Proctored</Pill>}
                  {cfg?.allowRetake && <Pill tone="emerald"><RotateCcw size={10} /> Retake OK</Pill>}
                  {!cfg && <Pill>Not configured</Pill>}
                </div>
                <button onClick={() => setConfiguring(a)} className="btn btn-ghost mt-1 justify-center text-xs !py-1.5"><SlidersHorizontal size={13} /> {cfg ? 'Edit delivery settings' : 'Configure delivery'}</button>
              </div>
            )
          })}
        </div>
      )}

      {editing && (
        <AssessmentForm row={editing} onClose={() => setEditing(null)}
          onSave={async body => { editing.id ? await update(editing.id, body) : await create(body); setEditing(null) }} />
      )}
      {configuring && (
        <ConfigureModal assessment={configuring} cfg={cfgFor(configuring.id)} onClose={() => setConfiguring(null)}
          onSave={async body => {
            const existing = cfgFor(configuring.id)
            existing ? await updateCfg(existing.id, body) : await createCfg({ ...body, assessmentId: configuring.id })
            setConfiguring(null)
          }} />
      )}
    </div>
  )
}

function AssessmentForm({ row, onClose, onSave }) {
  const [form, setForm] = useState({ title: row.title || '', jobRole: row.jobRole || '', roleMaturity: row.roleMaturity || 'Entry', durationMinutes: row.durationMinutes || 20 })
  const [err, setErr] = useState('')
  return (
    <SidePanel title={row.id ? 'Edit assessment' : 'New assessment'} subtitle={`assessments/${row.id || '(auto)'}`} onClose={onClose}
      footer={<>
        <button className={btnGhost} onClick={onClose}>Cancel</button>
        <button className={btnPrimary} disabled={!form.title} onClick={() => onSave(form).catch(e => setErr(e.message))}>{row.id ? 'Save' : 'Create'}</button>
      </>}>
      <Field label="Title" required><input className={inputCls} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} autoFocus /></Field>
      <Field label="Job role"><input className={inputCls} value={form.jobRole} onChange={e => setForm(f => ({ ...f, jobRole: e.target.value }))} placeholder="e.g. Software Engineer" /></Field>
      <Field label="Role maturity">
        <select className={inputCls} value={form.roleMaturity} onChange={e => setForm(f => ({ ...f, roleMaturity: e.target.value }))}>
          <option>Entry</option><option>Mid</option><option>Senior</option>
        </select>
      </Field>
      <Field label="Duration (minutes)" required><input type="number" min="5" className={`${inputCls} max-w-[8rem]`} value={form.durationMinutes} onChange={e => setForm(f => ({ ...f, durationMinutes: Number(e.target.value) || 20 }))} /></Field>
      {err && <p className="text-sm text-brand-600">{err}</p>}
    </SidePanel>
  )
}

function Toggle({ label, hint, checked, onChange }) {
  return (
    <label className="flex items-start justify-between gap-3 py-2 cursor-pointer">
      <span>
        <span className="text-sm font-medium text-ink-800 block">{label}</span>
        {hint && <span className="text-xs text-ink-400">{hint}</span>}
      </span>
      <button type="button" onClick={() => onChange(!checked)} className={`w-9 h-5 rounded-full shrink-0 transition-colors relative ${checked ? 'bg-brand-500' : 'bg-ink-300/40'}`}>
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${checked ? 'left-4.5' : 'left-0.5'}`} style={{ left: checked ? 18 : 2 }} />
      </button>
    </label>
  )
}

function ConfigureModal({ assessment, cfg, onClose, onSave }) {
  const [form, setForm] = useState({
    difficulty: cfg?.difficulty || 'medium',
    shuffleQuestions: cfg?.shuffleQuestions ?? true, shuffleOptions: cfg?.shuffleOptions ?? true,
    preventTabSwitching: cfg?.preventTabSwitching ?? false, maxPageReloadCount: cfg?.maxPageReloadCount ?? 1,
    enableProtectorCode: cfg?.enableProtectorCode ?? false,
    resultPublishingType: cfg?.resultPublishingType || 'Immediate', showCorrectAnswers: cfg?.showCorrectAnswers ?? true, showSolutions: cfg?.showSolutions ?? false,
    allowRetake: cfg?.allowRetake ?? false,
  })
  const [err, setErr] = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  return (
    <Modal title={`Delivery settings — ${assessment.title}`} subtitle="configured_assessments" wide onClose={onClose}
      footer={<>
        <button className={btnGhost} onClick={onClose}>Cancel</button>
        <button className={btnPrimary} onClick={() => onSave(form).catch(e => setErr(e.message))}>Save settings</button>
      </>}>
      <div className="grid sm:grid-cols-2 gap-x-8 gap-y-1">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-bold text-ink-400 uppercase tracking-wide mt-1 mb-1"><Shuffle size={12} /> Shuffle</p>
          <Toggle label="Shuffle questions" checked={form.shuffleQuestions} onChange={v => set('shuffleQuestions', v)} />
          <Toggle label="Shuffle options" checked={form.shuffleOptions} onChange={v => set('shuffleOptions', v)} />

          <p className="flex items-center gap-1.5 text-xs font-bold text-ink-400 uppercase tracking-wide mt-4 mb-1"><ShieldCheck size={12} /> Integrity</p>
          <Toggle label="Prevent tab switching" checked={form.preventTabSwitching} onChange={v => set('preventTabSwitching', v)} />
          <Toggle label="Require a protector code" hint="6-digit code students enter before starting" checked={form.enableProtectorCode} onChange={v => set('enableProtectorCode', v)} />
          <Field label="Max page reload count"><input type="number" min="0" className={`${inputCls} max-w-[7rem]`} value={form.maxPageReloadCount} onChange={e => set('maxPageReloadCount', Number(e.target.value) || 0)} /></Field>
        </div>
        <div>
          <p className="flex items-center gap-1.5 text-xs font-bold text-ink-400 uppercase tracking-wide mt-1 mb-1"><Award size={12} /> Results</p>
          <Field label="Publishing">
            <select className={inputCls} value={form.resultPublishingType} onChange={e => set('resultPublishingType', e.target.value)}>
              <option value="Immediate">Immediate — right after submission</option>
              <option value="Scheduled">Scheduled</option>
            </select>
          </Field>
          <Toggle label="Show correct answers" checked={form.showCorrectAnswers} onChange={v => set('showCorrectAnswers', v)} />
          <Toggle label="Show solutions" checked={form.showSolutions} onChange={v => set('showSolutions', v)} />

          <p className="flex items-center gap-1.5 text-xs font-bold text-ink-400 uppercase tracking-wide mt-4 mb-1"><RotateCcw size={12} /> Retake</p>
          <Toggle label="Allow retake" checked={form.allowRetake} onChange={v => set('allowRetake', v)} />
        </div>
      </div>
      {err && <p className="text-sm text-brand-600 mt-3">{err}</p>}
    </Modal>
  )
}
