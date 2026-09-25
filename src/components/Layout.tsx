import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { useAppStore } from '../store/appStore';
import { useSiteStore } from '../store/siteStore';
import { X, ShieldAlert, CheckCircle2 } from 'lucide-react';

const SITE_BACKGROUNDS: Record<string, string> = {
  'site-kirandul-01': '/kirandul.jpg',
  'site-bacheli-02': '/bacheli.jpg',
  'site-donimalai-03': '/donimalai.jpg',
  'site-bailadila-04': '/bailadila.jpg',
};

export const Layout: React.FC = () => {
  const { notificationsOpen, toggleNotifications, alerts, acknowledgeAlert } = useAppStore();
  const { selectedSite } = useSiteStore();

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col font-sans">
      <Header />

      <div className="flex flex-1 relative">
        <Sidebar />

        {/* Dynamic blurred site background covering the main content area (div#root:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(1) > main:nth-of-type(1) targeted) */}
        <div className="flex-1 relative overflow-hidden flex flex-col">
          {/* Background layers for silky-smooth fade transition */}
          {Object.entries(SITE_BACKGROUNDS).map(([siteId, imgPath]) => (
            <div
              key={siteId}
              aria-hidden={selectedSite.id !== siteId}
              className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out transform scale-105 pointer-events-none z-0"
              style={{
                backgroundImage: `url(${imgPath})`,
                filter: 'blur(6px)',
                opacity: selectedSite.id === siteId ? 0.82 : 0, // Highly visible atmospheric landscape matching the active site
              }}
            />
          ))}
          {/* Subtle ambient overlay for text contrast across light dashboards */}
          <div className="absolute inset-0 bg-stone-900/[0.02] pointer-events-none z-10" />

          <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-x-hidden min-w-0 z-20">
            <Outlet />
          </main>
        </div>

        {/* Notifications Drawer */}
        {notificationsOpen && (
          <aside className="fixed inset-y-0 right-0 w-80 sm:w-96 bg-white border-l border-stone-200 shadow-2xl z-50 p-5 flex flex-col justify-between animate-slideLeft">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-stone-200">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-amber-600" />
                  <h3 className="font-bold text-stone-900 text-base">Live Safety Feed</h3>
                </div>
                <button
                  onClick={toggleNotifications}
                  className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3 max-h-[calc(100vh-10rem)] overflow-y-auto pr-1">
                {alerts.map((alert) => {
                  const isCrit = alert.severity === 'CRITICAL';
                  const isWarn = alert.severity === 'WARNING' || alert.severity === 'HIGH';
                  return (
                    <div
                      key={alert.id}
                      className={`p-3.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-white space-y-2 transition-all shadow-xs ${
                        isCrit
                          ? 'border-l-4 border-l-red-600'
                          : isWarn
                          ? 'border-l-4 border-l-amber-500'
                          : 'border-l-4 border-l-amber-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                            isCrit
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : isWarn
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-stone-100 text-stone-700 border border-stone-200'
                          }`}
                        >
                          {alert.severity}
                        </span>
                        <span className="text-[10px] font-mono text-stone-500">
                          {new Date(alert.timestamp).toLocaleTimeString()}
                        </span>
                      </div>

                      <div className="text-xs font-bold text-stone-900 leading-snug">{alert.title}</div>
                      <div className="text-[11px] text-stone-600">{alert.description}</div>

                      <div className="pt-2 flex items-center justify-between text-[11px]">
                        <span className="font-mono font-semibold text-stone-700">{alert.zoneName}</span>
                        {alert.status === 'ACTIVE' ? (
                          <button
                            onClick={() => acknowledgeAlert(alert.id, 'Control Room')}
                            className="text-[10px] font-bold px-2 py-1 bg-amber-50 text-amber-800 rounded border border-amber-300 hover:bg-amber-100 transition-colors"
                          >
                            Acknowledge
                          </button>
                        ) : (
                          <span className="text-[10px] font-mono text-emerald-700 flex items-center gap-1 font-semibold">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Acknowledged
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};
