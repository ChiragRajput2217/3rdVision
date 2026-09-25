import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Zap,
  ArrowRight,
  User,
  Shield,
  Briefcase,
  Users,
  ChevronRight,
  Wifi,
  Radio,
  Activity,
  Database,
  Loader2,
  Check,
} from 'lucide-react';
import { MineSafeLogo } from '../components/MineSafeLogo';
import { NationalEmblem } from '../components/NationalEmblem';
import { useAuthStore } from '../auth.store';
import { UserRole } from '../../../types';
import { getDashboardPath } from '../../../utils/redirectByRole';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { loginAsDemoRole } = useAuthStore();

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [complianceChecked, setComplianceChecked] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  // Autofill and immediate login helper
  const executeLogin = (userEmail: string, userPass: string, role: UserRole) => {
    setEmail(userEmail);
    setPassword(userPass);
    setComplianceChecked(true);
    setIsSubmitting(true);

    setTimeout(() => {
      loginAsDemoRole(role);
      const targetPath = getDashboardPath(role);
      navigate(targetPath, { replace: true });
    }, 600);
  };

  // Quick login autofill handler
  const handleQuickAutofill = (userEmail: string, userPass: string, presetKey: string) => {
    setEmail(userEmail);
    setPassword(userPass);
    setComplianceChecked(true);
    setActivePreset(presetKey);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      // Default to manager demo account if submitted empty for convenience
      executeLogin('manager@3rdvision.in', 'manager123', 'SITE_ADMIN');
      return;
    }

    if (!complianceChecked) {
      alert('Please confirm DGMS Safety Compliance before proceeding to access the operations console.');
      return;
    }

    setIsSubmitting(true);

    const emailLower = email.toLowerCase();
    let role: UserRole = 'SITE_ADMIN';
    if (emailLower.includes('driver') || emailLower.includes('operator') || emailLower.includes('truck')) {
      role = 'VEHICLE_OPERATOR';
    } else if (emailLower.includes('inspector') || emailLower.includes('dgms') || emailLower.includes('super')) {
      role = 'SUPER_ADMIN';
    } else {
      role = 'SITE_ADMIN';
    }

    setTimeout(() => {
      loginAsDemoRole(role);
      const targetPath = getDashboardPath(role);
      navigate(targetPath, { replace: true });
    }, 600);
  };

  return (
    <div
      id="3rdvision-login-viewport"
      className="relative min-h-screen w-full flex items-center justify-center overflow-x-hidden overflow-y-auto bg-slate-950 p-4 sm:p-6 md:p-8 select-none"
    >
      {/* ─── Layer 1: High-Resolution Industrial Mine Backdrop ─── */}
      <div className="absolute inset-0 z-0">
        <video
          src="/minesite.mp4"
          loop
          muted
          autoPlay
          playsInline

          className="w-full h-full object-cover object-center filter brightness-[0.78] contrast-[1.1] scale-[1.02]"
        />

        {/* Cinematic Dusk & Atmospheric Vignette Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-900/40 to-slate-950/60" />
        <div className="absolute inset-0 bg-radial from-transparent via-slate-950/30 to-slate-950/80" />

        {/* ─── Layer 2: Futuristic AI LiDAR / Pit Telemetry Radar Reticle ─── */}
        <div className="absolute right-[5%] top-[25%] pointer-events-none hidden md:block">
          <div className="relative w-80 h-80">
            {/* Concentric radar target rings */}
            <div className="absolute inset-0 rounded-full border border-sky-400/30 animate-ping opacity-25" />
            <div className="absolute inset-4 rounded-full border border-sky-400/40" />
            <div className="absolute inset-12 rounded-full border border-sky-400/50" />
            <div className="absolute inset-20 rounded-full border border-cyan-400/60" />
            <div className="absolute inset-[38%] rounded-full border border-sky-300/80 bg-sky-500/10 backdrop-blur-xs flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse shadow-[0_0_12px_#38bdf8]" />
            </div>

            {/* Radar Crosshair lines */}
            <div className="absolute top-1/2 left-0 w-full h-[1px] bg-sky-400/30" />
            <div className="absolute left-1/2 top-0 h-full w-[1px] bg-sky-400/30" />

            {/* Subtle radar sweep line */}
            <div className="absolute inset-0 rounded-full overflow-hidden">
              <div className="w-full h-full bg-gradient-to-tr from-transparent via-sky-400/10 to-transparent rotate-45" />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Layer 3: Main Floating Dual-Card Layout ─── */}
      <div className="relative z-10 w-full max-w-6xl mx-auto my-auto flex flex-col lg:flex-row items-stretch justify-center gap-6">

        {/* ══════════════════════════════════════════════════════════════════════
            LEFT CARD: Primary Clean White Authentication Console
           ══════════════════════════════════════════════════════════════════════ */}
        <div className="bg-white text-slate-900 rounded-[28px] sm:rounded-[34px] shadow-2xl p-6 sm:p-8 md:p-10 flex-1 max-w-2xl border border-slate-100 flex flex-col justify-between">
          <div>
            {/* Card Header: Brand Logo (Left) & Ministry of Mines Emblem (Right) */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-5">
              <MineSafeLogo />
              <div className="shrink-0 pt-0.5">
                <NationalEmblem />
              </div>
            </div>

            {/* Welcome Heading */}
            <div className="mt-6 sm:mt-7">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Welcome Back
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
                Sign in to access your dashboard
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-5 sm:mt-6 space-y-4">
              {/* Email Field */}
              <div>
                <label htmlFor="login-email" className="block text-xs font-bold text-slate-800 mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setActivePreset(null);
                    }}
                    placeholder="Enter your authorized email address"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-800 placeholder-slate-400 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="login-password" className="block text-xs font-bold text-slate-800 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-800 placeholder-slate-400 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5 rounded transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Mandatory: DGMS Safety Compliance Box */}
              <div className="bg-[#f0f6ff] border border-blue-200/90 rounded-2xl p-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-2xs">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-xs text-blue-950">
                      Mandatory: DGMS Safety Compliance
                    </div>
                    <div className="text-[11px] text-blue-900/80 leading-snug font-normal mt-0.5">
                      By continuing, you confirm that you are an authorized user and agree to follow all safety protocols and guidelines.
                    </div>
                  </div>
                </div>

                {/* Custom Checkbox */}
                <button
                  type="button"
                  onClick={() => setComplianceChecked(!complianceChecked)}
                  className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 cursor-pointer transition-all border ${complianceChecked
                    ? 'bg-blue-600 border-blue-600 text-white shadow-2xs'
                    : 'bg-white border-slate-300 hover:border-blue-400 text-transparent'
                    }`}
                  aria-label="Confirm DGMS Safety Compliance"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </button>
              </div>

              {/* Quick Login (Demo Accounts) Section */}
              <div className="pt-2">
                <div className="flex items-center gap-1.5 text-xs text-slate-800 font-bold mb-2.5">
                  <Zap className="w-4 h-4 text-blue-600 fill-blue-600" />
                  <span>Quick Login <span className="font-normal text-slate-500">(Demo Accounts)</span></span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Driver Card */}
                  <button
                    type="button"
                    onClick={() => handleQuickAutofill('driver@3rdvision.in', 'driver123', 'driver')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${activePreset === 'driver'
                      ? 'bg-blue-100/80 border-blue-500 ring-2 ring-blue-400/20'
                      : 'bg-[#edf5ff] border-blue-200/80 hover:border-blue-400 hover:bg-blue-100/40'
                      }`}
                  >
                    <div className="w-7 h-7 rounded-full bg-blue-500/20 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-blue-950">Driver</div>
                      <div className="text-[10px] text-blue-600 font-medium truncate mt-0.5">driver@3rdvision.in</div>
                      <div className="text-[10px] text-slate-500 mt-1 font-normal">Truck Operations</div>
                    </div>
                  </button>

                  {/* Inspector Card */}
                  <button
                    type="button"
                    onClick={() => handleQuickAutofill('inspector@dgms.in', 'inspector123', 'inspector')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${activePreset === 'inspector'
                      ? 'bg-purple-100/80 border-purple-500 ring-2 ring-purple-400/20'
                      : 'bg-[#f5f0ff] border-purple-200/80 hover:border-purple-400 hover:bg-purple-100/40'
                      }`}
                  >
                    <div className="w-7 h-7 rounded-full bg-purple-500/20 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-purple-950">Inspector</div>
                      <div className="text-[10px] text-purple-600 font-medium truncate mt-0.5">inspector@dgms.in</div>
                      <div className="text-[10px] text-slate-500 mt-1 font-normal">Safety Monitoring</div>
                    </div>
                  </button>

                  {/* Manager Card */}
                  <button
                    type="button"
                    onClick={() => handleQuickAutofill('manager@3rdvision.in', 'manager123', 'manager')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${activePreset === 'manager'
                      ? 'bg-orange-100/80 border-orange-500 ring-2 ring-orange-400/20'
                      : 'bg-[#fff7ed] border-orange-200/80 hover:border-orange-400 hover:bg-orange-100/40'
                      }`}
                  >
                    <div className="w-7 h-7 rounded-full bg-orange-500/20 text-orange-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-orange-950">Manager</div>
                      <div className="text-[10px] text-orange-600 font-medium truncate mt-0.5">manager@3rdvision.in</div>
                      <div className="text-[10px] text-slate-500 mt-1 font-normal">Dispatch & Operations</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Sign In Action Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#132d4e] hover:bg-[#0c1f38] active:scale-[0.99] text-white font-semibold flex items-center justify-center gap-2.5 transition-all shadow-md text-sm cursor-pointer disabled:opacity-75"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Verifying Credentials & Safety Protocols...</span>
                    </>
                  ) : (
                    <>
                      <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                      <span>Sign In</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Bottom Card Security Notice */}
          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 font-medium pt-4 mt-2 border-t border-slate-100">
            <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span>Secure &bull; Encrypted &bull; Government Compliant</span>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            RIGHT CARD: Dark Frosted Glass Available Roles & Telemetry Panel
           ══════════════════════════════════════════════════════════════════════ */}
        <div className="bg-[#0e1d33]/85 backdrop-blur-xl border border-white/10 rounded-[28px] sm:rounded-[34px] p-5 sm:p-6 text-white flex flex-col justify-between shadow-2xl max-w-sm w-full space-y-4">

          {/* Header */}
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-sky-500/20 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4 text-sky-400" />
              </div>
              <div>
                <div className="font-bold text-sm text-white">Available Roles</div>
                <div className="text-[11px] text-slate-300 font-normal">Single platform &bull; Multiple stakeholders</div>
              </div>
            </div>

            {/* 3 Interactive Role Navigation Cards */}
            <div className="space-y-2.5 mt-4">
              {/* Driver Portal */}
              <div
                onClick={() => executeLogin('driver@3rdvision.in', 'driver123', 'VEHICLE_OPERATOR')}
                className="bg-gradient-to-r from-blue-900/50 to-blue-950/70 border border-blue-500/30 hover:border-blue-400 rounded-2xl p-3 flex items-center justify-between cursor-pointer transition-all hover:translate-x-0.5 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-xs text-white">Driver Portal</div>
                    <div className="text-[10.5px] text-slate-300 leading-tight mt-0.5 font-normal">
                      Vehicle operations, checklist, telemetry & alerts
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors shrink-0 ml-1" />
              </div>

              {/* Safety Inspector */}
              <div
                onClick={() => executeLogin('inspector@dgms.in', 'inspector123', 'SUPER_ADMIN')}
                className="bg-gradient-to-r from-purple-900/50 to-purple-950/70 border border-purple-500/30 hover:border-purple-400 rounded-2xl p-3 flex items-center justify-between cursor-pointer transition-all hover:translate-x-0.5 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-xs text-white">Safety Inspector</div>
                    <div className="text-[10.5px] text-slate-300 leading-tight mt-0.5 font-normal">
                      Compliance checks, risk assessment, incident reports
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors shrink-0 ml-1" />
              </div>

              {/* Dispatch Manager */}
              <div
                onClick={() => executeLogin('manager@3rdvision.in', 'manager123', 'SITE_ADMIN')}
                className="bg-gradient-to-r from-[#442310]/60 to-[#2c170a]/80 border border-orange-500/30 hover:border-orange-400 rounded-2xl p-3 flex items-center justify-between cursor-pointer transition-all hover:translate-x-0.5 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-xs text-white">Dispatch Manager</div>
                    <div className="text-[10.5px] text-slate-300 leading-tight mt-0.5 font-normal">
                      Fleet tracking, zone management, operations dashboard
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors shrink-0 ml-1" />
              </div>
            </div>
          </div>

          {/* System Status Container */}
          <div className="space-y-3">
            <div className="bg-black/35 backdrop-blur-md rounded-2xl border border-white/10 p-3.5 space-y-2.5">
              {/* Status Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-bold text-xs text-white">System Status</span>
                </div>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 font-bold">
                  Operational
                </span>
              </div>

              {/* Telemetry Rows */}
              <div className="space-y-1.5 pt-1 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 flex items-center gap-2">
                    <Wifi className="w-3.5 h-3.5 text-slate-400" /> Network
                  </span>
                  <span className="text-emerald-400 font-mono font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Connected
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-300 flex items-center gap-2">
                    <Radio className="w-3.5 h-3.5 text-slate-400" /> GPS
                  </span>
                  <span className="text-emerald-400 font-mono font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Active
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-300 flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5 text-slate-400" /> Telemetry
                  </span>
                  <span className="text-emerald-400 font-mono font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Live
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-300 flex items-center gap-2">
                    <Database className="w-3.5 h-3.5 text-slate-400" /> Database
                  </span>
                  <span className="text-emerald-400 font-mono font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Online
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Slogan Banner */}
            <div className="flex items-center gap-3 pt-1">
              <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="font-bold text-xs text-white">Technology for Safer Mines</div>
                <div className="text-[10px] text-slate-400 font-medium">People for a Better Tomorrow</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Layer 4: Bottom-Right SIH 2026 Watermark ─── */}
      <div className="absolute bottom-4 right-6 z-10 flex items-center gap-3 text-slate-400 font-mono text-xs tracking-wider opacity-80 pointer-events-none">
        <div className="w-12 h-[1px] bg-slate-500/60" />
        <span className="font-bold text-slate-300">SIH 2026</span>
      </div>
    </div>
  );
};
