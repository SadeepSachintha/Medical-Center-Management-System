import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { UserCheck, Search, ShieldCheck, AlertCircle } from 'lucide-react';

export function PatientOnboarding() {
  const { user } = useAuthStore();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    dob: '',
    gender: 'Male',
    nationalId: '',
    allergies: '',
    history: ''
  });
  
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.nationalId) {
      setError('Please fill in Name, Phone, and National ID.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          auditUser: user?.username,
          auditRole: user?.role
        })
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        // Clear form
        setFormData({
          name: '',
          phone: '',
          dob: '',
          gender: 'Male',
          nationalId: '',
          allergies: '',
          history: ''
        });
      } else {
        setError(data.error || 'Failed to onboard patient profile');
      }
    } catch (err) {
      setError('Failed to contact medical server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in-up">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Onboarding Intake Form */}
        <Card className="border-slate-800 bg-slate-900/60 p-6" hoverEffect={false}>
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-5">
            <div className="h-9 w-9 rounded-lg bg-medical-950 border border-medical-800 flex items-center justify-center text-medical-400">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Create Patient Demographics File</h3>
              <p className="text-[10px] text-slate-455">Establish a new patient electronic healthcare record (EHR)</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {success && (
              <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-900/50 text-emerald-450 text-xs flex items-center gap-2">
                <ShieldCheck className="h-4.5 w-4.5 shrink-0" />
                <span>Patient demographics profile successfully created and committed to the database.</span>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-900/50 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Patient Full Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Patient Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Johnathan Doe"
                  className="w-full px-3 py-2 text-xs glass-input"
                />
              </div>

              {/* National ID / Passport */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">National Identification / ID *</label>
                <input
                  type="text"
                  required
                  value={formData.nationalId}
                  onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                  placeholder="e.g. NID-8830-49"
                  className="w-full px-3 py-2 text-xs glass-input"
                />
              </div>

              {/* Phone Number */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Contact Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g. 1234567890"
                  className="w-full px-3 py-2 text-xs glass-input"
                />
              </div>

              {/* DOB */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Date of Birth</label>
                <input
                  type="date"
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  className="w-full px-3 py-2 text-xs glass-input"
                />
              </div>

              {/* Gender */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Biological Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-3 py-2 text-xs glass-input"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Drug Allergies */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Known Drug Allergies</label>
                <input
                  type="text"
                  value={formData.allergies}
                  onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                  placeholder="e.g. Penicillin, Sulfa drugs (leave blank if none)"
                  className="w-full px-3 py-2 text-xs glass-input"
                />
              </div>
            </div>

            {/* Medical History */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Prior Clinical History & Diagnoses</label>
              <textarea
                value={formData.history}
                onChange={(e) => setFormData({ ...formData, history: e.target.value })}
                placeholder="e.g. Chronic Hypertension diagnosed in 2022. Past appendectomy."
                rows={3}
                className="w-full px-3 py-2 text-xs glass-input resize-none"
              />
            </div>

            <Button
              type="submit"
              className="w-full py-2 text-xs font-semibold bg-gradient-to-r from-medical-600 to-medical-500 hover:from-medical-500 hover:to-medical-400 text-white"
              loading={loading}
            >
              Commit File & Register Patient
            </Button>
          </form>
        </Card>

      </div>
    </div>
  );
}
export default PatientOnboarding;
