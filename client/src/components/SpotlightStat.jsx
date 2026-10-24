import { motion } from 'motion/react'

// Adapted from 21st.dev "Stat Card" by beratberkayg (21st.dev/r/beratberkayg/stat-card):
// moving halo + rotating ray + edge lines, re-skinned to Helm ink/brand and made a clickable banner.
export default function SpotlightStat({ icon: Icon, value, label, sub, onClick }) {
  return (
    <button
      onClick={onClick}
      className="relative w-full rounded-xl overflow-hidden p-[2px] bg-gradient-to-br from-ink-900 via-ink-950 to-black text-left cursor-pointer group"
    >
      <motion.div
        aria-hidden
        className="absolute w-16 h-16 rounded-full bg-brand-500/40 blur-xl"
        animate={{ top: ['10%', '10%', '60%', '60%', '10%'], left: ['5%', '90%', '90%', '5%', '5%'] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
      />
      <div className="relative flex items-center gap-5 w-full rounded-[10px] border border-white/10 bg-gradient-to-br from-ink-900/80 to-black/60 backdrop-blur-md px-6 py-5 overflow-hidden">
        <motion.div
          aria-hidden
          className="absolute left-1/3 w-[260px] h-[50px] rounded-full bg-white/10 blur-2xl"
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          aria-hidden
          className="absolute top-[14%] left-[10%] w-[80%] h-px bg-gradient-to-r from-white/30 to-transparent"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 6, repeat: Infinity }}
        />
        <motion.div
          aria-hidden
          className="absolute bottom-[14%] left-[10%] w-[80%] h-px bg-gradient-to-r from-transparent to-white/30"
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ duration: 6, repeat: Infinity }}
        />
        {Icon && (
          <span className="relative shrink-0 w-11 h-11 rounded-full bg-brand-500/15 border border-brand-400/30 flex items-center justify-center">
            <Icon size={20} className="text-brand-400" />
          </span>
        )}
        <div className="relative min-w-0">
          <div className="text-xs font-semibold uppercase tracking-wide text-white/50">{label}</div>
          <div className="font-display text-4xl font-extrabold bg-gradient-to-r from-white via-gray-300 to-white bg-clip-text text-transparent">
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
