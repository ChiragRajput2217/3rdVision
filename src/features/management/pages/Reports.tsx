import React from 'react';
import { useAppStore } from '../../../store/appStore';
import { FileText, Download } from 'lucide-react';
import { Button } from '../../../components/Button';

export const Reports: React.FC = () => {
  const { incidents } = useAppStore();

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10 font-sans">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 font-bold shadow-sm">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Mine Safety Audit & Incident Compliance Reports
            </h1>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              DGMS (Directorate General of Mines Safety) Statutory Audit Log
            </p>
          </div>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={<Download className="w-4 h-4" />}
          onClick={() => alert('📄 Generating Full Statutory Shift Safety Report PDF...')}
        >
          Download Shift Summary PDF
        </Button>
      </div>

      {/* Incident Log Table */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-base">Recorded Near-Miss Safety Logs</h3>
          <span className="text-xs font-mono text-slate-500">{incidents.length} Total Incident Logs</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-mono text-slate-500 uppercase bg-slate-50/70">
                <th className="py-3 px-4 rounded-l-lg">Incident ID</th>
                <th className="py-3 px-4">Title / Category</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Zone</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4 text-right rounded-r-lg">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-mono">
              {incidents.map((inc) => (
                <tr key={inc.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-amber-700">{inc.id}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-900 font-sans">{inc.title}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        inc.severity === 'CRITICAL'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {inc.severity}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700">{inc.zoneName}</td>
                  <td className="py-3.5 px-4 text-slate-500">
                    {inc.timestamp || inc.createdAt ? new Date(inc.timestamp || inc.createdAt!).toLocaleString() : 'N/A'}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => alert(`Viewing log details for ${inc.id}`)}
                      className="text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
                    >
                      View Log
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
