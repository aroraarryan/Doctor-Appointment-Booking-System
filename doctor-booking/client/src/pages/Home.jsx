import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const Home = () => {
       const [featuredDoctors, setFeaturedDoctors] = useState([]);
       const [latestReviews, setLatestReviews] = useState([]);
       const [loading, setLoading] = useState(true);
       const navigate = useNavigate();

       useEffect(() => {
              const fetchData = async () => {
                     try {
                            const [featRes, revRes] = await Promise.all([
                                   api.get('/doctors/featured'),
                                   api.get('/doctors/reviews/latest')
                            ]);
                            setFeaturedDoctors(featRes.data);
                            setLatestReviews(revRes.data);
                     } catch (error) {
                            console.error('Home fetchData error:', error);
                     } finally {
                            setLoading(false);
                     }
              };
              fetchData();
       }, []);

       return (
              <div className="space-y-24 pb-24">
                     {/* Hero Section */}
                     <section className="relative min-h-[500px] md:h-[600px] flex items-center overflow-hidden rounded-[2rem] md:rounded-[40px] bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800">
                            <div className="absolute inset-0 opacity-20">
                                   <div className="absolute top-0 -left-20 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl animate-blob"></div>
                                   <div className="absolute top-0 -right-20 w-96 h-96 bg-indigo-300 rounded-full mix-blend-overlay filter blur-3xl animate-blob animation-delay-2000"></div>
                                   <div className="absolute -bottom-20 left-40 w-96 h-96 bg-purple-400 rounded-full mix-blend-overlay filter blur-3xl animate-blob animation-delay-4000"></div>
                            </div>

                            <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-8 grid md:grid-cols-2 gap-8 md:gap-12 items-center py-20 md:py-0">
                                   <div className="text-white space-y-6 md:space-y-8 text-center md:text-left">
                                          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
                                                 <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                                 <span className="text-xs md:text-sm font-bold tracking-wide">Available 24/7 for you</span>
                                          </div>
                                          <h1 className="text-4xl md:text-6xl font-black leading-tight tracking-tight">
                                                 Healthcare That <br />
                                                 <span className="text-indigo-200">Moves With You.</span>
                                          </h1>
                                          <p className="text-indigo-100 text-lg md:text-xl font-medium max-w-lg leading-relaxed mx-auto md:mx-0">
                                                 Book appointments with India's most trusted specialists. Verified professionals, seamless booking, and expert care.
                                          </p>
                                          <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-6 pt-4">
                                                 <button
                                                        onClick={() => navigate('/doctors')}
                                                        className="w-full sm:w-auto px-8 py-4 bg-white text-indigo-600 rounded-2xl font-black text-lg shadow-2xl shadow-indigo-900/40 hover:scale-105 transition-transform"
                                                 >
                                                        Find a Specialist
                                                 </button>
                                                 <Link to="/register?role=doctor" className="text-white font-bold hover:underline underline-offset-8 text-sm">
                                                        Are you a doctor? Join us
                                                 </Link>
                                          </div>
                                   </div>
                            </div>
                     </section>

                     {/* Featured Specialists */}
                     {featuredDoctors.length > 0 && (
                            <section className="max-w-7xl mx-auto px-4">
                                   <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 md:mb-12">
                                          <div>
                                                 <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">Top-Rated Specialists</h2>
                                                 <p className="text-gray-500 mt-2 font-medium text-sm md:text-base">Exceptional care from our highly recommended professionals.</p>
                                          </div>
                                          <button
                                                 onClick={() => navigate('/doctors')}
                                                 className="bg-gray-100 text-gray-900 px-6 py-3 rounded-2xl font-bold hover:bg-gray-200 transition-colors flex items-center gap-2"
                                          >
                                                 View All Doctors
                                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                                          </button>
                                   </div>

                                   <div className="flex overflow-x-auto gap-6 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:gap-8 pb-8 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0 scroll-smooth">
                                          {featuredDoctors.slice(0, 4).map(doctor => (
                                                 <div
                                                        key={doctor.id}
                                                        onClick={() => navigate(`/doctors/${doctor.id}`)}
                                                        className="flex-none w-[280px] md:w-auto bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-100 transition-all cursor-pointer transform md:hover:-translate-y-2"
                                                 >
                                                        <div className="relative mb-6">
                                                               <div className="aspect-square bg-gray-50 rounded-2xl overflow-hidden">
                                                                      {doctor.avatar_url ? (
                                                                             <img src={doctor.avatar_url} alt={doctor.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                                      ) : (
                                                                             <div className="w-full h-full flex items-center justify-center text-4xl font-black text-gray-200">
                                                                                    {doctor.name.charAt(0)}
                                                                             </div>
                                                                      )}
                                                               </div>
                                                               <div className="absolute -bottom-3 -right-3 bg-white p-2 rounded-full shadow-lg">
                                                                      <div className="bg-indigo-600 text-white p-1 rounded-full">
                                                                             <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" /></svg>
                                                                      </div>
                                                               </div>
                                                        </div>
                                                        <h3 className="text-xl font-black text-gray-900 group-hover:text-indigo-600 transition-colors">Dr. {doctor.name}</h3>
                                                        <p className="text-indigo-600 font-bold text-xs uppercase tracking-widest mt-1">{doctor.specialty}</p>

                                                        <div className="mt-4 flex items-center justify-between py-4 border-t border-gray-50 group-hover:border-indigo-50 transition-colors">
                                                               <div className="flex items-center gap-1">
                                                                      <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                                                      <span className="text-sm font-black text-gray-700">{doctor.rating}</span>
                                                               </div>
                                                               <span className="text-gray-900 font-black">₹{doctor.fees}</span>
                                                        </div>
                                                 </div>
                                          ))}
                                   </div>
                            </section>
                     )}

                     {/* Why Choose Us */}
                     <section className="bg-gray-50/50 py-16 md:py-24 rounded-[2rem] md:rounded-[40px] px-4">
                            <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-6 md:gap-12">
                                   <div className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[32px] shadow-sm border border-gray-100 hover:shadow-xl transition-all">
                                          <div className="w-12 md:w-14 h-12 md:h-14 bg-blue-100 text-blue-600 rounded-xl md:rounded-2xl flex items-center justify-center mb-6 md:mb-8">
                                                 <svg className="w-6 md:w-8 h-6 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                          </div>
                                          <h4 className="text-lg md:text-xl font-black text-gray-900 mb-3 md:mb-4">Verified Experts</h4>
                                          <p className="text-gray-500 font-medium leading-relaxed text-sm md:text-base">Every doctor on our platform goes through a multi-stage background and credential check.</p>
                                   </div>
                                   <div className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[32px] shadow-sm border border-gray-100 hover:shadow-xl transition-all">
                                          <div className="w-12 md:w-14 h-12 md:h-14 bg-indigo-100 text-indigo-600 rounded-xl md:rounded-2xl flex items-center justify-center mb-6 md:mb-8">
                                                 <svg className="w-6 md:w-8 h-6 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                          </div>
                                          <h4 className="text-lg md:text-xl font-black text-gray-900 mb-3 md:mb-4">Instant Booking</h4>
                                          <p className="text-gray-500 font-medium leading-relaxed text-sm md:text-base">No more waiting in queues. Choose your slot and get confirmed within seconds, 24/7.</p>
                                   </div>
                                   <div className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[32px] shadow-sm border border-gray-100 hover:shadow-xl transition-all">
                                          <div className="w-12 md:w-14 h-12 md:h-14 bg-purple-100 text-purple-600 rounded-xl md:rounded-2xl flex items-center justify-center mb-6 md:mb-8">
                                                 <svg className="w-6 md:w-8 h-6 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>
                                          </div>
                                          <h4 className="text-lg md:text-xl font-black text-gray-900 mb-3 md:mb-4">Secure Messaging</h4>
                                          <p className="text-gray-500 font-medium leading-relaxed text-sm md:text-base">Chat with your doctors securely before and after appointments for seamless care coordination.</p>
                                   </div>
                            </div>
                     </section>

                     {/* Latest Reviews (Social Proof) */}
                     {latestReviews.length > 0 && (
                            <section className="max-w-7xl mx-auto px-4 overflow-hidden">
                                   <div className="text-center mb-12 md:mb-16">
                                          <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">Patient Experiences</h2>
                                          <p className="text-gray-500 mt-2 font-medium text-sm md:text-base">Real stories from real patients about our specialists.</p>
                                   </div>

                                   <div className="flex overflow-x-auto gap-6 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-8 pb-8 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0 scroll-smooth">
                                          {latestReviews.map(review => (
                                                 <div key={review.id} className="flex-none w-[300px] md:w-auto bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[32px] border border-gray-100 shadow-sm flex flex-col h-full hover:shadow-xl transition-all border-b-4 border-b-indigo-500">
                                                        <div className="flex items-center gap-2 mb-6">
                                                               {[...Array(5)].map((_, i) => (
                                                                      <svg key={i} className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                                                                             <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                                      </svg>
                                                               ))}
                                                        </div>
                                                        <p className="text-gray-700 font-medium italic relative z-10 before:content-['“'] before:text-5xl before:text-indigo-100 before:absolute before:-top-4 before:-left-2 overflow-hidden flex-grow line-clamp-4">
                                                               {review.comment}
                                                        </p>
                                                        <div className="mt-8 pt-6 border-t border-gray-50 flex items-center justify-between">
                                                               <div className="flex items-center gap-3">
                                                                      <div className="w-10 h-10 bg-indigo-50 rounded-full overflow-hidden flex items-center justify-center font-bold text-indigo-600">
                                                                             {review.patient_avatar ? <img src={review.patient_avatar} alt="" className="w-full h-full object-cover" /> : review.patient_name.charAt(0)}
                                                                      </div>
                                                                      <div>
                                                                             <p className="text-sm font-black text-gray-900">{review.patient_name}</p>
                                                                             <p className="text-xs text-gray-400 font-bold">Patient</p>
                                                                      </div>
                                                               </div>
                                                               <div className="text-right">
                                                                      <p className="text-[10px] uppercase font-black tracking-widest text-indigo-500">Reviewed</p>
                                                                      <p className="text-xs font-black text-gray-900">Dr. {review.doctor_name}</p>
                                                               </div>
                                                        </div>
                                                 </div>
                                          ))}
                                   </div>
                            </section>
                     )}

                     {/* Newsletter/CTA */}
                     <section className="px-4">
                            <div className="max-w-5xl mx-auto bg-gray-900 rounded-[2rem] md:rounded-[40px] p-10 md:p-16 text-center text-white relative overflow-hidden">
                                   <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600 rounded-full filter blur-[100px] opacity-20 -mr-32 -mt-32"></div>
                                   <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600 rounded-full filter blur-[100px] opacity-20 -ml-32 -mb-32"></div>

                                   <h2 className="text-3xl md:text-4xl font-black mb-6">Ready to improve your health?</h2>
                                   <p className="text-gray-400 text-base md:text-lg max-w-xl mx-auto mb-10 font-medium leading-relaxed px-4 md:px-0">Join thousands of patients who get high-quality healthcare delivered at their convenience.</p>
                                   <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                          <button
                                                 onClick={() => navigate('/doctors')}
                                                 className="w-full sm:w-auto px-10 py-4 md:py-5 bg-indigo-600 rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-900/40"
                                          >
                                                 Find a Doctor Now
                                          </button>
                                          <button className="w-full sm:w-auto px-10 py-4 md:py-5 bg-white/5 border border-white/10 rounded-2xl font-black hover:bg-white/10 transition-all">
                                                 Learn More
                                          </button>
                                   </div>
                            </div>
                     </section>
              </div>
       );
};

export default Home;
