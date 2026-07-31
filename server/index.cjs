const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const db = require('./database.cjs');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Helper for audit logs
function logAction(username, role, action, details) {
  db.insert('audit_logs', {
    timestamp: new Date().toISOString(),
    username,
    role,
    action,
    details
  });
}

// WebSocket connection handler
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Broadcast helper
function broadcastQueueUpdate() {
  io.emit('queue-updated', {
    appointments: db.get('appointments'),
    patients: db.get('patients')
  });
}

// Auth Endpoint
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const users = db.get('users');
  const user = users.find(u => u.username === username && u.password === password);
  
  if (user) {
    // Redact password
    const { password: _, ...safeUser } = user;
    logAction(user.username, user.role, 'User Login', `Successfully logged into MCMS`);
    res.json({ success: true, user: safeUser });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

// Patient Endpoints
app.get('/api/patients', (req, res) => {
  const { search, auditUser, auditRole } = req.query;
  let list = db.get('patients');
  
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(p => 
      p.name.toLowerCase().includes(q) || 
      p.phone.includes(q) || 
      p.nationalId.toLowerCase().includes(q)
    );
  }
  
  // HIPAA compliance: Log file read actions!
  if (auditUser && auditRole) {
    logAction(auditUser, auditRole, 'Patient List Read', `Searched / read patients database with query: "${search || ''}"`);
  }
  
  res.json(list);
});

app.post('/api/patients', (req, res) => {
  const { name, phone, dob, gender, nationalId, allergies, history, auditUser, auditRole } = req.body;
  
  if (!name || !phone || !nationalId) {
    return res.status(400).json({ error: 'Name, Phone, and National ID are required' });
  }
  
  // Check if patient already exists
  const existing = db.get('patients').find(p => p.nationalId === nationalId || p.phone === phone);
  if (existing) {
    return res.status(400).json({ error: 'Patient with this phone or National ID already exists' });
  }
  
  const patient = db.insert('patients', {
    name,
    phone,
    dob,
    gender,
    nationalId,
    allergies: allergies || 'None',
    history: history || 'None'
  });
  
  logAction(auditUser || 'receptionist', auditRole || 'receptionist', 'Patient Registration', `Registered patient ${name} (ID: ${patient.id})`);
  res.status(201).json(patient);
});

// Appointment & Queue Endpoints
app.get('/api/appointments', (req, res) => {
  const appointments = db.get('appointments');
  const patients = db.get('patients');
  const users = db.get('users');
  
  // Map patient and doctor data to appointments
  const detailed = appointments.map(appt => {
    const patient = patients.find(p => p.id === appt.patientId);
    const doctor = users.find(u => u.id === appt.doctorId);
    return {
      ...appt,
      patientName: patient ? patient.name : 'Unknown Patient',
      patientPhone: patient ? patient.phone : '',
      patientAllergies: patient ? patient.allergies : '',
      doctorName: doctor ? doctor.name : 'Unknown Doctor'
    };
  });
  
  res.json(detailed);
});

app.post('/api/appointments', (req, res) => {
  const { patientId, doctorId, auditUser, auditRole } = req.body;
  if (!patientId || !doctorId) {
    return res.status(400).json({ error: 'Patient ID and Doctor ID are required' });
  }
  
  // Calculate walk-in token number (101 + index of today's appointments)
  const today = new Date().toISOString().split('T')[0];
  const todayAppts = db.get('appointments').filter(a => a.date.startsWith(today));
  const tokenNumber = String(101 + todayAppts.length);
  
  const appt = db.insert('appointments', {
    patientId,
    doctorId,
    tokenNumber,
    date: new Date().toISOString(),
    status: 'waiting',
    triage: null
  });
  
  // Also create draft invoice for consultation fee
  const doctor = db.getById('users', doctorId);
  const patient = db.getById('patients', patientId);
  const consultationFee = 1500.00;
  
  db.insert('invoices', {
    appointmentId: appt.id,
    patientId,
    doctorId,
    date: new Date().toISOString(),
    items: [
      { name: `Doctor Consultation Fee - ${doctor ? doctor.name : 'OPD'}`, price: consultationFee, type: 'consultation' }
    ],
    total: consultationFee,
    status: 'unpaid',
    paymentMethod: ''
  });
  
  logAction(auditUser || 'receptionist', auditRole || 'receptionist', 'Token Allocation', `Assigned Token ${tokenNumber} to patient ID: ${patientId}`);
  broadcastQueueUpdate();
  res.status(201).json(appt);
});

// Update Triage (Nurses)
app.put('/api/appointments/:id/triage', (req, res) => {
  const { bp, hr, temp, bmi, auditUser, auditRole } = req.body;
  const apptId = req.params.id;
  
  const appt = db.getById('appointments', apptId);
  if (!appt) {
    return res.status(404).json({ error: 'Appointment not found' });
  }
  
  const updated = db.update('appointments', apptId, {
    triage: { bp, hr, temp, bmi }
  });
  
  logAction(auditUser || 'receptionist', auditRole || 'receptionist', 'Triage Capture', `Logged vitals for Appointment ${apptId} (BP: ${bp}, Temp: ${temp})`);
  broadcastQueueUpdate();
  res.json(updated);
});

// Call Next Patient (Doctors)
app.put('/api/appointments/:id/call', (req, res) => {
  const apptId = req.params.id;
  const { auditUser, auditRole } = req.body;
  
  const appt = db.getById('appointments', apptId);
  if (!appt) {
    return res.status(404).json({ error: 'Appointment not found' });
  }
  
  // Change current active consultation to completed/waiting if there are any
  const appointments = db.get('appointments');
  appointments.forEach(a => {
    if (a.status === 'in-consultation' && a.id !== apptId) {
      db.update('appointments', a.id, { status: 'completed' });
    }
  });
  
  const updated = db.update('appointments', apptId, {
    status: 'in-consultation'
  });
  
  const patient = db.getById('patients', appt.patientId);
  
  logAction(auditUser || 'doctor', auditRole || 'doctor', 'Call Patient', `Called Patient ${patient ? patient.name : ''} (Token ${appt.tokenNumber}) to consult room`);
  
  // Real-time broadcast for live waiting room board
  io.emit('patient-called', {
    tokenNumber: appt.tokenNumber,
    patientName: patient ? patient.name : 'Unknown',
    doctorName: auditUser || 'Dr. Evelyn Carter'
  });
  
  broadcastQueueUpdate();
  res.json(updated);
});

// Complete Consultation / Checkout
app.put('/api/appointments/:id/checkout', (req, res) => {
  const apptId = req.params.id;
  const { auditUser, auditRole } = req.body;
  
  const updated = db.update('appointments', apptId, {
    status: 'completed'
  });
  
  logAction(auditUser || 'doctor', auditRole || 'doctor', 'Consultation Complete', `Checked out appointment ${apptId}`);
  broadcastQueueUpdate();
  res.json(updated);
});

// Clinical Encounters
app.post('/api/encounters', (req, res) => {
  const { appointmentId, patientId, doctorId, triage, notes, diagnosisCodes, prescriptions, auditUser, auditRole } = req.body;
  
  if (!appointmentId || !patientId || !doctorId) {
    return res.status(400).json({ error: 'Appointment, Patient, and Doctor IDs are required' });
  }
  
  const encounter = db.insert('encounters', {
    appointmentId,
    patientId,
    doctorId,
    date: new Date().toISOString(),
    triage,
    notes,
    diagnosisCodes
  });
  
  // If there are prescription items, add a prescription record
  let rx = null;
  if (prescriptions && prescriptions.length > 0) {
    rx = db.insert('prescriptions', {
      encounterId: encounter.id,
      patientId,
      doctorId,
      date: new Date().toISOString(),
      items: prescriptions, // [{ drugName, dosage, frequency, duration }]
      status: 'pending'
    });
    
    // Notify pharmacists in real-time
    io.emit('new-prescription', rx);
  }
  
  // Mark appointment as completed
  db.update('appointments', appointmentId, { status: 'completed' });
  
  logAction(auditUser || 'doctor', auditRole || 'doctor', 'Clinical Encounter Logged', `Recorded medical session for patient ID: ${patientId}. Rx added: ${!!rx}`);
  broadcastQueueUpdate();
  res.status(201).json({ encounter, prescription: rx });
});

// Prescriptions List
app.get('/api/prescriptions', (req, res) => {
  const list = db.get('prescriptions');
  const patients = db.get('patients');
  
  const detailed = list.map(rx => {
    const patient = patients.find(p => p.id === rx.patientId);
    return {
      ...rx,
      patientName: patient ? patient.name : 'Unknown Patient',
      patientPhone: patient ? patient.phone : ''
    };
  });
  
  res.json(detailed);
});

// Dispense Prescription
app.post('/api/prescriptions/:id/dispense', (req, res) => {
  const rxId = req.params.id;
  const { auditUser, auditRole } = req.body;
  
  const rx = db.getById('prescriptions', rxId);
  if (!rx) {
    return res.status(404).json({ error: 'Prescription not found' });
  }
  
  if (rx.status === 'dispensed') {
    return res.status(400).json({ error: 'Prescription already dispensed' });
  }
  
  // Check inventory levels & deduct stock
  const inventory = db.get('inventory');
  let missingStock = [];
  
  rx.items.forEach(item => {
    // Attempt match
    const match = inventory.find(inv => item.drugName.toLowerCase().includes(inv.name.toLowerCase()) || inv.name.toLowerCase().includes(item.drugName.toLowerCase()));
    if (match) {
      if (match.qty < 30) { // Assume standard quantity of 30 tabs if unspecified
        // Just let it dispense for demo, but warn or deduct
      }
    }
  });
  
  // Deduct inventory for matched drugs
  rx.items.forEach(item => {
    const match = inventory.find(inv => item.drugName.toLowerCase().includes(inv.name.toLowerCase()) || inv.name.toLowerCase().includes(item.drugName.toLowerCase()));
    if (match) {
      const deductQty = 30; // standard container pack size
      const newQty = Math.max(0, match.qty - deductQty);
      db.update('inventory', match.id, { qty: newQty });
    }
  });
  
  // Update rx status
  const updatedRx = db.update('prescriptions', rxId, { status: 'dispensed' });
  
  // Add pharmacy items to invoice
  const encounters = db.get('encounters');
  const encounter = encounters.find(e => e.id === rx.encounterId);
  
  if (encounter && encounter.appointmentId) {
    const invoices = db.get('invoices');
    const invoice = invoices.find(inv => inv.appointmentId === encounter.appointmentId);
    
    if (invoice) {
      const pharmacyItems = rx.items.map(item => {
        const match = inventory.find(inv => item.drugName.toLowerCase().includes(inv.name.toLowerCase()) || inv.name.toLowerCase().includes(item.drugName.toLowerCase()));
        const itemPrice = match ? match.price : 400.00;
        return {
          name: `${item.drugName} (Dispensed)`,
          price: itemPrice,
          type: 'pharmacy'
        };
      });
      
      const updatedItems = [...invoice.items, ...pharmacyItems];
      const newTotal = updatedItems.reduce((acc, curr) => acc + curr.price, 0);
      
      db.update('invoices', invoice.id, {
        items: updatedItems,
        total: parseFloat(newTotal.toFixed(2))
      });
    }
  }
  
  const patient = db.getById('patients', rx.patientId);
  logAction(auditUser || 'pharmacist', auditRole || 'pharmacist', 'Prescription Dispensed', `Dispensed prescription items for ${patient ? patient.name : ''}`);
  
  io.emit('prescription-dispensed', rxId);
  res.json(updatedRx);
});

// Inventory Endpoints
app.get('/api/inventory', (req, res) => {
  res.json(db.get('inventory'));
});

app.post('/api/inventory', (req, res) => {
  const { name, qty, price, batchNumber, expiryDate, minStockLevel, auditUser, auditRole } = req.body;
  if (!name || qty === undefined || price === undefined) {
    return res.status(400).json({ error: 'Name, quantity, and price are required' });
  }
  
  const item = db.insert('inventory', {
    name,
    qty: parseInt(qty),
    price: parseFloat(price),
    batchNumber: batchNumber || 'GEN-' + Math.floor(Math.random()*1000),
    expiryDate: expiryDate || '2028-12-31',
    minStockLevel: parseInt(minStockLevel || 10)
  });
  
  logAction(auditUser || 'admin', auditRole || 'admin', 'Inventory Add', `Added ${name} (Qty: ${qty}) to stock`);
  res.status(201).json(item);
});

// OTC Direct Sales
app.post('/api/inventory/otc', (req, res) => {
  const { items, paymentMethod, auditUser, auditRole } = req.body; // items: [{ id, qty }]
  
  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'Items are required for OTC sale' });
  }
  
  const invoiceItems = [];
  let total = 0;
  
  items.forEach(saleItem => {
    const invItem = db.getById('inventory', saleItem.id);
    if (invItem) {
      const saleQty = parseInt(saleItem.qty);
      const newQty = Math.max(0, invItem.qty - saleQty);
      db.update('inventory', invItem.id, { qty: newQty });
      
      const itemTotal = invItem.price * saleQty;
      invoiceItems.push({
        name: `${invItem.name} x${saleQty} (OTC)`,
        price: parseFloat(itemTotal.toFixed(2)),
        type: 'pharmacy'
      });
      total += itemTotal;
    }
  });
  
  // Insert paid invoice for OTC sale
  const invoice = db.insert('invoices', {
    appointmentId: null,
    patientId: null,
    doctorId: null,
    date: new Date().toISOString(),
    items: invoiceItems,
    total: parseFloat(total.toFixed(2)),
    status: 'paid',
    paymentMethod: paymentMethod || 'Cash'
  });
  
  logAction(auditUser || 'pharmacist', auditRole || 'pharmacist', 'OTC Sale', `Processed direct counter medicine sale, Total: LKR ${total.toFixed(2)}`);
  res.status(201).json(invoice);
});

// Invoice Endpoints
app.get('/api/invoices', (req, res) => {
  const invoices = db.get('invoices');
  const patients = db.get('patients');
  
  const detailed = invoices.map(inv => {
    const patient = patients.find(p => p.id === inv.patientId);
    return {
      ...inv,
      patientName: patient ? patient.name : 'Walk-in / Counter OTC',
      patientPhone: patient ? patient.phone : ''
    };
  });
  res.json(detailed);
});

app.post('/api/invoices/:id/pay', (req, res) => {
  const invId = req.params.id;
  const { paymentMethod, auditUser, auditRole } = req.body;
  
  const invoice = db.getById('invoices', invId);
  if (!invoice) {
    return res.status(404).json({ error: 'Invoice not found' });
  }
  
  const updated = db.update('invoices', invId, {
    status: 'paid',
    paymentMethod: paymentMethod || 'Cash'
  });
  
  logAction(auditUser || 'receptionist', auditRole || 'receptionist', 'Invoice Checkout', `Processed payment for invoice ${invId} via ${paymentMethod}`);
  res.json(updated);
});

// Audit Logs Endpoints
app.get('/api/audit-logs', (req, res) => {
  res.json(db.get('audit_logs'));
});

// Dashboard Analytics Endpoint
app.get('/api/dashboard/stats', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const appointments = db.get('appointments');
  const invoices = db.get('invoices');
  const inventory = db.get('inventory');
  
  // Queue stats
  const todayAppts = appointments.filter(a => a.date.startsWith(today));
  const waitingCount = todayAppts.filter(a => a.status === 'waiting').length;
  const consultingCount = todayAppts.filter(a => a.status === 'in-consultation').length;
  const completedCount = todayAppts.filter(a => a.status === 'completed').length;
  
  // Finance stats
  const totalRevenue = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((acc, curr) => acc + curr.total, 0);
    
  const revenueToday = invoices
    .filter(inv => inv.status === 'paid' && inv.date.startsWith(today))
    .reduce((acc, curr) => acc + curr.total, 0);
    
  // Inventory alerts
  const lowStockCount = inventory.filter(inv => inv.qty <= inv.minStockLevel).length;
  
  // Expiry alerts: medications expiring within next 30 days
  const todayMs = new Date().getTime();
  const next30DaysMs = todayMs + (30 * 24 * 60 * 60 * 1000);
  const expiringSoonCount = inventory.filter(inv => {
    const expMs = new Date(inv.expiryDate).getTime();
    return expMs > todayMs && expMs <= next30DaysMs;
  }).length;
  
  res.json({
    queue: {
      todayTotal: todayAppts.length,
      waiting: waitingCount,
      consulting: consultingCount,
      completed: completedCount
    },
    finance: {
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      revenueToday: parseFloat(revenueToday.toFixed(2))
    },
    inventory: {
      lowStock: lowStockCount,
      expiringSoon: expiringSoonCount
    }
  });
});

// Admin User Management
app.post('/api/admin/users', (req, res) => {
  const { name, username, password, role, specialty, auditUser, auditRole } = req.body;
  if (!name || !username || !password || !role) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  
  const existing = db.get('users').find(u => u.username === username);
  if (existing) {
    return res.status(400).json({ error: 'Username already taken' });
  }
  
  const user = db.insert('users', {
    name,
    username,
    password,
    role,
    specialty: specialty || 'Medical Staff'
  });
  
  logAction(auditUser || 'admin', auditRole || 'admin', 'User Account Creation', `Created user account for ${name} (Role: ${role})`);
  res.status(201).json(user);
});

// Admin Get User Accounts
app.get('/api/admin/users', (req, res) => {
  const users = db.get('users');
  const safeUsers = users.map(({ password, ...u }) => u);
  res.json(safeUsers);
});

// Admin Download Database Backup
app.get('/api/admin/backup', (req, res) => {
  res.json(db.data);
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`MCMS Express & WebSockets server running on port ${PORT}`);
});
