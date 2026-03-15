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
app.use(cors());
app.use(express.json());
app.use(fileUpload());

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

app.get('/api/health', (req, res) => {
       res.status(200).json({ status: "OK", timestamp: new Date() });
});

app.listen(PORT, () => {
       console.log(`Server is running on port ${PORT}`);
});
