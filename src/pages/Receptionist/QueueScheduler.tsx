import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { 
  Users, 
  Search, 
  Activity, 
  UserCheck, 
  Plus, 
  Heart,
  Thermometer, 
  ActivitySquare, 
  Gauge, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

export function QueueScheduler() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [printToken, setPrintToken] = useState<any | null>(null);
  
  // Triage state
  const [triageApptId, setTriageApptId] = useState<string | null>(null);
  const [triageForm, setTriageForm] = useState({
    bp: '120/80',
    hr: '72',
    temp: '98.6',
    bmi: '22.0'
  });

  // Query: registered patients for allocation
  const { data: patients = [] } = useQuery({
    queryKey: ['patientsList', searchQuery],
    queryFn: async () => {
      if (!searchQuery) return [];
      const res = await fetch(`/api/patients?search=${searchQuery}&auditUser=${user?.username}&auditRole=${user?.role}`);
      return res.json();
    }
  });

  // Query: active queue
  const { data: queue = [] } = useQuery({
    queryKey: ['appointmentsQueue'],
    queryFn: async () => {
      const res = await fetch('/api/appointments');
      return res.json();
    }
  });

  // Mutation: Allocate Token
  const allocateTokenMutation = useMutation({
    mutationFn: async (patientId: string) => {
      // For demo, we allocate to Dr. Evelyn Carter (u-2)
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          doctorId: 'u-2',
          auditUser: user?.username,
          auditRole: user?.role
        })
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['appointmentsQueue'] });
      if (selectedPatient) {
        setPrintToken({
          patientName: selectedPatient.name,
          tokenNumber: data.tokenNumber,
          doctorName: 'Dr. Evelyn Carter',
          date: data.date
        });
      }
      setSelectedPatient(null);
      setSearchQuery('');
    }
  });

  // Mutation: Submit Triage
  const triageMutation = useMutation({
    mutationFn: async ({ apptId, triage }: { apptId: string, triage: any }) => {
      const res = await fetch(`/api/appointments/${apptId}/triage`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...triage,
          auditUser: user?.username,
          auditRole: user?.role
        })
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointmentsQueue'] });
      setTriageApptId(null);
    }
  });

  const handleAllocate = (pId: string) => {
    allocateTokenMutation.mutate(pId);
  };

  const handleTriageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!triageApptId) return;
    triageMutation.mutate({ apptId: triageApptId, triage: triageForm });
  };

  return (
    <>
      <div className="p-6 space-y-6 animate-fade-in-up no-print">
        {printToken && (
          <Card glowColor="cyan" className="border-medical-500/50 bg-slate-900/85 flex items-center justify-between p-4 mb-2">
            <div>
              <h4 className="text-xs font-bold text-white">Queue Token {printToken.tokenNumber} Generated!</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Patient: <strong className="text-slate-205">{printToken.patientName}</strong> is assigned to <strong className="text-slate-205">{printToken.doctorName}</strong>.</p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  setTimeout(() => window.print(), 100);
                }}
              >
                Print Ticket (80mm)
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setPrintToken(null)}
              >
                Dismiss
              </Button>
            </div>
          </Card>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Token allocation Panel */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-slate-800 bg-slate-900/60 p-5" hoverEffect={false}>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Plus className="h-4.5 w-4.5 text-medical-400" />
              Allocate Queue Token
            </h3>

            {/* Step 1: Search Patient */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Find Registered Patient</label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Type name, phone or ID..."
                    className="w-full pl-9 pr-3 py-2 text-xs glass-input"
                  />
                </div>
              </div>

              {/* Patient list from lookup */}
              {searchQuery && (
                <div className="border border-slate-800 rounded-lg bg-slate-950/60 overflow-hidden divide-y divide-slate-900 max-h-48 overflow-y-auto no-scrollbar">
                  {patients.length > 0 ? (
                    patients.map((p: any) => (
                      <button
                        key={p.id}
                        onClick={() => setSelectedPatient(p)}
                        className="w-full text-left p-2.5 hover:bg-slate-900 text-xs flex items-center justify-between text-slate-200 transition-colors"
                      >
                        <div>
                          <p className="font-bold text-white">{p.name}</p>
                          <p className="text-[10px] text-slate-500">ID: {p.nationalId} | Phone: {p.phone}</p>
                        </div>
                        <UserCheck className="h-4 w-4 text-medical-400" />
                      </button>
                    ))
                  ) : (
                    <div className="p-3 text-center text-[10px] text-slate-500">No patient files found.</div>
                  )}
                </div>
              )}

              {/* Selected Patient Card */}
              {selectedPatient && (
                <div className="p-3 rounded-lg border border-medical-500/35 bg-medical-950/20 space-y-3">
                  <div>
                    <h4 className="text-xs font-bold text-white">{selectedPatient.name}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Phone: {selectedPatient.phone}</p>
                    <p className="text-[9px] bg-slate-800 text-slate-400 border border-slate-705 px-1.5 py-0.5 rounded w-fit mt-1">
                      Allergies: {selectedPatient.allergies}
                    </p>
                  </div>
                  <Button
                    onClick={() => handleAllocate(selectedPatient.id)}
                    className="w-full text-xs py-1.5"
                    loading={allocateTokenMutation.isPending}
                  >
                    Generate Sequential Token
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Nurse Triage Intake drawer/card */}
          {triageApptId && (
            <Card glowColor="amber" className="border-amber-500/20 bg-slate-900/60 p-5" hoverEffect={false}>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <Activity className="h-4.5 w-4.5 text-amber-400 animate-pulse" />
                Intake Vitals Intake
              </h3>
              
              <form onSubmit={handleTriageSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Blood Pressure</label>
                    <div className="relative">
                      <Gauge className="absolute left-2 top-2 h-3.5 w-3.5 text-blue-450" />
                      <input
                        type="text"
                        value={triageForm.bp}
                        onChange={(e) => setTriageForm({ ...triageForm, bp: e.target.value })}
                        placeholder="120/80"
                        className="w-full pl-7 pr-2 py-1.5 text-xs glass-input"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Heart Rate (bpm)</label>
                    <div className="relative">
                      <Heart className="absolute left-2 top-2 h-3.5 w-3.5 text-rose-455" />
                      <input
                        type="text"
                        value={triageForm.hr}
                        onChange={(e) => setTriageForm({ ...triageForm, hr: e.target.value })}
                        placeholder="72"
                        className="w-full pl-7 pr-2 py-1.5 text-xs glass-input"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Body Temp (°F)</label>
                    <div className="relative">
                      <Thermometer className="absolute left-2 top-2 h-3.5 w-3.5 text-amber-450" />
                      <input
                        type="text"
                        value={triageForm.temp}
                        onChange={(e) => setTriageForm({ ...triageForm, temp: e.target.value })}
                        placeholder="98.6"
                        className="w-full pl-7 pr-2 py-1.5 text-xs glass-input"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">BMI Score</label>
                    <div className="relative">
                      <ActivitySquare className="absolute left-2 top-2 h-3.5 w-3.5 text-emerald-450" />
                      <input
                        type="text"
                        value={triageForm.bmi}
                        onChange={(e) => setTriageForm({ ...triageForm, bmi: e.target.value })}
                        placeholder="22.0"
                        className="w-full pl-7 pr-2 py-1.5 text-xs glass-input"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    type="submit"
                    className="flex-1 text-[11px] py-1.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400"
                    loading={triageMutation.isPending}
                  >
                    Record Vitals
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="text-[11px] py-1.5"
                    onClick={() => setTriageApptId(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          )}
        </div>

        {/* Queue Schedule Display Table (occupies 2 columns) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-slate-800 bg-slate-900/60 p-5" hoverEffect={false}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Users className="h-4.5 w-4.5 text-slate-400" />
                Active OPD Queue Management
              </h3>
              <span className="text-[10px] font-bold bg-slate-800 text-slate-350 px-2 py-0.5 rounded">
                Today
              </span>
            </div>

            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                    <th className="py-2.5">Token</th>
                    <th className="py-2.5">Patient Details</th>
                    <th className="py-2.5">Physician</th>
                    <th className="py-2.5">Triage Vitals</th>
                    <th className="py-2.5">Status</th>
                    <th className="py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850/80">
                  {queue.length > 0 ? (
                    queue.map((appt: any) => (
                      <tr key={appt.id} className="hover:bg-slate-900/30 transition-colors">
                        <td className="py-3 font-mono font-bold text-medical-400">{appt.tokenNumber}</td>
                        <td className="py-3">
                          <p className="font-bold text-white">{appt.patientName}</p>
                          <p className="text-[10px] text-slate-500">Phone: {appt.patientPhone}</p>
                        </td>
                        <td className="py-3 text-slate-300 font-semibold">{appt.doctorName}</td>
                        <td className="py-3">
                          {appt.triage ? (
                            <div className="flex flex-wrap gap-1">
                              <span className="text-[9px] px-1 bg-blue-950 text-blue-300 border border-blue-900 rounded">
                                BP: {appt.triage.bp}
                              </span>
                              <span className="text-[9px] px-1 bg-rose-950 text-rose-300 border border-rose-900 rounded">
                                HR: {appt.triage.hr}
                              </span>
                              <span className="text-[9px] px-1 bg-amber-950 text-amber-300 border border-amber-900 rounded">
                                T: {appt.triage.temp}°F
                              </span>
                              <span className="text-[9px] px-1 bg-emerald-950 text-emerald-300 border border-emerald-900 rounded">
                                BMI: {appt.triage.bmi}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-amber-400 font-bold animate-pulse">
                              Pending Triage
                            </span>
                          )}
                        </td>
                        <td className="py-3 capitalize">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                            appt.status === 'waiting' ? 'bg-blue-950/60 border-blue-900 text-blue-400' :
                            appt.status === 'in-consultation' ? 'bg-amber-950/60 border-amber-900 text-amber-400 glow-cyan animate-pulse' :
                            'bg-slate-900 border-slate-800 text-slate-400'
                          }`}>
                            {appt.status}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          {appt.status === 'waiting' && (
                            <Button
                              variant="glass"
                              size="sm"
                              className="text-[9px] px-2 py-1 border border-slate-800"
                              onClick={() => {
                                setTriageApptId(appt.id);
                                if (appt.triage) setTriageForm(appt.triage);
                              }}
                            >
                              Triage Nurse
                            </Button>
                          )}
                          {appt.status === 'completed' && (
                            <span className="text-[9px] text-emerald-400 font-bold flex items-center gap-1 justify-end">
                              <CheckCircle2 className="h-3 w-3" /> Triage Passed
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">No active queue tokens logged today.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

      </div>
    </div>
    
    {printToken && (
      <div className="print-container hidden text-black bg-white p-4 text-center font-mono">
        <h2 className="text-xs font-bold border-b border-black pb-1.5 mb-2 uppercase tracking-wide">Aura Clinic OPD</h2>
        <p className="text-[10px] text-slate-700">Walk-in Queue Slip</p>
        <p className="text-4xl font-black my-4 leading-none">{printToken.tokenNumber}</p>
        <div className="space-y-1 text-[9px] text-left border-t border-b border-black py-2 mb-3">
          <p><strong>Patient:</strong> {printToken.patientName}</p>
          <p><strong>Physician:</strong> {printToken.doctorName}</p>
          <p><strong>Issued:</strong> {new Date(printToken.date).toLocaleString()}</p>
        </div>
        <p className="text-[8px] text-slate-800 leading-relaxed">
          Please wait in the clinic lounge.<br />
          Your token will be spoken aloud.<br />
          ------------------------<br />
          * Standalone System Demo *
        </p>
      </div>
    )}
  </>
  );
}
export default QueueScheduler;
