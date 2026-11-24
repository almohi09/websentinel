import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { toast } from 'sonner'

const SEVERITY_COLOR = {
  CRITICAL: 'bg-red-600 text-white',
  HIGH: 'bg-orange-600 text-white',
  MEDIUM: 'bg-amber-500 text-white',
  LOW: 'bg-blue-500 text-white',
  INFORMATIONAL: 'bg-gray-500 text-white',
}

export default function ScanDetail() {
  const { id } = useParams()
  const [scan, setScan] = useState(null)
  const [findings, setFindings] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const s = await api.get(`/scans/${id}`)
      setScan(s.data)
      if (s.data.status === 'COMPLETED') {
        const f = await api.get(`/scans/${id}/findings`)
        setFindings(f.data)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const interval = setInterval(async () => {
      const s = await api.get(`/scans/${id}`)
      setScan(s.data)
      if (s.data.status === 'COMPLETED') {
        const f = await api.get(`/scans/${id}/findings`)
        setFindings(f.data)
        clearInterval(interval)
      } else if (s.data.status === 'FAILED') {
        clearInterval(interval)
      }
    }, 2000)
    return () => clearInterval(interval)
  }, [id])

  const updateStatus = async (findingId, status) => {
    try {
      await api.put(`/findings/${findingId}/status`, { status })
      setFindings((prev) => prev.map((f) => (f.id === findingId ? { ...f, status } : f)))
      toast.success('Status updated')
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed')
    }
  }

  if (loading) return <p>Loading...</p>
  if (!scan) return <p>Not found</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Scan Results</h1>
        <Badge>{scan.status}</Badge>
      </div>

      <Card>
        <CardContent className="p-4 text-sm space-y-1">
          <div>Scan ID: {scan.id}</div>
          <div>Website: {scan.websiteId}</div>
          <div>Type: {scan.scanType}</div>
          <div>Started: {scan.startedAt ? new Date(scan.startedAt).toLocaleString() : '—'}</div>
          <div>Completed: {scan.completedAt ? new Date(scan.completedAt).toLocaleString() : '—'}</div>
          {scan.errorMessage && <div className="text-destructive">Error: {scan.errorMessage}</div>}
        </CardContent>
      </Card>

      {scan.status === 'RUNNING' || scan.status === 'PENDING' ? (
        <Card><CardContent className="p-6 text-center text-muted-foreground">Scan in progress... polling every 2s.</CardContent></Card>
      ) : null}

      {findings.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Findings ({findings.length})</h2>
          {findings.map((f) => (
            <Card key={f.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium">{f.title}</div>
                  <span className={`text-xs px-2 py-1 rounded ${SEVERITY_COLOR[f.severity]}`}>{f.severity}</span>
                </div>
                <p className="text-sm text-muted-foreground">{f.description}</p>
                {f.evidence && (
                  <div className="text-xs bg-muted p-2 rounded">
                    <span className="font-semibold">Evidence:</span> {f.evidence}
                  </div>
                )}
                {f.remediation && (
                  <div className="text-sm">
                    <span className="font-semibold">Remediation:</span> {f.remediation}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Select value={f.status} onValueChange={(v) => updateStatus(f.id, v)}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OPEN">Open</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="RESOLVED">Resolved</SelectItem>
                      <SelectItem value="ACCEPTED_RISK">Accepted Risk</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}