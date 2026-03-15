const supabase = require('../config/supabase');
const path = require('path');

// POST /api/upload/avatar - Upload profile photo
const uploadAvatar = async (req, res) => {
       if (!req.files || !req.files.avatar) {
              return res.status(400).json({ error: 'No avatar file uploaded' });
       }

       const file = req.files.avatar;
       const userId = req.user.id;
       const fileExt = path.extname(file.name);
       const fileName = `avatar${fileExt}`;
       const filePath = `${userId}/${fileName}`;

       try {
              // Upload to Supabase Storage
              const { data, error } = await supabase.storage
                     .from('avatars')
                     .upload(filePath, file.data, {
                            contentType: file.mimetype,
                            upsert: true
                     });

              if (error) throw error;

              // Get Public URL
              const { data: { publicUrl } } = supabase.storage
                     .from('avatars')
                     .getPublicUrl(filePath);

              // Update profile in DB
              const { error: updateError } = await supabase
                     .from('profiles')
                     .update({ avatar_url: publicUrl })
                     .eq('id', userId);

              if (updateError) throw updateError;

              res.status(200).json({ url: publicUrl });
       } catch (error) {
              console.error('uploadAvatar Error:', error);
              res.status(400).json({ error: error.message });
       }
};

// POST /api/upload/medical-record - Store medical record
const uploadMedicalRecord = async (req, res) => {
       if (!req.files || !req.files.record) {
              return res.status(400).json({ error: 'No record file uploaded' });
       }

       const file = req.files.record;
       const userId = req.user.id;
       const { appointmentId, fileName: customName } = req.body;

       const timestamp = Date.now();
       const originalName = file.name;
       const fileName = `${timestamp}-${originalName}`;
       const filePath = `${userId}/${fileName}`;

       try {
              // Upload to Private bucket
              const { error } = await supabase.storage
                     .from('medical-records')
                     .upload(filePath, file.data, {
                            contentType: file.mimetype,
                            upsert: true
                     });

              if (error) throw error;

              // Save metadata to database
              const { data: record, error: dbError } = await supabase
                     .from('medical_records')
                     .insert({
                            patient_id: userId,
                            appointment_id: appointmentId || null,
                            file_name: customName || originalName,
                            file_url: filePath,
                            file_type: file.mimetype,
                            file_size: file.size
                     })
                     .select()
                     .single();

              if (dbError) throw dbError;

              res.status(201).json(record);
       } catch (error) {
              console.error('uploadMedicalRecord Error:', error);
              res.status(400).json({ error: error.message });
       }
};

// GET /api/upload/medical-records - List records
const getMedicalRecords = async (req, res) => {
       const userId = req.user.id;
       const role = req.user.role;

       try {
              let query = supabase.from('medical_records').select(`
            *,
            patient:profiles(name),
            appointment:appointments(appointment_date, time_slot, doctor:profiles(name))
        `);

              if (role === 'patient') {
                     query = query.eq('patient_id', userId);
              } else if (role === 'doctor') {
                     // Doctors only see records linked to their appointments
                     query = query.eq('appointments.doctor_id', userId);
              }

              const { data, error } = await query;
              if (error) throw error;

              // Generate signed URLs for each record
              const recordsWithUrls = await Promise.all(data.map(async (rec) => {
                     const { data: { signedUrl }, error: signError } = await supabase.storage
                            .from('medical-records')
                            .createSignedUrl(rec.file_url, 3600); // 1 hour link

                     return {
                            ...rec,
                            view_url: signedUrl
                     };
              }));

              res.status(200).json(recordsWithUrls);
       } catch (error) {
              res.status(400).json({ error: error.message });
       }
};

// DELETE /api/upload/medical-record/:id
const deleteMedicalRecord = async (req, res) => {
       const { id } = req.params;
       const userId = req.user.id;

       try {
              // 1. Get record info to retrieve file path
              const { data: record, error: getError } = await supabase
                     .from('medical_records')
                     .select('*')
                     .eq('id', id)
                     .eq('patient_id', userId)
                     .single();

              if (getError || !record) return res.status(404).json({ error: 'Record not found or unauthorized' });

              // 2. Delete from Storage
              const { error: storageError } = await supabase.storage
                     .from('medical-records')
                     .remove([record.file_url]);

              if (storageError) throw storageError;

              // 3. Delete from DB
              const { error: dbError } = await supabase
                     .from('medical_records')
                     .delete()
                     .eq('id', id);

              if (dbError) throw dbError;

              res.status(200).json({ message: 'Record deleted successfully' });
       } catch (error) {
              res.status(400).json({ error: error.message });
       }
};

module.exports = {
       uploadAvatar,
       uploadMedicalRecord,
       getMedicalRecords,
       deleteMedicalRecord
};
