import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import SkeletonCard from '../components/SkeletonCard';

const Doctors = () => {
       const [doctors, setDoctors] = useState([]);
       const [featuredDoctors, setFeaturedDoctors] = useState([]);
       const [specialties, setSpecialties] = useState([]);
       const [loading, setLoading] = useState(true);
       const [featuredLoading, setFeaturedLoading] = useState(true);
       const [userLocation, setUserLocation] = useState(null);
       const [filters, setFilters] = useState({
              search: '',
              specialty: '',
              min_fee: '',
              max_fee: '',
              sort: 'rating',
              city: '',
              verified: false,
              featured: false,
              nearby: false
       });
       const navigate = useNavigate();

       const fetchDoctors = useCallback(async () => {
              try {
                     setLoading(true);
                     const params = { ...filters };
                     if (filters.nearby && userLocation) {
                            params.lat = userLocation.lat;
                            params.lng = userLocation.lng;
                     }
                     const { data } = await api.get('/doctors', { params });
                     setDoctors(data);
              } catch (error) {
                     console.error('Fetch doctors error:', error);
              } finally {
                     setLoading(false);
              }
       }, [filters, userLocation]);

       useEffect(() => {
              const fetchSpecialties = async () => {
                     try {
                            const { data } = await api.get('/doctors/specialties');
                            setSpecialties(data);
                     } catch (error) {
                            console.error('Fetch specialties error:', error);
                     }
              };

              const fetchFeatured = async () => {
                     try {
                            const { data } = await api.get('/doctors/featured');
                            setFeaturedDoctors(data);
                     } catch (error) {
                            console.error('Fetch featured error:', error);
                     } finally {
                            setFeaturedLoading(false);
                     }
              };

              fetchSpecialties();
              fetchFeatured();
       }, []);

       useEffect(() => {
              const timer = setTimeout(() => {
                     fetchDoctors();
              }, 400);
              return () => clearTimeout(timer);
       }, [fetchDoctors]);

       const handleFilterChange = (e) => {
              const { name, value, type, checked } = e.target;
              setFilters(prev => ({
                     ...prev,
                     [name]: type === 'checkbox' ? checked : value
              }));
       };

       const handleNearbyToggle = () => {
              if (!filters.nearby) {
                     if ("geolocation" in navigator) {
                            navigator.geolocation.getCurrentPosition((position) => {
                                   setUserLocation({
                                          lat: position.coords.latitude,
                                          lng: position.coords.longitude
                                   });
                                   setFilters(prev => ({ ...prev, nearby: true, sort: 'nearby' }));
                            }, (error) => {
                                   console.error("Geo error:", error);
                                   toast.error("Could not get your location. Please enable location permissions.");
                            });
                     } else {
                            toast.error("Geolocation is not supported by your browser.");
                     }
              } else {
                     setFilters(prev => ({ ...prev, nearby: false, sort: 'rating' }));
              }
       };

       return (
              <div className="max-w-7xl mx-auto space-y-12 pb-20">
                     {/* Header Section */}
                     <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
                            <div>
                                   <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Find Specialists</h1>
                                   <p className="text-gray-500 mt-2 font-medium">Book appointments with top-rated medical professionals in your area.</p>
                            </div>
                            <div className="flex items-center gap-4 bg-gray-100/50 p-2 rounded-2xl border border-gray-100">
                                   <button
                                          onClick={() => setFilters({ ...filters, sort: 'rating' })}
                                          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${filters.sort === 'rating' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500'}`}
                                   >
                                          Top Rated
                                   </button>
                                   <button
                                          onClick={() => setFilters({ ...filters, sort: 'fees' })}
                                          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${filters.sort === 'fees' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500'}`}
                                   >
                                          Lowest Fee
                                   </button>
                                   <button
                                          onClick={() => setFilters({ ...filters, sort: 'experience' })}
                                          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${filters.sort === 'experience' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500'}`}
                                   >
                                          Experience
                                   </button>
                            </div>
                     </div>

                     {/* Featured Section */}
                     {featuredDoctors.length > 0 && (
                            <div className="px-4">
                                   <div className="flex items-center justify-between mb-8">
                                          <div className="flex items-center gap-3">
                                                 <div className="w-2 h-8 bg-indigo-600 rounded-full"></div>
                                                 <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                                                        Featured Specialists
                                                        <span className="bg-indigo-100 text-indigo-700 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-widest font-extrabold animate-pulse">Expert Pick</span>
                                                 </h2>
                                          </div>
                                   </div>

                                   <div className="flex overflow-x-auto gap-8 pb-8 no-scrollbar -mx-4 px-4 scroll-smooth">
                                          {featuredDoctors.map(doctor => (
                                                 <div
                                                        key={doctor.id}
                                                        onClick={() => navigate(`/doctors/${doctor.id}`)}
                                                        className="flex-none w-[340px] bg-white rounded-3xl border border-indigo-100 p-8 shadow-sm hover:shadow-2xl hover:shadow-indigo-100 transition-all cursor-pointer group relative overflow-hidden"
                                                 >
                                                        <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                                                               <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                                                        </div>

                                                        <div className="flex items-center gap-6 mb-8 relative z-10">
                                                               <div className="relative">
                                                                      <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 p-1 rounded-2xl">
                                                                             <div className="w-full h-full bg-white rounded-2xl overflow-hidden shadow-inner flex items-center justify-center font-bold text-3xl text-indigo-600">
                                                                                    {doctor.avatar_url ? (
                                                                                           <img src={doctor.avatar_url} alt={doctor.name} className="w-full h-full object-cover" />
                                                                                    ) : doctor.name.charAt(0)}
                                                                             </div>
                                                                      </div>
                                                                      <div className="absolute -bottom-2 -right-2 bg-blue-500 text-white p-1 rounded-full border-4 border-white shadow-lg">
                                                                             <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                                                    <path d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                                                                             </svg>
                                                                      </div>
                                                               </div>
                                                               <div>
                                                                      <h3 className="text-xl font-extrabold text-gray-900 group-hover:text-indigo-600 transition-colors">Dr. {doctor.name}</h3>
                                                                      <p className="text-indigo-600 font-bold text-sm tracking-wide">{doctor.specialty}</p>
                                                               </div>
                                                        </div>
                                                        <div className="space-y-4 mb-6">
                                                               <div className="flex items-center gap-2">
                                                                      {[...Array(5)].map((_, i) => (
                                                                             <svg key={i} className={`w-4 h-4 ${i < Math.floor(doctor.rating || 0) ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                                                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                                             </svg>
                                                                      ))}
                                                                      <span className="text-sm font-extrabold text-gray-400 ml-1">({doctor.total_reviews})</span>
                                                               </div>
                                                               <div className="flex items-center justify-between">
                                                                      <p className="text-gray-500 font-medium text-sm flex items-center gap-1.5">
                                                                             <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                                             {doctor.city}
                                                                      </p>
                                                                      <p className="text-gray-900 font-extrabold flex items-baseline gap-1">
                                                                             <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest">Fees</span>
                                                                             ₹{doctor.fees}
                                                                      </p>
                                                               </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 pt-4 border-t border-gray-50 group-hover:border-indigo-100 transition-colors">
                                                               <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full flex-grow text-center">Fastest Appointment</span>
                                                        </div>
                                                 </div>
                                          ))}
                                   </div>
                            </div>
                     )}

                     <div className="flex flex-col md:flex-row gap-8 px-4">
                            {/* Sidebar Filters */}
                            <div className="w-full md:w-80 space-y-6">
                                   <div className="bg-white p-8 rounded-3xl shadow-md border border-gray-100">
                                          <h2 className="text-xl font-extrabold text-gray-900 mb-8 flex items-center gap-3">
                                                 <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                                 </svg>
                                                 Refine Search
                                          </h2>

                                          <div className="space-y-8">
                                                 <div>
                                                        <label className="block text-[10px] font-extrabold text-gray-400 mb-2 uppercase tracking-widest ml-1">Search Name</label>
                                                        <div className="relative">
                                                               <input
                                                                      type="text"
                                                                      name="search"
                                                                      placeholder="Dr. Sharma..."
                                                                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-bold text-gray-900"
                                                                      value={filters.search}
                                                                      onChange={handleFilterChange}
                                                               />
                                                               <svg className="w-5 h-5 text-gray-400 absolute left-4 top-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                               </svg>
                                                        </div>
                                                 </div>

                                                 <div>
                                                        <label className="block text-[10px] font-extrabold text-gray-400 mb-2 uppercase tracking-widest ml-1">Location / City</label>
                                                        <div className="relative">
                                                               <input
                                                                      type="text"
                                                                      name="city"
                                                                      placeholder="Mumbai, Delhi..."
                                                                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-bold text-gray-900"
                                                                      value={filters.city}
                                                                      onChange={handleFilterChange}
                                                               />
                                                               <svg className="w-5 h-5 text-gray-400 absolute left-4 top-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                               </svg>
                                                        </div>
                                                 </div>

                                                 <div>
                                                        <label className="block text-[10px] font-extrabold text-gray-400 mb-2 uppercase tracking-widest ml-1">Specialization</label>
                                                        <select
                                                               name="specialty"
                                                               className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-bold text-gray-900 appearance-none"
                                                               value={filters.specialty}
                                                               onChange={handleFilterChange}
                                                        >
                                                               <option value="">All Fields</option>
                                                               {specialties.map(s => <option key={s} value={s}>{s}</option>)}
                                                        </select>
                                                 </div>

                                                 <div className="space-y-4">
                                                        <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest ml-1">Discovery Filters</label>
                                                        <div className="space-y-3">
                                                               <label className="flex items-center gap-4 cursor-pointer group p-3 rounded-2xl border border-transparent hover:border-blue-100 hover:bg-blue-50/50 transition-all">
                                                                      <input
                                                                             type="checkbox"
                                                                             name="verified"
                                                                             checked={filters.verified}
                                                                             onChange={handleFilterChange}
                                                                             className="w-5 h-5 text-blue-600 border-gray-300 rounded-lg focus:ring-0"
                                                                      />
                                                                      <span className="text-sm font-bold text-gray-600 transition-colors">Verified Specialist</span>
                                                               </label>

                                                               <button
                                                                      type="button"
                                                                      onClick={handleNearbyToggle}
                                                                      className={`flex items-center gap-4 w-full p-4 rounded-2xl border-2 transition-all ${filters.nearby ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100'}`}
                                                               >
                                                                      <svg className={`w-5 h-5 ${filters.nearby ? 'text-indigo-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                      </svg>
                                                                      <span className="text-sm font-bold">Search Nearby Me</span>
                                                               </button>
                                                        </div>
                                                 </div>

                                                 <div>
                                                        <label className="block text-[10px] font-extrabold text-gray-400 mb-4 uppercase tracking-widest ml-1">Price / Session</label>
                                                        <div className="flex items-center gap-3">
                                                               <input
                                                                      type="number"
                                                                      name="min_fee"
                                                                      placeholder="Min"
                                                                      className="w-1/2 px-4 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                                                      value={filters.min_fee}
                                                                      onChange={handleFilterChange}
                                                               />
                                                               <span className="text-gray-300 font-bold">-</span>
                                                               <input
                                                                      type="number"
                                                                      name="max_fee"
                                                                      placeholder="Max"
                                                                      className="w-1/2 px-4 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                                                      value={filters.max_fee}
                                                                      onChange={handleFilterChange}
                                                               />
                                                        </div>
                                                 </div>
                                          </div>

                                          <button
                                                 onClick={() => setFilters({ search: '', specialty: '', min_fee: '', max_fee: '', sort: 'rating', city: '', verified: false, featured: false, nearby: false })}
                                                 className="w-full mt-10 py-4 text-xs font-extrabold uppercase tracking-widest text-indigo-600 border-2 border-indigo-100 rounded-2xl hover:bg-indigo-50 transition-all"
                                          >
                                                 Reset Application
                                          </button>
                                   </div>
                            </div>

                            {/* Main Results Grid */}
                            <div className="flex-1 space-y-8">
                                   <div className="flex items-center justify-between">
                                          <h2 className="text-xl font-extrabold text-gray-900">
                                                 Available Specialists
                                                 <span className="text-indigo-500 ml-2 font-black tabular-nums">{loading ? '...' : doctors.length}</span>
                                          </h2>
                                   </div>

                                   {loading ? (
                                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                                 <SkeletonCard count={6} />
                                          </div>
                                   ) : doctors.length > 0 ? (
                                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                                 {doctors.map(doctor => (
                                                        <div
                                                               key={doctor.id}
                                                               onClick={() => navigate(`/doctors/${doctor.id}`)}
                                                               className={`bg-white rounded-3xl p-6 border-2 shadow-sm hover:shadow-2xl hover:shadow-indigo-50 transition-all duration-500 cursor-pointer transform hover:-translate-y-2 group relative ${doctor.featured_until >= new Date().toISOString().split('T')[0] ? 'border-indigo-100' : 'border-gray-50'}`}
                                                        >
                                                               {doctor.featured_until >= new Date().toISOString().split('T')[0] && (
                                                                      <div className="absolute -top-3 left-6 px-3 py-1 bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg z-10">Featured</div>
                                                               )}

                                                               <div className="flex flex-col h-full">
                                                                      <div className="flex items-center gap-4 mb-6">
                                                                             <div className="relative shrink-0">
                                                                                    <div className="w-16 h-16 bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 group-hover:scale-110 transition-transform duration-500">
                                                                                           {doctor.avatar_url ? (
                                                                                                  <img src={doctor.avatar_url} alt={doctor.name} className="w-full h-full object-cover" />
                                                                                           ) : (
                                                                                                  <div className="w-full h-full flex items-center justify-center font-extrabold text-2xl text-gray-300">
                                                                                                         {doctor.name.charAt(0)}
                                                                                                  </div>
                                                                                           )}
                                                                                    </div>
                                                                                    {doctor.is_verified && (
                                                                                           <div className={`absolute -bottom-1 -right-1 text-white p-0.5 rounded-full border-2 border-white shadow-sm ${
                                                                                               doctor.doctor_subscriptions?.find(s => s.status === 'active')?.plan?.badge_type === 'platinum' ? 'bg-indigo-600' :
                                                                                               doctor.doctor_subscriptions?.find(s => s.status === 'active')?.plan?.badge_type === 'gold' ? 'bg-yellow-500' :
                                                                                               'bg-blue-500'
                                                                                           }`}>
                                                                                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745a3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" /></svg>
                                                                                           </div>
                                                                                    )}
                                                                             </div>
                                                                             <div className="min-w-0">
                                                                                    <h3 className="font-extrabold text-gray-900 group-hover:text-indigo-600 transition-colors truncate">Dr. {doctor.name}</h3>
                                                                                    <p className="text-indigo-500 font-bold text-xs uppercase tracking-tight">{doctor.specialty || 'General Practitioner'}</p>
                                                                             </div>
                                                                      </div>

                                                                      <div className="grid grid-cols-2 gap-4 mb-8 bg-gray-50/50 p-4 rounded-2xl group-hover:bg-indigo-50/50 transition-colors">
                                                                             <div className="space-y-1">
                                                                                    <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block">Experience</span>
                                                                                    <span className="text-sm font-black text-gray-700">{doctor.experience || 0}<span className="text-[10px] ml-0.5">YRS</span></span>
                                                                             </div>
                                                                             <div className="space-y-1">
                                                                                    <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block">Consultation</span>
                                                                                    <span className="text-sm font-black text-gray-900">₹{doctor.fees || 0}</span>
                                                                             </div>
                                                                      </div>

                                                                      <div className="mt-auto flex items-center justify-between pt-4">
                                                                             <div className="flex items-center gap-1.5">
                                                                                    <div className="flex items-center">
                                                                                           {[...Array(5)].map((_, i) => (
                                                                                                  <svg key={i} className={`w-3 h-3 ${i < Math.floor(doctor.rating || 0) ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                                                                                                         <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                                                                  </svg>
                                                                                           ))}
                                                                                    </div>
                                                                                    <span className="text-[10px] font-black text-gray-400">({doctor.total_reviews})</span>
                                                                             </div>
                                                                             <span className="text-indigo-600 font-extrabold text-[10px] uppercase tracking-widest flex items-center gap-1 group-hover:gap-2 transition-all">
                                                                                    Book Spot
                                                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
                                                                             </span>
                                                                      </div>
                                                               </div>
                                                        </div>
                                                 ))}
                                          </div>
                                   ) : (
                                          <div className="bg-white p-24 rounded-[40px] text-center border-4 border-dashed border-gray-100 shadow-sm col-span-full">
                                                 <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 shrink-0">
                                                        <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                 </div>
                                                 <h3 className="text-2xl font-black text-gray-900 tracking-tight">No specialists found</h3>
                                                 <p className="text-gray-400 mt-3 font-medium max-w-sm mx-auto">We couldn't find any doctors matching your current filters. Try resetting to see all available specialists.</p>
                                                 <button
                                                        onClick={() => setFilters({ search: '', specialty: '', min_fee: '', max_fee: '', sort: 'rating', city: '', verified: false, featured: false, nearby: false })}
                                                        className="mt-8 bg-indigo-600 text-white px-10 py-4 rounded-2xl font-extrabold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
                                                 >
                                                        Clear All Parameters
                                                 </button>
                                          </div>
                                   )}
                            </div>
                     </div>
              </div>
       );
};

export default Doctors;
