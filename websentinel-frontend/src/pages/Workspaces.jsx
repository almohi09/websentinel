import { useEffect, useState } from 'react'
import api from '../lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog'

export default function Workspaces() {
  const [orgs, setOrgs] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState('company')

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get('/organizations')
      setOrgs(res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const create = async (e) => {
    e.preventDefault()
    await api.post('/organizations', { name, type })
    setOpen(false)
    setName('')
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Workspaces</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Create workspace</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New workspace</DialogTitle></DialogHeader>
            <form onSubmit={create} className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <select className="w-full border rounded-md p-2 bg-background" value={type} onChange={(e) => setType(e.target.value)}>
                  <option value="company">Company</option>
                  <option value="client">Client</option>
                </select>
              </div>
              <DialogFooter>
                <Button type="submit">Create</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? <p>Loading...</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orgs.map((org) => (
            <Card key={org.id}>
              <CardHeader>
                <CardTitle>{org.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground capitalize">{org.type}</p>
                <p className="text-xs text-muted-foreground mt-2">Created {new Date(org.createdAt).toLocaleDateString()}</p>
              </CardContent>
            </Card>
          ))}
          {orgs.length === 0 && <p className="text-muted-foreground">No workspaces yet.</p>}
        </div>
      )}
    </div>
  )
}