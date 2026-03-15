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
       const dropdownRef = useRef(null);
       const navigate = useNavigate();

       useEffect(() => {
              const handleClickOutside = (event) => {
                     if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                            setShowNotifications(false);
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
                      // Redirect to the doctor's profile to book the slot
                      // Assuming related_id or some context points to the doctor
                      navigate('/doctors');
               } else if (n.type === 'appointment_rescheduled') {
                      navigate(user.role === 'doctor' ? '/doctor/dashboard' : '/dashboard');
               } else {
                      navigate(user.role === 'doctor' ? '/doctor/dashboard' : '/dashboard');
               }
        };

       return (
              <nav className="bg-white shadow-sm sticky top-0 z-50">
                     <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="flex justify-between h-16">
                                   <div className="flex items-center space-x-8">
                                          <Link to="/" className="text-2xl font-black text-indigo-600 tracking-tighter">
                                                 DocBook
                                          </Link>
                                          <div className="hidden md:flex items-center space-x-6">
                                                 <Link to="/doctors" className="text-gray-600 hover:text-indigo-600 font-semibold transition">Find Doctors</Link>
                                                 {user && (
                                                        <>
                                                               <Link to="/messages" className="text-gray-600 hover:text-indigo-600 font-semibold transition">Messages</Link>
                                                               <Link to="/payments/history" className="text-gray-600 hover:text-indigo-600 font-semibold transition">Payments</Link>
                                                        </>
                                                 )}
                                          </div>
                                   </div>

                                   <div className="flex items-center space-x-4">
                                          {user ? (
                                                 <>
                                                        <div className="hidden md:flex items-center space-x-4">
                                                               {/* Notification Bell */}
                                                               <div className="relative" ref={dropdownRef}>
                                                                      <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 text-gray-400 hover:text-indigo-600 transition relative">
                                                                             <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                                                             </svg>
                                                                             {unreadCount > 0 && (
                                                                                    <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                                                                           {unreadCount}
                                                                                    </span>
                                                                             )}
                                                                      </button>
                                                                      {showNotifications && (
                                                                             <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden ring-1 ring-black ring-opacity-5">
                                                                                    <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                                                                                           <span className="font-bold text-gray-900">Notifications</span>
                                                                                           {unreadCount > 0 && <button onClick={markAllAsRead} className="text-xs text-indigo-600 font-bold">Mark all as read</button>}
                                                                                    </div>
                                                                                    <div className="max-h-96 overflow-y-auto">
                                                                                           {notifications.length > 0 ? (
                                                                                                  notifications.map(n => (
                                                                                                         <div key={n.id} onClick={() => handleNotificationClick(n)} className={`p-4 border-b hover:bg-gray-50 cursor-pointer transition ${!n.is_read ? 'bg-indigo-50/50' : ''}`}>
                                                                                                                <p className="text-sm font-bold text-gray-900">{n.title}</p>
                                                                                                                <p className="text-xs text-gray-500 mt-1">{n.message}</p>
                                                                                                         </div>
                                                                                                  ))
                                                                                           ) : <div className="p-8 text-center text-gray-400 text-sm">No new notifications</div>}
                                                                                    </div>
                                                                             </div>
                                                                      )}
                                                               </div>
                                                               <Link to={user.role === 'admin' ? '/admin/dashboard' : user.role === 'doctor' ? '/doctor/dashboard' : '/dashboard'} className="text-sm font-bold text-gray-700 hover:text-indigo-600 transition">
                                                                      Dashboard
                                                               </Link>
                                                               <button onClick={logout} className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-100">
                                                                      Logout
                                                               </button>
                                                        </div>
                                                        <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="md:hidden p-2 text-gray-500">
                                                               <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={showMobileMenu ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                                                               </svg>
                                                        </button>
                                                 </>
                                          ) : (
                                                 <div className="flex items-center space-x-3">
                                                        <Link to="/login" className="text-sm font-bold text-gray-700 hover:text-indigo-600 px-3 transition">Login</Link>
                                                        <Link to="/register" className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-100">Register</Link>
                                                 </div>
                                          )}
                                   </div>
                            </div>
                     </div>

                     {/* Mobile Menu */}
                     {showMobileMenu && (
                            <div className="md:hidden bg-white border-t border-gray-100 py-4 px-4 space-y-4 shadow-xl animate-in slide-in-from-top-4 duration-200">
                                   <Link to="/doctors" onClick={() => setShowMobileMenu(false)} className="block text-gray-600 font-bold py-2">Find Doctors</Link>
                                   {user && (
                                          <>
                                                 <Link to="/messages" onClick={() => setShowMobileMenu(false)} className="block text-gray-600 font-bold py-2">Messages</Link>
                                                 <Link to="/payments/history" onClick={() => setShowMobileMenu(false)} className="block text-gray-600 font-bold py-2">Payments</Link>
                                                 <Link to={user.role === 'admin' ? '/admin/dashboard' : user.role === 'doctor' ? '/doctor/dashboard' : '/dashboard'} onClick={() => setShowMobileMenu(false)} className="block text-gray-600 font-bold py-2">Dashboard</Link>
                                                 <button onClick={logout} className="w-full text-left text-red-600 font-bold py-2">Logout</button>
                                          </>
                                   )}
                            </div>
                     )}
              </nav>
       );
};

export default Navbar;
