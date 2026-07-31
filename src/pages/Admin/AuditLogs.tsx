import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../../components/ui/Card';
import { ShieldCheck, Search, Info } from 'lucide-react';

export function AuditLogs() {
  const [filterQuery, setFilterQuery] = useState('');

  // Query: retrieve audit logs
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['auditLogsList'],
    queryFn: async () => {
      const res = await fetch('/api/audit-logs');
      return res.json();
    },
    refetchInterval: 5000 // Keep logs updated in real-time
  });

  const filteredLogs = [...logs].reverse().filter((log: any) => {
    const q = filterQuery.toLowerCase();
    return (
      log.username.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q) ||
      log.role.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6 space-y-6 animate-fade-in-up">
      <div className="space-y-6">
        
        {/* Compliance Header */}
        <Card className="border-slate-800 bg-slate-900/60 p-5 flex items-center justify-between" hoverEffect={false}>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-950 border border-emerald-900 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">HIPAA Security Audit Logs</h3>
              <p className="text-[10px] text-slate-455">Chronological system activity and electronic medical records access log</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-slate-950 border border-slate-850 text-[10px] text-slate-400 max-w-sm">
            <Info className="h-4.5 w-4.5 text-medical-450 shrink-0" />
            <span>Immutable Ledger: These logs capture user roles, timestamps, and patient file queries. Logs cannot be purged.</span>
          </div>
        </Card>

        {/* Logs Table Card */}
        <Card className="border-slate-800 bg-slate-900/60 p-5" hoverEffect={false}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4 gap-4">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-550" />
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Filter logs by username, action or detailed keyword..."
                className="w-full pl-9 pr-3 py-2 text-xs glass-input"
              />
            </div>
            <span className="text-[10px] font-bold bg-slate-800 text-slate-350 px-2.5 py-1 rounded shrink-0">
              {filteredLogs.length} Trace Rows
            </span>
          </div>

          <div className="overflow-x-auto no-scrollbar max-h-[480px] overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  <th className="py-2.5 w-48">Timestamp</th>
                  <th className="py-2.5 w-32">Operator</th>
                  <th className="py-2.5 w-32">Role Access</th>
                  <th className="py-2.5 w-48">Action Classification</th>
                  <th className="py-2.5">Detailed Trace Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/80 font-mono text-[11px] leading-relaxed">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500 font-sans">Reading database audit files...</td>
                  </tr>
                ) : filteredLogs.length > 0 ? (
                  filteredLogs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-slate-900/20 transition-colors">
                      <td className="py-3 text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="py-3 text-white font-bold">{log.username}</td>
                      <td className="py-3">
                        <span className={`text-[9px] px-2 py-0.5 rounded capitalize ${
                          log.role === 'admin' ? 'bg-purple-950/60 text-purple-400 border border-purple-900/40' :
                          log.role === 'doctor' ? 'bg-emerald-950/60 text-emerald-450 border border-emerald-900/40' :
                          log.role === 'receptionist' ? 'bg-blue-950/60 text-blue-400 border border-blue-900/40' :
                          'bg-amber-950/60 text-amber-400 border border-amber-900/40'
                        }`}>
                          {log.role}
                        </span>
                      </td>
                      <td className="py-3 text-medical-400 font-bold">{log.action}</td>
                      <td className="py-3 text-slate-300 font-sans text-xs">{log.details}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500 font-sans">No matching security trace rows returned.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
export default AuditLogs;
