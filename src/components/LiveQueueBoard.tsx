import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useQueueStore } from '../store/queueStore';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Tv, Volume2, ArrowLeft, Users, Clock, ArrowRight } from 'lucide-react';

interface LiveQueueBoardProps {
  onBack?: () => void;
}

export function LiveQueueBoard({ onBack }: LiveQueueBoardProps) {
  const { activeAnnouncement, clearAnnouncement, connected } = useQueueStore();
  const [time, setTime] = useState(new Date());

  // Keep clock running
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch appointments (queue)
  const { data: queue = [], refetch } = useQuery({
    queryKey: ['liveQueue'],
    queryFn: async () => {
      const res = await fetch('/api/appointments');
      return res.json();
    },
    refetchInterval: 3000 // Quick poll on queue status board
  });

  const waitingTokens = queue.filter((a: any) => a.status === 'waiting');
  const activeConsultation = queue.find((a: any) => a.status === 'in-consultation');

  // Trigger manual speech synthesis for testing
  const playAnnouncement = (token: string, name: string, doc: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const text = `Token number ${token}, Patient ${name}, please proceed to ${doc}'s consultation room.`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col p-6 font-sans relative overflow-hidden animate-fade-in-up">
      {/* Decorative radial glows */}
      <div className="absolute -top-1/4 -left-1/4 w-[600px] h-[600px] bg-medical-500/5 rounded-full blur-[180px] pointer-events-none" />
      <div className="absolute -bottom-1/4 -right-1/4 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[180px] pointer-events-none" />

      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6 z-10">
        <div className="flex items-center gap-3">
          {onBack && (
            <button 
              onClick={onBack}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <div className="flex items-center gap-2 text-medical-455">
            <Tv className="h-6 w-6 text-medical-400 animate-pulse" />
            <h1 className="text-lg font-bold tracking-tight text-white uppercase">Waiting Room Status Monitor</h1>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Status Badge */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-850 px-3 py-1.5 rounded-lg text-xs font-semibold">
            <span className={`h-2 w-2 rounded-full ${connected ? 'bg-emerald-500 animate-ping' : 'bg-rose-500'}`} />
            <span>{connected ? 'Live Syncing' : 'Connection Lost'}</span>
          </div>
          {/* Big Clock */}
          <div className="text-right">
            <p className="text-xl font-bold font-mono tracking-tight text-white">
              {time.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              {time.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      {/* Grid containing Active called token & queue lists */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 z-10">
        
        {/* Main "NOW SERVING" panel (occupies 7 columns) */}
        <div className="lg:col-span-8 flex flex-col space-y-6">
          <Card 
            glowColor={activeConsultation ? "cyan" : "none"} 
            className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-900/40 relative border-2 border-medical-500/20"
          >
            {activeConsultation ? (
              <div className="w-full text-center space-y-6">
                <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-medical-400 uppercase tracking-widest bg-medical-950 border border-medical-900 rounded-full px-4 py-1.5 animate-bounce">
                  Now Consulted
                </span>
                
                {/* Big Token Number */}
                <div className="space-y-1">
                  <h2 className="text-8xl font-black text-white font-mono tracking-tighter drop-shadow-xl animate-pulse-slow">
                    {activeConsultation.tokenNumber}
                  </h2>
                  <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Token Number</p>
                </div>

                <div className="h-px bg-slate-800 max-w-md mx-auto" />

                {/* Patient / Doctor Detail */}
                <div className="grid grid-cols-2 gap-4 max-w-xl mx-auto">
                  <div className="text-right border-r border-slate-800 pr-6">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Patient Name</p>
                    <p className="text-xl font-bold text-white truncate">{activeConsultation.patientName}</p>
                  </div>
                  <div className="text-left pl-6">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Consultation Room</p>
                    <p className="text-xl font-bold text-medical-300 truncate">{activeConsultation.doctorName}</p>
                  </div>
                </div>

                {/* Re-speak alert for testers */}
                <div className="pt-4 flex justify-center">
                  <Button 
                    variant="glass" 
                    size="sm"
                    className="text-[10px] py-1 border border-slate-800 hover:border-slate-700"
                    onClick={() => playAnnouncement(activeConsultation.tokenNumber, activeConsultation.patientName, activeConsultation.doctorName)}
                  >
                    <Volume2 className="h-4 w-4 text-medical-400" />
                    Simulate Audio Call
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-20">
                <Users className="h-16 w-16 text-slate-600 mx-auto mb-4 animate-pulse-slow" />
                <h3 className="text-lg font-bold text-slate-400">All Consultations Completed</h3>
                <p className="text-xs text-slate-500 mt-1">Waiting for the next patient to check in at front desk.</p>
              </div>
            )}
          </Card>

          {/* Flash Alert Banner when a WebSocket call is received */}
          {activeAnnouncement && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-medical-900 to-slate-900 border border-medical-500 shadow-xl shadow-medical-950/20 flex items-center justify-between animate-fade-in-up">
              <div className="flex items-center gap-3">
                <Volume2 className="h-6 w-6 text-medical-400 animate-pulse" />
                <div>
                  <h4 className="text-xs font-bold text-white">Calling Token {activeAnnouncement.token}</h4>
                  <p className="text-[10px] text-slate-400">Patient: <strong className="text-slate-200">{activeAnnouncement.patientName}</strong> is called to <strong className="text-slate-200">{activeAnnouncement.doctorName}</strong>.</p>
                </div>
              </div>
              <button 
                onClick={clearAnnouncement} 
                className="text-[10px] font-bold text-medical-400 hover:text-medical-300 px-2 py-1 rounded bg-medical-950/60"
              >
                Dismiss Alert
              </button>
            </div>
          )}
        </div>

        {/* Right side list "UPCOMING / WAITING QUEUE" (occupies 4 columns) */}
        <div className="lg:col-span-4 flex flex-col space-y-4">
          <Card className="flex-1 flex flex-col bg-slate-900/40 p-4 border border-slate-800" hoverEffect={false}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-400" />
                Waiting Queue
              </h3>
              <span className="text-[10px] font-bold bg-slate-800 text-slate-350 px-2.5 py-0.5 rounded-full">
                {waitingTokens.length} Patients
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 max-h-[480px] pr-1 no-scrollbar">
              {waitingTokens.length > 0 ? (
                waitingTokens.map((item: any, idx: number) => (
                  <div 
                    key={item.id}
                    className="p-3 rounded-lg border border-slate-800/60 bg-slate-950/30 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded bg-slate-900 border border-slate-850 flex items-center justify-center font-mono font-bold text-xs text-medical-400">
                        {item.tokenNumber}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white truncate max-w-[120px]">{item.patientName}</h4>
                        <p className="text-[9px] text-slate-500">Scheduled: {new Date(item.date).toLocaleTimeString(undefined, {hour: '2-digit', minute:'2-digit'})}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold bg-slate-900 text-slate-400 border border-slate-800 px-2 py-0.5 rounded">
                        #{idx + 1} next
                      </span>
                      {item.triage ? (
                        <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/50 border border-emerald-900/60 px-1.5 py-0.5 rounded">
                          Triage OK
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold text-amber-400 bg-amber-950/50 border border-amber-900/60 px-1.5 py-0.5 rounded animate-pulse">
                          Pending Triage
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-20 text-center text-xs text-slate-500">
                  No other patients in the waiting line.
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
export default LiveQueueBoard;
