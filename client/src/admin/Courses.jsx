import { useState, useMemo } from 'react'
import { useCollection } from '../lib/useCollection.js'
import { SidePanel, Field, Spinner, Empty, Pill, SearchSelect, btnPrimary, btnGhost, inputCls } from '../components/ui.jsx'
import { GraduationCap, Plus, Pencil, Trash2, ChevronRight, ChevronDown, PlayCircle, ClipboardCheck } from 'lucide-react'

export default function Courses() {
  const { rows: courses, loading: cLoading, create: createCourse, update: updateCourse, remove: removeCourse } = useCollection('courses')
  const { rows: modules, create: createModule, remove: removeModule } = useCollection('course_modules')
  const { rows: units, create: createUnit, remove: removeUnit } = useCollection('learning_units')
  const { rows: configured } = useCollection('configured_assessments')
  const [selected, setSelected] = useState('')
  const [editingCourse, setEditingCourse] = useState(null)
  const [addingModule, setAddingModule] = useState(false)
  const [addingUnit, setAddingUnit] = useState(null) // moduleId

  const activeId = selected || courses[0]?.id || ''
  const course = courses.find(c => c.id === activeId)
  const courseModules = useMemo(() => modules.filter(m => m.courseId === activeId).sort((a, b) => a.order - b.order), [modules, activeId])
  const unitsOf = (moduleId) => units.filter(u => u.moduleId === moduleId).sort((a, b) => a.order - b.order)

  if (cLoading) return <Spinner label="Loading courses…" />
  if (!courses.length) return (
    <div className="max-w-md mx-auto mt-16">
      <Empty icon={GraduationCap} title="No courses yet" hint="Create the first one to start building modules and learning units." />
      <div className="flex justify-center mt-3"><button className={btnPrimary} onClick={() => setEditingCourse({})}><Plus size={15} /> New course</button></div>
      {editingCourse && <CourseForm row={editingCourse} onClose={() => setEditingCourse(null)} onSave={async b => { await createCourse(b); setEditingCourse(null) }} />}
    </div>
  )

  return (
    <div className="grid lg:grid-cols-[260px_1fr] gap-5">
      <div className="card p-2 h-fit lg:sticky lg:top-6">
        <div className="flex items-center justify-between px-2 py-1.5">
          <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide">Courses</p>
          <button onClick={() => setEditingCourse({})} className="text-ink-400 hover:text-brand-600"><Plus size={14} /></button>
        </div>
        <div className="space-y-0.5">
          {courses.map(c => (
            <button key={c.id} onClick={() => setSelected(c.id)} className={`w-full text-left px-2.5 py-2 rounded-lg text-sm transition-colors ${c.id === activeId ? 'bg-brand-50 text-brand-700 font-semibold' : 'text-ink-700 hover:bg-paper-dim'}`}>
              <span className="block truncate">{c.name}</span>
              <span className="text-[11px] text-ink-400">{c.status}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-xl font-bold text-ink-900">{course?.name}</h1>
              <Pill tone={course?.status === 'Published' ? 'emerald' : 'slate'}>{course?.status}</Pill>
              <Pill tone="sky">{course?.competencyLevel}</Pill>
            </div>
            <p className="text-sm text-ink-400 mt-1 max-w-xl">{course?.description}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button onClick={() => setEditingCourse(course)} className="text-ink-400 hover:text-ink-900 p-1.5"><Pencil size={15} /></button>
            <button onClick={() => confirm(`Remove ${course.name}?`) && removeCourse(course.id)} className="text-ink-400 hover:text-brand-600 p-1.5"><Trash2 size={15} /></button>
          </div>
        </div>

        <div className="flex justify-end"><button className="btn btn-ghost text-xs !py-1.5" onClick={() => setAddingModule(true)}><Plus size={13} /> Add module</button></div>

        {!courseModules.length ? <div className="card p-8 text-center text-sm text-ink-400">No modules yet.</div> : (
          <div className="space-y-2.5">
            {courseModules.map(m => (
              <ModuleCard key={m.id} module={m} units={unitsOf(m.id)} configured={configured}
                onAddUnit={() => setAddingUnit(m.id)} onRemoveModule={() => confirm(`Remove ${m.name}?`) && removeModule(m.id)} onRemoveUnit={removeUnit} />
            ))}
          </div>
        )}
      </div>

      {editingCourse && (
        <CourseForm row={editingCourse} onClose={() => setEditingCourse(null)}
          onSave={async body => { editingCourse.id ? await updateCourse(editingCourse.id, body) : (await createCourse(body).then(r => setSelected(r.id))); setEditingCourse(null) }} />
      )}
      {addingModule && (
        <ModuleForm courseId={activeId} onClose={() => setAddingModule(false)} onSave={async body => { await createModule({ ...body, courseId: activeId }); setAddingModule(false) }} />
      )}
      {addingUnit && (
        <UnitForm courseId={activeId} moduleId={addingUnit} configured={configured} onClose={() => setAddingUnit(null)} onSave={async body => { await createUnit({ ...body, courseId: activeId, moduleId: addingUnit }); setAddingUnit(null) }} />
      )}
    </div>
  )
}

function ModuleCard({ module, units, configured, onAddUnit, onRemoveModule, onRemoveUnit }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="card overflow-hidden">
      <div role="button" tabIndex={0} onClick={() => setOpen(o => !o)} onKeyDown={e => e.key === 'Enter' && setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-paper-dim/60 cursor-pointer select-none">
        {open ? <ChevronDown size={15} className="text-ink-400" /> : <ChevronRight size={15} className="text-ink-400" />}
        <span className="font-semibold text-ink-900">{module.name}</span>
        <span className="text-xs text-ink-400">{units.length} unit{units.length === 1 ? '' : 's'}</span>
        <div className="ml-auto flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <button onClick={onAddUnit} className="text-xs text-ink-400 hover:text-brand-600 flex items-center gap-1"><Plus size={12} /> Unit</button>
          <button onClick={onRemoveModule} className="text-ink-300 hover:text-brand-600"><Trash2 size={13} /></button>
        </div>
      </div>
      {open && (
        <div className="border-t border-line divide-y divide-line">
          {!units.length ? <p className="px-4 py-3 text-xs text-ink-400">No learning units yet.</p> : units.map(u => (
            <div key={u.id} className="flex items-center gap-2.5 px-4 py-2.5 pl-9">
              {u.type === 'Video' ? <PlayCircle size={14} className="text-sky-signal" /> : <ClipboardCheck size={14} className="text-brand-500" />}
              <span className="text-sm text-ink-800 flex-1 truncate">{u.name}</span>
              <span className="text-[11px] text-ink-400">{u.durationMinutes}m</span>
              <Pill tone={u.status === 'Published' ? 'emerald' : 'slate'}>{u.status}</Pill>
              <button onClick={() => confirm(`Remove ${u.name}?`) && onRemoveUnit(u.id)} className="text-ink-300 hover:text-brand-600"><Trash2 size={13} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function CourseForm({ row, onClose, onSave }) {
  const [form, setForm] = useState({ name: row.name || '', description: row.description || '', category: row.category || '', competencyLevel: row.competencyLevel || 'Beginner', status: row.status || 'Draft' })
  const [err, setErr] = useState('')
  return (
    <SidePanel title={row.id ? 'Edit course' : 'New course'} subtitle={`courses/${row.id || '(auto)'}`} onClose={onClose}
      footer={<><button className={btnGhost} onClick={onClose}>Cancel</button><button className={btnPrimary} disabled={!form.name} onClick={() => onSave(form).catch(e => setErr(e.message))}>{row.id ? 'Save' : 'Create'}</button></>}>
      <Field label="Name" required><input className={inputCls} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus /></Field>
      <Field label="Description"><textarea className={`${inputCls} min-h-[70px]`} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Competency level">
          <select className={inputCls} value={form.competencyLevel} onChange={e => setForm(f => ({ ...f, competencyLevel: e.target.value }))}><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select>
        </Field>
        <Field label="Status">
          <select className={inputCls} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}><option>Draft</option><option>Published</option></select>
        </Field>
      </div>
      <Field label="Category"><input className={inputCls} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} /></Field>
      {err && <p className="text-sm text-brand-600">{err}</p>}
    </SidePanel>
  )
}

function ModuleForm({ onClose, onSave }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [err, setErr] = useState('')
  return (
    <SidePanel title="Add module" subtitle="course_modules/(auto)" onClose={onClose}
      footer={<><button className={btnGhost} onClick={onClose}>Cancel</button><button className={btnPrimary} disabled={!name} onClick={() => onSave({ name, description, status: 'Published' }).catch(e => setErr(e.message))}>Create</button></>}>
      <Field label="Name" required><input className={inputCls} value={name} onChange={e => setName(e.target.value)} autoFocus /></Field>
      <Field label="Description"><textarea className={`${inputCls} min-h-[70px]`} value={description} onChange={e => setDescription(e.target.value)} /></Field>
      {err && <p className="text-sm text-brand-600">{err}</p>}
    </SidePanel>
  )
}

function UnitForm({ configured, onClose, onSave }) {
  const [form, setForm] = useState({ name: '', type: 'Video', durationMinutes: 10, description: '', youtubeUrl: '', configuredAssessmentId: '' })
  const [err, setErr] = useState('')
  return (
    <SidePanel title="Add learning unit" subtitle="learning_units/(auto)" onClose={onClose}
      footer={<><button className={btnGhost} onClick={onClose}>Cancel</button><button className={btnPrimary} disabled={!form.name} onClick={() => onSave(form).catch(e => setErr(e.message))}>Create</button></>}>
      <Field label="Name" required hint="Encode the label in the name, e.g. 'DSA Test — Post-class'"><input className={inputCls} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus /></Field>
      <Field label="Type" required>
        <select className={inputCls} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}><option value="Video">Video</option><option value="Assessment">Assessment</option></select>
      </Field>
      <Field label="Duration (minutes)"><input type="number" min="1" className={`${inputCls} max-w-[8rem]`} value={form.durationMinutes} onChange={e => setForm(f => ({ ...f, durationMinutes: Number(e.target.value) || 10 }))} /></Field>
      {form.type === 'Video' ? (
        <Field label="YouTube URL"><input className={inputCls} value={form.youtubeUrl} onChange={e => setForm(f => ({ ...f, youtubeUrl: e.target.value }))} /></Field>
      ) : (
        <Field label="Configured assessment" hint="Proctoring and retakes come from that assessment's own delivery settings.">
          <SearchSelect options={configured.map(c => ({ id: c.id, label: c.id }))} value={form.configuredAssessmentId} onChange={v => setForm(f => ({ ...f, configuredAssessmentId: v }))} />
        </Field>
      )}
      <Field label="Description"><textarea className={`${inputCls} min-h-[60px]`} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></Field>
      {err && <p className="text-sm text-brand-600">{err}</p>}
    </SidePanel>
  )
}
