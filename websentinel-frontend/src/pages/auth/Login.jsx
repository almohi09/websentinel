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
import { Shield, Lock, Mail, ArrowRight, AlertCircle, KeyRound, Eye, EyeOff, Radio, Terminal, Cpu } from 'lucide-react'
import CyberGridBackground from '../../components/ui/CyberGridBackground'

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
  const [showPassword, setShowPassword] = useState(false)

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
      setError(e.response?.data?.message || 'Authentication rejected. Verify operator credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#071324] p-4 relative overflow-hidden font-sans selection:bg-[#64FFDA]/20 selection:text-[#64FFDA]">
      {/* 21st.dev Style Cyber Grid & Beams */}
      <CyberGridBackground />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md relative z-10"
      >
        {/* Top Status Pill */}
        <div className="flex items-center justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#112240]/80 border border-[#1E2D4A] backdrop-blur-md shadow-lg">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#64FFDA] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#64FFDA]"></span>
            </span>
            <span className="text-[10px] font-mono font-semibold tracking-wider text-[#64FFDA] uppercase">
              ZERO-TRUST GATEWAY // SECURE
            </span>
          </div>
        </div>

        {/* Brand Header */}
        <div className="text-center mb-6 space-y-2">
          <div className="relative inline-flex items-center justify-center mb-2">
            <div className="absolute -inset-2 bg-[#64FFDA]/20 rounded-2xl blur-md"></div>
            <div className="relative h-14 w-14 rounded-2xl bg-[#0D1F38] border border-[#64FFDA]/50 shadow-[0_0_25px_rgba(100,255,218,0.25)] flex items-center justify-center">
              <Shield className="h-7 w-7 text-[#64FFDA]" />
            </div>
          </div>

          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl font-mono font-black tracking-wider text-white">
              WEB<span className="text-[#64FFDA]">SENTINEL</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#64FFDA]/10 text-[#64FFDA] border border-[#64FFDA]/30 font-bold">
              PRO
            </span>
          </div>
          <p className="text-xs text-[#8892B0] font-mono">
            Attack Surface Intelligence & Autonomous Vulnerability Shield
          </p>
        </div>

        {/* 21st.dev Style Glowing Card Box */}
        <div className="relative group">
          {/* Ambient Glow Aura */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#64FFDA]/25 via-[#38BDF8]/15 to-[#64FFDA]/25 rounded-2xl blur-lg opacity-40 group-hover:opacity-75 transition-opacity duration-700 pointer-events-none" />

          {/* Card Surface */}
          <div className="relative rounded-2xl bg-[#0D1F38]/95 backdrop-blur-xl border border-[#1E2D4A] p-6 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.6)] space-y-5">
            {/* Inner Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#1E2D4A]/70">
              <div className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-[#64FFDA]" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                  Operator Credentials
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#8892B0] flex items-center gap-1">
                <Cpu className="h-3 w-3 text-[#64FFDA]" /> v2.4
              </span>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Operator Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-mono uppercase text-[#8892B0] tracking-wider">
                  Operator Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-[#8892B0]" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="operator@sentinel.dev"
                    {...register('email')}
                    className="pl-9 bg-[#071324] border-[#1E2D4A] hover:border-[#64FFDA]/40 text-white font-mono text-xs h-10 focus-visible:ring-1 focus-visible:ring-[#64FFDA] focus-visible:border-[#64FFDA] transition-all"
                  />
                </div>
                {errors.email && (
                  <p className="text-xs font-mono text-[#FF3366] flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3 w-3" /> {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-mono uppercase text-[#8892B0] tracking-wider">
                    Access Token / Password
                  </Label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-[#8892B0]" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    {...register('password')}
                    className="pl-9 pr-10 bg-[#071324] border-[#1E2D4A] hover:border-[#64FFDA]/40 text-white font-mono text-xs h-10 focus-visible:ring-1 focus-visible:ring-[#64FFDA] focus-visible:border-[#64FFDA] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-3 text-[#8892B0] hover:text-[#64FFDA] transition-colors p-0.5"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs font-mono text-[#FF3366] flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3 w-3" /> {errors.password.message}
                  </p>
                )}
              </div>

              {/* Error Callout */}
              {error && (
                <div className="p-3 rounded-lg bg-[#FF3366]/10 border border-[#FF3366]/30 text-xs font-mono text-[#FF3366] flex items-center gap-2 animate-shake">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Magic UI Shimmer Style Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full relative group overflow-hidden rounded-lg bg-[#64FFDA] hover:bg-[#64FFDA]/95 text-[#071324] font-mono text-xs font-bold uppercase tracking-widest h-10 shadow-[0_0_20px_rgba(100,255,218,0.25)] hover:shadow-[0_0_30px_rgba(100,255,218,0.45)] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {/* Shimmer light sweep */}
                <span className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-[300%] transition-transform duration-1000 ease-in-out" />
                <span>{loading ? 'Decrypting Session...' : 'Authenticate & Enter Console'}</span>
                {!loading && <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />}
              </button>
            </form>

            {/* Bottom Register Switcher */}
            <div className="pt-3 border-t border-[#1E2D4A]/70 flex items-center justify-between text-xs font-mono text-[#8892B0]">
              <span>New operator?</span>
              <Link
                to="/register"
                className="text-[#64FFDA] hover:underline flex items-center gap-1 font-semibold transition-colors"
              >
                Register Fleet Account <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Security Attestation Badges (21st.dev Cyber Trust Bar) */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-[10px] font-mono text-[#8892B0]">
          <span className="px-2 py-0.5 rounded bg-[#112240] border border-[#1E2D4A] flex items-center gap-1">
            <Lock className="h-2.5 w-2.5 text-[#64FFDA]" /> TLS 1.3
          </span>
          <span className="px-2 py-0.5 rounded bg-[#112240] border border-[#1E2D4A] flex items-center gap-1">
            <Shield className="h-2.5 w-2.5 text-[#38BDF8]" /> ZERO-TRUST
          </span>
          <span className="px-2 py-0.5 rounded bg-[#112240] border border-[#1E2D4A] flex items-center gap-1">
            <Radio className="h-2.5 w-2.5 text-[#64FFDA]" /> CONTINUOUS MONITORING
          </span>
        </div>
      </motion.div>
    </div>
  )
}
