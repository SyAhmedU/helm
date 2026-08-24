import { useEffect, useState } from 'react'
import { useAuth } from '../AuthContext.jsx'
import { Spinner, StatCard, Pill } from '../components/ui.jsx'
import { Building2, Layers, Users2, HelpCircle, ClipboardList, GraduationCap, Rocket, Activity, AlertTriangle, TrendingUp, CheckCircle2, ShieldAlert } from 'lucide-react'

export default function Dashboard({ onNavigate }) {
  const { authFetch, user } = useAuth()
  const [data, setData] = useState(null)
  useEffect(() => { authFetch('/dashboard').then(r => r.json()).then(setData) }, [authFetch])

  if (!data) return <Spinner label="Loading command center…" />
  const { counts, activity, attention, scoreDistribution, institutionsBreakdown } = data
  const maxDist = Math.max(1, ...scoreDistribution)

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <p className="text-sm text-ink-400">Welcome back, {user?.name?.split(' ')[0]}</p>
        <h1 className="font-display text-2xl font-bold text-ink-900">Command Center</h1>
        <p className="text-sm text-ink-400 mt-1 max-w-2xl">The real Authoring Portal drops you straight into a collection list — this rolls every module up into one view, the moment you sign in.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard icon={Building2} label="Institutions" value={counts.institutions} onClick={() => onNavigate('institutions')} />
        <StatCard icon={Layers} label="Batches" value={counts.batches} onClick={() => onNavigate('batches')} />
        <StatCard icon={Users2} label="Students" value={counts.students} sub={`+${counts.staff} staff`} onClick={() => onNavigate('users')} />
        <StatCard icon={HelpCircle} label="Questions" value={counts.questions} onClick={() => onNavigate('questions')} />
        <StatCard icon={ClipboardList} label="Assessments" value={counts.assessments} onClick={() => onNavigate('assessments')} />
        <StatCard icon={GraduationCap} label="Courses" value={counts.courses} onClick={() => onNavigate('courses')} />
        <StatCard icon={Rocket} label="Live now" value={activity.liveAdministrations} tone="brand" onClick={() => onNavigate('delivery')} />
        <StatCard icon={Activity} label="Attempts today" value={activity.attemptsToday} onClick={() => onNavigate('attempts')} />
        <StatCard icon={TrendingUp} label="Avg. score" value={activity.avgScorePct != null ? `${activity.avgScorePct}%` : '—'} tone="emerald" />
        <StatCard icon={ShieldAlert} label="Violations" value={activity.violations} tone={activity.violations ? 'brand' : 'ink'} onClick={() => onNavigate('attempts')} />
      </div>

      <div className="grid lg:grid-cols-5 gap-5">
        <div className="lg:col-span-2 card p-5">
          <h3 className="font-display font-semibold text-ink-900 mb-1 flex items-center gap-2"><AlertTriangle size={16} className="text-amber-signal" /> Needs attention</h3>
          <p className="text-xs text-ink-400 mb-3">Things the real portal would never surface until you happened across them.</p>
          {!attention.length ? (
            <div className="flex items-center gap-2 text-sm text-emerald-signal py-4"><CheckCircle2 size={16} /> All clear — nothing flagged.</div>
          ) : (
            <ul className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {attention.map((a, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-ink-700 bg-paper-dim rounded-lg px-3 py-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-signal mt-1.5 shrink-0" />
                  {a.label}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="lg:col-span-3 card p-5">
          <h3 className="font-display font-semibold text-ink-900 mb-1">Score distribution</h3>
          <p className="text-xs text-ink-400 mb-4">Across every recorded attempt · pass rate {activity.passRate != null ? `${activity.passRate}%` : '—'}</p>
          <div className="flex items-end gap-3 h-36">
            {scoreDistribution.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1.5">
                <span className="text-xs font-semibold text-ink-600">{v}</span>
                <div className="w-full rounded-t-md bg-brand-400" style={{ height: `${Math.max(v ? 4 : 0, (v / maxDist) * 88)}px` }} />
                <span className="text-[10px] text-ink-400">{['0–20', '21–40', '41–60', '61–80', '81–100'][i]}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="font-display font-semibold text-ink-900 mb-3">Institutions at a glance</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-ink-400 border-b border-line"><th className="py-2 font-semibold">Institution</th><th className="py-2 font-semibold">Batches</th><th className="py-2 font-semibold">Students</th></tr></thead>
            <tbody>
              {institutionsBreakdown.map(i => (
                <tr key={i.id} className="border-b border-line last:border-0">
                  <td className="py-2.5 font-medium text-ink-900">{i.name}</td>
                  <td className="py-2.5"><Pill>{i.batches}</Pill></td>
                  <td className="py-2.5 text-ink-600">{i.students}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
