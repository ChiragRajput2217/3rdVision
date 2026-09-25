import React from 'react';
import { Outlet } from 'react-router-dom';
import { Topbar } from './Topbar';
import { Sidebar } from './Sidebar';
import { useUiStore } from '../../store/uiStore';
import { useAlertStore } from '../../store/alertStore';
import { X, ShieldAlert, CheckCircle2 } from 'lucide-react';

export const Layout: React.FC = () => {
  const { notificationsOpen, toggleNotifications } = useUiStore();
  const { alerts, acknowledgeAlert } = useAlertStore();

  return (
    <div className="min-h-screen bg-[#F7F6F3] text-[#1C1917] flex flex-col font-sans">
      <Topbar />

      <div className="flex flex-1 relative">
        <Sidebar />

        <main className="flex-1 p-2.5 sm:p-5 md:p-8 overflow-x-hidden min-w-0 bg-[#F7F6F3]">
          <Outlet />
        </main>

        {/* Notifications Slide-over Drawer */}
        {notificationsOpen && (
          <aside className="fixed inset-y-0 right-0 w-full max-w-sm sm:w-96 bg-white border-l border-stone-200 shadow-2xl z-50 p-4 sm:p-5 flex flex-col justify-between animate-slideLeft">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-stone-200">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-amber-600" />
                  <h3 className="font-bold text-stone-900 text-base">Live Safety Feed</h3>
                </div>
                <button
                  onClick={toggleNotifications}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
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
                      className={`p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white space-y-2 transition-all shadow-sm ${
                        isCrit
                          ? 'border-l-4 border-l-red-600'
                          : isWarn
                          ? 'border-l-4 border-l-amber-500'
                          : 'border-l-4 border-l-blue-500'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                            isCrit
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : isWarn
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {alert.severity}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {new Date(alert.timestamp).toLocaleTimeString()}
                        </span>
                      </div>

                      <div className="text-xs font-bold text-slate-900 leading-snug">{alert.title}</div>
                      <div className="text-[11px] text-slate-600">{alert.description}</div>

                      <div className="pt-2 flex items-center justify-between text-[11px]">
                        <span className="font-mono font-semibold text-slate-700">{alert.zoneName}</span>
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
