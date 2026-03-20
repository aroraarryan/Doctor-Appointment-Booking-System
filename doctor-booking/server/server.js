const express = require('express');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const cron = require('node-cron');
require('dotenv').config();
const { initCleanupService } = require('./utils/cleanupService');
const { processReminders } = require('./utils/reminderService');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize cleanup service (run every hour)
initCleanupService();

// Schedule reminder processing (every 5 minutes)
cron.schedule('*/5 * * * *', () => {
       processReminders();
});

// Middleware
app.use(cors({
       origin: [process.env.CLIENT_URL || 'http://localhost:5173'],
       credentials: true
}));
app.use(express.json());
app.use(fileUpload());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Routes
const authRoutes = require('./routes/auth');
const doctorRoutes = require('./routes/doctors');
const availabilityRoutes = require('./routes/availability');
const appointmentRoutes = require('./routes/appointments');
const uploadRoutes = require('./routes/upload');
const notificationRoutes = require('./routes/notifications');
const messageRoutes = require('./routes/messages');
const paymentRoutes = require('./routes/payments');
const adminRoutes = require('./routes/admin');
const reviewRoutes = require('./routes/reviews');
const verificationRoutes = require('./routes/verification');
const sessionRoutes = require('./routes/sessions');
const twofaRoutes = require('./routes/twofa');
const waitlistRoutes = require('./routes/waitlist');
const prescriptionRoutes = require('./routes/prescriptions');
const medicalHistoryRoutes = require('./routes/medicalHistory');
const labAnalysisRoutes = require('./routes/labAnalysis');
const secondOpinionRoutes = require('./routes/secondOpinion');
const healthMetricsRoutes = require('./routes/healthMetrics');
const medicineReminderRoutes = require('./routes/medicineReminders');
const symptomCheckerRoutes = require('./routes/symptomChecker');
const announcementRoutes = require('./routes/announcementRoutes');
const analyticsRoutes = require('./routes/analytics');
const subscriptionRoutes = require('./routes/subscriptions');
const couponRoutes = require('./routes/coupons');
const insuranceRoutes = require('./routes/insurance');
const earningsRoutes = require('./routes/earnings');
const invoiceRoutes = require('./routes/invoices');

app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/2fa', twofaRoutes);
app.use('/api/waitlist', waitlistRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/medical-history', medicalHistoryRoutes);
app.use('/api/lab-analysis', labAnalysisRoutes);
app.use('/api/second-opinions', secondOpinionRoutes);
app.use('/api/health-metrics', healthMetricsRoutes);
app.use('/api/medicine-reminders', medicineReminderRoutes);
app.use('/api/symptom-checker', symptomCheckerRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/insurance', insuranceRoutes);
app.use('/api/earnings', earningsRoutes);
app.use('/api/invoices', invoiceRoutes);

app.get('/api/health', (req, res) => {
       res.status(200).json({ status: "OK", timestamp: new Date() });
});

app.listen(PORT, () => {
       console.log(`Server is running on port ${PORT}`);
});
