const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');

// Load config
const configPath = path.join(__dirname, 'config.json');
let config = {
  smtp: {
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: { user: "", pass: "" },
    from: "Aura Medical Center <noreply@auramedical.com>"
  }
};

if (fs.existsSync(configPath)) {
  try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (e) {
    console.error('Failed to read config.json, using default configurations', e);
  }
}

let transporterPromise = (async () => {
  let smtpConfig = { ...config.smtp };
  
  // If credentials are empty, auto-create Ethereal test account!
  if (!smtpConfig.auth.user || !smtpConfig.auth.pass) {
    try {
      console.log('Generating Ethereal SMTP test credentials for demo/local mode...');
      const testAccount = await nodemailer.createTestAccount();
      smtpConfig.host = testAccount.smtp.host;
      smtpConfig.port = testAccount.smtp.port;
      smtpConfig.secure = testAccount.smtp.secure;
      smtpConfig.auth = {
        user: testAccount.user,
        pass: testAccount.pass
      };
      console.log(`--------------------------------------------------`);
      console.log(`Ethereal Test SMTP Account Generated!`);
      console.log(`User: ${testAccount.user}`);
      console.log(`Pass: ${testAccount.pass}`);
      console.log(`Emails can be previewed at: https://ethereal.email`);
      console.log(`--------------------------------------------------`);
    } catch (err) {
      console.error('Failed to generate Ethereal SMTP test account, emails will run in mock mode', err);
      return null;
    }
  }
  
  return nodemailer.createTransport(smtpConfig);
})();

// Helper to draw simulated barcode
function drawBarcode(doc, x, y, code) {
  doc.save();
  let currentX = x;
  // Seed random-like pattern based on code characters
  const seedString = code || "MCMS-REF-1002";
  for (let i = 0; i < seedString.length; i++) {
    const charCode = seedString.charCodeAt(i);
    // Draw 3 lines based on ascii bits
    for (let bit = 0; bit < 3; bit++) {
      const bitVal = (charCode >> bit) & 1;
      const width = bitVal ? 3 : 1;
      doc.rect(currentX, y, width, 18).fill('#1e293b');
      currentX += width + 1.5;
    }
  }
  // Draw small text label
  doc.fillColor('#64748b').fontSize(7).text(seedString, x, y + 22, { width: currentX - x, align: 'center' });
  doc.restore();
}

// Generate Receipt PDF
function generateReceiptPDF(invoice, patient) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'LETTER' });
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', err => reject(err));

      // Color palette
      const primaryColor = '#0284c7';
      const darkColor = '#0f172a';
      const lightBg = '#f8fafc';
      const borderCol = '#e2e8f0';

      // Header Banner
      doc.rect(0, 0, doc.page.width, 100).fill(primaryColor);
      
      // Header text
      doc.fillColor('#ffffff')
         .fontSize(22)
         .font('Helvetica-Bold')
         .text('AURA MEDICAL CENTER', 40, 30);
      
      doc.fontSize(10)
         .font('Helvetica')
         .text('12 Medical Plaza, Suite 400 | Phone: (123) 456-7890 | info@auramedical.com', 40, 58);

      // Invoice Title
      doc.fillColor(darkColor)
         .fontSize(18)
         .font('Helvetica-Bold')
         .text('PAYMENT RECEIPT', 40, 120);

      // Meta grid
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#64748b');
      doc.text('RECEIPT REF', 40, 160);
      doc.text('DATE SETTLED', 160, 160);
      doc.text('SETTLEMENT MODE', 280, 160);
      doc.text('STATUS', 400, 160);

      doc.font('Helvetica').fillColor(darkColor);
      doc.text(invoice.id, 40, 172);
      doc.text(new Date(invoice.date).toLocaleString(), 160, 172);
      doc.text(invoice.paymentMethod || 'Cash', 280, 172);
      
      doc.fillColor('#059669').font('Helvetica-Bold').text('PAID / SETTLED', 400, 172);

      // Divider line
      doc.lineWidth(1).strokeColor(borderCol).moveTo(40, 195).lineTo(doc.page.width - 40, 195).stroke();

      // Patient capsule
      doc.rect(40, 210, doc.page.width - 80, 50).fill(lightBg);
      doc.fillColor(darkColor).fontSize(10).font('Helvetica-Bold').text('Patient Bill-To Details:', 50, 220);
      doc.font('Helvetica').fontSize(9).text(`Name: ${patient ? patient.name : 'Walk-in Customer'}   |   Phone: ${patient ? patient.phone : 'N/A'}   |   ID: ${patient ? patient.nationalId : 'N/A'}`, 50, 235);

      // Itemized charges title
      doc.fontSize(11).font('Helvetica-Bold').text('Itemized Charges Description', 40, 280);

      // Table header
      doc.rect(40, 295, doc.page.width - 80, 18).fill('#e2e8f0');
      doc.fillColor('#334155').fontSize(8.5).font('Helvetica-Bold');
      doc.text('ITEM / SERVICE DETAILS', 50, 300);
      doc.text('CATEGORY', 340, 300);
      doc.text('AMOUNT', doc.page.width - 120, 300, { align: 'right' });

      // Table rows
      let y = 320;
      doc.font('Helvetica').fillColor(darkColor);
      
      invoice.items.forEach((item, index) => {
        // Alternating row bg
        if (index % 2 === 1) {
          doc.rect(40, y - 5, doc.page.width - 80, 18).fill('#f8fafc');
          doc.fillColor(darkColor);
        }
        
        doc.text(item.name, 50, y);
        doc.text(item.type ? item.type.toUpperCase() : 'GENERAL', 340, y);
        doc.font('Courier').text(`LKR ${item.price.toFixed(2)}`, doc.page.width - 120, y, { align: 'right' });
        doc.font('Helvetica');
        
        y += 18;
      });

      // Total summary box
      y += 10;
      doc.lineWidth(1).strokeColor(borderCol).moveTo(40, y).lineTo(doc.page.width - 40, y).stroke();
      y += 10;

      doc.fontSize(12).font('Helvetica-Bold').text('Total Paid Amount:', 320, y);
      doc.font('Courier-Bold').text(`LKR ${invoice.total.toFixed(2)}`, doc.page.width - 120, y, { align: 'right' });

      // Barcode graphic
      y += 50;
      drawBarcode(doc, 40, y, invoice.id);

      // Footer disclaimer
      doc.fillColor('#64748b')
         .font('Helvetica-Oblique')
         .fontSize(8)
         .text('Thank you for choosing Aura Medical Center. For any billing disputes or insurance claims queries, please contact our administrative desk.', 40, doc.page.height - 60, { width: doc.page.width - 80, align: 'center' });

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}

// Generate Medical Summary PDF
function generateMedicalSummaryPDF(patient, doctor, triage, encounter, prescriptions) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 45, size: 'LETTER' });
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', err => reject(err));

      const primaryColor = '#0ea5e9';
      const darkColor = '#0f172a';
      const borderCol = '#e2e8f0';

      // Header Banner
      doc.rect(0, 0, doc.page.width, 100).fill(primaryColor);
      
      // Header text
      doc.fillColor('#ffffff')
         .fontSize(22)
         .font('Helvetica-Bold')
         .text('AURA MEDICAL CENTER', 45, 30);
      doc.fontSize(10)
         .font('Helvetica')
         .text('Electronic Health Records (EHR) Discharge Summary & Medical Report', 45, 58);

      // Report details
      doc.fillColor(darkColor)
         .fontSize(16)
         .font('Helvetica-Bold')
         .text('CLINICAL DISCHARGE SUMMARY', 45, 120);

      // Grid metadata
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#64748b');
      doc.text('PATIENT NAME', 45, 150);
      doc.text('DATE OF BIRTH', 240, 150);
      doc.text('NATIONAL ID', 360, 150);
      doc.text('DATE OF VISIT', 470, 150);

      doc.font('Helvetica').fillColor(darkColor);
      doc.text(patient.name, 45, 162);
      doc.text(patient.dob || 'N/A', 240, 162);
      doc.text(patient.nationalId, 360, 162);
      doc.text(new Date(encounter.date).toLocaleDateString(), 470, 162);

      // Vitals panel (Triage)
      doc.rect(45, 185, doc.page.width - 90, 50).fill('#f0f9ff');
      doc.fillColor('#0369a1').font('Helvetica-Bold').fontSize(10).text('Intake Triage Vitals:', 55, 193);
      
      if (triage) {
        doc.font('Helvetica').fontSize(9).fillColor(darkColor);
        doc.text(`Blood Pressure: ${triage.bp || 'N/A'}    |    Heart Rate: ${triage.hr || 'N/A'} bpm    |    Body Temp: ${triage.temp || 'N/A'} °F    |    BMI Score: ${triage.bmi || 'N/A'}`, 55, 212);
      } else {
        doc.font('Helvetica-Oblique').fontSize(9).fillColor(darkColor).text('Vitals not recorded at intake.', 55, 212);
      }

      // Consult details
      doc.fillColor(darkColor).fontSize(11).font('Helvetica-Bold').text('Consultation Notes & Observations', 45, 255);
      doc.lineWidth(1).strokeColor(borderCol).moveTo(45, 270).lineTo(doc.page.width - 45, 270).stroke();

      doc.fillColor('#475569').fontSize(9.5).font('Helvetica-Bold').text('Attending Physician:', 45, 280);
      doc.fillColor(darkColor).font('Helvetica').text(doctor ? `${doctor.name} (${doctor.specialty || 'General'})` : 'OPD Doctor', 150, 280);

      doc.fillColor('#475569').font('Helvetica-Bold').text('Diagnosis / ICD-10:', 45, 300);
      doc.fillColor(darkColor).font('Helvetica').text(encounter.diagnosisCodes || 'N/A', 150, 300);

      doc.fillColor('#475569').font('Helvetica-Bold').text('Physician Notes:', 45, 320);
      doc.fillColor(darkColor).font('Helvetica').text(encounter.notes || 'No notes compiled.', 45, 335, { width: doc.page.width - 90, align: 'left', lineGap: 3 });

      // Prescriptions section
      let y = doc.y + 25;
      doc.fillColor(darkColor).fontSize(11).font('Helvetica-Bold').text('Electronic Prescription (Rx) Plan', 45, y);
      y += 15;
      doc.lineWidth(1).strokeColor(borderCol).moveTo(45, y).lineTo(doc.page.width - 45, y).stroke();
      y += 10;

      if (prescriptions && prescriptions.items && prescriptions.items.length > 0) {
        // Render Rx table
        doc.rect(45, y, doc.page.width - 90, 16).fill('#f1f5f9');
        doc.fillColor('#334155').fontSize(8.5).font('Helvetica-Bold');
        doc.text('MEDICATION / DRUG NAME', 55, y + 4);
        doc.text('DOSAGE', 260, y + 4);
        doc.text('FREQUENCY', 360, y + 4);
        doc.text('DURATION', 470, y + 4);
        y += 20;

        doc.font('Helvetica').fillColor(darkColor);
        prescriptions.items.forEach((item, index) => {
          if (index % 2 === 1) {
            doc.rect(45, y - 2, doc.page.width - 90, 16).fill('#f8fafc');
            doc.fillColor(darkColor);
          }
          doc.text(item.drugName, 55, y);
          doc.text(item.dosage || '1 tab', 260, y);
          doc.text(item.frequency || 'Once daily', 360, y);
          doc.text(item.duration || '30 days', 470, y);
          y += 16;
        });
      } else {
        doc.font('Helvetica-Oblique').fontSize(9).fillColor('#64748b').text('No prescription medications issued during this visit.', 45, y);
        y += 15;
      }

      // Doctor signature block
      y += 40;
      doc.lineWidth(1).strokeColor('#94a3b8').moveTo(doc.page.width - 180, y).lineTo(doc.page.width - 45, y).stroke();
      doc.fillColor('#64748b').fontSize(8).font('Helvetica').text('Physician Sign & Electronic Validation', doc.page.width - 180, y + 5, { width: 135, align: 'center' });

      // Footer
      doc.fillColor('#64748b')
         .font('Helvetica-Bold')
         .fontSize(8)
         .text('AURA CLINICAL INFORMATION SUITE • SECURE STANDALONE EHR LOG', 45, doc.page.height - 45, { align: 'center' });

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}

// Mailer methods
const mailService = {
  // Appointment Confirmation
  async sendAppointmentConfirmation(patient, doctor, appointment) {
    if (!patient.email) return;
    try {
      const transporter = await transporterPromise;
      if (!transporter) return;
      
      const mailOptions = {
        from: config.smtp.from,
        to: patient.email,
        subject: `Appointment Confirmed - Token ${appointment.tokenNumber}`,
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #0ea5e9; margin-top: 0;">Appointment Confirmed!</h2>
            <p>Dear <strong>${patient.name}</strong>,</p>
            <p>Your queue token for today's visit has been generated successfully.</p>
            <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 0; font-size: 24px; font-weight: bold; text-align: center; color: #0284c7;">Token Number: ${appointment.tokenNumber}</p>
              <p style="margin: 8px 0 0 0; text-align: center; font-size: 13px; color: #475569;">Physician: ${doctor ? doctor.name : 'General OPD'}</p>
              <p style="margin: 4px 0 0 0; text-align: center; font-size: 12px; color: #64748b;">Estimated Time: ${new Date(appointment.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
            </div>
            <p style="font-size: 13px; color: #475569;">Please proceed to the clinic lounge and wait for your token to be announced. Show this email or token slip at the desk if requested.</p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
            <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">Aura Medical Suite • Standalone Turnkey Deployment</p>
          </div>
        `
      };
      
      const info = await transporter.sendMail(mailOptions);
      console.log(`Confirmation email sent to ${patient.email}: ${info.messageId}`);
      if (nodemailer.getTestMessageUrl(info)) {
        console.log(`Preview Confirmation Email URL: ${nodemailer.getTestMessageUrl(info)}`);
      }
    } catch (err) {
      console.error('Failed to dispatch appointment confirmation email:', err);
    }
  },

  // Appointment Cancellation
  async sendAppointmentCancellation(patient, doctor, appointment) {
    if (!patient.email) return;
    try {
      const transporter = await transporterPromise;
      if (!transporter) return;
      
      const mailOptions = {
        from: config.smtp.from,
        to: patient.email,
        subject: `Appointment Cancelled - Token ${appointment.tokenNumber}`,
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #ef4444; margin-top: 0;">Appointment Cancelled</h2>
            <p>Dear <strong>${patient.name}</strong>,</p>
            <p>This is to inform you that your queue token <strong>${appointment.tokenNumber}</strong> for today has been cancelled.</p>
            <div style="background-color: #fef2f2; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #ef4444;">
              <p style="margin: 0; font-size: 14px; color: #991b1b;">The appointment has been removed from the live queue, and any draft consultation invoices have been voided.</p>
            </div>
            <p style="font-size: 13px; color: #475569;">If you believe this was an error, please contact the front desk immediately to re-book a sequential queue token.</p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
            <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">Aura Medical Suite • Standalone Turnkey Deployment</p>
          </div>
        `
      };
      
      const info = await transporter.sendMail(mailOptions);
      console.log(`Cancellation email sent to ${patient.email}: ${info.messageId}`);
      if (nodemailer.getTestMessageUrl(info)) {
        console.log(`Preview Cancellation Email URL: ${nodemailer.getTestMessageUrl(info)}`);
      }
    } catch (err) {
      console.error('Failed to dispatch appointment cancellation email:', err);
    }
  },

  // Payment Receipt & Medical Discharge Summary
  async sendCheckoutReceiptAndSummary(patient, doctor, appointment, invoice, encounter, prescription) {
    if (!patient.email) return;
    try {
      const transporter = await transporterPromise;
      if (!transporter) return;

      console.log(`Compiling PDF receipt and medical summary attachments for ${patient.name}...`);
      const [receiptBuffer, summaryBuffer] = await Promise.all([
        generateReceiptPDF(invoice, patient),
        generateMedicalSummaryPDF(patient, doctor, appointment ? appointment.triage : null, encounter, prescription)
      ]);

      const mailOptions = {
        from: config.smtp.from,
        to: patient.email,
        subject: `Discharge Documents & Paid Receipt - Aura Medical`,
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #059669; margin-top: 0;">Visit Checked Out & Settled</h2>
            <p>Dear <strong>${patient.name}</strong>,</p>
            <p>Your visit today has been completed, and payment checkout is settled.</p>
            <p style="font-size: 13px; color: #475569;">We have generated your medical records, prescription charts, and paid receipt invoices. They are attached to this email as secure PDF files for your records and insurance claims claims:</p>
            <ul style="font-size: 13px; color: #475569; padding-left: 20px;">
              <li><strong>Payment_Receipt.pdf</strong>: Detailed financial statement and itemized checkout ledger (PAID).</li>
              <li><strong>Medical_Discharge_Summary.pdf</strong>: Clinical chart notes, vital logs, and electronic prescription (Rx) sheet.</li>
            </ul>
            <p style="font-size: 13px; color: #475569;">If you were issued prescription medications, please ensure you follow the dosing schedule outline in the summary report.</p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
            <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">Aura Medical Suite • Standalone Turnkey Deployment</p>
          </div>
        `,
        attachments: [
          {
            filename: `Payment_Receipt_${invoice.id}.pdf`,
            content: receiptBuffer
          },
          {
            filename: `Medical_Discharge_Summary_${invoice.id}.pdf`,
            content: summaryBuffer
          }
        ]
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`Checkout discharge email sent to ${patient.email}: ${info.messageId}`);
      if (nodemailer.getTestMessageUrl(info)) {
        console.log(`Preview Checkout Email URL: ${nodemailer.getTestMessageUrl(info)}`);
      }
    } catch (err) {
      console.error('Failed to dispatch receipt and medical summary email:', err);
    }
  }
};

module.exports = mailService;
