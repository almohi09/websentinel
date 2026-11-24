import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Terminal, 
  Search, 
  Globe, 
  LayoutDashboard, 
  Building2, 
  Play, 
  ArrowRight, 
  CornerDownLeft, 
  Shield, 
  Sparkles, 
  X,
  FileText,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react'
import api from '../../lib/api'
import { useAuthStore } from '../../store/authStore'
import { toast } from 'sonner'

export default function CommandPalette({ open, setOpen }) {
  const navigate = useNavigate()
  const organizationId = useAuthStore((s) => s.organizationId)
  const [query, setQuery] = useState('')
  const [websites, setWebsites] = useState([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [executing, setExecuting] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
      if (organizationId) {
        api.get(`/organizations/${organizationId}/websites`)
          .then((res) => setWebsites(res.data || []))
          .catch((err) => console.error(err))
      }
    } else {
      setQuery('')
      setSelectedIndex(0)
    }
  }, [open, organizationId])

  // Global Escape key listener (capturing phase) so Esc ALWAYS closes the palette
  useEffect(() => {
    if (!open) return
    const handleGlobalKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        e.preventDefault()
        e.stopPropagation()
        setOpen(false)
      }
    }
    window.addEventListener('keydown', handleGlobalKeyDown, true)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown, true)
  }, [open, setOpen])

  // Navigation Items
  const navSuggestions = [
    {
      id: 'nav-dashboard',
      category: 'NAVIGATION',
      title: 'Command Center Dashboard',
      subtitle: 'View overall security posture, vector progress, and live advisories',
      icon: LayoutDashboard,
      action: () => {
        navigate('/dashboard')
        setOpen(false)
      }
    },
    {
      id: 'nav-fleet',
      category: 'NAVIGATION',
      title: 'Target Fleet Assets',
      subtitle: 'Manage monitored endpoints, verify challenge tokens, view fleet',
      icon: Globe,
      action: () => {
        navigate('/websites')
        setOpen(false)
      }
    },
    {
      id: 'nav-workspaces',
      category: 'NAVIGATION',
      title: 'Fleet Workspaces',
      subtitle: 'Switch multi-tenant context, manage organizations',
      icon: Building2,
      action: () => {
        navigate('/workspaces')
        setOpen(false)
      }
    }
  ]

  // Website Quick Jump / Scan suggestions
  const websiteSuggestions = websites.map((w) => ({
    id: `ws-${w.id}`,
    category: 'MONITORED TARGET',
    title: w.url,
    subtitle: `Host: ${w.host || 'N/A'} • ${w.verified ? 'Verified & Active' : 'Pending Verification'}`,
    icon: Globe,
    verified: w.verified,
    action: () => {
      navigate(`/websites/${w.id}`)
      setOpen(false)
    }
  }))

  // Filtered suggestions
  const q = query.trim().toLowerCase()
  let filteredItems = []

  const isCommandOrUrl = q.startsWith('scan ') || q.startsWith('http://') || q.startsWith('https://') || q.includes('.')

  if (isCommandOrUrl) {
    let target = q.replace(/^scan\s+/, '').trim()
    filteredItems.push({
      id: 'cmd-scan-direct',
      category: 'COMMAND EXECUTION',
      title: `Run Security Scan: ${target || 'https://...'}`,
      subtitle: 'Execute passive vulnerability audit across TLS, headers, and cookies',
      icon: Play,
      isCommand: true,
      action: async () => {
        if (!target) return
        if (!target.startsWith('http://') && !target.startsWith('https://')) {
          target = 'https://' + target
        }
        setExecuting(true)
        try {
          // Check if website already exists
          let site = websites.find(w => w.url.toLowerCase() === target.toLowerCase() || (w.host && target.includes(w.host)))
          if (!site) {
            toast.info(`Registering new target endpoint: ${target}`)
            const addRes = await api.post(`/organizations/${organizationId}/websites`, {
              url: target,
              verificationMethod: 'DNS_TXT',
              attestAuthorization: true
            })
            site = addRes.data
          }

          if (site.verified) {
            toast.success(`Launching passive scanner on ${site.url}...`)
            const scanRes = await api.post(`/websites/${site.id}/scans`)
            setOpen(false)
            navigate(`/scans/${scanRes.data.id}`)
          } else {
            toast.info(`Target must be verified before scan. Navigating to verification challenge...`)
            setOpen(false)
            navigate(`/websites/${site.id}`)
          }
        } catch (err) {
          toast.error(err.response?.data?.message || 'Failed to execute scan command')
        } finally {
          setExecuting(false)
        }
      }
    })
  }

  // Add nav & websites that match query
  const matchingNav = navSuggestions.filter(item => 
    !q || item.title.toLowerCase().includes(q) || item.subtitle.toLowerCase().includes(q)
  )
  const matchingWebsites = websiteSuggestions.filter(item =>
    !q || item.title.toLowerCase().includes(q) || item.subtitle.toLowerCase().includes(q)
  )

  filteredItems = [...filteredItems, ...matchingNav, ...matchingWebsites]

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action()
      }
    } else if (e.key === 'Escape' || e.key === 'Esc') {
      e.preventDefault()
      e.stopPropagation()
      setOpen(false)
    }
  }

  if (!open) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/75 backdrop-blur-sm">
        {/* Backdrop click dismiss */}
        <div className="fixed inset-0" onClick={() => setOpen(false)} />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -10 }}
          transition={{ duration: 0.15 }}
          className="relative w-full max-w-2xl bg-[#112240] border border-[#64FFDA]/30 rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.6)] overflow-hidden z-10 flex flex-col font-sans text-white"
        >
          {/* Top Clean Terminal Input Bar */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#1E2D4A] bg-[#0A192F]">
            <Terminal className="h-4 w-4 text-[#64FFDA] shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setSelectedIndex(0)
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search fleet, navigate, or type scan https://..."
              className="w-full bg-transparent text-sm font-mono text-white placeholder:text-[#8892B0] outline-none"
            />
            {executing ? (
              <span className="text-xs font-mono text-[#64FFDA] animate-pulse shrink-0">
                EXECUTING...
              </span>
            ) : (
              <button
                onClick={() => setOpen(false)}
                title="Close (Esc)"
                className="text-[#8892B0] hover:text-white p-1 rounded transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Results List */}
          <div className="max-h-80 overflow-y-auto p-2 space-y-1">
            {filteredItems.length === 0 ? (
              <div className="py-8 text-center text-xs font-mono text-[#8892B0]">
                No matching commands or target endpoints found.
              </div>
            ) : (
              filteredItems.map((item, idx) => {
                const Icon = item.icon
                const isSelected = idx === selectedIndex

                return (
                  <div
                    key={item.id}
                    onClick={() => item.action()}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#1E2D4A] border border-[#64FFDA]/50 text-white shadow-sm'
                        : 'hover:bg-[#1E2D4A]/50 text-[#CCD6F6] border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-[#64FFDA]/15 text-[#64FFDA]'
                          : 'bg-[#0A192F] text-[#8892B0]'
                      }`}>
                        <Icon className="h-4 w-4" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold truncate">
                            {item.title}
                          </span>
                          <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded uppercase ${
                            item.category === 'COMMAND EXECUTION'
                              ? 'bg-[#64FFDA]/15 text-[#64FFDA] border border-[#64FFDA]/30'
                              : 'bg-[#0A192F] text-[#8892B0]'
                          }`}>
                            {item.category}
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-[#8892B0] truncate">
                          {item.subtitle}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 ml-3">
                      {isSelected && (
                        <span className="text-[10px] font-mono text-[#64FFDA] flex items-center gap-1">
                          Run <CornerDownLeft className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Clean Integrated Footer */}
          <div className="px-4 py-2.5 border-t border-[#1E2D4A] bg-[#0A192F] flex items-center justify-between text-[11px] font-mono text-[#8892B0]">
            <span className="flex items-center gap-1.5 text-[#64FFDA]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#64FFDA] animate-pulse"></span>
              SENTINEL CLI // READY
            </span>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-[#112240] rounded border border-[#1E2D4A] text-white">↑</kbd>
                <kbd className="px-1.5 py-0.5 bg-[#112240] rounded border border-[#1E2D4A] text-white">↓</kbd>
                <span>navigate</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-[#112240] rounded border border-[#1E2D4A] text-white">↵</kbd>
                <span>select</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-[#112240] rounded border border-[#1E2D4A] text-white">esc</kbd>
                <span>close</span>
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
