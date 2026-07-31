import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Pill, CheckSquare, Clock, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

export function PrescriptionQueue() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  // Query: active prescriptions
  const { data: prescriptions = [], isLoading } = useQuery({
    queryKey: ['prescriptionsQueue'],
    queryFn: async () => {
      const res = await fetch('/api/prescriptions');
      return res.json();
    },
    refetchInterval: 4000 // Poll prescriptions
  });

  // Mutation: Dispense prescription
  const dispenseMutation = useMutation({
    mutationFn: async (rxId: string) => {
      const res = await fetch(`/api/prescriptions/${rxId}/dispense`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auditUser: user?.username,
          auditRole: user?.role
        })
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Dispense action failed');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prescriptionsQueue'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryList'] });
    }
  });

  const handleDispense = (rxId: string) => {
    dispenseMutation.mutate(rxId);
  };

  const pendingRx = prescriptions.filter((rx: any) => rx.status === 'pending');
  const completedRx = prescriptions.filter((rx: any) => rx.status === 'dispensed');

  return (
    <div className="p-6 space-y-6 animate-fade-in-up">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Pending Dispensation Queue */}
        <div className="lg:col-span-8 space-y-5">
          <Card className="border-slate-800 bg-slate-900/60 p-5" hoverEffect={false}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Clock className="h-4.5 w-4.5 text-amber-400" />
                Dispensing queue (Pending)
              </h3>
              <span className="text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-900/60 px-2 py-0.5 rounded-full">
                {pendingRx.length} Orders
              </span>
            </div>

            <div className="space-y-4 max-h-[500px] overflow-y-auto no-scrollbar pr-1">
              {isLoading ? (
                <div className="py-12 text-center text-xs text-slate-500">Checking prescription routing...</div>
              ) : pendingRx.length > 0 ? (
                pendingRx.map((rx: any) => (
                  <div 
                    key={rx.id}
                    className="p-4 rounded-xl border border-slate-850 bg-slate-950/20 hover:border-slate-800 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center justify-between md:justify-start gap-4">
                        <span className="text-[10px] font-mono font-bold text-slate-455">Order: {rx.id}</span>
                        <span className="text-[9px] px-2 py-0.5 bg-slate-900 border border-slate-800 text-slate-400 rounded">
                          Date: {new Date(rx.date).toLocaleTimeString(undefined, {hour:'2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                      
                      <div>
                        <h4 className="text-xs font-bold text-white">Patient: {rx.patientName}</h4>
                        <p className="text-[10px] text-slate-500">Phone: {rx.patientPhone}</p>
                      </div>

                      {/* Prescribed Drugs list */}
                      <div className="p-2.5 rounded bg-slate-950/50 border border-slate-900/80 max-w-lg space-y-1">
                        {rx.items.map((item: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between text-xs text-slate-300">
                            <span className="font-semibold text-slate-200">{item.drugName}</span>
                            <span className="text-[9px] text-slate-500 font-bold">{item.dosage} | {item.frequency} | {item.duration}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="md:text-right flex md:flex-col items-center md:items-end justify-between md:justify-center gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-xs font-bold"
                        onClick={() => handleDispense(rx.id)}
                        loading={dispenseMutation.isPending && dispenseMutation.variables === rx.id}
                      >
                        <Pill className="h-4 w-4" />
                        Fulfill & Dispense
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-lg">
                  No pending doctor prescriptions in the routing queue.
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Dispatch Log history (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          <Card className="border-slate-800 bg-slate-900/60 p-5 h-[558px] flex flex-col" hoverEffect={false}>
            <div className="pb-3 border-b border-slate-800 mb-3 flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <CheckSquare className="h-4.5 w-4.5 text-emerald-400" />
                Dispense Logs (Completed)
              </h3>
              <span className="text-[10px] font-bold bg-slate-800 text-slate-350 px-2 py-0.5 rounded">
                Today
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 no-scrollbar">
              {completedRx.length > 0 ? (
                completedRx.map((rx: any) => (
                  <div 
                    key={rx.id}
                    className="p-3 rounded-lg border border-emerald-950/45 bg-emerald-950/5 flex items-center justify-between text-xs"
                  >
                    <div>
                      <h4 className="font-bold text-white truncate max-w-[120px]">{rx.patientName}</h4>
                      <p className="text-[9px] text-slate-500 font-mono">ID: {rx.id}</p>
                    </div>
                    <span className="text-[9px] font-bold text-emerald-400 border border-emerald-900 bg-emerald-950/65 px-2 py-0.5 rounded flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5" /> Dispensed
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-20 text-center text-xs text-slate-500">
                  No completed drug dispensations logged today.
                </div>
              )}
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}
export default PrescriptionQueue;
