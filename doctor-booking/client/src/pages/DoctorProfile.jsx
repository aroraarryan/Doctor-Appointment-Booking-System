import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { loadRazorpay } from '../utils/razorpay';
import { toast } from 'react-hot-toast';

import ReviewCard from '../components/ReviewCard';

const DoctorProfile = () => {
       const { id } = useParams();
       const { user } = useAuth();
       const navigate = useNavigate();
       const [doctor, setDoctor] = useState(null);
       const [slots, setSlots] = useState([]);
       const [reviews, setReviews] = useState([]);
       const [availability, setAvailability] = useState({});
       const [loading, setLoading] = useState(true);
       const [selectedDate, setSelectedDate] = useState('');
       const [selectedSlot, setSelectedSlot] = useState('');
       const [notes, setNotes] = useState('');
       const [booking, setBooking] = useState(false);
       const [showModal, setShowModal] = useState(false);
       const [isRecurring, setIsRecurring] = useState(false);
       const [recurrencePattern, setRecurrencePattern] = useState('weekly');
       const [recurrenceCount, setRecurrenceCount] = useState(4);
       const [showWaitlistModal, setShowWaitlistModal] = useState(false);
       const [waitlistNotes, setWaitlistNotes] = useState('');
       const [isUrgent, setIsUrgent] = useState(false);
       const [couponCode, setCouponCode] = useState('');
       const [insurancePolicy, setInsurancePolicy] = useState('');
       const [appliedCoupon, setAppliedCoupon] = useState(null);
       const [validatingCoupon, setValidatingCoupon] = useState(false);

       useEffect(() => {
              const fetchDoctorData = async () => {
                     try {
                            const month = new Date().toISOString().slice(0, 7); // YYYY-MM
                            const [docRes, reviewsRes, availRes] = await Promise.all([
                                   api.get(`/doctors/${id}`),
                                   api.get(`/reviews/doctor/${id}`),
                                   api.get(`/doctors/${id}/availability-calendar?month=${month}`)
                            ]);
                            setDoctor(docRes.data);
                            setReviews(reviewsRes.data.reviews || []);
                            setAvailability(availRes.data);
                     } catch (error) {
                            console.error('Fetch doctor data error:', error);
                     } finally {
                            setLoading(false);
                     }
              };
              fetchDoctorData();
       }, [id]);

       useEffect(() => {
              if (selectedDate) {
                     const fetchSlots = async () => {
                            try {
                                   const { data } = await api.get(`/availability/${id}?date=${selectedDate}`);
                                   setSlots(data);
                                   setSelectedSlot('');
                            } catch (error) {
                                   console.error('Fetch slots error:', error);
                            }
                     };
                     fetchSlots();
              }
       }, [id, selectedDate]);

       const handleBooking = async () => {
              if (!user) {
                     navigate('/login');
                     return;
              }

              setBooking(true);
              try {
                     // 1. Create initial appointment(s)
                     const { data: res } = await api.post('/appointments', {
                            doctor_id: id,
                            appointment_date: selectedDate,
                            time_slot: selectedSlot,
                            notes,
                            is_recurring: isRecurring,
                            recurrence_pattern: recurrencePattern,
                            recurrence_count: isRecurring ? recurrenceCount : 1
                     });

                     const appointments = Array.isArray(res) ? res : [res];
                     const firstAppointmentId = appointments[0].id;

                     // 2. Load Razorpay script
                     const loaded = await loadRazorpay();
                     if (!loaded) {
                            toast.error('Payment service unavailable');
                            setBooking(false);
                            return;
                     }

                     // 3. Create order on backend (Total for all sessions if recurring)
                     const { data: orderData } = await api.post('/payments/create-order', { 
                            appointmentId: firstAppointmentId,
                            allRecurring: isRecurring,
                            couponCode: couponCode || null,
                            insurancePolicy: insurancePolicy || null
                     });

                     // 4. Open Razorpay checkout
                     const options = {
                            key: orderData.keyId,
                            amount: orderData.amount,
                            currency: orderData.currency,
                            name: 'DocBook',
                            description: isRecurring 
                                   ? `${recurrenceCount} sessions with Dr. ${orderData.doctorName}`
                                   : `Consultation with Dr. ${orderData.doctorName}`,
                            order_id: orderData.orderId,
                            handler: async (response) => {
                                   try {
                                          const verify = await api.post('/payments/verify', {
                                                 razorpay_order_id: response.razorpay_order_id,
                                                 razorpay_payment_id: response.razorpay_payment_id,
                                                 razorpay_signature: response.razorpay_signature,
                                                 appointmentId: firstAppointmentId,
                                                 allRecurring: isRecurring
                                          });

                                          if (verify.data.success) {
                                                 toast.success(isRecurring ? 'All sessions booked!' : 'Appointment confirmed!');
                                                 navigate('/dashboard');
                                          }
                                   } catch (err) {
                                          toast.error('Payment verification failed');
                                   }
                            },
                            prefill: {
                                   name: user.name,
                                   email: user.email,
                                   contact: user.phone || ''
                            },
                            theme: { color: '#4F46E5' },
                            modal: {
                                   ondismiss: () => {
                                          toast.error('Payment cancelled');
                                          setBooking(false);
                                   }
                            }
                     };

                     const rzp = new window.Razorpay(options);
                     rzp.on('payment.failed', (response) => {
                            toast.error(`Payment failed: ${response.error.description}`);
                      });
                      rzp.open();

               } catch (error) {
                      toast.error(error.response?.data?.error || 'Booking failed');
                      setBooking(false);
               } finally {
                      setShowModal(false);
               }
        };

        const handleJoinWaitlist = async () => {
               if (!user) {
                      navigate('/login');
                      return;
               }

               try {
                      const { data } = await api.post('/waitlist', {
                             doctorId: id,
                             preferred_date: selectedDate,
                             preferred_time_start: '09:00:00', // Default window
                             preferred_time_end: '17:00:00',
                             notes: waitlistNotes,
                             priority: isUrgent ? 1 : 0
                       });
                      toast.success(`Position ${data.position} on waitlist!`);
                       setShowWaitlistModal(false);
                       setWaitlistNotes('');
                       setIsUrgent(false);
               } catch (error) {
                      toast.error(error.response?.data?.error || 'Failed to join waitlist');
               }
        };

       if (loading) return (
              <div className="max-w-5xl mx-auto py-20 text-center space-y-4">
                     <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                     <p className="text-gray-500 font-medium">Loading specialist profile...</p>
              </div>
       );
       if (!doctor) return <div className="text-center py-20 text-red-500">Doctor not found.</div>;

       const minDate = new Date().toISOString().split('T')[0];

       return (
              <div className="max-w-5xl mx-auto space-y-12 pb-20">
                     {/* Doctor Header */}
                     <div className="bg-white p-10 rounded-3xl shadow-md border border-gray-100 flex flex-col md:flex-row gap-10 items-center md:items-start text-center md:text-left relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -mr-10 -mt-10 group-hover:bg-indigo-100 transition-colors"></div>

                            <div className="relative">
                                   <div className="w-40 h-40 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center text-5xl font-bold text-white shadow-xl overflow-hidden">
                                          {doctor.avatar_url ? (
                                                 <img src={doctor.avatar_url} alt={doctor.name} className="w-full h-full object-cover" />
                                          ) : (
                                                 doctor.name.charAt(0)
                                          )}
                                   </div>
                                    {doctor.is_verified && (
                                           <div className={`absolute -bottom-4 -right-4 text-white p-2 rounded-2xl shadow-xl border-4 border-white flex items-center gap-1 ${
                                               doctor.doctor_subscriptions?.find(s => s.status === 'active')?.plan?.badge_type === 'platinum' ? 'bg-indigo-600' :
                                               doctor.doctor_subscriptions?.find(s => s.status === 'active')?.plan?.badge_type === 'gold' ? 'bg-yellow-500' :
                                               'bg-blue-500'
                                           }`} title="Verified Specialist">
                                                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                         <path d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745a3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                                                  </svg>
                                                  <span className="text-[10px] font-black pr-1 uppercase">
                                                      {doctor.doctor_subscriptions?.find(s => s.status === 'active')?.plan?.badge_type || 'VERIFIED'}
                                                  </span>
                                           </div>
                                    )}
                            </div>

                            <div className="flex-1 space-y-6 relative z-10">
                                   <div>
                                          <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                                                 <h1 className="text-4xl font-extrabold text-gray-900 leading-tight">{doctor.name}</h1>
                                          </div>
                                          <p className="text-indigo-600 font-bold text-xl flex items-center justify-center md:justify-start gap-2">
                                                 <span className="bg-indigo-100 px-3 py-1 rounded-lg text-sm">{doctor.specialty}</span>
                                                 {doctor.city && <span className="text-gray-400 text-sm font-normal">• {doctor.city}, {doctor.state}</span>}
                                          </p>
                                   </div>

                                   <div className="flex flex-wrap justify-center md:justify-start gap-4">
                                          <div className="bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100">
                                                 <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Experience</p>
                                                 <p className="text-gray-900 font-bold">{doctor.experience} Years</p>
                                          </div>
                                          <div className="bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100">
                                                 <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Consultation</p>
                                                 <p className="text-gray-900 font-bold">₹{doctor.fees}</p>
                                          </div>
                                          <div className="bg-yellow-50 px-4 py-2 rounded-2xl border border-yellow-100">
                                                 <p className="text-xs text-yellow-600 uppercase font-bold tracking-wider">Rating</p>
                                                 <div className="flex items-center gap-1">
                                                        <span className="text-yellow-700 font-bold">★ {doctor.rating}</span>
                                                        <span className="text-yellow-500 text-xs">({doctor.total_reviews} reviews)</span>
                                                 </div>
                                          </div>
                                   </div>

                                   <p className="text-gray-600 leading-relaxed max-w-2xl text-lg italic">
                                          "{doctor.bio || 'Dedicated to providing exceptional care with a focus on patient well-being.'}"
                                   </p>

                                   {user && user.role === 'patient' && (
                                          <button
                                                 onClick={async () => {
                                                        try {
                                                               const { data } = await api.post('/messages/conversation', { participantId: id });
                                                               navigate(`/messages?convId=${data.id}`);
                                                        } catch (error) {
                                                               toast.error('Error starting conversation');
                                                        }
                                                 }}
                                                 className="inline-flex items-center space-x-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-100 group"
                                          >
                                                 <svg className="h-5 w-5 transform group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                                 </svg>
                                                 <span>Chat with Doctor</span>
                                          </button>
                                   )}
                            </div>
                     </div>

                     <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                            {/* Booking Sidebar */}
                            <div className="lg:col-span-1">
                                   <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 sticky top-24 space-y-8">
                                          <div>
                                                 <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                                                        <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                        Appointment
                                                 </h3>

                                                 <div className="space-y-6">
                                                        <div>
                                                               <label className="block text-sm font-bold text-gray-700 mb-3">Work Calendar</label>
                                                               <div className="grid grid-cols-7 gap-1 p-2 bg-gray-50 rounded-2xl border border-gray-100">
                                                                      {Object.entries(availability).map(([date, data]) => {
                                                                             const day = new Date(date).getDate();
                                                                             const isPast = new Date(date) < new Date(new Date().setHours(0, 0, 0, 0));
                                                                             return (
                                                                                    <button
                                                                                           key={date}
                                                                                           disabled={isPast || !data.available}
                                                                                           onClick={() => setSelectedDate(date)}
                                                                                           className={`aspect-square flex flex-col items-center justify-center rounded-xl text-xs transition-all ${selectedDate === date
                                                                                                         ? 'bg-indigo-600 text-white scale-110 shadow-md'
                                                                                                         : isPast || !data.available
                                                                                                                ? 'text-gray-300 cursor-not-allowed'
                                                                                                                : 'hover:bg-indigo-50 text-gray-700'
                                                                                                  }`}
                                                                                    >
                                                                                           <span className="font-bold">{day}</span>
                                                                                           {!isPast && data.available && <span className="w-1 h-1 bg-green-400 rounded-full mt-1"></span>}
                                                                                    </button>
                                                                             );
                                                                      })}
                                                               </div>
                                                               <p className="text-[10px] text-gray-400 mt-2 text-center uppercase tracking-widest font-bold">Select an active day above</p>
                                                        </div>

                                                        {selectedDate && (
                                                               <div className="animate-in slide-in-from-top-4 duration-300">
                                                                      <label className="block text-sm font-bold text-gray-700 mb-3">Pick a Slot</label>
                                                                      {slots.length > 0 ? (
                                                                             <div className="grid grid-cols-2 gap-2">
                                                                                    {slots.map(slot => (
                                                                                           <button
                                                                                                  key={slot}
                                                                                                  onClick={() => setSelectedSlot(slot)}
                                                                                                  className={`py-3 text-xs font-bold rounded-xl border transition-all ${selectedSlot === slot
                                                                                                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                                                                                                                : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-400'
                                                                                                         }`}
                                                                                           >
                                                                                                  {slot.substring(0, 5)}
                                                                                           </button>
                                                                                    ))}
                                                                             </div>
                                                                      ) : (
                                                                             <div className="space-y-4">
                                                                                    <div className="text-center py-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                                                                           <p className="text-sm text-gray-400 font-medium">Fully Booked</p>
                                                                                    </div>
                                                                                    <button 
                                                                                           onClick={() => setShowWaitlistModal(true)}
                                                                                           className="w-full bg-indigo-50 text-indigo-600 py-3 rounded-xl font-bold border border-indigo-100 hover:bg-indigo-100 transition-all text-sm"
                                                                                    >
                                                                                           Join Waitlist for this Day
                                                                                    </button>
                                                                             </div>
                                                                      )}
                                                               </div>
                                                        )}

                                                        {selectedSlot && (
                                                               <div className="space-y-4 animate-in slide-in-from-top-4 duration-300">
                                                                      {/* Recurring Option */}
                                                                      <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                                                                             <div className="flex items-center justify-between mb-2">
                                                                                    <label className="text-sm font-bold text-gray-800">Make it Recurring?</label>
                                                                                    <button 
                                                                                           onClick={() => setIsRecurring(!isRecurring)}
                                                                                           className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isRecurring ? 'bg-indigo-600' : 'bg-gray-200'}`}
                                                                                    >
                                                                                           <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isRecurring ? 'translate-x-6' : 'translate-x-1'}`} />
                                                                                    </button>
                                                                             </div>
                                                                             {isRecurring && (
                                                                                    <div className="space-y-3 pt-2 animate-in fade-in duration-200">
                                                                                           <div className="flex gap-2">
                                                                                                  <button 
                                                                                                         onClick={() => setRecurrencePattern('weekly')}
                                                                                                         className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg border transition-all ${recurrencePattern === 'weekly' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200'}`}
                                                                                                  >
                                                                                                         WEEKLY
                                                                                                  </button>
                                                                                                  <button 
                                                                                                         onClick={() => setRecurrencePattern('bi-weekly')}
                                                                                                         className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg border transition-all ${recurrencePattern === 'bi-weekly' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200'}`}
                                                                                                  >
                                                                                                         BI-WEEKLY
                                                                                                  </button>
                                                                                           </div>
                                                                                           <div className="flex items-center justify-between">
                                                                                                  <span className="text-[10px] font-bold text-gray-500 uppercase">Sessions</span>
                                                                                                  <input 
                                                                                                         type="number" 
                                                                                                         min="2" 
                                                                                                         max="12" 
                                                                                                         value={recurrenceCount} 
                                                                                                         onChange={(e) => setRecurrenceCount(parseInt(e.target.value))}
                                                                                                         className="w-12 text-center bg-white border border-gray-200 rounded-lg text-xs font-bold py-1"
                                                                                                  />
                                                                                           </div>
                                                                                    </div>
                                                                             )}
                                                                      </div>

                                                                      <div>
                                                                             <label className="block text-sm font-bold text-gray-700 mb-2">Message for Doctor</label>
                                                                             <textarea
                                                                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all"
                                                                                    rows="3"
                                                                                    placeholder="Briefly describe your symptoms..."
                                                                                    value={notes}
                                                                                    onChange={(e) => setNotes(e.target.value)}
                                                                             ></textarea>
                                                                      </div>
                                                                      <button
                                                                             onClick={() => setShowModal(true)}
                                                                             className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all"
                                                                      >
                                                                             Secure Booking
                                                                      </button>
                                                               </div>
                                                        )}
                                                 </div>
                                          </div>
                                   </div>
                            </div>

                            {/* Reviews Section */}
                            <div className="lg:col-span-2 space-y-10">
                                   <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                                          <div className="flex justify-between items-center mb-8">
                                                 <h3 className="text-2xl font-extrabold text-gray-900">Patient Experiences</h3>
                                                 <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-2xl">
                                                        <span className="text-indigo-600 font-extrabold">{doctor.rating}</span>
                                                        <div className="flex text-yellow-400">
                                                               {[...Array(5)].map((_, i) => (
                                                                      <svg key={i} className={`w-3 h-3 ${i < Math.floor(doctor.rating) ? 'fill-current' : 'text-gray-200 fill-current'}`} viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                                               ))}
                                                        </div>
                                                 </div>
                                          </div>

                                          {reviews.length > 0 ? (
                                                 <div className="space-y-6">
                                                        {reviews.map(review => (
                                                               <ReviewCard key={review.id} review={review} />
                                                        ))}
                                                 </div>
                                          ) : (
                                                 <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                                                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                                                               <svg className="w-8 h-8 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
                                                        </div>
                                                        <h4 className="font-bold text-gray-400">Pioneer of Care</h4>
                                                        <p className="text-sm text-gray-400 mt-1">Be the first to share your experience with Dr. {doctor.name.split(' ').pop()}</p>
                                                 </div>
                                          )}
                                   </div>
                            </div>
                     </div>

                     {/* Confirmation Modal */}
                     {showModal && (
                            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                                   <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 animate-in fade-in zoom-in duration-200 border border-gray-100">
                                          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6">
                                                 <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                          </div>
                                          <h3 className="text-2xl font-extrabold text-gray-900 mb-2">Confirm Booking?</h3>
                                          <p className="text-gray-500 text-sm mb-6">Please review your appointment details before proceeding to payment.</p>
                                          
                                          <div className="space-y-4 bg-gray-50 p-6 rounded-2xl border border-gray-100 mb-6">
                                                 <div className="flex justify-between items-center text-sm">
                                                        <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Date</span>
                                                        <span className="text-gray-900 font-bold">{selectedDate}</span>
                                                 </div>
                                                 <div className="flex justify-between items-center text-sm">
                                                        <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Time</span>
                                                        <span className="text-gray-900 font-bold">{selectedSlot.substring(0, 5)}</span>
                                                 </div>
                                                 {isRecurring && (
                                                        <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-200">
                                                               <span className="text-indigo-600 font-bold uppercase tracking-wider text-[10px]">Recurring</span>
                                                               <span className="text-indigo-600 font-bold">{recurrenceCount} Sessions ({recurrencePattern})</span>
                                                        </div>
                                                 )}
                                                 <div className="flex justify-between items-center text-sm pt-4 border-t border-gray-200">
                                                        <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Base Fee</span>
                                                        <span className="text-gray-900 font-bold text-base">₹{isRecurring ? doctor.fees * recurrenceCount : doctor.fees}</span>
                                                 </div>
                                          </div>

                                           <div className="space-y-3 mb-8">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Have a Coupon?</label>
                                                    <div className="flex gap-2">
                                                        <input 
                                                            type="text" 
                                                            placeholder="CODE123" 
                                                            value={couponCode}
                                                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                                            className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold"
                                                        />
                                                        <button 
                                                            onClick={async () => {
                                                                if (!couponCode) return;
                                                                setValidatingCoupon(true);
                                                                try {
                                                                    const { data } = await api.get(`/coupons/validate?code=${couponCode}&doctorId=${id}&amount=${doctor.fees}`);
                                                                    setAppliedCoupon(data);
                                                                    toast.success('Coupon applied!');
                                                                } catch (err) {
                                                                    toast.error(err.response?.data?.error || 'Invalid coupon');
                                                                    setAppliedCoupon(null);
                                                                } finally {
                                                                    setValidatingCoupon(false);
                                                                }
                                                            }}
                                                            disabled={validatingCoupon}
                                                            className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-all border border-indigo-200"
                                                        >
                                                            {validatingCoupon ? '...' : 'Apply'}
                                                        </button>
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Insurance ID (Optional)</label>
                                                    <input 
                                                        type="text" 
                                                        placeholder="POL-000-XX" 
                                                        value={insurancePolicy}
                                                        onChange={(e) => setInsurancePolicy(e.target.value)}
                                                        className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium"
                                                    />
                                                    <p className="text-[9px] text-gray-400 mt-1 ml-1 leading-tight">We will process your claim automatically after the consultation.</p>
                                                </div>
                                           </div>

                                          <div className="flex flex-col gap-3">
                                                 <button
                                                        disabled={booking}
                                                        onClick={handleBooking}
                                                        className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50"
                                                 >
                                                        {booking ? (
                                                               <div className="flex items-center justify-center gap-2">
                                                                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                                      <span>Processing...</span>
                                                               </div>
                                                        ) : 'Proceed to Payment'}
                                                 </button>
                                                 <button
                                                        onClick={() => setShowModal(false)}
                                                        className="w-full bg-gray-100 text-gray-700 py-4 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                                                 >
                                                        Go Back
                                                 </button>
                                          </div>
                                   </div>
                            </div>
                     )}

                     {/* Waitlist Modal */}
                     {showWaitlistModal && (
                            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                                   <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 animate-in fade-in zoom-in duration-200 border border-gray-100">
                                          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
                                                 <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                          </div>
                                          <h3 className="text-2xl font-extrabold text-gray-900 mb-2">Join Waitlist?</h3>
                                          <p className="text-gray-500 text-sm mb-6">We'll notify you automatically if a slot opens up for <span className="font-bold text-gray-800">{selectedDate}</span>.</p>
                                          
                                          <div className="space-y-4 mb-8">
                                                 <div className="flex items-center justify-between bg-red-50 p-4 rounded-2xl border border-red-100">
                                                        <div>
                                                               <p className="text-xs font-bold text-red-900 border-red-900">Urgent Request?</p>
                                                               <p className="text-[10px] text-red-600 font-medium">Bumps you up in the queue</p>
                                                        </div>
                                                        <button 
                                                               onClick={() => setIsUrgent(!isUrgent)}
                                                               className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isUrgent ? 'bg-red-500' : 'bg-gray-200'}`}
                                                        >
                                                               <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isUrgent ? 'translate-x-6' : 'translate-x-1'}`} />
                                                        </button>
                                                 </div>
                                                 <div>
                                                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Waitlist Notes</label>
                                                        <textarea
                                                               className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
                                                               rows="3"
                                                               placeholder="Optional: Any specific time preference?"
                                                               value={waitlistNotes}
                                                               onChange={(e) => setWaitlistNotes(e.target.value)}
                                                        ></textarea>
                                                 </div>
                                           </div>

                                          <div className="flex flex-col gap-3">
                                                 <button
                                                        onClick={handleJoinWaitlist}
                                                        className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-xl shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all"
                                                 >
                                                        Confirm Waitlist
                                                 </button>
                                                 <button
                                                        onClick={() => setShowWaitlistModal(false)}
                                                        className="w-full bg-gray-100 text-gray-700 py-4 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                                                 >
                                                        Cancel
                                                 </button>
                                          </div>
                                   </div>
                            </div>
                     )}
              </div>
       );
};

export default DoctorProfile;
