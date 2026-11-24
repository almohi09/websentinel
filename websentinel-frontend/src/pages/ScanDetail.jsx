import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { 
  ShieldAlert, 
  ShieldCheck, 
  ArrowLeft, 
  RefreshCw, 
  Copy, 
  Check, 
  Terminal, 
  CheckCircle2, 
  Clock, 
  FileCode, 
  AlertTriangle, 
  Filter,
  ExternalLink,
  Lock,
  Layers,
  FileDown,
  Sparkles
} from 'lucide-react'
import { toast } from 'sonner'
import { generateSecurityReportPdf } from '../lib/pdfReportGenerator'
import RemediationCopilotModal from '../components/scans/RemediationCopilotModal'

const SEVERITY_CONFIG = {
  CRITICAL: {
    bg: 'bg-[#FF3366]/15',
    text: 'text-[#FF3366]',
    border: 'border-[#FF3366]/40',
    dot: 'bg-[#FF3366]',
  },
  HIGH: {
    bg: 'bg-orange-500/15',
    text: 'text-orange-400',
    border: 'border-orange-500/40',
    dot: 'bg-orange-400',
  },
  MEDIUM: {
    bg: 'bg-[#F59E0B]/15',
    text: 'text-[#F59E0B]',
    border: 'border-[#F59E0B]/40',
    dot: 'bg-[#F59E0B]',
  },
  LOW: {
    bg: 'bg-[#64FFDA]/15',
    text: 'text-[#64FFDA]',
    border: 'border-[#64FFDA]/40',
    dot: 'bg-[#64FFDA]',
  },
  INFORMATIONAL: {
    bg: 'bg-[#8892B0]/15',
    text: 'text-[#CCD6F6]',
    border: 'border-[#1E2D4A]',
    dot: 'bg-[#8892B0]',
  },
}

export default function ScanDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [scan, setScan] = useState(null)
  const [website, setWebsite] = useState(null)
  const [findings, setFindings] = useState([])
  const [loading, setLoading] = useState(true)
  const [exportingPdf, setExportingPdf] = useState(false)
  const [activeSeverityFilter, setActiveSeverityFilter] = useState('ALL')
  const [copiedEvidenceId, setCopiedEvidenceId] = useState(null)
  const [updatingId, setUpdatingId] = useState(null)
  const [copilotFinding, setCopilotFinding] = useState(null)
  const [copilotOpen, setCopilotOpen] = useState(false)

  const load = async () => {
    try {
      const s = await api.get(`/scans/${id}`)
      setScan(s.data)
      if (s.data?.websiteId) {
        try {
          const w = await api.get(`/websites/${s.data.websiteId}`)
          setWebsite(w.data)
        } catch (e) {
          console.error('Target fetch error', e)
        }
      }
      if (s.data.status === 'COMPLETED') {
        const f = await api.get(`/scans/${id}/findings`)
        setFindings(f.data || [])
      }
    } catch (err) {
      console.error('Failed to load scan', err)
      toast.error('Could not fetch scan details')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPdf = () => {
    if (!scan) return
    setExportingPdf(true)
    try {
      const filename = generateSecurityReportPdf({
        scan,
        website,
        findings
      })
      toast.success(`Executive PDF report downloaded: ${filename}`)
    } catch (err) {
      console.error('PDF generation error', err)
      toast.error('Failed to generate PDF report')
    } finally {
      setExportingPdf(false)
    }
  }

  useEffect(() => {
    load()
    const interval = setInterval(async () => {
      try {
        const s = await api.get(`/scans/${id}`)
        setScan(s.data)
        if (s.data.status === 'COMPLETED') {
          const f = await api.get(`/scans/${id}/findings`)
          setFindings(f.data || [])
          clearInterval(interval)
        } else if (s.data.status === 'FAILED') {
          clearInterval(interval)
        }
      } catch (err) {
        clearInterval(interval)
      }
    }, 2000)
    return () => clearInterval(interval)
  }, [id])

  const updateStatus = async (findingId, status) => {
    setUpdatingId(findingId)
    try {
      await api.put(`/findings/${findingId}/status`, { status })
      setFindings((prev) => prev.map((f) => (f.id === findingId ? { ...f, status } : f)))
      toast.success(`Finding marked as ${status}`)
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update finding status')
    } finally {
      setUpdatingId(null)
    }
  }

  const copyEvidence = (text, findingId) => {
    navigator.clipboard.writeText(text)
    setCopiedEvidenceId(findingId)
    toast.success('Evidence copied to clipboard')
    setTimeout(() => setCopiedEvidenceId(null), 2000)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-40 bg-[#112240] rounded animate-pulse"></div>
        <div className="h-44 bg-[#112240] rounded-xl border border-[#1E2D4A] animate-pulse"></div>
      </div>
    )
  }

  if (!scan) {
    return (
      <div className="p-12 text-center rounded-xl bg-[#112240] border border-[#1E2D4A] space-y-3">
        <ShieldAlert className="h-10 w-10 mx-auto text-[#FF3366]" />
        <h2 className="text-xl font-bold text-white">Scan Record Not Found</h2>
        <Button onClick={() => navigate('/websites')} variant="outline" className="border-[#1E2D4A] text-white">
          Return to Fleet
        </Button>
      </div>
    )
  }

  const isRunning = scan.status === 'RUNNING' || scan.status === 'PENDING'
  const isFailed = scan.status === 'FAILED'
  const isCompleted = scan.status === 'COMPLETED'

  const filteredFindings = findings.filter((f) => {
    if (activeSeverityFilter === 'ALL') return true
    return f.severity === activeSeverityFilter
  })

  const criticalCount = findings.filter(f => f.severity === 'CRITICAL').length
  const highCount = findings.filter(f => f.severity === 'HIGH').length
  const mediumCount = findings.filter(f => f.severity === 'MEDIUM').length
  const lowCount = findings.filter(f => f.severity === 'LOW' || f.severity === 'INFORMATIONAL').length

  return (
    <div className="space-y-6">
      {/* Back Navigation & Breadcrumb */}
      <div className="flex flex-col gap-3">
        <button
          onClick={() => navigate(scan.websiteId ? `/websites/${scan.websiteId}` : '/websites')}
          className="inline-flex items-center gap-1.5 text-xs font-mono text-[#8892B0] hover:text-[#64FFDA] transition-colors self-start"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Target Details
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1E2D4A] pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-mono font-black text-white flex items-center gap-2">
                <Terminal className="h-6 w-6 text-[#64FFDA]" />
                Security Advisory Dossier
              </h1>
              <span className={`inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1 rounded-full border ${
                isCompleted
                  ? 'border-[#64FFDA]/40 bg-[#64FFDA]/10 text-[#64FFDA]'
                  : isRunning
                  ? 'border-[#F59E0B]/40 bg-[#F59E0B]/10 text-[#F59E0B]'
                  : 'border-[#FF3366]/40 bg-[#FF3366]/10 text-[#FF3366]'
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${isCompleted ? 'bg-[#64FFDA]' : isRunning ? 'bg-[#F59E0B] animate-ping' : 'bg-[#FF3366]'}`}></span>
                {scan.status}
              </span>
            </div>
            <p className="text-xs text-[#8892B0] font-mono">
              Execution UUID: <span className="text-[#CCD6F6]">{scan.id}</span> • Type: <span className="text-[#64FFDA]">{scan.scanType || 'PASSIVE_AUDIT'}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isCompleted && (
              <Button
                size="sm"
                onClick={handleDownloadPdf}
                disabled={exportingPdf}
                className="bg-[#64FFDA] text-[#0A192F] hover:bg-[#64FFDA]/90 font-mono text-xs font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(100,255,218,0.25)]"
              >
                <FileDown className="h-3.5 w-3.5 mr-1.5" />
                {exportingPdf ? 'Compiling PDF...' : 'Executive PDF Report'}
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={load}
              className="bg-[#112240] border-[#1E2D4A] text-xs font-mono text-[#CCD6F6] hover:text-[#64FFDA]"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh Telemetry
            </Button>
          </div>
        </div>
      </div>

      {/* Telemetry Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#112240] border border-[#1E2D4A] space-y-1">
          <div className="text-[11px] font-mono text-[#8892B0] uppercase">Target Entity ID</div>
          <div className="text-xs font-mono font-bold text-white truncate">{scan.websiteId}</div>
        </div>

        <div className="p-4 rounded-xl bg-[#112240] border border-[#1E2D4A] space-y-1">
          <div className="text-[11px] font-mono text-[#8892B0] uppercase">Execution Window</div>
          <div className="text-xs font-mono text-[#CCD6F6]">
            {scan.startedAt ? new Date(scan.startedAt).toLocaleTimeString() : 'N/A'} →{' '}
            {scan.completedAt ? new Date(scan.completedAt).toLocaleTimeString() : 'In Progress'}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#112240] border border-[#1E2D4A] space-y-1">
          <div className="text-[11px] font-mono text-[#8892B0] uppercase">Identified Vulnerabilities</div>
          <div className="text-lg font-mono font-black text-white flex items-center gap-2">
            <span>{findings.length} Findings</span>
            {findings.length > 0 && <span className="text-xs font-normal text-[#FF3366]">({criticalCount} Critical)</span>}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#112240] border border-[#1E2D4A] space-y-1">
          <div className="text-[11px] font-mono text-[#8892B0] uppercase">Engine Status</div>
          <div className="text-xs font-mono font-bold text-[#64FFDA]">
            {isRunning ? 'PROBES ACTIVE (POLLING)' : isCompleted ? 'SCAN FINALIZED' : 'TERMINATED WITH ERROR'}
          </div>
        </div>
      </div>

      {/* Running / Polling Radar Visualizer */}
      {isRunning && (
        <Card className="bg-[#112240] border-[#64FFDA]/30 shadow-[0_0_30px_rgba(100,255,218,0.05)] overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative flex items-center justify-center shrink-0">
                <div className="h-20 w-20 rounded-full border-2 border-[#64FFDA]/30 animate-spin border-t-[#64FFDA]"></div>
                <RefreshCw className="h-8 w-8 text-[#64FFDA] absolute animate-pulse" />
              </div>

              <div className="space-y-2 text-center sm:text-left flex-1">
                <h3 className="text-lg font-mono font-bold text-white flex items-center justify-center sm:justify-start gap-2">
                  <span>Probing Target Attack Surface...</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-[#64FFDA]/10 text-[#64FFDA] font-mono">LIVE</span>
                </h3>
                <p className="text-xs text-[#8892B0] font-mono">
                  WebSentinel passive scanner is conducting non-destructive audits: HTTP Armor headers, TLS handshake suites, Cookie isolation flags, and DNS rebinding protections. Polling every 2.0s.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                  {['DNS Validation', 'TLS Certificate', 'Header Armor', 'Cookie Flags'].map((step, idx) => (
                    <div key={step} className="p-2 rounded bg-[#0A192F] border border-[#1E2D4A] text-center">
                      <div className="text-[10px] font-mono text-[#64FFDA]">STEP 0{idx + 1}</div>
                      <div className="text-xs font-mono text-[#CCD6F6]">{step}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Banner */}
      {isFailed && (
        <Card className="bg-[#FF3366]/10 border-[#FF3366]/50">
          <CardContent className="p-4 flex items-center gap-3">
            <ShieldAlert className="h-6 w-6 text-[#FF3366] shrink-0" />
            <div>
              <div className="font-mono text-sm font-bold text-white">Scan Execution Failed</div>
              <div className="font-mono text-xs text-[#FF3366]">{scan.errorMessage || 'An error occurred during scan execution.'}</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Findings Section */}
      {isCompleted && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1E2D4A] pb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-[#64FFDA]" />
              <h2 className="text-lg font-mono font-bold text-white">Security Findings</h2>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#1E2D4A] text-[#CCD6F6]">
                {filteredFindings.length} of {findings.length}
              </span>
            </div>

            {/* Severity Filter Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: 'ALL', label: `ALL (${findings.length})` },
                { id: 'CRITICAL', label: `CRIT (${criticalCount})`, color: 'text-[#FF3366]' },
                { id: 'HIGH', label: `HIGH (${highCount})`, color: 'text-orange-400' },
                { id: 'MEDIUM', label: `MED (${mediumCount})`, color: 'text-[#F59E0B]' },
                { id: 'LOW', label: `LOW (${lowCount})`, color: 'text-[#64FFDA]' },
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => setActiveSeverityFilter(pill.id)}
                  className={`px-2.5 py-1 rounded text-xs font-mono transition-all ${
                    activeSeverityFilter === pill.id
                      ? 'bg-[#64FFDA] text-[#0A192F] font-bold shadow'
                      : 'bg-[#112240] border border-[#1E2D4A] text-[#8892B0] hover:text-white'
                  }`}
                >
                  <span className={activeSeverityFilter === pill.id ? '' : pill.color}>{pill.label}</span>
                </button>
              ))}
            </div>
          </div>

          {findings.length === 0 ? (
            <div className="p-12 text-center rounded-xl bg-[#112240] border border-[#1E2D4A] space-y-3">
              <ShieldCheck className="h-12 w-12 mx-auto text-[#64FFDA]" />
              <h3 className="text-base font-bold text-white">Clean Security Posture</h3>
              <p className="text-xs text-[#8892B0] max-w-md mx-auto">
                No vulnerabilities or misconfigurations detected for the evaluated baseline rules. All security headers, TLS ciphers, and cookie configurations satisfy the inspection threshold.
              </p>
            </div>
          ) : filteredFindings.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-[#112240] border border-[#1E2D4A] text-[#8892B0] text-xs font-mono">
              No findings match severity filter: {activeSeverityFilter}
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {filteredFindings.map((f, idx) => {
                  const cfg = SEVERITY_CONFIG[f.severity] || SEVERITY_CONFIG.INFORMATIONAL

                  return (
                    <motion.div
                      key={f.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.2, delay: idx * 0.03 }}
                    >
                      <Card className="bg-[#112240] border-[#1E2D4A] hover:border-[#64FFDA]/40 transition-all shadow-md">
                        <CardHeader className="pb-3 border-b border-[#1E2D4A]/60">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-[11px] font-mono px-2 py-0.5 rounded border font-bold ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                                  {f.severity}
                                </span>
                                <h3 className="font-mono text-base font-bold text-white">{f.title}</h3>
                              </div>
                              <div className="text-[11px] font-mono text-[#8892B0]">
                                Finding Ref: #{f.id.slice(0, 8)}
                              </div>
                            </div>

                            {/* Status Updater Select */}
                            <div className="flex items-center gap-2 self-start sm:self-auto">
                              <span className="text-xs font-mono text-[#8892B0]">Status:</span>
                              <Select
                                value={f.status}
                                onValueChange={(val) => updateStatus(f.id, val)}
                                disabled={updatingId === f.id}
                              >
                                <SelectTrigger className="w-36 h-8 bg-[#0A192F] border-[#1E2D4A] font-mono text-xs text-white">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-[#112240] border-[#1E2D4A] text-white font-mono text-xs">
                                  <SelectItem value="OPEN">OPEN</SelectItem>
                                  <SelectItem value="IN_PROGRESS">IN PROGRESS</SelectItem>
                                  <SelectItem value="RESOLVED">RESOLVED</SelectItem>
                                  <SelectItem value="ACCEPTED_RISK">ACCEPTED RISK</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent className="pt-4 space-y-4">
                          {/* Description */}
                          <p className="text-xs sm:text-sm text-[#CCD6F6] leading-relaxed">
                            {f.description}
                          </p>

                          {/* Technical Evidence Terminal Block */}
                          {f.evidence && (
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-[11px] font-mono text-[#8892B0]">
                                <span className="flex items-center gap-1.5 text-[#64FFDA]">
                                  <Terminal className="h-3.5 w-3.5" />
                                  Observed Evidence & Response Headers
                                </span>
                                <button
                                  onClick={() => copyEvidence(f.evidence, f.id)}
                                  className="hover:text-white flex items-center gap-1"
                                >
                                  {copiedEvidenceId === f.id ? (
                                    <>
                                      <Check className="h-3 w-3 text-[#64FFDA]" />
                                      <span className="text-[#64FFDA]">Copied</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="h-3 w-3" />
                                      <span>Copy Evidence</span>
                                    </>
                                  )}
                                </button>
                              </div>
                              <div className="p-3 bg-[#0A192F] border border-[#1E2D4A] rounded-lg font-mono text-xs text-[#64FFDA] break-all whitespace-pre-wrap select-all">
                                {f.evidence}
                              </div>
                            </div>
                          )}

                          {/* Actionable Remediation Patch */}
                          {f.remediation && (
                            <div className="p-3.5 rounded-lg bg-[#0A192F] border border-[#1E2D4A] space-y-2">
                              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-white">
                                <FileCode className="h-4 w-4 text-[#64FFDA]" />
                                <span>Recommended Patch / Mitigation</span>
                              </div>
                              <div className="text-xs text-[#8892B0] font-mono leading-relaxed">
                                {f.remediation}
                              </div>
                            </div>
                          )}

                          {/* AI Remediation Copilot Trigger */}
                          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-[#1E2D4A]/60">
                            <Button
                              size="sm"
                              onClick={() => {
                                setCopilotFinding(f)
                                setCopilotOpen(true)
                              }}
                              className="h-8 bg-[#64FFDA]/15 hover:bg-[#64FFDA] hover:text-[#0A192F] border border-[#64FFDA]/40 font-mono text-xs text-[#64FFDA] font-bold transition-all group self-start shadow-sm"
                            >
                              <Sparkles className="h-3.5 w-3.5 mr-1.5 text-[#64FFDA] group-hover:text-[#0A192F]" />
                              <span>Generate Server Config Patch</span>
                            </Button>

                            <span className="text-[11px] font-mono text-[#8892B0]">
                              Stacks: Nginx • Apache • Cloudflare • Next.js • Caddy
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {/* AI Remediation Copilot Modal */}
      <RemediationCopilotModal
        open={copilotOpen}
        onOpenChange={setCopilotOpen}
        finding={copilotFinding}
        website={website}
        onStatusUpdate={updateStatus}
      />
    </div>
  )
}
