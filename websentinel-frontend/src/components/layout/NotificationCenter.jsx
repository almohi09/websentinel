import { useEffect, useState, useRef } from 'react'
import { Bell, Check, ShieldAlert, AlertTriangle, CheckCircle2, RefreshCw, Zap, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/api'
import { toast } from 'sonner'

export default function NotificationCenter({ organizationId }) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [triggering, setTriggering] = useState(false)
  const dropdownRef = useRef(null)

  const loadNotifications = async () => {
    if (!organizationId) return
    try {
      const res = await api.get(`/organizations/${organizationId}/notifications`)
      const list = res.data || []
      setNotifications(list)
      const unread = list.filter((n) => !n.read).length
      setUnreadCount(unread)
    } catch (err) {
      // Graceful fallback if backend is offline or starting
      console.debug('Could not fetch notifications', err)
    }
  }

  // Poll for notifications every 15s
  useEffect(() => {
    loadNotifications()
    const interval = setInterval(loadNotifications, 15000)
    return () => clearInterval(interval)
  }, [organizationId])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const markAsRead = async (id, e) => {
    e.stopPropagation()
    try {
      await api.put(`/organizations/${organizationId}/notifications/${id}/read`)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      )
      setUnreadCount((c) => Math.max(0, c - 1))
    } catch (err) {
      console.error(err)
    }
  }

  const markAllRead = async () => {
    try {
      await api.put(`/organizations/${organizationId}/notifications/read-all`)
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)
      toast.success('All security alerts marked as read')
    } catch (err) {
      toast.error('Failed to update notifications')
    }
  }

  const triggerMonitoringBatch = async () => {
    setTriggering(true)
    try {
      const res = await api.post(`/organizations/${organizationId}/monitoring/trigger-now`)
      toast.success(res.data.message || 'Automated recurring scan cycle triggered!')
      loadNotifications()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to trigger batch monitoring')
    } finally {
      setTriggering(false)
    }
  }

  const getIcon = (type) => {
    switch (type) {
      case 'CRITICAL_ALERT':
        return <ShieldAlert className="h-4 w-4 text-[#FF3366]" />
      case 'SECURITY_ALERT':
        return <AlertTriangle className="h-4 w-4 text-[#F59E0B]" />
      case 'SCAN_COMPLETED':
        return <CheckCircle2 className="h-4 w-4 text-[#64FFDA]" />
      default:
        return <Zap className="h-4 w-4 text-[#38BDF8]" />
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* BELL BUTTON */}
      <button
        onClick={() => {
          setOpen((prev) => !prev)
          if (!open) loadNotifications()
        }}
        className="relative p-2 rounded-lg bg-[#112240] border border-[#1E2D4A] hover:border-[#64FFDA]/50 text-[#CCD6F6] hover:text-[#64FFDA] transition-all cursor-pointer group"
        title="Security Alert Dispatcher"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-[#FF3366] text-white text-[9px] font-mono font-bold shadow-[0_0_10px_rgba(255,51,102,0.6)] animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* DROPDOWN FLYOUT */}
      {open && (
        <div className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] rounded-xl bg-[#0D1F38] border border-[#1E2D4A] shadow-[0_10px_35px_rgba(0,0,0,0.6)] z-50 overflow-hidden font-sans">
          {/* HEADER */}
          <div className="p-3.5 bg-[#112240] border-b border-[#1E2D4A] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold tracking-wider text-white uppercase">
                Alert Dispatcher
              </span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-[#FF3366]/20 text-[#FF3366] border border-[#FF3366]/40 font-bold">
                  {unreadCount} UNREAD
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[10px] font-mono text-[#64FFDA] hover:underline"
                >
                  Mark All Read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="text-[#8892B0] hover:text-white p-0.5"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* NOTIFICATION FEED */}
          <div className="max-h-80 overflow-y-auto divide-y divide-[#1E2D4A]/60">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-[#8892B0] space-y-1">
                <Check className="h-6 w-6 mx-auto text-[#64FFDA]" />
                <div className="text-xs font-medium text-white">All Clear</div>
                <p className="text-[11px]">No active security incident alerts logged.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => {
                    if (!n.read) markAsRead(n.id, { stopPropagation: () => {} })
                    navigate('/websites')
                  }}
                  className={`p-3.5 transition-all cursor-pointer flex items-start gap-3 ${
                    n.read ? 'bg-transparent opacity-75' : 'bg-[#112240]/40'
                  } hover:bg-[#162B4D]`}
                >
                  <div className="p-1.5 rounded-lg bg-[#0A192F] border border-[#1E2D4A] shrink-0 mt-0.5">
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs font-semibold text-white truncate">
                        {n.title}
                      </div>
                      {!n.read && (
                        <span className="h-1.5 w-1.5 rounded-full bg-[#64FFDA] shrink-0"></span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#8892B0] line-clamp-2 leading-relaxed">
                      {n.message}
                    </p>
                    <div className="flex items-center justify-between pt-1 text-[10px] font-mono text-[#8892B0]">
                      <span>{new Date(n.createdAt).toLocaleTimeString()}</span>
                      {!n.read && (
                        <button
                          onClick={(e) => markAsRead(n.id, e)}
                          className="text-[#64FFDA] hover:underline"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* FOOTER: TRIGGER AUTOMATED RECURRING BATCH NOW */}
          <div className="p-2.5 bg-[#0A192F] border-t border-[#1E2D4A] flex items-center justify-between">
            <span className="text-[10px] font-mono text-[#8892B0]">
              Cadence: <span className="text-[#64FFDA]">Quartz 02:00 UTC</span>
            </span>
            <button
              onClick={triggerMonitoringBatch}
              disabled={triggering}
              className="px-2.5 py-1 rounded bg-[#112240] hover:bg-[#64FFDA] border border-[#1E2D4A] hover:border-[#64FFDA] text-[#CCD6F6] hover:text-[#0A192F] text-[10px] font-mono font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {triggering ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                <Zap className="h-3 w-3 fill-current" />
              )}
              {triggering ? 'Triggering...' : 'Run Cadence Now'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
