import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Badge } from '../components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog'
import { 
  Building2, 
  Plus, 
  ShieldCheck, 
  CheckCircle2, 
  Layers, 
  Calendar, 
  Server, 
  ArrowRight,
  ShieldAlert,
  Users,
  UserPlus,
  Trash2,
  Crown,
  Shield,
  Eye,
  Mail,
  UserCheck
} from 'lucide-react'
import { toast } from 'sonner'

const ROLE_CONFIG = {
  OWNER: {
    label: 'OWNER',
    bg: 'bg-amber-500/15',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    icon: Crown,
  },
  ADMIN: {
    label: 'ADMIN',
    bg: 'bg-[#FF3366]/15',
    text: 'text-[#FF3366]',
    border: 'border-[#FF3366]/30',
    icon: Shield,
  },
  MEMBER: {
    label: 'MEMBER',
    bg: 'bg-[#64FFDA]/15',
    text: 'text-[#64FFDA]',
    border: 'border-[#64FFDA]/30',
    icon: UserCheck,
  },
  VIEWER: {
    label: 'VIEWER',
    bg: 'bg-[#8892B0]/15',
    text: 'text-[#CCD6F6]',
    border: 'border-[#1E2D4A]',
    icon: Eye,
  },
}

export default function Workspaces() {
  const navigate = useNavigate()
  const [orgs, setOrgs] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState('company')
  const [creating, setCreating] = useState(false)

  // Team management modal state
  const [membersModalOpen, setMembersModalOpen] = useState(false)
  const [selectedOrgForMembers, setSelectedOrgForMembers] = useState(null)
  const [members, setMembers] = useState([])
  const [membersLoading, setMembersLoading] = useState(false)

  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('MEMBER')
  const [inviting, setInviting] = useState(false)

  const activeOrgId = useAuthStore((s) => s.organizationId)
  const setOrganization = useAuthStore((s) => s.setOrganization)
  const currentUser = useAuthStore((s) => s.user)

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get('/organizations')
      setOrgs(res.data || [])
      if (res.data?.length && !activeOrgId) {
        setOrganization(res.data[0].id)
      }
    } catch (e) {
      toast.error('Failed to load workspaces')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const create = async (e) => {
    e.preventDefault()
    setCreating(true)
    try {
      const res = await api.post('/organizations', { name, type })
      toast.success('Workspace created successfully')
      setOpen(false)
      setName('')
      load()
      if (res.data?.id) {
        setOrganization(res.data.id)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create workspace')
    } finally {
      setCreating(false)
    }
  }

  const handleSelectWorkspace = (id, name) => {
    setOrganization(id)
    toast.success(`Active workspace changed to ${name}`)
  }

  // Load team members for an org
  const openMembersModal = async (org) => {
    setSelectedOrgForMembers(org)
    setMembersModalOpen(true)
    setMembersLoading(true)
    try {
      const res = await api.get(`/organizations/${org.id}/members`)
      setMembers(res.data || [])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load team members')
    } finally {
      setMembersLoading(false)
    }
  }

  // Invite member
  const handleInvite = async (e) => {
    e.preventDefault()
    if (!inviteEmail || !selectedOrgForMembers) return
    setInviting(true)
    try {
      const res = await api.post(`/organizations/${selectedOrgForMembers.id}/invite`, {
        email: inviteEmail.trim(),
        role: inviteRole,
      })
      toast.success(`Invited ${inviteEmail} as ${inviteRole}!`)
      setInviteEmail('')
      // refresh members
      const updated = await api.get(`/organizations/${selectedOrgForMembers.id}/members`)
      setMembers(updated.data || [])
    } catch (err) {
      toast.error(err.response?.data?.message || 'User must be registered before being invited.')
    } finally {
      setInviting(false)
    }
  }

  // Change member role
  const handleRoleChange = async (memberId, newRole) => {
    if (!selectedOrgForMembers) return
    try {
      await api.put(`/organizations/${selectedOrgForMembers.id}/members/${memberId}`, {
        role: newRole,
      })
      setMembers(prev => prev.map(m => m.memberId === memberId ? { ...m, role: newRole } : m))
      toast.success(`Role updated to ${newRole}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update member role')
    }
  }

  // Remove member
  const handleRemoveMember = async (memberId, memberName) => {
    if (!selectedOrgForMembers) return
    if (!confirm(`Are you sure you want to remove ${memberName || 'this operator'} from the workspace?`)) return
    try {
      await api.delete(`/organizations/${selectedOrgForMembers.id}/members/${memberId}`)
      setMembers(prev => prev.filter(m => m.memberId !== memberId))
      toast.success('Team member removed')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove member')
    }
  }

  return (
    <div className="space-y-6">
      {/* Workspaces Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1E2D4A] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2 w-2 rounded-full bg-[#64FFDA] animate-pulse"></span>
            <span className="text-xs font-mono uppercase tracking-widest text-[#64FFDA]">Multi-Tenant Isolation</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            Fleet Workspaces & Teams
          </h1>
          <p className="text-sm text-[#8892B0] mt-1">
            Manage segregated tenant workspaces, invite security operators, and delegate role-based access.
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#64FFDA] text-[#0A192F] hover:bg-[#64FFDA]/90 font-mono text-xs font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(100,255,218,0.2)]">
              <Plus className="h-4 w-4 mr-1.5" />
              Provision Workspace
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#112240] border-[#1E2D4A] text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2 text-white">
                <Building2 className="h-5 w-5 text-[#64FFDA]" />
                New Fleet Workspace
              </DialogTitle>
              <p className="text-xs text-[#8892B0]">
                Provisions an isolated multi-tenant organization boundary for monitoring assets.
              </p>
            </DialogHeader>

            <form onSubmit={create} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-[#8892B0] font-mono">Workspace Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Acme Corp Security Ops"
                  required
                  className="bg-[#0A192F] border-[#1E2D4A] text-white font-mono text-sm focus-visible:ring-[#64FFDA]"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-[#8892B0] font-mono">Workspace Role / Scope</Label>
                <select
                  className="w-full h-10 px-3 rounded-md border border-[#1E2D4A] bg-[#0A192F] text-sm text-[#CCD6F6] font-mono focus:outline-none focus:border-[#64FFDA]"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  <option value="company">Enterprise Security Fleet (Company)</option>
                  <option value="client">Client Managed Infrastructure (Client)</option>
                  <option value="personal">Personal Dedicated Fleet (Personal)</option>
                </select>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="submit"
                  disabled={creating}
                  className="w-full bg-[#64FFDA] text-[#0A192F] hover:bg-[#64FFDA]/90 font-mono text-xs font-bold uppercase tracking-wider"
                >
                  {creating ? 'Provisioning...' : 'Confirm & Create Workspace'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Grid of Workspaces */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 rounded-xl bg-[#112240] border border-[#1E2D4A] animate-pulse"></div>
          ))}
        </div>
      ) : orgs.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-[#112240] border border-[#1E2D4A] space-y-3">
          <Building2 className="h-10 w-10 mx-auto text-[#8892B0]" />
          <div className="text-white font-medium">No workspaces configured</div>
          <p className="text-xs text-[#8892B0] max-w-sm mx-auto">
            Create an organization workspace to group monitored targets and isolation tokens.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orgs.map((org, idx) => {
            const isActive = activeOrgId === org.id

            return (
              <motion.div
                key={org.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.05 }}
              >
                <div
                  className={`relative p-5 rounded-xl border transition-all flex flex-col justify-between h-full bg-[#112240] overflow-hidden ${
                    isActive
                      ? 'border-[#64FFDA] shadow-[0_0_25px_rgba(100,255,218,0.15)] ring-1 ring-[#64FFDA]/50'
                      : 'border-[#1E2D4A] hover:border-[#64FFDA]/40'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={`h-10 w-10 rounded-lg border flex items-center justify-center shrink-0 ${
                          isActive
                            ? 'border-[#64FFDA]/40 bg-[#64FFDA]/15 text-[#64FFDA]'
                            : 'border-[#1E2D4A] bg-[#0A192F] text-[#8892B0]'
                        }`}>
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-mono text-base font-bold text-white truncate" title={org.name}>
                            {org.name}
                          </h3>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0A192F] text-[#8892B0] border border-[#1E2D4A] uppercase inline-block mt-0.5">
                            {org.type || 'Company'}
                          </span>
                        </div>
                      </div>

                      {isActive && (
                        <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-[#64FFDA] bg-[#64FFDA]/10 border border-[#64FFDA]/30 px-2 py-0.5 rounded-full shrink-0">
                          <CheckCircle2 className="h-3 w-3" /> ACTIVE
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5 pt-2 text-xs font-mono text-[#8892B0] border-t border-[#1E2D4A]">
                      <div className="flex items-center justify-between">
                        <span>Tenant Ref:</span>
                        <span className="text-[#CCD6F6] font-mono">#{org.id.slice(0, 8)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Created:</span>
                        <span className="text-[#CCD6F6]">
                          {org.createdAt ? new Date(org.createdAt).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-4 mt-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openMembersModal(org)}
                        className="w-full bg-[#0A192F] hover:bg-[#1E2D4A] border-[#1E2D4A] hover:border-[#64FFDA] text-[#CCD6F6] hover:text-[#64FFDA] font-mono text-xs font-semibold h-8 truncate"
                      >
                        <Users className="h-3.5 w-3.5 mr-1 text-[#64FFDA] shrink-0" />
                        <span>Team</span>
                      </Button>

                      {isActive ? (
                        <Button
                          size="sm"
                          onClick={() => navigate('/websites')}
                          className="w-full bg-[#64FFDA]/15 hover:bg-[#64FFDA] hover:text-[#0A192F] border border-[#64FFDA]/40 hover:border-[#64FFDA] text-[#64FFDA] font-mono text-xs font-semibold h-8 transition-all group"
                          title="Open monitored target fleet"
                        >
                          <span>Fleet</span>
                          <ArrowRight className="h-3 w-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleSelectWorkspace(org.id, org.name)}
                          className="w-full bg-[#0A192F] hover:bg-[#64FFDA] hover:text-[#0A192F] border border-[#1E2D4A] hover:border-[#64FFDA] text-[#CCD6F6] font-mono text-xs font-semibold h-8 transition-all group"
                        >
                          <span>Switch</span>
                          <ArrowRight className="h-3 w-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Team Members & Collaborators Modal */}
      <Dialog open={membersModalOpen} onOpenChange={setMembersModalOpen}>
        <DialogContent className="bg-[#112240] border-[#1E2D4A] text-white w-full sm:max-w-2xl max-h-[88vh] flex flex-col p-6 shadow-2xl">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-xl font-bold font-mono flex items-center gap-2.5 text-white">
              <Users className="h-5 w-5 text-[#64FFDA]" />
              Workspace Team & Role Governance
            </DialogTitle>
            <p className="text-xs text-[#8892B0] font-mono">
              Managing operators for <span className="text-[#64FFDA] font-bold">{selectedOrgForMembers?.name}</span>
            </p>
          </DialogHeader>

          {/* Invite Form */}
          <form onSubmit={handleInvite} className="p-4 rounded-xl bg-[#0A192F] border border-[#1E2D4A] space-y-3 mt-1">
            <div className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
              <UserPlus className="h-4 w-4 text-[#64FFDA]" />
              <span>Invite New Operator</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              <div className="relative flex-1 w-full">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-[#8892B0]" />
                <Input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="operator@company.com"
                  required
                  autoComplete="off"
                  className="pl-9 bg-[#112240] border-[#1E2D4A] font-mono text-xs text-white placeholder:text-[#8892B0] h-10 focus-visible:ring-[#64FFDA]"
                />
              </div>

              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="h-10 px-3 rounded-md border border-[#1E2D4A] bg-[#112240] font-mono text-xs text-[#CCD6F6] outline-none w-full sm:w-36 focus:border-[#64FFDA]"
              >
                <option value="ADMIN">ADMIN</option>
                <option value="MEMBER">MEMBER</option>
                <option value="VIEWER">VIEWER</option>
              </select>

              <Button
                type="submit"
                disabled={inviting || !inviteEmail}
                className="w-full sm:w-auto bg-[#64FFDA] text-[#0A192F] hover:bg-[#64FFDA]/90 font-mono text-xs font-bold uppercase tracking-wider shrink-0 h-10 px-4"
              >
                {inviting ? 'Inviting...' : 'Send Invite'}
              </Button>
            </div>
            <p className="text-[11px] text-[#8892B0] font-mono">
              * Note: The operator must already have registered an account on WebSentinel with this email.
            </p>
          </form>

          {/* Members List */}
          <div className="space-y-2.5 flex-1 max-h-[360px] overflow-y-auto pr-1 mt-1">
            <div className="text-xs font-mono uppercase tracking-wider text-[#8892B0] flex items-center justify-between py-1">
              <span>Active Operators ({members.length})</span>
              <span>Role Permissions</span>
            </div>

            {membersLoading ? (
              <div className="space-y-2">
                {[1, 2].map(i => (
                  <div key={i} className="h-16 rounded-xl bg-[#0A192F] border border-[#1E2D4A] animate-pulse"></div>
                ))}
              </div>
            ) : members.length === 0 ? (
              <div className="p-8 text-center text-xs font-mono text-[#8892B0]">
                No members found in this organization.
              </div>
            ) : (
              members.map((m) => {
                const roleConfig = ROLE_CONFIG[m.role] || ROLE_CONFIG.MEMBER
                const RoleIcon = roleConfig.icon
                const isSelf = currentUser?.id === m.userId
                const isOwner = m.role === 'OWNER'

                return (
                  <div
                    key={m.memberId}
                    className="p-3.5 rounded-xl bg-[#0A192F] border border-[#1E2D4A] hover:border-[#1E2D4A]/80 flex items-center justify-between gap-3 group transition-colors"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 border font-bold text-sm ${roleConfig.bg} ${roleConfig.border} ${roleConfig.text}`}>
                        {(m.fullName || m.email || 'U')[0].toUpperCase()}
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-sm font-bold text-white">
                            {m.fullName || m.email}
                          </span>
                          {isSelf && (
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#64FFDA]/15 text-[#64FFDA] border border-[#64FFDA]/30">
                              YOU
                            </span>
                          )}
                          {isOwner && (
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30 flex items-center gap-1">
                              <Crown className="h-3 w-3" /> OWNER
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-mono text-[#8892B0] flex items-center gap-2 flex-wrap">
                          <span>{m.email}</span>
                          <span>•</span>
                          <span>Joined {m.joinedAt ? new Date(m.joinedAt).toLocaleDateString() : 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Role Selector or Locked Owner Badge */}
                      {isOwner ? (
                        <div className="h-8 px-3 rounded-lg border border-[#F59E0B]/40 bg-[#F59E0B]/10 text-[#F59E0B] font-mono text-xs font-bold flex items-center gap-1.5">
                          <Crown className="h-3.5 w-3.5" />
                          <span>OWNER</span>
                        </div>
                      ) : (
                        <select
                          value={m.role}
                          onChange={(e) => handleRoleChange(m.memberId, e.target.value)}
                          className={`h-8 px-3 rounded-lg border font-mono text-xs font-bold outline-none cursor-pointer bg-[#112240] ${roleConfig.border} ${roleConfig.text}`}
                        >
                          <option value="ADMIN">ADMIN</option>
                          <option value="MEMBER">MEMBER</option>
                          <option value="VIEWER">VIEWER</option>
                        </select>
                      )}

                      {/* Remove Button (Cannot remove OWNER or yourself) */}
                      {!isOwner && !isSelf && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveMember(m.memberId, m.fullName || m.email)}
                          title="Remove operator"
                          className="h-8 w-8 p-0 text-[#8892B0] hover:text-[#FF3366] hover:bg-[#FF3366]/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <DialogFooter className="pt-3 border-t border-[#1E2D4A] flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setMembersModalOpen(false)}
              className="border-[#1E2D4A] bg-[#0A192F] hover:bg-[#1E2D4A] hover:text-[#64FFDA] text-xs font-mono text-[#CCD6F6] transition-all px-4"
            >
              Close Roster
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
