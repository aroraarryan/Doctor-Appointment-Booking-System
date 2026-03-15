const express = require('express');
const router = express.Router();
const { 
    bookAppointment, 
    getPatientAppointments, 
    getDoctorAppointments, 
    updateStatus, 
    cancelAppointment,
    rescheduleAppointment,
    flagNoShow
} = require('../controllers/appointmentController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);

router.post('/', requireRole('patient'), bookAppointment);
router.get('/patient', requireRole('patient'), getPatientAppointments);
router.get('/doctor', requireRole('doctor'), getDoctorAppointments);
router.patch('/:id/status', requireRole('doctor'), updateStatus);
router.patch('/:id/reschedule', requireRole('patient'), rescheduleAppointment);
router.patch('/:id/no-show', requireRole('doctor'), flagNoShow);
router.delete('/:id', requireRole('patient'), cancelAppointment);

module.exports = router;
