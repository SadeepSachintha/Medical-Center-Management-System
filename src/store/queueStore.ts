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
  announcementLanguage: 'en' | 'si' | 'ta' | 'mixed';
  setAppointments: (appts: Appointment[]) => void;
  initializeSocket: (onUpdate: () => void) => void;
  disconnectSocket: () => void;
  clearAnnouncement: () => void;
  setAnnouncementLanguage: (lang: 'en' | 'si' | 'ta' | 'mixed') => void;
}

export const useQueueStore = create<QueueState>((set, get) => ({
  appointments: [],
  socket: null,
  connected: false,
  activeAnnouncement: null,
  announcementLanguage: 'mixed',

  setAppointments: (appointments) => set({ appointments }),
  setAnnouncementLanguage: (announcementLanguage) => set({ announcementLanguage }),

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
      
      const lang = get().announcementLanguage;

      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        
        const speakText = (textStr: string, voiceLang: string) => {
          const utterance = new SpeechSynthesisUtterance(textStr);
          utterance.rate = 0.90;
          utterance.pitch = 1.0;
          
          const voices = window.speechSynthesis.getVoices();
          const matchedVoice = voices.find(v => v.lang.startsWith(voiceLang));
          if (matchedVoice) {
            utterance.voice = matchedVoice;
          }
          window.speechSynthesis.speak(utterance);
        };

        const docNameClean = data.doctorName.replace(/Dr\.\s*/i, '');

        if (lang === 'en') {
          speakText(`Token number ${data.tokenNumber}, Patient ${data.patientName}, please proceed to Dr. ${docNameClean}'s consultation room.`, 'en');
        } else if (lang === 'si') {
          speakText(`ටෝකන් අංක ${data.tokenNumber}, රෝගී ${data.patientName}, කරුණාකර වෛද්‍ය ${docNameClean} මහතා හමුවීමට පැමිණෙන්න.`, 'si');
        } else if (lang === 'ta') {
          speakText(`அடையாள அட்டை எண் ${data.tokenNumber}, நோயாளி ${data.patientName}, தயவுசெய்து மருத்துவர் ${docNameClean} அறைக்கு வரவும்.`, 'ta');
        } else if (lang === 'mixed') {
          speakText(`Token number ${data.tokenNumber}, Patient ${data.patientName}, please proceed to Dr. ${docNameClean}'s room.`, 'en');
          
          setTimeout(() => {
            speakText(`ටෝකන් අංක ${data.tokenNumber}, රෝගී ${data.patientName}, කරුණාකර වෛද්‍ය ${docNameClean} මහතා හමුවීමට පැමිණෙන්න.`, 'si');
          }, 6500);
        }
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
