import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ShieldCheck, Search, Info, Download } from 'lucide-react';

export function AuditLogs() {
  const [filterQuery, setFilterQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

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
    
    // 1. Text Search Filter
    const matchesQuery = (
      log.username.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q) ||
      log.role.toLowerCase().includes(q)
    );

    // 2. Role Filter
    const matchesRole = selectedRole === 'All' || log.role.toLowerCase() === selectedRole.toLowerCase();

    // 3. Date Range Filter
    let matchesDate = true;
    const logDate = new Date(log.timestamp);
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0,0,0,0);
      matchesDate = matchesDate && logDate >= start;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23,59,59,999);
      matchesDate = matchesDate && logDate <= end;
    }

    return matchesQuery && matchesRole && matchesDate;
  });

  const handleExportCSV = () => {
    if (filteredLogs.length === 0) return;
    
    // Compile CSV layout
    const headers = ['Timestamp', 'Operator', 'Role Access', 'Action Classification', 'Detailed Trace Summary'];
    const rows = filteredLogs.map((log: any) => [
      new Date(log.timestamp).toLocaleString(),
      log.username,
      log.role,
      log.action,
      `"${log.details.replace(/"/g, '""')}"`
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.join(','))
    ].join('\n');

    // Create local blob & triggers download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `MCMS_HIPAA_Compliance_Audit_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in-up">
      <div className="space-y-6">
        
        {/* Compliance Header */}
        <Card className="border-slate-800 bg-slate-900/60 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4" hoverEffect={false}>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-950 border border-emerald-900 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">HIPAA Security Audit Logs</h3>
              <p className="text-[10px] text-slate-400">Chronological system activity and electronic medical records access log</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-slate-950 border border-slate-850 text-[10px] text-slate-400 max-w-md">
            <Info className="h-4.5 w-4.5 text-medical-450 shrink-0" />
            <span>Immutable Ledger: These logs capture user roles, timestamps, and patient file queries. Logs cannot be purged.</span>
          </div>
        </Card>

        {/* Logs Table Card */}
        <Card className="border-slate-800 bg-slate-900/60 p-5" hoverEffect={false}>
          {/* Filtering and Exporter controls */}
          <div className="flex flex-col gap-4 pb-3 border-b border-slate-800 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* Text search */}
              <div className="relative col-span-2">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-550" />
                <input
                  type="text"
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  placeholder="Filter logs by username, action or detailed keyword..."
                  className="w-full pl-9 pr-3 py-2 text-xs glass-input"
                />
              </div>

              {/* Role Filter */}
              <div className="relative">
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-3 py-2 text-xs glass-input"
                >
                  <option value="All">All Roles</option>
                  <option value="admin">Administrator</option>
                  <option value="doctor">Physician</option>
                  <option value="receptionist">Receptionist</option>
                  <option value="pharmacist">Pharmacist</option>
                </select>
              </div>

              {/* Exporter button */}
              <Button
                variant="primary"
                size="sm"
                onClick={handleExportCSV}
                disabled={filteredLogs.length === 0}
                className="text-xs font-semibold py-2 w-full flex items-center justify-center gap-1.5"
              >
                <Download className="h-4 w-4" />
                Export CSV Report
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Date Filters */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                <span>Filter Dates:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-2 py-1 text-[11px] glass-input text-slate-300 w-36"
                />
                <span>to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-2 py-1 text-[11px] glass-input text-slate-300 w-36"
                />
                {(startDate || endDate || selectedRole !== 'All' || filterQuery) && (
                  <button
                    onClick={() => {
                      setStartDate('');
                      setEndDate('');
                      setSelectedRole('All');
                      setFilterQuery('');
                    }}
                    className="text-[10px] text-rose-400 font-bold hover:underline ml-1"
                  >
                    Clear Filters
                  </button>
                )}
              </div>

              <span className="text-[10px] font-bold bg-slate-800 text-slate-350 px-2.5 py-1 rounded shrink-0 w-fit">
                {filteredLogs.length} Trace Rows
              </span>
            </div>
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
