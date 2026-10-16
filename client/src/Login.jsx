import { useState } from 'react'
import { useAuth } from './AuthContext.jsx'
import { Anchor, ArrowRight, Info } from 'lucide-react'

export default function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState('admin@helm.demo')
  const [password, setPassword] = useState('helm@demo123')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setErr('')
    try { await login(email, password) } catch (e2) { setErr(e2.message) } finally { setBusy(false) }
  }

  return (
    <div className="min-h-screen flex bg-ink-950">
      <div className="hidden lg:flex flex-1 relative overflow-hidden items-center justify-center p-16">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(60% 50% at 20% 20%, rgba(227,27,35,.35), transparent 60%), radial-gradient(50% 40% at 90% 80%, rgba(227,27,35,.18), transparent 60%)' }} />
        <div className="relative z-10 max-w-md text-white">
          <div className="w-12 h-12 rounded-xl bg-brand-500 flex items-center justify-center mb-8"><Anchor size={22} /></div>
          <h1 className="font-display text-4xl font-bold leading-tight mb-4">One control center for every institution, batch, and assessment.</h1>
          <p className="text-white/60 text-[15px] leading-relaxed">Plan delivery. Find a batch. Understand an attempt. A single operations workspace, with every institution and its learning activity in view.</p>
        </div>
      </div>
      <div className="w-full lg:w-[440px] bg-white flex flex-col justify-center px-8 sm:px-14 py-16">
        <div className="lg:hidden w-10 h-10 rounded-lg bg-brand-500 flex items-center justify-center mb-8"><Anchor size={18} className="text-white" /></div>
        <h2 className="font-display text-2xl font-bold text-ink-900 mb-1">Sign in</h2>
        <p className="text-sm text-ink-400 mb-7">Staff access — Super Admin, Sub Admin, Coordinator, or Author.</p>
        <form onSubmit={submit} className="space-y-3.5">
          <div>
            <label className="label" htmlFor="helm-email">Email</label>
            <input className="input" id="helm-email" autoComplete="username" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="label" htmlFor="helm-password">Password</label>
            <input className="input" id="helm-password" autoComplete="current-password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          {err && <p role="alert" className="text-sm text-brand-600">{err}</p>}
          <button className="btn btn-brand w-full justify-center py-2.5" disabled={busy}>{busy ? 'Signing in…' : <>Sign in <ArrowRight size={15} /></>}</button>
        </form>
        <div className="mt-6 flex items-start gap-2 text-xs text-ink-400 bg-paper-dim rounded-xl p-3">
          <Info size={14} className="shrink-0 mt-0.5" />
          <span>Demo credentials are pre-filled. Every record inside is simulated — this is a design pitch, not a connection to FACE Prep's real system.</span>
        </div>
      </div>
    </div>
  )
}
