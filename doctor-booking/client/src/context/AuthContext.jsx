import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
       const [user, setUser] = useState(null);
       const [loading, setLoading] = useState(true);
       const navigate = useNavigate();

       useEffect(() => {
              if (user) {
                     const updateLastSeen = async () => {
                            try {
                                   await supabase.from('users').update({ last_seen: new Date().toISOString() }).eq('id', user.id);
                            } catch (err) {
                                   console.error('Presence update failed:', err);
                            }
                     };
                     updateLastSeen();
                     const interval = setInterval(updateLastSeen, 120000); // 2 minutes
                     return () => clearInterval(interval);
              }
       }, [user]);

       useEffect(() => {
              const initAuth = async () => {
                     const { data: { session } } = await supabase.auth.getSession();
                     if (session) {
                            localStorage.setItem('token', session.access_token);
                            await fetchProfile();
                     } else {
                            setLoading(false);
                     }
              };

              initAuth();

              const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
                     if (session) {
                            localStorage.setItem('token', session.access_token);
                            await fetchProfile();
                     } else {
                            localStorage.removeItem('token');
                            setUser(null);
                            setLoading(false);
                     }
              });

              return () => subscription.unsubscribe();
       }, []);

       const fetchProfile = async () => {
              try {
                     const { data } = await api.get('/auth/me');
                     setUser(data);
              } catch (error) {
                     setUser(null);
              } finally {
                     setLoading(false);
              }
       };

        const register = async (name, email, password, role) => {
               const { data } = await api.post('/auth/register', { name, email, password, role });
               return data;
        };

        const login = async (email, password) => {
              const { data } = await api.post('/auth/login', { email, password });

              if (data.requires2FA) {
                     return data; // Return to handle in Login.jsx
              }

              if (data.session) {
                     await supabase.auth.setSession({
                            access_token: data.session.access_token,
                            refresh_token: data.session.refresh_token
                     });
              }

              if (data.token) localStorage.setItem('token', data.token);
              if (data.sessionToken) localStorage.setItem('sessionToken', data.sessionToken);
              
              await fetchProfile();
              return data;
       };

       const verifyOTPLogin = async (tempToken, otp) => {
              const { data } = await api.post('/auth/verify-otp', { tempToken, otp });

              if (data.session) {
                     await supabase.auth.setSession({
                            access_token: data.session.access_token,
                            refresh_token: data.session.refresh_token
                     });
              }

              if (data.token) localStorage.setItem('token', data.token);
              if (data.sessionToken) localStorage.setItem('sessionToken', data.sessionToken);
              
              await fetchProfile();
              return data;
       };

       const logout = async () => {
              try {
                     await api.post('/auth/logout');
              } catch (err) {
                     console.error('Logout API error:', err);
              }
              localStorage.removeItem('token');
              localStorage.removeItem('sessionToken');
              await supabase.auth.signOut();
              setUser(null);
              navigate('/login');
       };

       return (
              <AuthContext.Provider value={{ user, loading, login, register, logout, verifyOTPLogin }}>
                     {children}
              </AuthContext.Provider>
       );
};

export const useAuth = () => useContext(AuthContext);
