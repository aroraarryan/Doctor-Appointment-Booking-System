const supabase = require('../config/supabase');
const { sendEmail } = require('./emailService');
const { createNotification } = require('./notifications');

/**
 * Processes due appointment reminders.
 * Runs every 5 minutes via cron job.
 */
const processReminders = async () => {
    try {
        console.log('[ReminderService] Checking for due reminders...');
        const now = new Date().toISOString();

        // 1. Fetch unsent reminders that are due
        const { data: reminders, error } = await supabase
            .from('appointment_reminders')
            .select(`
                *,
                appointment:appointments(
                    id,
                    appointment_date,
                    time_slot,
                    patient:profiles!appointments_patient_id_fkey(id, name, email),
                    doctor:doctors(
                        id,
                        profile:profiles!doctors_id_fkey(name)
                    )
                )
            `)
            .eq('sent', false)
            .lte('send_at', now);

        if (error) {
            console.error('[ReminderService] Error fetching reminders:', error);
            return;
        }

        if (!reminders || reminders.length === 0) {
            return;
        }

        console.log(`[ReminderService] Found ${reminders.length} due reminders.`);

        for (const reminder of reminders) {
            const { appointment } = reminder;
            if (!appointment) continue;

            const patient = appointment.patient;
            const doctorName = appointment.doctor?.profile?.name || 'your doctor';
            
            const timeStr = appointment.time_slot;
            const dateStr = new Date(appointment.appointment_date).toLocaleDateString();
            
            const reminderText = reminder.reminder_type === '24h' ? 'tomorrow' : 'in 1 hour';
            const subject = `Reminder: Appointment with Dr. ${doctorName} ${reminderText}`;
            const message = `Hello ${patient.name}, this is a reminder for your appointment with Dr. ${doctorName} ${reminderText} on ${dateStr} at ${timeStr}.`;

            try {
                // Send Email
                if (reminder.channel === 'email' || reminder.channel === 'both') {
                    await sendEmail(
                        patient.email,
                        subject,
                        `<div style="font-family: Arial, sans-serif; padding: 20px;">
                            <h2>Appointment Reminder</h2>
                            <p>${message}</p>
                            <p>Please ensure you are available at the scheduled time.</p>
                            <hr>
                            <p style="font-size: 12px; color: #666;">This is an automated reminder from DocBook.</p>
                        </div>`
                    );
                }

                // Send In-App Notification
                if (reminder.channel === 'notification' || reminder.channel === 'both') {
                    await createNotification(
                        patient.id,
                        'Appointment Reminder',
                        message,
                        'appointment_reminder',
                        appointment.id
                    );
                }

                // Mark as sent
                await supabase
                    .from('appointment_reminders')
                    .update({
                        sent: true,
                        sent_at: new Date().toISOString()
                    })
                    .eq('id', reminder.id);

                console.log(`[ReminderService] Reminder ${reminder.id} sent successfully.`);
            } catch (sendError) {
                console.error(`[ReminderService] Failed to send reminder ${reminder.id}:`, sendError);
            }
        }
    } catch (error) {
        console.error('[ReminderService] Unexpected error:', error);
    }
};

module.exports = { processReminders };
