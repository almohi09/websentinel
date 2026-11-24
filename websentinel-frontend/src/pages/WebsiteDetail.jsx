import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { toast } from 'sonner'

export default function WebsiteDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [website, setWebsite] = useState(null)
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [scanning, setScanning] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/websites/${id}`)
      setWebsite(res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  const verify = async () => {
    setVerifying(true)
    try {
      await api.post(`/websites/${id}/verify`)
      toast.success('Website verified!')
      load()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Verification failed')
    } finally {
      setVerifying(false)
    }
  }

  const startScan = async () => {
    setScanning(true)
    try {
      const res = await api.post(`/websites/${id}/scans`)
      navigate(`/scans/${res.data.id}`)
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to start scan')
    } finally {
      setScanning(false)
    }
  }

  if (loading) return <p>Loading...</p>
  if (!website) return <p>Not found</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold break-all">{website.url}</h1>
        <Badge variant={website.verified ? 'default' : 'secondary'}>
          {website.verified ? 'Verified' : 'Unverified'}
        </Badge>
      </div>

      <Card>
        <CardHeader><CardTitle>Details</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div><span className="text-muted-foreground">Host:</span> {website.host}</div>
          <div><span className="text-muted-foreground">Method:</span> {website.verificationMethod}</div>
          <div><span className="text-muted-foreground">Created:</span> {new Date(website.createdAt).toLocaleString()}</div>
          {website.verifiedAt && <div><span className="text-muted-foreground">Verified at:</span> {new Date(website.verifiedAt).toLocaleString()}</div>}
        </CardContent>
      </Card>

      {!website.verified && (
        <Card>
          <CardHeader><CardTitle>Verify ownership</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Place this token to prove ownership:
            </p>
            <code className="block bg-muted p-3 rounded-md text-sm break-all">{website.verificationToken}</code>
            <p className="text-sm text-muted-foreground">
              {website.verificationMethod === 'DNS_TXT' && 'Add a DNS TXT record for your domain containing the token above.'}
              {website.verificationMethod === 'HTML_FILE' && 'Create a file at /.well-known/websentinel-verify.txt containing the token.'}
              {website.verificationMethod === 'META_TAG' && 'Add <meta name="websentinel-verification" content="TOKEN"> to your homepage.'}
            </p>
            <Button onClick={verify} disabled={verifying}>
              {verifying ? 'Verifying...' : 'Verify now'}
            </Button>
          </CardContent>
        </Card>
      )}

      {website.verified && (
        <Card>
          <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
          <CardContent>
            <Button onClick={startScan} disabled={scanning}>
              {scanning ? 'Starting...' : 'Run passive scan'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}