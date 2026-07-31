import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { 
  Stethoscope, 
  Clock, 
  Volume2, 
  Heart, 
  FileText, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Sparkles,
  Thermometer,
  ActivitySquare,
  Gauge
} from 'lucide-react';

export function ConsultationPad() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedAppt, setSelectedAppt] = useState<any | null>(null);
  
  // Encounter Form states
  const [notes, setNotes] = useState('');
  const [diagnosisCodes, setDiagnosisCodes] = useState('J06.9 (Acute Upper Respiratory Infection)');
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  
  // Quick Drug selector states
  const [drugSearch, setDrugSearch] = useState('');
  const [selectedDrug, setSelectedDrug] = useState<any | null>(null);
  const [dosage, setDosage] = useState('1 tablet');
  const [frequency, setFrequency] = useState('Twice daily');
  const [duration, setDuration] = useState('7 days');

  // Diagnostics check list
  const [labOrders, setLabOrders] = useState<Record<string, boolean>>({
    cbc: false,
    lipid: false,
    xray: false,
    ecg: false
  });

  // Query: active queue
  const { data: queue = [] } = useQuery({
    queryKey: ['appointmentsQueue'],
    queryFn: async () => {
      const res = await fetch('/api/appointments');
      return res.json();
    },
    refetchInterval: 4000 // Poll queue
  });

  // Query: inventory search
  const { data: drugs = [] } = useQuery({
    queryKey: ['drugsSearch', drugSearch],
    queryFn: async () => {
      if (!drugSearch) return [];
      const res = await fetch('/api/inventory');
      const all: any[] = await res.json();
      return all.filter(d => d.name.toLowerCase().includes(drugSearch.toLowerCase()));
    }
  });

  const waitingPatients = queue.filter((a: any) => a.status === 'waiting' || a.status === 'in-consultation');

  // Mutation: Call patient (WebSocket chime trigger)
  const callPatientMutation = useMutation({
    mutationFn: async (apptId: string) => {
      const res = await fetch(`/api/appointments/${apptId}/call`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auditUser: user?.name,
          auditRole: user?.role
        })
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['appointmentsQueue'] });
      // Keep selected patient active in consultation state
      const matching = queue.find((a: any) => a.id === data.id);
      setSelectedAppt({ ...matching, ...data });
    }
  });

  // Mutation: Save encounter & Prescription
  const saveEncounterMutation = useMutation({
    mutationFn: async (encounterData: any) => {
      const res = await fetch('/api/encounters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(encounterData)
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointmentsQueue'] });
      setSelectedAppt(null);
      setNotes('');
      setPrescriptions([]);
      setDrugSearch('');
      setSelectedDrug(null);
      setLabOrders({ cbc: false, lipid: false, xray: false, ecg: false });
    }
  });

  // Quick Templates to autofill clinical notes (Simulates templates/voice input)
  const applyTemplate = (type: string) => {
    if (type === 'flu') {
      setNotes('Patient presents with acute onset of fever (101°F), nasal congestion, dry cough, and mild myalgia since 3 days. Throat shows mild erythema. Lungs clear to auscultation. Advised bed rest, increased hydration, and seasonal paracetamol.');
      setDiagnosisCodes('J11.1 (Influenza with other respiratory manifestations)');
    } else if (type === 'hypertension') {
      setNotes('Routine review. Patient asymptomatic. Adherent to current medication. Diet healthy. Blood pressure recorded at 138/86 mmHg. Cardiovascular exam normal. No chest pains reported.');
      setDiagnosisCodes('I10 (Essential Hypertension)');
    }
  };

  const handleAddDrug = () => {
    if (!selectedDrug) return;
    setPrescriptions([...prescriptions, {
      drugName: selectedDrug.name,
      dosage,
      frequency,
      duration
    }]);
    setSelectedDrug(null);
    setDrugSearch('');
  };

  const handleRemoveDrug = (idx: number) => {
    setPrescriptions(prescriptions.filter((_, i) => i !== idx));
  };

  const handleFinishConsultation = () => {
    if (!selectedAppt) return;
    
    // Aggregate lab orders
    const activeLabs = Object.keys(labOrders)
      .filter(k => labOrders[k])
      .map(k => k.toUpperCase());
    
    const formattedNotes = notes + (activeLabs.length > 0 ? `\n[Lab Orders Requisitioned: ${activeLabs.join(', ')}]` : '');

    saveEncounterMutation.mutate({
      appointmentId: selectedAppt.id,
      patientId: selectedAppt.patientId,
      doctorId: user?.id,
      triage: selectedAppt.triage,
      notes: formattedNotes,
      diagnosisCodes,
      prescriptions,
      auditUser: user?.username,
      auditRole: user?.role
    });
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in-up">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Waiting queue column (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="border-slate-800 bg-slate-900/60 p-4 h-[550px] flex flex-col" hoverEffect={false}>
            <div className="pb-3 border-b border-slate-850 mb-3 flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="h-4.5 w-4.5 text-slate-455" />
                Active OPD Queue
              </h3>
              <span className="text-[10px] font-bold bg-slate-800 text-slate-350 px-2 py-0.5 rounded-full">
                {waitingPatients.length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 no-scrollbar">
              {waitingPatients.length > 0 ? (
                waitingPatients.map((appt: any) => {
                  const isSelected = selectedAppt?.id === appt.id;
                  const isConsulting = appt.status === 'in-consultation';
                  return (
                    <div 
                      key={appt.id}
                      className={`p-3 rounded-lg border transition-all ${
                        isSelected 
                          ? 'border-medical-500 bg-medical-950/20' 
                          : isConsulting
                            ? 'border-amber-500/40 bg-slate-900/60'
                            : 'border-slate-800 bg-slate-950/20 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-mono font-bold text-medical-400">Token {appt.tokenNumber}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded capitalize ${
                          isConsulting ? 'bg-amber-950/60 border border-amber-900 text-amber-400 animate-pulse' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {appt.status}
                        </span>
                      </div>
                      
                      <h4 className="text-xs font-bold text-white truncate">{appt.patientName}</h4>
                      
                      {appt.triage && (
                        <p className="text-[9px] text-slate-400 mt-1">BP: {appt.triage.bp} | HR: {appt.triage.hr} bpm</p>
                      )}

                      <div className="flex gap-1.5 mt-3">
                        <Button
                          variant="glass"
                          size="sm"
                          className="flex-1 text-[10px] py-1 border border-slate-800"
                          onClick={() => setSelectedAppt(appt)}
                        >
                          EHR file
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          className="flex-1 text-[10px] py-1"
                          onClick={() => callPatientMutation.mutate(appt.id)}
                          loading={callPatientMutation.isPending && selectedAppt?.id === appt.id}
                        >
                          <Volume2 className="h-3 w-3" />
                          Call Room
                        </Button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-20 text-center text-xs text-slate-500">
                  No patients in consultation queue.
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Consultation Workspace column (9 cols) */}
        <div className="lg:col-span-9">
          {selectedAppt ? (
            <Card glowColor={selectedAppt.status === 'in-consultation' ? 'cyan' : 'none'} className="border-slate-800 bg-slate-900/60 p-6 space-y-5" hoverEffect={false}>
              
              {/* Patient Banner */}
              <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    {selectedAppt.patientName}
                    <span className="text-xs font-semibold px-2 py-0.5 bg-slate-800 text-slate-350 rounded border border-slate-750">
                      Token {selectedAppt.tokenNumber}
                    </span>
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1">Phone: {selectedAppt.patientPhone} | Known Allergies: <strong className="text-rose-400">{selectedAppt.patientAllergies || 'None'}</strong></p>
                </div>
                
                {/* Triage summary badges */}
                {selectedAppt.triage ? (
                  <div className="flex gap-2 bg-slate-950/40 p-2 rounded-lg border border-slate-850">
                    <div className="text-center px-2 border-r border-slate-850">
                      <p className="text-[8px] text-slate-550 uppercase font-bold flex items-center justify-center gap-0.5"><Gauge className="h-3 w-3 text-blue-400" /> BP</p>
                      <p className="text-xs font-bold text-white font-mono">{selectedAppt.triage.bp}</p>
                    </div>
                    <div className="text-center px-2 border-r border-slate-850">
                      <p className="text-[8px] text-slate-550 uppercase font-bold flex items-center justify-center gap-0.5"><Heart className="h-3 w-3 text-rose-455" /> HR</p>
                      <p className="text-xs font-bold text-white font-mono">{selectedAppt.triage.hr}</p>
                    </div>
                    <div className="text-center px-2 border-r border-slate-850">
                      <p className="text-[8px] text-slate-550 uppercase font-bold flex items-center justify-center gap-0.5"><Thermometer className="h-3 w-3 text-amber-450" /> Temp</p>
                      <p className="text-xs font-bold text-white font-mono">{selectedAppt.triage.temp}°F</p>
                    </div>
                    <div className="text-center px-2">
                      <p className="text-[8px] text-slate-550 uppercase font-bold flex items-center justify-center gap-0.5"><ActivitySquare className="h-3 w-3 text-emerald-450" /> BMI</p>
                      <p className="text-xs font-bold text-white font-mono">{selectedAppt.triage.bmi}</p>
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-amber-400 font-bold animate-pulse flex items-center gap-1">
                    <Clock className="h-4 w-4" /> Patient vitals not captured yet
                  </span>
                )}
              </div>

              {/* Consultation details */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                
                {/* Clinical Notes (7 cols) */}
                <div className="md:col-span-7 space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <FileText className="h-4 w-4 text-medical-400" />
                        Clinical Intake & Encounter Notes
                      </label>
                      
                      {/* Autofill templates */}
                      <div className="flex gap-1.5">
                        <button 
                          onClick={() => applyTemplate('flu')}
                          className="text-[9px] font-semibold text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800 border border-slate-750 flex items-center gap-1"
                        >
                          <Sparkles className="h-3 w-3 text-amber-400" /> Flu
                        </button>
                        <button 
                          onClick={() => applyTemplate('hypertension')}
                          className="text-[9px] font-semibold text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800 border border-slate-750 flex items-center gap-1"
                        >
                          <Sparkles className="h-3 w-3 text-blue-400" /> HyperT
                        </button>
                      </div>
                    </div>
                    
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Input symptoms, clinical diagnosis details, advice..."
                      rows={6}
                      className="w-full px-3 py-2 text-xs glass-input resize-none"
                    />
                  </div>

                  {/* Diagnostic orders */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block">Diagnostics / Requisitions Orders</label>
                    <div className="grid grid-cols-4 gap-2 bg-slate-950/40 p-3 rounded-lg border border-slate-850">
                      {Object.keys(labOrders).map((k) => (
                        <label key={k} className="flex items-center gap-2 text-xs font-semibold text-slate-300 capitalize cursor-pointer hover:text-white">
                          <input
                            type="checkbox"
                            checked={labOrders[k]}
                            onChange={(e) => setLabOrders({ ...labOrders, [k]: e.target.checked })}
                            className="accent-medical-500 rounded"
                          />
                          {k}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Diagnosis classification */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ICD-10 Diagnostic Classification</label>
                    <input
                      type="text"
                      value={diagnosisCodes}
                      onChange={(e) => setDiagnosisCodes(e.target.value)}
                      className="w-full px-3 py-2 text-xs glass-input"
                    />
                  </div>
                </div>

                {/* Digital Prescription Rx Builder (5 cols) */}
                <div className="md:col-span-5 space-y-4 border-t md:border-t-0 md:border-l border-slate-800 md:pl-5">
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1.5">
                      <Stethoscope className="h-4 w-4 text-emerald-400" />
                      Digital Prescription Rx Builder
                    </label>

                    {/* Drug Stock Search */}
                    <div className="space-y-1.5 relative">
                      <input
                        type="text"
                        value={drugSearch}
                        onChange={(e) => setDrugSearch(e.target.value)}
                        placeholder="Search stock medication..."
                        className="w-full px-3 py-1.5 text-xs glass-input"
                      />
                      {drugSearch && (
                        <div className="absolute z-10 w-full mt-1 border border-slate-800 bg-slate-900 rounded-lg shadow-xl max-h-36 overflow-y-auto no-scrollbar divide-y divide-slate-850">
                          {drugs.map((d: any) => (
                            <button
                              key={d.id}
                              onClick={() => {
                                setSelectedDrug(d);
                                setDrugSearch(d.name);
                              }}
                              className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-800 text-slate-200"
                            >
                              {d.name} <span className="text-[9px] text-slate-500 font-bold font-mono">({d.qty} in stock)</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Rx Line items parameters */}
                    {selectedDrug && (
                      <div className="p-3 bg-slate-950/60 border border-slate-850 rounded-lg space-y-3.5 animate-fade-in-up">
                        <div className="flex items-center justify-between text-xs text-white font-bold">
                          <span>{selectedDrug.name}</span>
                          <span className="text-[9px] px-1 bg-medical-950 text-medical-300 rounded font-mono">Pack: LKR {selectedDrug.price}</span>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2">
                          <input
                            type="text"
                            value={dosage}
                            onChange={(e) => setDosage(e.target.value)}
                            placeholder="Dosage"
                            className="px-2 py-1 text-[10px] glass-input"
                          />
                          <input
                            type="text"
                            value={frequency}
                            onChange={(e) => setFrequency(e.target.value)}
                            placeholder="Frequency"
                            className="px-2 py-1 text-[10px] glass-input"
                          />
                          <input
                            type="text"
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                            placeholder="Duration"
                            className="px-2 py-1 text-[10px] glass-input"
                          />
                        </div>

                        <Button
                          onClick={handleAddDrug}
                          className="w-full text-[10px] py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                        >
                          <Plus className="h-3.5 w-3.5" /> Append Medication
                        </Button>
                      </div>
                    )}

                    {/* Prescribed summary list */}
                    <div className="space-y-1.5 border border-slate-800 rounded-lg p-2.5 max-h-36 overflow-y-auto no-scrollbar bg-slate-950/20">
                      {prescriptions.length > 0 ? (
                        prescriptions.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-[10px] border-b border-slate-850/60 pb-1.5 mb-1.5 last:border-b-0 last:pb-0 last:mb-0 text-slate-300">
                            <div>
                              <p className="font-bold text-white">{item.drugName}</p>
                              <p className="text-[9px] text-slate-455">{item.dosage} • {item.frequency} • {item.duration}</p>
                            </div>
                            <button onClick={() => handleRemoveDrug(idx)} className="text-rose-455 hover:text-rose-300">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-[10px] text-slate-500 text-center py-4">No medications added to Rx pad.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 pt-3 border-t border-slate-800">
                <Button
                  onClick={handleFinishConsultation}
                  className="flex-1 text-xs py-2 bg-gradient-to-r from-medical-600 to-medical-500"
                  loading={saveEncounterMutation.isPending}
                >
                  <CheckCircle2 className="h-4 w-4" /> Save Encounter & Route Prescription
                </Button>
                <Button
                  variant="secondary"
                  className="text-xs py-2"
                  onClick={() => setSelectedAppt(null)}
                >
                  Cancel
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="border-slate-800 bg-slate-900/20 p-8 text-center text-xs text-slate-500 h-[550px] flex flex-col justify-center items-center" hoverEffect={false}>
              <Stethoscope className="h-14 w-14 text-slate-700 mb-4 animate-pulse-slow" />
              <h3 className="text-sm font-bold text-slate-400">Electronic Health Records Workstation</h3>
              <p className="max-w-md mx-auto mt-2 text-slate-500">Select a token patient from the active OPD queue list on the left to start their clinical check-in file.</p>
            </Card>
          )}
        </div>

      </div>
    </div>
  );
}
export default ConsultationPad;
