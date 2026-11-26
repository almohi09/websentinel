import { motion } from 'framer-motion'

export default function CyberGridBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* 21st.dev / Aceternity Style SVG Grid Pattern */}
      <svg
        className="absolute inset-0 w-full h-full stroke-[#64FFDA]/[0.04] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="cyber-grid"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <path d="M0 40L40 40M40 0L40 40" fill="none" strokeWidth="1" strokeDasharray="2 4" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#cyber-grid)" />
      </svg>

      {/* Primary Radial Glow Beacons */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-[#64FFDA]/[0.07] rounded-full blur-[140px]" />
      <div className="absolute -bottom-24 left-1/3 w-[500px] h-[400px] bg-[#38BDF8]/[0.05] rounded-full blur-[120px]" />

      {/* Cyber Corner Reticles (21st.dev Military/Terminal Tech) */}
      <div className="absolute top-8 left-8 text-[#64FFDA]/20 font-mono text-[10px] tracking-widest hidden md:block">
        + SYS_GATEWAY // SECTOR_01
      </div>
      <div className="absolute top-8 right-8 text-[#64FFDA]/20 font-mono text-[10px] tracking-widest hidden md:block">
        PERIMETER_ENCRYPTED: TRUE // 256-BIT
      </div>
      <div className="absolute bottom-8 left-8 text-[#64FFDA]/20 font-mono text-[10px] tracking-widest hidden md:block">
        NODE_STATUS: ONLINE [PORT_8080]
      </div>
      <div className="absolute bottom-8 right-8 text-[#64FFDA]/20 font-mono text-[10px] tracking-widest hidden md:block">
        SENTINEL_DEFENSE_V2.4
      </div>

      {/* Floating Animated Cyber Particle Beams */}
      <motion.div
        animate={{
          y: [-20, 20, -20],
          opacity: [0.2, 0.5, 0.2],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute top-1/3 right-1/4 w-72 h-72 bg-[#64FFDA]/[0.03] rounded-full blur-[90px]"
      />
    </div>
  )
}
