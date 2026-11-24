import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog'

export default function Websites() {
  const navigate = useNavigate()
  const [orgs, setOrgs] = useState([])
  const [orgId, setOrgId] = useState('')
  const [websites, setWebsites] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState('')
  const [method, setMethod] = useState('DNS_TXT')
  const [attest, setAttest] = useState(false)

  useEffect(() => {
    (async () => {
      const res = await api.get('/organizations')
      setOrgs(res.data)
      if (res.data.length) setOrgId(res.data[0].id)
    })()
  }, [])

  const loadWebsites = async (id) => {
    if (!id) return
    setLoading(true)
    try {
      const res = await api.get(`/organizations/${id}/websites`)
      setWebsites(res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadWebsites(orgId) }, [orgId])

  const add = async (e) => {
    e.preventDefault()
    await api.post(`/organizations/${orgId}/websites`, {
      url, verificationMethod: method, attestAuthorization: attest,
    })
    setOpen(false)
    setUrl('')
    setAttest(false)
    loadWebsites(orgId)
  }

  const remove = async (id) => {
    if (!confirm('Remove this website?')) return
    await api.delete(`/websites/${id}`)
    loadWebsites(orgId)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Websites</h1>
        <div className="flex items-center gap-3">
          {orgs.length > 1 && (
            <select className="border rounded-md p-2 bg-background" value={orgId} onChange={(e) => setOrgId(e.target.value)}>
              {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          )}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>Add website</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add website</DialogTitle></DialogHeader>
              <form onSubmit={add} className="space-y-4">
                <div className="space-y-2">
                  <Label>URL</Label>
                  <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com" required />
                </div>
                <div className="space-y-2">
                  <Label>Verification method</Label>
                  <select className="w-full border rounded-md p-2 bg-background" value={method} onChange={(e) => setMethod(e.target.value)}>
                    <option value="DNS_TXT">DNS TXT</option>
                    <option value="HTML_FILE">HTML file</option>
                    <option value="META_TAG">Meta tag</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="attest" checked={attest} onChange={(e) => setAttest(e.target.checked)} />
                  <Label htmlFor="attest">I am authorized to scan this website</Label>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={!attest}>Add</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? <p>Loading...</p> : (
        <div className="space-y-3">
          {websites.map((w) => (
            <Card key={w.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium">{w.url}</div>
                  <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                    <Badge variant={w.verified ? 'default' : 'secondary'}>
                      {w.verified ? 'Verified' : 'Unverified'}
                    </Badge>
                    <span>{w.verificationMethod}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!w.verified && (
                    <Button variant="outline" size="sm" onClick={() => navigate(`/websites/${w.id}`)}>
                      Verify
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => navigate(`/websites/${w.id}`)}>
                    Details
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => remove(w.id)}>
                    Remove
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {websites.length === 0 && <p className="text-muted-foreground">No websites yet. Add one to get started.</p>}
        </div>
      )}
    </div>
  )
}