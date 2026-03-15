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
       const { conversationId, content } = req.body;

       if (!conversationId || !content) {
              return res.status(400).json({ error: 'Conversation ID and content are required' });
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

              // 2. Insert message
              const { data: message, error: msgError } = await supabase
                     .from('messages')
                     .insert([{
                            conversation_id: conversationId,
                            sender_id: req.user.id,
                            receiver_id: receiverId,
                            content
                     }])
                     .select()
                     .single();

              if (msgError) throw msgError;

              // 3. Update conversation last message
              await supabase
                     .from('conversations')
                     .update({
                            last_message: content,
                            last_message_at: new Date()
                     })
                     .eq('id', conversationId);

              // 4. Create notification for receiver
              await createNotification(
                     receiverId,
                     'New Message',
                     content.substring(0, 50) + (content.length > 50 ? '...' : ''),
                     'new_message',
                     conversationId
              );

              res.status(201).json(message);
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

              // Map to include the "other user" details consistently
              const formattedConversations = data.map(conv => {
                     const otherUser = conv.patient_id === req.user.id ? conv.doctor : conv.patient;
                     return {
                            ...conv,
                            otherUser
                     };
              });

              res.status(200).json(formattedConversations);
       } catch (error) {
              res.status(400).json({ error: error.message });
       }
};

module.exports = {
       getOrCreateConversation,
       getMessages,
       sendMessage,
       getConversations
};
