import { useState } from 'react'
import { useCollection } from '../lib/useCollection.js'
import { Spinner, Empty, Pill, btnPrimary, inputCls } from '../components/ui.jsx'
import { Tags as TagsIcon, Plus, X } from 'lucide-react'

export default function Tags() {
  const { rows, loading, create, remove } = useCollection('tags')
  const [name, setName] = useState('')

  if (loading) return <Spinner label="Loading tags…" />

  const add = async () => {
    const v = name.trim()
    if (!v) return
    setName('')
    await create({ name: v })
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h1 className="font-display text-xl font-bold text-ink-900">Tags</h1>
        <p className="text-sm text-ink-400">Used across the question bank for finer search than category/topic alone.</p>
      </div>
      <div className="flex gap-2">
        <input className={inputCls} value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} placeholder="New tag…" />
        <button className={btnPrimary} onClick={add}><Plus size={15} /> Add</button>
      </div>
      {!rows.length ? <Empty icon={TagsIcon} title="No tags yet" /> : (
        <div className="flex flex-wrap gap-2">
          {rows.map(t => (
            <span key={t.id} className="chip bg-paper-dim text-ink-700 !normal-case !text-xs pr-1.5">
              {t.name}
              <button onClick={() => remove(t.id)} className="ml-1 text-ink-400 hover:text-brand-600"><X size={11} /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
