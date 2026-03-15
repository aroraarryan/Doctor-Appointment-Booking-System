const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');
const { sendOTPEmail } = require('../utils/emailService');
const { createOTP, verifyOTP } = require('../utils/otpService');
const { createSession } = require('../utils/sessionService');

const register = async (req, res) => {
       const { name, email, password, role } = req.body;

       if (!name || !email || !password || !role) {
              return res.status(400).json({ error: 'All fields are required' });
       }

       try {
              const { data, error } = await supabase.auth.admin.createUser({
                     email,
                     password,
                     email_confirm: true,
                     user_metadata: { name, role }
              });

              if (error) throw error;

              const user = data.user;

              if (role === 'doctor') {
                     const { error: doctorError } = await supabase
                            .from('doctors')
                            .insert([{ id: user.id, is_approved: false }]);

                     if (doctorError) throw doctorError;
              }

              res.status(201).json({ message: 'User registered successfully', user });
       } catch (error) {
              console.error('Register Error:', error);
              res.status(400).json({ error: error.message });
       }
};

const login = async (req, res) => {
       const { email, password } = req.body;

       if (!email || !password) {
              return res.status(400).json({ error: 'Email and password are required' });
       }

       try {
              // 1. Verify credentials with Supabase
              const { data, error } = await supabase.auth.signInWithPassword({
                     email,
                     password
              });

              if (error) throw error;

              const user = data.user;

              // 2. Check 2FA status in profile
              const { data: profile } = await supabase
                     .from('profiles')
                     .select('two_fa_enabled, name')
                     .eq('id', user.id)
                     .single();

              if (profile?.two_fa_enabled) {
                     // 2FA Enabled Flow
                     const otp = await createOTP(user.id, email, 'login');
                     await sendOTPEmail(email, otp, profile.name);

                     // Create short-lived temp token, including Supabase session
                     const tempToken = jwt.sign(
                            { 
                                   userId: user.id, 
                                   purpose: '2fa_login',
                                   supabaseSession: data.session 
                            },
                            process.env.JWT_SECRET || 'secret',
                            { expiresIn: '15m' }
                     );

                     return res.status(200).json({
                            requires2FA: true,
                            tempToken,
                            message: 'OTP sent to your email'
                     });
              }

              // 2FA Disabled Flow - Create session and return full data
              const sessionRecord = await createSession(user.id, req);

              res.status(200).json({
                     user: data.user,
                     session: data.session,
                     token: data.session.access_token,
                     sessionToken: sessionRecord.session_token
              });
       } catch (error) {
              console.error('Login Error:', error);
              res.status(401).json({ error: error.message });
       }
};

const verifyOTPLogin = async (req, res) => {
       const { tempToken, otp } = req.body;

       if (!tempToken || !otp) {
              return res.status(400).json({ error: 'Token and OTP are required' });
       }

       try {
              // 1. Verify temp token
              const decoded = jwt.verify(tempToken, process.env.JWT_SECRET || 'secret');
              if (decoded.purpose !== '2fa_login') throw new Error('Invalid token purpose');

              const userId = decoded.userId;

              // 2. Verify OTP
              const result = await verifyOTP(userId, otp, 'login');

              if (!result.valid) {
                     if (result.maxAttempts) {
                            return res.status(429).json({ error: result.message });
                     }
                     return res.status(401).json({
                            error: result.message,
                            attemptsRemaining: result.attemptsRemaining
                     });
              }

              // 3. OTP Valid - Complete Login
              const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
              if (userError) throw userError;

              const sessionRecord = await createSession(userId, req);

              res.status(200).json({
                     user: userData.user,
                     session: decoded.supabaseSession,
                     token: decoded.supabaseSession?.access_token || 'use-session-token-for-auth',
                     sessionToken: sessionRecord.session_token
              });

       } catch (error) {
              console.error('Verify OTP Error:', error);
              res.status(401).json({ error: 'Invalid or expired temporary token' });
       }
};

const resendOTP = async (req, res) => {
       const { tempToken } = req.body;

       try {
              const decoded = jwt.verify(tempToken, process.env.JWT_SECRET || 'secret');
              const userId = decoded.userId;

              const { data: profile } = await supabase
                     .from('profiles')
                     .select('email, name')
                     .eq('id', userId)
                     .single();

              const otp = await createOTP(userId, profile.email, 'login');
              await sendOTPEmail(profile.email, otp, profile.name);

              res.status(200).json({ message: 'OTP resent successfully' });
       } catch (error) {
              res.status(401).json({ error: 'Invalid or expired temporary token' });
       }
};

const getMe = async (req, res) => {
       try {
              let query = supabase
                     .from('profiles')
                     .select('*')
                     .eq('id', req.user.id)
                     .single();

              const { data: profile, error } = await query;

              if (error) throw error;

              let fullProfile = { ...profile };

              if (profile.role === 'doctor') {
                     const { data: doctorData, error: doctorError } = await supabase
                            .from('doctors')
                            .select('*')
                            .eq('id', req.user.id)
                            .single();

                     if (!doctorError) {
                            fullProfile.doctorDetails = doctorData;
                     }
              }

              res.status(200).json(fullProfile);
       } catch (error) {
              res.status(400).json({ error: error.message });
       }
};

const logout = async (req, res) => {
       try {
              if (req.sessionToken) {
                     await supabase
                            .from('user_sessions')
                            .update({ is_active: false })
                            .eq('session_token', req.sessionToken);
              }
              
              const { error } = await supabase.auth.signOut();
              if (error) throw error;
              res.status(200).json({ message: 'Logged out successfully' });
       } catch (error) {
              console.error('Logout Error:', error);
              res.status(400).json({ error: error.message });
       }
};

module.exports = { register, login, getMe, logout, verifyOTPLogin, resendOTP };
