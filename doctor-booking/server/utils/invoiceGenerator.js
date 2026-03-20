const PDFDocument = require('pdfkit');

/**
 * Generates a professional TAX INVOICE PDF
 * @param {Object} data - Contains appointment, payment, doctor, patient details
 * @returns {Promise<Buffer>} - PDF buffer
 */
const generateInvoice = (data) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        let buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            const pdfData = Buffer.concat(buffers);
            resolve(pdfData);
        });

        // --- HEADER ---
        doc.fillColor('#444444').fontSize(20).text('DocBook', 50, 50);
        doc.fontSize(10).text('Healthcare at your fingertips', 50, 75);
        
        doc.fontSize(20).text('TAX INVOICE', 350, 50, { align: 'right' });
        doc.fontSize(10).text(`Invoice #: ${data.invoice_number}`, 350, 75, { align: 'right' });
        doc.text(`Date: ${new Date(data.issued_at).toLocaleDateString()}`, 350, 90, { align: 'right' });

        doc.moveDown();
        doc.strokeColor('#aaaaaa').lineWidth(1).moveTo(50, 110).lineTo(550, 110).stroke();

        // --- DOCTOR & PATIENT INFO ---
        const topOfInfo = 130;
        doc.fontSize(12).text('Billed By (Doctor):', 50, topOfInfo, { underline: true });
        doc.fontSize(10).text(`Dr. ${data.doctor_name}`, 50, topOfInfo + 20);
        doc.text(data.doctor_specialty || 'General Practitioner', 50, topOfInfo + 35);
        
        doc.fontSize(12).text('Billed To (Patient):', 300, topOfInfo, { underline: true });
        doc.fontSize(10).text(data.patient_name, 300, topOfInfo + 20);
        doc.text(data.patient_email, 300, topOfInfo + 35);
        doc.text(data.patient_phone || '', 300, topOfInfo + 50);

        doc.moveDown(4);

        // --- SERVICES TABLE ---
        const tableTop = 230;
        doc.fontSize(10).text('Description', 50, tableTop, { bold: true });
        doc.text('Date/Time', 250, tableTop, { bold: true });
        doc.text('Amount (INR)', 450, tableTop, { align: 'right', bold: true });
        
        doc.strokeColor('#eeeeee').moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

        let rowY = tableTop + 25;
        doc.text(`Medical Consultation - ${data.doctor_specialty || 'General'}`, 50, rowY);
        doc.text(`${data.appointment_date} | ${data.appointment_time}`, 250, rowY);
        doc.text(`${data.subtotal.toFixed(2)}`, 450, rowY, { align: 'right' });

        if (data.discount_amount > 0) {
            rowY += 20;
            doc.fillColor('#ff0000').text(`Coupon Discount (${data.coupon_code || 'PROMO'})`, 50, rowY);
            doc.text(`-${data.discount_amount.toFixed(2)}`, 450, rowY, { align: 'right' });
        }

        if (data.insurance_covered > 0) {
            rowY += 20;
            doc.fillColor('#0000ff').text(`Insurance Coverage (${data.insurance_provider})`, 50, rowY);
            doc.text(`-${data.insurance_covered.toFixed(2)}`, 450, rowY, { align: 'right' });
        }

        doc.fillColor('#444444');
        doc.strokeColor('#aaaaaa').moveTo(50, rowY + 20).lineTo(550, rowY + 20).stroke();

        // --- TOTALS ---
        rowY += 35;
        doc.fontSize(10).text('Subtotal:', 350, rowY);
        doc.text(`${data.subtotal.toFixed(2)}`, 450, rowY, { align: 'right' });

        rowY += 15;
        doc.text('Tax (GST 18%):', 350, rowY);
        doc.text(`${data.tax_amount.toFixed(2)}`, 450, rowY, { align: 'right' });

        rowY += 20;
        doc.fontSize(14).text('Total Amount:', 350, rowY, { bold: true });
        doc.text(`₹${data.total_amount.toFixed(2)}`, 450, rowY, { align: 'right' });

        // --- FOOTER ---
        doc.fontSize(10).fillColor('#aaaaaa').text('Thank you for choosing DocBook for your healthcare needs.', 50, 700, { align: 'center' });
        doc.text(`Payment ID: ${data.razorpay_payment_id} | Status: ${data.status.toUpperCase()}`, 50, 715, { align: 'center' });

        doc.end();
    });
};

module.exports = { generateInvoice };
