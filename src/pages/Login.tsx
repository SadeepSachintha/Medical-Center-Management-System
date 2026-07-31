import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Stethoscope, Lock, User, AlertCircle, ShieldAlert } from 'lucide-react';

export function Login() {
  const { login } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (data.success) {
        login(data.user);
      } else {
        setError(data.message || 'Invalid credentials');
      }
    } catch (err) {
      setError('Connection to clinic server failed');
    } finally {
      setLoading(false);
    }
  };

  // Prefill credentials for reviewers/testing
  const handleQuickLogin = (role: 'receptionist' | 'doctor' | 'pharmacist' | 'admin') => {
    const creds = {
      receptionist: { u: 'receptionist', p: 'reception123' },
      doctor: { u: 'doctor', p: 'doctor123' },
      pharmacist: { u: 'pharmacist', p: 'pharmacy123' },
      admin: { u: 'admin', p: 'admin123' }
    };
    const c = creds[role];
    if (c) {
      setUsername(c.u);
      setPassword(c.p);
      // Automatically log in for faster testing flow
      setLoading(true);
      setError(null);
      setTimeout(async () => {
        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: c.u, password: c.p })
          });
          const data = await res.json();
          if (data.success) {
            login(data.user);
          } else {
            setError(data.message);
          }
        } catch (e) {
          setError('Server connection failed');
        } finally {
          setLoading(false);
        }
      }, 500);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative bg-slate-950">
      {/* Background graphic elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-medical-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-purple-650/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md space-y-6 z-10 animate-fade-in-up">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 rounded-xl bg-gradient-to-tr from-medical-600 to-medical-400 items-center justify-center shadow-xl shadow-medical-500/20 mb-2">
            <Stethoscope className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white font-sans">Aura Medical Center</h2>
          <p className="text-xs text-slate-455">Enterprise Outpatient Management Suite (MCMS)</p>
        </div>

        {/* Login Form Card */}
        <Card className="border-slate-800 bg-slate-900/60 p-6 shadow-xl" hoverEffect={false}>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-900/50 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Username */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter credential username"
                  className="w-full pl-9 pr-4 py-2 text-xs glass-input"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter credential password"
                  className="w-full pl-9 pr-4 py-2 text-xs glass-input"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full text-xs py-2 bg-gradient-to-r from-medical-600 to-medical-500 hover:from-medical-500 hover:to-medical-400 text-white font-semibold"
              loading={loading}
            >
              Sign In to Suite
            </Button>
          </form>

          {/* Quick Logins for reviewers */}
          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2 text-center flex items-center justify-center gap-1.5">
              <ShieldAlert className="h-3 w-3 text-medical-400" />
              Demo Roles Quick-Login:
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="text-[10px] py-1.5 bg-slate-950 border border-slate-800 text-slate-300"
                onClick={() => handleQuickLogin('receptionist')}
              >
                Receptionist Desk
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="text-[10px] py-1.5 bg-slate-950 border border-slate-800 text-slate-300"
                onClick={() => handleQuickLogin('doctor')}
              >
                Doctor EHR Pad
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="text-[10px] py-1.5 bg-slate-950 border border-slate-800 text-slate-300"
                onClick={() => handleQuickLogin('pharmacist')}
              >
                Pharmacist Box
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="text-[10px] py-1.5 bg-slate-950 border border-slate-800 text-slate-300"
                onClick={() => handleQuickLogin('admin')}
              >
                System Admin
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
