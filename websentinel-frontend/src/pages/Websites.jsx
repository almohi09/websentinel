import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../lib/api'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog'
import { 
  Globe, 
  ShieldCheck, 
  ShieldAlert, 
  Plus, 
  Search, 
  ExternalLink, 
  Copy, 
  Check, 
  Trash2, 
  FileCode, 
  Radio, 
  Tag, 
  ChevronRight,
  AlertTriangle,
  Server,
  Lock,
  Clock
} from 'lucide-react'
import { toast } from 'sonner'

export default function Websites() {
  const navigate = useNavigate()
  const [orgs, setOrgs] = useState([])
  const [orgId, setOrgId] = useState('')
  const [websites, setWebsites] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterVerified, setFilterVerified] = useState('ALL')
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState('')
  const [method, setMethod] = useState('DNS_TXT')
  const [attest, setAttest] = useState(false)
  const [copiedId, setCopiedId] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/organizations')
        setOrgs(res.data)
        if (res.data.length) setOrgId(res.data[0].id)
      } catch (e) {
        console.error('Failed to load orgs', e)
      }
    })()
  }, [])

  const loadWebsites = async (id) => {
    if (!id) return
    setLoading(true)
    try {
      const res = await api.get(`/organizations/${id}/websites`)
      setWebsites(res.data)
    } catch (e) {
      console.error('Failed to load websites', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (orgId) loadWebsites(orgId)
  }, [orgId])

  const add = async (e) => {
    e.preventDefault()
    if (!attest) {
      toast.error('Attestation of scanning authority is mandatory.')
      return
    }
    setSubmitting(true)
    try {
      await api.post(`/organizations/${orgId}/websites`, {
        url,
        verificationMethod: method,
        attestAuthorization: attest,
      })
      toast.success('Target host registered successfully')
      setOpen(false)
      setUrl('')
      setAttest(false)
      loadWebsites(orgId)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to register host')
    } finally {
      setSubmitting(false)
    }
  }

  const remove = async (id, e) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to decommission and remove this target?')) return
    try {
      await api.delete(`/websites/${id}`)
      toast.success('Target removed')
      loadWebsites(orgId)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete target')
    }
  }

  const copyToClipboard = (text, id, e) => {
    e.stopPropagation()
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    toast.success('Copied URL to clipboard')
    setTimeout(() => setCopiedId(null), 2000)
  }

  const filtered = websites.filter((w) => {
    const matchesSearch = w.url.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (w.host && w.host.toLowerCase().includes(searchQuery.toLowerCase()))
    if (!matchesSearch) return false
    if (filterVerified === 'VERIFIED') return w.verified
    if (filterVerified === 'UNVERIFIED') return !w.verified
    return true
  })

  const verifiedCount = websites.filter(w => w.verified).length
  const pendingCount = websites.length - verifiedCount

  return (
    <div className="space-y-6">
      {/* Fleet Command Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#1E2D4A] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2 w-2 rounded-full bg-[#64FFDA] animate-pulse"></span>
            <span className="text-xs font-mono uppercase tracking-widest text-[#64FFDA]">Perimeter Assets</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            Target Fleet
          </h1>
          <p className="text-sm text-[#8892B0] mt-1">
            Registered endpoints, verification protocols, and passive scanner targets.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {orgs.length > 1 && (
            <div className="relative">
              <select
                className="h-10 px-3 pr-8 rounded-lg border border-[#1E2D4A] bg-[#112240] text-sm text-[#CCD6F6] font-mono focus:outline-none focus:border-[#64FFDA]"
                value={orgId}
                onChange={(e) => setOrgId(e.target.value)}
              >
                {orgs.map((o) => (
                  <option key={o.id} value={o.id}>
                    Fleet: {o.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="h-10 bg-[#64FFDA] text-[#0A192F] hover:bg-[#64FFDA]/90 font-mono text-xs font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(100,255,218,0.2)]">
                <Plus className="h-4 w-4 mr-1.5" />
                Register Target
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#112240] border-[#1E2D4A] text-white max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold flex items-center gap-2 text-white">
                  <Server className="h-5 w-5 text-[#64FFDA]" />
                  Register Security Target
                </DialogTitle>
                <p className="text-xs text-[#8892B0]">
                  Target endpoint will be assigned a verification token before security probes are enabled.
                </p>
              </DialogHeader>

              <form onSubmit={add} className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-[#8892B0] font-mono">Target Host URL</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-3 h-4 w-4 text-[#8892B0]" />
                    <Input
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://app.sentinel.dev"
                      required
                      className="pl-9 bg-[#0A192F] border-[#1E2D4A] font-mono text-sm text-white focus-visible:ring-[#64FFDA]"
                    />
                  </div>
                  <span className="text-[11px] text-[#8892B0]">Target must be an accessible, valid domain (HTTP/HTTPS).</span>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-[#8892B0] font-mono">Ownership Verification Method</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'DNS_TXT', label: 'DNS TXT', icon: Radio, desc: 'Add record' },
                      { id: 'HTML_FILE', label: 'HTML File', icon: FileCode, desc: '/.well-known/' },
                      { id: 'META_TAG', label: 'Meta Tag', icon: Tag, desc: '<meta ...>' },
                    ].map((m) => {
                      const Icon = m.icon
                      const active = method === m.id
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setMethod(m.id)}
                          className={`p-3 rounded-lg border text-left transition-all ${
                            active
                              ? 'border-[#64FFDA] bg-[#64FFDA]/10 text-white'
                              : 'border-[#1E2D4A] bg-[#0A192F] text-[#8892B0] hover:border-[#64FFDA]/50'
                          }`}
                        >
                          <Icon className={`h-4 w-4 mb-1.5 ${active ? 'text-[#64FFDA]' : 'text-[#8892B0]'}`} />
                          <div className="text-xs font-bold font-mono">{m.label}</div>
                          <div className="text-[10px] opacity-75">{m.desc}</div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-[#0A192F] border border-[#1E2D4A] space-y-2">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="attest"
                      checked={attest}
                      onChange={(e) => setAttest(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-[#1E2D4A] bg-[#112240] accent-[#64FFDA] cursor-pointer"
                    />
                    <Label htmlFor="attest" className="text-xs text-[#CCD6F6] cursor-pointer leading-relaxed">
                      <span className="font-bold text-[#64FFDA] block mb-0.5">Attestation of Authorization</span>
                      I certify that I am the owner or have explicit authorized consent to perform security telemetry and passive vulnerability scanning on this host.
                    </Label>
                  </div>
                </div>

                <DialogFooter className="pt-2">
                  <Button
                    type="submit"
                    disabled={!attest || submitting}
                    className="w-full bg-[#64FFDA] text-[#0A192F] hover:bg-[#64FFDA]/90 font-mono text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                  >
                    {submitting ? 'Registering...' : 'Provision Target & Generate Token'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Fleet Telemetry Stats & Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-[#112240] border border-[#1E2D4A] flex items-center justify-between">
          <div>
            <div className="text-xs font-mono text-[#8892B0] uppercase">Total Endpoints</div>
            <div className="text-2xl font-black text-white font-mono mt-0.5">{websites.length}</div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-[#1E2D4A]/50 flex items-center justify-center text-[#64FFDA]">
            <Globe className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#112240] border border-[#1E2D4A] flex items-center justify-between">
          <div>
            <div className="text-xs font-mono text-[#8892B0] uppercase">Verified & Active</div>
            <div className="text-2xl font-black text-[#64FFDA] font-mono mt-0.5">{verifiedCount}</div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-[#64FFDA]/10 flex items-center justify-center text-[#64FFDA]">
            <ShieldCheck className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#112240] border border-[#1E2D4A] flex items-center justify-between">
          <div>
            <div className="text-xs font-mono text-[#8892B0] uppercase">Pending Verification</div>
            <div className="text-2xl font-black text-[#F59E0B] font-mono mt-0.5">{pendingCount}</div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-[#F59E0B]/10 flex items-center justify-center text-[#F59E0B]">
            <ShieldAlert className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#8892B0]" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by hostname, protocol or domain..."
            className="pl-9 bg-[#112240] border-[#1E2D4A] font-mono text-sm text-white placeholder:text-[#8892B0] focus-visible:ring-[#64FFDA]"
          />
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-[#112240] border border-[#1E2D4A] rounded-lg p-1">
          {['ALL', 'VERIFIED', 'UNVERIFIED'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterVerified(tab)}
              className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all ${
                filterVerified === tab
                  ? 'bg-[#64FFDA] text-[#0A192F] font-bold shadow'
                  : 'text-[#8892B0] hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Target Nodes List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-[#112240] border border-[#1E2D4A] animate-pulse"></div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-[#112240] border border-[#1E2D4A] space-y-3">
          <Globe className="h-10 w-10 mx-auto text-[#8892B0]" />
          <div className="text-white font-medium">No target endpoints found</div>
          <p className="text-xs text-[#8892B0] max-w-sm mx-auto">
            {websites.length === 0
              ? 'Get started by registering your first target domain to conduct automated passive vulnerability checks.'
              : 'No targets match the current query filter.'}
          </p>
          {websites.length === 0 && (
            <Button
              onClick={() => setOpen(true)}
              className="mt-2 bg-[#64FFDA] text-[#0A192F] hover:bg-[#64FFDA]/90 font-mono text-xs font-bold"
            >
              Register First Target
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map((w, idx) => (
              <motion.div
                key={w.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, delay: idx * 0.04 }}
              >
                <div
                  onClick={() => navigate(`/websites/${w.id}`)}
                  className="group relative rounded-xl border border-[#1E2D4A] bg-[#112240] p-4.5 hover:border-[#64FFDA]/50 hover:shadow-[0_4px_25px_rgba(0,0,0,0.3)] transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className={`h-11 w-11 rounded-lg border flex items-center justify-center shrink-0 ${
                      w.verified
                        ? 'border-[#64FFDA]/30 bg-[#64FFDA]/10 text-[#64FFDA]'
                        : 'border-[#F59E0B]/30 bg-[#F59E0B]/10 text-[#F59E0B]'
                    }`}>
                      {w.verified ? <ShieldCheck className="h-6 w-6" /> : <ShieldAlert className="h-6 w-6" />}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-base font-bold text-white group-hover:text-[#64FFDA] transition-colors">
                          {w.url}
                        </span>
                        <button
                          onClick={(e) => copyToClipboard(w.url, w.id, e)}
                          title="Copy URL"
                          className="text-[#8892B0] hover:text-[#64FFDA] p-1 rounded transition-colors"
                        >
                          {copiedId === w.id ? <Check className="h-3.5 w-3.5 text-[#64FFDA]" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      </div>

                      <div className="flex items-center gap-2.5 text-xs text-[#8892B0] font-mono flex-wrap">
                        <span className="flex items-center gap-1.5">
                          <span className={`h-1.5 w-1.5 rounded-full ${w.verified ? 'bg-[#64FFDA]' : 'bg-[#F59E0B]'}`}></span>
                          {w.verified ? 'VERIFIED' : 'ACTION REQUIRED'}
                        </span>
                        <span>•</span>
                        <span>Method: {w.verificationMethod || 'DNS_TXT'}</span>
                        {w.host && (
                          <>
                            <span>•</span>
                            <span className="text-[#CCD6F6]">Host: {w.host}</span>
                          </>
                        )}
                        {w.verified && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-[10px] text-[#64FFDA] bg-[#64FFDA]/10 border border-[#64FFDA]/30 px-1.5 py-0.5 rounded">
                              <Lock className="h-2.5 w-2.5" /> TLS 1.3
                            </span>
                            <span className="flex items-center gap-1 text-[10px] text-[#CCD6F6] bg-[#0A192F] border border-[#1E2D4A] px-1.5 py-0.5 rounded">
                              <Clock className="h-2.5 w-2.5 text-[#64FFDA]" />
                              {(() => {
                                try {
                                  const saved = localStorage.getItem(`ws_cadence_${w.id}`)
                                  return saved ? (JSON.parse(saved).cadence || 'DAILY') : 'DAILY'
                                } catch (e) {
                                  return 'DAILY'
                                }
                              })()}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                    {!w.verified ? (
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/websites/${w.id}`)
                        }}
                        className="h-8 bg-[#F59E0B]/10 border border-[#F59E0B]/40 text-[#F59E0B] hover:bg-[#F59E0B]/20 font-mono text-xs font-semibold"
                      >
                        Verify Token
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/websites/${w.id}`)
                        }}
                        className="h-8 bg-[#64FFDA]/10 border border-[#64FFDA]/40 text-[#64FFDA] hover:bg-[#64FFDA]/20 font-mono text-xs font-semibold"
                      >
                        Target Dossier
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => remove(w.id, e)}
                      title="Decommission target"
                      className="h-8 w-8 p-0 text-[#8892B0] hover:text-[#FF3366] hover:bg-[#FF3366]/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>

                    <ChevronRight className="h-4 w-4 text-[#8892B0] group-hover:text-[#64FFDA] transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
