# Aura Medical Center Management System (MCMS)
## System Architecture & Software Engineering Documentation

This document provides a detailed technical overview of the system architecture, design patterns, database schemas, and core algorithms implemented in MCMS. It serves as the primary technical reference for software engineering reviews and academic evaluation (Final Year Project).

---

## 1. Architectural Design Overview

MCMS is designed as an offline-first, high-availability standalone clinical management suite. The system utilizes a three-tier architecture hosted entirely on a local server or LAN network, eliminating external cloud dependency to maximize patient data privacy (HIPAA compliance) and minimize queue voice-announcement latency.

### System Components Topology
```mermaid
graph TD
    subgraph Client Tier [Client Tier (React 19 SPA)]
        UI[React Components & Hooks]
        Zustand[Zustand State Store (Auth)]
        Query[TanStack Query Cache (API Polling)]
        WS_Client[Socket.io-client (Real-time Sync)]
    end

    subgraph Application Tier [Application Tier (Node.js Express + WebSockets)]
        Server[Express REST Server (Port 3001)]
        WS_Server[Socket.io Server]
        Mail[Nodemailer Mail Dispatcher]
        PDF[PDFKit Document Engine]
    end

    subgraph Database Tier [Database Tier (JSON Relational Database)]
        DB_Controller[database.cjs (Atomic File Writer)]
        JSON_File[(db.json file on Disk)]
    end

    UI -->|REST API Requests| Server
    UI -->|WebSockets Socket| WS_Server
    Server -->|Read/Write Operations| DB_Controller
    DB_Controller -->|Locked File Writes| JSON_File
    WS_Server -->|Push Queue Updates| UI
    Server -->|Generate PDFs| PDF
    Server -->|Dispatch Emails| Mail
```

---

## 2. Database Schema (Relational JSON Layout)

The database utilizes `db.json` as a single-file flat database. Data integrity is maintained at the application controller level (`server/database.cjs`) using javascript array references.

### Schema Entities & Data Models

#### 1. Patients Table (`patients`)
```typescript
interface Patient {
  id: string;          // Primary Key (Format: p-XXXXXX)
  nationalId: string;  // Unique ID (NID/Passport)
  name: string;
  phone: string;
  email: string;       // Optional, used for automated SMTP dispatches
  dob: string;         // YYYY-MM-DD
  gender: 'Male' | 'Female';
  allergies: string;   // Defaults to "None"
  history: string;     // Medical history logs
}
```

#### 2. Users / Staff Table (`users`)
Supports Role-Based Access Control (RBAC). Doctor profiles feature extended rostering properties.
```typescript
interface User {
  id: string;          // Primary Key (Format: u-X)
  username: string;    // Unique login identifier
  passwordHash: string;// Plain-text simulated or hashed credentials
  name: string;
  role: 'admin' | 'doctor' | 'receptionist' | 'pharmacist';
  specialty?: string;  // Doctors only (e.g. General Medicine, Pediatrics)
  roomNumber?: string; // Doctors only (e.g. Room 3, OPD Desk B)
  consultationFee?: number; // Doctors only (in LKR, defaults to 1500)
  roster?: {           // Weekly calendar shifts
    [dayName: string]: {
      active: boolean;
      startTime: string; // HH:MM
      endTime: string;   // HH:MM
    }
  };
  overrides?: Array<{  // Time-off/Vacation overrides
    id: string;
    date: string;       // YYYY-MM-DD
    reason: string;
  }>;
}
```

#### 3. Appointments / Queue Table (`appointments`)
```typescript
interface Appointment {
  id: string;          // Primary Key (Format: a-XXXXXX)
  patientId: string;   // Foreign Key -> patients.id
  doctorId: string;    // Foreign Key -> users.id
  tokenNumber: string; // 3-digit queue token (e.g. 101, 102)
  date: string;        // ISO Date String
  type: 'walk-in' | 'scheduled';
  status: 'waiting' | 'triage' | 'consulting' | 'dispensing' | 'billing' | 'completed' | 'cancelled';
  triage?: {           // Pre-consult vitals (Triage Nurse)
    bp: string;        // Blood Pressure (e.g., 120/80)
    hr: number;        // Heart Rate (bpm)
    temp: number;      // Body Temperature (°F)
    bmi: number;       // Body Mass Index
  };
  encounter?: {        // Completed consultation details (Doctor)
    symptoms: string[];
    diagnosisCodes: string[]; // ICD-10 keys
    notes: string;
  };
}
```

#### 4. Invoices Table (`invoices`)
```typescript
interface Invoice {
  id: string;          // Primary Key (Format: inv-XXXXXX)
  appointmentId: string;// Foreign Key -> appointments.id
  patientName: string;
  doctorId: string;    // Foreign Key -> users.id
  doctorName: string;
  items: Array<{
    name: string;
    type: 'consultation' | 'medication' | 'service';
    price: number;
  }>;
  total: number;       // Sum of items prices
  status: 'unpaid' | 'paid' | 'voided';
  paymentMethod?: 'Cash' | 'Card' | 'Insurance' | 'QR Code';
  date: string;        // ISO Date String
}
```

#### 5. Audit Logs Table (`audit_logs`)
Enforces HIPAA compliance by recording every user write action.
```typescript
interface AuditLog {
  id: string;          // Primary Key (Format: l-XXXXXX)
  timestamp: string;   // ISO Date String
  username: string;    // Executing user credentials
  role: string;        // RBAC Role
  action: string;      // Action category (e.g., "Patient Registration")
  details: string;     // Description trail
}
```

---

## 3. Core Software Engineering Algorithms

### A. Real-Time Roster Availability Calculation
When a receptionist books a token, the system validates the doctor's availability at the target hour of the day.

```
Algorithm: ValidateAvailability(doctorId, targetDateTime)
Input: doctorId, targetDateTime (ISO Date String)
Output: Boolean (True if available, False otherwise)

1. Convert targetDateTime to local Date object (D)
2. Extract DayOfWeek (e.g. "Monday", "Tuesday") and DateString ("YYYY-MM-DD")
3. Query database for Doctor where id = doctorId
4. If Doctor.overrides contains override where date == DateString:
       Return False (Doctor is on leave/override active)
5. Retrieve weeklyRoster = Doctor.roster
6. If weeklyRoster[DayOfWeek].active is False:
       Return False (Doctor does not consult on this day)
7. Retrieve startTime and endTime (Format "HH:MM") from weeklyRoster[DayOfWeek]
8. Convert startTime and endTime to minutes-from-midnight (startMin, endMin)
9. Convert D's current time to minutes-from-midnight (targetMin)
10. If targetMin >= startMin AND targetMin <= endMin:
       Return True
11. Else:
       Return False
```

### B. Single-Writer File Locking Queue (Concurrency Protection)
Since the database is backing a JSON file on disk, concurrent write operations could cause race conditions or dirty writes. To prevent this, the controller implements an asynchronous transactional single-writer queue:

1. **State Lock**: A boolean flag `isWriting` is held in memory.
2. **Queue array**: Outstanding write requests are pushed into a Javascript array.
3. **Process Queue**: A loop processes requests one-by-one, fetching the latest disk state, committing changes in memory, writing atomically using `fs.writeFileSync`, and then releasing the lock. This ensures thread-safe, transactional operations on a single file resource.

---

## 4. Key Engineering Implementations

### A. Graceful Connection Degradation
The client-side `Header.tsx` listens to browser connectivity status. 
- **Online mode**: Backend nodemailer transporter connects via internet SMTP server to deliver rich PDFs compiled in-memory.
- **Offline mode**: Transporter falls back immediately without throwing process-blocking exceptions. Payment receipt calculations, thermal printer layouts, and queue sequences proceed locally instantly.

### B. Keyboard Wedge Barcode Scan Parser
To capture barcode scanning without requiring an input text box to be actively focused, the pharmacist screen runs a global keyboard event listener.
- It calculates the time duration between successive key strikes.
- Because hardware USB scanners simulate input at extremely high speeds, the parser checks if keypress intervals are consistently below `45 milliseconds`.
- If matched, it accumulates the characters and pushes the drug code to the shopping cart, bypassing standard typing delays.

### C. HIPAA Audit Logging Guard
Every database insertion or alteration path inside `server/index.cjs` is routed through a central `logAction` database emitter, ensuring all staff operations are fully tracked and recorded in the read-only audit log dashboard.
