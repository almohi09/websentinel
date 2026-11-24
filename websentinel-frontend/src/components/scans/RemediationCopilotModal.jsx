import { useState, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { 
  Sparkles, 
  Copy, 
  Check, 
  Terminal, 
  FileCode, 
  CheckCircle2, 
  RefreshCw, 
  ExternalLink,
  ShieldCheck,
  Server
} from 'lucide-react'
import { toast } from 'sonner'
import { SUPPORTED_SERVERS, generateServerPatch } from '../../lib/serverPatchGenerator'

export default function RemediationCopilotModal({
  open,
  onOpenChange,
  finding,
  website,
  onStatusUpdate
}) {
  const [selectedServer, setSelectedServer] = useState('nginx')
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedReload, setCopiedReload] = useState(false)
  const [copiedVerify, setCopiedVerify] = useState(false)

  const patch = useMemo(() => {
    if (!finding) return null
    return generateServerPatch({ ...finding, host: website?.host || 'yourdomain.com' }, selectedServer)
  }, [finding, selectedServer, website])

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text)
    if (type === 'code') {
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    } else if (type === 'reload') {
      setCopiedReload(true)
      setTimeout(() => setCopiedReload(false), 2000)
    } else if (type === 'verify') {
      setCopiedVerify(true)
      setTimeout(() => setCopiedVerify(false), 2000)
    }
    toast.success('Copied to clipboard')
  }

  if (!finding || !patch) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#112240] border-[#1E2D4A] text-white w-full sm:max-w-2xl max-h-[90vh] flex flex-col p-6 shadow-2xl">
        <DialogHeader className="space-y-2 border-b border-[#1E2D4A] pb-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-lg border border-[#64FFDA]/40 bg-[#64FFDA]/15 flex items-center justify-center text-[#64FFDA]">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-mono font-bold text-white flex items-center gap-2">
                  <span>AI Remediation Copilot</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#64FFDA]/15 text-[#64FFDA] border border-[#64FFDA]/30">
                    SERVER PATCH GENERATOR
                  </span>
                </DialogTitle>
                <p className="text-xs text-[#8892B0] font-mono mt-0.5">
                  Production-ready infrastructure configuration patch
                </p>
              </div>
            </div>

            <Badge className="bg-[#FF3366]/15 text-[#FF3366] border-[#FF3366]/30 font-mono text-[11px] uppercase font-bold">
              {finding.severity}
            </Badge>
          </div>

          <div className="pt-1">
            <span className="text-xs font-mono font-bold text-[#CCD6F6]">
              Target Finding: <span className="text-white font-extrabold">{finding.title}</span>
            </span>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2 flex-1 overflow-y-auto pr-1">
          {/* Server Selection Tabs */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#8892B0] flex items-center gap-1.5">
              <Server className="h-3.5 w-3.5 text-[#64FFDA]" />
              Select Web Server / Edge Stack:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {SUPPORTED_SERVERS.map((srv) => {
                const isSelected = selectedServer === srv.id
                return (
                  <button
                    key={srv.id}
                    onClick={() => setSelectedServer(srv.id)}
                    className={`px-3 py-2 rounded-lg border font-mono text-xs font-bold transition-all text-center ${
                      isSelected
                        ? 'border-[#64FFDA] bg-[#64FFDA]/15 text-[#64FFDA] shadow-[0_0_15px_rgba(100,255,218,0.15)] ring-1 ring-[#64FFDA]/50'
                        : 'border-[#1E2D4A] bg-[#0A192F] text-[#8892B0] hover:border-[#64FFDA]/40 hover:text-white'
                    }`}
                  >
                    {srv.name}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Configuration Code Block */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-[#8892B0]">
              <span className="flex items-center gap-1.5 text-white font-bold">
                <FileCode className="h-4 w-4 text-[#64FFDA]" />
                <span>{patch.filePath}</span>
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(patch.code, 'code')}
                className="h-7 px-2.5 bg-[#0A192F] hover:bg-[#1E2D4A] border-[#1E2D4A] text-xs font-mono text-[#64FFDA]"
              >
                {copiedCode ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                {copiedCode ? 'Copied Code' : 'Copy Config'}
              </Button>
            </div>

            <div className="relative rounded-xl border border-[#1E2D4A] bg-[#0A192F] p-4 font-mono text-xs text-[#64FFDA] overflow-x-auto select-all shadow-inner">
              <pre className="whitespace-pre leading-relaxed">{patch.code}</pre>
            </div>
          </div>

          {/* Explanation Box */}
          {patch.explanation && (
            <div className="p-3 rounded-lg bg-[#0A192F]/60 border border-[#1E2D4A] text-xs font-mono text-[#8892B0]">
              <span className="text-[#64FFDA] font-bold">Security Objective: </span>
              {patch.explanation}
            </div>
          )}

          {/* Server Validation & Reload Command */}
          {patch.reloadCommand && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono text-[#8892B0]">
                <span className="flex items-center gap-1.5">
                  <Terminal className="h-3.5 w-3.5 text-[#64FFDA]" />
                  Reload Server Command:
                </span>
                <button
                  onClick={() => copyToClipboard(patch.reloadCommand, 'reload')}
                  className="text-xs text-[#64FFDA] hover:underline flex items-center gap-1"
                >
                  {copiedReload ? 'Copied' : 'Copy command'}
                </button>
              </div>
              <div className="p-2.5 rounded-lg bg-[#0A192F] border border-[#1E2D4A] font-mono text-xs text-[#CCD6F6] select-all overflow-x-auto">
                $ {patch.reloadCommand}
              </div>
            </div>
          )}

          {/* Verification Probe Command */}
          {patch.verifyCommand && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono text-[#8892B0]">
                <span className="flex items-center gap-1.5">
                  <RefreshCw className="h-3.5 w-3.5 text-[#64FFDA]" />
                  Live Verification Probe:
                </span>
                <button
                  onClick={() => copyToClipboard(patch.verifyCommand, 'verify')}
                  className="text-xs text-[#64FFDA] hover:underline flex items-center gap-1"
                >
                  {copiedVerify ? 'Copied' : 'Copy probe'}
                </button>
              </div>
              <div className="p-2.5 rounded-lg bg-[#0A192F] border border-[#1E2D4A] font-mono text-xs text-[#CCD6F6] select-all overflow-x-auto">
                $ {patch.verifyCommand}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <DialogFooter className="pt-4 border-t border-[#1E2D4A] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-mono text-[#8892B0]">Mark Finding:</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                onStatusUpdate(finding.id, 'IN_PROGRESS')
                onOpenChange(false)
              }}
              className="h-8 border-[#1E2D4A] bg-[#0A192F] hover:bg-[#1E2D4A] font-mono text-xs text-[#F59E0B]"
            >
              IN PROGRESS
            </Button>
            <Button
              size="sm"
              onClick={() => {
                onStatusUpdate(finding.id, 'RESOLVED')
                onOpenChange(false)
              }}
              className="h-8 bg-[#64FFDA]/15 hover:bg-[#64FFDA] hover:text-[#0A192F] border border-[#64FFDA]/30 font-mono text-xs text-[#64FFDA] font-bold"
            >
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
              RESOLVED
            </Button>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto border-[#1E2D4A] bg-[#0A192F] hover:bg-[#1E2D4A] text-xs font-mono text-[#CCD6F6]"
          >
            Close Copilot
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
