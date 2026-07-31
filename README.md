# Medical Center Management System (MCMS)
## Standalone Turnkey Clinical Solution

A high-performance, responsive, and completely offline-ready web application designed for outpatient clinics, polyclinics, and boutique medical centers. 

The system operates as a **single-tenant standalone container or local server deployment**, eliminating external cloud dependencies, mitigating cross-tenant data leaks, and ensuring zero-latency queue announcements on the local network (LAN).

---

## 1. Core Turnkey Architecture

* **Zero CDN Dependency**: Styled with local system font stacks. Works 100% offline in air-gapped environments without breaking layout grids or lagging during font loads.
* **Thermal Receipt Printing (80mm)**: Custom CSS print sheets (`@media print`) format walk-in token slips and payments receipts to match standard 80mm wide thermal roll sizes.
* **Keyboard-Wedge Barcode Scanner Input**: A global keyboard event listener captures high-speed keyboard input sequences (key interval < 45ms) and automatically scans item batch numbers into direct pharmacy sales.
* **Local Database Backups**: Includes an admin dashboard interface to trigger client-side JSON dumps of `db.json` database state and logs, plus monitoring configurations for nightly container backup crons.

---

## 2. Technology Stack

* **Frontend SPA**: React 18 (Vite) + TypeScript.
* **CSS & Design**: Tailwind CSS. Built with sleek custom glassmorphism panels, customized layouts, and hover animations.
* **State Management & Data Queries**: TanStack Query (React Query) for API polling and mutation cache invalidations + Zustand.
* **Real-time WebSockets Sync**: Socket.io (server) + Socket.io-client (React) mapping token allocations, vitals triage updates, and billing desk status changes.
* **Browser Speech Synthesis**: Web Speech API for Waiting Room voice announcements.
* **Mock Backend Server**: Node.js Express Server running in CommonJS mode (`.cjs`).
* **Database File System**: Transactional JSON relational database (`db.json`) backing patients, appointments, triage, prescriptions, billing invoices, and HIPAA logs.

---

## 3. Project Directory Structure

```
Medical Center Management System/
├── db.json                     # Relational JSON file database
├── package.json                # Project configurations & scripts
├── server/
│   ├── index.cjs               # REST Express & Socket.io WebSockets backend
│   └── database.cjs            # Database controller with file lock commits
└── src/
    ├── main.tsx                # App entrypoint
    ├── App.tsx                 # Core workspace router, styles, & hotkey listeners
    ├── index.css               # Tailwind directives & print sheets
    ├── store/
    │   ├── authStore.ts        # Zustand authentication state
    │   └── queueStore.ts       # Real-time WebSocket connection state
    ├── components/
    │   ├── ui/                 # Card, Button, and Input primitives
    │   ├── Sidebar.tsx         # Responsive sidebar menu (roles guarded)
    │   ├── Header.tsx          # Real-time indicators & station trackers
    │   └── LiveQueueBoard.tsx  # Fullscreen TV monitor display board
    └── pages/
        ├── Login.tsx           # Quick-login portal with demo accounts
        ├── Receptionist/
        │   ├── PatientIntake.tsx  # Patient demographics registration
        │   ├── QueueScheduler.tsx # Token allocations & triage inputs
        │   └── BillingDesk.tsx    # Unpaid ledgers & thermal checkout printouts
        ├── Doctor/
        │   └── ConsultationPad.tsx # EHR chart sheets, checkboxes, & Rx builders
        ├── Pharmacist/
        │   └── InventoryManager.tsx # Drug stock tables & wedge barcode sales
        └── Admin/
            └── UserManagement.tsx  # Admin portal & database backup controls
```

---

## 4. Installation & Local Development Setup

### Prerequisites
* **Node.js**: Version 18 or newer.
* **NPM**: Built-in package manager.

### 1. Install Dependencies
Initialize and pull packages:
```powershell
npm install
```

### 2. Launch Development Servers
Vite client runs on port `5173` and the Express backend runs on port `3001`. Run:
```powershell
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your web browser.

### 3. Build Production Bundle
To compile and build standard minified scripts inside `dist/`:
```powershell
npm run build
```

---

## 5. Demo Logins (Quick Authentication)

The login screen provides quick demo profiles. Clicking any card pre-fills credentials:
* **System Administrator**: `admin` / `admin123`
* **Doctor (Physician)**: `doctor` / `doctor123`
* **Receptionist (Front Desk)**: `receptionist` / `reception123`
* **Pharmacist**: `pharmacist` / `pharmacy123`

---

## 6. End-User Manual

For clinical staff instructions, steps on registration, vital triages, and prescriptions, refer directly to the [USER_MANUAL.md](file:///d:/xampp/htdocs/Medical%20Center%20Management%20System/USER_MANUAL.md) file.