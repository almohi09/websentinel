import { useEffect, useState } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import api from '../../lib/api'
import { Button } from '../ui/button'
import { Separator } from '../ui/separator'
import { LayoutDashboard, Globe, Building2, LogOut, Shield, Terminal, Search, ChevronDown, CheckCircle2 } from 'lucide-react'
import CommandPalette from './CommandPalette'

const navItems = [
  { to: '/dashboard', label: 'Command Center', icon: LayoutDashboard },
  { to: '/websites', label: 'Target Fleet', icon: Globe },
  { to: '/workspaces', label: 'Workspaces', icon: Building2 },
]

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((s) => s.user)
  const organizationId = useAuthStore((s) => s.organizationId)
  const setOrganization = useAuthStore((s) => s.setOrganization)
  const logout = useAuthStore((s) => s.logout)

  const [orgs, setOrgs] = useState([])
  const [paletteOpen, setPaletteOpen] = useState(false)

  // Listen for global Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setPaletteOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/organizations')
        setOrgs(res.data)
        if (!organizationId && res.data.length > 0) {
          setOrganization(res.data[0].id)
        }
      } catch (err) {
        console.error('Failed to load organizations', err)
      }
    })()
  }, [organizationId, setOrganization])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const currentOrg = orgs.find((o) => o.id === organizationId) || orgs[0]

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 selection:text-primary">
      {/* SIDEBAR */}
      <aside className="w-64 border-r border-border bg-[#071324] flex flex-col shrink-0">
        {/* LOGO & BRAND */}
        <div className="p-5 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shadow-[0_0_15px_-3px_rgba(100,255,218,0.3)]">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <div className="font-bold text-sm tracking-wider uppercase text-white font-mono">WebSentinel</div>
            <div className="text-[10px] text-muted-foreground font-mono">CYBER OPS ENGINE</div>
          </div>
        </div>

        {/* WORKSPACE FLEET SWITCHER */}
        <div className="px-4 py-2">
          <div className="bg-[#112240] border border-border/80 rounded-lg p-2.5">
            <div className="text-[9px] font-mono tracking-widest text-muted-foreground uppercase mb-1">Fleet Workspace</div>
            {orgs.length > 1 ? (
              <select
                className="w-full bg-transparent text-xs font-medium text-foreground outline-none cursor-pointer"
                value={organizationId || ''}
                onChange={(e) => setOrganization(e.target.value)}
              >
                {orgs.map((o) => (
                  <option key={o.id} value={o.id} className="bg-[#112240] text-foreground">
                    {o.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex items-center justify-between text-xs font-medium text-white">
                <span className="truncate">{currentOrg ? currentOrg.name : "Default Workspace"}</span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </div>
            )}
          </div>
        </div>

        <Separator className="bg-border/60 my-2" />

        {/* NAVIGATION */}
        <nav className="flex-1 px-3 py-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = location.pathname.startsWith(item.to)
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  active
                    ? 'bg-[#16243D] text-primary border border-primary/30 shadow-[0_0_12px_-4px_rgba(100,255,218,0.25)]'
                    : 'text-muted-foreground hover:bg-[#112240] hover:text-foreground'
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <Separator className="bg-border/60" />

        {/* USER PROFILE FOOTER */}
        <div className="p-4 bg-[#071324] border-t border-border/50">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center font-bold text-xs text-primary shrink-0">
              {(user?.fullName || user?.email || 'U')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-white truncate">
                {user?.fullName && user.fullName !== user.email
                  ? user.fullName
                  : (user?.email ? user.email.split('@')[0] : 'Security Operator')}
              </div>
              <div className="text-[10px] text-muted-foreground truncate" title={user?.email}>
                {user?.email}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="mt-3 w-full justify-start text-xs text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
            onClick={handleLogout}
          >
            <LogOut className="h-3.5 w-3.5 mr-2" /> Disconnect Session
          </Button>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0A192F]">
        {/* TOP COMMAND OMNIBAR */}
        <header className="h-14 border-b border-border bg-[#0A192F]/80 backdrop-blur-md px-6 flex items-center justify-between shrink-0 sticky top-0 z-10">
          {/* OMNIBAR COMMAND INPUT (CLICK OR CTRL+K TO OPEN PALETTE) */}
          <div 
            onClick={() => setPaletteOpen(true)}
            className="flex items-center gap-2 max-w-xl w-full bg-[#112240] border border-border/80 hover:border-primary/50 rounded-md px-3 py-1.5 cursor-pointer transition-all shadow-inner group"
          >
            <span className="text-primary font-mono text-xs font-bold">{">"}</span>
            <span className="text-xs font-mono text-muted-foreground group-hover:text-white flex-1 truncate">
              websentinel scan --target:https://example.com [CLI Console]
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] font-mono text-primary bg-[#0A192F] px-1.5 py-0.5 rounded border border-primary/40 font-bold shadow-sm">
                Ctrl + K
              </span>
              <span className="text-[10px] font-mono text-muted-foreground bg-[#0A192F] px-1.5 py-0.5 rounded border border-border/60">
                [↵ RUN]
              </span>
            </div>
          </div>

          {/* TELEMETRY BEACON & STATUS */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-[#112240] border border-border px-3 py-1 rounded-full text-[11px] font-mono text-primary">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span>SENTINEL ENGINE: ONLINE</span>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-auto p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>

        {/* CYBER COMMAND PALETTE CLI */}
        <CommandPalette open={paletteOpen} setOpen={setPaletteOpen} />
      </div>
    </div>
  )
}