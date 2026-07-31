import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  tokenNumber: string;
  date: string;
  status: 'waiting' | 'in-consultation' | 'completed' | 'cancelled';
  triage: {
    bp: string;
    hr: string;
    temp: string;
    bmi: string;
  } | null;
  patientName: string;
  patientPhone: string;
  patientAllergies: string;
  doctorName: string;
}

interface QueueState {
  appointments: Appointment[];
  socket: Socket | null;
  connected: boolean;
  activeAnnouncement: { token: string; patientName: string; doctorName: string } | null;
  setAppointments: (appts: Appointment[]) => void;
  initializeSocket: (onUpdate: () => void) => void;
  disconnectSocket: () => void;
  clearAnnouncement: () => void;
}

export const useQueueStore = create<QueueState>((set, get) => ({
  appointments: [],
  socket: null,
  connected: false,
  activeAnnouncement: null,

  setAppointments: (appointments) => set({ appointments }),

  initializeSocket: (onUpdate) => {
    if (get().socket) return;

    // Connect to local origin (proxied to port 3001)
    const socket = io(window.location.origin);

    socket.on('connect', () => {
      set({ connected: true });
    });

    socket.on('disconnect', () => {
      set({ connected: false });
    });

    socket.on('queue-updated', () => {
      // Trigger a react-query invalidation callback
      onUpdate();
    });

    socket.on('patient-called', (data: { tokenNumber: string; patientName: string; doctorName: string }) => {
      set({ activeAnnouncement: { token: data.tokenNumber, patientName: data.patientName, doctorName: data.doctorName } });
      
      // Native browser speech synthesizer
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        
        // Custom clinical announcement text
        const text = `Token number ${data.tokenNumber}, Patient ${data.patientName}, please proceed to ${data.doctorName}'s consultation room.`;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.95;
        utterance.pitch = 1.0;
        
        window.speechSynthesis.speak(utterance);
      }
    });

    set({ socket });
  },

  disconnectSocket: () => {
    const socket = get().socket;
    if (socket) {
      socket.disconnect();
      set({ socket: null, connected: false });
    }
  },

  clearAnnouncement: () => set({ activeAnnouncement: null })
}));
export type { QueueState };
