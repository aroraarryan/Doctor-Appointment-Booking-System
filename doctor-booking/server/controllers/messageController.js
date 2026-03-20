const supabase = require('../config/supabase');
const { createNotification } = require('../utils/notifications');

// POST /api/messages/conversation - get or create conversation
const getOrCreateConversation = async (req, res) => {
       const { participantId } = req.body; // The other person's ID (doctor or patient)

       if (!participantId) {
              return res.status(400).json({ error: 'Participant ID is required' });
       }

       try {
              // Determine who is student and who is doctor based on roles
              // But since we want UNIQUE(patient_id, doctor_id), we need to know who is who.
              // Let's fetch both profiles to be sure.
              const { data: profiles, error: profileError } = await supabase
                     .from('profiles')
                     .select('id, role')
                     .in('id', [req.user.id, participantId]);

              if (profileError || profiles.length < 2) {
                     throw new Error('One or both users not found');
              }

              const currentUser = profiles.find(p => p.id === req.user.id);
              const otherUser = profiles.find(p => p.id === participantId);

              let patientId, doctorId;
              if (currentUser.role === 'patient' && otherUser.role === 'doctor') {
                     patientId = currentUser.id;
                     doctorId = otherUser.id;
              } else if (currentUser.role === 'doctor' && otherUser.role === 'patient') {
                     patientId = otherUser.id;
                     doctorId = currentUser.id;
              } else {
                     return res.status(400).json({ error: 'Conversations must be between a patient and a doctor' });
              }

              // Try to find existing
              const { data: existing, error: findError } = await supabase
                     .from('conversations')
                     .select('*')
                     .eq('patient_id', patientId)
                     .eq('doctor_id', doctorId)
                     .maybeSingle();

              if (existing) {
                     return res.status(200).json(existing);
              }

              // Create new
              const { data: newConv, error: createError } = await supabase
                     .from('conversations')
                     .insert([{ patient_id: patientId, doctor_id: doctorId }])
                     .select()
                     .single();

              if (createError) throw createError;

              res.status(201).json(newConv);
       } catch (error) {
              res.status(400).json({ error: error.message });
       }
};

// GET /api/messages/:conversationId - get all messages
const getMessages = async (req, res) => {
       const { conversationId } = req.params;
       try {
              const { data, error } = await supabase
                     .from('messages')
                     .select('*')
                     .eq('conversation_id', conversationId)
                     .order('created_at', { ascending: true });

              if (error) throw error;

              res.status(200).json(data);
       } catch (error) {
              res.status(400).json({ error: error.message });
       }
};

// POST /api/messages - send a message
const sendMessage = async (req, res) => {
       const { conversationId, content, message_type = 'text', file_duration_secs } = req.body;

       if (!conversationId || (!content && !req.file)) {
              return res.status(400).json({ error: 'Conversation ID and content/file are required' });
       }

       try {
              // 1. Verify user is part of the conversation
              const { data: conversation, error: convError } = await supabase
                     .from('conversations')
                     .select('*')
                     .eq('id', conversationId)
                     .single();

              if (convError || !conversation) throw new Error('Conversation not found');

              const isParticipant = conversation.patient_id === req.user.id || conversation.doctor_id === req.user.id;
              if (!isParticipant) {
                     return res.status(403).json({ error: 'You are not a participant in this conversation' });
              }

              const receiverId = conversation.patient_id === req.user.id ? conversation.doctor_id : conversation.patient_id;
              let fileUrl = null;
              let finalContent = content;

              // 2. Handle file upload for voice messages (via multer req.file)
              if (message_type === 'voice' && req.file) {
                     const ext = req.file.originalname.split('.').pop() || 'webm';
                     const fileName = `${conversationId}/${Date.now()}.${ext}`;
                     
                     const { data: uploadData, error: uploadError } = await supabase.storage
                            .from('voice-messages')
                            .upload(fileName, req.file.buffer, { contentType: req.file.mimetype || 'audio/webm' });

                     if (uploadError) throw uploadError;
                     
                     const { data: { publicUrl } } = supabase.storage
                            .from('voice-messages')
                            .getPublicUrl(fileName);
                     
                     fileUrl = publicUrl;
                     finalContent = "🎤 Voice message";
              }

              // 3. Handle file upload for image messages (via multer req.file)
              if (message_type === 'image' && req.file) {
                     const ext = req.file.originalname.split('.').pop() || 'png';
                     const fileName = `${conversationId}/${Date.now()}.${ext}`;
                     
                     const { data: uploadData, error: uploadError } = await supabase.storage
                            .from('chat-images')
                            .upload(fileName, req.file.buffer, { contentType: req.file.mimetype || 'image/png' });

                     if (uploadError) throw uploadError;
                     
                     const { data: { publicUrl } } = supabase.storage
                            .from('chat-images')
                            .getPublicUrl(fileName);
                     
                     fileUrl = publicUrl;
                     finalContent = "📷 Image";
              }

              // 3. Insert message
              const { data: message, error: msgError } = await supabase
                     .from('messages')
                     .insert([{
                            conversation_id: conversationId,
                            sender_id: req.user.id,
                            receiver_id: receiverId,
                            content: finalContent,
                            message_type,
                            file_url: fileUrl,
                            file_duration_secs,
                            delivered_at: new Date()
                     }])
                     .select()
                     .single();

              if (msgError) throw msgError;

              // 4. Update conversation (last message, unread counts)
              const isPatientSender = req.user.id === conversation.patient_id;
              const updateData = {
                     last_message: finalContent,
                     last_message_at: new Date(),
                     [isPatientSender ? 'doctor_unread_count' : 'patient_unread_count']: (isPatientSender ? conversation.doctor_unread_count : conversation.patient_unread_count) + 1
              };

              await supabase
                     .from('conversations')
                     .update(updateData)
                     .eq('id', conversationId);

              // 5. Update doctor avg response time if applicable
              if (!isPatientSender) {
                     const { data: avgMins, error: funcError } = await supabase
                            .rpc('calculate_avg_response_time', { doctor_id_param: req.user.id });
                     
                     if (!funcError && avgMins !== null) {
                            await supabase
                                   .from('conversations')
                                   .update({ doctor_avg_response_mins: avgMins })
                                   .eq('id', conversationId);
                     }
              }

              // 6. Create notification for receiver
              await createNotification(
                     receiverId,
                     'New Message',
                     finalContent.substring(0, 50) + (finalContent.length > 50 ? '...' : ''),
                     'new_message',
                     conversationId
              );

              res.status(201).json(message);
       } catch (error) {
              console.error('sendMessage Error:', error);
              res.status(400).json({ error: error.message });
       }
};

// PATCH /api/messages/read/:conversationId
const markMessagesAsRead = async (req, res) => {
       const { conversationId } = req.params;
       try {
              // 1. Mark messages as read
              const { data, error, count } = await supabase
                     .from('messages')
                     .update({ read_at: new Date(), is_read: true })
                     .eq('conversation_id', conversationId)
                     .eq('receiver_id', req.user.id)
                     .is('read_at', null)
                     .select('*', { count: 'exact' });

              if (error) throw error;

              // 2. Reset unread count for current user
              const { data: conversation, error: convError } = await supabase
                     .from('conversations')
                     .select('*')
                     .eq('id', conversationId)
                     .single();
              
              if (convError) throw convError;

              const isPatient = req.user.id === conversation.patient_id;
              await supabase
                     .from('conversations')
                     .update({ [isPatient ? 'patient_unread_count' : 'doctor_unread_count']: 0 })
                     .eq('id', conversationId);

              res.status(200).json({ read_count: count });
       } catch (error) {
              res.status(400).json({ error: error.message });
       }
};

// GET /api/messages/conversations - get all conversations for user
const getConversations = async (req, res) => {
       try {
              const { data, error } = await supabase
                     .from('conversations')
                     .select(`
                        *,
                        patient:profiles!patient_id (id, name, avatar_url),
                        doctor:profiles!doctor_id (id, name, avatar_url)
                      `)
                     .or(`patient_id.eq.${req.user.id},doctor_id.eq.${req.user.id}`)
                     .order('last_message_at', { ascending: false, nullsFirst: false });

              if (error) throw error;

              // Map to include the "other user" details consistently and unread counts
              const formattedConversations = await Promise.all(data.map(async conv => {
                     const isPatient = conv.patient_id === req.user.id;
                     const otherUser = isPatient ? conv.doctor : conv.patient;
                     
                     // Fetch other user's last session for "last seen"
                     const { data: session } = await supabase
                            .from('user_sessions')
                            .select('last_active_at')
                            .eq('user_id', otherUser.id)
                            .eq('is_active', true)
                            .order('last_active_at', { ascending: false })
                            .limit(1)
                            .maybeSingle();

                     return {
                            ...conv,
                            otherUser: {
                                   ...otherUser,
                                   last_active_at: session?.last_active_at
                            },
                            unreadCount: isPatient ? conv.patient_unread_count : conv.doctor_unread_count
                     };
              }));

              res.status(200).json(formattedConversations);
       } catch (error) {
              console.error('getConversations Error:', error);
              res.status(400).json({ error: error.message });
       }
};

module.exports = {
       getOrCreateConversation,
       getMessages,
       sendMessage,
       getConversations,
       markMessagesAsRead
};
