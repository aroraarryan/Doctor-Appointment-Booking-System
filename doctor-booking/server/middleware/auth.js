const supabase = require('../config/supabase');

const { updateSessionActivity } = require('../utils/sessionService');

const verifyToken = async (req, res, next) => {
       const authHeader = req.headers.authorization;
       const sessionHeader = req.headers['x-session-token'];

       if (!authHeader || !authHeader.startsWith('Bearer ')) {
              return res.status(401).json({ error: 'No token provided' });
       }

       const token = authHeader.split(' ')[1];

       try {
              // 1. Verify standard Supabase JWT
              const { data: { user }, error } = await supabase.auth.getUser(token);

              if (error || !user) {
                     console.error('JWT Verification Error:', error);
                     res.setHeader('x-auth-failure', 'invalid_jwt');
                     return res.status(401).json({ error: 'Invalid or expired token' });
              }

              // 2. Check session if session management is enabled
              if (sessionHeader) {
                     const { data: session, error: sessionError } = await supabase
                            .from('user_sessions')
                            .select('*')
                            .eq('session_token', sessionHeader)
                            .eq('user_id', user.id)
                            .eq('is_active', true)
                            .single();

                     if (sessionError || !session) {
                            console.error('Session Verification Error:', sessionError);
                            res.setHeader('x-auth-failure', 'session_revoked');
                            return res.status(401).json({ error: 'Session revoked or invalid' });
                     }

                     // Update activity asynchronously
                     updateSessionActivity(sessionHeader);
                     req.sessionId = session.id;
                     req.sessionToken = sessionHeader;
              }

              req.user = user;
              next();
       } catch (error) {
              console.error('Auth Middleware Error:', error);
              res.status(500).json({ error: 'Internal Server Error' });
       }
};

const requireRole = (role) => {
       return async (req, res, next) => {
              if (!req.user) {
                     return res.status(401).json({ error: 'Unauthorized' });
              }

              try {
                     const { data: profile, error } = await supabase
                            .from('profiles')
                            .select('role')
                            .eq('id', req.user.id)
                            .single();

                     if (error || !profile || profile.role !== role) {
                            return res.status(403).json({ error: `Forbidden: Requires ${role} role` });
                     }

                     next();
              } catch (error) {
                     console.error('Role Middleware Error:', error);
                     res.status(500).json({ error: 'Internal Server Error' });
              }
       };
};

const isPatient = requireRole('patient');
const isDoctor = requireRole('doctor');

module.exports = { verifyToken, requireRole, isPatient, isDoctor };
