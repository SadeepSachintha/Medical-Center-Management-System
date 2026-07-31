import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { Search, Bell, Activity, X, UserCheck } from 'lucide-react';
import { Card } from './ui/Card';

interface HeaderProps {
  currentTab: string;
}

export function Header({ currentTab }: HeaderProps) {
  const { user } = useAuthStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const getPageTitle = () => {
    switch (currentTab) {
      case 'dashboard': return 'Clinic Activity Dashboard';
      case 'reception-onboarding': return 'Patient Intake & Registration';
      case 'reception-queue': return 'OPD Queue Control & Triage';
      case 'reception-billing': return 'Cashier & Billing Desk';
      case 'doctor-consult': return 'Clinical Consultation Pad (EHR)';
      case 'pharmacy-prescriptions': return 'Pharmacy Rx Dispensing Desk';
      case 'pharmacy-inventory': return 'Medication Stock & Inventory Control';
      case 'admin-users': return 'System User Account Setup (RBAC)';
      case 'admin-audit': return 'HIPAA & GDPR Compliance Security Audit Trail';
      case 'admin-finance': return 'Financial Analytics & Revenue Control';
      case 'live-queue-board': return 'Live Waiting Room Display';
      default: return 'Medical Center Suite';
    }
  };

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  // Handle patient lookup on query change
  useEffect(() => {
    if (!searchQuery) {
      setSearchResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/patients?search=${searchQuery}&auditUser=${user?.username}&auditRole=${user?.role}`);
        const data = await res.json();
        setSearchResults(data);
      } catch (err) {
        console.error('Error searching patients:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, user]);

  return (
    <>
      <header className="h-16 border-b border-slate-800/80 bg-slate-950/40 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30 no-print">
        <div>
          <h2 className="text-sm font-semibold text-white tracking-wide">{getPageTitle()}</h2>
          <p className="text-[10px] text-slate-400">Clinic Station: Outpatient Department</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Quick Patient Search Button */}
          {user?.role !== 'admin' && (
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-400 hover:text-slate-200 transition-all hover:bg-slate-850"
            >
              <Search className="h-3.5 w-3.5" />
              <span>Quick patient lookup...</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-semibold text-slate-500 bg-slate-950 border border-slate-850 rounded">
                Ctrl+K
              </kbd>
            </button>
          )}

          {/* Current Date Capsule */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/50 border border-slate-850 text-slate-300 text-[11px] font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-medical-500" />
            {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
          </div>
        </div>
      </header>

      {/* Global Quick Search Overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-start justify-center pt-24 px-4 transition-all duration-300">
          <Card className="w-full max-w-2xl border-slate-800 bg-slate-900 shadow-2xl relative animate-fade-in-up" hoverEffect={false}>
            {/* Close Button */}
            <button
              onClick={() => {
                setSearchOpen(false);
                setSearchQuery('');
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Input bar */}
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3 mb-4">
              <Search className="h-5 w-5 text-medical-450" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search patient by Name, Phone Number, or National ID..."
                className="w-full bg-transparent border-none text-sm text-slate-100 outline-none placeholder-slate-500"
              />
            </div>

            {/* Results pane */}
            <div className="max-h-96 overflow-y-auto space-y-2 pr-1 no-scrollbar">
              {loading ? (
                <div className="py-8 text-center text-xs text-slate-500">Searching clinic register...</div>
              ) : searchQuery && searchResults.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">No matching patient profiles found.</div>
              ) : searchQuery ? (
                searchResults.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-lg border border-slate-800 bg-slate-950/40 hover:border-medical-500/50 hover:bg-slate-950 transition-all flex items-center justify-between"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-2">
                        {p.name}
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                          {p.gender}
                        </span>
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Phone: <span className="font-semibold text-slate-300">{p.phone}</span> | ID: <span className="font-semibold text-slate-350">{p.nationalId}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] px-2 py-1 rounded-md bg-medical-950 border border-medical-900 text-medical-300 font-bold block mb-1">
                        Allergies: {p.allergies}
                      </span>
                      <span className="text-[9px] text-slate-500 block truncate max-w-xs">{p.history}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-slate-500">
                  Type a patient name or search keyword to start query.
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
