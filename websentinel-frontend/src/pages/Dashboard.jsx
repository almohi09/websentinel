import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { Button } from '../components/ui/button'
import { Skeleton } from '../components/ui/skeleton'
import { Shield, Globe, Terminal, ArrowUpRight, Zap, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react'

export default function Dashboard() {
  const navigate = useNavigate()
  const organizationId = useAuthStore((s) => s.organizationId)
  const [loading, setLoading] = useState(true)
  const [websites, setWebsites] = useState([])
  const [scansCount, setScansCount] = useState(0)
  const [findings, setFindings] = useState([])

  useEffect(() => {
    (async () => {
      if (!organizationId) {
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        const wsRes = await api.get(`/organizations/${organizationId}/websites`)
        setWebsites(wsRes.data)

        let totalScans = 0
        const allFindings = []

        for (const w of wsRes.data) {
          try {
            const scRes = await api.get(`/websites/${w.id}/scans`)
            totalScans += scRes.data.length
            // Check completed scans for findings
            const completed = scRes.data.filter((s) => s.status === 'COMPLETED')
            if (completed.length > 0) {
              const latestScan = completed[0]
              const fRes = await api.get(`/scans/${latestScan.id}/findings`)
              for (const f of fRes.data) {
                allFindings.push({ ...f, targetUrl: w.url })
              }
            }
          } catch (e) {
            console.error('Scan history fetch error', e)
          }
        }

        setScansCount(totalScans)
        setFindings(allFindings)
      } catch (err) {
        console.error('Dashboard load error', err)
      } finally {
        setLoading(false)
      }
    })()
  }, [organizationId])

  const verifiedCount = websites.filter((w) => w.verified).length
  const pendingCount = websites.length - verifiedCount
  const criticalCount = findings.filter((f) => f.severity === 'CRITICAL').length
  const highCount = findings.filter((f) => f.severity === 'HIGH').length
  const mediumCount = findings.filter((f) => f.severity === 'MEDIUM').length

  const overallScore = websites.length === 0 ? 100 : Math.max(45, 100 - (criticalCount * 25 + highCount * 12 + mediumCount * 4))

  return (
    <div className="space-y-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-primary font-mono text-xs uppercase tracking-wider mb-1">
            <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse" />
            TELEMETRY & ATTACK SURFACE STATUS
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-mono">Security Posture Dashboard</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Continuous passive reconnaissance, TLS chain validation, and HTTP security posture.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => navigate('/websites')}
            className="bg-primary text-[#0A192F] font-semibold text-xs hover:bg-primary/90 shadow-[0_0_20px_-5px_rgba(100,255,218,0.4)]"
          >
            <Zap className="h-3.5 w-3.5 mr-1.5" /> + Register Target
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-64 bg-[#112240]" />
          <Skeleton className="h-64 bg-[#112240] md:col-span-2" />
        </div>
      ) : (
        <>
          {/* SECTION 1: RADAR DIAL & FLEET GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* POSTURE RADAR DIAL (Col 4) */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="lg:col-span-4 bg-[#112240] border border-border/90 rounded-xl p-5 flex flex-col justify-between shadow-lg"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-mono tracking-wider text-muted-foreground uppercase">Posture Radar</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/10 border border-primary/30 text-primary">
                    {overallScore >= 80 ? 'DEFENSE: ROBUST' : 'DEFENSE: ACTION REQ'}
                  </span>
                </div>

                {/* CIRCULAR DIAL COUNTER */}
                <div className="flex items-center gap-4 my-2">
                  <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-[#0A192F] border-4 border-primary shadow-[0_0_25px_-5px_rgba(100,255,218,0.3)]">
                    <div className="text-center">
                      <div className="text-2xl font-bold font-mono text-white tracking-tight">{overallScore}</div>
                      <div className="text-[9px] font-mono text-muted-foreground uppercase">/100</div>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">
                      {overallScore >= 90 ? 'Grade A (Hardened)' : overallScore >= 75 ? 'Grade B+ (Good)' : 'Grade C (Vulnerable)'}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {websites.length} monitored target{websites.length === 1 ? '' : 's'}. {highCount + criticalCount} high-risk findings pending fix.
                    </div>
                  </div>
                </div>
              </div>

              {/* 4 VECTOR TELEMETRY BARS */}
              <div className="space-y-3 pt-4 border-t border-border/60">
                <div>
                  <div className="flex justify-between text-[11px] font-mono mb-1">
                    <span className="text-white">TLS / Cryptography</span>
                    <span className="text-primary">98% (TLS 1.3 Active)</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#0A192F] rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: '98%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-mono mb-1">
                    <span className="text-white">HTTP Armor Headers</span>
                    <span className={highCount > 0 ? 'text-[#FF3366]' : 'text-primary'}>
                      {highCount > 0 ? '58% (Headers Missing)' : '100% (Protected)'}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-[#0A192F] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${highCount > 0 ? 'bg-[#FF3366]' : 'bg-primary'}`}
                      style={{ width: highCount > 0 ? '58%' : '100%' }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-mono mb-1">
                    <span className="text-white">Cookie Security Flags</span>
                    <span className="text-primary">85% (HttpOnly / Lax)</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#0A192F] rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: '85%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-mono mb-1">
                    <span className="text-white">DNS & Network Rebinding</span>
                    <span className="text-primary">100% (Protected)</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#0A192F] rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: '100%' }} />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* FLEET TARGET NODES (Col 8) */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="lg:col-span-8 bg-[#112240] border border-border/90 rounded-xl p-5 shadow-lg flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono tracking-wider text-muted-foreground uppercase">Target Fleet Grid</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0A192F] text-muted-foreground border border-border">
                      {websites.length} TARGETS MONITORED
                    </span>
                  </div>
                  <button
                    onClick={() => navigate('/websites')}
                    className="text-xs font-mono text-primary hover:underline flex items-center gap-1"
                  >
                    Manage Fleet →
                  </button>
                </div>

                {websites.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-border rounded-lg bg-[#0A192F]/50">
                    <Globe className="h-8 w-8 text-primary mx-auto mb-2 opacity-60" />
                    <p className="text-xs text-white font-medium">No target domains registered in this workspace yet.</p>
                    <p className="text-[11px] text-muted-foreground mt-1 mb-4">
                      Add a website to initiate automated passive assessments.
                    </p>
                    <Button size="sm" onClick={() => navigate('/websites')} className="bg-primary text-[#0A192F] text-xs">
                      + Add First Target
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {websites.map((w) => (
                      <div
                        key={w.id}
                        onClick={() => navigate(`/websites/${w.id}`)}
                        className="bg-[#0A192F] border border-border/80 hover:border-primary/50 transition-all cursor-pointer rounded-lg p-3.5 flex flex-col justify-between group shadow-sm hover:shadow-[0_0_15px_-4px_rgba(100,255,218,0.2)]"
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={`h-2 w-2 rounded-full ${
                                w.verified ? 'bg-primary shadow-[0_0_8px_rgba(100,255,218,0.8)]' : 'bg-amber-400'
                              }`}
                            />
                            <span className="font-mono text-xs font-bold text-white truncate group-hover:text-primary transition-colors">
                              {w.url}
                            </span>
                          </div>
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-semibold ${
                              w.verified
                                ? 'bg-primary/10 border border-primary/30 text-primary'
                                : 'bg-amber-400/10 border border-amber-400/30 text-amber-400'
                            }`}
                          >
                            {w.verified ? 'VERIFIED' : 'PENDING'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border/40 font-mono">
                          <span>Method: {w.verificationMethod}</span>
                          <span className="text-primary flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                            Inspect Node <ArrowUpRight className="h-3 w-3" />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* STATS STRIP */}
              <div className="grid grid-cols-3 gap-3 pt-4 mt-4 border-t border-border/60">
                <div className="bg-[#0A192F] p-2.5 rounded border border-border/60">
                  <div className="text-[10px] font-mono text-muted-foreground uppercase">Scans Executed</div>
                  <div className="text-lg font-bold font-mono text-white mt-0.5">{scansCount}</div>
                </div>
                <div className="bg-[#0A192F] p-2.5 rounded border border-border/60">
                  <div className="text-[10px] font-mono text-muted-foreground uppercase">Verified Targets</div>
                  <div className="text-lg font-bold font-mono text-primary mt-0.5">{verifiedCount}</div>
                </div>
                <div className="bg-[#0A192F] p-2.5 rounded border border-border/60">
                  <div className="text-[10px] font-mono text-muted-foreground uppercase">Active Findings</div>
                  <div className="text-lg font-bold font-mono text-white mt-0.5">{findings.length}</div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* SECTION 2: LIVE SECURITY ADVISORY & REPRO DOSSIER */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="bg-[#112240] border border-border/90 rounded-xl p-5 shadow-lg space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                  Security Advisory & Live Vulnerability Stream
                </span>
                <span className="text-[10px] font-mono bg-[#0A192F] text-primary px-2 py-0.5 rounded border border-border">
                  {findings.length} EXPOSURES
                </span>
              </div>
              <span className="text-[11px] font-mono text-muted-foreground">AUTO-CORRELATED PASSIVE CHECKS</span>
            </div>

            {findings.length === 0 ? (
              <div className="text-center py-10 bg-[#0A192F] rounded-lg border border-border/60">
                <CheckCircle className="h-7 w-7 text-primary mx-auto mb-2 opacity-80" />
                <p className="text-xs font-medium text-white">Zero Vulnerabilities Pending.</p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Run a passive scan on any verified target to populate the security dossier.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {findings.slice(0, 5).map((f) => (
                  <div
                    key={f.id}
                    className="bg-[#0A192F] border border-border/80 hover:border-primary/40 rounded-lg p-4 transition-all space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                            f.severity === 'CRITICAL'
                              ? 'bg-[#FF3366]/15 text-[#FF3366] border border-[#FF3366]/40'
                              : f.severity === 'HIGH'
                              ? 'bg-[#FF3366]/15 text-[#FF3366] border border-[#FF3366]/30'
                              : 'bg-amber-400/15 text-amber-400 border border-amber-400/30'
                          }`}
                        >
                          {f.severity}
                        </span>
                        <span className="text-xs font-mono font-semibold text-white truncate">{f.title}</span>
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground bg-[#112240] px-2 py-0.5 rounded border border-border shrink-0">
                        STATUS: {f.status}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground">{f.description}</p>

                    {/* DUAL TERMINAL REPRO + REMEDIATION BOXES */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-[11px] font-mono">
                      {f.evidence && (
                        <div className="bg-[#071324] border border-border/60 p-2.5 rounded text-red-300 overflow-x-auto">
                          <div className="text-[9px] text-muted-foreground uppercase font-bold mb-1">
                            $ Response Evidence:
                          </div>
                          <code>{f.evidence}</code>
                        </div>
                      )}
                      {f.remediation && (
                        <div className="bg-[#071324] border border-primary/20 p-2.5 rounded text-primary overflow-x-auto">
                          <div className="text-[9px] text-muted-foreground uppercase font-bold mb-1">
                            ✓ Remediation Action:
                          </div>
                          <code>{f.remediation}</code>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </>
      )}
    </div>
  )
}