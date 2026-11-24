import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { useAuthStore } from '../../store/authStore'
import api from '../../lib/api'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Shield, Lock, Mail, ArrowRight, AlertCircle, KeyRound } from 'lucide-react'

const schema = z.object({
  email: z.string().email('Please enter a valid security operator email'),
  password: z.string().min(1, 'Password credentials required'),
})

export default function Login() {
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const setAuth = useAuthStore((s) => s.setAuth)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data) => {
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/auth/login', data)
      setAuth({ ...res.data, email: data.email })
      navigate('/dashboard', { replace: true })
    } catch (e) {
      setError(e.response?.data?.message || 'Authentication rejected. Verify credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A192F] p-4 relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#64FFDA]/5 rounded-full blur-[140px] pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Brand Header */}
        <div className="text-center mb-6 space-y-2">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-[#112240] border border-[#64FFDA]/40 shadow-[0_0_30px_rgba(100,255,218,0.2)] mb-2">
            <Shield className="h-7 w-7 text-[#64FFDA]" />
          </div>
          <div className="flex items-center justify-center gap-2">
            <span className="text-xl font-mono font-black tracking-tight text-white">WEB<span className="text-[#64FFDA]">SENTINEL</span></span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#64FFDA]/10 text-[#64FFDA] border border-[#64FFDA]/30">v2.4</span>
          </div>
          <p className="text-xs text-[#8892B0] font-mono">
            Autonomous Attack Surface & Passive Vulnerability Defense
          </p>
        </div>

        <Card className="bg-[#112240] border-[#1E2D4A] shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
          <CardHeader className="space-y-1 pb-4 border-b border-[#1E2D4A]/60">
            <CardTitle className="text-lg font-mono font-bold text-white flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-[#64FFDA]" /> Operator Authentication
            </CardTitle>
            <CardDescription className="text-xs text-[#8892B0] font-mono">
              Provide registered credentials to access your security telemetry console.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-5">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-mono uppercase text-[#8892B0]">Operator Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-[#8892B0]" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="operator@sentinel.dev"
                    {...register('email')}
                    className="pl-9 bg-[#0A192F] border-[#1E2D4A] text-white font-mono text-sm focus-visible:ring-[#64FFDA]"
                  />
                </div>
                {errors.email && (
                  <p className="text-xs font-mono text-[#FF3366] flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3 w-3" /> {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-mono uppercase text-[#8892B0]">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-[#8892B0]" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••••••"
                    {...register('password')}
                    className="pl-9 bg-[#0A192F] border-[#1E2D4A] text-white font-mono text-sm focus-visible:ring-[#64FFDA]"
                  />
                </div>
                {errors.password && (
                  <p className="text-xs font-mono text-[#FF3366] flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3 w-3" /> {errors.password.message}
                  </p>
                )}
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-[#FF3366]/10 border border-[#FF3366]/30 text-xs font-mono text-[#FF3366] flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-[#64FFDA] text-[#0A192F] hover:bg-[#64FFDA]/90 font-mono text-xs font-bold uppercase tracking-wider h-10 shadow-[0_0_20px_rgba(100,255,218,0.2)]"
                disabled={loading}
              >
                {loading ? 'Validating Token...' : 'Authorize & Enter Console'}
              </Button>
            </form>

            <div className="mt-5 pt-4 border-t border-[#1E2D4A] flex items-center justify-between text-xs font-mono text-[#8892B0]">
              <span>New security operator?</span>
              <Link to="/register" className="text-[#64FFDA] hover:underline flex items-center gap-1 font-semibold">
                Register Fleet Account <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Security attestation banner */}
        <div className="text-center mt-6 text-[11px] font-mono text-[#8892B0]/70 space-y-1">
          <div>TLS 1.3 End-to-End • Multi-Tenant Isolation • Zero-Trust Perimeter</div>
        </div>
      </motion.div>
    </div>
  )
}
