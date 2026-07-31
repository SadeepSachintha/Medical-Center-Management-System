import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
  Users, 
  Clock, 
  TrendingUp, 
  Package,
  Stethoscope,
  Pill,
  Zap
} from 'lucide-react';

interface DashboardProps {
  setCurrentTab: (tab: string) => void;
}

export function Dashboard({ setCurrentTab }: DashboardProps) {
  const { user } = useAuthStore();

  const { data: stats, isLoading, refetch } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/stats');
      return res.json();
    },
    refetchInterval: 5000 // Polling every 5 seconds to sync dashboard card trends!
  });

  const getQuickActions = () => {
    if (!user) return null;
    
    switch (user.role) {
      case 'receptionist':
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <Card glowColor="cyan" className="flex flex-col justify-between h-40">
              <div>
                <h4 className="text-sm font-bold text-white mb-1">New Patient Intake</h4>
                <p className="text-[11px] text-slate-400">Onboard walk-ins or scheduled patients, check IDs and register contact details.</p>
              </div>
              <Button size="sm" variant="glass" className="w-fit" onClick={() => setCurrentTab('reception-onboarding')}>
                Open Intake Desk
              </Button>
            </Card>
            <Card glowColor="cyan" className="flex flex-col justify-between h-40">
              <div>
                <h4 className="text-sm font-bold text-white mb-1">Queue Scheduler</h4>
                <p className="text-[11px] text-slate-400">Assign walk-in tokens, capture triage vitals, and coordinate doctors.</p>
              </div>
              <Button size="sm" variant="glass" className="w-fit" onClick={() => setCurrentTab('reception-queue')}>
                View Active Queue
              </Button>
            </Card>
            <Card glowColor="cyan" className="flex flex-col justify-between h-40">
              <div>
                <h4 className="text-sm font-bold text-white mb-1">Billing & Checkout</h4>
                <p className="text-[11px] text-slate-400">Compile consultation and pharmacy orders, aggregate charges, process checkout.</p>
              </div>
              <Button size="sm" variant="glass" className="w-fit" onClick={() => setCurrentTab('reception-billing')}>
                Collect Payments
              </Button>
            </Card>
          </div>
        );
      case 'doctor':
        return (
          <div className="grid grid-cols-1 gap-4 mt-6">
            <Card glowColor="emerald" className="flex items-center justify-between p-6">
              <div className="max-w-xl">
                <h4 className="text-base font-bold text-white flex items-center gap-2 mb-1">
                  <Stethoscope className="h-5 w-5 text-emerald-400" />
                  Clinical Consultation Workspace
                </h4>
                <p className="text-xs text-slate-455">
                  Launch the Electronic Health Record (EHR) workspace. Review incoming patient queues, capture nurse-collected vitals, diagnose ailments, and issue electronic prescriptions (Rx).
                </p>
              </div>
              <Button size="md" variant="primary" onClick={() => setCurrentTab('doctor-consult')}>
                Enter Consultation Pad
              </Button>
            </Card>
          </div>
        );
      case 'pharmacist':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <Card glowColor="amber" className="flex flex-col justify-between h-44">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
                  <Pill className="h-4 w-4 text-amber-400" />
                  Dispensing Station
                </h4>
                <p className="text-xs text-slate-400">Check incoming digital prescriptions queued directly from doctor consultations. Dispense medications and deduct inventory.</p>
              </div>
              <Button size="sm" variant="glass" className="w-fit animate-pulse-slow" onClick={() => setCurrentTab('pharmacy-prescriptions')}>
                View Rx Queue
              </Button>
            </Card>
            <Card glowColor="amber" className="flex flex-col justify-between h-44">
              <div>
                <h4 className="text-sm font-bold text-white mb-1">Inventory Management</h4>
                <p className="text-xs text-slate-400">Track medication batch numbers, check low-stock thresholds, monitor expiration limits, and run direct over-the-counter sales.</p>
              </div>
              <Button size="sm" variant="glass" className="w-fit" onClick={() => setCurrentTab('pharmacy-inventory')}>
                Open Stockroom
              </Button>
            </Card>
          </div>
        );
      case 'admin':
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <Card className="flex flex-col justify-between h-40">
              <div>
                <h4 className="text-sm font-bold text-white mb-1">Clinic User Accounts</h4>
                <p className="text-[11px] text-slate-400">Set up new accounts for doctors, receptionists, pharmacists, and manage access parameters.</p>
              </div>
              <Button size="sm" variant="glass" className="w-fit" onClick={() => setCurrentTab('admin-users')}>
                Manage Accounts
              </Button>
            </Card>
            <Card className="flex flex-col justify-between h-40">
              <div>
                <h4 className="text-sm font-bold text-white mb-1">Financial Panel</h4>
                <p className="text-[11px] text-slate-400">Track billing logs, view cash/card distributions, and monitor monthly clinical revenue curves.</p>
              </div>
              <Button size="sm" variant="glass" className="w-fit" onClick={() => setCurrentTab('admin-finance')}>
                View Revenue Charts
              </Button>
            </Card>
            <Card className="flex flex-col justify-between h-40">
              <div>
                <h4 className="text-sm font-bold text-white mb-1">HIPAA Security Audits</h4>
                <p className="text-[11px] text-slate-400">GDPR/HIPAA compliant tracking logs capturing exact staff identities reading or writing patient histories.</p>
              </div>
              <Button size="sm" variant="glass" className="w-fit" onClick={() => setCurrentTab('admin-audit')}>
                Inspect Security Logs
              </Button>
            </Card>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Top Banner */}
      <div className="flex items-center justify-between bg-gradient-to-r from-medical-950/60 to-slate-900/60 p-6 rounded-xl border border-medical-500/20 glow-border">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            Welcome back, {user?.name}!
            <span className="text-[10px] bg-medical-500/10 border border-medical-500/30 text-medical-400 rounded-full px-2 py-0.5 uppercase tracking-wider font-semibold">
              {user?.role}
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">Here is a quick snapshot of outpatient department metrics and alerts for today.</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => refetch()} className="text-xs border border-slate-700 bg-slate-900 text-slate-300">
          Sync Metrics
        </Button>
      </div>

      {/* Main KPI Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Waiting */}
        <Card className="flex items-center gap-4 py-4 px-5">
          <div className="h-10 w-10 rounded-lg bg-blue-950 border border-blue-800 flex items-center justify-center text-blue-400">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Patients Waiting</p>
            <h3 className="text-xl font-bold text-white mt-0.5">{isLoading ? '...' : stats?.queue?.waiting}</h3>
          </div>
        </Card>

        {/* Completed Today */}
        <Card className="flex items-center gap-4 py-4 px-5">
          <div className="h-10 w-10 rounded-lg bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Completed Consults</p>
            <h3 className="text-xl font-bold text-white mt-0.5">{isLoading ? '...' : stats?.queue?.completed}</h3>
          </div>
        </Card>

        {/* Revenue Today */}
        <Card className="flex items-center gap-4 py-4 px-5">
          <div className="h-10 w-10 rounded-lg bg-indigo-950 border border-indigo-800 flex items-center justify-center text-indigo-400">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Revenue Today</p>
            <h3 className="text-xl font-bold text-white mt-0.5">LKR {isLoading ? '...' : stats?.finance?.revenueToday?.toFixed(2)}</h3>
          </div>
        </Card>

        {/* Inventory alerts */}
        <Card 
          glowColor={stats?.inventory?.lowStock > 0 ? 'rose' : stats?.inventory?.expiringSoon > 0 ? 'amber' : 'none'} 
          className="flex items-center gap-4 py-4 px-5"
        >
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${stats?.inventory?.lowStock > 0 ? 'bg-rose-950 border border-rose-800 text-rose-455' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
            <Package className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Inventory Alerts</p>
            <h3 className="text-xs font-semibold text-white mt-0.5">
              {isLoading ? '...' : (
                <>
                  <span className={stats?.inventory?.lowStock > 0 ? 'text-rose-400 font-bold' : ''}>
                    {stats?.inventory?.lowStock} Low Stock
                  </span>
                  {' • '}
                  <span className={stats?.inventory?.expiringSoon > 0 ? 'text-amber-400 font-bold' : ''}>
                    {stats?.inventory?.expiringSoon} Expiring
                  </span>
                </>
              )}
            </h3>
          </div>
        </Card>
      </div>

      {/* Role specific actions */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Zap className="h-4 w-4 text-medical-400" />
          Quick Actions & Clinical Shortcuts
        </h3>
        {getQuickActions()}
      </div>

      {/* System Quick-Guide Banner */}
      <Card className="border-slate-800 bg-slate-900/30 p-5 mt-6">
        <h4 className="text-xs font-bold text-white mb-2">Simulated Live OPD Workflow Checksheet:</h4>
        <ol className="text-[11px] text-slate-400 list-decimal list-inside space-y-1.5">
          <li>Log in as <strong className="text-medical-400">Receptionist</strong> (`receptionist` / `reception123`) to register a patient, issue a queue token, and capture vitals.</li>
          <li>Log in as <strong className="text-emerald-400">Doctor</strong> (`doctor` / `doctor123`) to call the token, review history, write clinical notes, and build digital prescriptions (Rx).</li>
          <li>Observe the <strong className="text-teal-400">Waiting Room Board</strong> update the called token in real-time, hearing the spoken announcement.</li>
          <li>Log in as <strong className="text-amber-400">Pharmacist</strong> (`pharmacist` / `pharmacy123`) to dispense the prescription and inspect stock level alerts.</li>
          <li>Finally, return to the <strong className="text-medical-400">Receptionist</strong> desk to process check-out billing, select payment modes, and view the receipt.</li>
        </ol>
      </Card>
    </div>
  );
}
