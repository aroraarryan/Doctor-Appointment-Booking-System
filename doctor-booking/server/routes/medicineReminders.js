const express = require('express');
const router = express.Router();
const { 
  createMedicineReminder, 
  getActiveReminders, 
  logMedicineIntake, 
  getTodaySchedule, 
  deactivateReminder 
} = require('../controllers/medicineReminderController');
const { verifyToken, isPatient } = require('../middleware/auth');

router.use(verifyToken);
router.use(isPatient);

router.post('/', createMedicineReminder);
router.get('/', getActiveReminders);
router.get('/today', getTodaySchedule);
router.post('/:id/log', logMedicineIntake);
router.delete('/:id', deactivateReminder);

module.exports = router;
