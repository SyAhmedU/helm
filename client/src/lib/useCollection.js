import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../AuthContext.jsx'

export function useCollection(name) {
  const { authFetch } = useAuth()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(() => {
    return authFetch(`/${name}`).then(r => (r.ok ? r.json() : [])).then(d => { setRows(d); setLoading(false) }).catch(() => setLoading(false))
  }, [authFetch, name])

  useEffect(() => { reload() }, [reload])

  const create = async (body) => {
    const res = await authFetch(`/${name}`, { method: 'POST', body })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Could not create')
    await reload()
    return data
  }
  const update = async (id, body) => {
    const res = await authFetch(`/${name}/${id}`, { method: 'PUT', body })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Could not save')
    await reload()
    return data
  }
  const remove = async (id) => {
    const res = await authFetch(`/${name}/${id}`, { method: 'DELETE' })
    if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Could not delete') }
    await reload()
  }

  return { rows, loading, reload, create, update, remove }
}
