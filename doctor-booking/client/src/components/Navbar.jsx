import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useRealtime } from '../context/RealtimeContext'
import { useState, useRef, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'

const Navbar = () => {
       const { user, logout } = useAuth();
       const { notifications, unreadCount, markAsRead, markAllAsRead } = useRealtime();
       const [showNotifications, setShowNotifications] = useState(false);
       const [showMobileMenu, setShowMobileMenu] = useState(false);
       const [showSecondaryMenu, setShowSecondaryMenu] = useState(false);
       const secondaryMenuRef = useRef(null);
       const dropdownRef = useRef(null);
       const navigate = useNavigate();

       useEffect(() => {
              const handleClickOutside = (event) => {
                     if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                            setShowNotifications(false);
                     }
                     if (secondaryMenuRef.current && !secondaryMenuRef.current.contains(event.target)) {
                            setShowSecondaryMenu(false);
                     }
              };
              document.addEventListener('mousedown', handleClickOutside);
              return () => document.removeEventListener('mousedown', handleClickOutside);
       }, []);

        const handleNotificationClick = async (n) => {
               await markAsRead(n.id);
               setShowNotifications(false);
               
               if (n.type === 'new_message') {
                      navigate(`/messages?convId=${n.related_id}`);
               } else if (n.type === 'slot_available') {
                      navigate('/doctors');
               } else if (n.type === 'appointment_rescheduled') {
                      navigate(user.role === 'doctor' ? '/doctor/dashboard' : '/dashboard');
               } else {
                      navigate(user.role === 'doctor' ? '/doctor/dashboard' : '/dashboard');
               }
        };

       return (
              <nav className="bg-cream/80 backdrop-blur-xl sticky top-0 z-50 border-b border-forest/10 transition-all duration-500">
                     <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="flex justify-between h-20">
                                   <div className="flex items-center space-x-12">
                                          <Link to="/" className="text-3xl font-serif text-forest tracking-tight lowercase">
                                                 Curova
                                          </Link>
                                           <div className="hidden md:flex items-center space-x-8">
                                                  <Link to="/doctors" className="text-forest/70 hover:text-forest font-medium transition-colors text-[10px] uppercase tracking-[0.2em]">Find Doctors</Link>
                                                  {user && (
                                                         <div className="relative" ref={secondaryMenuRef}>
                                                                <button
                                                                       onClick={() => setShowSecondaryMenu(!showSecondaryMenu)}
                                                                       className="flex items-center gap-1 text-forest/70 hover:text-forest font-medium transition-colors text-[10px] uppercase tracking-[0.2em]"
                                                                >
                                                                       {user.role === 'patient' ? 'Care' : 'Practice'}
                                                                       <svg className={`h-3 w-3 transition-transform ${showSecondaryMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                                                </button>
                                                                {showSecondaryMenu && (
                                                                       <div className="absolute left-0 mt-6 w-60 bg-white rounded-3xl shadow-2xl border border-forest/5 overflow-hidden z-50 p-2">
                                                                              <div className="space-y-1">
                                                                                     {user.role === 'patient' ? (
                                                                                            <>
                                                                                                   <Link to="/messages" onClick={() => setShowSecondaryMenu(false)} className="block px-4 py-3 text-xs font-medium text-forest/70 hover:text-forest hover:bg-cream rounded-2xl transition-all uppercase tracking-widest">Messages</Link>
                                                                                                   <Link to="/prescriptions" onClick={() => setShowSecondaryMenu(false)} className="block px-4 py-3 text-xs font-medium text-forest/70 hover:text-forest hover:bg-cream rounded-2xl transition-all uppercase tracking-widest">Prescriptions</Link>
                                                                                                   <Link to="/medical-history" onClick={() => setShowSecondaryMenu(false)} className="block px-4 py-3 text-xs font-medium text-forest/70 hover:text-forest hover:bg-cream rounded-2xl transition-all uppercase tracking-widest">Medical History</Link>
                                                                                                   <Link to="/second-opinion" onClick={() => setShowSecondaryMenu(false)} className="block px-4 py-3 text-xs font-medium text-forest/70 hover:text-forest hover:bg-cream rounded-2xl transition-all uppercase tracking-widest">Second Opinion</Link>
                                                                                                   <Link to="/payments/history" onClick={() => setShowSecondaryMenu(false)} className="block px-4 py-3 text-xs font-medium text-forest/70 hover:text-forest hover:bg-cream rounded-2xl transition-all uppercase tracking-widest">Billing</Link>
                                                                                            </>
                                                                                     ) : (
                                                                                            <>
                                                                                                   <Link to="/messages" onClick={() => setShowSecondaryMenu(false)} className="block px-4 py-3 text-xs font-medium text-forest/70 hover:text-forest hover:bg-cream rounded-2xl transition-all uppercase tracking-widest">Messages</Link>
                                                                                                   <Link to="/doctor/subscription" onClick={() => setShowSecondaryMenu(false)} className="block px-4 py-3 text-xs font-medium text-forest/70 hover:text-forest hover:bg-cream rounded-2xl transition-all uppercase tracking-widest">Subscription</Link>
                                                                                                   <Link to="/doctor/earnings" onClick={() => setShowSecondaryMenu(false)} className="block px-4 py-3 text-xs font-medium text-forest/70 hover:text-forest hover:bg-cream rounded-2xl transition-all uppercase tracking-widest">Earnings</Link>
                                                                                                   <Link to="/doctor/second-opinion-requests" onClick={() => setShowSecondaryMenu(false)} className="block px-4 py-3 text-xs font-medium text-forest/70 hover:text-forest hover:bg-cream rounded-2xl transition-all uppercase tracking-widest">Requests</Link>
                                                                                            </>
                                                                                     )}
                                                                              </div>
                                                                       </div>
                                                                )}
                                                         </div>
                                                  )}
                                           </div>
                                   </div>

                                   <div className="flex items-center space-x-8">
                                          {user ? (
                                                 <>
                                                        <div className="hidden md:flex items-center space-x-8">
                                                               <div className="relative" ref={dropdownRef}>
                                                                      <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 text-forest/30 hover:text-forest transition relative group">
                                                                             <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                                                             </svg>
                                                                             {unreadCount > 0 && (
                                                                                    <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-accent-lime rounded-full shadow-[0_0_8px_rgba(202,239,78,0.8)]"></span>
                                                                             )}
                                                                      </button>
                                                                      {showNotifications && (
                                                                             <div className="absolute right-0 mt-6 w-80 bg-white rounded-3xl shadow-2xl border border-forest/5 overflow-hidden z-50">
                                                                                    <div className="p-5 border-b border-forest/5 bg-cream/30 flex justify-between items-center">
                                                                                           <span className="text-xs font-bold uppercase tracking-widest text-forest">Notifications</span>
                                                                                           {unreadCount > 0 && <button onClick={markAllAsRead} className="text-[10px] text-forest/40 hover:text-forest font-bold uppercase tracking-widest transition">Read All</button>}
                                                                                    </div>
                                                                                    <div className="max-h-96 overflow-y-auto">
                                                                                           {notifications.length > 0 ? (
                                                                                                  notifications.map(n => (
                                                                                                         <div key={n.id} onClick={() => handleNotificationClick(n)} className={`p-5 border-b border-forest/5 hover:bg-cream/20 cursor-pointer transition ${!n.is_read ? 'bg-cream/40' : ''}`}>
                                                                                                                <p className="text-xs font-bold text-forest">{n.title}</p>
                                                                                                                <p className="text-[11px] text-forest/50 mt-1 leading-relaxed">{n.message}</p>
                                                                                                                <p className="text-[9px] text-forest/30 mt-2 uppercase tracking-tight">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</p>
                                                                                                         </div>
                                                                                                  ))
                                                                                           ) : <div className="p-10 text-center text-forest/20 text-[11px] uppercase tracking-widest italic">Silent for now</div>}
                                                                                    </div>
                                                                             </div>
                                                                      )}
                                                               </div>
                                                               <Link to={user.role === 'admin' ? '/admin/dashboard' : user.role === 'doctor' ? '/doctor/dashboard' : '/dashboard'} className="text-[10px] font-bold uppercase tracking-[0.2em] text-forest/60 hover:text-forest transition-colors">
                                                                      Portal
                                                               </Link>
                                                               <button onClick={logout} className="btn-secondary">
                                                                      Sign Out
                                                               </button>
                                                        </div>
                                                        <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="md:hidden p-2 text-forest/60">
                                                               <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d={showMobileMenu ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                                                               </svg>
                                                        </button>
                                                 </>
                                          ) : (
                                                 <div className="flex items-center space-x-6">
                                                        <Link to="/login" className="text-[10px] font-bold uppercase tracking-[0.2em] text-forest/60 hover:text-forest transition-colors">Access</Link>
                                                        <Link to="/register" className="btn-primary">Begin</Link>
                                                 </div>
                                          )}
                                   </div>
                            </div>
                     </div>

                     {/* Mobile Menu */}
                     {showMobileMenu && (
                            <div className="md:hidden fixed inset-0 top-20 bg-cream z-40 p-8 space-y-12 animate-in fade-in slide-in-from-top-4 duration-300">
                                   <div className="space-y-8">
                                          <Link to="/doctors" onClick={() => setShowMobileMenu(false)} className="block text-4xl text-forest font-serif italic lowercase opacity-80">Find Doctors</Link>
                                          {user && (
                                                 <>
                                                        <Link to="/messages" onClick={() => setShowMobileMenu(false)} className="block text-xl text-forest font-serif lowercase opacity-60">Messages</Link>
                                                        <Link to="/payments/history" onClick={() => setShowMobileMenu(false)} className="block text-xl text-forest font-serif lowercase opacity-60">Billing</Link>
                                                        <Link to={user.role === 'admin' ? '/admin/dashboard' : user.role === 'doctor' ? '/doctor/dashboard' : '/dashboard'} onClick={() => setShowMobileMenu(false)} className="block text-xl text-forest font-serif lowercase opacity-60">Your Portal</Link>
                                                 </>
                                          )}
                                   </div>
                                   {user ? (
                                          <button onClick={logout} className="w-full btn-secondary py-5 text-[10px] uppercase tracking-[0.3em] font-bold">Sign Out</button>
                                   ) : (
                                          <div className="space-y-4">
                                                 <Link to="/login" onClick={() => setShowMobileMenu(false)} className="block w-full text-center py-5 text-[10px] uppercase tracking-[0.3em] font-bold text-forest border border-forest/10 rounded-3xl">Access</Link>
                                                 <Link to="/register" onClick={() => setShowMobileMenu(false)} className="block w-full text-center py-5 text-[10px] uppercase tracking-[0.3em] font-bold bg-forest text-cream rounded-3xl">Begin</Link>
                                          </div>
                                   )}
                            </div>
                     )}
              </nav>
       );
};

export default Navbar;
