import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import PatientDashboard from './pages/PatientDashboard'
import DoctorDashboard from './pages/DoctorDashboard'
import AdminDashboard from './pages/AdminDashboard'
import Messages from './pages/Messages'
import Unauthorized from './pages/Unauthorized'
import Doctors from './pages/Doctors'
import DoctorProfile from './pages/DoctorProfile'
import PaymentHistory from './pages/PaymentHistory'
import PrivateRoute from './components/PrivateRoute'
import RoleRoute from './components/RoleRoute'
import { AuthProvider } from './context/AuthContext'
import { RealtimeProvider } from './context/RealtimeContext'
import { Toaster } from 'react-hot-toast'
import SecuritySettings from './pages/SecuritySettings'
import MyWaitlist from './pages/MyWaitlist'
import Prescriptions from './pages/Prescriptions';
import MedicalHistory from './pages/MedicalHistory';
import SecondOpinion from './pages/SecondOpinion';
import SecondOpinionRequests from './pages/SecondOpinionRequests';
import HealthDashboard from './pages/HealthDashboard';
import Announcements from './pages/Announcements';
import PatientAnalytics from './pages/PatientAnalytics';
import DoctorAnalytics from './pages/DoctorAnalytics';
import DoctorSubscription from './pages/DoctorSubscription';
import EarningsDashboard from './pages/EarningsDashboard';
import Invoices from './pages/Invoices';
import NotFound from './pages/NotFound';
import AnnouncementBanner from './components/AnnouncementBanner';
import Footer from './components/Footer';

function App() {
       return (
              <AuthProvider>
                     <Toaster position="top-right" />
                     <RealtimeProvider>
                            <div className="min-h-screen bg-cream selection:bg-forest/10 selection:text-forest">
                                   <Navbar />
                                   <AnnouncementBanner />
                                   <div className="w-full">
                                          <Routes>
                                                 <Route path="/" element={<Home />} />
                                                 <Route path="/login" element={<Login />} />
                                                 <Route path="/register" element={<Register />} />
                                                 <Route path="/doctors" element={<Doctors />} />
                                                 <Route path="/doctors/:id" element={<DoctorProfile />} />
                                                 <Route path="/unauthorized" element={<Unauthorized />} />

                                                 {/* Protected Routes */}
                                                 <Route path="/dashboard" element={
                                                        <PrivateRoute>
                                                               <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                                                                      <RoleRoute allowedRoles={['patient']}><PatientDashboard /></RoleRoute>
                                                               </div>
                                                        </PrivateRoute>
                                                 } />
                                                 <Route path="/doctor/dashboard" element={
                                                        <PrivateRoute>
                                                               <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                                                                      <RoleRoute allowedRoles={['doctor']}><DoctorDashboard /></RoleRoute>
                                                               </div>
                                                        </PrivateRoute>
                                                 } />
                                                 <Route path="/admin/dashboard" element={
                                                        <PrivateRoute>
                                                               <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                                                                      <RoleRoute allowedRoles={['admin']}><AdminDashboard /></RoleRoute>
                                                               </div>
                                                        </PrivateRoute>
                                                 } />
                                                 <Route path="/messages" element={
                                                        <PrivateRoute>
                                                               <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                                                                      <Messages />
                                                               </div>
                                                        </PrivateRoute>
                                                 } />
                                                 <Route path="/payments/history" element={
                                                        <PrivateRoute>
                                                               <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                                                                      <PaymentHistory />
                                                               </div>
                                                        </PrivateRoute>
                                                 } />
                                                 <Route path="/security" element={
                                                        <PrivateRoute>
                                                               <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                                                                      <SecuritySettings />
                                                               </div>
                                                        </PrivateRoute>
                                                 } />
                                                  <Route path="/health" element={
                                                         <PrivateRoute>
                                                                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                                                                       <RoleRoute allowedRoles={['patient']}><HealthDashboard /></RoleRoute>
                                                                </div>
                                                         </PrivateRoute>
                                                  } />
                                                  <Route path="/waitlist" element={
                                                         <PrivateRoute>
                                                                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                                                                       <RoleRoute allowedRoles={['patient']}><MyWaitlist /></RoleRoute>
                                                                </div>
                                                         </PrivateRoute>
                                                  } />
                                                  <Route path="/prescriptions" element={
                                                         <PrivateRoute>
                                                                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                                                                       <RoleRoute allowedRoles={['patient']}><Prescriptions /></RoleRoute>
                                                                </div>
                                                         </PrivateRoute>
                                                  } />
                                                  <Route path="/medical-history" element={
                                                         <PrivateRoute>
                                                                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                                                                       <RoleRoute allowedRoles={['patient']}><MedicalHistory /></RoleRoute>
                                                                </div>
                                                         </PrivateRoute>
                                                  } />
                                                  <Route path="/second-opinion" element={
                                                         <PrivateRoute>
                                                                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                                                                       <RoleRoute allowedRoles={['patient']}><SecondOpinion /></RoleRoute>
                                                                </div>
                                                         </PrivateRoute>
                                                  } />
                                                  <Route path="/doctor/second-opinion-requests" element={
                                                         <PrivateRoute>
                                                                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                                                                       <RoleRoute allowedRoles={['doctor']}><SecondOpinionRequests /></RoleRoute>
                                                                </div>
                                                         </PrivateRoute>
                                                  } />
                                                  <Route path="/announcements" element={
                                                         <PrivateRoute>
                                                                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                                                                       <Announcements />
                                                                </div>
                                                         </PrivateRoute>
                                                  } />
                                                  <Route path="/analytics" element={
                                                         <PrivateRoute>
                                                                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                                                                       <RoleRoute allowedRoles={['patient']}><PatientAnalytics /></RoleRoute>
                                                                </div>
                                                         </PrivateRoute>
                                                  } />
                                                  <Route path="/doctor/analytics" element={
                                                         <PrivateRoute>
                                                                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                                                                       <RoleRoute allowedRoles={['doctor']}><DoctorAnalytics /></RoleRoute>
                                                                </div>
                                                         </PrivateRoute>
                                                  } />
                                                  <Route path="/doctor/subscription" element={
                                                         <PrivateRoute>
                                                                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                                                                       <RoleRoute allowedRoles={['doctor']}><DoctorSubscription /></RoleRoute>
                                                                </div>
                                                         </PrivateRoute>
                                                  } />
                                                  <Route path="/doctor/earnings" element={
                                                         <PrivateRoute>
                                                                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                                                                       <RoleRoute allowedRoles={['doctor']}><EarningsDashboard /></RoleRoute>
                                                                </div>
                                                         </PrivateRoute>
                                                  } />
                                                  <Route path="/invoices" element={
                                                         <PrivateRoute>
                                                                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                                                                       <Invoices />
                                                                </div>
                                                         </PrivateRoute>
                                                  } />
                                                 <Route path="*" element={<NotFound />} />
                                          </Routes>
                                   </div>
                                   <Footer />
                            </div>
                     </RealtimeProvider>
              </AuthProvider>
       )
}

export default App
