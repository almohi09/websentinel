import { useEffect, useState } from 'react'
import api from '../lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Skeleton } from '../components/ui/skeleton'

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ websites: 0, orgs: 0 })

  useEffect(() => {
    (async () => {
      try {
        const orgs = await api.get('/organizations')
        let totalWebsites = 0
        for (const org of orgs.data) {
          const ws = await api.get(`/organizations/${org.id}/websites`)
          totalWebsites += ws.data.length
        }
        setStats({ orgs: orgs.data.length, websites: totalWebsites })
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {loading ? (
          <>
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </>
        ) : (
          <>
            <Card>
              <CardHeader><CardTitle className="text-sm text-muted-foreground">Workspaces</CardTitle></CardHeader>
              <CardContent><div className="text-3xl font-bold">{stats.orgs}</div></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm text-muted-foreground">Websites</CardTitle></CardHeader>
              <CardContent><div className="text-3xl font-bold">{stats.websites}</div></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm text-muted-foreground">Scans</CardTitle></CardHeader>
              <CardContent><div className="text-3xl font-bold">—</div></CardContent>
            </Card>
          </>
        )}
      </div>
      <Card>
        <CardHeader><CardTitle>Getting started</CardTitle></CardHeader>
        <CardContent className="text-muted-foreground">
          Add a workspace, register a website, verify ownership, then run your first passive scan.
        </CardContent>
      </Card>
    </div>
  )
}