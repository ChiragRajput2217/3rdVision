import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppStore } from '../../../store/appStore';
import { UserRole } from '../../../types';
import {
  Building2,
  HardHat,
  Truck,
  ArrowRight,
  Lock,
  Radio,
  BarChart3,
  CheckCircle2,
} from 'lucide-react';

export const DemoLandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { loginAsDemoRole, loginWithGoogle, isLoading, isAuthenticated } = useAppStore();

  const handleAccess = (role: UserRole, targetPath: string) => {
    loginAsDemoRole(role);
    navigate(targetPath);
  };

  const handleLogin = async () => {
    try {
      if (!isAuthenticated) {
        await loginWithGoogle();
      }
      navigate('/admin/dashboard');
    } catch {
      navigate('/admin/dashboard');
    }
  };

  const portalCards = [
    {
      id: 'state-gov',
      title: 'State Government',
      tag: 'Multi-Site Governance',
      description:
        'State-level oversight across mining sites. Live aggregated KPIs, regional safety alerts, interactive mine maps, and inter-site operational comparisons.',
      role: 'SUPER_ADMIN' as UserRole,
      path: '/super-admin/dashboard',
      icon: <Building2 className="w-8 h-8 text-blue-600" />,
      badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
      buttonBg: 'bg-blue-600 hover:bg-blue-700 text-white',
      meta: 'Kirandul • Bacheli • Donimalai • Bailadila',
    },
    {
      id: 'site-admin',
      title: 'Site Administration',
      tag: 'Mine Operations Hub',
      description:
        'Full operational command of local mine pits. Real-time fleet tracking, radar/LiDAR telemetry, micro-climate weather conditions, and network health.',
      role: 'SITE_ADMIN' as UserRole,
      path: '/admin/dashboard',
      icon: <HardHat className="w-8 h-8 text-amber-600" />,
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
      buttonBg: 'bg-blue-600 hover:bg-blue-700 text-white',
      meta: '100% Telemetry Active • Live Haulage',
    },
    {
      id: 'vehicle-operator',
      title: 'Vehicle Operator',
      tag: 'In-Cab Safety HUD',
      description:
        'High-contrast, distraction-free in-cab display. Instant speed advisory, optical fog visibility measurements, radar distance, and collision hazard warnings.',
      role: 'VEHICLE_OPERATOR' as UserRole,
      path: '/operator/dashboard',
      icon: <Truck className="w-8 h-8 text-emerald-600" />,
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      buttonBg: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      meta: 'Operator D-104 • V2X Radar Proximity',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col justify-between font-sans selection:bg-blue-600 selection:text-white">
      
      {/* ─── Top Bar Header ────────────────────────────────────────── */}
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center">
          <img
            src="/3rdvisionhorizontal.jpeg"
            alt="3rd Vision"
            width={854}
            height={192}
            decoding="async"
            fetchPriority="high"
            className="h-auto w-[180px] sm:w-[220px] object-contain object-left"
          />
          <div className="ml-3 hidden sm:block">
            <div className="font-extrabold text-xl tracking-tight text-slate-900 flex items-center gap-2">
              <span className="text-[11px] font-mono font-bold text-slate-600 border border-slate-200 bg-slate-100 px-2 py-0.5 rounded-md">
                v2.4
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-mono font-medium text-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
            aria-label="Login"
          >
            <Lock className="w-3.5 h-3.5 text-blue-600" />
            <span>Login</span>
          </button>
        </div>
      </header>

      {/* ─── Hero & Portal Access Selection ─────────────────────────── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-12 flex flex-col justify-center">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-mono text-slate-600 shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Industrial Safety Operations Platform
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            3rd Vision Operations Portal
          </h1>
          <p className="text-slate-600 text-base font-normal max-w-xl mx-auto">
            Choose Access
          </p>
        </div>

        {/* ─── Three Primary Access Cards ────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {portalCards.map((card) => (
            <div
              key={card.id}
              className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                    {card.icon}
                  </div>
                  <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${card.badgeClass}`}>
                    {card.tag}
                  </span>
                </div>

                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    {card.title}
                  </h2>
                  <p className="text-xs font-mono text-slate-500 mt-1">
                    {card.meta}
                  </p>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed">
                  {card.description}
                </p>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100">
                <Link
                  to={card.path}
                  onClick={() => handleAccess(card.role, card.path)}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault();
                      handleAccess(card.role, card.path);
                    }
                  }}
                  className={`w-full py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-semibold text-sm transition-all duration-150 cursor-pointer shadow-sm ${card.buttonBg}`}
                  aria-label={`Launch ${card.title}`}
                >
                  <span>Launch {card.title}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* ─── Secondary Access Links ─────────────────────────────────── */}
        <div className="mt-10 pt-6 border-t border-slate-200 flex flex-wrap items-center justify-center gap-6 text-xs font-mono text-slate-500">
          <button
            onClick={() => handleAccess('CONTROL_ROOM_OPERATOR', '/control-room/dashboard')}
            className="hover:text-slate-900 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Radio className="w-3.5 h-3.5 text-blue-600" />
            <span>Control Room Dispatch</span>
          </button>
          <span>•</span>
          <button
            onClick={() => handleAccess('MANAGEMENT', '/public')}
            className="hover:text-slate-900 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <BarChart3 className="w-3.5 h-3.5 text-purple-600" />
            <span>Executive Analytics</span>
          </button>
          <span>•</span>
          <button
            onClick={() => navigate('/login')}
            className="hover:text-slate-900 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5 text-amber-600" />
            <span>Custom Credentials Login</span>
          </button>
        </div>
      </main>

      {/* ─── Minimal Industrial Footer ───────────────────────────────── */}
      <footer className="border-t border-slate-200 py-4 px-6 text-center text-xs font-mono text-slate-500 bg-white">
        3rd Vision Operations Platform • Ministry of Mines & NMDC Telemetry Integration • Encrypted Edge Architecture
      </footer>
    </div>
  );
};
