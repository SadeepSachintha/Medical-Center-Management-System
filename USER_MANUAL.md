# Aura Medical Center Management System (MCMS)
## Non-Technical Staff User Manual

Welcome to your new Clinic Management System! This guide is written in plain English to help you navigate and use the software in your daily operations. No IT or computer programming knowledge is required.

---

## 1. What is the Aura Clinic System?

Our system replaces manual paper files and clipboard queues with a fast, real-time digital dashboard. The system coordinates the journey of a patient from the moment they walk through the front door, to their vitals check, doctor's consultation, prescription collection, and payment.

### How it Works (The Patient Journey)
```
[1. Front Desk Registration] ➔ [2. Nurse Vitals Triage] ➔ [3. Doctor Consultation] ➔ [4. Pharmacy Pick-up & Payment]
```

---

## 2. Core Concepts You Need to Know

* **Queue Token**: A unique 3-digit number (like `101`, `102`) assigned to a patient when they arrive. This helps them know their order in the waiting lounge.
* **Triage Vitals**: Basic medical readings taken by the receptionist or nurse before the patient sees the doctor. This includes **Blood Pressure** (e.g., 120/80), **Heart Rate** (heartbeats per minute), **Body Temperature** (in degrees Fahrenheit), and **BMI** (body size index).
* **EHR (Electronic Health Record)**: A patient's digital medical file where doctors log consultation notes, diagnoses, and medications.
* **OTC Direct Sale**: "Over-the-Counter" sale of medicine straight to a customer who walked in just to buy medicine without seeing a doctor.

---

## 3. Daily Guide for Receptionists & Front Desk Staff
*Your primary login username is **`receptionist`** with password **`reception123`**.*

### A. Registering a New Patient
1. Click **New Patient Intake** in the left sidebar menu.
2. Fill out the registration form:
   - Type the patient's **Full Name**, **Phone Number**, and **Date of Birth**.
   - Enter their **National ID** (NID number).
   - List any **Medication Allergies** (type "None" if they don't have any).
   - Enter relevant **Medical History** (e.g., Asthma, Hypertension).
3. Click the **Register Patient File** button. A green checkmark confirms the file is saved.

### B. Giving a Patient a Queue Number (Token)
1. Click **Queue Scheduler** in the left sidebar.
2. In the **Allocate Queue Token** search box, type the patient's name or phone number.
3. Click on the correct patient from the drop-down list.
4. Review the details and click **Generate Sequential Token**.
5. A blue alert bar will appear at the top. Click **Print Ticket (80mm)**. This prints a small slip on your front desk receipt printer to hand to the patient.

### C. Nurse Vitals Triage
1. On the **Queue Scheduler** table, locate the patient. You will see a flashing orange **"Pending Triage"** notice.
2. Click **Triage Nurse** next to their name. A form will open.
3. Enter their vitals (Blood Pressure, Heart Rate, Temperature, BMI).
4. Click **Record Vitals**. The flashing warning turns into green badges showing the vitals to the doctor.

### D. Payments & Billing desk
1. Click **Billing Desk** in the left sidebar.
2. Locate the patient in the billing table (marked with a flashing red **"unpaid"** status).
3. Click **Collect Fee**.
4. In the checkout window, choose the payment method: **Cash**, **Card**, **Insurance**, or **QR Code**.
5. Click **Finalize Checkout**.
6. The status changes to a green **"paid"**. Click the **Receipt** button to print the billing receipt layout for the patient.

---

## 4. Daily Guide for Doctors
*Your primary login username is **`doctor`** with password **`doctor123`**.*

### A. Calling the Next Patient
1. Click **Consultation Pad** in the left sidebar.
2. In the **Waiting Patients Queue** panel, find the next patient (marked in blue).
3. Click the green **Call Patient** button.
4. **What happens next**: The waiting room TV screen will sound a chime and read aloud: *"Token 102, John Doe, please proceed to consultation Room 1"*.

### B. Entering Medical Notes & Prescriptions
1. Once the patient enters your room, review their **Nurse Triage Vitals** on the screen.
2. In the **Clinical Documentation** form:
   - Check the boxes for **Symptoms** (e.g., Fever, Cough, Headache).
   - Type your detailed consultation notes in the text box.
   - Check the boxes for **Diagnosis Codes** (e.g., Essential Hypertension, Acute Tonsillitis).
3. To add medicines in the **Prescription Builder**:
   - Select a medication from the list.
   - Type the **Dosage** (e.g., "1 tablet"), **Frequency** (e.g., "Twice daily"), and **Duration** (e.g., "7 days").
   - Click **Add to Prescription**. Repeat for other medicines.
4. Click the blue **Complete Consultation** button. This automatically marks the patient as finished, sends the prescription list directly to the pharmacist, and updates the bill.

---

## 5. Daily Guide for Pharmacists
*Your primary login username is **`pharmacist`** with password **`pharmacy123`**.*

### A. Dispensing Doctor Prescriptions
1. Click **Prescriptions Queue** in the left sidebar.
2. Find the patient's name (new prescriptions from the doctor appear instantly).
3. Click **Dispense & Update Ledger**.
4. Hand the medicines to the patient. The system automatically updates stock levels and sends the pricing to the Billing Desk.

### B. Managing Stock & Alerts
1. Click **Inventory Manager** in the left sidebar.
2. Observe the stock table:
   - Flashing red **"Low Stock"** labels show medicines running out.
   - Orange **"Expiring Soon"** labels show medicines close to expiry.
3. To add new stock: click **Add Medication**, type the name, amount, batch number, and click **Commit to Stockroom**.

### C. Direct Counter Sales (OTC)
1. On the **Inventory Manager** page, locate the direct sales cart on the right.
2. To add medicines to the cart:
   - Click **Add to Sales** next to any drug in the table.
   - OR, if using a **USB Barcode Scanner**: point and click your scanner at the physical product box. The system automatically reads the barcode and adds the item to the cart!
   - (For demonstration: you can click the shortcut buttons in the **Wedge Barcode Simulation** box to test scanning).
3. Choose the payment method (Cash, Card, QR) and click **Process OTC Checkout**.

---

## 6. Daily Guide for Clinic Managers & Administrators
*Your primary login username is **`admin`** with password **`admin123`**.*

### A. Adding Staff User Accounts
1. Click **User Accounts** in the left sidebar.
2. Under **Provision Staff Account**:
   - Type the worker's full name, choose a login username, and type a password.
   - Select their role: **System Admin**, **Doctor**, **Receptionist**, or **Pharmacist**.
   - Select their specialty or department.
3. Click **Provision Credentials**. They can now log in using those details.

### B. Exporters & Data Backups (Air-Gap Protection)
Because our system runs locally on your clinic computer, you have full control over backups to protect against hardware failure:
1. Click **User Accounts** in the sidebar.
2. Click the tab at the top labeled **Turnkey Backup & Maintenance**.
3. Under **Manual Export**, click the blue **Export db.json Snapshot** button.
4. A database file will immediately download to your computer (e.g., `aura_mcms_backup_2026-07-31.json`). **Save this file onto a USB thumb drive daily**.
5. Observe the **Automated Backups Logs** on the right side of the screen to confirm the system performed its scheduled automatic nightly backups.

---

## 7. Troubleshooting FAQ

#### Q: The waiting room speaker is not announcing patient tokens.
* **A**: Web browsers block sounds unless you click on the page first. Ensure you have clicked once anywhere on the **Waiting Room display board** to enable the voice synthesis. Also check that your computer speakers are turned on and not muted.

#### Q: How do we scan medication boxes with barcodes?
* **A**: Simply plug in a standard USB barcode scanner. Make sure your cursor is focused in the dashboard browser window, scan the medication barcode, and it will be added to the shopping cart instantly.

#### Q: The system says "Low Stock" for some drugs.
* **A**: This is an automated warning. Please purchase additional stock and log it using the **Add Medication** form to clear the warning.
