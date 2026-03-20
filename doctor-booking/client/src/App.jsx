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

function App() {
       return (
              <AuthProvider>
                     <Toaster position="top-right" />
                     <RealtimeProvider>
                            <div className="min-h-screen bg-gray-50">
                                   <Navbar />
                                   <AnnouncementBanner />
                                   <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                                                                <RoleRoute allowedRoles={['patient']}><PatientDashboard /></RoleRoute>
                                                        </PrivateRoute>
                                                 } />
                                                 <Route path="/doctor/dashboard" element={
                                                        <PrivateRoute>
                                                                <RoleRoute allowedRoles={['doctor']}><DoctorDashboard /></RoleRoute>
                                                        </PrivateRoute>
                                                 } />
                                                 <Route path="/admin/dashboard" element={
                                                        <PrivateRoute>
                                                                <RoleRoute allowedRoles={['admin']}><AdminDashboard /></RoleRoute>
                                                        </PrivateRoute>
                                                 } />
                                                 <Route path="/messages" element={
                                                        <PrivateRoute>
                                                               <Messages />
                                                        </PrivateRoute>
                                                 } />
                                                 <Route path="/payments/history" element={
                                                        <PrivateRoute>
                                                               <PaymentHistory />
                                                        </PrivateRoute>
                                                 } />
                                                 <Route path="/security" element={
                                                        <PrivateRoute>
                                                               <SecuritySettings />
                                                        </PrivateRoute>
                                                 } />
                                                  <Route path="/health" element={
                                                         <PrivateRoute>
                                                                <RoleRoute allowedRoles={['patient']}><HealthDashboard /></RoleRoute>
                                                         </PrivateRoute>
                                                  } />
                                                  <Route path="/waitlist" element={
                                                         <PrivateRoute>
                                                                <RoleRoute allowedRoles={['patient']}><MyWaitlist /></RoleRoute>
                                                         </PrivateRoute>
                                                  } />
                                                  <Route path="/prescriptions" element={
                                                         <PrivateRoute>
                                                                <RoleRoute allowedRoles={['patient']}><Prescriptions /></RoleRoute>
                                                         </PrivateRoute>
                                                  } />
                                                  <Route path="/medical-history" element={
                                                         <PrivateRoute>
                                                                <RoleRoute allowedRoles={['patient']}><MedicalHistory /></RoleRoute>
                                                         </PrivateRoute>
                                                  } />
                                                  <Route path="/second-opinion" element={
                                                         <PrivateRoute>
                                                                <RoleRoute allowedRoles={['patient']}><SecondOpinion /></RoleRoute>
                                                         </PrivateRoute>
                                                  } />
                                                  <Route path="/doctor/second-opinion-requests" element={
                                                         <PrivateRoute>
                                                                <RoleRoute allowedRoles={['doctor']}><SecondOpinionRequests /></RoleRoute>
                                                         </PrivateRoute>
                                                  } />
                                                  <Route path="/announcements" element={
                                                         <PrivateRoute>
                                                                <Announcements />
                                                         </PrivateRoute>
                                                  } />
                                                  <Route path="/analytics" element={
                                                         <PrivateRoute>
                                                                <RoleRoute allowedRoles={['patient']}><PatientAnalytics /></RoleRoute>
                                                         </PrivateRoute>
                                                  } />
                                                  <Route path="/doctor/analytics" element={
                                                         <PrivateRoute>
                                                                <RoleRoute allowedRoles={['doctor']}><DoctorAnalytics /></RoleRoute>
                                                         </PrivateRoute>
                                                  } />
                                                  <Route path="/doctor/subscription" element={
                                                         <PrivateRoute>
                                                                <RoleRoute allowedRoles={['doctor']}><DoctorSubscription /></RoleRoute>
                                                         </PrivateRoute>
                                                  } />
                                                  <Route path="/doctor/earnings" element={
                                                         <PrivateRoute>
                                                                <RoleRoute allowedRoles={['doctor']}><EarningsDashboard /></RoleRoute>
                                                         </PrivateRoute>
                                                  } />
                                                  <Route path="/invoices" element={
                                                         <PrivateRoute>
                                                                <Invoices />
                                                         </PrivateRoute>
                                                  } />
                                                 <Route path="*" element={<NotFound />} />
                                          </Routes>
                                   </div>
                            </div>
                     </RealtimeProvider>
              </AuthProvider>
       )
}

export default App
