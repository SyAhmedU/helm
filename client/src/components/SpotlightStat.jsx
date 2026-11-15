// Adapted from 21st.dev "Stat Card" by beratberkayg (21st.dev/r/beratberkayg/stat-card):
// re-skinned to a flat Helm ink banner (2026-11-15: halo, ray and edge lines removed, no glow).
export default function SpotlightStat({ icon: Icon, value, label, sub, onClick }) {
  return (
    <button
      onClick={onClick}
      className="relative w-full rounded-[20px] overflow-hidden bg-ink-950 text-left cursor-pointer group"
    >
      <div className="relative flex items-center gap-5 w-full px-6 py-5">
        {Icon && (
          <span className="relative shrink-0 w-11 h-11 rounded-full bg-white/10 flex items-center justify-center">
            <Icon size={20} className="text-white" />
          </span>
        )}
        <div className="relative min-w-0">
          <div className="text-xs font-semibold uppercase tracking-wide text-white/50">{label}</div>
          <div className="font-display text-4xl font-extrabold text-white">
            {value}
          </div>
        </div>
        {sub && (
          <span className="relative ml-auto text-sm text-white/60 group-hover:text-white transition-colors">{sub} →</span>
        )}
      </div>
    </button>
  )
}
