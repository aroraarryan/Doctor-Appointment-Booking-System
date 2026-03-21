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

       if (loading) {
              return (
                     <div className="min-h-screen flex items-center justify-center bg-cream">
                            <div className="w-12 h-12 border-4 border-forest/10 border-t-forest rounded-full animate-spin"></div>
                     </div>
              );
       }

       return (
              <div className="space-y-24 pb-32 bg-cream">
                     {/* Hero Section */}
                     <section className="section-padding grid md:grid-cols-2 gap-16 items-center min-h-[90vh] relative overflow-hidden">
                            <div className="space-y-12 order-2 md:order-1 relative z-10">
                                   <div className="inline-flex items-center gap-3 px-5 py-2 bg-forest/5 rounded-full animate-fade-in">
                                          <span className="w-2 h-2 bg-accent-lime rounded-full scale-110 animate-pulse"></span>
                                          <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-forest/60">Healthcare of Tomorrow</span>
                                   </div>
                                   <div className="space-y-6">
                                          <h1 className="text-6xl md:text-[7rem] leading-[0.9] text-forest font-serif lowercase">
                                                 Find your <br />
                                                 <span className="italic text-forest/40">wellness path.</span>
                                          </h1>
                                          <p className="text-lg md:text-xl text-forest/50 max-w-lg leading-relaxed font-light">
                                                 Curova reimagines the medical experience. Connect with Distinguished specialists in an environment designed for your serenity.
                                          </p>
                                   </div>
                                   <div className="flex flex-col sm:flex-row items-center gap-12 pt-8">
                                          <Link to="/doctors" className="flex items-center text-forest/70 font-medium hover:text-forest transition-all group tracking-[0.2em] uppercase text-xs">
                                                 Request a demo
                                                 <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                                          </Link>
                                          <button
                                                 onClick={() => navigate('/doctors')}
                                                 className="btn-primary"
                                          >
                                                 Book Consultation
                                                 <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                                          </button>
                                   </div>
                            </div>

                            <div className="order-1 md:order-2 relative h-[600px] flex items-center justify-center">
                                   {/* Floating Composition */}
                                   <div className="relative w-full h-full max-w-[500px]">
                                          {/* Main Center Card */}
                                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 glass-card rounded-[3rem] z-20 flex items-center justify-center animate-float-slow p-8">
                                                 <div className="w-full h-full bg-forest rounded-[2.5rem] flex items-center justify-center text-accent-lime">
                                                        <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                                        </svg>
                                                 </div>
                                          </div>

                                          {/* Portrait 1 - Top Left */}
                                          <div className="absolute top-0 left-0 w-48 h-48 rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white/50 animate-float z-10 rotate-[-5deg]">
                                                 <img src="/assets/doctor_1.png" alt="" className="w-full h-full object-cover" />
                                          </div>

                                          {/* Portrait 2 - Top Right */}
                                          <div className="absolute top-12 right-0 w-40 h-40 rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white/50 animate-float-delayed z-10 rotate-[8deg]">
                                                 <img src="/assets/doctor_2.png" alt="" className="w-full h-full object-cover" />
                                          </div>

                                          {/* Portrait 3 - Bottom Left */}
                                          <div className="absolute bottom-12 left-8 w-44 h-44 rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white/50 animate-float-slow z-30 rotate-[4deg]">
                                                 <img src="/assets/doctor_3.png" alt="" className="w-full h-full object-cover" />
                                          </div>


                                          {/* Info Pills */}
                                          <div className="absolute top-[20%] right-[-10%] bg-white/80 backdrop-blur-md px-6 py-2 rounded-full shadow-lg border border-forest/5 z-40 animate-float-delayed">
                                                 <p className="text-[10px] font-bold text-forest tracking-widest uppercase">Expert Diagnostics</p>
                                          </div>

                                          <div className="absolute bottom-[20%] left-[-15%] bg-white/80 backdrop-blur-md px-6 py-2 rounded-full shadow-lg border border-forest/5 z-40 animate-float">
                                                 <p className="text-[10px] font-bold text-forest tracking-widest uppercase">24/7 Virtual Care</p>
                                          </div>

                                          <div className="absolute top-[8%] left-[160px] bg-white/80 backdrop-blur-md px-6 py-2 rounded-full shadow-lg border border-forest/5 z-40 animate-float-slow">
                                                 <p className="text-[10px] font-bold text-forest tracking-widest uppercase">Verified Specialist</p>
                                          </div>
                                          {/* Decorative Dots */}
                                          <div className="absolute top-[40%] left-0 w-4 h-4 bg-accent-lime rounded-full blur-sm opacity-50 animate-pulse"></div>
                                          <div className="absolute bottom-0 right-[20%] w-6 h-6 bg-forest rounded-full blur-md opacity-20 animate-pulse"></div>
                                          <div className="absolute top-10 right-20 w-3 h-3 bg-accent-lime rounded-full opacity-60"></div>
                                   </div>
                            </div>
                     </section>

                     {/* Vision Statement */}
                     <section className="bg-forest text-cream py-40 overflow-hidden relative rounded-[4rem] mx-4 md:mx-8">
                            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent-lime/5 blur-[120px] rounded-full"></div>
                            <div className="max-w-4xl mx-auto px-6 text-center space-y-16 relative z-10">
                                   <h2 className="text-3xl md:text-5xl font-light leading-snug font-serif lowercase italic opacity-90">
                                          "We believe healthcare should be as calm as it is effective. Our platform bridges the gap between premium care and patient comfort."
                                   </h2>
                                   <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-accent-lime/60 pt-8">
                                          <div className="space-y-2">
                                                 <p className="text-5xl font-serif text-cream">500+</p>
                                                 <p className="text-[10px] uppercase tracking-[0.3em] font-bold opacity-50">Verified Doctors</p>
                                          </div>
                                          <div className="space-y-2 border-y md:border-y-0 md:border-x border-cream/10 py-8 md:py-0">
                                                 <p className="text-5xl font-serif text-cream">98%</p>
                                                 <p className="text-[10px] uppercase tracking-[0.3em] font-bold opacity-50">Satisfaction Rate</p>
                                          </div>
                                          <div className="space-y-2">
                                                 <p className="text-5xl font-serif text-cream">24h</p>
                                                 <p className="text-[10px] uppercase tracking-[0.3em] font-bold opacity-50">Priority Care</p>
                                          </div>
                                   </div>
                            </div>
                     </section>

                     {/* Featured Specialists */}
                     {featuredDoctors.length > 0 && (
                            <section className="section-padding">
                                   <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-24">
                                          <div className="space-y-6">
                                                 <h2 className="text-5xl md:text-7xl text-forest font-serif lowercase">Distinguished <br /><span className="italic opacity-60">specialists.</span></h2>
                                                 <p className="text-forest/40 font-light max-w-sm text-lg">The most sought-after medical minds, available at your digital doorstep.</p>
                                          </div>
                                          <button
                                                 onClick={() => navigate('/doctors')}
                                                 className="btn-secondary"
                                          >
                                                 Discover All
                                          </button>
                                   </div>

                                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                                          {featuredDoctors.slice(0, 4).map(doctor => (
                                                 <div
                                                        key={doctor.id}
                                                        onClick={() => navigate(`/doctors/${doctor.id}`)}
                                                        className="group cursor-pointer space-y-6"
                                                 >
                                                        <div className="aspect-[3/4] rounded-[2.5rem] overflow-hidden bg-forest/5 relative border border-forest/5">
                                                               {doctor.avatar_url ? (
                                                                      <img src={doctor.avatar_url} alt={doctor.name} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-all duration-700 scale-100 group-hover:scale-105" />
                                                               ) : (
                                                                      <div className="w-full h-full flex items-center justify-center text-5xl font-serif text-forest/5 italic">
                                                                             {doctor.name.charAt(0)}
                                                                      </div>
                                                               )}
                                                               <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-forest/80 via-forest/40 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-700">
                                                                      <p className="text-cream text-[10px] uppercase font-bold tracking-[0.3em]">Book Slot</p>
                                                               </div>
                                                        </div>
                                                        <div className="px-2">
                                                               <h3 className="text-2xl text-forest font-serif lowercase">Dr. {doctor.name}</h3>
                                                               <p className="text-forest/30 text-[10px] uppercase tracking-[0.2em] mt-2 font-bold">{doctor.specialty}</p>
                                                               <div className="flex items-center justify-between mt-6 pt-6 border-t border-forest/5">
                                                                      <span className="text-sm font-light text-forest/60 italic lowercase">From ₹{doctor.fees}</span>
                                                                      <div className="flex items-center gap-1.5 text-accent-lime">
                                                                             <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                                                             <span className="text-xs font-bold text-forest">{doctor.rating}</span>
                                                                      </div>
                                                               </div>
                                                        </div>
                                                 </div>
                                          ))}
                                   </div>
                            </section>
                     )}

                     {/* Why Choose Us */}
                     <section className="section-padding bg-white rounded-[5rem] mx-4 md:mx-8 shadow-sm py-32 border border-forest/5">
                            <div className="grid md:grid-cols-3 gap-20 px-8">
                                   <div className="space-y-8 group">
                                          <div className="w-14 h-14 rounded-2xl bg-cream border border-forest/10 flex items-center justify-center text-forest group-hover:-translate-y-1 transition-transform">
                                                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                          </div>
                                          <div className="space-y-4">
                                                 <h3 className="text-2xl font-serif text-forest lowercase">Verified excellence</h3>
                                                 <p className="text-forest/40 font-light leading-relaxed">Every professional is meticulously vetted to ensure only the most distinguished specialists serve your needs.</p>
                                          </div>
                                   </div>
                                   <div className="space-y-8 group">
                                          <div className="w-14 h-14 rounded-2xl bg-cream border border-forest/10 flex items-center justify-center text-forest group-hover:-translate-y-1 transition-transform">
                                                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                          </div>
                                          <div className="space-y-4">
                                                 <h3 className="text-2xl font-serif text-forest lowercase">Seamless digital care</h3>
                                                 <p className="text-forest/40 font-light leading-relaxed">Book slots instantly across devices. No waiting rooms, no queues. Just the care you deserve, when you need it.</p>
                                          </div>
                                   </div>
                                   <div className="space-y-8 group">
                                          <div className="w-14 h-14 rounded-2xl bg-cream border border-forest/10 flex items-center justify-center text-forest group-hover:-translate-y-1 transition-transform">
                                                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                          </div>
                                          <div className="space-y-4">
                                                 <h3 className="text-2xl font-serif text-forest lowercase">Uncompromising privacy</h3>
                                                 <p className="text-forest/40 font-light leading-relaxed">Advanced encryption for all your medical records and direct communication with your healthcare team.</p>
                                          </div>
                                   </div>
                            </div>
                     </section>

                     {/* Patient Experiences */}
                     {latestReviews.length > 0 && (
                            <section className="section-padding overflow-hidden">
                                   <div className="text-center mb-32 space-y-6">
                                          <h2 className="text-5xl md:text-8xl text-forest font-serif lowercase">Voices of <span className="italic opacity-60">trust.</span></h2>
                                          <p className="text-forest/40 font-light tracking-[0.2em] uppercase text-xs">Authentic experiences from our community</p>
                                   </div>
                                   <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
                                          {latestReviews.map(review => (
                                                 <div key={review.id} className="space-y-10">
                                                        <div className="flex gap-1.5 text-accent-lime/30">
                                                               {[...Array(5)].map((_, i) => (
                                                                      <svg key={i} className={`w-3 h-3 ${i < review.rating ? 'text-accent-lime' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                                                                             <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                                      </svg>
                                                               ))}
                                                        </div>
                                                        <p className="text-2xl text-forest font-serif lowercase italic opacity-80 leading-[1.6]">
                                                               "{review.comment.length > 150 ? review.comment.substring(0, 150) + '...' : review.comment}"
                                                        </p>
                                                        <div className="flex items-center gap-5 pt-4 border-t border-forest/5">
                                                               <div className="w-12 h-12 bg-forest/5 rounded-full overflow-hidden flex items-center justify-center font-bold text-forest italic font-serif text-lg">
                                                                      {review.patient_avatar ? <img src={review.patient_avatar} alt="" className="w-full h-full object-cover" /> : review.patient_name.charAt(0)}
                                                               </div>
                                                               <div>
                                                                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-forest">{review.patient_name}</p>
                                                                      <p className="text-[9px] text-forest/30 uppercase tracking-[0.1em] mt-1">Consulted Dr. {review.doctor_name}</p>
                                                               </div>
                                                        </div>
                                                 </div>
                                          ))}
                                   </div>
                            </section>
                     )}

                     {/* FAQ Section */}
                     <section className="section-padding bg-forest/5 rounded-[4rem] mx-4 md:mx-8">
                            <div className="grid md:grid-cols-2 gap-32 items-start py-12">
                                   <div className="sticky top-32 space-y-8">
                                          <h2 className="text-5xl text-forest lowercase font-serif leading-tight">Common <br />inquiries <br /><span className="italic opacity-40">regarding our practice.</span></h2>
                                          <p className="text-forest/50 font-light max-w-xs">Everything you need to know about the Curova experience.</p>
                                   </div>
                                   <div className="space-y-20 pt-4">
                                          <div className="space-y-6">
                                                 <h4 className="text-xl text-forest font-serif lowercase font-medium">How are specialists verified?</h4>
                                                 <p className="text-forest/50 font-light leading-relaxed text-lg">Every doctor undergoes a rigorous 5-step verification process including credentialing, peer review, and site inspections to ensure the highest standard of care.</p>
                                          </div>
                                          <div className="space-y-6">
                                                 <h4 className="text-xl text-forest font-serif lowercase font-medium">Can I reschedule an appointment?</h4>
                                                 <p className="text-forest/50 font-light leading-relaxed text-lg">Yes, patient flexibility is our priority. You can reschedule up to 12 hours before your slot directly from your patient dashboard without any penalties.</p>
                                          </div>
                                          <div className="space-y-6">
                                                 <h4 className="text-xl text-forest font-serif lowercase font-medium">Is my medical data secure?</h4>
                                                 <p className="text-forest/50 font-light leading-relaxed text-lg">We use bank-grade AES-256 encryption for all data at rest and TLS 1.3 for all data in transit, ensuring your health records remain strictly private.</p>
                                          </div>
                                   </div>
                            </div>
                     </section>

                     {/* Final CTA */}
                     <section className="section-padding text-center space-y-16 pb-48">
                            <p className="text-accent-lime font-bold uppercase tracking-[0.4em] text-[10px]">Experience the difference</p>
                            <h2 className="text-6xl md:text-9xl text-forest max-w-6xl mx-auto leading-[0.9] font-serif lowercase">
                                   Ready to prioritize your care <br /> <span className="italic opacity-40">in a new light?</span>
                            </h2>
                            <div className="pt-12">
                                   <button
                                          onClick={() => navigate('/doctors')}
                                          className="btn-primary px-12 py-5 text-xs shadow-2xl"
                                   >
                                          Secure Your First Slot
                                   </button>
                            </div>
                     </section>
              </div>
       );
};

export default Home;
