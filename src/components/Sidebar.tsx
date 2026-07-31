import React from 'react';
import { useAuthStore } from '../store/authStore';
import { useQueueStore } from '../store/queueStore';
import { 
  LayoutDashboard, 
  Users, 
  UserPlus, 
  ClipboardList, 
  CreditCard, 
  Stethoscope, 
  Pill, 
  Package, 
  ShieldCheck, 
  BarChart3, 
  LogOut, 
  ExternalLink,
  Tv
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export function Sidebar({ currentTab, setCurrentTab }: SidebarProps) {
  const { user, logout } = useAuthStore();
  const { connected } = useQueueStore();

  if (!user) return null;

  // Define menu items by role
  const menuConfig = {
    admin: [
      { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
      { id: 'admin-users', name: 'User Accounts', icon: Users },
      { id: 'admin-audit', name: 'Compliance Logs', icon: ShieldCheck },
      { id: 'admin-finance', name: 'Financial Panel', icon: BarChart3 }
    ],
    doctor: [
      { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
      { id: 'doctor-consult', name: 'Consultation Pad', icon: Stethoscope }
    ],
    receptionist: [
      { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
      { id: 'reception-onboarding', name: 'Patient Intake', icon: UserPlus },
      { id: 'reception-queue', name: 'Queue Scheduler', icon: ClipboardList },
      { id: 'reception-billing', name: 'Billing Desk', icon: CreditCard }
    ],
    pharmacist: [
      { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
      { id: 'pharmacy-prescriptions', name: 'Prescription Rx', icon: Pill },
      { id: 'pharmacy-inventory', name: 'Inventory Manager', icon: Package }
    ]
  };

  const menuItems = menuConfig[user.role] || [];

  return (
    <aside className="w-64 glass-panel border-r border-slate-800/80 flex flex-col justify-between h-screen sticky top-0 no-print">
      <div>
        {/* Logo Section */}
        <div className="p-6 border-b border-slate-800/80 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-medical-600 to-medical-400 flex items-center justify-center shadow-lg shadow-medical-500/20">
            <Stethoscope className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight leading-none">AURA MCMS</h1>
            <span className="text-[10px] text-medical-400 font-semibold tracking-wider uppercase">Medical Suite</span>
          </div>
        </div>

        {/* User Info Capsule */}
        <div className="px-4 py-4 border-b border-slate-800/40 bg-slate-900/20">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-medical-300">
              {user.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">{user.name}</p>
              <p className="text-[10px] text-slate-400 capitalize truncate">{user.role} • {user.specialty}</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-4 space-y-1">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-2">Main Menu</p>
          
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 relative ${
                  isActive 
                    ? 'bg-gradient-to-r from-medical-600/35 to-medical-500/10 text-white border-l-2 border-medical-500' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                }`}
              >
                <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-medical-400' : 'text-slate-400'}`} />
                {item.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info / Logouts */}
      <div className="p-4 border-t border-slate-800/80 space-y-2 bg-slate-950/40">
        {/* Waiting Room Screen Link */}
        <button
          onClick={() => setCurrentTab('live-queue-board')}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 bg-slate-900/60 hover:bg-slate-900 hover:text-white border border-slate-800 transition-all"
        >
          <span className="flex items-center gap-2">
            <Tv className="h-4 w-4 text-emerald-400" />
            Waiting Room Board
          </span>
          <ExternalLink className="h-3 w-3" />
        </button>

        {/* Connection status indicator */}
        <div className="flex items-center justify-between px-3 py-1.5 rounded-md bg-slate-900/30 text-[10px] text-slate-400">
          <span>Server Socket Sync</span>
          <span className="flex items-center gap-1">
            <span className={`h-1.5 w-1.5 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            {connected ? 'Syncing' : 'Offline'}
          </span>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-950/20 hover:text-rose-300 transition-colors"
        >
          <LogOut className="h-4.5 w-4.5" />
          Logout Session
        </button>
      </div>
    </aside>
  );
}
