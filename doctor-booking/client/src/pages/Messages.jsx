import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useRealtime } from '../context/RealtimeContext';
import { supabase } from '../config/supabase';
import { formatDistanceToNow } from 'date-fns';
import { 
  MicrophoneIcon, 
  StopIcon, 
  PaperAirplaneIcon, 
  PhotoIcon,
  CheckIcon,
  ChevronDoubleRightIcon
} from '@heroicons/react/24/outline';

const Messages = () => {
       const { user } = useAuth();
       const { latestMessage } = useRealtime();
       const [conversations, setConversations] = useState([]);
       const [activeConversation, setActiveConversation] = useState(null);
       const [messages, setMessages] = useState([]);
       const [newMessage, setNewMessage] = useState('');
       const [loading, setLoading] = useState(true);
       const [isRecording, setIsRecording] = useState(false);
       const [recordingDuration, setRecordingDuration] = useState(0);
       const mediaRecorder = useRef(null);
       const audioChunks = useRef([]);
       const timerRef = useRef(null);
       const messagesEndRef = useRef(null);
       const location = useLocation();
       const navigate = useNavigate();

       const queryParams = new URLSearchParams(location.search);
       const initialConvId = queryParams.get('convId');

       const scrollToBottom = () => {
              messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
       };

       useEffect(() => {
              fetchConversations();
       }, []);

       useEffect(() => {
              if (initialConvId && conversations.length > 0) {
                     const conv = conversations.find(c => c.id === initialConvId);
                     if (conv) setActiveConversation(conv);
              }
       }, [initialConvId, conversations]);

       useEffect(() => {
               if (activeConversation) {
                      fetchMessages(activeConversation.id);
                      markAsRead(activeConversation.id);
               }
       }, [activeConversation]);

       useEffect(() => {
              scrollToBottom();
       }, [messages]);

        // Update message list and conversation list locally when changes arrive via RealtimeContext
        useEffect(() => {
               if (latestMessage) {
                      // 1. If it's an update (like read receipt)
                      if (latestMessage._isUpdate) {
                             if (activeConversation && latestMessage.conversation_id === activeConversation.id) {
                                    setMessages(prev => prev.map(m => 
                                           m.id === latestMessage.id ? latestMessage : m
                                    ));
                             }
                      } 
                      // 2. If it's a new message
                      else {
                             // Only add to message list if it's the active conversation and NOT sent by us (sent by us is handled in handleSendMessage)
                             if (activeConversation && latestMessage.conversation_id === activeConversation.id && latestMessage.sender_id !== user.id) {
                                    setMessages(prev => [...prev, latestMessage]);
                                    markAsRead(activeConversation.id);
                             }

                             // Update conversation preview in sidebar
                             setConversations(prev => {
                                    const updated = prev.map(c =>
                                           c.id === latestMessage.conversation_id
                                                  ? { ...c, last_message: latestMessage.content, last_message_at: latestMessage.created_at }
                                                  : c
                                    );
                                    return updated.sort((a, b) => new Date(b.last_message_at) - new Date(a.last_message_at));
                             });
                      }
               }
        }, [latestMessage, activeConversation, user.id]);

        // Handle direct conversation updates (like unread counts)
        const { latestConvUpdate } = useRealtime();
        useEffect(() => {
               if (latestConvUpdate) {
                      setConversations(prev => prev.map(c => 
                             c.id === latestConvUpdate.id ? { ...c, ...latestConvUpdate } : c
                      ));
               }
        }, [latestConvUpdate]);

       const fetchConversations = async () => {
              try {
                     const { data } = await api.get('/messages/conversations');
                     setConversations(data);
                     if (data.length > 0 && !initialConvId) {
                            // Don't auto-select if we have an initialConvId we're waiting for
                     }
              } catch (error) {
                     console.error('Error fetching conversations:', error);
              } finally {
                     setLoading(false);
              }
       };

        const fetchMessages = async (convId) => {
               try {
                      const { data } = await api.get(`/messages/${convId}`);
                      setMessages(data);
                      scrollToBottom();
               } catch (error) {
                      console.error('Error fetching messages:', error);
               }
        };

        const markAsRead = async (convId) => {
               try {
                      await api.patch(`/messages/read/${convId}`);
                      // Update local conversations unread count
                      setConversations(prev => prev.map(c => 
                             c.id === convId ? { ...c, [user.role === 'patient' ? 'patient_unread_count' : 'doctor_unread_count']: 0 } : c
                      ));
               } catch (error) {
                      console.error('Error marking as read:', error);
               }
        };

        const startRecording = async () => {
               try {
                      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                      mediaRecorder.current = new MediaRecorder(stream);
                      audioChunks.current = [];
                      
                      mediaRecorder.current.ondataavailable = (e) => audioChunks.current.push(e.data);
                      mediaRecorder.current.onstop = handleVoiceUpload;
                      
                      mediaRecorder.current.start();
                      setIsRecording(true);
                      setRecordingDuration(0);
                      timerRef.current = setInterval(() => {
                             setRecordingDuration(prev => prev + 1);
                      }, 1000);
               } catch (err) {
                      console.error('Microphone access denied:', err);
               }
        };

        const stopRecording = () => {
               if (mediaRecorder.current && isRecording) {
                      mediaRecorder.current.stop();
                      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
                      setIsRecording(false);
                      clearInterval(timerRef.current);
               }
        };

        const handleVoiceUpload = async () => {
               const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
               const formData = new FormData();
               formData.append('conversationId', activeConversation.id);
               formData.append('message_type', 'voice');
               formData.append('file_duration_secs', recordingDuration);
               formData.append('file', audioBlob, 'voice_message.webm');

               try {
                      const { data } = await api.post('/messages', formData, {
                             headers: { 'Content-Type': 'multipart/form-data' }
                      });
                      setMessages(prev => [...prev, data]);
                      fetchConversations(); // Refresh last message
               } catch (error) {
                      console.error('Voice send failed:', error);
               }
        };

       const handleSendMessage = async (e) => {
              e.preventDefault();
              if (!newMessage.trim() || !activeConversation) return;

              const content = newMessage.trim();
              setNewMessage('');

              try {
                     const { data } = await api.post('/messages', {
                            conversationId: activeConversation.id,
                            content
                     });
                     // Add message locally immediately for crisp UI
                     setMessages(prev => [...prev, data]);

                     // Update conversation preview locally
                     setConversations(prev => {
                            const updated = prev.map(c =>
                                   c.id === activeConversation.id
                                          ? { ...c, last_message: content, last_message_at: new Date().toISOString() }
                                          : c
                            );
                            return updated.sort((a, b) => new Date(b.last_message_at) - new Date(a.last_message_at));
                     });

              } catch (error) {
                     console.error('Error sending message:', error);
              }
       };

       if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;

       return (
              <div className="flex h-[calc(100vh-12rem)] bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                     {/* Sidebar - Conversations */}
                     <div className="w-1/3 border-r border-gray-100 flex flex-col bg-gray-50/30">
                            <div className="p-4 border-b border-gray-100 bg-white">
                                   <h2 className="text-lg font-bold text-gray-800">Messages</h2>
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                   {conversations.length > 0 ? (
                                          conversations.map(conv => (
                                                 <div
                                                        key={conv.id}
                                                        onClick={() => {
                                                               setActiveConversation(conv);
                                                               navigate(`/messages?convId=${conv.id}`, { replace: true });
                                                        }}
                                                        className={`p-4 flex items-center space-x-3 cursor-pointer transition hover:bg-white ${activeConversation?.id === conv.id ? 'bg-white border-l-4 border-indigo-600 shadow-sm' : 'border-l-4 border-transparent'}`}
                                                 >
                                                        <div className="relative">
                                                               <img
                                                                      src={conv.otherUser.avatar_url || 'https://via.placeholder.com/40'}
                                                                      alt={conv.otherUser.name}
                                                                      className="h-12 w-12 rounded-full object-cover border-2 border-white shadow-sm"
                                                               />
                                                               {/* Status indicator could go here */}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                               <div className="flex justify-between items-baseline">
                                                                      <p className="text-sm font-bold text-gray-900 truncate">{conv.otherUser.name}</p>
                                                                      <div className="flex items-center space-x-2">
                                                                             {conv.last_message_at && (
                                                                                     <span className="text-[10px] text-gray-400">
                                                                                            {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: false })}
                                                                                     </span>
                                                                              )}
                                                                              {((user.role === 'patient' && conv.patient_unread_count > 0) || 
                                                                                (user.role === 'doctor' && conv.doctor_unread_count > 0)) && (
                                                                                     <span className="bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                                                                            {user.role === 'patient' ? conv.patient_unread_count : conv.doctor_unread_count}
                                                                                     </span>
                                                                              )}
                                                                       </div>
                                                               </div>
                                                               <p className="text-xs text-gray-500 truncate mt-1">
                                                                      {conv.last_message || 'Start a conversation...'}
                                                               </p>
                                                        </div>
                                                 </div>
                                          ))
                                   ) : (
                                          <div className="p-8 text-center text-gray-500 italic">
                                                 No conversations yet.
                                          </div>
                                   )}
                            </div>
                     </div>

                     {/* Main - Chat Window */}
                     <div className="flex-1 flex flex-col bg-white">
                            {activeConversation ? (
                                   <>
                                          {/* Chat Header */}
                                          <div className="p-4 border-b border-gray-100 flex items-center bg-white">
                                                 <img
                                                        src={activeConversation.otherUser.avatar_url || 'https://via.placeholder.com/40'}
                                                        alt={activeConversation.otherUser.name}
                                                        className="h-10 w-10 rounded-full object-cover mr-3 border shadow-sm"
                                                 />
                                                 <div>
                                                        <h3 className="text-sm font-bold text-gray-900">{activeConversation.otherUser.name}</h3>
                                                        {activeConversation.otherUser.last_seen ? (
                                                               <p className={`text-[10px] font-medium ${
                                                                      (new Date() - new Date(activeConversation.otherUser.last_seen)) < 300000 
                                                                             ? 'text-green-500' : 'text-gray-400'
                                                               }`}>
                                                                      {(new Date() - new Date(activeConversation.otherUser.last_seen)) < 300000 
                                                                             ? 'Online' : `Last seen ${formatDistanceToNow(new Date(activeConversation.otherUser.last_seen), { addSuffix: true })}`}
                                                               </p>
                                                        ) : (
                                                               <p className="text-[10px] text-gray-400 font-medium">Offline</p>
                                                        )}
                                                 </div>
                                          </div>

                                          {/* Messages List */}
                                          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/20">
                                                 {messages.map((msg, idx) => (
                                                        <div
                                                               key={msg.id || idx}
                                                               className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                                                        >
                                                                <div className={`max-w-[75%] rounded-2xl p-3 shadow-sm ${msg.sender_id === user.id ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'}`}>
                                                                       {msg.message_type === 'text' && (
                                                                              <p className="text-sm leading-relaxed">{msg.content}</p>
                                                                       )}
                                                                       {msg.message_type === 'image' && (
                                                                              <img src={msg.file_url} alt="Sent image" className="rounded-lg max-w-full h-auto cursor-pointer" onClick={() => window.open(msg.file_url, '_blank')} />
                                                                       )}
                                                                       {msg.message_type === 'voice' && (
                                                                              <div className="flex items-center space-x-2 py-1">
                                                                                     <div className="p-2 bg-white/20 rounded-full">
                                                                                            <audio src={msg.file_url} controls className="h-8 max-w-[200px]" />
                                                                                     </div>
                                                                                     <span className="text-[10px] opacity-80">{msg.file_duration_secs}s</span>
                                                                              </div>
                                                                       )}
                                                                       <div className="flex items-center justify-end mt-1 space-x-1">
                                                                              <p className={`text-[10px] ${msg.sender_id === user.id ? 'text-indigo-100' : 'text-gray-400'}`}>
                                                                                     {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                              </p>
                                                                              {msg.sender_id === user.id && (
                                                                                     msg.read_at ? (
                                                                                            <ChevronDoubleRightIcon className="h-3 w-3 text-white" title={`Read at ${new Date(msg.read_at).toLocaleTimeString()}`} />
                                                                                     ) : msg.delivered_at ? (
                                                                                            <CheckIcon className="h-3 w-3 text-indigo-200" title="Delivered" />
                                                                                     ) : (
                                                                                            <CheckIcon className="h-3 w-3 text-indigo-300 opacity-50" title="Sent" />
                                                                                     )
                                                                              )}
                                                                       </div>
                                                                </div>
                                                        </div>
                                                 ))}
                                                 <div ref={messagesEndRef} />
                                          </div>

                                           {/* Message Input */}
                                          <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-100 bg-white">
                                                 <div className="flex items-center space-x-2">
                                                        {isRecording ? (
                                                               <div className="flex-1 flex items-center justify-between bg-red-50 text-red-600 px-4 py-2 rounded-full border border-red-100 animate-pulse">
                                                                      <div className="flex items-center space-x-2">
                                                                             <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                                                                             <span className="text-sm font-bold">Recording... {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}</span>
                                                                      </div>
                                                                      <button type="button" onClick={stopRecording}>
                                                                             <StopIcon className="h-6 w-6" />
                                                                      </button>
                                                               </div>
                                                        ) : (
                                                               <>
                                                                      <div className="relative flex-1">
                                                                             <input
                                                                                    type="text"
                                                                                    value={newMessage}
                                                                                    onChange={(e) => setNewMessage(e.target.value)}
                                                                                    placeholder="Type your message..."
                                                                                    className="w-full border border-gray-200 rounded-full pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                                                                             />
                                                                             <button 
                                                                                    type="button" 
                                                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600"
                                                                                    onClick={() => document.getElementById('image-upload').click()}
                                                                             >
                                                                                    <PhotoIcon className="h-5 w-5" />
                                                                                    <input 
                                                                                           id="image-upload" 
                                                                                           type="file" 
                                                                                           className="hidden" 
                                                                                           accept="image/*" 
                                                                                           onChange={(e) => {
                                                                                                  if (e.target.files[0]) {
                                                                                                         const formData = new FormData();
                                                                                                         formData.append('conversationId', activeConversation.id);
                                                                                                         formData.append('message_type', 'image');
                                                                                                         formData.append('file', e.target.files[0]);
                                                                                                         api.post('/messages', formData).then(res => setMessages(p => [...p, res.data]));
                                                                                                  }
                                                                                           }}
                                                                                    />
                                                                             </button>
                                                                      </div>
                                                                      <button
                                                                             type="button"
                                                                             onClick={startRecording}
                                                                             className="p-3 rounded-full hover:bg-gray-100 text-gray-400 hover:text-indigo-600 transition"
                                                                      >
                                                                             <MicrophoneIcon className="h-6 w-6" />
                                                                      </button>
                                                                      <button
                                                                             type="submit"
                                                                             disabled={!newMessage.trim()}
                                                                             className="bg-indigo-600 text-white p-3 rounded-full hover:bg-indigo-700 disabled:bg-gray-200 transition shadow-md"
                                                                      >
                                                                             <PaperAirplaneIcon className="h-6 w-6" />
                                                                      </button>
                                                               </>
                                                        )}
                                                 </div>
                                          </form>
                                   </>
                            ) : (
                                   <div className="flex-1 flex flex-col items-center justify-center text-gray-500 bg-gray-50/10">
                                          <div className="bg-white p-8 rounded-full shadow-sm border border-gray-50 mb-4">
                                                 <svg className="h-16 w-16 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                 </svg>
                                          </div>
                                          <p className="text-lg font-medium">Select a conversation to start chatting</p>
                                          <p className="text-sm">Real-time messaging powered by Supabase</p>
                                   </div>
                            )}
                     </div>
              </div>
       );
};

export default Messages;
